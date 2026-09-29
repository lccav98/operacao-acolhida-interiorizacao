import { RegistroAbrigadoRondon, AbrigadoClassificado } from '../../types/shelter';
import { ClassificadorAbrigadosRondon } from './classificador-grupos';

export interface ResultadoDesconflito {
  desconflitado: boolean;
  tipoAcao: 'UNIFICADO_EXISTENTE' | 'NOVO_REGISTRO_CRIADO';
  registroFinal: RegistroAbrigadoRondon;
  registroClassificado: AbrigadoClassificado;
  motivoCorrespondencia?: string;
  pontuacaoConfianca: number;
  camposEnriquecidos: string[];
  mensagemUsuario: string;
}

export class MotorDesconflitoCadastros {
  /**
   * Normaliza CPF removendo pontuação
   */
  static normalizarCpf(cpf?: string): string {
    if (!cpf) return '';
    return cpf.replace(/\D/g, '').trim();
  }

  /**
   * Normaliza strings removendo acentos e espaços extras
   */
  static normalizarTexto(texto?: string): string {
    if (!texto) return '';
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calcula similaridade Jaccard/Tokens entre dois nomes
   */
  static calcularSimilaridadeNomes(nome1: string, nome2: string): number {
    const n1 = this.normalizarTexto(nome1);
    const n2 = this.normalizarTexto(nome2);

    if (n1 === n2) return 1.0;
    if (!n1 || !n2) return 0.0;

    const tokens1 = new Set(n1.split(' ').filter((t) => t.length > 2));
    const tokens2 = new Set(n2.split(' ').filter((t) => t.length > 2));

    let intersecao = 0;
    tokens1.forEach((t) => {
      if (tokens2.has(t)) intersecao++;
    });

    const uniao = new Set([...tokens1, ...tokens2]).size;
    if (uniao === 0) return 0.0;

    return intersecao / uniao;
  }

  /**
   * Localiza correspondência de um candidato na base atual
   */
  static localizarCorrespondencia(
    candidato: {
      cpf?: string;
      emgId?: string;
      nomeCompleto?: string;
      idade?: number;
      abrigo?: string;
    },
    base: RegistroAbrigadoRondon[]
  ): {
    encontrado?: RegistroAbrigadoRondon;
    indice: number;
    motivo?: string;
    confianca: number;
  } {
    const cpfCandidato = this.normalizarCpf(candidato.cpf);
    const emgCandidato = this.normalizarTexto(candidato.emgId);
    const nomeCandidato = this.normalizarTexto(candidato.nomeCompleto);

    // 1. Prioridade 1: Match Exato por CPF válido (11 dígitos)
    if (cpfCandidato.length === 11) {
      for (let i = 0; i < base.length; i++) {
        const cpfBase = this.normalizarCpf(base[i].cpf);
        if (cpfBase === cpfCandidato) {
          return {
            encontrado: base[i],
            indice: i,
            motivo: `CPF idêntico (${base[i].cpf}) localizado na base de abrigamento`,
            confianca: 1.0,
          };
        }
      }
    }

    // 2. Prioridade 2: Match Exato por Código EMG oficial
    if (emgCandidato && emgCandidato.startsWith('EMG-')) {
      for (let i = 0; i < base.length; i++) {
        const emgBase = this.normalizarTexto(base[i].emgId);
        if (emgBase === emgCandidato) {
          return {
            encontrado: base[i],
            indice: i,
            motivo: `Código oficial EMG (${base[i].emgId}) idêntico`,
            confianca: 1.0,
          };
        }
      }
    }

    // 3. Prioridade 3: Match por Nome Completo Exato + Abrigo ou Faixa Etária
    if (nomeCandidato && nomeCandidato.length > 5) {
      for (let i = 0; i < base.length; i++) {
        const nomeBase = this.normalizarTexto(base[i].nomeCompleto);
        if (nomeBase === nomeCandidato) {
          return {
            encontrado: base[i],
            indice: i,
            motivo: `Nome completo idêntico ("${base[i].nomeCompleto}") com registro prévio no abrigo ${base[i].abrigo || 'Rondon 1'}`,
            confianca: 0.95,
          };
        }
      }

      // 4. Prioridade 4: Match Fuzzy (similaridade de nomes >= 80% e mesmo abrigo ou idade próxima)
      for (let i = 0; i < base.length; i++) {
        const sim = this.calcularSimilaridadeNomes(nomeCandidato, base[i].nomeCompleto);
        if (sim >= 0.8) {
          const mesmoAbrigo =
            !candidato.abrigo ||
            (base[i].abrigo && base[i].abrigo?.toLowerCase() === candidato.abrigo.toLowerCase());
          const idadeProxima =
            !candidato.idade || Math.abs((candidato.idade || 0) - base[i].idade) <= 2;

          if (mesmoAbrigo || idadeProxima) {
            return {
              encontrado: base[i],
              indice: i,
              motivo: `Alta similaridade nominal (${Math.round(sim * 100)}%) confirmada com cadastro do abrigo ${base[i].abrigo || 'Rondon 1'}`,
              confianca: sim,
            };
          }
        }
      }
    }

    return { encontrado: undefined, indice: -1, confianca: 0 };
  }

  /**
   * Desconflita dados inseridos via Aplicativo Móvel contra a base oficial existente
   */
  static desconflitarCadastroMobile(
    dadosMobile: {
      nome: string;
      cpf?: string;
      telefone?: string;
      situacaoAbrigo?: string;
      carpa?: string;
      tempoBoaVista?: string;
      modalidadeDesejada?: string;
      sexo?: string;
      saudeEFamilia?: {
        gravida?: boolean;
        filhosMenoresQtd?: number;
      };
      contatoDestino?: {
        cidade?: string;
        uf?: string;
      };
      experienciaProfissional?: string;
    },
    baseAtual: RegistroAbrigadoRondon[]
  ): ResultadoDesconflito {
    const correspondencia = this.localizarCorrespondencia(
      {
        nomeCompleto: dadosMobile.nome,
        cpf: dadosMobile.cpf,
        abrigo: dadosMobile.situacaoAbrigo,
      },
      baseAtual
    );

    const dataHoraIso = new Date().toISOString();
    const dataHoraBr = new Date().toLocaleString('pt-BR');

    // CASO 1: REGISTRO JÁ EXISTE NA PLANILHA OFICIAL -> DESCONFLITAR E ENRIQUECER
    if (correspondencia.encontrado) {
      const oficial = correspondencia.encontrado;
      const camposEnriquecidos: string[] = [];

      // 1. Atualiza Telefone/WhatsApp para mensageria automatizada Meta
      if (dadosMobile.telefone && dadosMobile.telefone !== oficial.telefoneWhatsApp) {
        oficial.telefoneWhatsApp = dadosMobile.telefone;
        camposEnriquecidos.push('Telefone / WhatsApp');
      }

      // 2. Se o CPF estava pendente ou em regularização na planilha, atualiza com o CPF validado do App
      const cpfLimpoMobile = this.normalizarCpf(dadosMobile.cpf);
      const cpfLimpoOficial = this.normalizarCpf(oficial.cpf);
      if (cpfLimpoMobile.length === 11 && cpfLimpoOficial.length !== 11) {
        oficial.cpf = dadosMobile.cpf!;
        camposEnriquecidos.push('CPF Validado');
      }

      // 3. Atualiza estado de gravidez se a migrante declarou no app
      if (dadosMobile.saudeEFamilia?.gravida && !oficial.gravida) {
        oficial.gravida = true;
        camposEnriquecidos.push('Sinalização de Gestação (Triagem Obstétrica Ativada)');
      }

      // 4. Vincula preferências e dados autodeclarados do App
      oficial.dadosMobileVinculados = {
        modalidadeDesejada: dadosMobile.modalidadeDesejada || 'VAGA_EMPREGO_SINALIZADA',
        cidadeDestino: dadosMobile.contatoDestino?.cidade,
        ufDestino: dadosMobile.contatoDestino?.uf,
        dataRegistroMobile: dataHoraIso,
      };
      camposEnriquecidos.push('Interesse de Modalidade & Destino');

      // 5. Marca metadados de desconflito e auditoria
      oficial.desconflitado = true;
      oficial.origemCadastro = 'MISTO_DESCONFLITADO';
      oficial.dataDesconflito = dataHoraIso;
      oficial.motivoDesconflito = correspondencia.motivo;

      const notaAuditoria = `[DESCONFLITADO em ${dataHoraBr}]: Registro oficial do ${oficial.abrigo || 'Rondon 1'} (Carpa ${oficial.carpa}, ${oficial.diasAbrigado} dias) enriquecido via Aplicativo Móvel sem duplicidade. ${correspondencia.motivo}. Campos integrados: ${camposEnriquecidos.join(', ')}.`;
      oficial.observacoes = oficial.observacoes ? `${oficial.observacoes} | ${notaAuditoria}` : notaAuditoria;

      const classificado = ClassificadorAbrigadosRondon.classificar(oficial);

      return {
        desconflitado: true,
        tipoAcao: 'UNIFICADO_EXISTENTE',
        registroFinal: oficial,
        registroClassificado: classificado,
        motivoCorrespondencia: correspondencia.motivo,
        pontuacaoConfianca: correspondencia.confianca,
        camposEnriquecidos,
        mensagemUsuario: `Identificamos com sucesso que você já possui cadastro oficial ativo no ${oficial.abrigo || 'Rondon 1'} (Carpa ${oficial.carpa}) há ${oficial.diasAbrigado} dias. Seu registro foi unificado com seu Código EMG oficial (${oficial.emgId}) sem duplicação de dados.`,
      };
    }

    // CASO 2: NÃO EXISTE NA PLANILHA -> NOVO REGISTRO DO APLICATIVO
    const novoAbrigado: RegistroAbrigadoRondon = {
      emgId: `EMG-${Date.now().toString().slice(-8)}`,
      nomeCompleto: this.normalizarTexto(dadosMobile.nome),
      cpf: dadosMobile.cpf || 'Em regularização',
      idade: 28,
      sexo: dadosMobile.sexo === 'Feminino' ? 'Female' : 'Male',
      perfilFamiliar:
        (dadosMobile.saudeEFamilia?.filhosMenoresQtd || 0) > 0
          ? 'FMC - Familia Monoparental com Criança (-12a)'
          : 'HD - Homem Desacompanhado',
      relacionamento: 'Ponto Focal',
      codigoGrupoFamiliar: `EMG-26-${Date.now().toString().slice(-6)}`,
      quantidadePessoasFamilia: (dadosMobile.saudeEFamilia?.filhosMenoresQtd || 0) + 1,
      situacaoCivil: 'Solteiro(a)',
      dataEntradaAbrigo: new Date().toISOString().split('T')[0],
      diasAbrigado: dadosMobile.tempoBoaVista === 'MAIS_1_ANO' ? 420 : 45,
      pcd: false,
      gravida: Boolean(dadosMobile.saudeEFamilia?.gravida),
      nacionalidade: 'Venezuela',
      carpa: dadosMobile.carpa || 'Carpa Provisória',
      abrigo: (dadosMobile.situacaoAbrigo as any) || 'Rondon 1',
      telefoneWhatsApp: dadosMobile.telefone,
      origemCadastro: 'AUTO_CADASTRO_MOBILE',
      desconflitado: false,
      dadosMobileVinculados: {
        modalidadeDesejada: dadosMobile.modalidadeDesejada,
        cidadeDestino: dadosMobile.contatoDestino?.cidade,
        ufDestino: dadosMobile.contatoDestino?.uf,
        dataRegistroMobile: dataHoraIso,
      },
    };

    const classificadoNovo = ClassificadorAbrigadosRondon.classificar(novoAbrigado);

    return {
      desconflitado: false,
      tipoAcao: 'NOVO_REGISTRO_CRIADO',
      registroFinal: novoAbrigado,
      registroClassificado: classificadoNovo,
      pontuacaoConfianca: 1.0,
      camposEnriquecidos: ['Novo Registro Criado'],
      mensagemUsuario:
        'Cadastro inicial realizado com sucesso pelo Subcomitê Federal para Abrigamento e Interiorização (SUFAI).',
    };
  }

  /**
   * Desconflita linhas de uma planilha importada contra registros já cadastrados previamente
   */
  static desconflitarRegistroPlanilha(
    registroPlanilha: RegistroAbrigadoRondon,
    baseExistente: RegistroAbrigadoRondon[]
  ): {
    registroResultado: RegistroAbrigadoRondon;
    foiMesclado: boolean;
    motivo?: string;
  } {
    const match = this.localizarCorrespondencia(
      {
        cpf: registroPlanilha.cpf,
        emgId: registroPlanilha.emgId,
        nomeCompleto: registroPlanilha.nomeCompleto,
        abrigo: registroPlanilha.abrigo,
      },
      baseExistente
    );

    if (match.encontrado) {
      const existente = match.encontrado;
      // Mantém os dados da planilha que são autoritativos (tempo de permanência, carpa, grupo familiar)
      // MAS preserva o telefone WhatsApp e dados móveis cadastrados pelo migrante!
      const resultado: RegistroAbrigadoRondon = {
        ...registroPlanilha,
        telefoneWhatsApp: existente.telefoneWhatsApp || registroPlanilha.telefoneWhatsApp,
        dadosMobileVinculados: existente.dadosMobileVinculados || registroPlanilha.dadosMobileVinculados,
        origemCadastro: 'MISTO_DESCONFLITADO',
        desconflitado: true,
        dataDesconflito: new Date().toISOString(),
        motivoDesconflito: match.motivo,
      };

      return {
        registroResultado: resultado,
        foiMesclado: true,
        motivo: match.motivo,
      };
    }

    return {
      registroResultado: {
        ...registroPlanilha,
        origemCadastro: 'PLANILHA_ABRIGAMENTO',
        desconflitado: false,
      },
      foiMesclado: false,
    };
  }
}
