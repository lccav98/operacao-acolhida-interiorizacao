import { WorkflowInteriorizacaoRunner } from './workflow-runner';
import { Beneficiario, ReceptorInfo, EmpresaVESInfo } from './types';
import { BancoReservaStandby } from './modules/engajamento-presenca/banco-reserva';
import { MotorPriorizacaoAutomatizada } from './modules/otimizacao-tempo/motor-priorizacao';

async function main() {
  const runner = new WorkflowInteriorizacaoRunner();

  console.log(`\n################################################################`);
  console.log(`### SISTEMA AUTOMATIZADO DE INTERIORIZAÇÃO - OPERAÇÃO ACOLHIDA ###`);
  console.log(`###   COM MATCH CONVERGENTE (REUNIFICAÇÃO + EMPREGO LOCAL)    ###`);
  console.log(`################################################################\n`);

  // =========================================================================
  // DEMO 1: OTIMIZAÇÃO TEMPORAL - MOTOR DE PRIORIZAÇÃO E LISTAS OFICIAIS
  // =========================================================================
  console.log(`================================================================`);
  console.log(`>>> MÓDULO 1: REDUÇÃO TEMPORAL - GERAÇÃO AUTOMÁTICA DE LISTAS <<<`);
  console.log(`================================================================`);

  const candidatosFila: Beneficiario[] = [
    {
      id: 'BEN-101',
      nome: 'Carlos Manuel Silva',
      dataNascimento: '1985-04-12',
      nacionalidade: 'Venezuelana',
      documentoIdentidade: 'V-18.234.111',
      cpf: '111.222.333-44',
      telefoneContato: '+55 95 99111-2233',
      declaracaoVoluntariedadeAssinada: true,
      localAtual: 'BOA_VISTA',
      abrigoOrigem: 'Rondon 1',
      dataEntradaBrasil: '2019-06-10',
      documentacaoMigratoria: {
        tipo: 'SOLICITACAO_REFUGIO',
        numeroProtocolo: 'PROTO-PF-2019/12345',
        dataEmissao: '2019-06-15',
        regular: true,
      },
      dependentesMenores: [
        { nome: 'Ana Silva', idade: 5, parentesco: 'Filha', guardaRegularizadaOuAutorizacaoViagemCartorio: true },
        { nome: 'Mateo Silva', idade: 9, parentesco: 'Filho', guardaRegularizadaOuAutorizacaoViagemCartorio: true },
      ],
      saude: {
        vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 30 },
        vacinaTripliceViral: { primeiraDoseAplicada: true },
        sintomasEpidemicos: false,
        gestante: true,
      },
      relatoSituacaoEContexto: 'Família em vulnerabilidade alta no Rondon 1.',
    },
    {
      id: 'BEN-102',
      nome: 'Pedro Rojas',
      dataNascimento: '1998-09-01',
      nacionalidade: 'Venezuelana',
      documentoIdentidade: 'V-27.111.444',
      cpf: '555.666.777-88',
      telefoneContato: '+55 95 99222-3344',
      declaracaoVoluntariedadeAssinada: true,
      localAtual: 'BOA_VISTA',
      abrigoOrigem: 'Tuaranoko',
      dataEntradaBrasil: '2021-02-01',
      documentacaoMigratoria: {
        tipo: 'RESIDENCIA_TEMPORARIA',
        numeroProtocolo: 'RES-PF-2021/44332',
        dataEmissao: '2021-02-05',
        regular: true,
      },
      dependentesMenores: [],
      saude: {
        vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 20 },
        vacinaTripliceViral: { primeiraDoseAplicada: true },
        sintomasEpidemicos: false,
        gestante: false,
      },
      relatoSituacaoEContexto: 'Jovem adulto sem dependentes.',
    },
  ];

  const filaOrdenada = MotorPriorizacaoAutomatizada.ordenarFila(candidatosFila);
  console.log(`✔ Base processada instantaneamente! 1º Lugar: ${filaOrdenada[0].beneficiario.nome} (${filaOrdenada[0].scorePrioridade} pts)`);

  // Alimenta o banco de reserva
  const suplenteStandby: Beneficiario = {
    id: 'BEN-SUPLENTE-99',
    nome: 'Yelena Valentina Marquez',
    dataNascimento: '1990-03-22',
    nacionalidade: 'Venezuelana',
    documentoIdentidade: 'V-21.998.441',
    cpf: '777.888.999-00',
    telefoneContato: '+55 95 99777-8899',
    declaracaoVoluntariedadeAssinada: true,
    localAtual: 'BOA_VISTA',
    abrigoOrigem: 'Rondon 5',
    dataEntradaBrasil: '2020-01-10',
    documentacaoMigratoria: {
      tipo: 'SOLICITACAO_REFUGIO',
      numeroProtocolo: 'PROTO-PF-2020/55112',
      dataEmissao: '2020-01-15',
      regular: true,
    },
    dependentesMenores: [],
    saude: {
      vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 40 },
      vacinaTripliceViral: { primeiraDoseAplicada: true },
      sintomasEpidemicos: false,
      gestante: false,
    },
    relatoSituacaoEContexto: 'Suplente pré-triada e apta no P Trg aguardando chamada imediata.',
  };
  BancoReservaStandby.cadastrarSuplente(suplenteStandby);

  // =========================================================================
  // DEMO 2: MATCH CONVERGENTE (REUNIFICAÇÃO FAMILIAR + VAGA NO DESTINO)
  // =========================================================================
  console.log(`\n================================================================`);
  console.log(`>>> MÓDULO 2: MATCH CONVERGENTE (REUNIFICAÇÃO FAMILIAR + VAGA) <<<`);
  console.log(`================================================================`);
  console.log(`(O migrante deseja se reunir com o esposo em Curitiba; o sistema identifica`);
  console.log(`que uma empresa local em Curitiba busca exatamente o seu perfil profissional!)`);

  const beneficiariaComMatch: Beneficiario = {
    id: 'BEN-001',
    nome: 'Maria Gabriela Hernandez',
    dataNascimento: '1992-05-14',
    nacionalidade: 'Venezuelana',
    documentoIdentidade: 'V-24.891.022',
    cpf: '123.456.789-01',
    telefoneContato: '+55 95 99123-4567',
    declaracaoVoluntariedadeAssinada: true,
    localAtual: 'BOA_VISTA',
    abrigoOrigem: 'Anexo Rondon 1',
    dataEntradaBrasil: '2020-05-10',
    documentacaoMigratoria: {
      tipo: 'SOLICITACAO_REFUGIO',
      numeroProtocolo: 'PROTO-PF-2021/887612',
      dataEmissao: '2021-03-10',
      regular: true,
    },
    dependentesMenores: [
      {
        nome: 'Lucas Hernandez',
        idade: 6,
        parentesco: 'Filho',
        guardaRegularizadaOuAutorizacaoViagemCartorio: true,
      },
    ],
    saude: {
      vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 45 },
      vacinaTripliceViral: { primeiraDoseAplicada: true },
      sintomasEpidemicos: false,
      gestante: false,
    },
    relatoSituacaoEContexto:
      'Mãe viajando com filho de 6 anos para reencontrar o esposo em Curitiba.',
    perfilProfissional: {
      ocupacaoPrincipal: 'Operadora de Embalagem e Separação',
      experienciasAnteriores: [
        '3 anos em linha de produção e embalagem de alimentos na Venezuela',
        'Separação e controle de mercadorias em estoque',
      ],
      habilidadesTecnicas: ['Empacotamento ágil', 'Controle de qualidade', 'Manipulação de alimentos'],
      escolaridade: 'Ensino Médio Completo',
      interesseEmpregoDestino: true,
    },
  };

  const receptorCuritiba: ReceptorInfo = {
    nome: 'Carlos Eduardo Hernandez',
    cpf: '987.654.321-09',
    idade: 34,
    grauParentescoRelatado: 'Esposo / Pai',
    parentescoComprovadoDocumentalmente: true,
    comprovanteResidenciaValido: true,
    rendaMensalDeclarada: 3200.0,
    capacidadeAcomodacaoPessoas: 3,
    cidadeDestino: 'Curitiba',
    ufDestino: 'PR',
    telefoneContato: '+55 41 98877-6655',
  };

  await runner.processarCaso(beneficiariaComMatch, receptorCuritiba, undefined, undefined, {
    marco: 'D_MENOS_1',
    respostaTexto:
      '¡Buenas noches! Confirmamos que ya tenemos las maletas listas y estaremos puntuales a las 6:00 AM en el P Trg.',
  });

  // =========================================================================
  // DEMO 3: DETECÇÃO DE NO-SHOW / DESISTÊNCIA E CONVOCAÇÃO DE SUPLENTE
  // =========================================================================
  console.log(`\n================================================================`);
  console.log(`>>> MÓDULO 3: PREVENÇÃO DE ASSENTO VAZIO - DESISTÊNCIA DETECTADA <<<`);
  console.log(`================================================================`);

  const beneficiarioDesistencia: Beneficiario = {
    id: 'BEN-004',
    nome: 'Ricardo Alberto Gomez',
    dataNascimento: '1987-10-05',
    nacionalidade: 'Venezuelana',
    documentoIdentidade: 'V-20.123.456',
    cpf: '888.999.000-11',
    telefoneContato: '+55 95 99333-7788',
    declaracaoVoluntariedadeAssinada: true,
    localAtual: 'BOA_VISTA',
    abrigoOrigem: 'BV-8',
    dataEntradaBrasil: '2020-08-12',
    documentacaoMigratoria: {
      tipo: 'SOLICITACAO_REFUGIO',
      numeroProtocolo: 'PROTO-PF-2020/77665',
      dataEmissao: '2020-08-15',
      regular: true,
    },
    dependentesMenores: [],
    saude: {
      vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 25 },
      vacinaTripliceViral: { primeiraDoseAplicada: true },
      sintomasEpidemicos: false,
      gestante: false,
    },
    relatoSituacaoEContexto: 'Beneficiário selecionado para vaga de emprego.',
  };

  const empresaVES: EmpresaVESInfo = {
    razaoSocial: 'AgroSul Frigoríficos S.A.',
    cnpj: '99.888.777/0001-22',
    vagaOferecida: 'Auxiliar Operacional',
    salarioMensal: 2350,
    ofereceMoradia: true,
    cidadeDestino: 'Chapecó',
    ufDestino: 'SC',
    obiceListaTrabalhoEscravo: false,
    obiceCEIS_CNEP: false,
    declaracaoIntencoesAssinada: true,
  };

  await runner.processarCaso(beneficiarioDesistencia, undefined, empresaVES, undefined, {
    marco: 'D_MENOS_1',
    respostaTexto:
      'Mire, muchas gracias pero mi hermano me consiguió un trabajo aquí en Boa Vista y ya no quiero viajar mañana. Cancelen mi pasaje por favor.',
  });

  console.log(`\n======================================================`);
  console.log(`✔ DEMONSTRAÇÃO COMPLETA CONCLUÍDA COM ÊXITO TOTAL!`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('Erro na execução do sistema:', err);
});
