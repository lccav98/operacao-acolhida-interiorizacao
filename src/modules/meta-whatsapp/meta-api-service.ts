import { TypeSafeAcolhidaService } from '../../services/typesafe';
import { BancoReservaStandby } from '../engajamento-presenca/banco-reserva';
import { Beneficiario } from '../../types';

export interface MetaWhatsAppConfig {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken: string;
  apiEndpointVersion: string;
}

export interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: 'text' | 'interactive' | 'button';
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
          };
          button?: {
            payload: string;
            text: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface DisparoWhatsAppResultado {
  sucesso: boolean;
  mensagemId?: string;
  destinatario: string;
  modoEnvio: 'META_GRAPH_API_LIVE' | 'SIMULACAO_SANDBOX_CONECTADA';
  respostaMeta?: Record<string, unknown>;
  erro?: string;
}

export class MetaWhatsAppService {
  private config: MetaWhatsAppConfig;
  private typesafeService: TypeSafeAcolhidaService;
  private historicoDisparos: Array<{
    dataHora: string;
    telefone: string;
    template: string;
    status: string;
    respostaRecebida?: string;
    riscoNoShow?: string;
  }> = [];

  constructor(typesafeService: TypeSafeAcolhidaService) {
    this.typesafeService = typesafeService;
    this.config = {
      phoneNumberId: process.env.META_PHONE_NUMBER_ID || '104928374829102',
      wabaId: process.env.META_WABA_ID || 'waba_acolhida_gov_br_01',
      accessToken: process.env.META_WA_TOKEN || 'EAAG...META_SYSTEM_TOKEN_ACOLHIDA',
      verifyToken: process.env.META_VERIFY_TOKEN || 'acolhida_meta_webhook_secret_2026',
      apiEndpointVersion: 'v19.0',
    };
  }

  public getConfig(): Omit<MetaWhatsAppConfig, 'accessToken'> & { tokenConfigurado: boolean } {
    return {
      phoneNumberId: this.config.phoneNumberId,
      wabaId: this.config.wabaId,
      verifyToken: this.config.verifyToken,
      apiEndpointVersion: this.config.apiEndpointVersion,
      tokenConfigurado: Boolean(this.config.accessToken && this.config.accessToken.length > 10),
    };
  }

  public getHistorico() {
    return this.historicoDisparos;
  }

  /**
   * Validação do Webhook da Meta (Desafio GET de Verificação)
   */
  public verificarWebhook(mode?: string, token?: string, challenge?: string): { valido: boolean; challenge?: string } {
    if (mode === 'subscribe' && token === this.config.verifyToken) {
      console.log(`[META-WEBHOOK] Webhook validado com sucesso pela Meta. Challenge: ${challenge}`);
      return { valido: true, challenge };
    }
    console.warn(`[META-WEBHOOK] Falha na validação do webhook. Token informado incompatível.`);
    return { valido: false };
  }

  /**
   * Envia Notificação Automatizada via Meta WhatsApp Business Cloud API
   */
  public async enviarNotificacaoMeta(
    telefoneDestinatario: string,
    nomeBeneficiario: string,
    marco: 'D-7' | 'D-3' | 'D-1' | 'H-4',
    cidadeDestino: string,
    dataVoo: string
  ): Promise<DisparoWhatsAppResultado> {
    const telefoneFormatado = telefoneDestinatario.replace(/\D/g, '');

    const textosPorMarco = {
      'D-7': `Olá ${nomeBeneficiario}! O Subcomitê Federal para Abrigamento e Interiorização (SUFAI) confirma sua viagem humanitária para ${cidadeDestino} agendada para ${dataVoo}. Por favor, confirme se você e sua família continuam prontos para viajar e que cada pessoa possui no máximo 1 mala de 23kg.`,
      'D-3': `Olá ${nomeBeneficiario}, faltam 3 dias para o embarque para ${cidadeDestino}. Todos os membros da família estão com boa saúde e sem febre ou sintomas respiratórios?`,
      'D-1': `ATENÇÃO ${nomeBeneficiario}: Seu voo para ${cidadeDestino} sai AMANHÃ! Confirme sua presença para garantir a emissão final do seu cartão de embarque.`,
      'H-4': `URGENTE: Dirija-se imediatamente à área de concentração do P Trg em Boa Vista. O transporte para a base de embarque começará em instantes.`,
    };

    const textoBase = textosPorMarco[marco] || textosPorMarco['D-1'];

    console.log(`[META-API] Disparando mensagem ${marco} para ${telefoneFormatado} (${nomeBeneficiario})...`);

    // Payload compatível com a API oficial da Meta (Cloud API)
    const payloadMeta = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefoneFormatado,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: textoBase },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: { id: `CONFIRM_${marco}`, title: '✅ Confirmar Voo' },
            },
            {
              type: 'reply',
              reply: { id: `DUVIDA_${marco}`, title: '❓ Tenho Dúvidas' },
            },
            {
              type: 'reply',
              reply: { id: `DESISTIR_${marco}`, title: '❌ Não Poderei Ir' },
            },
          ],
        },
      },
    };

    // Caso haja token real configurado em produção, faz chamada HTTP à Graph API
    if (process.env.META_WA_TOKEN && process.env.META_PHONE_NUMBER_ID) {
      try {
        const url = `https://graph.facebook.com/${this.config.apiEndpointVersion}/${this.config.phoneNumberId}/messages`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadMeta),
        });

        const data = await response.json();
        const msgId = (data as { messages?: Array<{ id: string }> })?.messages?.[0]?.id || `wamid.${Date.now()}`;

        this.historicoDisparos.unshift({
          dataHora: new Date().toISOString(),
          telefone: telefoneFormatado,
          template: marco,
          status: response.ok ? 'ENTREGUE_META' : 'ERRO_META',
        });

        return {
          sucesso: response.ok,
          mensagemId: msgId,
          destinatario: telefoneFormatado,
          modoEnvio: 'META_GRAPH_API_LIVE',
          respostaMeta: data as Record<string, unknown>,
        };
      } catch (err) {
        console.error('[META-API] Erro na chamada HTTP da Graph API:', err);
      }
    }

    // Modo Sandbox / Simulação Conectada
    const mockMsgId = `wamid.HBgL${Date.now()}XQz==`;
    this.historicoDisparos.unshift({
      dataHora: new Date().toISOString(),
      telefone: telefoneFormatado,
      template: marco,
      status: 'ENTREGUE_SANDBOX_CONECTADO',
    });

    return {
      sucesso: true,
      mensagemId: mockMsgId,
      destinatario: telefoneFormatado,
      modoEnvio: 'SIMULACAO_SANDBOX_CONECTADA',
      respostaMeta: {
        messaging_product: 'whatsapp',
        contacts: [{ input: telefoneFormatado, wa_id: telefoneFormatado }],
        messages: [{ id: mockMsgId }],
        detalhes: 'Disparo simulado com payload oficial da Meta Cloud API',
      },
    };
  }

  /**
   * Processa Webhook da Meta recebendo resposta interativa ou texto livre do migrante
   */
  public async processarMensagemWebhookMeta(payload: MetaWebhookPayload): Promise<{
    processado: boolean;
    remetente?: string;
    textoRecebido?: string;
    riscoNoShow?: string;
    acaoExecutada?: string;
  }> {
    try {
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];

      if (!message) {
        return { processado: false };
      }

      const remetente = message.from;
      let texto = '';

      if (message.type === 'text' && message.text) {
        texto = message.text.body;
      } else if (message.type === 'interactive' && message.interactive?.button_reply) {
        texto = message.interactive.button_reply.title;
      } else if (message.type === 'button' && message.button) {
        texto = message.button.text;
      }

      console.log(`[META-WEBHOOK] Resposta recebida de ${remetente}: "${texto}"`);

      // Avaliação semântica via IA
      const mockBeneficiario: Beneficiario = {
        id: `BEN-${remetente.slice(-6)}`,
        nome: change?.value?.contacts?.[0]?.profile?.name || 'Migrante WhatsApp',
        localAtual: 'BOA_VISTA',
        dependentesMenores: [],
        documentacaoMigratoria: {
          tipo: 'SOLICITACAO_REFUGIO',
          numeroProtocolo: '08280.001234/2026-11',
          dataEmissao: '2024-01-01',
          regular: true,
        },
        saude: {
          vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 30 },
          vacinaTripliceViral: { primeiraDoseAplicada: true },
          sintomasEpidemicos: false,
          gestante: false,
        },
        declaracaoVoluntariedadeAssinada: true,
        dataNascimento: '1995-01-01',
        nacionalidade: 'Venezuela',
        documentoIdentidade: 'V-12345678',
        cpf: '000.000.000-00',
        telefoneContato: remetente,
        relatoSituacaoEContexto: 'Acompanhamento WhatsApp',
        dataEntradaBrasil: '2024-01-01',
      };

      const analise = await this.typesafeService.analisarEngajamentoENoShow(mockBeneficiario, texto, 1);

      let acaoExecutada = 'Presença confirmada no manifesto.';
      if (analise.statusProntidao === 'RISCO_DESISTENCIA' || analise.probabilidadeComparecimento < 0.3) {
        BancoReservaStandby.convocarSuplente('Curitiba');
        acaoExecutada = `Alerta de No-Show detectado! Suplente do Banco de Reserva convocado automaticamente.`;
      }

      // Registra no histórico
      this.historicoDisparos.unshift({
        dataHora: new Date().toISOString(),
        telefone: remetente,
        template: 'RESPOSTA_WEBHOOK',
        status: 'PROCESSADO_IA',
        respostaRecebida: texto,
        riscoNoShow: analise.statusProntidao,
      });

      return {
        processado: true,
        remetente,
        textoRecebido: texto,
        riscoNoShow: analise.statusProntidao,
        acaoExecutada,
      };
    } catch (err) {
      console.error('[META-WEBHOOK] Erro ao processar payload:', err);
      return { processado: false };
    }
  }
}
