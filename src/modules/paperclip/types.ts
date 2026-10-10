export interface PaperclipAgent {
  id: string;
  name: string;
  title: string;
  reportsTo: string | null;
  role: string;
  model: string;
  runtime: string;
  skills: string[];
  budget: {
    monthlyTokens: number;
    maxSpendBRL: number;
    tokensUsed?: number;
  };
  heartbeat: {
    intervalMinutes: number;
    enabled: boolean;
    lastHeartbeat?: string;
    status?: 'ONLINE' | 'STANDBY' | 'BUSY' | 'ERROR';
  };
}

export interface PaperclipRoutine {
  id: string;
  name: string;
  cron: string;
  assignedTo: string;
  description: string;
  lastRun?: string;
  lastStatus?: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface PaperclipHeartbeatExecution {
  timestamp: string;
  agentId: string;
  agentName: string;
  status: 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';
  acoesRealizadas: string[];
  metricasAvaliadas: {
    voosOcupacaoPercent: number;
    assentosVagosEvitados: number;
    pcdpsEmConformidade: number;
    cadastrosVarreduraLgpd: number;
    alertasTraficoDetectados: number;
    noShowMitigados: number;
  };
  recomendacoes: string[];
}

export interface PaperclipTask {
  id: string;
  title: string;
  description: string;
  assignedAgentId: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'FALHA';
  createdAt: string;
  completedAt?: string;
  resultSummary?: string;
}

export interface PaperclipOrgStatus {
  company: {
    name: string;
    mission: string;
    totalAgents: number;
    activeAgents: number;
    budgetSpendUSD: number;
    budgetThresholdPercent: number;
  };
  agents: PaperclipAgent[];
  routines: PaperclipRoutine[];
  recentHeartbeats: PaperclipHeartbeatExecution[];
  recentTasks: PaperclipTask[];
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}
