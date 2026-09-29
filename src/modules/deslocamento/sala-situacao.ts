import { IncidenteTransito, ResolucaoSalaSituacao } from '../../types';
import { TypeSafeAcolhidaService } from '../../services/typesafe';

export class SalaSituacaoCCI {
  private typesafeService: TypeSafeAcolhidaService;

  constructor(typesafeService: TypeSafeAcolhidaService) {
    this.typesafeService = typesafeService;
  }

  /**
   * Processa incidente reportado em voo ou desembarque através do Motor de Inteligência Artificial Federal
   */
  async tratarIncidente(
    incidente: IncidenteTransito,
    cidadeOrigem: string,
    cidadeDestino: string
  ): Promise<ResolucaoSalaSituacao> {
    return await this.typesafeService.resolverIncidenteSalaSituacao(
      incidente,
      cidadeOrigem,
      cidadeDestino
    );
  }
}
