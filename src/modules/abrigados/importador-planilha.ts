import ExcelJS from 'exceljs';
import { RegistroAbrigadoRondon, AbrigadoClassificado, AbrigoAtivo } from '../../types/shelter';
import { ClassificadorAbrigadosRondon } from './classificador-grupos';
import { GerenciadorRelatorioDiarioAbrigos } from './relatorio-diario-tatico';
import { MotorDesconflitoCadastros } from './motor-desconflito';

export interface ResultadoImportacaoPlanilha {
  sucesso: boolean;
  abrigoIdentificado: string;
  totalLinhasLidas: number;
  totalAbrigadosValidos: number;
  totalNovosInseridos: number;
  totalAtualizados: number;
  totalDesconflitados: number;
  distribuicaoGrupos: Record<string, number>;
  estatisticasGerais: {
    totalGestantes: number;
    totalPCD: number;
    permanenciaMediaDias: number;
    casosCriticosMaisDe1Ano: number;
    familiasMonoparentais: number;
  };
  amostraClassificados: AbrigadoClassificado[];
  avisos: string[];
}

export class ImportadorPlanilhaAbrigados {
  /**
   * Converte data serial do Excel (ex: 44890) ou texto (2022-11-25 ou 25/11/2022) para formato ISO YYYY-MM-DD
   */
  static formatarDataEntrada(valor: unknown): string {
    if (!valor) return new Date().toISOString().split('T')[0];

    if (typeof valor === 'number') {
      // Excel epoch: 1899-12-30
      const ms = Math.round((valor - 25569) * 86400 * 1000);
      const data = new Date(ms);
      if (!isNaN(data.getTime())) {
        return data.toISOString().split('T')[0];
      }
    }

    const str = String(valor).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    // Formato brasileiro DD/MM/YYYY
    const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (brMatch) {
      const dia = brMatch[1].padStart(2, '0');
      const mes = brMatch[2].padStart(2, '0');
      const ano = brMatch[3];
      return `${ano}-${mes}-${dia}`;
    }

    return str;
  }

  /**
   * Converte booleano ou 0/1/Sim/Não
   */
  static converterBooleano(valor: unknown): boolean {
    if (valor === true || valor === 1 || valor === '1') return true;
    if (typeof valor === 'string') {
      const v = valor.trim().toLowerCase();
      return v === 'sim' || v === 'yes' || v === 'true' || v === '1' || v === 's';
    }
    return false;
  }

  /**
   * Detecta o nome do abrigo oficial pelo cabeçalho, texto ou nome da planilha
   */
  static detectarAbrigo(textoOuNome: string, fallback?: string): string {
    const txt = textoOuNome.toLowerCase();
    if (txt.includes('rondon 5')) return 'Rondon 5';
    if (txt.includes('anexo rondon 1') || txt.includes('anexo')) return 'Anexo Rondon 1';
    if (txt.includes('rondon 1')) return 'Rondon 1';
    if (txt.includes('tuaranoko')) return 'Tuaranoko';
    if (txt.includes('bv-8') || txt.includes('bv8') || txt.includes('pacaraima')) return 'BV-8';
    return fallback || 'Rondon 1';
  }

  /**
   * Processa buffer de arquivo Excel (.xlsx, .xls) de forma segura com ExcelJS
   */
  static async processarArquivoExcel(
    buffer: Buffer,
    abrigoManual?: string,
    substituirBaseAbrigo: boolean = false
  ): Promise<ResultadoImportacaoPlanilha> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    let abrigoDetectado = abrigoManual || '';

    // Procura título ou resumo para identificar o abrigo se não foi passado manualmente
    if (!abrigoDetectado) {
      const sheetResumo = workbook.getWorksheet('Resumo');
      if (sheetResumo) {
        const firstVal = sheetResumo.getRow(1).getCell(1).value;
        if (firstVal) {
          abrigoDetectado = this.detectarAbrigo(String(firstVal));
        }
      }
      if (!abrigoDetectado) {
        for (const ws of workbook.worksheets) {
          const nomeD = this.detectarAbrigo(ws.name);
          if (nomeD) {
            abrigoDetectado = nomeD;
            break;
          }
        }
      }
    }
    if (!abrigoDetectado) abrigoDetectado = 'Rondon 1';

