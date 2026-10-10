import { GraphifyAIEngine } from './graphify-engine';

async function main() {
  const args = process.argv.slice(2);
  const comando = args[0] || 'build';
  const termo = args[1] || '';

  const engine = new GraphifyAIEngine();

  console.log(`\n======================================================`);
  console.log(`🌐 GRAPHIFY AI — KNOWLEDGE GRAPH OPERAÇÃO ACOLHIDA`);
  console.log(`======================================================\n`);

  if (comando === 'build' || comando === 'metrics') {
    const graph = engine.buildGraph();
    console.log(`✔ Knowledge Graph gerado com sucesso!`);
    console.log(`• Total de Nós (Entidades): ${graph.metadata.totalNodes}`);
    console.log(`• Total de Arestas (Relações): ${graph.metadata.totalEdges}`);
    console.log(`• Densidade Topológica: ${graph.metadata.density}`);
    console.log(`• Categorias Mapeadas:`);
    Object.entries(graph.metadata.categories).forEach(([cat, qtd]) => {
      console.log(`   - ${cat}: ${qtd}`);
    });
  } else if (comando === 'query') {
    console.log(`🔍 Consultando Grafo por termo: "${termo || 'Rondon'}"...\n`);
    const result = engine.queryGraph(termo || 'Rondon');
    console.log(`✔ ${result.explanation}`);
    console.log(`\nNós Encontrados:`);
    result.nodes.forEach((n) => {
      console.log(` • [${n.type}] ${n.label} (ID: ${n.id})`);
    });
  } else if (comando === 'explain') {
    const nodeId = termo || 'ABRIGO-RONDON-1';
    console.log(`🧠 Explicando entidade [${nodeId}] com Graphify AI...\n`);
    const explanation = engine.explainNode(nodeId);
    console.log(explanation);
  }

  console.log(`\n======================================================\n`);
}

if (require.main === module) {
  main().catch(console.error);
}
