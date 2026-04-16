import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FichaComponent } from '../ficha/ficha.component';
import { Ficha } from '../../services/game.service';

@Component({
  selector: 'app-mano',
  standalone: true,
  imports: [CommonModule, FichaComponent],
  template: `
    <div class="fixed bottom-0 left-0 right-0 h-36 bg-twitch-dark border-t border-twitch-gray z-40">
      <!-- Turn indicator -->
      <div *ngIf="misTurno" class="absolute top-2 left-4 flex items-center gap-2">
        <span class="status-dot live"></span>
        <span class="text-sm font-semibold text-accent-live">Tu turno</span>
      </div>

      <!-- Fichas container -->
      <div class="flex items-center justify-center h-full gap-4 px-4 overflow-x-auto scrollbar-hide">
        <!-- Empty state -->
        <div *ngIf="fichas.length === 0" class="text-center">
          <p class="text-sm text-twitch-text-muted mb-2">Sin fichas</p>
          <button *ngIf="misTurno" (click)="onPasar()" class="btn-secondary px-6 py-2 text-sm">
            Pasar turno
          </button>
        </div>

        <!-- Fichas -->
        <div
          *ngFor="let ficha of fichas; let idx = index"
          class="flex-shrink-0 transition-all duration-200 hover:scale-110 cursor-pointer"
          [class.-translate-y-4]="seleccionada() === idx"
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

        <!-- Pasar button -->
        <button
          *ngIf="fichas.length > 0 && misTurno"
          (click)="onPasar()"
          class="flex-shrink-0 btn-secondary px-6 py-3"
        >
          Pasar
        </button>
      </div>

      <!-- Controls -->
      <div *ngIf="seleccionada() !== -1" class="absolute right-4 bottom-4 flex gap-2">
        <button (click)="onJugarIzq()" class="btn-primary px-4 py-2 text-sm">← Izq</button>
        <button (click)="onJugarDer()" class="btn-primary px-4 py-2 text-sm">Der →</button>
        <button (click)="onCancelar()" class="btn-secondary px-3 py-2 text-sm">✕</button>
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
