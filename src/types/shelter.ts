export type CodigoGrupoAbordagem =
  | 'G1'
  | 'G2'
  | 'G3'
  | 'G4'
  | 'G5'
  | 'G6'
  | 'G7'
  | 'G8'
  | 'G9';

export interface GrupoAbordagemInfo {
  codigo: CodigoGrupoAbordagem;
  nome: string;
  prioridadeEmpregabilidade: 'Baixa' | 'Baixa (temporária)' | 'Média' | 'Alta';
  criterioRegra: string;
  abordagemSugerida: string;
}

export type AbrigoAtivo = 'Rondon 1' | 'Rondon 5' | 'Tuaranoko' | 'Anexo Rondon 1' | 'BV-8';
export const ABRIGOS_ATIVOS: readonly AbrigoAtivo[] = [
  'Rondon 1',
  'Rondon 5',
  'Tuaranoko',
  'Anexo Rondon 1',
  'BV-8',
] as const;

export interface RegistroAbrigadoRondon {
  emgId: string;
  nomeCompleto: string;
  cpf: string;
  idade: number;
  sexo: 'Male' | 'Female';
  perfilFamiliar: string; // Ex: 'HD - Homem Desacompanhado', 'FMC - Familia Monoparental...'
  relacionamento: string; // 'Ponto Focal', 'Marido', 'Filho', etc.
  codigoGrupoFamiliar: string;
  quantidadePessoasFamilia: number;
  situacaoCivil?: string;
  dataEntradaAbrigo: string;
  diasAbrigado: number;
  pcd: boolean;
  gravida: boolean;
  beneficiosRelato?: string;
  beneficiosPortal?: string;
  nacionalidade: string;
  carpa: string; // Ex: 'J13', 'A10', 'G12'
  abrigo?: AbrigoAtivo | string;
  etnia?: 'Warao' | 'Eñepa' | 'Não indígena' | string;
  observacoes?: string;
  telefoneWhatsApp?: string;
  origemCadastro?: 'PLANILHA_ABRIGAMENTO' | 'AUTO_CADASTRO_MOBILE' | 'MISTO_DESCONFLITADO';
  desconflitado?: boolean;
  dataDesconflito?: string;
  motivoDesconflito?: string;
  dadosMobileVinculados?: {
    modalidadeDesejada?: string;
    cidadeDestino?: string;
    ufDestino?: string;
    dataRegistroMobile?: string;
  };
}

export interface AbrigadoClassificado extends RegistroAbrigadoRondon {
  grupo: GrupoAbordagemInfo;
  modalidadeRecomendada: 'INSTITUCIONAL' | 'REUNIFICACAO_FAMILIAR' | 'REUNIAO_SOCIAL' | 'VAGA_EMPREGO_SINALIZADA';
  scorePrioridadeInteriorizacao: number;
  planoAcaoSugerido: string;
}
