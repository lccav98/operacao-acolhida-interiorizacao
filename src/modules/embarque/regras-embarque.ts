import { Beneficiario, DadosGestacao, ConfirmacaoDuplaEmbarque, AuditoriaFamiliarAntiTrafico } from '../../types';

export interface ParecerRegraEmbarque {
  aprovadoParaEmbarque: boolean;
  motivoBloqueio?: string;
  categoriaRetencao?: 'UNIDADE_FAMILIAR' | 'GESTAO_AVANCADA' | 'MENOR_DESACOMPANHADO' | 'SANITARIO';
  acaoOperacional: string;
}

export class RegrasEmbarqueAutomatizadas {
  /**
   * REGRA 1: Avaliação de Estágio Gestacional (Regras Médicas ANAC / IATA / Ministério da Saúde / UNFPA)
   */
  static validarEstagioGestacional(dados?: DadosGestacao): ParecerRegraEmbarque {
    if (!dados || !dados.gestante) {
      return {
        aprovadoParaEmbarque: true,
        acaoOperacional: 'Passageira não gestante. Sem restrição obstétrica de voo.',
      };
    }

    const semanas = dados.semanasGestacao ?? 20;
    const eMultipla = dados.gestacaoMultipla ?? false;
    const temAtestado72h = dados.atestadoObstetricoEmitido72h ?? false;

    // A partir de 36 semanas (ou 32 se gemelar): VOO PROIBIDO
    const limiteMaximoSemanas = eMultipla ? 32 : 36;
    if (semanas >= limiteMaximoSemanas) {
      return {
        aprovadoParaEmbarque: false,
        categoriaRetencao: 'GESTAO_AVANCADA',
        motivoBloqueio:
          `Gestação avançada (${semanas} semanas${eMultipla ? ' - gemelar' : ''}). Embarque aéreo estritamente contraindicado por risco de parto prematuro a bordo.`,
        acaoOperacional:
          'Manter em Boa Vista com acompanhamento pré-natal prioritário pelo SUS e apoio UNFPA. Reagendar voo após o puerpério.',
      };
    }

    // Entre 28 e 35 semanas: Exige atestado médico obstétrico recente (72h)
    if (semanas >= 28) {
      if (!temAtestado72h) {
        return {
          aprovadoParaEmbarque: false,
          categoriaRetencao: 'GESTAO_AVANCADA',
          motivoBloqueio:
            `Gestante com ${semanas} semanas sem atestado obstétrico emitido nas últimas 72 horas.`,
          acaoOperacional:
            'Encaminhar para consulta médica obstétrica no P Trg para emissão de laudo de aptidão de voo.',
        };
      }
      return {
        aprovadoParaEmbarque: true,
        acaoOperacional:
          `Gestante com ${semanas} semanas com atestado obstétrico válido (72h). Embarque autorizado com assento prioritário próximo ao toalete.`,
      };
    }

    // Até 27 semanas: Embarque liberado
    return {
      aprovadoParaEmbarque: true,
      acaoOperacional:
        `Gestante no 1º/2º trimestre (${semanas} semanas). Voo aéreo liberado com orientações gerais de saúde.`,
    };
  }

  /**
   * REGRA 2: Unidade Familiar Inviolável
   * Impede estritamente a separação de grupos familiares por limitações de vagas em uma aeronave/ônibus.
   */
  static validarUnidadeFamiliarNoVoo(
    beneficiario: Beneficiario,
    vagasRestantesAeronave: number
  ): ParecerRegraEmbarque {
    const totalMembros = beneficiario.dependentesMenores.length + 1;

    if (totalMembros > vagasRestantesAeronave) {
      return {
        aprovadoParaEmbarque: false,
        categoriaRetencao: 'UNIDADE_FAMILIAR',
        motivoBloqueio:
          `REGRA INEGOCIÁVEL: Voo possui apenas ${vagasRestantesAeronave} vaga(s), mas o núcleo familiar possui ${totalMembros} membros. Separação de família é proibida.`,
        acaoOperacional:
          `Mover o núcleo familiar completo para o próximo voo com capacidade suficiente. Alocar ${vagasRestantesAeronave} passageiro(s) desacompanhado(s) (G9) para ocupar os assentos remanescentes.`,
      };
    }

    return {
      aprovadoParaEmbarque: true,
      acaoOperacional: `Núcleo familiar de ${totalMembros} pessoas alocado conjuntamente no mesmo voo/aeronave.`,
    };
  }

