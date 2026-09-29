import * as crypto from 'crypto';

const CHAVE_SECRETA_SUFAI = process.env.SUFAI_SECRET_KEY || 'SUFAI-ACOLHIDA-SEGURANCA-FEDERAL-2026-CHAVE-MESTRE';

export class SentinelaSegurancaELGPD {
  /**
   * Mascara CPF para exibição pública mantendo apenas os dígitos finais para conferência
   * Ex: 603.068.860-06 -> ***.***.860-06
   */
  static mascararCpf(cpf?: string): string {
    if (!cpf || cpf.includes('regularização') || cpf.includes('Pendente')) return 'Em regularização';
    const digitos = cpf.replace(/\D/g, '');
    if (digitos.length !== 11) return '***.***.***-**';
    return `***.***.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`;
  }

  /**
   * Mascara número de telefone para proteção de privacidade
   * Ex: 559599147494 -> +55 95 9****-7494
   */
  static mascararTelefone(telefone?: string): string {
    if (!telefone) return 'Não informado';
    const digitos = telefone.replace(/\D/g, '');
    if (digitos.length < 8) return '****-****';
    const final = digitos.slice(-4);
    const ddd = digitos.length >= 10 ? digitos.slice(0, 2) : '';
    return ddd ? `+55 (${ddd}) 9****-${final}` : `****-${final}`;
  }

  /**
   * Sanitiza entradas de texto para prevenir injeção XSS e caracteres corrompidos
   */
  static sanitizarEntrada(texto?: string): string {
    if (!texto) return '';
    return texto
      .replace(/<[^>]*>?/gm, '') // Remove tags HTML/Script
      .replace(/['"`;\\]/g, '') // Remove aspas e caracteres de escape SQL perigosos
      .trim();
  }

  /**
   * Gera Token Criptográfico HMAC-SHA256 para o Cartão de Embarque
   * Garante que o bilhete não possa ser forjado ou alterado no portão de embarque
   */
  static gerarAssinaturaBilhete(dados: {
    emgId: string;
    cpf: string;
    numeroVoo: string;
    assentoPoltrona: string;
    dataVoo: string;
  }): string {
    const conteudo = `${dados.emgId}|${dados.cpf}|${dados.numeroVoo}|${dados.assentoPoltrona}|${dados.dataVoo}`;
    return crypto
      .createHmac('sha256', CHAVE_SECRETA_SUFAI)
      .update(conteudo)
      .digest('hex')
      .slice(0, 32);
  }

  /**
   * Valida a autenticidade de um cartão de embarque digital
   */
  static validarAssinaturaBilhete(
    dados: {
      emgId: string;
      cpf: string;
      numeroVoo: string;
      assentoPoltrona: string;
      dataVoo: string;
    },
    tokenRecebido: string
  ): boolean {
    const assinaturaEsperada = this.gerarAssinaturaBilhete(dados);
    return crypto.timingSafeEqual(Buffer.from(assinaturaEsperada), Buffer.from(tokenRecebido));
  }

  /**
   * Auditoria de Segurança Anti-Tráfico de Pessoas:
   * Verifica consistência de responsabilidade quando há menores de idade
   */
  static auditarSegurancaFamiliar(
    adultoResponsavel: { nome: string; cpf?: string; emgId: string; parentesco: string },
    menor: { nome: string; idade: number; certidaoOuProtocolo?: string }
  ): {
    aprovado: boolean;
    nivelRisco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'BLOQUEIO';
    parecer: string;
  } {
    if (menor.idade < 18 && !adultoResponsavel.parentesco) {
      return {
        aprovado: false,
        nivelRisco: 'BLOQUEIO',
        parecer: 'BLOQUEIO DE EMBARQUE: Menor sem comprovação de parentesco ou tutela legal averbada pelo Conselho Tutelar / Vara da Infância de Boa Vista.',
      };
    }

    const parentescoValido = [
      'mãe', 'mae', 'pai', 'irmão', 'irmao', 'irmã', 'irma', 'avó', 'avo', 'avô', 'tia', 'tio', 'ponto focal', 'filho', 'filha'
    ];

    const relNormalizado = adultoResponsavel.parentesco.toLowerCase().trim();
    const temParentescoDireto = parentescoValido.some((p) => relNormalizado.includes(p));

    if (!temParentescoDireto) {
      return {
        aprovado: false,
        nivelRisco: 'ALTO',
        parecer: 'ALERTA SENIOR: Relação entre o adulto e o menor declarada como sem parentesco direto. Necessário despacho prévio da Vara da Infância antes da emissão de passagem aérea.',
      };
    }

    return {
      aprovado: true,
      nivelRisco: 'BAIXO',
      parecer: 'Vínculo familiar validado em conformidade com as regras de proteção à criança e ao adolescente da Operação Acolhida.',
    };
  }
}
