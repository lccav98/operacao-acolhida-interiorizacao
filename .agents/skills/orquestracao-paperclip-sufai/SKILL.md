---
name: orquestracao-paperclip-sufai
description: "Orquestra a força de trabalho autônoma de agentes de IA da Operação Acolhida (SUFAI) via Paperclip AI (GitHub: paperclipai/paperclip), gerenciando organograma, ciclos de heartbeat, orçamentos, governança e rotinas."
---

# Skill: Orquestração Paperclip AI (Operação Acolhida / SUFAI)

## Objetivo
Coordenar, auditar e sincronizar equipes de agentes de inteligência artificial autônomos na execução contínua da **Estratégia de Interiorização de Refugiados e Migrantes** (Lei Federal nº 13.684/2018 e Decreto nº 9.288/2018), utilizando o ecossistema open-source **Paperclip AI** (`github.com/paperclipai/paperclip`).

## Papéis e Organograma dos Agentes (Company-as-Code)

1. **Cel. Coordenador SUFAI (CEO Agent)** (`agente-diretor-interiorizacao`):
   - Alinhamento de metas da interiorização federal.
   - Supervisão orçamentária e aprovação de exceções táticas.
   - Orquestração dos ciclos de Heartbeat entre os setores.

2. **Major Gestor Aéreo (Operations Agent)** (`agente-logistica-aerea`):
   - Otimização da malha aérea: Boeing 737 Sideral (144 PAX) e FAB KC-390 (80 PAX).
   - Preservação da coesão familiar (assentos contíguos sem separação de crianças).
   - Ativação da **Trava de Dano ao Erário** (100% de ocupação ou acionamento de suplentes).

3. **Auditor Federal de Conformidade (Compliance Agent)** (`agente-auditor-scdp`):
   - Formalização de PCDPs e bilhetes eletrônicos com hash SHA-256 no SCDP.
   - Homologação de comprovação de viagem em até 5 dias conforme acórdãos TCU/CGU.

4. **Sentinela de Proteção & LGPD (Legal/Protection Agent)** (`agente-sentinela-protecao`):
   - Prevenção rigorosa anti-tráfico de menores nos 5 abrigos oficiais.
   - Cruzamento de dados com a Defensoria Pública da União (DPU) e Polícia Federal.
   - Anonimização estrita de PII (máscaras de CPF, saúde e contatos).

5. **Coordenador de Solo e P Trg (Field Agent)** (`agente-engajamento-ptrg`):
   - Comunicação humanizada via Meta WhatsApp Cloud API nos marcos D-7, D-3 e D-1.
   - Predição de No-Show e substituição imediata por suplentes do Banco Reserva.
   - Auditoria na leitura óptica das catracas de embarque no P Trg.

## Protocolo de Heartbeat (Batimento Cardíaco)
- **Frequência**: Ciclos automatizados de 5 a 30 minutos de acordo com a criticidade de cada agente.
- **Ações por ciclo**:
  1. *Context Retrieval*: Leitura do estado dos abrigos, voos, vagas e barramento federal.
  2. *Auditoria Cruzada*: Verificação de conformidade com OWASP, LGPD e TCU.
  3. *Execução de Rotinas*: Despacho de alertas, convocação de suplentes e registro no log de trilha.
  4. *Relatório de Disposição*: Emissão de métricas consolidadas e cálculo de tokens/orçamento.

## Integração Técnica
- **Arquivo de Configuração**: `paperclip.config.json`
- **Docker Compose**: `docker-compose.paperclip.yml`
- **Endpoints de Orquestração**: `/api/paperclip/status`, `/api/paperclip/org-chart`, `/api/paperclip/heartbeat`, `/api/paperclip/tasks`
- **CLI Runner**: `npm run paperclip:heartbeat` e `npm run paperclip:status`
