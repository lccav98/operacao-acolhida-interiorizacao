import {
  CodigoGrupoAbordagem,
  GrupoAbordagemInfo,
  RegistroAbrigadoRondon,
  AbrigadoClassificado,
} from '../../types/shelter';

export const GRUPOS_DEFINICAO: Record<CodigoGrupoAbordagem, GrupoAbordagemInfo> = {
  G1: {
    codigo: 'G1',
    nome: 'Proteção social',
    prioridadeEmpregabilidade: 'Baixa',
    criterioRegra: 'BPC ou benefício por incapacidade (relato ou Portal da Transparência)',
    abordagemSugerida:
      'Transição para a rede socioassistencial do destino (CRAS/CREAS); interiorização institucional. Inserção laboral não é meta primária; trabalho protegido apenas se houver interesse e aptidão.',
  },
  G2: {
    codigo: 'G2',
    nome: 'Gestante',
    prioridadeEmpregabilidade: 'Baixa (temporária)',
    criterioRegra: 'Grávida = 1',
    abordagemSugerida:
      'Pré-natal e proteção à gestante; inserção laboral após o parto. Priorizar reunião familiar/social; se houver companheiro no grupo, vaga de emprego sinalizada para ele.',
  },
  G3: {
    codigo: 'G3',
    nome: 'PCD com potencial laboral',
    prioridadeEmpregabilidade: 'Média',
    criterioRegra: 'PCD = 1, sem BPC',
    abordagemSugerida:
      'Avaliação funcional; intermediação com empresas obrigadas à cota PCD (Lei 8.213/91, art. 93 – empresas com 100+ empregados).',
  },
  G4: {
    codigo: 'G4',
    nome: 'Longa permanência 45+',
    prioridadeEmpregabilidade: 'Baixa',
    criterioRegra: 'Mais de 180 dias abrigado e 45 anos ou mais',
    abordagemSugerida:
      'Plano individual de saída com prazo pactuado; vagas de baixa exigência física (portaria, zeladoria, agricultura/cooperativas) ou microcrédito; sem vaga, interiorização institucional.',
  },
  G5: {
    codigo: 'G5',
    nome: 'Permanência prolongada – revisão',
    prioridadeEmpregabilidade: 'Média',
    criterioRegra: 'Mais de 90 dias abrigado (demais casos)',
    abordagemSugerida:
      'Diagnóstico caso a caso: documentação (CTPS), recusas de vaga, saúde, qualificação. Após diagnóstico, reencaminhar ao grupo adequado com prazo de saída.',
  },
  G6: {
    codigo: 'G6',
    nome: 'Monoparental – responsável',
    prioridadeEmpregabilidade: 'Média',
    criterioRegra: 'Ponto focal de família monoparental com criança',
    abordagemSugerida:
      'Vaga de emprego sinalizada condicionada a creche/escola no destino; alternativa: reunião social/familiar com rede de apoio para cuidado dos filhos.',
  },
  G7: {
    codigo: 'G7',
    nome: '45+ recém-chegado',
    prioridadeEmpregabilidade: 'Média',
    criterioRegra: '45 anos ou mais, até 90 dias abrigado',
    abordagemSugerida:
      'Vaga de emprego sinalizada com empregadores receptivos a 45+; valorizar experiência prévia; qualificação curta com compromisso de contratação.',
  },
  G8: {
    codigo: 'G8',
    nome: 'Família – adulto 18–44',
    prioridadeEmpregabilidade: 'Alta',
    criterioRegra: 'Integrante adulto de família ou casal, 18–44 anos, até 90 dias',
    abordagemSugerida:
      'Vaga de emprego sinalizada familiar (destino que comporte o grupo). Ponto focal = provedor principal; demais adultos = emprego complementar ou qualificação.',
  },
  G9: {
    codigo: 'G9',
    nome: 'Desacompanhado 18–44',
    prioridadeEmpregabilidade: 'Alta',
    criterioRegra: 'Homem/mulher desacompanhado, 18–44 anos, até 90 dias',
    abordagemSugerida:
      'Vaga de emprego sinalizada prioritária; triagem de documentação e ofício na 1ª semana; qualificação (sistema S) só com vaga vinculada.',
  },
};

