import { MotorDecisaoAerea } from './modules/deslocamento/motor-decisao-aerea';
import { TravaFinanceiraDanoErario } from './modules/deslocamento/trava-dano-erario';
import { BancoReservaStandby } from './modules/engajamento-presenca/banco-reserva';
import { Beneficiario } from './types';

// Função utilitária para gerar lote de migrantes
function criarLotePassageiros(quantidade: number, prefixo: string): Beneficiario[] {
  const lista: Beneficiario[] = [];
  for (let i = 1; i <= quantidade; i++) {
    lista.push({
      id: `${prefixo}-${i}`,
      nome: `Migrante ${prefixo} ${i}`,
      dataNascimento: '1995-01-01',
      nacionalidade: 'Venezuelana',
      documentoIdentidade: `V-${1000000 + i}`,
      cpf: `123.456.789-${i < 10 ? '0' + i : i}`,
      telefoneContato: '+55 95 99999-0000',
      declaracaoVoluntariedadeAssinada: true,
      localAtual: 'BOA_VISTA',
      abrigoOrigem: 'Rondon 1',
      dataEntradaBrasil: '2021-01-01',
      documentacaoMigratoria: {
        tipo: 'SOLICITACAO_REFUGIO',
        numeroProtocolo: `PROTO-${i}`,
        dataEmissao: '2021-01-01',
        regular: true,
      },
      dependentesMenores: [],
      saude: {
        vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 30 },
        vacinaTripliceViral: { primeiraDoseAplicada: true },
        sintomasEpidemicos: false,
        gestante: false,
      },
      relatoSituacaoEContexto: 'Apto para interiorização.',
    });
  }
  return lista;
}

