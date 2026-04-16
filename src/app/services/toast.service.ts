import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'cubano';
  duration: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  toastAdded$ = new Subject<Toast>();

  // Tallas Cubanas por categoría de evento
  private tallasPorEvento = {
    // Al salir (jugar primera ficha)
    salir: [
      '¡Se rompió el celofán!',
      '¡Voy a mí!',
      '¡Aquí empieza la función!',
      '¡Salió el primer hueso!',
      '¡Rompemos el hielo!',
    ],
    // Al pasar turno
    pasar: [
      '¡Agua!',
      '¡Me quedé a pie!',
      '¡Paso y no paso!',
      '¡Aquí no hay nada!',
      '¡Me comí un cable!',
      '¡Sin novedad!',
    ],
    // Al trancar (cerrar el juego)
    trancar: [
      '¡Se cerró el caney!',
      '¡Aquí no pasa ni el viento!',
      '¡Tranque cerrado!',
      '¡Se acabó la vela!',
      '¡Cerramos el negocio!',
    ],
    // Al ganar una mano
    ganar: [
      '¡Toma tu data!',
      '¡Suena el zapato!',
      '¡Eso es un plato!',
      '¡Paso y gano!',
      '¡Qué mano tan buena!',
      '¡Se acabó la función!',
    ],
    // Al ganar el juego (capote)
    capote: [
      '¡Capote señores!',
      '¡Eso es un zapatazo!',
      '¡Ganamos la partida!',
      '¡Se acabó el dominó!',
    ],
    // Al jugar una mula/doble
    mula: [
      '¡Mira ese doble!',
      '¡Eso es un hueso!',
      '¡Qué mula tan buena!',
      '¡Saca la mulita!',
    ],
    // Al tomar mucho tiempo
    tiempo: [
      '¡Suelta el hueso, que se enfría!',
      '¡Se acaba el siglo!',
      '¡Pensando pa\' dónde!',
      '¡Que no te duela la mano!',
    ],
  };

  constructor() {}

  showToast(
    message: string,
    type: 'success' | 'error' | 'info' | 'cubano' = 'info',
    duration: number = 3000,
  ) {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };

    const current = this.toasts();
    this.toasts.set([...current, toast]);
    this.toastAdded$.next(toast);

    if (duration > 0) {
      setTimeout(() => this.removeToast(id), duration);
    }
  }

  showCubano(tipoEvento: keyof typeof this.tallasPorEvento = 'ganar', delay: number = 500) {
    const tallas = this.tallasPorEvento[tipoEvento];
    const talla = tallas[Math.floor(Math.random() * tallas.length)];
    setTimeout(() => {
      this.showToast(talla, 'cubano', 4000);
    }, delay);
  }

  // Métodos específicos por evento del juego
  showSalir(delay: number = 300) {
    this.showCubano('salir', delay);
  }

  showPasar(delay: number = 300) {
    this.showCubano('pasar', delay);
  }

  showTrancar(delay: number = 300) {
    this.showCubano('trancar', delay);
  }

  showGanar(delay: number = 500) {
    this.showCubano('ganar', delay);
  }

  showCapote(delay: number = 800) {
    this.showCubano('capote', delay);
  }

  showMula(delay: number = 300) {
    this.showCubano('mula', delay);
  }

  showTiempo(delay: number = 200) {
    this.showCubano('tiempo', delay);
  }

  removeToast(id: string) {
    const current = this.toasts();
    this.toasts.set(current.filter((t) => t.id !== id));
  }

  clearAll() {
    this.toasts.set([]);
  }
}
