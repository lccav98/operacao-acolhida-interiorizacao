import { RegistroAbrigadoRondon } from '../../types/shelter';
import { GerenciadorRelatorioDiarioAbrigos } from '../abrigados/relatorio-diario-tatico';

export interface AssentoAeronave {
  codigoAssento: string; // Ex: "01A", "14C", "22F"
  fileira: number;
  letra: string;
  posicao: 'JANELA' | 'MEIO' | 'CORREDOR';
  tipoAssento: 'PADRAO' | 'PRIORITARIO_GESTANTE_PCD' | 'SAIDA_EMERGENCIA';
  ocupado: boolean;
  passageiro?: {
    emgId: string;
    nomeCompleto: string;
    cpf: string;
    idade: number;
    sexo: 'Male' | 'Female';
    abrigoOrigem: string;
    carpa: string;
    codigoGrupoFamiliar: string;
    perfilFamiliar: string;
    relacionamento: string;
    prioridadeGrupo: string;
    modalidade: string;
    statusEmbarque: 'CONFIRMADO' | 'SUPLENTE_STANDBY';
    gestante: boolean;
    pcd: boolean;
    corIdentificacaoFamilia: string;
  };
}

export interface MapaAeronaveResponse {
  aeronave: {
    tipoModal: 'FRETAMENTO_SIDERAL' | 'FAB_CCLM';
    modelo: string; // "Boeing 737-400" ou "Embraer KC-390 Millennium"
    matricula: string;
    capacidadeTotal: number;
    totalAssentosOcupados: number;
    taxaOcupacao: number; // 100%
    destino: string;
    numeroVoo: string;
    dataHoraPartida: string;
    configuracaoFileiras: string; // "3-3" ou "2-2"
  };
  estatisticas: {
    totalPassageiros: number;
    totalFamilias: number;
    totalGestantes: number;
    totalPCDs: number;
    totalCriancas: number;
    suplentesStandby: number;
    distribuicaoAbrigos: Record<string, number>;
  };
  fileiras: {
    numeroFileira: number;
    ehSaidaEmergencia: boolean;
    assentosLadoEsquerdo: AssentoAeronave[];
    assentosLadoDireito: AssentoAeronave[];
  }[];
}

const PALETA_CORES_FAMILIA = [
  '#2563eb', // Azul
  '#059669', // Verde Esmeralda
  '#d97706', // Âmbar
  '#7c3aed', // Roxo
  '#db2777', // Rosa
  '#0891b2', // Ciano
  '#ea580c', // Laranja
  '#4f46e5', // Índigo
  '#0d9488', // Verde Azulado
  '#b91c1c', // Carmim
  '#475569', // Ardósia
];

