export type GraphNodeType =
  | 'ABRIGO'
  | 'BENEFICIARIO'
  | 'GRUPO_FAMILIAR'
  | 'VOO'
  | 'CIDADE_DESTINO'
  | 'EMPRESA_VAGA'
  | 'AGENTE_IA'
  | 'CONFORMIDADE_LEGAL';

export type GraphEdgeType =
  | 'ABRIGADO_EM'
  | 'PERTENCE_A_FAMILIA'
  | 'ALOCADO_VOO'
  | 'DESTINO_DE'
  | 'MATCH_VAGA'
  | 'MONITORADO_POR'
  | 'AUDITADO_POR'
  | 'VINCULADO_SCDP'
  | 'PROTEGIDO_CONTRA_TRAFICO';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  category: string;
  properties: Record<string, any>;
  color: string;
  size?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label: string;
  weight?: number;
  properties?: Record<string, any>;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    generatedAt: string;
    density: number;
    categories: Record<string, number>;
  };
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  explanation: string;
  relatedEntitiesCount: number;
}
