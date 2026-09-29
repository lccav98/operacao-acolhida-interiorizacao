import {
  Beneficiario,
  ReceptorInfo,
  EmpresaVESInfo,
  ProcessoInteriorizacao,
  IncidenteTransito,
  ModalidadeInteriorizacao,
  MarcoTemporalLembrete,
} from './types';
import { TypeSafeAcolhidaService } from './services/typesafe';
import { ValidadorDocumental } from './modules/pre-deslocamento/documental';
import { AvaliadorMedicoFFT } from './modules/pre-deslocamento/medico-fft';
import { GestorLogistico } from './modules/deslocamento/logistica';
import { SalaSituacaoCCI } from './modules/deslocamento/sala-situacao';
import { GestorNURIN } from './modules/pos-deslocamento/nurin';
import { NotificadorAntiAbsenteismo } from './modules/engajamento-presenca/notificador';
import { BancoReservaStandby } from './modules/engajamento-presenca/banco-reserva';
import { MotorPriorizacaoAutomatizada } from './modules/otimizacao-tempo/motor-priorizacao';
import { MotorMatchVagasLocal } from './modules/cruzamento-vagas/motor-match';

export class WorkflowInteriorizacaoRunner {
  private typesafeService: TypeSafeAcolhidaService;
  private salaSituacao: SalaSituacaoCCI;

  constructor() {
    this.typesafeService = new TypeSafeAcolhidaService();
    this.salaSituacao = new SalaSituacaoCCI(this.typesafeService);
  }

