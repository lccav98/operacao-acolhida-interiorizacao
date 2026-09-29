import { Beneficiario, MarcoTemporalLembrete, MensagemAntiAbsenteismo } from '../../types';

export class NotificadorAntiAbsenteismo {
  /**
   * Gera a mensagem personalizada de engajamento conforme o marco temporal
   */
  static gerarMensagem(
    beneficiario: Beneficiario,
    marco: MarcoTemporalLembrete,
    dataVoo: string,
    cidadeDestino: string
  ): MensagemAntiAbsenteismo {
    let texto = '';
    const nomePrimeiro = beneficiario.nome.split(' ')[0];

    switch (marco) {
      case 'D_MENOS_7':
        texto =
          `¡Hola ${nomePrimeiro}! 👋 Su viaje de interiorización a ${cidadeDestino} está programado para el ${dataVoo}. ` +
          `Por favor, confirme que sus documentos originales están listos y que su equipaje cumple con las normas: ` +
          `máximo 23kg por maleta despachada y NINGÚN objeto cortante en la maleta de mano. ` +
          `¿Tiene alguna duda o confirma su viaje? Responda este mensaje.`;
        break;

      case 'D_MENOS_3':
        texto =
          `¡Atención ${nomePrimeiro}! 🩺 Faltan 3 días para su vuelo. Mañana debe presentarse en el P Trg para su ` +
          `evaluación médica final (FFT) y verificación de vacunas (Fiebre Amarilla y Triple Viral). ` +
          `¿Usted o algún miembro de su familia presenta fiebre o tos? Responda SÍ o NO.`;
        break;

      case 'D_MENOS_1':
        texto =
          `¡Último paso ${nomePrimeiro}! ✈️ Su vuelo a ${cidadeDestino} sale MAÑANA. ` +
          `El punto de encuentro para el transporte hacia la Base Aérea es en el P Trg a las 06:00 AM. ` +
          `Se ofrecerá alimentación previa al embarque. Por favor, confirme que toda su familia estará presente.`;
        break;

      case 'H_MENOS_4':
        texto =
          `🚌 ¡El autobús para la Base Aérea saldrá en 1 hora del P Trg! ` +
          `Tenga sus documentos en mano y las maletas etiquetadas. Recuerde: no está permitido fumar ni tomar fotos ` +
          `dentro de las instalaciones militares sin autorización. ¡Buen viaje!`;
        break;
    }

    return {
      marco,
      telefoneDestino: beneficiario.telefoneContato,
      idioma: 'ESPANHOL',
      conteudoMensagem: texto,
      canal: 'WHATSAPP',
      dataEnvioPrevista: new Date().toISOString(),
      statusEnvio: 'ENVIADO',
    };
  }
}
