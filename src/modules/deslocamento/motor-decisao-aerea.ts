import { Beneficiario } from '../../types';

export type ModalContratual =
  | 'FRETAMENTO_SIDERAL'
  | 'FAB_CCLM'
  | 'COMERCIAL_REGULAR_OIM';

export interface DecisaoLogisticaAerea {
  modalEscolhido: ModalContratual;
  operadora: string;
  cidadeDestino: string;
  ufDestino: string;
  quantidadePassageirosLote: number;
  taxaOcupacaoEstimada?: number;
  custoMedioPorPassageiroEst: number;
  justificativaEconomica: string;
  mitigacaoDanoAoErario: string[];
}

export class MotorDecisaoAerea {
  // Cidades autorizadas e contratadas pela Sideral Linhas Aéreas
  private static readonly DESTINOS_CONTRATUAIS_SIDERAL = [
    'curitiba',
    'florianopolis',
    'florianópolis',
    'porto alegre',
  ];

  // Capacidade máxima estrita das aeronaves
  private static readonly CAPACIDADE_MAXIMA_BOEING_SIDERAL = 144;
  private static readonly CAPACIDADE_MAXIMA_FAB_KC390 = 80;
  private static readonly QUORUM_MINIMO_FRETAMENTO = 60; // Limiar de viabilidade mínima antes da complementação compulsória