  /**
   * Executa todo o fluxo de ponta a ponta da Estratégia de Interiorização
   * com ferramentas automatizadas de engajamento, anti-absenteísmo, match de vagas e otimização
   */
  async processarCaso(
    beneficiario: Beneficiario,
    receptor?: ReceptorInfo,
    empresa?: EmpresaVESInfo,
    incidenteSimulado?: IncidenteTransito,
    simulacaoRespostaBeneficiario?: {
      marco: MarcoTemporalLembrete;
      respostaTexto: string;
    }
  ): Promise<ProcessoInteriorizacao> {
    const timestamp = new Date().toISOString();
    const protocolo = `ACOLHIDA-${Date.now().toString().slice(-6)}`;

    console.log(`\n======================================================`);
    console.log(`INICIANDO PROCESSO DE INTERIORIZAÇÃO: [${protocolo}]`);
    console.log(`Beneficiário: ${beneficiario.nome} | Local: ${beneficiario.localAtual}`);
    console.log(`======================================================\n`);

    // ETAPA 1: Otimização de Tempo - Ranqueamento e Priorização Instantânea
    console.log(`▶ [Etapa 1/7] Cálculo instantâneo de prioridade na fila (Substitui planilhas manuais)...`);
    const prioridade = MotorPriorizacaoAutomatizada.calcularPrioridade(beneficiario);
    console.log(`✔ Score de Prioridade: ${prioridade.scorePrioridade} pts`);
    prioridade.criteriosPontuados.forEach((c) => console.log(`   • ${c}`));

    // ETAPA 2: Classificação Inteligente da Modalidade com Motor de Inteligência Artificial Federal
    console.log(`\n▶ [Etapa 2/7] Classificando modalidade com Motor de Inteligência Artificial Federal...`);
    const modalidadeResult = await this.typesafeService.classificarModalidade(
      beneficiario,
      receptor,
      empresa
    );
    const modalidade: ModalidadeInteriorizacao = modalidadeResult.modalidadeRecomendada;
    console.log(
      `✔ Modalidade inicial: ${modalidade} (Confiança IA: ${(modalidadeResult.confianca * 100).toFixed(0)}%)`
    );

    const processo: ProcessoInteriorizacao = {
      protocoloProcesso: protocolo,
      dataCriacao: timestamp,
      status: 'CADASTRADO',
      modalidade,
      beneficiario,
      receptor,
      empresaVES: empresa,
      historicoMensagensEngajamento: [],
      historicoEtapas: [
        {
          fase: 'CLASSIFICACAO_MODALIDADE',
          descricao: `Modalidade classificada como ${modalidade} via IA Federal`,
          dataHora: new Date().toISOString(),
          aprovado: true,
          detalhes: {
            confianca: modalidadeResult.confianca,
            probabilidades: modalidadeResult.probabilidades,
            scorePrioridade: prioridade.scorePrioridade,
          },
        },
      ],
    };

    // NOVO RECURSO: MATCH CRUZADO (Reunificação Familiar / Reunião Social + Vaga no Destino)
    if (
      (modalidade === 'REUNIFICACAO_FAMILIAR' || modalidade === 'REUNIAO_SOCIAL') &&
      receptor &&
      beneficiario.perfilProfissional
    ) {
      console.log(`\n🎯 [MATCH CRUZADO INTELIGENTE] Cruzando cadastro profissional com vagas em ${receptor.cidadeDestino}/${receptor.ufDestino}...`);
      const matchOportunidade = await MotorMatchVagasLocal.identificarOportunidadeConvergente(
        beneficiario,
        receptor.cidadeDestino,
        receptor.ufDestino,
        this.typesafeService
      );

      if (matchOportunidade) {
        processo.matchVESOportunidade = matchOportunidade;
        console.log(`\n✨ =========================================================`);
        console.log(`✨ OPORTUNIDADE CONVERGENTE IDENTIFICADA COM SUCESSO!`);
        console.log(`✨ Cargo: ${matchOportunidade.vaga.tituloCargo} na empresa ${matchOportunidade.vaga.empresa.razaoSocial}`);
        console.log(`✨ Cidade: ${receptor.cidadeDestino}/${receptor.ufDestino} (Mesmo local da família/amigo!)`);
        console.log(`✨ Salário Inicial: R$ ${matchOportunidade.vaga.salario.toFixed(2)}`);
        console.log(`✨ Compatibilidade IA: ${(matchOportunidade.compatibilidadePercent * 100).toFixed(0)}%`);
        console.log(`✨ Benefício: ${matchOportunidade.beneficioConvergente}`);
        console.log(`✨ =========================================================\n`);

        processo.historicoEtapas.push({
          fase: 'MATCH_CONVERGENTE_VES',
          descricao: `Match profissional identificado em ${receptor.cidadeDestino}: ${matchOportunidade.vaga.tituloCargo}`,
          dataHora: new Date().toISOString(),
          aprovado: true,
          detalhes: {
            vagaId: matchOportunidade.vaga.idVaga,
            compatibilidade: matchOportunidade.compatibilidadePercent,
            parecer: matchOportunidade.parecerIA,
          },
        });
      }
    }

    // ETAPA 3: Revisão Documental Estrita
    console.log(`▶ [Etapa 3/7] Executando validação documental (P Trg)...`);
    const docResult = ValidadorDocumental.validar(modalidade, beneficiario, receptor, empresa);
    if (!docResult.valido) {
      console.error(`❌ Reprovado na revisão documental:`, docResult.erros);
      processo.status = 'PENDENCIA_DOCUMENTAL';
      processo.historicoEtapas.push({
        fase: 'REVISAO_DOCUMENTAL',
        descricao: 'Pendência documental impeditiva',
        dataHora: new Date().toISOString(),
        aprovado: false,
        detalhes: { erros: docResult.erros },
      });
      return processo;
    }
    console.log(`✔ Documentação validada com sucesso! Alertas: ${docResult.alertas.length}`);

    // ETAPA 4: Triagem de Risco e Proteção Especial (Score & Noul)
    console.log(`▶ [Etapa 4/7] Triagem de proteção com Motor de Inteligência Artificial Federal...`);
    const protecaoResult = await this.typesafeService.avaliarRiscoProtecao(beneficiario);
    console.log(
      `✔ Nível de Vulnerabilidade: ${protecaoResult.nivelVulnerabilidade} (Score: ${protecaoResult.scoreGravidade.toFixed(2)})`
    );
    if (protecaoResult.necessitaIntervencaoUrgenteONU) {
      console.log(
        `🚨 Atenção Especial de Proteção acionada! Agências: ${protecaoResult.agenciasAcionadas.join(', ')}`
      );
    }

    if (receptor) {
      const viabilidade = await this.typesafeService.avaliarViabilidadeReceptor(
        receptor,
        beneficiario.dependentesMenores.length + 1
      );
      console.log(
        `✔ Análise de viabilidade do receptor no destino: ${viabilidade.motivo} (Probabilidade: ${(viabilidade.probabilidadeViabilidade * 100).toFixed(0)}%)`
      );
    }

    // ETAPA 5: Avaliação Médica FFT / PPV
    console.log(`▶ [Etapa 5/7] Avaliação médica e sanitária (Fitness for Travel / PPV)...`);
    const fftResult = AvaliadorMedicoFFT.avaliar(beneficiario.saude);
    if (!fftResult.aptoParaViagem) {
      console.error(`❌ Inapto para viagem no momento: ${fftResult.motivoInaptidao}`);
      processo.status = 'INAPTO_MEDICO';
      processo.historicoEtapas.push({
        fase: 'AVALIACAO_MEDICA_FFT',
        descricao: fftResult.motivoInaptidao || 'Inapto temporário',
        dataHora: new Date().toISOString(),
        aprovado: false,
      });
      return processo;
    }
    console.log(`✔ Apto para viagem (PPV). Medidas sanitárias conformes.`);

    // ETAPA 6: Planejamento Logístico & Controle Anti-Absenteísmo
    console.log(`▶ [Etapa 6/7] Planejamento de voo e acionamento do controle anti-absenteísmo...`);
    const cidadeDestino =
      receptor?.cidadeDestino || empresa?.cidadeDestino || 'Curitiba';
    const ufDestino = receptor?.ufDestino || empresa?.ufDestino || 'PR';

    const logistica = GestorLogistico.planejarTrajeto(
      beneficiario,
      cidadeDestino,
      ufDestino,
      beneficiario.dependentesMenores.length + 1
    );
    processo.logistica = logistica;

    // Disparo dos marcos de engajamento D-7, D-3, D-1
    const msgD7 = NotificadorAntiAbsenteismo.gerarMensagem(
      beneficiario,
      'D_MENOS_7',
      logistica.dataPrevistaEmbarque,
      cidadeDestino
    );
    const msgD3 = NotificadorAntiAbsenteismo.gerarMensagem(
      beneficiario,
      'D_MENOS_3',
      logistica.dataPrevistaEmbarque,
      cidadeDestino
    );
    const msgD1 = NotificadorAntiAbsenteismo.gerarMensagem(
      beneficiario,
      'D_MENOS_1',
      logistica.dataPrevistaEmbarque,
      cidadeDestino
    );

    processo.historicoMensagensEngajamento = [msgD7, msgD3, msgD1];
    console.log(`✔ Mensagens automatizadas de engajamento (WhatsApp/SMS em Espanhol) disparadas: D-7, D-3, D-1.`);

    // Análise Semântica de Resposta do Beneficiário com Motor de IA Federal
    let prosseguirComBeneficiarioOriginal = true;

    if (simulacaoRespostaBeneficiario) {
      console.log(`\n💬 Mensagem recebida do beneficiário [${simulacaoRespostaBeneficiario.marco}]: "${simulacaoRespostaBeneficiario.respostaTexto}"`);
      console.log(`🧠 Avaliando risco de No-Show com Motor de Inteligência Artificial Federal (Choice & Score)...`);

      const diasAteVoo = simulacaoRespostaBeneficiario.marco === 'D_MENOS_1' ? 1 : 3;
      const analiseNoShow = await this.typesafeService.analisarEngajamentoENoShow(
        beneficiario,
        simulacaoRespostaBeneficiario.respostaTexto,
        diasAteVoo
      );
      processo.analiseNoShow = analiseNoShow;

      console.log(`📊 Status de Prontidão: ${analiseNoShow.statusProntidao}`);
      console.log(`🎯 Probabilidade de Comparecimento: ${(analiseNoShow.probabilidadeComparecimento * 100).toFixed(0)}%`);
      console.log(`⚡ Ação Operacional Recomendada: ${analiseNoShow.acaoRecomendada}`);

      if (analiseNoShow.acaoRecomendada === 'ACIONAR_STANDBY_BANCO_RESERVA') {
        processo.status = 'RISCO_NO_SHOW_DETECTADO';
        console.log(`⚠️ ALTO RISCO DE NO-SHOW! Acionando Banco de Reserva para não perder o assento no voo...`);
        const suplente = BancoReservaStandby.convocarSuplente(cidadeDestino);
        if (suplente) {
          console.log(`✔ Assento reatribuído com sucesso para o suplente: ${suplente.nome}`);
          processo.status = 'SUBSTITUIDO_POR_SUPLENTE';
          prosseguirComBeneficiarioOriginal = false;
        }
      } else if (analiseNoShow.acaoRecomendada === 'ENVIAR_ORIENTADOR_ABRIGO') {
        console.log(`🏃 Equipe de campo despachada ao abrigo para orientação presencial e resgate do caso.`);
        processo.status = 'CONFIRMADO_PARA_EMBARQUE';
      } else {
        processo.status = 'CONFIRMADO_PARA_EMBARQUE';
      }
    } else {
      processo.status = 'CONFIRMADO_PARA_EMBARQUE';
    }

    if (!prosseguirComBeneficiarioOriginal) {
      console.log(`\n======================================================`);
      console.log(`PROCESSO FINALIZADO: Status = ${processo.status} (Voo protegido contra no-show)`);
      console.log(`======================================================\n`);
      return processo;
    }

    // Inspeção pré-embarque ANAC
    const inspecaoANAC = GestorLogistico.inspecionarPreEmbarque(false, true);
    if (!inspecaoANAC.liberadoParaEmbarque) {
      console.error(`❌ Bloqueio ANAC: ${inspecaoANAC.motivoBloqueio}`);
      return processo;
    }
    console.log(
      `✔ Voo/Modal definido: ${logistica.modal} | Origem: ${logistica.cidadeOrigem} -> Destino: ${logistica.aeroportoOuBaseDestino}`
    );

    // ETAPA 7: Trânsito, Sala de Situação e Desembarque
    processo.status = 'EM_DESLOCAMENTO';
    console.log(`\n▶ [Etapa 7/7] Em deslocamento para ${cidadeDestino}...`);

    if (incidenteSimulado) {
      console.log(`⚠️ ALERTA DA SALA DE SITUAÇÃO DO CCI: ${incidenteSimulado.descricao}`);
      const resolucao = await this.salaSituacao.tratarIncidente(
        incidenteSimulado,
        logistica.cidadeOrigem,
        cidadeDestino
      );
      console.log(`🚨 Protocolo acionado via IA: ${resolucao.protocoloAcionado}`);
      resolucao.acoesImediatas.forEach((acao, i) => console.log(`   ${i + 1}. ${acao}`));

      processo.historicoEtapas.push({
        fase: 'SALA_SITUACAO_CCI',
        descricao: `Incidente: ${incidenteSimulado.descricao} -> ${resolucao.protocoloAcionado}`,
        dataHora: new Date().toISOString(),
        aprovado: true,
        detalhes: {
          protocolo: resolucao.protocoloAcionado,
          justificativa: resolucao.justificativaIA,
          acoes: resolucao.acoesImediatas,
        },
      });

      if (resolucao.protocoloAcionado === 'CASA_DE_PASSAGEM_48H') {
        processo.status = 'CASA_PASSAGEM_CONTINGENCIA';
      }
    } else {
      processo.status = 'DESEMBARCADO';
      console.log(`✔ Desembarque concluído com sucesso no destino.`);
    }

    // Integração Local pelo NURIN
    console.log(`▶ Articulando integração local no destino pelo NURIN...`);
    const nurin = GestorNURIN.articularIntegracaoLocal(
      beneficiario,
      modalidade,
      cidadeDestino,
      ufDestino
    );
    processo.encaminhamentosNurin = nurin;
    if (processo.status !== 'CASA_PASSAGEM_CONTINGENCIA') {
      processo.status = 'MONITORAMENTO_NURIN';
    }

    console.log(`\n======================================================`);
    console.log(`PROCESSO FINALIZADO: Status = ${processo.status}`);
    console.log(`Articulação local: CRAS/CREAS: OK | SUS: OK | Escolas: ${nurin.vagasEscolaresArticuladas ? 'OK' : 'N/A'}`);
    if (processo.matchVESOportunidade) {
      console.log(`🌟 MATCH PROFISSIONAL NO DESTINO: ${processo.matchVESOportunidade.vaga.tituloCargo} na ${processo.matchVESOportunidade.vaga.empresa.razaoSocial}`);
    }
    console.log(`======================================================\n`);

    return processo;
  }
}
