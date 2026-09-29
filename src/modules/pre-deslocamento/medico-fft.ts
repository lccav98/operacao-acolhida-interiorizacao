import { RegistroSaude } from '../../types';

export interface ResultadoFFT {
  aptoParaViagem: boolean;
  motivoInaptidao?: string;
  orientacoesMedicas: string[];
  medidasSanitariasTomadas: string[];
}

export class AvaliadorMedicoFFT {
  /**
   * Avaliação de Fitness for Travel (FFT) / Pronto Para Viagem (PPV)
   * Diretrizes do Ministério da Saúde, Ministério da Defesa e OIM
   */
  static avaliar(saude: RegistroSaude): ResultadoFFT {
    const orientacoes: string[] = [];
    const medidas: string[] = [];

    // 1. Verificação de Febre Amarela (Mínimo 10 dias da aplicação)
    if (!saude.vacinaFebreAmarela.aplicada) {
      return {
        aptoParaViagem: false,
        motivoInaptidao: 'Ausência de vacina contra Febre Amarela.',
        orientacoesMedicas: ['Encaminhar para imunização imediata no P Trg.'],
        medidasSanitariasTomadas: ['Retenção temporária no cronograma de embarque.'],
      };
    }

    if (saude.vacinaFebreAmarela.diasDesdeDose < 10) {
      return {
        aptoParaViagem: false,
        motivoInaptidao: `Vacina de Febre Amarela recente (${saude.vacinaFebreAmarela.diasDesdeDose} dias). Prazo sanitário mínimo é de 10 dias.`,
        orientacoesMedicas: [
          `Aguardar mais ${10 - saude.vacinaFebreAmarela.diasDesdeDose} dia(s) para liberação do embarque.`,
        ],
        medidasSanitariasTomadas: ['Remarcação de voo para próxima janela de embarque.'],
      };
    }
    medidas.push('Vacina de Febre Amarela validada com janela sanitária correta (>= 10 dias).');

    // 2. Verificação de Tríplice Viral (Sarampo, Caxumba, Rubéola)
    if (!saude.vacinaTripliceViral.primeiraDoseAplicada) {
      return {
        aptoParaViagem: false,
        motivoInaptidao: 'Ausência da primeira dose da vacina Tríplice Viral.',
        orientacoesMedicas: ['Administrar dose imediatamente no posto de saúde da triagem.'],
        medidasSanitariasTomadas: ['Agendar revisão clínica após aplicação.'],
      };
    }
    medidas.push('Primeira dose da Tríplice Viral confirmada.');

    // 3. Sintomas de Doenças Epidêmicas / Contagiosas (COVID-19, Sarampo, etc.)
    if (saude.sintomasEpidemicos) {
      return {
        aptoParaViagem: false,
        motivoInaptidao: 'Presença de sintomas de doença contagiosa ou epidêmica.',
        orientacoesMedicas: [
          'Encaminhar para isolamento preventivo e avaliação clínica pela equipe de saúde da Força-Tarefa.',
        ],
        medidasSanitariasTomadas: ['Notificação à vigilância epidemiológica local.'],
      };
    }

    // 4. Orientações para Gestantes (Diretriz UNFPA)
    if (saude.gestante) {
      orientacoes.push(
        'Beneficiária gestante: fornecimento prévio de orientações em saúde reprodutiva, caderneta de gestante e suporte pelo UNFPA.'
      );
    }

    // 5. Necessidades especiais ou condições crônicas
    if (saude.necessidadesEspeciais && saude.necessidadesEspeciais.length > 0) {
      orientacoes.push(
        `Necessidades especiais registradas: ${saude.necessidadesEspeciais.join(', ')}. Notificar equipe de solo no destino para apoio de mobilidade.`
      );
    }

    return {
      aptoParaViagem: true,
      orientacoesMedicas: orientacoes,
      medidasSanitariasTomadas: medidas,
    };
  }
}
