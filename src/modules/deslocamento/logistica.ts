import { Beneficiario, ModalTransporte, PlanoViagemLogistica } from '../../types';

export interface ValidacaoEmbarque {
  liberadoParaEmbarque: boolean;
  motivoBloqueio?: string;
  checklistSeguranca: {
    documentosEmMaos: boolean;
    bagagemDespachadaSemCortantes: boolean;
    etiquetasBagagemConferidas: boolean;
    alimentacaoPreEmbarqueEntregue: boolean;
    orientacoesANACEfetivadas: boolean;
  };
}

export class GestorLogistico {
  /**
   * Aloca o modal de transporte mais adequado conforme perfil, local e destino
   */
  static planejarTrajeto(
    beneficiario: Beneficiario,
    cidadeDestino: string,
    ufDestino: string,
    totalMembrosGrupo: number
  ): PlanoViagemLogistica {
    let modal: ModalTransporte = 'FAB_CCLM';
    let aeroportoDestino = `Base Aérea / Aeroporto de ${cidadeDestino}-${ufDestino}`;
    let necessitaEscalaManaus = false;

    // Se origem for Pacaraima, primeiro há translado terrestre até Boa Vista
    if (beneficiario.localAtual === 'PACARAIMA') {
      necessitaEscalaManaus = true;
    }

    // Regras de seleção de modal operacional
    if (totalMembrosGrupo >= 4 || beneficiario.abrigoOrigem) {
      modal = 'FAB_CCLM'; // Voo militar da Força Aérea Brasileira
    } else if (['SP', 'RJ', 'PR', 'SC', 'RS'].includes(ufDestino)) {
      modal = 'COMERCIAL_OIM'; // Voos comerciais viabilizados pela OIM
    } else {
      modal = 'AERONAVE_FRETADA';
    }

    return {
      modal,
      cidadeOrigem: beneficiario.localAtual === 'PACARAIMA' ? 'Pacaraima/Boa Vista' : beneficiario.localAtual,
      cidadeDestino,
      aeroportoOuBaseDestino: aeroportoDestino,
      escalaEmAlojamentoTransitoManaus: necessitaEscalaManaus,
      dataPrevistaEmbarque: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      bagagemConformeANAC: true,
    };
  }

  /**
   * Protocolo de Pré-Embarque e Verificação ANAC
   */
  static inspecionarPreEmbarque(
    temObjetosCortantesNaBagagemDeMao: boolean,
    documentosOriginaisConferidos: boolean
  ): ValidacaoEmbarque {
    if (!documentosOriginaisConferidos) {
      return {
        liberadoParaEmbarque: false,
        motivoBloqueio: 'Beneficiário sem documentos originais na hora do embarque.',
        checklistSeguranca: {
          documentosEmMaos: false,
          bagagemDespachadaSemCortantes: !temObjetosCortantesNaBagagemDeMao,
          etiquetasBagagemConferidas: true,
          alimentacaoPreEmbarqueEntregue: true,
          orientacoesANACEfetivadas: true,
        },
      };
    }

    if (temObjetosCortantesNaBagagemDeMao) {
      return {
        liberadoParaEmbarque: false,
        motivoBloqueio:
          'Bloqueio ANAC: Objetos metálicos/cortantes na bagagem de mão. Devem ser despachados no porão antes do embarque no ônibus.',
        checklistSeguranca: {
          documentosEmMaos: true,
          bagagemDespachadaSemCortantes: false,
          etiquetasBagagemConferidas: true,
          alimentacaoPreEmbarqueEntregue: true,
          orientacoesANACEfetivadas: false,
        },
      };
    }

    return {
      liberadoParaEmbarque: true,
      checklistSeguranca: {
        documentosEmMaos: true,
        bagagemDespachadaSemCortantes: true,
        etiquetasBagagemConferidas: true,
        alimentacaoPreEmbarqueEntregue: true,
        orientacoesANACEfetivadas: true,
      },
    };
  }
}