  /**
   * Decide automaticamente o melhor modal aéreo ponderando o contrato da Sideral,
   * a capacidade da FAB, os custos de voos comerciais e a regra de ouro:
   * "Os voos da Sideral e da FAB devem sair SEMPRE com LOTAÇÃO MÁXIMA (100% de ocupação)."
   */
  static decidirModalAereo(
    cidadeDestino: string,
    ufDestino: string,
    demandaAcumuladaDestino: Beneficiario[]
  ): DecisaoLogisticaAerea {
    const cidadeFormatada = cidadeDestino.trim().toLowerCase();
    const eDestinoSideral = this.DESTINOS_CONTRATUAIS_SIDERAL.includes(cidadeFormatada);
    const totalPassageirosIniciais = demandaAcumuladaDestino.reduce(
      (acc, b) => acc + b.dependentesMenores.length + 1,
      0
    );

    // REGRA 1: Destinos Contratuais Sideral (Curitiba, Florianópolis, Porto Alegre)
    if (eDestinoSideral) {
      if (totalPassageirosIniciais >= this.QUORUM_MINIMO_FRETAMENTO) {
        const vagasComplementadas = Math.max(0, this.CAPACIDADE_MAXIMA_BOEING_SIDERAL - totalPassageirosIniciais);
        const totalFinalEmbarque = this.CAPACIDADE_MAXIMA_BOEING_SIDERAL; // Sempre 144 passageiros (Lotação Máxima)
        const suplentesBancoReserva = Math.round(this.CAPACIDADE_MAXIMA_BOEING_SIDERAL * 0.15); // +22 suplentes no P Trg

        return {
          modalEscolhido: 'FRETAMENTO_SIDERAL',
          operadora: 'Sideral Linhas Aéreas (Boeing 737 Fretado)',
          cidadeDestino,
          ufDestino,
          quantidadePassageirosLote: totalFinalEmbarque,
          taxaOcupacaoEstimada: 100, // Lotação Máxima Obrigatória
          custoMedioPorPassageiroEst: 1150.0, // Custo rateado ótimo com aeronave 100% cheia
          justificativaEconomica:
            `Destino contratual da Sideral (${cidadeDestino}). REGRA DE OURO ATIVADA: Voo programado com LOTAÇÃO MÁXIMA OBRIGATÓRIA (144/144 assentos = 100% de ocupação). Demanda inicial (${totalPassageirosIniciais}) complementada com ${vagasComplementadas} beneficiários prioritários convocados dos 5 abrigos oficiais.`,
          mitigacaoDanoAoErario: [
            `Lotação Máxima Garantida: Aeronave decolará impreterivelmente com 144 passageiros a bordo (100% ocupada)`,
            `Acionamento de Busca Ativa nos 5 Abrigos (Rondon 1, Rondon 5, Tuaranoko, Anexo Rondon 1 e BV-8) para preencher os ${vagasComplementadas} assentos complementares`,
            `Convocação de ${suplentesBancoReserva} suplentes pré-triados (Banco de Reserva) no P Trg para absorção imediata de no-shows de última hora`,
            `Trava Operacional do SUFAI: Proibida a liberação do plano de voo no SCDP sem o manifesto com 144 passageiros confirmados`,
          ],
        };
      } else {
        // Quórum insuficiente para a Sideral: fretar aeronave quase vazia gera alto dano ao erário!
        return {
          modalEscolhido: 'COMERCIAL_REGULAR_OIM',
          operadora: 'Cias Aéreas Comerciais (LATAM/GOL/AZUL) saindo de Boa Vista-RR',
          cidadeDestino,
          ufDestino,
          quantidadePassageirosLote: totalPassageirosIniciais,
          custoMedioPorPassageiroEst: 1850.0,
          justificativaEconomica:
            `Destino no contrato da Sideral, porém o quórum atual (${totalPassageirosIniciais} pessoas) está abaixo do ponto mínimo para atingir lotação máxima sem ociosidade. Compra de assentos comerciais individuais acionada para evitar aeronave voando abaixo de 100%.`,
          mitigacaoDanoAoErario: [
            'Trava financeira: Emissão do bilhete comercial apenas 24h antes após comparecimento físico ao P Trg',
            'Não emissão de bilhetes sem confirmação ativa D-1 no WhatsApp',
            'Bilhetes emitidos com franquia de bagagem pré-negociada para evitar taxas extras no balcão',
          ],
        };
      }
    }

    // REGRA 2: Demais Cidades do Brasil (Atendimento via FAB CCLM ou Linha Comercial)
    if (totalPassageirosIniciais >= 50) {
      const vagasComplementadasFAB = Math.max(0, this.CAPACIDADE_MAXIMA_FAB_KC390 - totalPassageirosIniciais);
      const totalFinalFAB = this.CAPACIDADE_MAXIMA_FAB_KC390; // Sempre 80 passageiros (Lotação Máxima KC-390)
      const suplentesReservaFAB = Math.round(this.CAPACIDADE_MAXIMA_FAB_KC390 * 0.15); // +12 suplentes

      return {
        modalEscolhido: 'FAB_CCLM',
        operadora: 'Força Aérea Brasileira (Aeronave Militar KC-390 / CCLM)',
        cidadeDestino,
        ufDestino,
        quantidadePassageirosLote: totalFinalFAB,
        taxaOcupacaoEstimada: 100, // Lotação Máxima Obrigatória na FAB
        custoMedioPorPassageiroEst: 800.0, // Custo logístico operacional militar
        justificativaEconomica:
          `Destino não coberto pela Sideral (${cidadeDestino}-${ufDestino}). Apoio da FAB acionado com LOTAÇÃO MÁXIMA OBRIGATÓRIA (80/80 assentos = 100% de ocupação). Demanda inicial (${totalPassageirosIniciais}) complementada com ${vagasComplementadasFAB} passageiros adicionais da fila prioritária dos abrigos.`,
        mitigacaoDanoAoErario: [
          `Lotação Máxima da FAB: Aeronave decolará com 100% de capacidade (80 assentos preenchidos)`,
          `Mobilização de ${suplentesReservaFAB} suplentes do Banco de Reserva na Base Aérea de Boa Vista`,
          `Integração direta com o CCLM/Defesa para aproveitamento de rotas e missões de retorno`,
        ],
      };
    } else {
      return {
        modalEscolhido: 'COMERCIAL_REGULAR_OIM',
        operadora: 'Cias Aéreas Comerciais (Linha Regular) saindo de Boa Vista-RR',
        cidadeDestino,
        ufDestino,
        quantidadePassageirosLote: totalPassageirosIniciais,
        custoMedioPorPassageiroEst: 1950.0,
        justificativaEconomica:
          `Destino fora da malha Sideral com demanda pontual/fracionada (${totalPassageirosIniciais} pessoas). Atendimento viabilizado por compra de passagens comerciais com saída do Aeroporto de Boa Vista (BVB).`,
        mitigacaoDanoAoErario: [
          'Trava anti-no-show ativada: emissão apenas após validação de aptidão física (FFT) e presença física confirmada no P Trg',
          'Suplente do Banco de Reserva em stand-by com passagem pré-reservada em caso de desistência',
        ],
      };
    }
  }
}
