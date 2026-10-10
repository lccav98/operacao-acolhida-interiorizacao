---
name: graphify-knowledge-graph
description: "Mapeia, consulta e analisa a topologia relacional e o Grafo de Conhecimento (Knowledge Graph) da Operação Acolhida (SUFAI) via Graphify AI (GitHub: safishamsi/graphify), conectando abrigos, migrantes, famílias, voos, empresas e agentes de IA."
---

# Skill: Graphify AI Knowledge Graph (Operação Acolhida / SUFAI)

## Objetivo
Estruturar, consultar e explicar a rede relacional e multidimensional da **Estratégia de Interiorização** (Lei Federal nº 13.684/2018), superando a fragmentação de tabelas e planilhas por meio de grafos de conhecimento determinísticos construídos pelo **Graphify AI** (`github.com/safishamsi/graphify`).

## Tipos de Entidades (Nós do Grafo)
- `ABRIGO`: Os 5 centros oficiais (Rondon 1, Rondon 5, Tuaranoko, Anexo Rondon 1 e BV-8).
- `BENEFICIARIO`: Migrantes e refugiados acolhidos, com atributos protegidos (LGPD).
- `GRUPO_FAMILIAR`: Coesão familiar e parentesco com alertas de salvaguarda anti-tráfico da DPU.
- `VOO`: Malha aérea militar e civil (FAB KC-390 e Boeing 737 Sideral).
- `CIDADE_DESTINO`: Polos de acolhida e integração (Curitiba/PR, Chapecó/SC, Canoas/RS, Manaus/AM).
- `EMPRESA_VAGA`: Empregadores parceiros na modalidade Vaga de Emprego Sinalizada (VES).
- `AGENTE_IA`: Força de trabalho autônoma orquestrada pelo Paperclip AI.
- `CONFORMIDADE_LEGAL`: SCDP (TCU/CGU), LGPD e Lei nº 13.684/2018.

## Tipos de Relações (Arestas)
- `ABRIGADO_EM`: Localização física e carpa do migrante.
- `PERTENCE_A_FAMILIA`: Vinculação parental biológica ou judicial.
- `ALOCADO_VOO`: Assento garantido pela Trava de Dano ao Erário (100% de ocupação).
- `MATCH_VAGA`: Compatibilidade profissional apurada com motor de IA.
- `DESTINO_DE`: Trajetória logística entre abrigos e municípios receptores.
- `MONITORADO_POR` e `AUDITADO_POR`: Trilha de governança operada pelos agentes de IA.
- `VINCULADO_SCDP`: Formalização de PCDPs e bilhetes eletrônicos.
- `PROTEGIDO_CONTRA_TRAFICO`: Bloqueio preventivo e encaminhamento à DPU de menores sem parentesco comprovado.

## Comandos Operacionais (CLI e API)
- **Construção do Grafo**: `npm run graphify:build`
- **Consulta Relacional**: `npm run graphify:query -- "<termo>"`
- **Explicação Semântica**: `npm run graphify:explain -- "<id_no>"`
- **Endpoints REST**: `/api/graphify/graph`, `/api/graphify/query`, `/api/graphify/explain`, `/api/graphify/metrics`
