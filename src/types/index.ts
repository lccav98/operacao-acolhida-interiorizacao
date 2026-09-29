export type ModalidadeInteriorizacao =
  | 'INSTITUCIONAL'
  | 'REUNIFICACAO_FAMILIAR'
  | 'REUNIAO_SOCIAL'
  | 'VAGA_EMPREGO_SINALIZADA';

export type StatusProcesso =
  | 'CADASTRADO'
  | 'EM_REVISAO_DOCUMENTAL'
  | 'PENDENCIA_DOCUMENTAL'
  | 'TRIAGEM_PROTECAO'
  | 'AGUARDANDO_FFT'
  | 'INAPTO_MEDICO'
  | 'RETIDO_GESTAO_AVANCADA'
  | 'PRE_LISTA_EMBARQUE'
  | 'APROVADO_SUFAI'
  | 'CONFIRMACAO_PRESENCA_PENDENTE'
  | 'CONFIRMADO_PARA_EMBARQUE'
  | 'RISCO_NO_SHOW_DETECTADO'
  | 'SUBSTITUIDO_POR_SUPLENTE'
  | 'EMBARQUE_RETIDO_UNIDADE_FAMILIAR'
  | 'EM_DESLOCAMENTO'
  | 'SALA_SITUACAO_ALERTA'
  | 'DESEMBARCADO'
  | 'CASA_PASSAGEM_CONTINGENCIA'
  | 'ENTREGA_CONCLUIDA'
  | 'MONITORAMENTO_NURIN';

export interface DocumentacaoMigratoria {
  tipo: 'SOLICITACAO_REFUGIO' | 'RESIDENCIA_TEMPORARIA';
  numeroProtocolo: string;
  dataEmissao: string;
  regular: boolean;
}

export interface DependenteMenor {
  nome: string;
  idade: number;
  parentesco: string;
  guardaRegularizadaOuAutorizacaoViagemCartorio: boolean;
  certidaoNascimentoValidada?: boolean;
}

export interface ConfirmacaoDuplaEmbarque {
  aquiescenciaMigranteEFamilia: {
    termoVoluntariedadeAssinado: boolean;
    dataHoraAssinatura?: string;
    todosAdultosDoGrupoConcordes: boolean;
    confirmacaoAtivaDMenos1OuHMenos4: boolean;
    canalConfirmacao: 'APLICATIVO_MOBILE' | 'WHATSAPP_META_API' | 'PRESENCIAL_P_TRG';
  };
  confirmacaoSistemaFederal: {
    fftAprovadoComLaudo72h: boolean;
    vinculoFamiliarAuditadoAntiTrafico: boolean;
    bilheteSCDPEmitido: boolean;
    bloqueioPorSubocupacaoLiberado: boolean;
  };
  embarqueAutorizado: boolean;
  justificativaBloqueio?: string;
}

export interface AuditoriaFamiliarAntiTrafico {
  codigoGrupoFamiliarOrigem?: string;
  parentescoComprovadoDocumentalmente: boolean;
  certidaoNascimentoApresentada: boolean;
  autorizacaoJudicialOuCartorialViagemMenores: boolean;
  entrevistaProtecaoInfantilRealizada: boolean;
  divergenciaCadastralDetectada: boolean;
  riscoTraficoHumano: 'INEXISTENTE' | 'SUSPEITA_REQUER_DPU' | 'ALTO_RISCO_BLOQUEADO';
  parecerAuditoria: string;
}

export interface DadosGestacao {
  gestante: boolean;
  semanasGestacao?: number;
  gestacaoMultipla?: boolean;
  atestadoObstetricoEmitido72h?: boolean;
}

export interface RegistroSaude {
  vacinaFebreAmarela: {
    aplicada: boolean;
    diasDesdeDose: number;
  };
  vacinaTripliceViral: {
    primeiraDoseAplicada: boolean;
  };
  sintomasEpidemicos: boolean;
  gestante: boolean;
  dadosGestacao?: DadosGestacao;
  necessidadesEspeciais?: string[];
  laudoAptidaoClinica?: boolean;
}

export interface ReceptorInfo {
  nome: string;
  cpf: string;
  idade: number;
  grauParentescoRelatado: string;
  parentescoComprovadoDocumentalmente: boolean;
  comprovanteResidenciaValido: boolean;
  rendaMensalDeclarada: number;
  capacidadeAcomodacaoPessoas: number;
  cidadeDestino: string;
  ufDestino: string;
  telefoneContato: string;
}

export interface EmpresaVESInfo {
  razaoSocial: string;
  cnpj: string;
  vagaOferecida: string;
  salarioMensal: number;
  ofereceMoradia: boolean;
  cidadeDestino: string;
  ufDestino: string;
  obiceListaTrabalhoEscravo: boolean;
  obiceCEIS_CNEP: boolean;
  declaracaoIntencoesAssinada: boolean;
}

