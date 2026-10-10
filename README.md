# SIGA-Acolhida — Sistema Integrado de Gestão e Interiorização
### Operação Acolhida | Subcomitê Federal para Abrigamento e Interiorização (SUFAI)

[![Security Audit](https://github.com/SUFAI/operacao-acolhida-interiorizacao/actions/workflows/security-audit.yml/badge.svg)](.github/workflows/security-audit.yml)
[![Vulnerabilities](https://img.shields.io/badge/vulnerabilities-0%20found-brightgreen.svg)](#segurança-e-auditoria-owasp)
[![LGPD](https://img.shields.io/badge/LGPD-Lei%2013.709%2F2018-blue.svg)](#proteção-de-dados-e-lgpd)
[![SCDP / TCU](https://img.shields.io/badge/SCDP-Conformidade%20TCU%20e%20CGU-purple.svg)](#-integração-automática-com-o-scdp-tcu-e-cgu)

Plataforma inteligente desenvolvida para automatizar e blindar a **Estratégia de Interiorização de Refugiados e Migrantes**, com coordenação do **Subcomitê Federal para Abrigamento e Interiorização (SUFAI)**, Ministério do Desenvolvimento e Assistência Social (MDS), Ministério da Justiça e Segurança Pública (MJSP), Ministério da Defesa (Força-Tarefa Logística Humanitária), Casa Civil e organismos internacionais parceiros (OIM e ACNUR).

---

## 🎯 Principais Funcionalidades

1. **Dashboard Web Estratégico (`/`)**:
   - Gestão em tempo real da população abrigada nos **5 centros oficiais**: *Abrigo Rondon 1, Abrigo Rondon 5, Abrigo Tuaranoko, Abrigo Anexo Rondon 1 e Abrigo BV-8 (Pacaraima)*.
   - Motor de importação e desconflito cadastral automático em 4 níveis (evita duplicidades entre planilhas e o aplicativo).
   - **Mapa de Assentos Interativo (Seat Map)** para Boeing 737 da Sideral (144 assentos) e KC-390 da FAB (80 assentos), garantindo famílias contíguas e prioridades (Gestantes/PcD).
   - **Trava de Dano ao Erário (100% de Ocupação)** com convocação automática do Banco Reserva no **Posto de Triagem (P Trg)**.
   - **Painel de Auditoria Documental (5 Eixos)** e Simulador de Leitura Óptica da Catraca do P Trg.
   - Monitor de **Circuit Breakers** em tempo real para APIs externas (WhatsApp Cloud, SCDP e Receita Federal).

2. **Aplicativo do Migrante e Refugiado (`/app` ou `/aplicativo`)**:
   - PWA (Progressive Web App) instalável com funcionamento **Offline-First** (ideal para áreas de conectividade instável na fronteira).
   - Multilíngue (Português e Espanhol).
   - Termo de **Aquiescência Voluntária** digital (conforme Decreto nº 9.288/2018).
   - **Cartão de Embarque Digital** com QR Code óptico, CPF mascarado sob a LGPD (`***.***.860-06`) e **Assinatura Criptográfica HMAC-SHA256**.

3. **Orquestração Paperclip AI (`/` aba "Orquestração Paperclip AI")**:
   - Baseado na plataforma open-source [Paperclip AI](https://github.com/paperclipai/paperclip).
   - Organograma *Company-as-Code* com **5 Agentes Autônomos de IA**:
     - **Cel. Coordenador SUFAI (CEO Agent)**: Orquestração e governança da missão.
     - **Major Gestor Aéreo (Operations Agent)**: Gestão de assentos FAB/Sideral e Trava de Erário.
     - **Auditor Federal SCDP (Compliance Agent)**: Formalização de PCDPs e trilha TCU/CGU.
     - **Sentinela de Proteção & LGPD (Protection Agent)**: Salvaguarda anti-tráfico de menores e anonimização.
     - **Coordenador P Trg & WhatsApp (Field Agent)**: Anti-absenteísmo D-7/D-3/D-1 e acionamento de suplentes.
   - **Protocolo de Heartbeat**: Ciclos autônomos periódicos avaliando integridade, regras e orçamentos de tokens.
   - Endpoints REST dedicados em `/api/paperclip/*` e suporte nativo ao Docker Compose com Paperclip Server.

---

## 🏛️ Integração Automática com o SCDP (TCU e CGU)

Toda passagem aérea adquirida com recursos públicos no âmbito da Lei nº 13.684/2018 é formalizada eletronicamente:
1. **Abertura da PCDP**: Registro de proposta no barramento federal.
2. **Vinculação do E-Ticket**: Associação direta do bilhete eletrônico, localizador PNR e tarifa para empenho.
3. **Comprovação Digital de Viagem**: Geração do hash SHA-256 e homologação em até 5 dias pós-deslocamento.

---

## 🛡️ Segurança e Auditoria OWASP

O projeto foi auditado e configurado para cumprir as diretrizes federais e do **OWASP Top 10**:
- **0 Vulnerabilidades Conhecidas**: Dependências higienizadas com migração para `exceljs` e substituição do `xlsx`.
- **Cabeçalhos de Segurança HTTP (Helmet)**: HSTS (`Strict-Transport-Security`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`.
- **Proteção Anti-Tráfico de Pessoas**: Bloqueio sistêmico de menores sem parentesco biológico ou judicial comprovado com acionamento da DPU.
- **Workflow de CI/CD**: Verificações automáticas via GitHub Actions com Semgrep, CodeQL, npm audit e Gitleaks.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js v18 ou superior
* npm v9 ou superior

### Instalação

```bash
# 1. Clonar repositório
git clone <URL_DO_REPOSITORIO>
cd operacao-acolhida-interiorizacao

# 2. Instalar dependências
npm install

# 3. Compilar TypeScript
npm run build

# 4. Iniciar servidor de produção
npm run serve
```

Acesse no navegador:
* **Dashboard Principal**: `http://localhost:3000`
* **App do Migrante**: `http://localhost:3000/app`

### Testes, Auditoria e Paperclip AI

```bash
# Executar auditoria de dependências (0 vulnerabilidades)
npm run security:audit

# Testar simulações do fluxo completo
npm run start

# Executar ciclo de Heartbeat do Paperclip AI (Orquestração de Agentes)
npm run paperclip:heartbeat

# Consultar status dos agentes e orçamentos via CLI
npm run paperclip:status

# Iniciar ambiente integrado via Docker Compose (SIGA-Acolhida + Paperclip Server + PostgreSQL)
docker compose -f docker-compose.paperclip.yml up
```

---

## 📋 Licença e Governança

Projeto desenvolvido para a **Operação Acolhida / Subcomitê Federal para Abrigamento e Interiorização (SUFAI)**.  
Uso em estrito cumprimento da Lei Federal nº 13.684/2018, Decreto nº 9.288/2018 e Lei nº 13.709/2018 (LGPD).