export class GerenciadorMapaAssentos {
  /**
   * Gera o mapa de assentos interativo do Boeing 737 da Sideral (144 assentos)
   * com alocação contígua de núcleos familiares e assentos prioritários.
   */
  static gerarMapaBoeingSideral(cidadeDestino = 'Curitiba - PR'): MapaAeronaveResponse {
    const baseAbrigados = GerenciadorRelatorioDiarioAbrigos.obterBaseAtual();
    const capacidadeTotal = 144;
    const letrasEsquerda = ['A', 'B', 'C'];
    const letrasDireita = ['D', 'E', 'F'];
    const totalFileiras = 24; // 24 x 6 = 144 assentos

    // Gera lista expandida representativa de 144 passageiros baseada nos 5 abrigos oficiais
    const passageirosCompletos = this.expandirPassageirosParaCapacidade(baseAbrigados, capacidadeTotal);

    // Mapeamento de famílias por cor
    const mapaCoresFamilia = new Map<string, string>();
    let corIdx = 0;
    passageirosCompletos.forEach((p) => {
      if (!mapaCoresFamilia.has(p.codigoGrupoFamiliar)) {
        mapaCoresFamilia.set(p.codigoGrupoFamiliar, PALETA_CORES_FAMILIA[corIdx % PALETA_CORES_FAMILIA.length]);
        corIdx++;
      }
    });

    const fileiras: MapaAeronaveResponse['fileiras'] = [];
    let pIdx = 0;

    const contagemAbrigos: Record<string, number> = {};
    let gestantes = 0;
    let pcds = 0;
    let criancas = 0;

    for (let f = 1; f <= totalFileiras; f++) {
      const ehEmergencia = f === 12 || f === 13;
      const assentosEsq: AssentoAeronave[] = [];
      const assentosDir: AssentoAeronave[] = [];

      // Lado Esquerdo: A, B, C
      for (const letra of letrasEsquerda) {
        const codigo = `${f.toString().padStart(2, '0')}${letra}`;
        const p = passageirosCompletos[pIdx++];
        const ehPrioritario = f <= 4 && (p?.gravida || p?.pcd);

        if (p) {
          const nomeAbrigo = p.abrigo || 'Rondon 1';
          contagemAbrigos[nomeAbrigo] = (contagemAbrigos[nomeAbrigo] || 0) + 1;
          if (p.gravida) gestantes++;
          if (p.pcd) pcds++;
          if (p.idade < 12) criancas++;
        }

        assentosEsq.push({
          codigoAssento: codigo,
          fileira: f,
          letra,
          posicao: letra === 'A' ? 'JANELA' : letra === 'B' ? 'MEIO' : 'CORREDOR',
          tipoAssento: ehPrioritario ? 'PRIORITARIO_GESTANTE_PCD' : ehEmergencia ? 'SAIDA_EMERGENCIA' : 'PADRAO',
          ocupado: true,
          passageiro: p
            ? {
                emgId: p.emgId,
                nomeCompleto: p.nomeCompleto,
                cpf: p.cpf,
                idade: p.idade,
                sexo: p.sexo,
                abrigoOrigem: p.abrigo || 'Rondon 1',
                carpa: p.carpa,
                codigoGrupoFamiliar: p.codigoGrupoFamiliar,
                perfilFamiliar: p.perfilFamiliar,
                relacionamento: p.relacionamento,
                prioridadeGrupo: p.idade > 50 ? 'G4 - Longa Permanência' : p.gravida ? 'G2 - Gestante' : 'G8 - Família',
                modalidade: 'REUNIFICACAO_FAMILIAR',
                statusEmbarque: pIdx > 130 ? 'SUPLENTE_STANDBY' : 'CONFIRMADO',
                gestante: p.gravida,
                pcd: p.pcd,
                corIdentificacaoFamilia: mapaCoresFamilia.get(p.codigoGrupoFamiliar) || '#2563eb',
              }
            : undefined,
        });
      }

      // Lado Direito: D, E, F
      for (const letra of letrasDireita) {
        const codigo = `${f.toString().padStart(2, '0')}${letra}`;
        const p = passageirosCompletos[pIdx++];
        const ehPrioritario = f <= 4 && (p?.gravida || p?.pcd);

        if (p) {
          const nomeAbrigo = p.abrigo || 'Rondon 1';
          contagemAbrigos[nomeAbrigo] = (contagemAbrigos[nomeAbrigo] || 0) + 1;
          if (p.gravida) gestantes++;
          if (p.pcd) pcds++;
          if (p.idade < 12) criancas++;
        }

        assentosDir.push({
          codigoAssento: codigo,
          fileira: f,
          letra,
          posicao: letra === 'D' ? 'CORREDOR' : letra === 'E' ? 'MEIO' : 'JANELA',
          tipoAssento: ehPrioritario ? 'PRIORITARIO_GESTANTE_PCD' : ehEmergencia ? 'SAIDA_EMERGENCIA' : 'PADRAO',
          ocupado: true,
          passageiro: p
            ? {
                emgId: p.emgId,
                nomeCompleto: p.nomeCompleto,
                cpf: p.cpf,
                idade: p.idade,
                sexo: p.sexo,
                abrigoOrigem: p.abrigo || 'Rondon 1',
                carpa: p.carpa,
                codigoGrupoFamiliar: p.codigoGrupoFamiliar,
                perfilFamiliar: p.perfilFamiliar,
                relacionamento: p.relacionamento,
                prioridadeGrupo: p.idade > 50 ? 'G4 - Longa Permanência' : p.gravida ? 'G2 - Gestante' : 'G8 - Família',
                modalidade: 'REUNIFICACAO_FAMILIAR',
                statusEmbarque: pIdx > 130 ? 'SUPLENTE_STANDBY' : 'CONFIRMADO',
                gestante: p.gravida,
                pcd: p.pcd,
                corIdentificacaoFamilia: mapaCoresFamilia.get(p.codigoGrupoFamiliar) || '#2563eb',
              }
            : undefined,
        });
      }

      fileiras.push({
        numeroFileira: f,
        ehSaidaEmergencia: ehEmergencia,
        assentosLadoEsquerdo: assentosEsq,
        assentosLadoDireito: assentosDir,
      });
    }

    return {
      aeronave: {
        tipoModal: 'FRETAMENTO_SIDERAL',
        modelo: 'Boeing 737-400 (Sideral Linhas Aéreas)',
        matricula: 'PR-SDJ',
        capacidadeTotal,
        totalAssentosOcupados: capacidadeTotal,
        taxaOcupacao: 100, // Lotação Máxima
        destino: cidadeDestino,
        numeroVoo: 'SID-4820 (BVB ✈ CWB)',
        dataHoraPartida: '06:30 (Apresentação 04:00 no P Trg)',
        configuracaoFileiras: '3-3',
      },
      estatisticas: {
        totalPassageiros: capacidadeTotal,
        totalFamilias: mapaCoresFamilia.size,
        totalGestantes: gestantes,
        totalPCDs: pcds,
        totalCriancas: criancas,
        suplentesStandby: 14,
        distribuicaoAbrigos: contagemAbrigos,
      },
      fileiras,
    };
  }

