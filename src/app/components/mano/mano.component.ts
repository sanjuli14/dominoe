import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FichaComponent } from '../ficha/ficha.component';
import { Ficha } from '../../services/game.service';

@Component({
  selector: 'app-mano',
  standalone: true,
  imports: [CommonModule, FichaComponent],
  template: `
    <div
      class="glass-panel fixed bottom-0 left-0 right-0 h-40
             border-t-2 border-gold bg-gradient-to-t from-felt-800 via-felt-700 to-transparent
             flex items-center justify-center px-4 py-4 gap-6
             backdrop-blur-xl z-40"
    >
      <!-- Etiqueta de turno -->
      <div
        *ngIf="misTurno"
        class="absolute top-3 left-6 gaming-subtitle text-gold text-base animate-pulse-glow font-bold"
      >
        🎯 ¡ES TU TURNO!
      </div>

      <!-- Fichas en mano -->
      <div
        class="flex items-center justify-center gap-8 overflow-x-auto max-w-full h-32 scrollbar-hide"
      >
        <!-- Ficha vacía (para pasar o esperar) -->
        <div *ngIf="fichas.length === 0" class="text-ivory/50 text-center">
          <p class="text-sm">No hay fichas disponibles</p>
          <button
            *ngIf="misTurno"
            (click)="onPasar()"
            class="mt-2 px-6 py-3 bg-gold/20 border-2 border-gold text-gold rounded-lg hover:bg-gold/30 transition-all gaming-subtitle font-bold text-sm"
          >
            PASAR
          </button>
        </div>

        <!-- Fichas -->
        <div
          *ngFor="let ficha of fichas; let idx = index"
          class="flex-shrink-0 transition-all duration-300 hover:scale-125 hover:translate-y-[-16px] cursor-pointer"
          [class.translate-y-[-48px]]="seleccionada() === idx"
        >
          <app-ficha
            [valor_a]="ficha.valor_a"
            [valor_b]="ficha.valor_b"
            [id]="ficha.id"
            [selected]="seleccionada() === idx"
            [disabled]="!misTurno"
            (fichaClicked)="onFichaClicked(ficha, idx)"
            (fichaDoubleClicked)="onFichaDoubleClicked(ficha, idx)"
          ></app-ficha>
        </div>

        <!-- Botón de Pasar -->
        <button
          *ngIf="fichas.length > 0 && misTurno"
          (click)="onPasar()"
          class="flex-shrink-0 px-8 py-3 bg-gradient-to-r from-copper to-gold text-ebony font-bold rounded-lg hover:scale-110 transition-all gaming-subtitle shadow-lg text-base"
        >
          PASAR
        </button>
      </div>

      <!-- Panel de control derecho -->
      <div
        *ngIf="seleccionada() !== -1"
        class="absolute right-6 bottom-4 flex gap-3"
      >
        <button
          (click)="onJugarIzq()"
          class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg font-bold gaming-subtitle hover:scale-110 transition-all shadow-lg text-base"
        >
          ◄ IZQUIERDA
        </button>
        <button
          (click)="onJugarDer()"
          class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg font-bold gaming-subtitle hover:scale-110 transition-all shadow-lg text-base"
        >
          DERECHA ►
        </button>
        <button
          (click)="onCancelar()"
          class="px-4 py-3 bg-red-600/20 border-2 border-red-500 text-red-400 rounded-lg font-bold hover:bg-red-600/40 transition-all text-base"
        >
          ✕
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `,
  ],
})
export class ManoComponent {
  @Input() fichas: Ficha[] = [];
  @Input() misTurno: boolean = false;
  @Output() fichaSeleccionada = new EventEmitter<{
    ficha: Ficha;
    lado: 'izquierda' | 'derecha';
  }>();
  @Output() pasarTurno = new EventEmitter<void>();

  seleccionada = signal<number>(-1);

  onFichaClicked(ficha: Ficha, idx: number) {
    this.seleccionada.set(this.seleccionada() === idx ? -1 : idx);
  }

  onFichaDoubleClicked(ficha: Ficha, idx: number) {
    this.fichaSeleccionada.emit({ ficha, lado: 'derecha' });
    this.seleccionada.set(-1);
  }

  onJugarIzq() {
    const idx = this.seleccionada();
    const ficha = this.fichas[idx];
    if (ficha) {
      this.fichaSeleccionada.emit({ ficha, lado: 'izquierda' });
      this.seleccionada.set(-1);
    }
  }

  onJugarDer() {
    const idx = this.seleccionada();
    const ficha = this.fichas[idx];
    if (ficha) {
      this.fichaSeleccionada.emit({ ficha, lado: 'derecha' });
      this.seleccionada.set(-1);
    }
  }

  onCancelar() {
    this.seleccionada.set(-1);
  }

  onPasar() {
    this.pasarTurno.emit();
    this.seleccionada.set(-1);
  }
}
