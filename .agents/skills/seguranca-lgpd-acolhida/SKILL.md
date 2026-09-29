---
name: seguranca-lgpd-acolhida
description: "Garante proteção de dados pessoais sensíveis (LGPD - Lei 13.709/2018), mascaramento de CPF/contatos, integridade criptográfica de bilhetes e prevenção contra tráfico de pessoas na Operação Acolhida (SUFAI)."
---

# Skill: Segurança, Integridade e LGPD (Operação Acolhida / SUFAI)

## Objetivo
Estabelecer as diretrizes e procedimentos automatizados para proteger dados sensíveis de migrantes e refugiados, coibir fraude ou manipulação documental, garantir rastreabilidade segura e cumprir rigorosamente a Lei Geral de Proteção de Dados (Lei 13.709/2018).

## Diretrizes de Implementação

### 1. Mascaramento e Proteção de PII (Personally Identifiable Information)
- **CPFs**: Em telas públicas ou compartilhadas, exibir sempre mascarado no formato `***.***.860-**`, mantendo o valor íntegro apenas na camada de persistência com controle de acesso.
- **Dados Médicos e Obstétricos**: Informações de gravidez e condições de saúde não devem ser expostas em listagens gerais de empregabilidade, sendo restritas ao canal de triagem médica do P Trg.
- **Menores de Idade**: Filhos menores e adolescentes vinculados à família nunca devem ter dados expostos sem correlação com o ponto focal responsável.

### 2. Prevenção Rigorosa contra Tráfico Humano
- **Regra de Coesão Familiar**: Exigência de comprovação de certidão de nascimento venezuelana ou protocolo da Polícia Federal antes da confirmação de embarque de menores.
- **Alerta de Inconsistência**: Disparo automático de alerta se um menor for cadastrado com adultos sem grau de parentesco comprovado ou se houver divergência entre o relato no abrigo e o auto-cadastro no aplicativo.

### 3. Sanitização de Entradas (Segurança Web)
- Todo upload de arquivo (.xlsx, .csv) deve passar por verificação de tipo MIME e tamanho máximo de 30 MB.
- Strings de entrada no formulário mobile e busca de bilhetes devem ser higienizadas contra injeções SQL, NoSQL e cross-site scripting (XSS).

### 4. Hash Criptográfico de Cartão de Embarque
- Todo QR Code gerado para o migrante deve conter assinatura SHA-256 combinando:
  `SHA-256(emgId + cpf + dataVoo + assentoPoltrona + chaveSecretaSUFAI)`
- Isso impede a falsificação ou reutilização indevida de bilhetes aéreos no gate de embarque do P Trg.
