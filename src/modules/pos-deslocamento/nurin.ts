import { Beneficiario, EncaminhamentoNURIN, ModalidadeInteriorizacao } from '../../types';

export class GestorNURIN {
  /**
   * Articula a integração socioeconômica na cidade de destino através das redes locais
   */
  static articularIntegracaoLocal(
    beneficiario: Beneficiario,
    modalidade: ModalidadeInteriorizacao,
    cidadeDestino: string,
    ufDestino: string
  ): EncaminhamentoNURIN {
    const temFilhosEmIdadeEscolar = beneficiario.dependentesMenores.some(
      (m) => m.idade >= 4 && m.idade <= 17
    );

    const observacoes: string[] = [
      `Acolhimento efetivado em ${cidadeDestino}/${ufDestino} sob a modalidade ${modalidade}.`,
    ];

    if (temFilhosEmIdadeEscolar) {
      observacoes.push(
        'Dependentes em idade escolar encaminhados para transferência/matrícula prioritária na Secretaria Municipal/Estadual de Educação.'
      );
    }

    if (beneficiario.saude.gestante) {
      observacoes.push(
        'Beneficiária gestante vinculada prioritariamente à UBS para seguimento do pré-natal pelo SUS.'
      );
    }

    if (modalidade === 'INSTITUCIONAL') {
      observacoes.push(
        'Permanência em abrigo municipal/OSC prevista por até 3 meses com plano de autonomia familiar.'
      );
    }

    return {
      crasOuCreasReferenciado: true,
      unidadeBasicaSaudeReferenciada: true,
      vagasEscolaresArticuladas: temFilhosEmIdadeEscolar,
      cursoPortuguesArticulado: true,
      apoioEmpregabilidade: modalidade !== 'VAGA_EMPREGO_SINALIZADA', // Em VES já possui vaga prévia
      observacoes: observacoes.join(' '),
    };
  }
}
