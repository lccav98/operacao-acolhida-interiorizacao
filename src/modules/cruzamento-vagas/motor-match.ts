import { Beneficiario, MatchVESOportunidade } from '../../types';
import { BancoVagasEmprego } from './banco-vagas';
import { TypeSafeAcolhidaService } from '../../services/typesafe';

export class MotorMatchVagasLocal {
  /**
   * Busca e avalia se há vagas na cidade da família/amigo compatíveis com o perfil do migrante
   */
  static async identificarOportunidadeConvergente(
    beneficiario: Beneficiario,
    cidadeDestino: string,
    ufDestino: string,
    typesafeService: TypeSafeAcolhidaService
  ): Promise<MatchVESOportunidade | null> {
    // 1. Busca vagas abertas na mesma localidade
    const vagasLocais = BancoVagasEmprego.buscarVagasPorCidade(cidadeDestino, ufDestino);
    if (vagasLocais.length === 0 || !beneficiario.perfilProfissional) {
      return null;
    }

    console.log(
      `🔍 Cruzando perfil profissional de ${beneficiario.nome} com ${vagasLocais.length} vaga(s) em ${cidadeDestino}/${ufDestino}...`
    );

    // 2. Avalia a melhor vaga com Motor de Inteligência Artificial Federal
    for (const vaga of vagasLocais) {
      const match = await typesafeService.avaliarMatchProfissional(beneficiario, vaga);

      if (match.recomendacao === 'PROPOR_CONVERGENCIA_VES' && match.compatibilidadePercent >= 0.5) {
        return {
          vaga,
          scoreAderencia: match.aderenciaScore,
          compatibilidadePercent: match.compatibilidadePercent,
          parecerIA: match.parecer,
          beneficioConvergente:
            `Oportunidade Única: Reencontro familiar em ${cidadeDestino} com emprego formal garantido na empresa ${vaga.empresa.razaoSocial} (Salário: R$ ${vaga.salario.toFixed(2)})!`,
        };
      }
    }

    return null;
  }
}
