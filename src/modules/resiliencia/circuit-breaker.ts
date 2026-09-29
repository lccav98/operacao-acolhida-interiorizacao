export type EstadoCircuito = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  nome: string;
  limiarFalhas: number;
  tempoEsperaAbertoMs: number;
  timeoutMs: number;
}

export interface MetricasCircuito {
  nome: string;
  estado: EstadoCircuito;
  totalRequisicoes: number;
  totalSucessos: number;
  totalFalhas: number;
  totalFallbacksExecutados: number;
  ultimaFalha?: string;
  ultimoSucesso?: string;
}

export class CircuitBreaker {
  private estado: EstadoCircuito = 'CLOSED';
  private falhasConsecutivas = 0;
  private proximaTentativaMs = 0;
  private totalRequisicoes = 0;
  private totalSucessos = 0;
  private totalFalhas = 0;
  private totalFallbacks = 0;
  private ultimaFalha?: string;
  private ultimoSucesso?: string;

  constructor(private config: CircuitBreakerConfig) {}

  async executar<T>(operacao: () => Promise<T>, fallback: (erro: Error) => Promise<T> | T): Promise<T> {
    this.totalRequisicoes++;
    const agora = Date.now();

    // Se aberto, verifica se já passou o tempo de espera para testar em HALF_OPEN
    if (this.estado === 'OPEN') {
      if (agora >= this.proximaTentativaMs) {
        this.estado = 'HALF_OPEN';
        console.log(`[CircuitBreaker:${this.config.nome}] Transição para HALF_OPEN. Testando 1 requisição...`);
      } else {
        this.totalFallbacks++;
        const esperaRestante = Math.ceil((this.proximaTentativaMs - agora) / 1000);
        return fallback(new Error(`Circuito ${this.config.nome} ABERTO por segurança. Em cooldown por mais ${esperaRestante}s.`));
      }
    }

    try {
      // Executa com proteção de timeout
      const resultado = await Promise.race([
        operacao(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout de ${this.config.timeoutMs}ms excedido na operação ${this.config.nome}`)), this.config.timeoutMs)
        ),
      ]);

      this.registrarSucesso();
      return resultado;
    } catch (err: unknown) {
      const erro = err instanceof Error ? err : new Error(String(err));
      this.registrarFalha(erro);
      this.totalFallbacks++;
      return fallback(erro);
    }
  }

  private registrarSucesso() {
    this.falhasConsecutivas = 0;
    this.totalSucessos++;
    this.ultimoSucesso = new Date().toISOString();

    if (this.estado === 'HALF_OPEN') {
      this.estado = 'CLOSED';
      console.log(`[CircuitBreaker:${this.config.nome}] Teste com sucesso! Circuito FECHADO e normalizado.`);
    }
  }

  private registrarFalha(erro: Error) {
    this.falhasConsecutivas++;
    this.totalFalhas++;
    this.ultimaFalha = `${new Date().toISOString()} - ${erro.message}`;

    if (this.falhasConsecutivas >= this.config.limiarFalhas || this.estado === 'HALF_OPEN') {
      this.estado = 'OPEN';
      this.proximaTentativaMs = Date.now() + this.config.tempoEsperaAbertoMs;
      console.warn(`[CircuitBreaker:${this.config.nome}] Limiar de ${this.config.limiarFalhas} falhas atingido. Circuito ABERTO por ${this.config.tempoEsperaAbertoMs / 1000}s.`);
    }
  }

  obterMetricas(): MetricasCircuito {
    return {
      nome: this.config.nome,
      estado: this.estado,
      totalRequisicoes: this.totalRequisicoes,
      totalSucessos: this.totalSucessos,
      totalFalhas: this.totalFalhas,
      totalFallbacksExecutados: this.totalFallbacks,
      ultimaFalha: this.ultimaFalha,
      ultimoSucesso: this.ultimoSucesso,
    };
  }

  forcarEstado(novoEstado: EstadoCircuito) {
    this.estado = novoEstado;
    if (novoEstado === 'OPEN') {
      this.proximaTentativaMs = Date.now() + this.config.tempoEsperaAbertoMs;
    }
  }
}
