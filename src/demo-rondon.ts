import { ClassificadorAbrigadosRondon } from './modules/abrigados/classificador-grupos';
import { RegistroAbrigadoRondon } from './types/shelter';
import { BancoVagasEmprego } from './modules/cruzamento-vagas/banco-vagas';
import { TypeSafeAcolhidaService } from './services/typesafe';

// Amostra representativa extraída da base do Abrigo Rondon 1 fornecida pelo usuário
const amostraRondon1: RegistroAbrigadoRondon[] = [
  {
    emgId: 'EMG-00147494',
    nomeCompleto: 'LEODAGNYS ELADIO BARCELO GARRIDO',
    cpf: '603.068.860-06',
    idade: 50,
    sexo: 'Male',
    perfilFamiliar: 'FMAd - Família Monoparental com Adultos (+18a)',
    relacionamento: 'Irmão',
    codigoGrupoFamiliar: 'EMG-22-10873',
    quantidadePessoasFamilia: 2,
    situacaoCivil: 'Solteiro(a)',
    dataEntradaAbrigo: '2022-11-25',
    diasAbrigado: 1399,
    pcd: false,
    gravida: false,
    beneficiosRelato: 'BPC',
    beneficiosPortal: 'Favorecido BPC',
    nacionalidade: 'Venezuela',
    carpa: 'J13',
  },
  {
    emgId: 'EMG-116169197',
    nomeCompleto: 'GENESIS CAROLINA MOTA VELASQUEZ',
    cpf: '118.829.232-35',
    idade: 34,
    sexo: 'Female',
    perfilFamiliar: 'FMCA - Familia Monoparental com Criança e Adolescente',
    relacionamento: 'Ponto Focal',
    codigoGrupoFamiliar: 'EMG-25-6401025',
    quantidadePessoasFamilia: 6,
    situacaoCivil: 'Solteiro(a)',
    dataEntradaAbrigo: '2025-12-10',
    diasAbrigado: 288,
    pcd: false,
    gravida: true,
    nacionalidade: 'Venezuela',
    carpa: 'L13',
  },
  {
    emgId: 'EMG-113523807',
    nomeCompleto: 'JORGE LUIS RANGEL ACEVEDO',
    cpf: '116.723.972-51',
    idade: 57,
    sexo: 'Male',
    perfilFamiliar: 'HD - Homem Desacompanhado',
    relacionamento: 'Ponto Focal',
    codigoGrupoFamiliar: 'EMG-25-5499587',
    quantidadePessoasFamilia: 1,
    situacaoCivil: 'Solteiro(a)',
    dataEntradaAbrigo: '2025-07-10',
    diasAbrigado: 441,
    pcd: true,
    gravida: false,
    nacionalidade: 'Venezuela',
    carpa: 'K17',
  },
  {
    emgId: 'EMG-00011269',
    nomeCompleto: 'SIMON RAFAEL BERMUDEZ HERRERA',
    cpf: '713.465.501-66',
    idade: 54,
    sexo: 'Male',
    perfilFamiliar: 'HD - Homem Desacompanhado',
    relacionamento: 'Ponto Focal',
    codigoGrupoFamiliar: 'EMG-18-04912',
    quantidadePessoasFamilia: 1,
    situacaoCivil: 'Solteiro(a)',
    dataEntradaAbrigo: '2022-03-15',
    diasAbrigado: 1654,
    pcd: false,
    gravida: false,
    beneficiosRelato: 'BOLSA FAMILIA',
    nacionalidade: 'Venezuela',
    carpa: 'S15',
  },
  {
    emgId: 'EMG-00135483',
    nomeCompleto: 'VALENTINA YREVSUY TIRADO',
    cpf: '710.871.602-00',
    idade: 28,
    sexo: 'Female',
    perfilFamiliar: 'FMC - Familia Monoparental com Criança (-12a)',
    relacionamento: 'Ponto Focal',
    codigoGrupoFamiliar: 'EMG-22-04486',
    quantidadePessoasFamilia: 5,
    situacaoCivil: 'Casado(a) em União Estável',
    dataEntradaAbrigo: '2023-12-10',
    diasAbrigado: 1019,
    pcd: false,
    gravida: false,
    beneficiosRelato: 'BOLSA FAMILIA',
    nacionalidade: 'Venezuela',
    carpa: 'A05',
  },
  {
    emgId: 'EMG-117091068',
    nomeCompleto: 'JESUSITA DEL VALLE DURAN RODRIGUEZ',
    cpf: '120.959.812-43',
    idade: 19,
    sexo: 'Female',
    perfilFamiliar: 'FMC - Familia Monoparental com Criança (-12a)',
    relacionamento: 'Ponto Focal',
    codigoGrupoFamiliar: 'EMG-26-6813788',
    quantidadePessoasFamilia: 2,
    situacaoCivil: 'Solteiro(a)',
    dataEntradaAbrigo: '2026-06-30',
    diasAbrigado: 86,
    pcd: false,
    gravida: false,
    nacionalidade: 'Venezuela',
    carpa: 'J06',
  },
  {
    emgId: 'EMG-117096650',
    nomeCompleto: 'ENRIQUE JOSE SUAREZ',
    cpf: '120.977.452-61',
    idade: 51,
    sexo: 'Male',
    perfilFamiliar: 'FPCA - Família Pluriparental com Criança e Adolescente',
    relacionamento: 'Companheiro em União Estável',
    codigoGrupoFamiliar: 'EMG-26-6815963',
    quantidadePessoasFamilia: 6,
    situacaoCivil: 'Solteiro(a)',
    dataEntradaAbrigo: '2026-06-26',
    diasAbrigado: 90,
    pcd: false,
    gravida: false,
    nacionalidade: 'Venezuela',
    carpa: 'P07',
  },
  {
    emgId: 'EMG-117096556',
    nomeCompleto: 'CARLIS DEL VALLE RIVERA GONZALEZ',
    cpf: '120.977.222-10',
    idade: 34,
    sexo: 'Female',
    perfilFamiliar: 'FPCA - Família Pluriparental com Criança e Adolescente',
    relacionamento: 'Ponto Focal',
    codigoGrupoFamiliar: 'EMG-26-6815963',
    quantidadePessoasFamilia: 6,
    situacaoCivil: 'Solteiro(a)',
    dataEntradaAbrigo: '2026-06-26',
    diasAbrigado: 90,
    pcd: false,
    gravida: false,
    nacionalidade: 'Venezuela',
    carpa: 'P07',
  },
  {
    emgId: 'EMG-117104457',
    nomeCompleto: 'MIGUEL JESUS VELASQUEZ HIDALGO',
    cpf: '121.012.532-32',
    idade: 25,
    sexo: 'Male',
    perfilFamiliar: 'HD - Homem Desacompanhado',
    relacionamento: 'Ponto Focal',
    codigoGrupoFamiliar: 'EMG-26-6819212',
    quantidadePessoasFamilia: 1,
    dataEntradaAbrigo: '2026-06-26',
    diasAbrigado: 90,
    pcd: false,
    gravida: false,
    nacionalidade: 'Venezuela',
    carpa: 'H23',
  },
];

