import * as fs from 'fs';
import * as path from 'path';
import { TypeSafeClient, choice, noul, score } from '@typesafe-ai/sdk';
import {
  Beneficiario,
  ReceptorInfo,
  EmpresaVESInfo,
  ModalidadeInteriorizacao,
  IncidenteTransito,
  ResolucaoSalaSituacao,
  AnaliseNoShowIA,
  VagaCadastrada
} from '../types';

// Garante carregamento do .env caso ainda não esteja em process.env
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

function cleanJson(val: unknown) {
  return JSON.parse(JSON.stringify(val, (_, v) => (v === undefined ? null : v)));
}

export class TypeSafeAcolhidaService {
  private client: TypeSafeClient;

  constructor() {
    this.client = new TypeSafeClient();
  }

  /**
   * Julgamento 1: Classificação Inteligente da Modalidade de Interiorização (Choice)
   */
  async classificarModalidade(
    beneficiario: Beneficiario,
    receptor?: ReceptorInfo,
    empresa?: EmpresaVESInfo
  ): Promise<{
    modalidadeRecomendada: ModalidadeInteriorizacao;
    confianca: number;
    probabilidades: Record<string, number>;
  }> {
    const rawState = {
      beneficiario: {
        nome: beneficiario.nome,
        abrigoOrigem: beneficiario.abrigoOrigem ?? null,
        dependentes: beneficiario.dependentesMenores.length,
        relato: beneficiario.relatoSituacaoEContexto,
      },
      receptor: receptor
        ? {
            parentescoRelatado: receptor.grauParentescoRelatado,
            parentescoComprovado: receptor.parentescoComprovadoDocumentalmente,
            idade: receptor.idade,
            cidade: `${receptor.cidadeDestino}/${receptor.ufDestino}`,
          }
        : null,
      empresa: empresa
        ? {
            razaoSocial: empresa.razaoSocial,
            vaga: empresa.vagaOferecida,
            cidade: `${empresa.cidadeDestino}/${empresa.ufDestino}`,
          }
        : null,
    };

    const response = await this.client.systemOne({
      state: cleanJson(rawState),
      questions: {
        modalidade: choice(
          'Qual a modalidade oficial da Estratégia de Interiorização mais adequada?',
          {
            INSTITUCIONAL:
              'Modalidade abrigo-a-abrigo para pessoas em abrigos sem receptor familiar, social ou emprego prévio.',
            REUNIFICACAO_FAMILIAR:
              'Reencontro com familiares que residem regularmente no destino com vínculo documental comprovado.',
            REUNIAO_SOCIAL:
              'Reencontro com amigos, conhecidos ou parentes distantes sem comprovação documental formal (receptor maior de 21 anos).',
            VAGA_EMPREGO_SINALIZADA:
              'Inclusão no mercado de trabalho com contratação formal prévia por empresa no destino.',
          }
        ),
      },
    });

    const ans = response.answers.modalidade;
    return {
      modalidadeRecomendada: ans.choice as ModalidadeInteriorizacao,
      confianca: ans.confidence,
      probabilidades: ans.probabilities,
    };
  }

