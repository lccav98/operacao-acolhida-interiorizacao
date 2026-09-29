import { Beneficiario } from '../../types';

export interface ItemFilaPrioritaria {
  beneficiario: Beneficiario;
  scorePrioridade: number;
  criteriosPontuados: string[];
}

export class MotorPriorizacaoAutomatizada {
  /**
   * Calcula a pontuação objetiva de prioridade conforme diretrizes da Operação Acolhida:
   * 1. Antiguidade no país (critério de desempate oficial)
   * 2. Residência em centros de acolhimento oficiais (Rondon 1, Rondon 5, Tuaranoko, Anexo Rondon 1 e BV-8)
   * 3. Composição familiar (crianças, gestantes, monoparentalidade)
   */
  static calcularPrioridade(beneficiario: Beneficiario): ItemFilaPrioritaria {
    let score = 0;
    const criterios: string[] = [];

    // 1. Antiguidade de Entrada (meses no Brasil)
    const dataEntrada = new Date(beneficiario.dataEntradaBrasil || '2021-01-01');
    const hoje = new Date();
    const mesesNoBrasil = Math.max(
      1,
      Math.floor((hoje.getTime() - dataEntrada.getTime()) / (1000 * 3600 * 24 * 30))
    );
    const pontosAntiguidade = Math.min(mesesNoBrasil * 5, 50); // Até 50 pontos
    score += pontosAntiguidade;
    criterios.push(`${mesesNoBrasil} meses no Brasil (+${pontosAntiguidade} pts)`);

    // 2. Abrigo Oficial SUFAI de Origem (Rondon 1, Rondon 5, Tuaranoko, Anexo Rondon 1, BV-8)
    const abrigosOficiais = ['rondon 1', 'rondon 5', 'tuaranoko', 'anexo rondon 1', 'bv-8', 'bv 8', 'bv8'];
    const abrigoLower = (beneficiario.abrigoOrigem || '').toLowerCase();
    if (abrigosOficiais.some(a => abrigoLower.includes(a))) {
      score += 40;
      criterios.push(`Residente em abrigo oficial SUFAI (${beneficiario.abrigoOrigem}) (+40 pts)`);
    } else if (beneficiario.abrigoOrigem) {
      score += 25;
      criterios.push(`Residente em alojamento transitório/outro: ${beneficiario.abrigoOrigem} (+25 pts)`);
    }

    // 3. Vulnerabilidade Familiar (Crianças e Gestantes)
    if (beneficiario.dependentesMenores.length > 0) {
      const ptsDependentes = beneficiario.dependentesMenores.length * 15;
      score += ptsDependentes;
      criterios.push(`${beneficiario.dependentesMenores.length} crianças/dependentes (+${ptsDependentes} pts)`);
    }

    if (beneficiario.saude.gestante) {
      score += 30;
      criterios.push('Beneficiária gestante (+30 pts)');
    }

    // 4. Regularidade Médica e Documental (Elegibilidade Imediata)
    if (beneficiario.documentacaoMigratoria.regular && beneficiario.cpf) {
      score += 20;
      criterios.push('Documentação migratória e CPF regulares (+20 pts)');
    }

    return {
      beneficiario,
      scorePrioridade: score,
      criteriosPontuados: criterios,
    };
  }

  /**
   * Ordena instantaneamente toda a base de beneficiários em ordem decrescente de prioridade
   */
  static ordenarFila(beneficiarios: Beneficiario[]): ItemFilaPrioritaria[] {
    return beneficiarios
      .map((b) => this.calcularPrioridade(b))
      .sort((a, b) => b.scorePrioridade - a.scorePrioridade);
  }

  /**
   * Gera a lista oficial pré-formatada para aprovação do SUFAI e despacho ao COMAE/CCLM
   */
  static gerarListaOficialEmbarque(
    itensFila: ItemFilaPrioritaria[],
    capacidadeVoo: number,
    codigoVoo: string,
    dataVoo: string
  ) {
    const selecionados = itensFila.slice(0, capacidadeVoo);
    const totalPessoas = selecionados.reduce(
      (acc, item) => acc + item.beneficiario.dependentesMenores.length + 1,
      0
    );

    return {
      codigoVoo,
      dataVoo,
      totalProcessos: selecionados.length,
      totalPassageiros: totalPessoas,
      passageiros: selecionados.map((item, index) => ({
        posicao: index + 1,
        id: item.beneficiario.id,
        nome: item.beneficiario.nome,
        protocoloPF: item.beneficiario.documentacaoMigratoria.numeroProtocolo,
        cpf: item.beneficiario.cpf,
        origem: item.beneficiario.localAtual,
        dependentes: item.beneficiario.dependentesMenores.length,
        scorePrioridade: item.scorePrioridade,
      })),
    };
  }
}