  /**
   * Gera o mapa de assentos do cargueiro/transporte militar KC-390 da FAB (80 assentos)
   */
  static gerarMapaFAB(cidadeDestino = 'São Paulo (Cumbica) - SP'): MapaAeronaveResponse {
    const baseAbrigados = GerenciadorRelatorioDiarioAbrigos.obterBaseAtual();
    const capacidadeTotal = 80;
    const letrasEsquerda = ['A', 'B'];
    const letrasDireita = ['C', 'D'];
    const totalFileiras = 20; // 20 x 4 = 80 assentos modulares laterais

    const passageirosCompletos = this.expandirPassageirosParaCapacidade(baseAbrigados, capacidadeTotal);

    const mapaCoresFamilia = new Map<string, string>();
    let corIdx = 0;
    passageirosCompletos.forEach((p) => {
      if (!mapaCoresFamilia.has(p.codigoGrupoFamiliar)) {
        mapaCoresFamilia.set(p.codigoGrupoFamiliar, PALETA_CORES_FAMILIA[corIdx % PALETA_CORES_FAMILIA.length]);
        corIdx++;
      }
    });

    const fileiras: MapaAeronaveResponse['fileiras'] = [];
    let pIdx = 0;

    const contagemAbrigos: Record<string, number> = {};
    let gestantes = 0;
    let pcds = 0;
    let criancas = 0;

    for (let f = 1; f <= totalFileiras; f++) {
      const ehEmergencia = f === 10;
      const assentosEsq: AssentoAeronave[] = [];
      const assentosDir: AssentoAeronave[] = [];

      for (const letra of letrasEsquerda) {
        const codigo = `${f.toString().padStart(2, '0')}${letra}`;
        const p = passageirosCompletos[pIdx++];
        const ehPrioritario = f <= 3 && (p?.gravida || p?.pcd);

        if (p) {
          const nomeAbrigo = p.abrigo || 'Rondon 1';
          contagemAbrigos[nomeAbrigo] = (contagemAbrigos[nomeAbrigo] || 0) + 1;
          if (p.gravida) gestantes++;
          if (p.pcd) pcds++;
          if (p.idade < 12) criancas++;
        }

        assentosEsq.push({
          codigoAssento: codigo,
          fileira: f,
          letra,
          posicao: letra === 'A' ? 'JANELA' : 'CORREDOR',
          tipoAssento: ehPrioritario ? 'PRIORITARIO_GESTANTE_PCD' : ehEmergencia ? 'SAIDA_EMERGENCIA' : 'PADRAO',
          ocupado: true,
          passageiro: p
            ? {
                emgId: p.emgId,
                nomeCompleto: p.nomeCompleto,
                cpf: p.cpf,
                idade: p.idade,
                sexo: p.sexo,
                abrigoOrigem: p.abrigo || 'Rondon 1',
                carpa: p.carpa,
                codigoGrupoFamiliar: p.codigoGrupoFamiliar,
                perfilFamiliar: p.perfilFamiliar,
                relacionamento: p.relacionamento,
                prioridadeGrupo: p.idade > 50 ? 'G4 - Longa Perm.' : p.gravida ? 'G2 - Gestante' : 'G9 - Emprego',
                modalidade: 'VAGA_EMPREGO_SINALIZADA',
                statusEmbarque: pIdx > 72 ? 'SUPLENTE_STANDBY' : 'CONFIRMADO',
                gestante: p.gravida,
                pcd: p.pcd,
                corIdentificacaoFamilia: mapaCoresFamilia.get(p.codigoGrupoFamiliar) || '#059669',
              }
            : undefined,
        });
      }

      for (const letra of letrasDireita) {
        const codigo = `${f.toString().padStart(2, '0')}${letra}`;
        const p = passageirosCompletos[pIdx++];
        const ehPrioritario = f <= 3 && (p?.gravida || p?.pcd);

        if (p) {
          const nomeAbrigo = p.abrigo || 'Rondon 1';
          contagemAbrigos[nomeAbrigo] = (contagemAbrigos[nomeAbrigo] || 0) + 1;
          if (p.gravida) gestantes++;
          if (p.pcd) pcds++;
          if (p.idade < 12) criancas++;
        }

        assentosDir.push({
          codigoAssento: codigo,
          fileira: f,
          letra,
          posicao: letra === 'C' ? 'CORREDOR' : 'JANELA',
          tipoAssento: ehPrioritario ? 'PRIORITARIO_GESTANTE_PCD' : ehEmergencia ? 'SAIDA_EMERGENCIA' : 'PADRAO',
          ocupado: true,
          passageiro: p
            ? {
                emgId: p.emgId,
                nomeCompleto: p.nomeCompleto,
                cpf: p.cpf,
                idade: p.idade,
                sexo: p.sexo,
                abrigoOrigem: p.abrigo || 'Rondon 1',
                carpa: p.carpa,
                codigoGrupoFamiliar: p.codigoGrupoFamiliar,
                perfilFamiliar: p.perfilFamiliar,
                relacionamento: p.relacionamento,
                prioridadeGrupo: p.idade > 50 ? 'G4 - Longa Perm.' : p.gravida ? 'G2 - Gestante' : 'G9 - Emprego',
                modalidade: 'VAGA_EMPREGO_SINALIZADA',
                statusEmbarque: pIdx > 72 ? 'SUPLENTE_STANDBY' : 'CONFIRMADO',
                gestante: p.gravida,
                pcd: p.pcd,
                corIdentificacaoFamilia: mapaCoresFamilia.get(p.codigoGrupoFamiliar) || '#059669',
              }
            : undefined,
        });
      }

      fileiras.push({
        numeroFileira: f,
        ehSaidaEmergencia: ehEmergencia,
        assentosLadoEsquerdo: assentosEsq,
        assentosLadoDireito: assentosDir,
      });
    }

    return {
      aeronave: {
        tipoModal: 'FAB_CCLM',
        modelo: 'Embraer KC-390 Millennium (Força Aérea Brasileira)',
        matricula: 'FAB-2854',
        capacidadeTotal,
        totalAssentosOcupados: capacidadeTotal,
        taxaOcupacao: 100, // Lotação Máxima
        destino: cidadeDestino,
        numeroVoo: 'FAB-9012 (BVB ✈ GRU)',
        dataHoraPartida: '07:00 (Apresentação 04:30 na Base Aérea)',
        configuracaoFileiras: '2-2',
      },
      estatisticas: {
        totalPassageiros: capacidadeTotal,
        totalFamilias: mapaCoresFamilia.size,
        totalGestantes: gestantes,
        totalPCDs: pcds,
        totalCriancas: criancas,
        suplentesStandby: 8,
        distribuicaoAbrigos: contagemAbrigos,
      },
      fileiras,
    };
  }

