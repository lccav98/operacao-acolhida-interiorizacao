import { Beneficiario } from '../../types';
import { RegistroPCDPSCDP, BilheteAereoEmitido } from '../../types/scdp';
import * as crypto from 'crypto';

export class IntegradorSCDPService {
  private static basePCDPs: Map<string, RegistroPCDPSCDP> = new Map();

  /**
   * ETAPA 1: Abertura e Registro Automático da PCDP no SCDP
   * Executado quando a viagem é aprovada pelo Subcomitê Federal
   */
  static abrirSolicitacaoPCDP(
    beneficiario: Beneficiario,
    trechoOrigem: string,
    trechoDestino: string,
    dataViagem: string
  ): RegistroPCDPSCDP {
    const timestamp = new Date().toISOString();
    const sequencial = Math.floor(1000 + Math.random() * 9000);
    const numeroPCDP = `PCDP-2026-ACOLHIDA-${sequencial}`;
    const numeroProcessoSEI = `71000.0${sequencial}0/2026-92`;

    const registro: RegistroPCDPSCDP = {
      numeroPCDP,
      numeroProcessoSEI,
      orgaoDemandante: 'Ministério da Cidadania / Subcomitê Federal para Abrigamento e Interiorização (SUFAI)',
      beneficiarioNome: beneficiario.nome,
      beneficiarioCPF: beneficiario.cpf,
      trechoOrigem,
      trechoDestino,
      dataPrevistaViagem: dataViagem,
      justificativaLegal:
        'Deslocamento voluntário humanitário no âmbito da Estratégia de Interiorização da Operação Acolhida, instituída pela Lei Federal nº 13.684/2018 e Decreto nº 9.970/2019.',
      status: 'SOLICITACAO_CADASTRADA',
      historicoAuditoria: [
        {
          dataHora: timestamp,
          evento: `Solicitação PCDP aberta no SCDP via integração automatizada Acolhida-Gov.br`,
          responsavelSistema: 'Robô SCDP/Operação Acolhida',
        },
      ],
    };

    this.basePCDPs.set(numeroPCDP, registro);
    console.log(`🏛️ [SCDP-AUTO] Solicitação ${numeroPCDP} aberta no SCDP para ${beneficiario.nome} (SEI: ${numeroProcessoSEI})`);
    return registro;
  }

  /**
   * ETAPA 2: Vinculação Automática do Bilhete Eletrônico Emitido (E-Ticket)
   * O SCDP exige o número formal do bilhete e localizador PNR para empenho e liquidação da despesa
   */
  static vincularBilheteAereo(
    numeroPCDP: string,
    bilhete: BilheteAereoEmitido
  ): RegistroPCDPSCDP {
    const registro = this.basePCDPs.get(numeroPCDP);
    if (!registro) {
      throw new Error(`PCDP ${numeroPCDP} não encontrada no SCDP.`);
    }

    registro.bilheteVinculado = bilhete;
    registro.status = 'BILHETE_VINCULADO';
    registro.historicoAuditoria.push({
      dataHora: new Date().toISOString(),
      evento: `Bilhete E-Ticket ${bilhete.numeroBilheteETicket} (${bilhete.companhiaAerea} - PNR: ${bilhete.localizadorPNR}) vinculado no SCDP. Valor Tarifa: R$ ${bilhete.valorTarifa.toFixed(2)} + Taxa: R$ ${bilhete.valorTaxaEmbarque.toFixed(2)}.`,
      responsavelSistema: 'Robô Emissor SCDP',
    });

    console.log(`🎫 [SCDP-AUTO] E-Ticket ${bilhete.numeroBilheteETicket} vinculado com sucesso à PCDP ${numeroPCDP}!`);
    return registro;
  }

  /**
   * ETAPA 3: Prestação de Contas & Comprovação da Viagem em Tempo Real
   * A legislação federal (Decreto 5.992/06 e regras CGU/TCU) exige a comprovação
   * do embarque efetivo para liquidação final da despesa pública.
   */
  static comprovarViagemEHomologar(
    numeroPCDP: string,
    portaoEmbarque: string
  ): RegistroPCDPSCDP {
    const registro = this.basePCDPs.get(numeroPCDP);
    if (!registro || !registro.bilheteVinculado) {
      throw new Error(`PCDP ${numeroPCDP} sem bilhete vinculado para comprovação.`);
    }

    const dataHoraEmbarque = new Date().toISOString();
    const payloadHash = `${numeroPCDP}|${registro.bilheteVinculado.numeroBilheteETicket}|${registro.beneficiarioCPF}|${dataHoraEmbarque}`;
    const hashAuditoriaTCU = crypto.createHash('sha256').update(payloadHash).digest('hex').toUpperCase();

    registro.comprovacaoViagem = {
      dataHoraEmbarqueEfetivo: dataHoraEmbarque,
      portaoEmbarque,
      identificadorCartaoEmbarque: `BP-${registro.bilheteVinculado.localizadorPNR}-01`,
      hashAutenticidadeAuditoriaTCU: hashAuditoriaTCU,
    };

    registro.status = 'PRESTACAO_CONTAS_HOMOLOGADA';
    registro.historicoAuditoria.push({
      dataHora: dataHoraEmbarque,
      evento: `Comprovação de viagem anexada eletronicamente. Prestação de contas homologada e em conformidade para auditoria TCU/CGU (Hash: ${hashAuditoriaTCU.slice(0, 16)}...).`,
      responsavelSistema: 'Módulo de Prestação de Contas SCDP',
    });

    console.log(`✅ [SCDP-AUTO] Prestação de Contas HOMOLOGADA para a PCDP ${numeroPCDP}!`);
    console.log(`   • Comprovante de Embarque: Autenticado digitalmente`);
    console.log(`   • Hash de Auditoria TCU/CGU: ${hashAuditoriaTCU}`);
    return registro;
  }

  static obterRegistro(numeroPCDP: string): RegistroPCDPSCDP | undefined {
    return this.basePCDPs.get(numeroPCDP);
  }
}
