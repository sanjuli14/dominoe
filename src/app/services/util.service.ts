import { Injectable } from '@angular/core';

/**
 * Servicio de utilidades para el juego Dominó
 * - Scoring cubano avanzado
 * - Persistencia local
 * - Validaciones y cálculos
 */
@Injectable({
  providedIn: 'root',
})
export class UtilService {
  /**
   * SCORING CUBANO AVANZADO
   */

  // Sumar puntos de fichas (suma de pips/puntos)
  calcularSumaFichas(
    fichas: Array<{ valor_a: number; valor_b: number }>,
  ): number {
    return fichas.reduce(
      (sum, ficha) => sum + ficha.valor_a + ficha.valor_b,
      0,
    );
  }

  // Detectar "mano limpia" - equipo que termina sin fichas en mano
  esManoLimpia(fichasEnMano: number[]): boolean {
    return fichasEnMano.every((count) => count === 0);
  }

  // Detectar "tranque" - nadie puede jugar
  esTranque(fichasValidas: boolean[]): boolean {
    return fichasValidas.every((puede) => !puede);
  }

  // Calcular puntos por mano limpia
  calcularPuntosManoLimpia(fichasEnMesaDeEquipoGanador: number): number {
    // Si sumas < 50: +50 puntos
    // Si 50-99: +100 puntos
    // Si 100+: +200 puntos
    if (fichasEnMesaDeEquipoGanador < 50) return 50;
    if (fichasEnMesaDeEquipoGanador < 100) return 100;
    return 200;
  }

  // Calcular bonus de salida inicial
  calcularBonusSalida(esSegundaMano: boolean): number {
    // Primera mano: Quien tenga mayor pipa (9-9 es lo máximo)
    // Segundo adelante: Quien tenga mayor número suelto en mano
    return esSegundaMano ? 20 : 0;
  }

  // Calcular bonus "pegada" - jugar triple veces seguidas
  calcularBonusPegada(jugadasSeguidas: number): number {
    // +40 por cada 3 jugadas seguidas
    if (jugadasSeguidas >= 3) return 40 * Math.floor(jugadasSeguidas / 3);
    return 0;
  }

  // Calcular puntos por números (dominó estilo "números")
  calcularPuntosPorNumeros(totalFichasEnMesa: number): number {
    // Si total es múltiplo de 5: +5 puntos
    // Esto lo usan algunos variantes cubanas
    if (totalFichasEnMesa % 5 === 0) {
      return Math.floor(totalFichasEnMesa / 5) * 5;
    }
    return 0;
  }

  /**
   * DETECCIÓN DE EVENTOS DEL JUEGO
   */

  // Detectar si una ficha es "mula" (mismos números ambos lados)
  esMula(valor_a: number, valor_b: number): boolean {
    return valor_a === valor_b;
  }

  // Detectar si es la primera ficha (9-9, 8-8, etc)
  esSegundaSalida(manoNumero: number): boolean {
    return manoNumero > 1;
  }

  // Obtener pipa de una ficha
  obtenerPipa(valor_a: number, valor_b: number): number {
    return Math.max(valor_a, valor_b);
  }

  /**
   * PERSISTENCIA LOCAL
   */

  // Guardar últimos juegos en localStorage
  guardarJuegoLocal(
    partidaId: string,
    data: {
      nombre: string;
      codigoSala: string;
      fecha: Date;
      puntuacionFinal: { eq0: number; eq1: number };
      ganador: number;
      manasJugadas: number;
    },
  ): void {
    const juegos = this.obtenerJuegosLocales();
    juegos.unshift({
      ...data,
      fecha: new Date(data.fecha).toISOString(), // Serializar fecha
    });

    // Mantener últimos 20 juegos
    if (juegos.length > 20) juegos.pop();

    localStorage.setItem('dominos_juegos', JSON.stringify(juegos));
  }

  // Obtener historial de juegos locales
  obtenerJuegosLocales(): any[] {
    const data = localStorage.getItem('dominos_juegos');
    return data ? JSON.parse(data) : [];
  }

  // Guardar configuración del usuario
  guardarConfig(config: {
    nombreJugador: string;
    modoSonido: boolean;
    tiempoLimiteTurno?: number;
  }): void {
    localStorage.setItem('dominos_config', JSON.stringify(config));
  }

  // Obtener configuración
  obtenerConfig(): any {
    const data = localStorage.getItem('dominos_config');
    return data
      ? JSON.parse(data)
      : { nombreJugador: 'Streamer', modoSonido: true };
  }

  // Limpiar todo el localStorage (reset)
  limpiarDatos(): void {
    localStorage.removeItem('dominos_juegos');
    localStorage.removeItem('dominos_config');
  }

  /**
   * VALIDACIONES
   */

  // Validar nombre jugador
  esNombreValido(nombre: string): boolean {
    return (
      nombre.trim().length >= 2 &&
      nombre.trim().length <= 30 &&
      /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s]+$/.test(nombre)
    );
  }

  // Validar código de sala
  esCodigoValido(codigo: string): boolean {
    return codigo.length === 6 && /^[A-Za-z0-9]+$/.test(codigo);
  }

  // Generar código de sala (6 caracteres)
  generarCodigoSala(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  }

  /**
   * UTILIDADES VARIAS
   */

  // Formatear número de puntos con separador de miles
  formatearPuntos(puntos: number): string {
    return puntos.toLocaleString('es-ES');
  }

  // Calcular tiempo restante para timeout
  calcularTiempoRestante(tiempoLimiteMilisegundos: number): string {
    const segundos = Math.ceil(tiempoLimiteMilisegundos / 1000);
    return `${segundos}s`;
  }

  // Obtener posición en español
  obtenerPosicionNombre(posicion: number): string {
    const posiciones = ['NORTE', 'ESTE', 'SUR', 'OESTE'];
    return posiciones[posicion] ?? 'POSICIÓN_DESCONOCIDA';
  }

  // Obtener nombre equipo
  obtenerNombreEquipo(equipo: number): string {
    return equipo === 0 ? 'EQUIPO A' : 'EQUIPO B';
  }

  // Calcular progreso hacia 200 puntos
  calcularProgresoVictoria(puntos: number): number {
    return Math.min((puntos / 200) * 100, 100);
  }

  // Detectar si hay ganador
  hayGanador(eq0: number, eq1: number): boolean {
    return eq0 >= 200 || eq1 >= 200;
  }

  // Obtener ganador
  obtenerGanador(eq0: number, eq1: number): number | null {
    if (eq0 >= 200) return 0;
    if (eq1 >= 200) return 1;
    return null;
  }
}
