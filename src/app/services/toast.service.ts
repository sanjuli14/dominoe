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
    // Al salir (el rompimiento)
    salir: [
      '¡Asere, qué bolá!',
      '¡Pinga, salí yo!',
      '¡Qué clase talla el rompimiento!',
    ],
    // Al pasar turno
    pasar: [
      '¡Pinga, se botó el ron!',
      '¡Pásate veo!',
      '¡Dame un buche ahí!',
      '¡Tremendo mojón, me pasé!',
      '¡Tú no sirves!',
      '¡Dale agua, dale agua!',
      '¡El que perdió da agua!',
    ],
    // Al trancar (cerrar el juego)
    trancar: [
      '¡Tranqué, qué clase pinga!',
      '¡Asere, se cerró esto!',
      '¡Tú no sirves, aquí nadie pasa!',
    ],
    // Al ganar una mano
    ganar: [
      '¡Qué clase pinga, gané!',
      '¡Tú no sirves, toma tu data!',
      '¡Asere, eso es un plato!',
    ],
    // Al ganar el juego (capote)
    capote: [
      '¡Qué clase talla, tremendo zapatazo!',
      '¡Pinga, ganamos la partida!',
      '¡Asere, el que perdió da agua!',
    ],
    // Al jugar una mula/doble
    mula: [
      '¡Asere, mira esa mula!',
      '¡Qué clase talla de doble!',
      '¡Pinga, saca el hueso!',
    ],
    // Al tomar mucho tiempo
    tiempo: [
      '¡Dale agua, dale agua, que te demoras mucho!',
      '¡Tremendo mojón estás pensando!',
      '¡Tú no sirves, suelta el hueso!',
      '¡Asere, suelta el hueso ya!',
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

  showEspontaneo(mensaje: string) {
    this.showToast(mensaje, "cubano", 4000);
  }

  getAleatorias() {
    const todas = Object.values(this.tallasPorEvento).flat();
    return todas.sort(() => 0.5 - Math.random()).slice(0, 4);
  }

  removeToast(id: string) {
    const current = this.toasts();
    this.toasts.set(current.filter((t) => t.id !== id));
  }

  clearAll() {
    this.toasts.set([]);
  }
}
