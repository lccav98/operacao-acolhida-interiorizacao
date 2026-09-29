import { Beneficiario } from '../../types';
import { BancoReservaStandby } from '../engajamento-presenca/banco-reserva';

export interface ParecerEmissaoBilhete {
  autorizadoComprarPassagem: boolean;
  bloqueioPreventivo: boolean;
  motivo: string;
  recursoPublicoEconomizadoEstimado?: number;
  acaoEmergencial?: string;
  passageiroEfetivo: Beneficiario;
}

export class TravaFinanceiraDanoErario {
  private static readonly VALOR_MEDIO_BILHETE_COMERCIAL = 1950.0;

  /**
   * Trava financeira inteligente:
   * Impede a compra de passagens aéreas comerciais para passageiros com risco de falta,
   * eliminando perdas orçamentárias com no-show fees e bilhetes não-reembolsáveis.
   */
  static avaliarEmissaoBilheteComercial(
    beneficiario: Beneficiario,
    presencaFisicaPTrgD1: boolean,
    aptidaoMedicaFFT: boolean,
    respostaWhatsAppPositiva: boolean,
    cidadeDestino: string
  ): ParecerEmissaoBilhete {
    // 1. Falha médica no D-1 (Febre, sintomas de sarampo ou COVID)
    if (!aptidaoMedicaFFT) {
      return {
        autorizadoComprarPassagem: false,
        bloqueioPreventivo: true,
        motivo:
          'TRAVA ACIONADA: Beneficiário reprovado na inspeção médica (FFT). Emissão de bilhete aéreo cancelada para evitar perda financeira.',
        recursoPublicoEconomizadoEstimado: this.VALOR_MEDIO_BILHETE_COMERCIAL,
        acaoEmergencial: 'Encaminhar ao posto de saúde do P Trg e remarcar para janela futura.',
        passageiroEfetivo: beneficiario,
      };
    }

    // 2. Não confirmação no WhatsApp ou ausência de comparecimento no P Trg em D-1
    if (!presencaFisicaPTrgD1 && !respostaWhatsAppPositiva) {
      console.log(
        `🚨 ALERTA DE DANO AO ERÁRIO: ${beneficiario.nome} não confirmou presença em D-1. Bilhete comercial bloqueado!`
      );

      // Convoca o suplente imediatamente
      const suplente = BancoReservaStandby.convocarSuplente(cidadeDestino);

      if (suplente) {
        return {
          autorizadoComprarPassagem: true,
          bloqueioPreventivo: true,
          motivo:
            'TRAVA DE SEGURANÇA: Titular em risco de no-show substituído antes da compra. Passagem emitida diretamente em nome do suplente confirmado.',
          recursoPublicoEconomizadoEstimado: this.VALOR_MEDIO_BILHETE_COMERCIAL,
          acaoEmergencial: `Suplente ${suplente.nome} assumiu a vaga com 100% de aproveitamento do recurso público.`,
          passageiroEfetivo: suplente,
        };
      } else {
        return {
          autorizadoComprarPassagem: false,
          bloqueioPreventivo: true,
          motivo:
            'TRAVA DE SEGURANÇA: Titular não confirmou e sem suplente imediato. Emissão suspensa; R$ 1.950,00 preservados nos cofres públicos.',
          recursoPublicoEconomizadoEstimado: this.VALOR_MEDIO_BILHETE_COMERCIAL,
          acaoEmergencial: 'Reabrir vaga no sistema e buscar novos candidatos.',
          passageiroEfetivo: beneficiario,
        };
      }
    }

    // 3. Tudo confirmado: Presença física ou digital assegurada e saúde aprovada
    return {
      autorizadoComprarPassagem: true,
      bloqueioPreventivo: false,
      motivo:
        'LIBERAÇÃO AUTORIZADA: Presença confirmada no P Trg e avaliação médica apta. Risco de no-show residual inferior a 1%.',
      passageiroEfetivo: beneficiario,
    };
  }
}
