import { Beneficiario, ReceptorInfo, EmpresaVESInfo, ModalidadeInteriorizacao } from '../../types';

export interface ResultadoValidacaoDocumental {
  valido: boolean;
  erros: string[];
  alertas: string[];
}

export class ValidadorDocumental {
  static validar(
    modalidade: ModalidadeInteriorizacao,
    beneficiario: Beneficiario,
    receptor?: ReceptorInfo,
    empresa?: EmpresaVESInfo
  ): ResultadoValidacaoDocumental {
    const erros: string[] = [];
    const alertas: string[] = [];

    // 1. Regularidade Migratória Obrigatória
    if (!beneficiario.documentacaoMigratoria.regular) {
      erros.push(
        'Documentação migratória irregular ou expirada. Necessário protocolo ativo de refúgio ou residência temporária.'
      );
    }

    // 2. CPF e Telefone de contato
    if (!beneficiario.cpf || beneficiario.cpf.trim() === '') {
      erros.push('CPF não cadastrado. Obrigatório para inclusão no Sistema Acolhedor.');
    }
    if (!beneficiario.telefoneContato) {
      alertas.push('Telefone de contato não fornecido ou desatualizado.');
    }

    // 3. Declaração de Voluntariedade (Diretriz Humanitária Central)
    if (!beneficiario.declaracaoVoluntariedadeAssinada) {
      erros.push(
        'Declaração de Voluntariedade e Consentimento não assinada. O deslocamento deve ser estritamente voluntário.'
      );
    }

    // 4. Proteção de Crianças e Adolescentes (Menores de 18 anos)
    for (const menor of beneficiario.dependentesMenores) {
      if (!menor.guardaRegularizadaOuAutorizacaoViagemCartorio) {
        erros.push(
          `Dependente menor (${menor.nome}) sem guarda legal regularizada ou autorização de viagem reconhecida em cartório.`
        );
      }
    }

    // 5. Validações Específicas por Modalidade
    switch (modalidade) {
      case 'INSTITUCIONAL':
        if (!beneficiario.abrigoOrigem) {
          alertas.push(
            'Prioridade na modalidade institucional é para residentes em abrigos oficiais (Rondon 1, Rondon 5, Tuaranoko, Anexo Rondon 1, BV-8).'
          );
        }
        break;

      case 'REUNIFICACAO_FAMILIAR':
        if (!receptor) {
          erros.push('Dados do receptor familiar são obrigatórios para a modalidade Reunificação Familiar.');
        } else {
          if (!receptor.parentescoComprovadoDocumentalmente) {
            erros.push(
              'Na Reunificação Familiar, o vínculo familiar deve ser formalmente comprovado (certidões de nascimento/casamento). Caso não comprovado, reclassificar como Reunião Social.'
            );
          }
          if (!receptor.comprovanteResidenciaValido) {
            erros.push('Comprovante de residência válido no destino é obrigatório para o receptor.');
          }
        }
        break;

      case 'REUNIAO_SOCIAL':
        if (!receptor) {
          erros.push('Dados do receptor são obrigatórios para a modalidade Reunião Social.');
        } else {
          if (receptor.idade < 21) {
            erros.push('O receptor na Reunião Social deve ter idade mínima de 21 anos completos.');
          }
          if (!receptor.comprovanteResidenciaValido) {
            erros.push('Comprovante de residência válido no destino é obrigatório para o receptor.');
          }
          if (receptor.capacidadeAcomodacaoPessoas < beneficiario.dependentesMenores.length + 1) {
            alertas.push(
              'Aviso de risco habitacional: a capacidade declarada do imóvel é inferior ao grupo familiar.'
            );
          }
        }
        break;

      case 'VAGA_EMPREGO_SINALIZADA':
        if (!empresa) {
          erros.push('Dados da empresa empregadora são obrigatórios para a modalidade VES.');
        } else {
          if (empresa.obiceListaTrabalhoEscravo) {
            erros.push(
              'Óbice Crítico: Empresa consta no cadastro de empregadores flagrados com trabalho análogo ao de escravo.'
            );
          }
          if (empresa.obiceCEIS_CNEP) {
            erros.push('Óbice: Empresa cadastrada no CEIS/CNEP como inidônea ou suspensa.');
          }
          if (!empresa.declaracaoIntencoesAssinada) {
            erros.push('Declaração Inicial de Intenção das Partes não assinada pela empresa.');
          }
          if (empresa.salarioMensal <= 0) {
            erros.push('Salário da vaga não especificado ou inválido.');
          }
        }
        break;
    }

    return {
      valido: erros.length === 0,
      erros,
      alertas,
    };
  }
}
