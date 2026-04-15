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

  // Tallas Cubanas - Frases del juego
  private tallasCubanas = [
    '¡Suena el zapato!',
    '¡Paso y gano!',
    '¡Toma tu data!',
    '¡Mira ese doble!',
    '¡Tranque gordo!',
    '¡Salió corriendo!',
    '¡Que saque el muerto!',
    '¡Eso es un plato!',
    '¡Se acabó la función!',
    '¡Venga ese dominó!',
    '¡Qué ficha tan buena!',
    '¡Dale con el trancazo!',
    '¡Oye, eso duele!',
    '¡Aquí se acaba el negocio!',
    '¡Una mano grande!',
    "¡Vira pa'lla!",
    '¡Que quede en familia!',
    '¡Eso es un hueso!',
    "¡Tírate pa'lla, socio!",
    '¡Eso es un claxazo!',
  ];

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

  showCubano(delay: number = 500) {
    const talla =
      this.tallasCubanas[Math.floor(Math.random() * this.tallasCubanas.length)];
    setTimeout(() => {
      this.showToast(talla, 'cubano', 4000);
    }, delay);
  }

  removeToast(id: string) {
    const current = this.toasts();
    this.toasts.set(current.filter((t) => t.id !== id));
  }

  clearAll() {
    this.toasts.set([]);
  }
}
