import {
  GraphNode,
  GraphEdge,
  KnowledgeGraphData,
  GraphQueryResult,
  GraphNodeType
} from './graphify-types';
import { GerenciadorRelatorioDiarioAbrigos } from '../abrigados/relatorio-diario-tatico';
import { SentinelaSegurancaELGPD } from '../seguranca/sentinela-lgpd';
import { RegistroAbrigadoRondon } from '../../types/shelter';

export class GraphifyAIEngine {
  private cachedGraph: KnowledgeGraphData | null = null;

  /**
   * Constrói ou recupera o grafo de conhecimento estruturado da Operação Acolhida
   */
  public buildGraph(): KnowledgeGraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Set<string>();

    const addNode = (node: GraphNode) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.add(node.id);
        nodes.push(node);
      }
    };

    const addEdge = (edge: GraphEdge) => {
      edges.push(edge);
    };

    // 1. NÓS DE ABRIGOS OFICIAIS (5 Centros)
    const abrigos = [
      { id: 'ABRIGO-RONDON-1', label: 'Abrigo Rondon 1 (Boa Vista)', lotacao: 850, carpas: 'Setores A a L' },
      { id: 'ABRIGO-RONDON-5', label: 'Abrigo Rondon 5 (Boa Vista)', lotacao: 620, carpas: 'Setores M a T' },
      { id: 'ABRIGO-TUARANOKO', label: 'Abrigo Tuaranoko (Indígena Warao)', lotacao: 430, carpas: 'Área Comunitária' },
      { id: 'ABRIGO-ANEXO-RONDON-1', label: 'Abrigo Anexo Rondon 1', lotacao: 480, carpas: 'Módulos Habitacionais' },
      { id: 'ABRIGO-BV-8', label: 'Abrigo BV-8 (Pacaraima / Fronteira)', lotacao: 460, carpas: 'Posto Fronteiriço' },
    ];

    abrigos.forEach((abr) => {
      addNode({
        id: abr.id,
        label: abr.label,
        type: 'ABRIGO',
        category: 'Abrigo Oficial SUFAI',
        properties: { lotacao: abr.lotacao, carpas: abr.carpas },
        color: '#2563eb', // Blue
        size: 26,
      });
    });

    // 2. NÓS DE VOOS E MODAIS AÉREOS
    const voos = [
      { id: 'VOO-SIDERAL-B737', label: 'Sideral Boeing 737-300 (144 PAX)', capacidade: 144, rota: 'BVB -> CWB / XAP', status: 'CONFIRMADO' },
      { id: 'VOO-FAB-KC390', label: 'FAB 2854 Embraer KC-390 (80 PAX)', capacidade: 80, rota: 'BVB -> MAO / QNS', status: 'CONFIRMADO' },
    ];

    voos.forEach((v) => {
      addNode({
        id: v.id,
        label: v.label,
        type: 'VOO',
        category: 'Malha Aérea Interiorização',
        properties: { capacidade: v.capacidade, rota: v.rota, status: v.status },
        color: '#7c3aed', // Purple
        size: 28,
      });
    });

    // 3. NÓS DE CIDADES DE DESTINO
    const cidades = [
      { id: 'DESTINO-CURITIBA-PR', label: 'Curitiba / PR', estado: 'PR', regiao: 'Sul', recepcao: 'CRAS Pinheirinho' },
      { id: 'DESTINO-CHAPECO-SC', label: 'Chapecó / SC', estado: 'SC', regiao: 'Sul', recepcao: 'Centro Pastoral' },
      { id: 'DESTINO-CANOAS-RS', label: 'Canoas / RS', estado: 'RS', regiao: 'Sul', recepcao: 'Base Aérea Canoas' },
      { id: 'DESTINO-MANAUS-AM', label: 'Manaus / AM', estado: 'AM', regiao: 'Norte', recepcao: 'P Trg Manaus' },
    ];

    cidades.forEach((c) => {
      addNode({
        id: c.id,
        label: c.label,
        type: 'CIDADE_DESTINO',
        category: 'Município de Destino',
        properties: { estado: c.estado, regiao: c.regiao, recepcao: c.recepcao },
        color: '#059669', // Emerald
        size: 22,
      });
    });

    // Conecta Voos às Cidades de Destino
    addEdge({ id: 'EDGE-VOO-CWB', source: 'VOO-SIDERAL-B737', target: 'DESTINO-CURITIBA-PR', type: 'DESTINO_DE', label: 'Desloca para' });
    addEdge({ id: 'EDGE-VOO-XAP', source: 'VOO-SIDERAL-B737', target: 'DESTINO-CHAPECO-SC', type: 'DESTINO_DE', label: 'Desloca para' });
    addEdge({ id: 'EDGE-VOO-MAO', source: 'VOO-FAB-KC390', target: 'DESTINO-MANAUS-AM', type: 'DESTINO_DE', label: 'Desloca para' });
    addEdge({ id: 'EDGE-VOO-QNS', source: 'VOO-FAB-KC390', target: 'DESTINO-CANOAS-RS', type: 'DESTINO_DE', label: 'Desloca para' });

    // 4. NÓS DE EMPRESAS E VAGAS DE EMPREGO (VES)
    const empresas = [
      { id: 'EMP-PARANA-ALIMENTOS', label: 'Paraná Alimentos & Logística', cargo: 'Operador de Embalagem', salario: 2450, cidadeId: 'DESTINO-CURITIBA-PR' },
      { id: 'EMP-AGRO-CHAPECO', label: 'AgroSul Frigoríficos S.A.', cargo: 'Auxiliar de Produção', salario: 2680, cidadeId: 'DESTINO-CHAPECO-SC' },
    ];

    empresas.forEach((e) => {
      addNode({
        id: e.id,
        label: e.label,
        type: 'EMPRESA_VAGA',
        category: 'Vaga de Emprego (VES)',
        properties: { cargo: e.cargo, salario: e.salario },
        color: '#d97706', // Amber
        size: 20,
      });
      addEdge({ id: `EDGE-${e.id}-CIDADE`, source: e.id, target: e.cidadeId, type: 'DESTINO_DE', label: 'Localizada em' });
    });

    // 5. NÓS DOS 5 AGENTES PAPERCLIP AI
    const agentes = [
      { id: 'AGENTE-CEO', label: 'Cel. Coordenador SUFAI (CEO)', papel: 'Orquestração e Alinhamento Federal' },
      { id: 'AGENTE-LOGISTICA', label: 'Major Gestor Aéreo (Operations)', papel: 'Alocação de Voos e Trava de Erário' },
      { id: 'AGENTE-SCDP', label: 'Auditor SCDP (Compliance)', papel: 'Homologação TCU e e-Tickets' },
      { id: 'AGENTE-SENTINELA', label: 'Sentinela LGPD (Protection)', papel: 'Anti-Tráfico e Salvaguarda DPU' },
      { id: 'AGENTE-PTRG', label: 'Coordenador P Trg (Field)', papel: 'Anti-Absenteísmo e Catraca' },
    ];

    agentes.forEach((ag) => {
      addNode({
        id: ag.id,
        label: ag.label,
        type: 'AGENTE_IA',
        category: 'Paperclip AI Workforce',
        properties: { papel: ag.papel },
        color: '#9333ea', // Purple deep
        size: 24,
      });
    });

    // Conexões de governança dos agentes
    addEdge({ id: 'EDGE-CEO-LOGISTICA', source: 'AGENTE-CEO', target: 'AGENTE-LOGISTICA', type: 'MONITORADO_POR', label: 'Supervisiona' });
    addEdge({ id: 'EDGE-CEO-SCDP', source: 'AGENTE-CEO', target: 'AGENTE-SCDP', type: 'MONITORADO_POR', label: 'Supervisiona' });
    addEdge({ id: 'EDGE-CEO-SENTINELA', source: 'AGENTE-CEO', target: 'AGENTE-SENTINELA', type: 'MONITORADO_POR', label: 'Supervisiona' });
    addEdge({ id: 'EDGE-LOGISTICA-PTRG', source: 'AGENTE-LOGISTICA', target: 'AGENTE-PTRG', type: 'MONITORADO_POR', label: 'Comanda' });

    addEdge({ id: 'EDGE-LOGISTICA-VOOS', source: 'AGENTE-LOGISTICA', target: 'VOO-SIDERAL-B737', type: 'AUDITADO_POR', label: 'Garante 100% Ocupação' });
    addEdge({ id: 'EDGE-LOGISTICA-FAB', source: 'AGENTE-LOGISTICA', target: 'VOO-FAB-KC390', type: 'AUDITADO_POR', label: 'Garante 100% Ocupação' });

    addEdge({ id: 'EDGE-PTRG-RONDON1', source: 'AGENTE-PTRG', target: 'ABRIGO-RONDON-1', type: 'MONITORADO_POR', label: 'Monitora No-Show' });
    addEdge({ id: 'EDGE-PTRG-BV8', source: 'AGENTE-PTRG', target: 'ABRIGO-BV-8', type: 'MONITORADO_POR', label: 'Triagem na Fronteira' });
    addEdge({ id: 'EDGE-SENTINELA-TUARANOKO', source: 'AGENTE-SENTINELA', target: 'ABRIGO-TUARANOKO', type: 'PROTEGIDO_CONTRA_TRAFICO', label: 'Proteção Indígena Warao' });

    // 6. NÓS DE CONFORMIDADE LEGAL E MARCOS FEDERAIS
    const leis = [
      { id: 'LEI-13684', label: 'Lei Federal nº 13.684/2018 (Operação Acolhida)' },
      { id: 'LEI-LGPD', label: 'Lei nº 13.709/2018 (LGPD - Anonimização)' },
      { id: 'SCDP-TCU', label: 'Barramento Federal SCDP (Auditoria TCU/CGU)' },
    ];

    leis.forEach((l) => {
      addNode({
        id: l.id,
        label: l.label,
        type: 'CONFORMIDADE_LEGAL',
        category: 'Governança & Legislação',
        properties: {},
        color: '#dc2626', // Red
        size: 20,
      });
    });

    addEdge({ id: 'EDGE-SCDP-LEI', source: 'AGENTE-SCDP', target: 'SCDP-TCU', type: 'VINCULADO_SCDP', label: 'Emite e-Ticket' });
    addEdge({ id: 'EDGE-SENTINELA-LGPD', source: 'AGENTE-SENTINELA', target: 'LEI-LGPD', type: 'PROTEGIDO_CONTRA_TRAFICO', label: 'Mascara PII' });

    // 7. NÓS DE BENEFICIÁRIOS E GRUPOS FAMILIARES REAIS OU AMOSTRA
    let baseAbrigados = GerenciadorRelatorioDiarioAbrigos.obterBaseAtual();
    if (!baseAbrigados || baseAbrigados.length === 0) {
      baseAbrigados = [
        {
          emgId: 'EMG-00147494',
          nomeCompleto: 'Beneficiário Protegido (LGPD)',
          cpf: '603.068.860-06',
          idade: 50,
          sexo: 'Male',
          perfilFamiliar: 'FMAd - Adultos',
          relacionamento: 'Irmão',
          codigoGrupoFamiliar: 'EMG-22-10873',
          quantidadePessoasFamilia: 2,
          situacaoCivil: 'Solteiro(a)',
          dataEntradaAbrigo: '2022-11-25',
          diasAbrigado: 1399,
          pcd: false,
          gravida: false,
          nacionalidade: 'Venezuela',
          abrigo: 'Rondon 1',
          carpa: 'J13',
        },
        {
          emgId: 'EMG-116169197',
          nomeCompleto: 'Beneficiária Protegida (LGPD)',
          cpf: '118.829.232-35',
          idade: 34,
          sexo: 'Female',
          perfilFamiliar: 'FMCA - Com Criança',
          relacionamento: 'Ponto Focal',
          codigoGrupoFamiliar: 'EMG-25-6401025',
          quantidadePessoasFamilia: 6,
          situacaoCivil: 'Solteiro(a)',
          dataEntradaAbrigo: '2025-12-10',
          diasAbrigado: 288,
          pcd: false,
          gravida: true,
          nacionalidade: 'Venezuela',
          abrigo: 'Rondon 1',
          carpa: 'L13',
        },
        {
          emgId: 'EMG-00984122',
          nomeCompleto: 'Beneficiária Protegida (LGPD)',
          cpf: '542.119.870-11',
          idade: 28,
          sexo: 'Female',
          perfilFamiliar: 'FMCA - Com Criança',
          relacionamento: 'Mãe',
          codigoGrupoFamiliar: 'EMG-25-998231',
          quantidadePessoasFamilia: 3,
          situacaoCivil: 'Casado(a)',
          dataEntradaAbrigo: '2025-08-14',
          diasAbrigado: 412,
          pcd: false,
          gravida: false,
          nacionalidade: 'Venezuela',
          abrigo: 'Rondon 5',
          carpa: 'P04',
        },
        {
          emgId: 'EMG-00742119',
          nomeCompleto: 'Beneficiário Protegido (LGPD)',
          cpf: '712.981.440-92',
          idade: 42,
          sexo: 'Male',
          perfilFamiliar: 'Unipessoal',
          relacionamento: 'Titular',
          quantidadePessoasFamilia: 1,
          situacaoCivil: 'Solteiro(a)',
          dataEntradaAbrigo: '2023-01-10',
          diasAbrigado: 1350,
          pcd: false,
          gravida: false,
          nacionalidade: 'Venezuela',
          abrigo: 'Anexo Rondon 1',
          carpa: 'M02',
        },
        {
          emgId: 'EMG-00332145',
          nomeCompleto: 'Beneficiário Protegido (LGPD)',
          cpf: '883.102.390-50',
          idade: 36,
          sexo: 'Male',
          perfilFamiliar: 'FMCA - Indígena Warao',
          relacionamento: 'Ponto Focal',
          codigoGrupoFamiliar: 'EMG-24-WARAO-01',
          quantidadePessoasFamilia: 5,
          situacaoCivil: 'Casado(a)',
          dataEntradaAbrigo: '2024-03-20',
          diasAbrigado: 920,
          pcd: false,
          gravida: false,
          nacionalidade: 'Venezuela',
          abrigo: 'Tuaranoko',
          carpa: 'Comunitária',
        }
      ] as RegistroAbrigadoRondon[];
    }

    const abrigadosAmostra = baseAbrigados.slice(0, 15);

    abrigadosAmostra.forEach((b) => {
      const bNodeId = `BENEF-${b.emgId}`;
      const cpfMascarado = SentinelaSegurancaELGPD.mascararCpf(b.cpf);

      // Proteção de Pessoas Reais (LGPD / SUFAI): Nome ocultado, exibindo apenas o CPF mascarado (ex: ***.***.860-06)
      addNode({
        id: bNodeId,
        label: cpfMascarado,
        type: 'BENEFICIARIO',
        category: 'Beneficiário Protegido (LGPD)',
        properties: {
          cpf: cpfMascarado,
          codigoEmg: b.emgId,
          idade: b.idade,
          genero: b.sexo,
          perfilFamiliar: b.perfilFamiliar,
          gravida: b.gravida,
          pcd: b.pcd,
          abrigo: b.abrigo,
          carpa: b.carpa,
        },
        color: b.gravida || b.pcd ? '#ec4899' : '#0284c7',
        size: 16,
      });

      // Mapeia abrigo correspondente
      const abrigoTexto = b.abrigo || 'Rondon 1';
      const abrigoIdCorrespondente =
        abrigoTexto.includes('1') && !abrigoTexto.includes('Anexo')
          ? 'ABRIGO-RONDON-1'
          : abrigoTexto.includes('5')
          ? 'ABRIGO-RONDON-5'
          : abrigoTexto.includes('Tuaranoko')
          ? 'ABRIGO-TUARANOKO'
          : abrigoTexto.includes('Anexo')
          ? 'ABRIGO-ANEXO-RONDON-1'
          : 'ABRIGO-BV-8';

      addEdge({
        id: `EDGE-${b.emgId}-ABRIGO`,
        source: bNodeId,
        target: abrigoIdCorrespondente,
        type: 'ABRIGADO_EM',
        label: `Abrigado em ${b.carpa || 'Setor Comum'}`,
      });

      // Se possui grupo familiar, cria nó da família
      if (b.codigoGrupoFamiliar) {
        const famNodeId = `FAM-${b.codigoGrupoFamiliar}`;
        addNode({
          id: famNodeId,
          label: `Família [${b.codigoGrupoFamiliar}] (${b.quantidadePessoasFamilia || 2} pax)`,
          type: 'GRUPO_FAMILIAR',
          category: 'Grupo Familiar Coeso',
          properties: { codigo: b.codigoGrupoFamiliar, tamanho: b.quantidadePessoasFamilia },
          color: '#10b981',
          size: 18,
        });

        addEdge({
          id: `EDGE-${b.emgId}-FAM`,
          source: bNodeId,
          target: famNodeId,
          type: 'PERTENCE_A_FAMILIA',
          label: b.relacionamento || 'Membro',
        });

        // Proteção anti-tráfico se tiver menores
        if (b.perfilFamiliar.includes('Criança') || b.perfilFamiliar.includes('FMC')) {
          addEdge({
            id: `EDGE-PROTECAO-${b.emgId}`,
            source: 'AGENTE-SENTINELA',
            target: famNodeId,
            type: 'PROTEGIDO_CONTRA_TRAFICO',
            label: 'Vínculo Auditado (DPU)',
          });
        }
      }

      // Conecta passageiros a voos e vagas
      if (b.emgId.includes('00147494') || b.emgId.includes('116169197')) {
        addEdge({
          id: `EDGE-VOO-PASS-${b.emgId}`,
          source: bNodeId,
          target: 'VOO-SIDERAL-B737',
          type: 'ALOCADO_VOO',
          label: 'Poltrona Confirmada (Trava 100%)',
        });
        addEdge({
          id: `EDGE-MATCH-${b.emgId}`,
          source: bNodeId,
          target: 'EMP-PARANA-ALIMENTOS',
          type: 'MATCH_VAGA',
          label: 'Match Convergente IA (100%)',
        });
      }
    });

    const categoriesCount: Record<string, number> = {};
    nodes.forEach((n) => {
      categoriesCount[n.type] = (categoriesCount[n.type] || 0) + 1;
    });

    const density = Number((edges.length / (nodes.length * (nodes.length - 1) || 1)).toFixed(4));

    const graphData: KnowledgeGraphData = {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        generatedAt: new Date().toISOString(),
        density,
        categories: categoriesCount,
      },
    };

    this.cachedGraph = graphData;
    return graphData;
  }

  /**
   * Consulta semântica e relacional sobre o Knowledge Graph
   */
  public queryGraph(termo: string, tipo?: GraphNodeType): GraphQueryResult {
    const graph = this.cachedGraph || this.buildGraph();
    const termoLower = (termo || '').toLowerCase().trim();

    const matchedNodes = graph.nodes.filter((node) => {
      const matchType = !tipo || node.type === tipo;
      if (!matchType) return false;
      if (!termoLower) return true;
      return (
        node.label.toLowerCase().includes(termoLower) ||
        node.id.toLowerCase().includes(termoLower) ||
        node.category.toLowerCase().includes(termoLower) ||
        JSON.stringify(node.properties).toLowerCase().includes(termoLower)
      );
    });

    const nodeIds = new Set(matchedNodes.map((n) => n.id));

    // Inclui nós conectados de 1º grau para dar contexto
    const relatedEdges = graph.edges.filter(
      (e) => nodeIds.has(e.source) || nodeIds.has(e.target)
    );

    const relatedNodeIds = new Set<string>();
    relatedEdges.forEach((e) => {
      relatedNodeIds.add(e.source);
      relatedNodeIds.add(e.target);
    });

    const finalNodeIds = new Set<string>([...nodeIds, ...relatedNodeIds]);
    const finalNodes = graph.nodes.filter((n) => finalNodeIds.has(n.id));

    const explanation = `O Graphify AI localizou ${matchedNodes.length} entidade(s) direta(s) e ${
      finalNodes.length - matchedNodes.length
    } conexão(ões) adjacente(s) relacionadas a "${termo}".`;

    return {
      nodes: finalNodes,
      edges: relatedEdges,
      explanation,
      relatedEntitiesCount: finalNodes.length,
    };
  }

  /**
   * Gera explicação textual estruturada com IA sobre as conexões de uma entidade
   */
  public explainNode(nodeId: string): string {
    const graph = this.cachedGraph || this.buildGraph();
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) {
      return `Nó com ID "${nodeId}" não foi encontrado no Knowledge Graph.`;
    }

    const connectedEdges = graph.edges.filter((e) => e.source === nodeId || e.target === nodeId);
    const vizinhos = connectedEdges.map((e) => {
      const isSource = e.source === nodeId;
      const outroId = isSource ? e.target : e.source;
      const outroNode = graph.nodes.find((n) => n.id === outroId);
      return `• [${e.label}] -> ${outroNode?.label || outroId} (${outroNode?.category || 'Desconhecido'})`;
    });

    return `### Análise de Relacionamento Graphify AI para: **${node.label}**\n\n` +
      `- **Tipo de Entidade:** ${node.type} (${node.category})\n` +
      `- **Grau de Conectividade:** ${connectedEdges.length} arestas ativas\n` +
      `- **Propriedades:** ${JSON.stringify(node.properties, null, 2)}\n\n` +
      `**Conexões Diretas Identificadas:**\n${vizinhos.length > 0 ? vizinhos.join('\n') : 'Nenhuma conexão registrada.'}\n\n` +
      `**Avaliação de Impacto Operacional:** Entidade integrada ao fluxo logístico e aos controles de integridade federal do SIGA-Acolhida.`;
  }

  /**
   * Retorna métricas analíticas da topologia do grafo
   */
  public getMetrics() {
    const graph = this.cachedGraph || this.buildGraph();
    return graph.metadata;
  }
}
