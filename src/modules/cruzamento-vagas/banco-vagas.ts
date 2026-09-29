import { VagaCadastrada } from '../../types';

export class BancoVagasEmprego {
  private static vagasAtivas: VagaCadastrada[] = [
    {
      idVaga: 'VAGA-CWB-001',
      empresa: {
        razaoSocial: 'Paraná Alimentos e Logística S.A.',
        cnpj: '11.222.333/0001-55',
        vagaOferecida: 'Operador de Embalagem e Logística Industrial',
        salarioMensal: 2450.0,
        ofereceMoradia: false, // Moradia será com a família!
        cidadeDestino: 'Curitiba',
        ufDestino: 'PR',
        obiceListaTrabalhoEscravo: false,
        obiceCEIS_CNEP: false,
        declaracaoIntencoesAssinada: true,
      },
      tituloCargo: 'Operador de Embalagem e Logística Industrial',
      descricaoRequisitos:
        'Experiência prévia em empacotamento, separação de pedidos, controle de estoque ou linhas de produção alimentícia.',
      cidade: 'Curitiba',
      uf: 'PR',
      salario: 2450.0,
    },
    {
      idVaga: 'VAGA-XAP-002',
      empresa: {
        razaoSocial: 'AgroSul Frigoríficos S.A.',
        cnpj: '22.333.444/0001-66',
        vagaOferecida: 'Auxiliar de Processamento de Carnes',
        salarioMensal: 2350.0,
        ofereceMoradia: true,
        cidadeDestino: 'Chapecó',
        ufDestino: 'SC',
        obiceListaTrabalhoEscravo: false,
        obiceCEIS_CNEP: false,
        declaracaoIntencoesAssinada: true,
      },
      tituloCargo: 'Auxiliar de Processamento de Carnes',
      descricaoRequisitos:
        'Trabalho em linha de abate e corte industrial, normas de higiene sanitária e manuseio de facas.',
      cidade: 'Chapecó',
      uf: 'SC',
      salario: 2350.0,
    },
    {
      idVaga: 'VAGA-POA-003',
      empresa: {
        razaoSocial: 'Gaúcha Montagens Mecânicas Ltda',
        cnpj: '33.444.555/0001-77',
        vagaOferecida: 'Auxiliar de Manutenção e Montagem',
        salarioMensal: 2600.0,
        ofereceMoradia: false,
        cidadeDestino: 'Porto Alegre',
        ufDestino: 'RS',
        obiceListaTrabalhoEscravo: false,
        obiceCEIS_CNEP: false,
        declaracaoIntencoesAssinada: true,
      },
      tituloCargo: 'Auxiliar de Manutenção e Montagem',
      descricaoRequisitos:
        'Experiência básica em ferramentas manuais, elétrica ou manutenção predial e industrial.',
      cidade: 'Porto Alegre',
      uf: 'RS',
      salario: 2600.0,
    },
  ];

  static buscarVagasPorCidade(cidade: string, uf: string): VagaCadastrada[] {
    return this.vagasAtivas.filter(
      (v) =>
        v.cidade.toLowerCase() === cidade.toLowerCase() &&
        v.uf.toUpperCase() === uf.toUpperCase()
    );
  }

  static listarTodasVagas(): VagaCadastrada[] {
    return this.vagasAtivas;
  }

  static cadastrarVaga(vaga: VagaCadastrada) {
    this.vagasAtivas.push(vaga);
  }
}
