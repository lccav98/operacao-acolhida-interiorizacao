---
name: auditoria-vulnerabilidades-owasp
description: Realiza varreduras estáticas (SAST), análise de composição de software (SCA) e testes de segurança preventiva baseados no OWASP Top 10 e diretrizes federais para o sistema da Operação Acolhida (SUFAI).
---

# Skill: Auditoria de Vulnerabilidades & OWASP Top 10
## Sistema Integrado de Gestão e Interiorização — Operação Acolhida (SUFAI)

Esta skill orienta os agentes a realizarem verificações preventivas de vulnerabilidades, auditoria de dependências e testes de conformidade com os padrões **OWASP Top 10 (2021)** e **LGPD (Lei nº 13.709/2018)**.

---

### 1. Diretrizes de Execução da Auditoria

Ao auditar o código e a infraestrutura do sistema, o agente deve verificar obrigatoriamente:

1. **A01:2021 — Broken Access Control (Controle de Acesso Quebrado)**:
   - Certificar que endpoints sensíveis (ex: `/api/sistema/simular-instabilidade`, `/api/scdp/emitir-lote`) requerem autorização de operador e não expõem parâmetros modificáveis pelo cliente.
   - Garantir que a validação de cartões de embarque no **P Trg** exige verificação da assinatura `assinaturaDigitalHMAC`.

2. **A02:2021 — Cryptographic Failures (Falhas Criptográficas & LGPD)**:
   - Toda consulta pública por CPF no aplicativo móvel deve retornar o CPF estritamente mascarado (`***.***.860-06`).
   - Dados sensíveis de saúde (atestados de gestantes e laudos PcD) não devem trafegar em rotas sem criptografia.
   - Tokens de validação devem utilizar **HMAC-SHA256**.

3. **A03:2021 — Injection & XSS (Injeções)**:
   - Nenhuma entrada do formulário móvel deve ser concatenada diretamente em consultas ou scripts.
   - Usar sanitização com remoção de tags `<script>` e caracteres perigosos.

4. **A05:2021 — Security Misconfiguration (Configuração Insegura)**:
   - Verificar se os cabeçalhos de segurança HTTP (via `helmet`) estão ativos:
     * `Strict-Transport-Security` (HSTS)
     * `X-Content-Type-Options: nosniff`
     * `X-Frame-Options: SAMEORIGIN`
     * `Referrer-Policy: no-referrer`
   - O CORS deve ser estritamente controlado.

5. **A06:2021 — Vulnerable and Outdated Components (Componentes Vulneráveis)**:
   - Executar periodicamente `npm audit --audit-level=moderate`.
   - Manter a regra de substituição de pacotes com advisories conhecidos (ex: migração de `xlsx` para `exceljs` com overrides de `uuid`).
   - Tolerar **0 vulnerabilidades** de severidade Moderate, High ou Critical.

---

### 2. Comandos Operacionais de Auditoria

* **Verificar Vulnerabilidades de Dependências (SCA)**:
  ```bash
  npm run security:audit
  ```

* **Inspecionar Cabeçalhos de Segurança no Servidor Ativo**:
  ```bash
  curl.exe -I http://localhost:3000
  ```

* **Auditar Integridade LGPD e Proteção a Menores**:
  Disparar requisição POST contra o endpoint `/api/seguranca/auditar-integridade`.

---

### 3. Checklist de Aprovação para Deploy Governamental
- [x] 0 vulnerabilidades no `npm audit`.
- [x] Biblioteca `exceljs` segura em substituição ao `xlsx`.
- [x] Middleware `helmet` injetando cabeçalhos de segurança HSTS e anti-clickjacking.
- [x] Mascaramento LGPD ativo em todas as saídas de passageiros.
- [x] Workflow do GitHub Actions configurado em `.github/workflows/security-audit.yml`.
