export type StatusSCDP =
  | 'SOLICITACAO_CADASTRADA'
  | 'BILHETE_VINCULADO'
  | 'EMBARQUE_CONFIRMADO'
  | 'PRESTACAO_CONTAS_HOMOLOGADA';

export interface BilheteAereoEmitido {
  numeroBilheteETicket: string; // Ex: '957-2489102234'
  localizadorPNR: string;        // Ex: 'BVB-CWB-7A'
  companhiaAerea: string;        // 'LATAM', 'GOL', 'AZUL', 'SIDERAL'
  valorTarifa: number;
  valorTaxaEmbarque: number;
  dataEmissao: string;
}

export interface RegistroPCDPSCDP {
  numeroPCDP: string;            // Ex: 'PCDP-2026-ACOLHIDA-004521'
  numeroProcessoSEI: string;     // Ex: '71000.045210/2026-11'
  orgaoDemandante: string;       // 'Ministério da Cidadania / Subcomitê Federal para Abrigamento e Interiorização (SUFAI)'
  beneficiarioNome: string;
  beneficiarioCPF: string;
  trechoOrigem: string;
  trechoDestino: string;
  dataPrevistaViagem: string;
  justificativaLegal: string;
  status: StatusSCDP;
  bilheteVinculado?: BilheteAereoEmitido;
  comprovacaoViagem?: {
    dataHoraEmbarqueEfetivo: string;
    portaoEmbarque: string;
    identificadorCartaoEmbarque: string;
    hashAutenticidadeAuditoriaTCU: string;
  };
  historicoAuditoria: Array<{
    dataHora: string;
    evento: string;
    responsavelSistema: string;
  }>;
}
