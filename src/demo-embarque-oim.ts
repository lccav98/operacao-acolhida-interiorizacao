import { RegrasEmbarqueAutomatizadas } from './modules/embarque/regras-embarque';
import { AutomacaoFuncoesOIM } from './modules/transicao-oim/automacao-funcoes-oim';
import { Beneficiario } from './types';

async function main() {
  console.log(`\n################################################################`);
  console.log(`### REGRAS AUTOMATIZADAS DE EMBARQUE & TRANSIÇÃO ORÇAMENTÁRIA OIM ###`);
  console.log(`###   UNIDADE FAMILIAR, ESTÁGIO GESTACIONAL E AUTONOMIA FEDERAL ###`);
  console.log(`################################################################\n`);

  // =========================================================================
  // DEMO 1: UNIDADE FAMILIAR INVIOLÁVEL (PROIBIÇÃO DE SEPARAÇÃO DE FAMÍLIAS)
  // =========================================================================
  console.log(`================================================================`);
  console.log(`>>> CASO 1: REGRA DE EMBARQUE - UNIDADE FAMILIAR INVIOLÁVEL <<<`);
  console.log(`================================================================`);

  const familiaVenezuelana: Beneficiario = {
    id: 'BEN-FAM-01',
    nome: 'Yelitza Coromoto Salazar',
    dataNascimento: '1989-03-12',
    nacionalidade: 'Venezuelana',
    documentoIdentidade: 'V-19.882.331',
    cpf: '123.987.456-00',
    telefoneContato: '+55 95 99122-3344',
    declaracaoVoluntariedadeAssinada: true,
    localAtual: 'BOA_VISTA',
    abrigoOrigem: 'Rondon 1',
    dataEntradaBrasil: '2021-01-10',
    documentacaoMigratoria: {
      tipo: 'SOLICITACAO_REFUGIO',
      numeroProtocolo: 'PROTO-PF-2021/99881',
      dataEmissao: '2021-01-15',
      regular: true,
    },
    dependentesMenores: [
      { nome: 'Carlos Salazar', idade: 8, parentesco: 'Filho', guardaRegularizadaOuAutorizacaoViagemCartorio: true },
      { nome: 'Sofia Salazar', idade: 5, parentesco: 'Filha', guardaRegularizadaOuAutorizacaoViagemCartorio: true },
      { nome: 'Diego Salazar', idade: 2, parentesco: 'Filho', guardaRegularizadaOuAutorizacaoViagemCartorio: true },
    ],
    saude: {
      vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 30 },
      vacinaTripliceViral: { primeiraDoseAplicada: true },
      sintomasEpidemicos: false,
      gestante: false,
    },
    relatoSituacaoEContexto: 'Mãe viajando com três filhos pequenos para Curitiba.',
  };

  const totalFamilia = familiaVenezuelana.dependentesMenores.length + 1; // 4 pessoas
  const vagasSobrandoNoVoo = 2; // Cenário crítico: apenas 2 assentos restantes

  console.log(`Cenário Operacional:`);
  console.log(`• Núcleo Familiar: ${familiaVenezuelana.nome} + 3 filhos menores (Total: ${totalFamilia} pessoas)`);
  console.log(`• Vagas Remanescentes na Aeronave Sideral/FAB: ${vagasSobrandoNoVoo} assentos.`);

  const resultadoFamilia = RegrasEmbarqueAutomatizadas.validarUnidadeFamiliarNoVoo(
    familiaVenezuelana,
    vagasSobrandoNoVoo
  );

  console.log(`\n📊 RESULTADO DA AUDITORIA DE EMBARQUE FAMILIAR:`);
  console.log(`   • Autorização de Embarque Fracionado: ${resultadoFamilia.aprovadoParaEmbarque ? 'SIM' : 'BLOQUEADO'}`);
  console.log(`   • Motivo: ${resultadoFamilia.motivoBloqueio}`);
  console.log(`   • Ação do Sistema: ${resultadoFamilia.acaoOperacional}`);

  // =========================================================================
  // DEMO 2: REGRAS OBSTÉTRICAS PARA GESTANTES (ESTÁGIO GESTACIONAL)
  // =========================================================================
  console.log(`\n================================================================`);
  console.log(`>>> CASO 2: AVALIAÇÃO OBSTÉTRICA AUTOMATIZADA PARA GESTANTES <<<`);
  console.log(`================================================================`);

  // Gestante 1: 37 semanas (3º trimestre avançado)
  console.log(`\n[Teste A] Gestante em estágio avançado (37 semanas):`);
  const parecerGestanteAvancada = RegrasEmbarqueAutomatizadas.validarEstagioGestacional({
    gestante: true,
    semanasGestacao: 37,
    gestacaoMultipla: false,
  });
  console.log(`   • Status: ${parecerGestanteAvancada.aprovadoParaEmbarque ? 'APROVADO' : 'RETENÇÃO SANITÁRIA'}`);
  console.log(`   • Parecer Médico: ${parecerGestanteAvancada.motivoBloqueio}`);
  console.log(`   • Ação Operacional: ${parecerGestanteAvancada.acaoOperacional}`);

  // Gestante 2: 30 semanas com atestado de 72h
  console.log(`\n[Teste B] Gestante com 30 semanas e atestado obstétrico válido (72h):`);
  const parecerGestanteAtestada = RegrasEmbarqueAutomatizadas.validarEstagioGestacional({
    gestante: true,
    semanasGestacao: 30,
    gestacaoMultipla: false,
    atestadoObstetricoEmitido72h: true,
  });
  console.log(`   • Status: ${parecerGestanteAtestada.aprovadoParaEmbarque ? 'APROVADO' : 'RETENÇÃO SANITÁRIA'}`);
  console.log(`   • Ação Operacional: ${parecerGestanteAtestada.acaoOperacional}`);

  // Gestante 3: 22 semanas (2º trimestre inicial)
  console.log(`\n[Teste C] Gestante no 2º trimestre (22 semanas):`);
  const parecerGestanteInicial = RegrasEmbarqueAutomatizadas.validarEstagioGestacional({
    gestante: true,
    semanasGestacao: 22,
    gestacaoMultipla: false,
  });
  console.log(`   • Status: ${parecerGestanteInicial.aprovadoParaEmbarque ? 'APROVADO' : 'RETENÇÃO SANITÁRIA'}`);
  console.log(`   • Ação Operacional: ${parecerGestanteInicial.acaoOperacional}`);

  // =========================================================================
  // DEMO 3: TRANSIÇÃO E AUTOMAÇÃO TOTAL DAS ETAPAS DA OIM
  // =========================================================================
  console.log(`\n================================================================`);
  console.log(`>>> CASO 3: TRANSIÇÃO ORÇAMENTÁRIA DA OIM (FIM DE NOVEMBRO/2026) <<<`);
  console.log(`================================================================`);
  console.log(`Demonstração da substituição autônoma das atribuições antes dependentes`);
  console.log(`de equipes presenciais da OIM pelo sistema do Governo Federal:`);

  // 1. Auditoria sem intervenção humana
  console.log(`\n1. [Auditoria Documental Automática - Substituindo equipe OIM do P Trg]:`);
  const auditoria = AutomacaoFuncoesOIM.auditarProcessoSemIntervencaoHumana(familiaVenezuelana);
  auditoria.auditoriaLog.forEach((log) => console.log(`   ${log}`));

  // 2. Despacho digital de orientações
  console.log(`\n2. [Orientações Pré-Embarque Multimídia - Substituindo palestras presenciais]:`);
  const sessaoDigital = AutomacaoFuncoesOIM.despacharSessaoOrientacaoDigital(familiaVenezuelana);
  console.log(`   • Canal: WhatsApp / SMS direto para o celular da beneficiária`);
  console.log(`   • Conteúdo Disparado:\n${sessaoDigital.conteudoOrientacao.split('\n').map(l => '     | ' + l).join('\n')}`);

  // 3. Relatório Mensal para o SUFAI
  console.log(`\n3. [Relatório Logístico Consolidado para o Subcomitê Federal para Abrigamento e Interiorização (SUFAI)]:\n`);
  const relatorio = AutomacaoFuncoesOIM.gerarRelatorioMensalSUFAI([
    {
      protocoloProcesso: 'ACOLHIDA-2026-FINAL',
      dataCriacao: new Date().toISOString(),
      status: 'CONFIRMADO_PARA_EMBARQUE',
      modalidade: 'REUNIFICACAO_FAMILIAR',
      beneficiario: familiaVenezuelana,
      historicoEtapas: [],
    },
  ]);
  console.log(JSON.stringify(relatorio, null, 2));

  console.log(`\n================================================================`);
  console.log(`✔ REGRAS DE EMBARQUE E TRANSIÇÃO DA OIM VALIDADAS COM SUCESSO!`);
  console.log(`================================================================\n`);
}

main().catch((err) => {
  console.error('Erro:', err);
});
