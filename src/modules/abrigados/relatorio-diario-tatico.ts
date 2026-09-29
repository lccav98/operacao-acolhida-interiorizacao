import { RegistroAbrigadoRondon, AbrigadoClassificado } from '../../types/shelter';
import { ClassificadorAbrigadosRondon } from './classificador-grupos';
import { BancoVagasEmprego } from '../cruzamento-vagas/banco-vagas';

export interface AlvoAbordagemTatica {
  emgId: string;
  nome: string;
  abrigo: string;
  carpa: string;
  diasAbrigado: number;
  grupoPrioridade: string;
  modalidadeRecomendada: 'ACOLHIMENTO_INSTITUCIONAL' | 'REUNIFICACAO_FAMILIAR' | 'REUNIAO_SOCIAL' | 'VAGA_EMPREGO_SINALIZADA' | 'RETENCAO_MEDICA';
  justificativaTatica: string;
  acaoOperacionalImediata: string;
  vagaSugerida?: string;
}

export interface RelatorioDiarioAbordagem {
  dataReferencia: string;
  resumoEstatistico: {
    totalAbrigados: number;
    permanenciaMediaDias: number;
    casosCriticosAcima1000Dias: number;
    gestantesAtivas: number;
    pcdAtivos: number;
    familiasMonoparentais: number;
    distribuicaoPorAbrigo: Record<string, number>;
  };
  alvosPorModalidade: {
    institucional: AlvoAbordagemTatica[];
    reunificacaoOuSocial: AlvoAbordagemTatica[];
    empregoVES: AlvoAbordagemTatica[];
    atencaoMedicaObstetrica: AlvoAbordagemTatica[];
  };
  diretrizesOperacionaisDoDia: string[];
}

export class GerenciadorRelatorioDiarioAbrigos {
  private static baseAtualAbrigados: RegistroAbrigadoRondon[] = [];

  static definirBase(base: RegistroAbrigadoRondon[]) {
    this.baseAtualAbrigados = [...base];
  }

  static obterBaseAtual(): RegistroAbrigadoRondon[] {
    return this.baseAtualAbrigados;
  }

  static adicionarOuAtualizarAbrigado(registro: RegistroAbrigadoRondon) {
    const idx = this.baseAtualAbrigados.findIndex((a) => a.emgId === registro.emgId);
    if (idx >= 0) {
      this.baseAtualAbrigados[idx] = registro;
    } else {
      this.baseAtualAbrigados.unshift(registro);
    }
  }

  static adicionarLote(registros: RegistroAbrigadoRondon[], substituirAbrigo?: string): { novos: number; atualizados: number } {
    if (substituirAbrigo) {
      this.baseAtualAbrigados = this.baseAtualAbrigados.filter((a) => (a.abrigo || 'Rondon 1') !== substituirAbrigo);
    }
    let novos = 0;
    let atualizados = 0;
    for (const reg of registros) {
      const idx = this.baseAtualAbrigados.findIndex((a) => a.emgId === reg.emgId);
      if (idx >= 0) {
        this.baseAtualAbrigados[idx] = reg;
        atualizados++;
      } else {
        this.baseAtualAbrigados.push(reg);
        novos++;
      }
    }
    return { novos, atualizados };
  }