  /**
   * REGRA 3: Voluntariedade Estrita e Dupla Confirmação do Embarque
   * A interiorização NUNCA é compulsória. O embarque EXIGE:
   * 1) Aquiescência expressa do migrante e de seus familiares adultos;
   * 2) Confirmação objetiva de conformidade pelo sistema federal.
   */
  static validarDuplaConfirmacaoEmbarque(
    confirmacao: ConfirmacaoDuplaEmbarque
  ): {
    embarqueAutorizado: boolean;
    parecer: string;
    pendencias: string[];
  } {
    const pendencias: string[] = [];

    // 1. Verificação da Aquiescência do Migrante e da Família
    const aq = confirmacao.aquiescenciaMigranteEFamilia;
    if (!aq.termoVoluntariedadeAssinado) {
      pendencias.push('Termo de Voluntariedade e Consentimento Livre e Esclarecido NÃO assinado pelo migrante.');
    }
    if (!aq.todosAdultosDoGrupoConcordes) {
      pendencias.push('Existem familiares adultos no grupo que NÃO manifestaram aquiescência com o deslocamento.');
    }
    if (!aq.confirmacaoAtivaDMenos1OuHMenos4) {
      pendencias.push('Ausência de confirmação ativa no marco temporal recente (D-1 ou H-4 via WhatsApp/App).');
    }

    // 2. Verificação da Confirmação do Sistema Federal
    const sis = confirmacao.confirmacaoSistemaFederal;
    if (!sis.fftAprovadoComLaudo72h) {
      pendencias.push('Laudo médico Fit for Travel (FFT) pendente ou expirado (>72h).');
    }
    if (!sis.vinculoFamiliarAuditadoAntiTrafico) {
      pendencias.push('Auditoria de vínculo familiar anti-tráfico humano não concluída ou com inconformidade.');
    }
    if (!sis.bilheteSCDPEmitido) {
      pendencias.push('Passagem não vinculada e comprovada no SCDP com recurso público federal.');
    }

    const autorizado = pendencias.length === 0;

    return {
      embarqueAutorizado: autorizado,
      parecer: autorizado
        ? 'DUPLA CONFIRMAÇÃO HOMOLOGADA COM SUCESSO: Voluntariedade plena da família atestada e todas as conformidades do sistema validadas.'
        : 'EMBARQUE BLOQUEADO POR FALTA DE DUPLA CONFIRMAÇÃO.',
      pendencias,
    };
  }

  /**
   * REGRA 4: Auditoria Rigorosa de Vínculo Familiar & Prevenção ao Tráfico de Pessoas
   * Garante que quem declara ser família realmente possui vínculo legal/biológico genuíno.
   */
  static auditarVinculoFamiliarAntiTrafico(
    beneficiario: Beneficiario,
    auditoria?: AuditoriaFamiliarAntiTrafico
  ): {
    aprovado: boolean;
    nivelRisco: 'INEXISTENTE' | 'SUSPEITA_REQUER_DPU' | 'ALTO_RISCO_BLOQUEADO';
    parecer: string;
    acoesImediatas: string[];
  } {
    const acoes: string[] = [];

    // Se é adulto desacompanhado sem crianças, risco de tráfico familiar é inexistente
    if (beneficiario.dependentesMenores.length === 0) {
      return {
        aprovado: true,
        nivelRisco: 'INEXISTENTE',
        parecer: 'Beneficiário individual sem dependentes menores. Vínculo familiar não aplicável.',
        acoesImediatas: ['Seguir fluxo normal de triagem.'],
      };
    }

    // Verificação de menores de idade acompanhantes
    let menoresSemCertidaoOuGuarda = 0;
    for (const menor of beneficiario.dependentesMenores) {
      if (!menor.guardaRegularizadaOuAutorizacaoViagemCartorio && !menor.certidaoNascimentoValidada) {
        menoresSemCertidaoOuGuarda++;
      }
    }

    if (menoresSemCertidaoOuGuarda > 0) {
      acoes.push('Acionar imediatamente a Defensoria Pública da União (DPU) no P Trg.');
      acoes.push('Encaminhar o caso ao Conselho Tutelar e Vara da Infância e Juventude de Boa Vista.');
      acoes.push('Bloquear emissão de passagens e manifesto de voo até despacho judicial expresso.');

      return {
        aprovado: false,
        nivelRisco: 'ALTO_RISCO_BLOQUEADO',
        parecer: `ALERTA MÁXIMO DE PROTEÇÃO INFANTIL: Detectado(s) ${menoresSemCertidaoOuGuarda} menor(es) sem comprovação documental de filiação ou autorização notarial/judicial de viagem. Risco de tráfico humano ou subtração de incapaz.`,
        acoesImediatas: acoes,
      };
    }

    // Se houve auditoria documental detalhada com divergência
    if (auditoria && auditoria.divergenciaCadastralDetectada) {
      acoes.push('Realizar escuta protegida individualizada com psicólogos e assistentes sociais do SUFAI.');
      acoes.push('Confrontar histórico de acolhimento nos 5 abrigos oficiais (verificar código de família EMG).');

      return {
        aprovado: false,
        nivelRisco: 'SUSPEITA_REQUER_DPU',
        parecer: 'Divergência cadastral identificada entre o grupo familiar da entrada e os membros declarados para voo. Requer auditoria presencial aprofundada.',
        acoesImediatas: acoes,
      };
    }

    acoes.push('Filiação e guarda legal validadas perante os registros consulares e cartoriais.');
    acoes.push('Unidade familiar atestada e apta para emissão de bilhetes conjuntos.');

    return {
      aprovado: true,
      nivelRisco: 'INEXISTENTE',
      parecer: 'Vínculo familiar plenamente comprovado por certidões civis e registros oficiais. Risco de tráfico descartado.',
      acoesImediatas: acoes,
    };
  }
}
