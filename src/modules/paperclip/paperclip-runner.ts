import { PaperclipOrchestrator } from './paperclip-orchestrator';

async function main() {
  console.log(`\n======================================================`);
  console.log(`🚀 PAPERCLIP AI ORCHESTRATOR — OPERAÇÃO ACOLHIDA (SUFAI)`);
  console.log(`======================================================\n`);

  const orchestrator = new PaperclipOrchestrator();
  const status = orchestrator.getStatus();

  console.log(`🏢 Organização: ${status.company.name}`);
  console.log(`🎯 Missão: ${status.company.mission}`);
  console.log(`👥 Força de Trabalho: ${status.company.totalAgents} Agentes Autônomos Ativos`);
  console.log(`💰 Consumo de Orçamento: ${status.company.budgetThresholdPercent}% do teto mensal\n`);

  console.log(`------------------------------------------------------`);
  console.log(`📋 AGENTES ATIVOS NO ORGANOGRAMA:`);
  console.log(`------------------------------------------------------`);
  status.agents.forEach((agent) => {
    console.log(` • [${agent.id}] ${agent.name} (${agent.title})`);
    console.log(`   Função: ${agent.role}`);
    console.log(`   Modelo: ${agent.model} | Heartbeat: a cada ${agent.heartbeat.intervalMinutes} min`);
    console.log(`   Skills: ${agent.skills.join(', ')}\n`);
  });

  console.log(`------------------------------------------------------`);
  console.log(`💓 DISPARANDO CICLO DE BATIMENTO CARDÍACO (HEARTBEAT)...`);
  console.log(`------------------------------------------------------`);
  const exec = await orchestrator.executeHeartbeat('agente-diretor-interiorizacao');

  console.log(`✔ Heartbeat executado por: ${exec.agentName}`);
  console.log(`✔ Status: ${exec.status}`);
  console.log(`✔ Ações realizadas:`);
  exec.acoesRealizadas.forEach((a) => console.log(`   ✓ ${a}`));
  console.log(`✔ Métricas avaliadas:`);
  console.log(`   - Ocupação dos Voos: ${exec.metricasAvaliadas.voosOcupacaoPercent}%`);
  console.log(`   - Assentos Vagos Evitados: ${exec.metricasAvaliadas.assentosVagosEvitados}`);
  console.log(`   - PCDPs em Conformidade: ${exec.metricasAvaliadas.pcdpsEmConformidade}`);
  console.log(`   - Cadastros com Máscara LGPD: ${exec.metricasAvaliadas.cadastrosVarreduraLgpd}`);
  console.log(`✔ Recomendações:`);
  exec.recomendacoes.forEach((r) => console.log(`   ➜ ${r}`));

  console.log(`\n======================================================`);
  console.log(`✔ PAPERCLIP HEARTBEAT CONCLUÍDO COM ÊXITO TOTAL!`);
  console.log(`======================================================\n`);
}

export function exibirStatus() {
  const orchestrator = new PaperclipOrchestrator();
  console.log(JSON.stringify(orchestrator.getStatus(), null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}
