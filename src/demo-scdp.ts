import { IntegradorSCDPService } from './modules/conformidade-federal/scdp-service';
import { Beneficiario } from './types';
import { BilheteAereoEmitido } from './types/scdp';

async function main() {
  console.log(`\n################################################################`);
  console.log(`### AUTOMAÇÃO INTEGRAL SCDP - SISTEMA DE DIÁRIAS E PASSAGENS  ###`);
  console.log(`###   VINCULAÇÃO DE BILHETE, COMPROVAÇÃO DE VIAGEM E TCU/CGU   ###`);
  console.log(`################################################################\n`);

  const beneficiarioPassageiro: Beneficiario = {
    id: 'BEN-SCDP-001',
    nome: 'Carlos Eduardo Mendoza',
    dataNascimento: '1991-07-23',
    nacionalidade: 'Venezuelana',
    documentoIdentidade: 'V-22.345.678',
    cpf: '789.012.345-67',
    telefoneContato: '+55 95 99111-3322',
    declaracaoVoluntariedadeAssinada: true,
    localAtual: 'BOA_VISTA',
    abrigoOrigem: 'Rondon 1',
    dataEntradaBrasil: '2021-02-10',
    documentacaoMigratoria: {
      tipo: 'SOLICITACAO_REFUGIO',
      numeroProtocolo: 'PROTO-PF-2021/77881',
      dataEmissao: '2021-02-15',
      regular: true,
    },
    dependentesMenores: [],
    saude: {
      vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 35 },
      vacinaTripliceViral: { primeiraDoseAplicada: true },
      sintomasEpidemicos: false,
      gestante: false,
    },
    relatoSituacaoEContexto: 'Passagem aérea comercial emitida com recursos federais da Operação Acolhida.',
  };

  // =========================================================================
  // FASE 1: REGISTRO DA SOLICITAÇÃO PCDP NO SCDP
  // =========================================================================
  console.log(`================================================================`);
  console.log(`>>> ETAPA 1: REGISTRO DA PROPOSTA NO SCDP (GOV.BR) <<<`);
  console.log(`================================================================`);

  const pcdp = IntegradorSCDPService.abrirSolicitacaoPCDP(
    beneficiarioPassageiro,
    'Boa Vista - RR (BVB)',
    'Curitiba - PR (CWB)',
    '2026-10-15'
  );

  console.log(`\n📋 PCDP Criada no SCDP:`);
  console.log(`   • Número PCDP: ${pcdp.numeroPCDP}`);
  console.log(`   • Processo SEI: ${pcdp.numeroProcessoSEI}`);
  console.log(`   • Órgão Concessor: ${pcdp.orgaoDemandante}`);
  console.log(`   • Justificativa: ${pcdp.justificativaLegal}`);
  console.log(`   • Status: ${pcdp.status}`);

  // =========================================================================
  // FASE 2: VINCULAÇÃO AUTOMÁTICA DO BILHETE EMITIDO (E-TICKET)
  // =========================================================================
  console.log(`\n================================================================`);
  console.log(`>>> ETAPA 2: VINCULAÇÃO DO BILHETE ELETRÔNICO (E-TICKET) <<<`);
  console.log(`================================================================`);

  const bilheteEmitido: BilheteAereoEmitido = {
    numeroBilheteETicket: '957-2489102234',
    localizadorPNR: 'BVB-CWB-7A',
    companhiaAerea: 'LATAM Linhas Aéreas',
    valorTarifa: 1850.0,
    valorTaxaEmbarque: 42.5,
    dataEmissao: new Date().toISOString(),
  };

  const pcdpComBilhete = IntegradorSCDPService.vincularBilheteAereo(
    pcdp.numeroPCDP,
    bilheteEmitido
  );

  console.log(`\n🎫 Dados do Bilhete Vinculado no SCDP:`);
  console.log(`   • Número do Bilhete (E-Ticket): ${pcdpComBilhete.bilheteVinculado?.numeroBilheteETicket}`);
  console.log(`   • Localizador (PNR): ${pcdpComBilhete.bilheteVinculado?.localizadorPNR}`);
  console.log(`   • Companhia Aérea: ${pcdpComBilhete.bilheteVinculado?.companhiaAerea}`);
  console.log(`   • Valor Total Liquidado: R$ ${(bilheteEmitido.valorTarifa + bilheteEmitido.valorTaxaEmbarque).toFixed(2)}`);
  console.log(`   • Status SCDP: ${pcdpComBilhete.status}`);

  // =========================================================================
  // FASE 3: COMPROVAÇÃO DE EMBARQUE & HOMOLOGAÇÃO DE PRESTAÇÃO DE CONTAS
  // =========================================================================
  console.log(`\n================================================================`);
  console.log(`>>> ETAPA 3: COMPROVAÇÃO DE VIAGEM & PRESTAÇÃO DE CONTAS (TCU) <<<`);
  console.log(`================================================================`);
  console.log(`Passageiro realizou o check-in e embarque no Aeroporto de Boa Vista (BVB)...`);

  const pcdpFinalizada = IntegradorSCDPService.comprovarViagemEHomologar(
    pcdp.numeroPCDP,
    'Portão 02 - Aeroporto Internacional de Boa Vista'
  );

  console.log(`\n📊 AUDITORIA FINAL DA PRESTAÇÃO DE CONTAS NO SCDP:`);
  console.log(`   • Status Final: ${pcdpFinalizada.status}`);
  console.log(`   • Data/Hora do Embarque: ${pcdpFinalizada.comprovacaoViagem?.dataHoraEmbarqueEfetivo}`);
  console.log(`   • Portão de Embarque: ${pcdpFinalizada.comprovacaoViagem?.portaoEmbarque}`);
  console.log(`   • Cartão de Embarque: ${pcdpFinalizada.comprovacaoViagem?.identificadorCartaoEmbarque}`);
  console.log(`   • Hash Criptográfico para TCU/CGU: ${pcdpFinalizada.comprovacaoViagem?.hashAutenticidadeAuditoriaTCU}`);

  console.log(`\n📜 Histórico de Auditoria do Processo SCDP:`);
  pcdpFinalizada.historicoAuditoria.forEach((h, idx) => {
    console.log(`   ${idx + 1}. [${h.dataHora}] ${h.evento} (Por: ${h.responsavelSistema})`);
  });

  console.log(`\n================================================================`);
  console.log(`✔ PROCESSO DE PASSAGEM FEDERAL HOMOLOGADO COM SUCESSO NO SCDP!`);
  console.log(`================================================================\n`);
}

main().catch((err) => {
  console.error('Erro na execução do SCDP:', err);
});