  /**
   * Julgamento 2: Triagem de Risco de Proteção e Vulnerabilidade (Score & Noul)
   */
  async avaliarRiscoProtecao(beneficiario: Beneficiario): Promise<{
    scoreGravidade: number;
    nivelVulnerabilidade: string;
    necessitaIntervencaoUrgenteONU: boolean;
    probabilidadeUrgencia: number;
    agenciasAcionadas: string[];
  }> {
    const rawState = {
      nome: beneficiario.nome,
      idade: beneficiario.dataNascimento,
      dependentes: beneficiario.dependentesMenores,
      saude: beneficiario.saude,
      relato: beneficiario.relatoSituacaoEContexto,
    };

    const response = await this.client.systemOne({
      state: cleanJson(rawState),
      questions: {
        gravidade_vulnerabilidade: score(
          'Avalie o nível de vulnerabilidade e necessidade de proteção especial humanitária do beneficiário.',
          [
            'Nível 0: Vulnerabilidade padrão migratória, sem riscos adicionais de proteção.',
            'Nível 1: Atenção moderada - família monoparental, crianças pequenas ou condições crônicas de saúde estáveis.',
            'Nível 2: Alto risco de proteção - menor desacompanhado ou separado, violência de gênero, risco imediato à vida ou saúde grave.',
          ]
        ),
        urgencia_protecao: noul(
          'O caso exige intervenção prioritária imediata de agências especializadas (UNICEF, UNFPA, ACNUR)?',
          {
            true: 'Requer encaminhamento de proteção prioritário antes do deslocamento.',
            false: 'Pode seguir o fluxo regular com acompanhamento padrão.',
          }
        ),
      },
    });

    const ansScore = response.answers.gravidade_vulnerabilidade;
    const ansUrgencia = response.answers.urgencia_protecao;

    const agencias: string[] = [];
    if (beneficiario.dependentesMenores.length > 0) agencias.push('UNICEF');
    if (beneficiario.saude.gestante) agencias.push('UNFPA');
    if (ansScore.score >= 1.0) agencias.push('ACNUR');

    return {
      scoreGravidade: ansScore.score,
      nivelVulnerabilidade:
        ansScore.score >= 1.4 ? 'ALTO_RISCO' : ansScore.score >= 0.7 ? 'ATENCAO_MODERADA' : 'BAIXO_RISCO',
      necessitaIntervencaoUrgenteONU: ansUrgencia.noul > 0.5,
      probabilidadeUrgencia: ansUrgencia.noul,
      agenciasAcionadas: agencias,
    };
  }

  /**
   * Julgamento 3: Avaliação de Viabilidade e Acolhimento do Receptor (Noul)
   */
  async avaliarViabilidadeReceptor(
    receptor: ReceptorInfo,
    quantidadeBeneficiarios: number
  ): Promise<{
    viavel: boolean;
    probabilidadeViabilidade: number;
    motivo: string;
  }> {
    const rawState = {
      receptor: {
        nome: receptor.nome,
        idade: receptor.idade,
        renda: receptor.rendaMensalDeclarada,
        capacidadeMoradiaPessoas: receptor.capacidadeAcomodacaoPessoas,
        cidade: `${receptor.cidadeDestino}/${receptor.ufDestino}`,
      },
      demanda: {
        totalPessoasAcolhidas: quantidadeBeneficiarios,
      },
    };

    const response = await this.client.systemOne({
      state: cleanJson(rawState),
      questions: {
        viabilidade: noul(
          'As condições de moradia e renda do receptor são suficientes e dignas para acolher este número de beneficiários sem risco de desabrigo?',
          {
            true: 'Condições adequadas e suficientes para acolhida digna.',
            false: 'Risco de superlotação, insuficiência de renda ou vulnerabilidade habitacional.',
          }
        ),
      },
    });

    const prob = response.answers.viabilidade.noul;
    return {
      viavel: prob >= 0.5,
      probabilidadeViabilidade: prob,
      motivo:
        prob >= 0.5
          ? 'Capacidade e renda compatíveis com a acolhida.'
          : 'Alerta de risco habitacional ou financeiro no destino.',
    };
  }

