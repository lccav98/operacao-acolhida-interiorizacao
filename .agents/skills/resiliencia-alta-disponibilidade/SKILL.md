---
name: resiliencia-alta-disponibilidade
description: "Implementa e audita padrões de resiliência: Circuit Breaker, Offline-first Sync com Service Worker, Graceful Degradation e recuperação autônoma de falhas em integrações externas."
---

# Skill: Resiliência, Estabilidade e Alta Disponibilidade

## Objetivo
Garantir que a plataforma da Operação Acolhida e o Aplicativo Móvel do Migrante permaneçam operacionais mesmo sob instabilidade severa de infraestrutura em Boa Vista e Pacaraima (quedas de sinal 4G, latência de satélite, lentidão em APIs externas da Meta ou do SCDP).

## Padrões de Engenharia Obrigatórios

### 1. Padrão Circuit Breaker (Disjuntor de Integração)
Para todas as chamadas de serviços externos (Meta WhatsApp Cloud API, SCDP e gateways federais):
- **CLOSED (Normal)**: Requisições fluem normalmente. Contador de falhas zerado.
- **OPEN (Circuito Aberto)**: Após 5 falhas consecutivas ou timeout > 5000ms, o circuito abre por 30 segundos. O sistema responde com dados em cache local ou enfileira a ação sem travar a thread.
- **HALF-OPEN (Teste de Recuperação)**: Permite 1 requisição piloto. Se tiver sucesso, fecha o circuito; se falhar, retorna a OPEN.

### 2. Arquitetura Offline-First no Aplicativo Móvel
- **Service Worker Ativo**: Cache dos assets estáticos (HTML, Tailwind CSS, FontAwesome, ícones PWA) para permitir abertura do aplicativo com zero conectividade.
- **Fila de Sincronização Local (`localStorage` / `IndexedDB`)**:
  - Se o migrante preencher o cadastro sem conexão, os dados são persistidos no dispositivo com protocolo provisório `OFFLINE-XXXX`.
  - Evento `window.addEventListener('online', ...)` detecta o retorno da internet e descarrega a fila para o servidor automaticamente.

### 3. Graceful Degradation (Degradação Graciosa)
- Se a integração com a Meta WhatsApp API estiver inoperante, o sistema continua gerando o bilhete digital e o QR Code no app, registrando a mensagem no log de contingência para envio posterior.
- Se o serviço do SCDP demorar, o processo é marcado como `EM_FILA_SCDP` sem bloquear a alocação de assentos na cabine da aeronave.

### 4. Health Check Ativo & Auto-Recuperação
- Endpoint `/api/sistema/saude-resiliencia` monitorando uso de memória, latência de resposta, status do circuit breaker e integridade da base dos 5 abrigos.