export interface PerfilProfissional {
  ocupacaoPrincipal: string;
  experienciasAnteriores: string[];
  habilidadesTecnicas: string[];
  escolaridade: string;
  interesseEmpregoDestino: boolean;
}

export interface VagaCadastrada {
  idVaga: string;
  empresa: EmpresaVESInfo;
  tituloCargo: string;
  descricaoRequisitos: string;
  cidade: string;
  uf: string;
  salario: number;
}

export interface MatchVESOportunidade {
  vaga: VagaCadastrada;
  scoreAderencia: number;
  compatibilidadePercent: number;
  parecerIA: string;
  beneficioConvergente: string;
}

export interface Beneficiario {
  id: string;
  nome: string;
  dataNascimento: string;
  nacionalidade: string;
  documentoIdentidade: string;
  cpf: string;
  telefoneContato: string;
  declaracaoVoluntariedadeAssinada: boolean;
  localAtual: 'BOA_VISTA' | 'PACARAIMA' | 'MANAUS';
  abrigoOrigem?: string;
  documentacaoMigratoria: DocumentacaoMigratoria;
  dependentesMenores: DependenteMenor[];
  saude: RegistroSaude;
  relatoSituacaoEContexto: string;
  dataEntradaBrasil: string;
  perfilProfissional?: PerfilProfissional;
}

export type ModalTransporte =
  | 'FAB_CCLM'
  | 'COMERCIAL_OIM'
  | 'AERONAVE_FRETADA'
  | 'RODOVIARIO'
  | 'FLUVIAL';

export interface PlanoViagemLogistica {
  modal: ModalTransporte;
  cidadeOrigem: string;
  cidadeDestino: string;
  aeroportoOuBaseDestino: string;
  escalaEmAlojamentoTransitoManaus: boolean;
  dataPrevistaEmbarque: string;
  bagagemConformeANAC: boolean;
}

export interface IncidenteTransito {
  tipo: 'EMERGENCIA_MEDICA_BORDO' | 'POUSO_FORCADO_DESVIO' | 'ATRASO_LOGISTICO' | 'RECEPTOR_AUSENTE_DESEMBARQUE';
  descricao: string;
  localOcorrencia: string;
  dataHora: string;
}

export interface ResolucaoSalaSituacao {
  protocoloAcionado: string;
  justificativaIA: string;
  confianca: number;
  acoesImediatas: string[];
}

export interface EncaminhamentoNURIN {
  crasOuCreasReferenciado: boolean;
  unidadeBasicaSaudeReferenciada: boolean;
  vagasEscolaresArticuladas: boolean;
  cursoPortuguesArticulado: boolean;
  apoioEmpregabilidade: boolean;
  observacoes: string;
}

export type MarcoTemporalLembrete = 'D_MENOS_7' | 'D_MENOS_3' | 'D_MENOS_1' | 'H_MENOS_4';

export interface MensagemAntiAbsenteismo {
  marco: MarcoTemporalLembrete;
  telefoneDestino: string;
  idioma: 'ESPANHOL' | 'PORTUGUES';
  conteudoMensagem: string;
  canal: 'WHATSAPP' | 'SMS' | 'AUDIO_ABRIGO';
  dataEnvioPrevista: string;
  statusEnvio: 'ENVIADO' | 'PENDENTE' | 'RESPONDIDO';
  respostaBeneficiario?: string;
}

export interface AnaliseNoShowIA {
  probabilidadeComparecimento: number;
  statusProntidao: 'CONFIRMADO' | 'DUVIDA_LOGISTICA' | 'RISCO_DESISTENCIA' | 'IMPEDIMENTO_MEDICO_DOCUMENTAL';
  acaoRecomendada: 'LIBERAR_EMBARQUE' | 'ENVIAR_ORIENTADOR_ABRIGO' | 'ACIONAR_STANDBY_BANCO_RESERVA' | 'REMARCAR_JANELA_MEDICA';
  justificativa: string;
}

export interface ProcessoInteriorizacao {
  protocoloProcesso: string;
  dataCriacao: string;
  status: StatusProcesso;
  modalidade: ModalidadeInteriorizacao;
  beneficiario: Beneficiario;
  receptor?: ReceptorInfo;
  empresaVES?: EmpresaVESInfo;
  matchVESOportunidade?: MatchVESOportunidade;
  logistica?: PlanoViagemLogistica;
  historicoMensagensEngajamento?: MensagemAntiAbsenteismo[];
  analiseNoShow?: AnaliseNoShowIA;
  historicoEtapas: Array<{
    fase: string;
    descricao: string;
    dataHora: string;
    aprovado: boolean;
    detalhes?: Record<string, unknown>;
  }>;
  encaminhamentosNurin?: EncaminhamentoNURIN;
}