async function main() {
  console.log(`\n================================================================`);
  console.log(`### PROCESSAMENTO AUTOMATIZADO DA POPULAÇÃO DO ABRIGO RONDON 1 ###`);
  console.log(`###      ENQUADRAMENTO HIERÁRQUICO G1 -> G9 & PRIORIZAÇÃO      ###`);
  console.log(`================================================================\n`);

  console.log(`▶ Ingerindo registros do abrigo e executando classificação em lote...`);
  const inicio = Date.now();
  const resultado = ClassificadorAbrigadosRondon.classificarContingente(amostraRondon1);
  const duracaoMs = Date.now() - inicio;

  console.log(`✔ ${resultado.total} registros classificados em ${duracaoMs} ms!\n`);

  console.log(`📊 DISTRIBUIÇÃO ESTATÍSTICA POR GRUPO DE ABORDAGEM:`);
  console.log(`-----------------------------------------------------------------------------------------------------`);
  console.log(`Grupo | Descrição                         | Quantidade | Dias no Abrigo (Média) | Abordagem Principal`);
  console.log(`-----------------------------------------------------------------------------------------------------`);
  Object.values(resultado.estatisticasPorGrupo).forEach((st, i) => {
    const cod = `G${i + 1}`;
    console.log(
      `${cod.padEnd(5)} | ${st.nome.padEnd(33)} | ${String(st.quantidade).padEnd(10)} | ${String(st.mediaDias).padEnd(22)} | ${st.quantidade > 0 ? 'Mapeado' : 'Sem registros na amostra'}`
    );
  });
  console.log(`-----------------------------------------------------------------------------------------------------\n`);

  console.log(`📋 RANKING DE PRIORIDADE PARA INTERIORIZAÇÃO IMEDIATA (DESABRIGAMENTO):`);
  console.log(`(Pesos: Dias abrigado + Vulnerabilidade de saúde/proteção + Tempo no Brasil)\n`);

  resultado.classificados.forEach((c, idx) => {
    console.log(
      `${idx + 1}º Lugar: [Score ${c.scorePrioridadeInteriorizacao} pts] - ${c.nomeCompleto} (${c.idade}a, ${c.sexo})`
    );
    console.log(`    • Grupo: ${c.grupo.codigo} (${c.grupo.nome}) | Carpa: ${c.carpa} | Dias no Abrigo: ${c.diasAbrigado} dias`);
    console.log(`    • Modalidade Indicada: ${c.modalidadeRecomendada}`);
    console.log(`    • Plano de Ação: ${c.planoAcaoSugerido}`);
    console.log(``);
  });

  // Demonstração da Cota PCD com a Lei 8.213/91 para o grupo G3
  const casoG3 = resultado.classificados.find((c) => c.grupo.codigo === 'G3');
  if (casoG3) {
    console.log(`🎯 [MATCH ESPECIALIZADO COTA PCD - LEI 8.213/91]`);
    console.log(`Beneficiário: ${casoG3.nomeCompleto} (${casoG3.idade} anos, PCD no abrigo há ${casoG3.diasAbrigado} dias)`);
    console.log(`Buscando vagas corporativas dedicadas a cota PCD no Sul/Sudeste...`);

    // Registra vaga de cota PCD em Curitiba
    BancoVagasEmprego.cadastrarVaga({
      idVaga: 'VAGA-PCD-CWB-009',
      empresa: {
        razaoSocial: 'MegaLog Distribuição e Varejo S.A.',
        cnpj: '44.555.666/0001-88',
        vagaOferecida: 'Operador de Logística e Cadastro (Cota PCD)',
        salarioMensal: 2500.0,
        ofereceMoradia: true,
        cidadeDestino: 'Curitiba',
        ufDestino: 'PR',
        obiceListaTrabalhoEscravo: false,
        obiceCEIS_CNEP: false,
        declaracaoIntencoesAssinada: true,
      },
      tituloCargo: 'Operador de Logística e Cadastro (Cota PCD)',
      descricaoRequisitos:
        'Vaga exclusiva para pessoa com deficiência (PCD). Atuação em conferência de notas, controle de mercadorias leves e apoio operacional.',
      cidade: 'Curitiba',
      uf: 'PR',
      salario: 2500.0,
    });

    const typesafeService = new TypeSafeAcolhidaService();
    const beneficiarioPCD = {
      id: casoG3.emgId,
      nome: casoG3.nomeCompleto,
      dataNascimento: '1969-01-01',
      nacionalidade: casoG3.nacionalidade,
      documentoIdentidade: 'V-11672397',
      cpf: casoG3.cpf,
      telefoneContato: '+55 95 99111-2222',
      declaracaoVoluntariedadeAssinada: true,
      localAtual: 'BOA_VISTA' as const,
      abrigoOrigem: 'Rondon 1',
      dataEntradaBrasil: '2024-01-01',
      documentacaoMigratoria: {
        tipo: 'SOLICITACAO_REFUGIO' as const,
        numeroProtocolo: 'PROTO-PCD-2025/11',
        dataEmissao: '2025-01-01',
        regular: true,
      },
      dependentesMenores: [],
      saude: {
        vacinaFebreAmarela: { aplicada: true, diasDesdeDose: 30 },
        vacinaTripliceViral: { primeiraDoseAplicada: true },
        sintomasEpidemicos: false,
        gestante: false,
        necessidadesEspeciais: ['PCD - deficiência física leve com aptidão para tarefas administrativas/conferência'],
      },
      relatoSituacaoEContexto: 'Abrigado PCD com potencial laboral em busca de vaga formal no mercado de trabalho.',
      perfilProfissional: {
        ocupacaoPrincipal: 'Auxiliar Administrativo e Conferente',
        experienciasAnteriores: ['Conferência de mercadorias', 'Atendimento'],
        habilidadesTecnicas: ['Digitação', 'Organização de estoque'],
        escolaridade: 'Ensino Médio',
        interesseEmpregoDestino: true,
      },
    };

    const vagaPCD = BancoVagasEmprego.buscarVagasPorCidade('Curitiba', 'PR').find(v => v.idVaga === 'VAGA-PCD-CWB-009')!;
    const matchPCD = await typesafeService.avaliarMatchProfissional(beneficiarioPCD, vagaPCD);

    console.log(`✨ Vaga Encontrada: ${vagaPCD.tituloCargo} na ${vagaPCD.empresa.razaoSocial}`);
    console.log(`✨ Aderência Funcional IA Federal: ${(matchPCD.compatibilidadePercent * 100).toFixed(0)}%`);
    console.log(`✨ Parecer IA Federal: ${matchPCD.parecer}`);
    console.log(`✨ Resultado: Encaminhamento imediato para contratação protegida via Lei de Cotas!`);
  }

  console.log(`\n================================================================`);
  console.log(`✔ PROCESSAMENTO DO CONTINGENTE DE ABRIGO CONCLUÍDO COM SUCESSO!`);
  console.log(`================================================================\n`);
}

main().catch((err) => {
  console.error('Erro na execução:', err);
});