    // Procura a aba com os dados dos migrantes
    let sheetAlvo = workbook.getWorksheet('Migrantes');
    if (!sheetAlvo) {
      for (const ws of workbook.worksheets) {
        let hasKeywords = false;
        ws.getRow(1).eachCell((cell) => {
          const v = String(cell.value || '').toLowerCase();
          if (v.includes('emg') || v.includes('nome')) hasKeywords = true;
        });
        if (hasKeywords) {
          sheetAlvo = ws;
          break;
        }
      }
    }

    if (!sheetAlvo && workbook.worksheets.length > 0) {
      sheetAlvo = workbook.worksheets[0];
    }

    const registrosBrutos: Record<string, unknown>[] = [];
    if (sheetAlvo) {
      const headers: { [col: number]: string } = {};
      sheetAlvo.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim();
      });

      sheetAlvo.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData: Record<string, unknown> = {};
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            let val = cell.value;
            if (val && typeof val === 'object') {
              if ('result' in val) val = (val as any).result;
              else if ('text' in val) val = (val as any).text;
            }
            rowData[header] = val;
          }
        });
        if (Object.keys(rowData).length > 0) {
          registrosBrutos.push(rowData);
        }
      });
    }

    return this.normalizarEIntegrar(registrosBrutos, abrigoDetectado, substituirBaseAbrigo);
  }

  /**
   * Processa texto bruto em CSV ou TSV
   */
  static processarTextoCsv(
    conteudoCsv: string,
    abrigoManual?: string,
    substituirBaseAbrigo: boolean = false
  ): ResultadoImportacaoPlanilha {
    const linhas = conteudoCsv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let abrigoDetectado = abrigoManual || '';

    // Procura título ou resumo nas primeiras 10 linhas
    for (let i = 0; i < Math.min(10, linhas.length); i++) {
      if (!abrigoDetectado) {
        const det = this.detectarAbrigo(linhas[i]);
        if (det && det !== 'Rondon 1') {
          abrigoDetectado = det;
        } else if (linhas[i].toLowerCase().includes('rondon 1')) {
          abrigoDetectado = 'Rondon 1';
        }
      }
    }
    if (!abrigoDetectado) abrigoDetectado = 'Rondon 1';

    // Localiza a linha de cabeçalho da tabela de dados
    let indiceCabecalho = -1;
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i].toLowerCase();
      if ((l.includes('emg') || l.includes('cpf')) && l.includes('nome')) {
        indiceCabecalho = i;
        break;
      }
    }

    if (indiceCabecalho === -1) {
      throw new Error('Não foi possível localizar o cabeçalho de colunas da planilha (necessita de EMG/CPF e Nome).');
    }

    const cabecalhoLinha = linhas[indiceCabecalho];
    const delimitador = cabecalhoLinha.includes(';') ? ';' : cabecalhoLinha.includes('\t') ? '\t' : ',';

    const colunas = this.quebrarLinhaCsv(cabecalhoLinha, delimitador);
    const registrosBrutos: Record<string, unknown>[] = [];

    for (let i = indiceCabecalho + 1; i < linhas.length; i++) {
      const valores = this.quebrarLinhaCsv(linhas[i], delimitador);
      if (valores.length < 3) continue;

      const obj: Record<string, unknown> = {};
      colunas.forEach((col, idx) => {
        obj[col] = valores[idx] !== undefined ? valores[idx] : '';
      });
      registrosBrutos.push(obj);
    }

    return this.normalizarEIntegrar(registrosBrutos, abrigoDetectado, substituirBaseAbrigo);
  }

  /**
   * Faz o parser de linha CSV respeitando aspas duplas
   */
  private static quebrarLinhaCsv(linha: string, delimitador: string): string[] {
    const resultado: string[] = [];
    let atual = '';
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];
      if (char === '"') {
        if (dentroAspas && linha[i + 1] === '"') {
          atual += '"';
          i++;
        } else {
          dentroAspas = !dentroAspas;
        }
      } else if (char === delimitador && !dentroAspas) {
        resultado.push(atual.trim());
        atual = '';
      } else {
        atual += char;
      }
    }
    resultado.push(atual.trim());
    return resultado;
  }

  /**
   * Normaliza os registros brutos da planilha para a estrutura RegistroAbrigadoRondon
   * e integra ao banco em memória do SUFAI
   */
  private static normalizarEIntegrar(
    registrosBrutos: Record<string, unknown>[],
    abrigo: string,
    substituirBaseAbrigo: boolean
  ): ResultadoImportacaoPlanilha {
    const avisos: string[] = [];
    const registrosNormalizados: RegistroAbrigadoRondon[] = [];
    let totalDesconflitados = 0;

    const buscarCampo = (obj: Record<string, unknown>, termos: string[]): unknown => {
      const keys = Object.keys(obj);
      for (const t of termos) {
        const k = keys.find((key) => key.toLowerCase().trim() === t.toLowerCase().trim());
        if (k && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
          return obj[k];
        }
      }
      return undefined;
    };

    for (let i = 0; i < registrosBrutos.length; i++) {
      const r = registrosBrutos[i];

      const emgId = String(buscarCampo(r, ['EMG', 'Código EMG', 'Codigo EMG', 'Identificador EMG']) || '').trim();
      const nomeCompleto = String(buscarCampo(r, ['Nome completo', 'Nome', 'Beneficiário']) || '').trim().toUpperCase();

      if (!emgId && !nomeCompleto) {
        continue; // Linha vazia ou separador
      }

      if (!emgId) {
        avisos.push(`Linha ${i + 1}: Migrante "${nomeCompleto}" sem código EMG. Gerado identificador provisório.`);
      }

      const cpfBruto = String(buscarCampo(r, ['CPF', 'Cpf Beneficiario']) || '').trim();
      const idadeNum = Number(buscarCampo(r, ['Idade', 'Idade (anos)'])) || 25;
      const sexoBruto = String(buscarCampo(r, ['Sexo', 'Gênero']) || '').trim();
      const sexo: 'Male' | 'Female' =
        sexoBruto.toLowerCase().startsWith('f') || sexoBruto.toLowerCase().includes('fem') ? 'Female' : 'Male';

      const perfilFamiliar = String(
        buscarCampo(r, ['Perfil', 'Perfil familiar', 'Composição Familiar']) || 'HD - Homem Desacompanhado'
      ).trim();

      const relacionamento = String(buscarCampo(r, ['Relacionamento', 'Parentesco']) || 'Ponto Focal').trim();
      const codigoGrupoFamiliar = String(
        buscarCampo(r, ['Grupo familiar', 'Código Familiar', 'Codigo Familiar']) || emgId || `FAM-${i}`
      ).trim();

      const qtPessoas = Number(buscarCampo(r, ['Qt pessoas', 'Quantidade pessoas', 'Qtd Pessoas'])) || 1;
      const situacaoCivil = String(buscarCampo(r, ['Situação civil', 'Situacao civil', 'Estado Civil']) || 'Solteiro(a)').trim();

      const entradaBruta = buscarCampo(r, ['Entrada no abrigo', 'Data Entrada', 'Data Abrigamento']);
      const dataEntradaAbrigo = this.formatarDataEntrada(entradaBruta);

      const diasAbrigadoNum = Number(buscarCampo(r, ['Dias abrigado', 'Tempo Abrigado (dias)', 'Dias'])) || 30;

      const pcd = this.converterBooleano(buscarCampo(r, ['PCD', 'PcD', 'Deficiência', 'Deficiencia']));
      const gravida = this.converterBooleano(buscarCampo(r, ['Grávida', 'Gravida', 'Gestante']));

      const beneficiosRelato = String(buscarCampo(r, ['Benefícios (relato)', 'Beneficios relato']) || '').trim();
      const beneficiosPortal = String(buscarCampo(r, ['Benefícios (Portal)', 'Beneficios portal']) || '').trim();
      const nacionalidade = String(buscarCampo(r, ['Nacionalidade', 'País']) || 'Venezuela').trim();
      const carpa = String(buscarCampo(r, ['Carpa', 'Alojamento', 'Tenda']) || 'Carpa Provisória').trim();
      const observacoes = String(buscarCampo(r, ['Observações', 'Observacoes', 'Notas']) || '').trim();

      const registro: RegistroAbrigadoRondon = {
        emgId: emgId || `EMG-AUTO-${Date.now()}-${i}`,
        nomeCompleto,
        cpf: cpfBruto || 'Pendente',
        idade: idadeNum,
        sexo,
        perfilFamiliar,
        relacionamento,
        codigoGrupoFamiliar,
        quantidadePessoasFamilia: qtPessoas,
        situacaoCivil,
        dataEntradaAbrigo,
        diasAbrigado: diasAbrigadoNum,
        pcd,
        gravida,
        beneficiosRelato: beneficiosRelato || undefined,
        beneficiosPortal: beneficiosPortal || undefined,
        nacionalidade,
        abrigo: abrigo as AbrigoAtivo,
        carpa,
        observacoes: observacoes || undefined,
      };

      // Desconflita com a base existente (evitando duplicar registros de quem já se cadastrou pelo aplicativo)
      const baseExistente = GerenciadorRelatorioDiarioAbrigos.obterBaseAtual();
      const resultadoDesconflito = MotorDesconflitoCadastros.desconflitarRegistroPlanilha(registro, baseExistente);

      if (resultadoDesconflito.foiMesclado) {
        totalDesconflitados++;
        registrosNormalizados.push(resultadoDesconflito.registroResultado);
      } else {
        registrosNormalizados.push(registro);
      }
    }

    if (registrosNormalizados.length === 0) {
      throw new Error('Nenhum registro válido de abrigado foi identificado no arquivo.');
    }

    // Integra no banco em memória dos abrigos
    const resultadoLote = GerenciadorRelatorioDiarioAbrigos.adicionarLote(
      registrosNormalizados,
      substituirBaseAbrigo ? abrigo : undefined
    );

    // Classifica e calcula estatísticas
    const contingenteClassificado = ClassificadorAbrigadosRondon.classificarContingente(registrosNormalizados);

    const distGrupos: Record<string, number> = {};
    Object.keys(contingenteClassificado.estatisticasPorGrupo).forEach((g) => {
      distGrupos[g] = contingenteClassificado.estatisticasPorGrupo[g as keyof typeof contingenteClassificado.estatisticasPorGrupo].quantidade;
    });

    let totalDias = 0;
    let gestantes = 0;
    let pcds = 0;
    let criticos1Ano = 0;
    let monoparentais = 0;

    registrosNormalizados.forEach((r) => {
      totalDias += r.diasAbrigado;
      if (r.gravida) gestantes++;
      if (r.pcd) pcds++;
      if (r.diasAbrigado >= 365) criticos1Ano++;
      if (r.perfilFamiliar.includes('Monoparental') || r.perfilFamiliar.startsWith('FMC')) monoparentais++;
    });

    const mediaDias = registrosNormalizados.length > 0 ? Math.round(totalDias / registrosNormalizados.length) : 0;

    return {
      sucesso: true,
      abrigoIdentificado: abrigo,
      totalLinhasLidas: registrosBrutos.length,
      totalAbrigadosValidos: registrosNormalizados.length,
      totalNovosInseridos: resultadoLote.novos,
      totalAtualizados: resultadoLote.atualizados,
      totalDesconflitados,
      distribuicaoGrupos: distGrupos,
      estatisticasGerais: {
        totalGestantes: gestantes,
        totalPCD: pcds,
        permanenciaMediaDias: mediaDias,
        casosCriticosMaisDe1Ano: criticos1Ano,
        familiasMonoparentais: monoparentais,
      },
      amostraClassificados: contingenteClassificado.classificados.slice(0, 10),
      avisos,
    };
  }
}
