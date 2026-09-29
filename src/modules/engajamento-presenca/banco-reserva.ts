import { Beneficiario } from '../../types';

export class BancoReservaStandby {
  private static filaSuplentes: Beneficiario[] = [];

  /**
   * Adiciona beneficiários pré-triados e com FFT aprovado ao banco de reserva
   */
  static cadastrarSuplente(beneficiario: Beneficiario) {
    this.filaSuplentes.push(beneficiario);
  }

  /**
   * Convoca o próximo suplente compatível caso haja desistência para evitar assento vazio
   */
  static convocarSuplente(cidadeDestino?: string): Beneficiario | null {
    if (this.filaSuplentes.length === 0) return null;

    // Remove e retorna o primeiro da fila prioritária
    const suplente = this.filaSuplentes.shift()!;
    console.log(
      `🚨 BANCO DE RESERVA ACIONADO: Suplente ${suplente.nome} convocado para ocupar vaga em voo para ${cidadeDestino || 'destino imediato'}!`
    );
    return suplente;
  }

  static obterTamanhoFila(): number {
    return this.filaSuplentes.length;
  }
}