  /**
   * Gera o Relatório Diário de Priorização & Abordagem Tática
   * que orienta as equipes de campo nos abrigos a abordarem os alvos certos
   * para cada modalidade da Estratégia de Interiorização.
   */
  static gerarRelatorioDiario(dataReferencia?: string): RelatorioDiarioAbordagem {
    const dataRef = dataReferencia || new Date().toISOString().split('T')[0];
    const contingenteClassificado = ClassificadorAbrigadosRondon.classificarContingente(this.baseAtualAbrigados);
    const vagasDisponiveis = BancoVagasEmprego.listarTodasVagas();

    const alvosInstitucional: AlvoAbordagemTatica[] = [];
    const alvosReunificacaoOuSocial: AlvoAbordagemTatica[] = [];
    const alvosEmpregoVES: AlvoAbordagemTatica[] = [];
    const alvosAtencaoMedica: AlvoAbordagemTatica[] = [];

    let totalDias = 0;
    let criticos1000dias = 0;
    let gestantes = 0;
    let pcds = 0;
    let monoparentais = 0;
    const contagemAbrigos: Record<string, number> = {
      'Rondon 1': 0,
      'Rondon 5': 0,
      'Tuaranoko': 0,
      'Anexo Rondon 1': 0,
      'BV-8': 0,
    };

    contingenteClassificado.classificados.forEach((reg: AbrigadoClassificado) => {
      totalDias += reg.diasAbrigado;
      if (reg.diasAbrigado >= 1000) criticos1000dias++;
      if (reg.gravida) gestantes++;
      if (reg.pcd) pcds++;
      if (reg.perfilFamiliar.includes('Monoparental')) monoparentais++;

      const abrigoNome = reg.abrigo || 'Rondon 1';
      if (contagemAbrigos[abrigoNome] !== undefined) {
        contagemAbrigos[abrigoNome]++;
      } else {
        contagemAbrigos[abrigoNome] = 1;
      }

      const codGrupo = reg.grupo.codigo;

      // 1. Triagem Médica e Obstétrica Prioritária
      if (reg.gravida) {
        alvosAtencaoMedica.push({
          emgId: reg.emgId,
          nome: reg.nomeCompleto,
          abrigo: abrigoNome,
          carpa: reg.carpa,
          diasAbrigado: reg.diasAbrigado,
          grupoPrioridade: `${codGrupo} - ${reg.grupo.nome}`,
          modalidadeRecomendada: 'RETENCAO_MEDICA',
          justificativaTatica: `Gestante acolhida no ${abrigoNome}, Carpa ${reg.carpa}. Necessita de avaliação obstétrica para verificar semanas gestacionais e aptidão de voo.`,
          acaoOperacionalImediata: `Encaminhar ao posto de saúde do P Trg para ultrassom e emissão de laudo de aptidão para viagem aérea (validade 72h).`,
        });
      }

      // 2. Alvos para Vagas de Emprego Sinalizadas (VES)
      if ((codGrupo === 'G9' || codGrupo === 'G4') && !reg.gravida && reg.idade >= 18 && reg.idade <= 55) {
        const vagaCompativel = vagasDisponiveis[alvosEmpregoVES.length % vagasDisponiveis.length];
        alvosEmpregoVES.push({
          emgId: reg.emgId,
          nome: reg.nomeCompleto,
          abrigo: abrigoNome,
          carpa: reg.carpa,
          diasAbrigado: reg.diasAbrigado,
          grupoPrioridade: `${codGrupo} - ${reg.grupo.nome}`,
          modalidadeRecomendada: 'VAGA_EMPREGO_SINALIZADA',
          justificativaTatica: `Adulto em idade produtiva (${reg.idade} anos), acolhido no ${abrigoNome}, ${reg.diasAbrigado} dias. Perfil altamente aderente ao setor de ${vagaCompativel.tituloCargo}.`,
          acaoOperacionalImediata: `Equipe de campo do ${abrigoNome} abordar na Carpa ${reg.carpa} para entrevista de emprego formal para ${vagaCompativel.cidade}/${vagaCompativel.uf} (Salário: R$ ${vagaCompativel.salario.toFixed(2)}).`,
          vagaSugerida: `${vagaCompativel.tituloCargo} - ${vagaCompativel.empresa.razaoSocial} (${vagaCompativel.cidade}/${vagaCompativel.uf})`,
        });
      }

      // 3. Alvos para Acolhimento Institucional (AI)
      if (codGrupo === 'G1' || (codGrupo === 'G3' && reg.quantidadePessoasFamilia > 1)) {
        alvosInstitucional.push({
          emgId: reg.emgId,
          nome: reg.nomeCompleto,
          abrigo: abrigoNome,
          carpa: reg.carpa,
          diasAbrigado: reg.diasAbrigado,
          grupoPrioridade: `${codGrupo} - ${reg.grupo.nome}`,
          modalidadeRecomendada: 'ACOLHIMENTO_INSTITUCIONAL',
          justificativaTatica: `Núcleo familiar de alta vulnerabilidade com ${reg.quantidadePessoasFamilia} pessoas no ${abrigoNome}. Tempo de permanência crítico (${reg.diasAbrigado} dias).`,
          acaoOperacionalImediata: `Reservar vaga em abrigo institucional receptor em municípios conveniados e agendar sessão de orientação pré-embarque.`,
        });
      }

      // 4. Alvos para Reunificação Familiar (RF) / Reunião Social (RS)
      if (reg.relacionamento.toLowerCase().includes('irmão') || reg.quantidadePessoasFamilia >= 2) {
        alvosReunificacaoOuSocial.push({
          emgId: reg.emgId,
          nome: reg.nomeCompleto,
          abrigo: abrigoNome,
          carpa: reg.carpa,
          diasAbrigado: reg.diasAbrigado,
          grupoPrioridade: `${codGrupo} - ${reg.grupo.nome}`,
          modalidadeRecomendada: 'REUNIFICACAO_FAMILIAR',
          justificativaTatica: `Grupo no ${abrigoNome} com vínculo familiar declarado (${reg.relacionamento}). Potencial imediato de reunificação com familiares residentes em outros estados.`,
          acaoOperacionalImediata: `Disparar formulário mobile de checagem de dados do acolhedor no WhatsApp para confirmação do endereço de destino.`,
        });
      }
    });

    const mediaDias = this.baseAtualAbrigados.length > 0 ? Math.round(totalDias / this.baseAtualAbrigados.length) : 0;

    return {
      dataReferencia: dataRef,
      resumoEstatistico: {
        totalAbrigados: this.baseAtualAbrigados.length,
        permanenciaMediaDias: mediaDias,
        casosCriticosAcima1000Dias: criticos1000dias,
        gestantesAtivas: gestantes,
        pcdAtivos: pcds,
        familiasMonoparentais: monoparentais,
        distribuicaoPorAbrigo: contagemAbrigos,
      },
      alvosPorModalidade: {
        institucional: alvosInstitucional.slice(0, 10),
        reunificacaoOuSocial: alvosReunificacaoOuSocial.slice(0, 10),
        empregoVES: alvosEmpregoVES.slice(0, 10),
        atencaoMedicaObstetrica: alvosAtencaoMedica.slice(0, 10),
      },
      diretrizesOperacionaisDoDia: [
        `[Tuaranoko - Indígena]: Abordagem intercultural com facilitadores em língua Warao/Eñepa para interiorização comunitária e projetos produtivos.`,
        `[BV-8 - Pacaraima]: Triagem e validação documental na fronteira para comboio logístico até Boa Vista ou voo de interiorização direto.`,
        `[Rondon 1 e Anexo Rondon 1]: Foco prioritário na abordagem de famílias com permanência superior a 1.000 dias (Carpas S15, J13 e P07).`,
        `[Rondon 5]: Mobilização de famílias monoparentais e pluriparentais para vagas de emprego sinalizadas (VES) com acolhimento integrado.`,
        `[Geral SUFAI]: Realizar triagem obstétrica em até 72h antes do voo comercial/Sideral/FAB para emissão tempestiva de atestado médico.`,
      ],
    };
  }
}