  /**
   * Julgamento 4: Sala de Situação do CCI - Gestão de Incidentes em Rota (Choice)
   */
  async resolverIncidenteSalaSituacao(
    incidente: IncidenteTransito,
    origem: string,
    destino: string
  ): Promise<ResolucaoSalaSituacao> {
    const rawState = {
      incidente: {
        tipo: incidente.tipo,
        descricao: incidente.descricao,
        local: incidente.localOcorrencia,
        dataHora: incidente.dataHora,
      },
      trajeto: { origem, destino },
    };

    const response = await this.client.systemOne({
      state: cleanJson(rawState),
      questions: {
        protocolo_acao: choice(
          'Qual protocolo oficial da Sala de Situação do CCI deve ser acionado de imediato?',
          {
            ACIONAR_SAMU_E_HOSPITAL:
              'Emergência médica grave a bordo ou no pouso. Acionar SAMU via torre de comando, remover para UPA e alojar familiares.',
            POUSO_FORCADO_APOIO_LOGISTICO:
              'Aeronave desviada ou pouso alternativo técnico. Reajustar alimentação, transporte e alojamento no local com equipe NURIN.',
            CASA_DE_PASSAGEM_48H:
              'Receptor ausente no desembarque. Encaminhar para Casa de Passagem / Alojamento de Trânsito por até 48 horas com nova tentativa de contato.',
            REAJUSTE_TRANSPORTE_CONEXAO:
              'Atraso logístico comum ou reprogramação de ônibus/voo de conexão.',
          }
        ),
      },
    });

    const ans = response.answers.protocolo_acao;

    const acoesMap: Record<string, string[]> = {
      ACIONAR_SAMU_E_HOSPITAL: [
        'Tripulação aciona torre de comando para solicitação imediata do SAMU na pista',
        'Equipe NURIN do local acompanha remoção à unidade de pronto atendimento',
        'Providenciar alojamento de apoio para acompanhantes e familiares',
        'Informar a coordenação do SUFAI e comando operacional',
      ],
      POUSO_FORCADO_APOIO_LOGISTICO: [
        'Acionar ponto focal do NURIN / Base Aérea no aeroporto alternado',
        'Fornecer alimentação de contingência a todos os passageiros',
        'Providenciar pernoite em hotel parceiro ou alojamento temporário',
        'Reprogramar trecho final com o CCLM/FAB ou companhia aérea',
      ],
      CASA_DE_PASSAGEM_48H: [
        'Conduzir o beneficiário para a Casa de Passagem / ATM local',
        'Registrar ocorrência no Sistema Acolhedor',
        'Equipe de assistência social realiza novas tentativas de contato com o receptor por 48 horas',
        'Caso não haja contato em 48h, acionar o Apoio Social do CCI para redirecionamento institucional',
      ],
      REAJUSTE_TRANSPORTE_CONEXAO: [
        'Comunicar os passageiros sobre o novo horário estimado',
        'Distribuir kit lanche pré-embarque',
        'Ajustar horário de recepção com a equipe no destino final',
      ],
    };

    return {
      protocoloAcionado: ans.choice,
      justificativaIA: `Classificado com confiança de ${(ans.confidence * 100).toFixed(0)}%`,
      confianca: ans.confidence,
      acoesImediatas: acoesMap[ans.choice] || ['Comunicar Sala de Situação do CCI'],
    };
  }

  /**
   * Julgamento 5: Detecção Preditiva de No-Show e Anti-Absenteísmo (Choice & Score)
   */
  async analisarEngajamentoENoShow(
    beneficiario: Beneficiario,
    respostaTexto: string,
    diasAteVoo: number
  ): Promise<AnaliseNoShowIA> {
    const rawState = {
      beneficiario: {
        nome: beneficiario.nome,
        abrigo: beneficiario.abrigoOrigem ?? 'Sem abrigo fixo',
        dependentes: beneficiario.dependentesMenores.length,
      },
      mensagemRecebida: respostaTexto,
      diasRestantesParaVoo: diasAteVoo,
    };

    const response = await this.client.systemOne({
      state: cleanJson(rawState),
      questions: {
        status_prontidao: choice(
          'Qual o status de prontidão e certeza de comparecimento do beneficiário com base na resposta?',
          {
            CONFIRMADO: 'Beneficiário confirma claramente que vai viajar e está ciente do horário.',
            DUVIDA_LOGISTICA: 'Beneficiário deseja viajar, mas tem dúvidas sobre malas, ponto de encontro ou regras.',
            RISCO_DESISTENCIA: 'Beneficiário demonstra hesitação, medo, desistência ou mudança de planos.',
            IMPEDIMENTO_MEDICO_DOCUMENTAL: 'Beneficiário relata febre, tosse, doença contagiosa ou extravio de documento.',
          }
        ),
        probabilidade_comparecimento: score(
          'Qual o grau de probabilidade de o beneficiário comparecer pontualmente ao embarque?',
          [
            'Nível 0: Não vai comparecer (desistência ou impedimento médico/documental).',
            'Nível 1: Comparecimento incerto (necessita orientação ou visita presencial de apoio).',
            'Nível 2: Comparecimento garantido (confirmado e sem pendências).',
          ]
        ),
        acao_preventiva: choice(
          'Qual ação operacional deve ser tomada imediatamente para não perder a vaga no voo?',
          {
            LIBERAR_EMBARQUE: 'Manter na lista de passageiros confirmados para o voo.',
            ENVIAR_ORIENTADOR_ABRIGO: 'Despachar orientador comunitário da OIM/ACNUR ao abrigo para sanar dúvidas e garantir presença.',
            ACIONAR_STANDBY_BANCO_RESERVA: 'Desistência iminente: convocar imediatamente o próximo suplente da lista de espera.',
            REMARCAR_JANELA_MEDICA: 'Sintomas de saúde ou perda documental: encaminhar ao médico do P Trg e remarcar voo.',
          }
        ),
      },
    });

    const statusChoice = response.answers.status_prontidao.choice as
      | 'CONFIRMADO'
      | 'DUVIDA_LOGISTICA'
      | 'RISCO_DESISTENCIA'
      | 'IMPEDIMENTO_MEDICO_DOCUMENTAL';

    const acaoChoice = response.answers.acao_preventiva.choice as
      | 'LIBERAR_EMBARQUE'
      | 'ENVIAR_ORIENTADOR_ABRIGO'
      | 'ACIONAR_STANDBY_BANCO_RESERVA'
      | 'REMARCAR_JANELA_MEDICA';

    const scoreValue = response.answers.probabilidade_comparecimento.score;
    const probPercent = scoreValue / 2;

    return {
      statusProntidao: statusChoice,
      probabilidadeComparecimento: probPercent,
      acaoRecomendada: acaoChoice,
      justificativa: `Status classificado como ${statusChoice} com probabilidade de presença estimada em ${(probPercent * 100).toFixed(0)}%`,
    };
  }