async function main() {
  console.log(`\n################################################################`);
  console.log(`### DECISÃO AUTOMATIZADA: FRETAMENTO SIDERAL vs FAB vs COMERCIAL ###`);
  console.log(`###       PREVENÇÃO DE DANO AO ERÁRIO E CONTROLE DE NO-SHOW    ###`);
  console.log(`################################################################\n`);

  // =========================================================================
  // CENÁRIO 1: DESTINO SIDERAL COM QUÓRUM (CURITIBA - 85 PASSAGEIROS)
  // =========================================================================
  console.log(`================================================================`);
  console.log(`>>> CENÁRIO 1: CURITIBA (Contrato Sideral - 85 passageiros) <<<`);
  console.log(`================================================================`);
  const loteCuritiba = criarLotePassageiros(85, 'CWB');
  const decisao1 = MotorDecisaoAerea.decidirModalAereo('Curitiba', 'PR', loteCuritiba);

  console.log(`✔ Modal Selecionado: ${decisao1.modalEscolhido} (${decisao1.operadora})`);
  console.log(`✔ Ocupação Estimada: ${decisao1.quantidadePassageirosLote} passageiros (${decisao1.taxaOcupacaoEstimada}% do Boeing 737)`);
  console.log(`✔ Custo Estimado: R$ ${decisao1.custoMedioPorPassageiroEst.toFixed(2)} / pessoa`);
  console.log(`✔ Justificativa Econômica: ${decisao1.justificativaEconomica}`);
  console.log(`🛡️ Medidas de Proteção ao Erário:`);
  decisao1.mitigacaoDanoAoErario.forEach((m, idx) => console.log(`   ${idx + 1}. ${m}`));

  // =========================================================================
  // CENÁRIO 2: DESTINO SIDERAL SEM QUÓRUM (FLORIANÓPOLIS - 5 PASSAGEIROS)
  // =========================================================================
  console.log(`\n================================================================`);
  console.log(`>>> CENÁRIO 2: FLORIANÓPOLIS (Contrato Sideral, mas apenas 5 pessoas) <<<`);
  console.log(`================================================================`);
  const loteFloripa = criarLotePassageiros(5, 'FLN');
  const decisao2 = MotorDecisaoAerea.decidirModalAereo('Florianópolis', 'SC', loteFloripa);

  console.log(`✔ Modal Selecionado: ${decisao2.modalEscolhido} (${decisao2.operadora})`);
  console.log(`✔ Volume: ${decisao2.quantidadePassageirosLote} passageiros`);
  console.log(`✔ Justificativa Financeira: ${decisao2.justificativaEconomica}`);

  // =========================================================================
  // CENÁRIO 3: DESTINO FORA DO CONTRATO SIDERAL (CUIABÁ-MT)
  // =========================================================================
  console.log(`\n================================================================`);
  console.log(`>>> CENÁRIO 3: CUIABÁ-MT (Cidade não atendida pelo contrato Sideral) <<<`);
  console.log(`================================================================`);
  const loteCuiaba = criarLotePassageiros(8, 'CGB');
  const decisao3 = MotorDecisaoAerea.decidirModalAereo('Cuiabá', 'MT', loteCuiaba);

  console.log(`✔ Modal Selecionado: ${decisao3.modalEscolhido} (${decisao3.operadora})`);
  console.log(`✔ Rota: Voo Comercial regular saindo de Boa Vista-RR (BVB) para Cuiabá`);
  console.log(`✔ Justificativa: ${decisao3.justificativaEconomica}`);

  // =========================================================================
  // CENÁRIO 4: PROTEÇÃO AO ERÁRIO - TRAVA CONTRA NO-SHOW EM VOO COMERCIAL
  // =========================================================================
  console.log(`\n================================================================`);
  console.log(`>>> CENÁRIO 4: TRAVA FINANCEIRA - PREVENÇÃO DE DANO AO ERÁRIO <<<`);
  console.log(`================================================================`);
  console.log(`Um beneficiário titular foi agendado para voo comercial, porém:`);
  console.log(`• Não compareceu ao P Trg na véspera (D-1)`);
  console.log(`• Não respondeu às mensagens de confirmação do WhatsApp`);

  // Alimenta o banco de reserva com um suplente
  const suplentePronto = criarLotePassageiros(1, 'SUPLENTE-IMEDIATO')[0];
  suplentePronto.nome = 'Dayana Valentina Ramos (Suplente no P Trg)';
  BancoReservaStandby.cadastrarSuplente(suplentePronto);

  const titularAusente = criarLotePassageiros(1, 'TITULAR-FALTA')[0];
  titularAusente.nome = 'Carlos Mendoza (Titular que faltou)';

  console.log(`\nExecutando verificação da Trava Financeira antes da compra do bilhete...`);
  const resultadoTrava = TravaFinanceiraDanoErario.avaliarEmissaoBilheteComercial(
    titularAusente,
    false, // Não compareceu ao P Trg em D-1
    true,  // Exame médico ok
    false, // Não respondeu WhatsApp
    'Cuiabá'
  );

  console.log(`\n📊 RESULTADO DA AUDITORIA FINANCEIRA:`);
  console.log(`   • Autorização de Compra: ${resultadoTrava.autorizadoComprarPassagem ? 'AUTORIZADA' : 'BLOQUEADA'}`);
  console.log(`   • Parecer: ${resultadoTrava.motivo}`);
  console.log(`   • Dinheiro Público Protegido / Não Desperdiçado: R$ ${resultadoTrava.recursoPublicoEconomizadoEstimado?.toFixed(2)}`);
  console.log(`   • Ação Tomada: ${resultadoTrava.acaoEmergencial}`);
  console.log(`   • Passageiro que embarcará com o bilhete: ${resultadoTrava.passageiroEfetivo.nome}`);

  console.log(`\n================================================================`);
  console.log(`✔ TESTE DE DECISÃO AÉREA E PROTEÇÃO AO ERÁRIO CONCLUÍDO COM ÊXITO!`);
  console.log(`================================================================\n`);
}

main().catch((err) => {
  console.error('Erro:', err);
});