  /**
   * Expande e agrupa passageiros por família mantendo continuidade e preenchendo até a lotação máxima
   */
  private static expandirPassageirosParaCapacidade(
    base: RegistroAbrigadoRondon[],
    capacidade: number
  ): RegistroAbrigadoRondon[] {
    const lista: RegistroAbrigadoRondon[] = [];

    // Primeiro inclui os dados reais da base
    base.forEach((r) => {
      lista.push({ ...r });
      const qtdFamiliares = Math.min(r.quantidadePessoasFamilia || 1, 5);
      for (let i = 2; i <= qtdFamiliares; i++) {
        lista.push({
          ...r,
          emgId: `${r.emgId}-F${i}`,
          nomeCompleto: `${r.nomeCompleto.split(' ')[0]} ${r.nomeCompleto.split(' ').slice(-1)} (Dep. ${i})`,
          cpf: `00${(i * 111111111).toString().slice(0, 9)}-00`,
          idade: i === 2 ? Math.max(8, r.idade - 20) : i === 3 ? 6 : 14,
          sexo: i % 2 === 0 ? 'Female' : 'Male',
          relacionamento: i === 2 ? 'Cônjuge/Filho' : 'Filho(a) Menor',
          gravida: false,
          pcd: false,
        });
      }
    });

    const abrigos = ['Rondon 1', 'Rondon 5', 'Tuaranoko', 'Anexo Rondon 1', 'BV-8'];
    const carpasLetras = ['A', 'B', 'C', 'H', 'J', 'K', 'L', 'P', 'S', 'T'];

    let count = lista.length;
    let famNum = 100;
    while (lista.length < capacidade) {
      count++;
      if (count % 3 === 0) famNum++;

      const abrigoSorteado = abrigos[count % abrigos.length];
      const carpaSorteada = `${carpasLetras[count % carpasLetras.length]}${(count % 25 + 1).toString().padStart(2, '0')}`;

      lista.push({
        emgId: `EMG-26-${(1000000 + count).toString()}`,
        nomeCompleto: `ACOLHIDO BENEFICIÁRIO ${count.toString().padStart(3, '0')}`,
        cpf: `${(count * 777).toString().slice(0, 3)}.${(count * 888).toString().slice(0, 3)}.${(count * 999).toString().slice(0, 3)}-00`,
        idade: (count % 40) + 18,
        sexo: count % 2 === 0 ? 'Female' : 'Male',
        perfilFamiliar: count % 3 === 0 ? 'FMC - Família com Criança' : 'HD - Homem Desacompanhado',
        relacionamento: count % 3 === 0 ? 'Filho(a)' : 'Ponto Focal',
        codigoGrupoFamiliar: `EMG-26-FAM${famNum}`,
        quantidadePessoasFamilia: count % 3 === 0 ? 3 : 1,
        situacaoCivil: 'Solteiro(a)',
        dataEntradaAbrigo: '2026-01-10',
        diasAbrigado: 260 + (count % 100),
        pcd: count === 15 || count === 45,
        gravida: count === 8 || count === 34,
        nacionalidade: 'Venezuela',
        abrigo: abrigoSorteado,
        carpa: carpaSorteada,
      });
    }

    return lista.slice(0, capacidade);
  }
}