  /**
   * Julgamento 6: Match Semântico de Perfil Profissional para Emprego no Destino (Score & Choice)
   * Identifica se uma vaga aberta na mesma cidade da família/amigo é compatível com o perfil do migrante
   */
  async avaliarMatchProfissional(
    beneficiario: Beneficiario,
    vaga: VagaCadastrada
  ): Promise<{
    aderenciaScore: number;
    compatibilidadePercent: number;
    recomendacao: 'PROPOR_CONVERGENCIA_VES' | 'MANTER_APENAS_RF_RS';
    parecer: string;
  }> {
    const rawState = {
      candidato: {
        nome: beneficiario.nome,
        ocupacao: beneficiario.perfilProfissional?.ocupacaoPrincipal ?? 'Não informada',
        experiencias: beneficiario.perfilProfissional?.experienciasAnteriores ?? [],
        habilidades: beneficiario.perfilProfissional?.habilidadesTecnicas ?? [],
        escolaridade: beneficiario.perfilProfissional?.escolaridade ?? 'Ensino Médio',
      },
      vaga: {
        titulo: vaga.tituloCargo,
        empresa: vaga.empresa.razaoSocial,
        requisitos: vaga.descricaoRequisitos,
        cidade: `${vaga.cidade}/${vaga.uf}`,
        salario: vaga.salario,
      },
    };

    const response = await this.client.systemOne({
      state: cleanJson(rawState),
      questions: {
        grau_aderencia: score(
          'Avalie o nível de compatibilidade profissional do candidato com os requisitos da vaga.',
          [
            'Nível 0: Incompatível (perfil sem aderência aos requisitos básicos).',
            'Nível 1: Compatibilidade Parcial (perfil adaptável ou habilidades correlatas).',
            'Nível 2: Alta Aderência (perfil atende plenamente aos requisitos e experiência exigida).',
          ]
        ),
        recomendacao_estrategica: choice(
          'Recomenda propor ao migrante a modalidade híbrida/convergente (VES com acolhida familiar na mesma cidade)?',
          {
            PROPOR_CONVERGENCIA_VES:
              'Alta sinergia: oferecer a vaga formal para que o migrante já chegue empregado na mesma cidade onde a família/amigos residem.',
            MANTER_APENAS_RF_RS:
              'Baixa aderência ou sem interesse: manter o processo regular apenas de reencontro familiar/social.',
          }
        ),
      },
    });

    const scoreValue = response.answers.grau_aderencia.score;
    const compatPercent = scoreValue / 2;
    const recChoice = response.answers.recomendacao_estrategica.choice as
      | 'PROPOR_CONVERGENCIA_VES'
      | 'MANTER_APENAS_RF_RS';

    return {
      aderenciaScore: scoreValue,
      compatibilidadePercent: compatPercent,
      recomendacao: recChoice,
      parecer: `Compatibilidade profissional avaliada em ${(compatPercent * 100).toFixed(0)}% com recomendação para ${recChoice}.`,
    };
  }
}