export class ClassificadorAbrigadosRondon {
  /**
   * Classifica o abrigado seguindo estritamente a ordem de precedência G1 -> G9
   */
  static classificar(registro: RegistroAbrigadoRondon): AbrigadoClassificado {
    let codigo: CodigoGrupoAbordagem;

    const temBpc =
      (registro.beneficiosRelato && registro.beneficiosRelato.toUpperCase().includes('BPC')) ||
      (registro.beneficiosPortal && registro.beneficiosPortal.toUpperCase().includes('BPC')) ||
      (registro.beneficiosRelato &&
        registro.beneficiosRelato.toUpperCase().includes('INCAPACIDADE'));

    const eMonoparentalComCrianca =
      registro.perfilFamiliar.includes('FMC') ||
      registro.perfilFamiliar.includes('FMCA') ||
      registro.perfilFamiliar.includes('FMCAA');

    const ePontoFocal =
      registro.relacionamento.toLowerCase().includes('ponto focal');

    const eDesacompanhado =
      registro.perfilFamiliar.startsWith('HD') ||
      registro.perfilFamiliar.startsWith('MD') ||
      registro.perfilFamiliar.startsWith('HCiGD') ||
      registro.perfilFamiliar.startsWith('MTD');

    // 1. G1: Proteção Social
    if (temBpc) {
      codigo = 'G1';
    }
    // 2. G2: Gestante
    else if (registro.gravida) {
      codigo = 'G2';
    }
    // 3. G3: PCD com potencial laboral
    else if (registro.pcd && !temBpc) {
      codigo = 'G3';
    }
    // 4. G4: Longa permanência 45+
    else if (registro.diasAbrigado > 180 && registro.idade >= 45) {
      codigo = 'G4';
    }
    // 5. G5: Permanência prolongada - revisão
    else if (registro.diasAbrigado > 90) {
      codigo = 'G5';
    }
    // 6. G6: Monoparental - responsável
    else if (eMonoparentalComCrianca && ePontoFocal) {
      codigo = 'G6';
    }
    // 7. G7: 45+ recém-chegado
    else if (registro.idade >= 45 && registro.diasAbrigado <= 90) {
      codigo = 'G7';
    }
    // 8. G8: Família - adulto 18-44
    else if (!eDesacompanhado && registro.idade >= 18 && registro.idade <= 44 && registro.diasAbrigado <= 90) {
      codigo = 'G8';
    }
    // 9. G9: Desacompanhado 18-44
    else {
      codigo = 'G9';
    }

    const grupoInfo = GRUPOS_DEFINICAO[codigo];

    // Calcula a prioridade para desabrigamento e interiorização
    // A prioridade para interiorização é máxima para quem está no abrigo há mais tempo e em situação de vulnerabilidade
    let scorePrioridade = 100; // Base abrigado
    scorePrioridade += Math.min(Math.floor(registro.diasAbrigado / 5), 150); // Até +150 pontos por dias abrigado!

    if (codigo === 'G1') scorePrioridade += 60; // Máxima prioridade de proteção social
    if (codigo === 'G2') scorePrioridade += 50; // Gestantes
    if (codigo === 'G6') scorePrioridade += 45; // Mães solo com filhos
    if (codigo === 'G4') scorePrioridade += 40; // Longa permanência
    if (codigo === 'G8') scorePrioridade += 30; // Famílias com crianças
    if (codigo === 'G9') scorePrioridade += 20; // Jovens ativos

    // Define a modalidade prioritária
    let modalidade: 'INSTITUCIONAL' | 'REUNIFICACAO_FAMILIAR' | 'REUNIAO_SOCIAL' | 'VAGA_EMPREGO_SINALIZADA' =
      'VAGA_EMPREGO_SINALIZADA';

    if (codigo === 'G1' || (codigo === 'G4' && registro.diasAbrigado > 365)) {
      modalidade = 'INSTITUCIONAL'; // Vagas de proteção CRAS/CREAS ou abrigo-abrigo
    } else if (codigo === 'G2') {
      modalidade = 'REUNIFICACAO_FAMILIAR'; // Priorizar acolhida familiar com apoio pré-natal
    } else {
      modalidade = 'VAGA_EMPREGO_SINALIZADA';
    }

    return {
      ...registro,
      grupo: grupoInfo,
      modalidadeRecomendada: modalidade,
      scorePrioridadeInteriorizacao: scorePrioridade,
      planoAcaoSugerido: grupoInfo.abordagemSugerida,
    };
  }

  /**
   * Classifica em lote todo o contingente do abrigo e gera estatísticas imediatas
   */
  static classificarContingente(registros: RegistroAbrigadoRondon[]): {
    total: number;
    classificados: AbrigadoClassificado[];
    estatisticasPorGrupo: Record<CodigoGrupoAbordagem, { nome: string; quantidade: number; mediaDias: number }>;
  } {
    const classificados = registros.map((r) => this.classificar(r));

    const stats: Record<CodigoGrupoAbordagem, { nome: string; quantidade: number; mediaDias: number }> = {
      G1: { nome: 'Proteção social', quantidade: 0, mediaDias: 0 },
      G2: { nome: 'Gestante', quantidade: 0, mediaDias: 0 },
      G3: { nome: 'PCD com potencial laboral', quantidade: 0, mediaDias: 0 },
      G4: { nome: 'Longa permanência 45+', quantidade: 0, mediaDias: 0 },
      G5: { nome: 'Permanência prolongada – revisão', quantidade: 0, mediaDias: 0 },
      G6: { nome: 'Monoparental – responsável', quantidade: 0, mediaDias: 0 },
      G7: { nome: '45+ recém-chegado', quantidade: 0, mediaDias: 0 },
      G8: { nome: 'Família – adulto 18–44', quantidade: 0, mediaDias: 0 },
      G9: { nome: 'Desacompanhado 18–44', quantidade: 0, mediaDias: 0 },
    };

    const somasDias: Record<CodigoGrupoAbordagem, number> = {
      G1: 0, G2: 0, G3: 0, G4: 0, G5: 0, G6: 0, G7: 0, G8: 0, G9: 0,
    };

    classificados.forEach((c) => {
      const g = c.grupo.codigo;
      stats[g].quantidade++;
      somasDias[g] += c.diasAbrigado;
    });

    Object.keys(stats).forEach((k) => {
      const g = k as CodigoGrupoAbordagem;
      if (stats[g].quantidade > 0) {
        stats[g].mediaDias = Math.round(somasDias[g] / stats[g].quantidade);
      }
    });

    return {
      total: classificados.length,
      classificados: classificados.sort(
        (a, b) => b.scorePrioridadeInteriorizacao - a.scorePrioridadeInteriorizacao
      ),
      estatisticasPorGrupo: stats,
    };
  }
}
