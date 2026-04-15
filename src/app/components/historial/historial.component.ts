import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface JugadaHistorico {
  id: string;
  jugador: string;
  ficha: string;
  lado?: string;
  timestamp: number;
  tipo: 'jugada' | 'paso' | 'mano-limpia' | 'tranque';
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed right-4 top-24 w-80 max-h-96 glass-panel rounded-2xl border border-gold/30 overflow-hidden shadow-xl z-40"
    >
      <!-- Header -->
      <div
        class="bg-gradient-to-r from-gold/20 to-copper/20 px-6 py-4 border-b border-gold/30"
      >
        <h3 class="gaming-subtitle text-lg text-gold">📜 HISTORIAL</h3>
        <p class="text-ivory/50 text-xs mt-1">Últimas jugadas</p>
      </div>

      <!-- Jugadas -->
      <div class="space-y-2 p-4 overflow-y-auto max-h-80">
        <div
          *ngFor="let jugada of jugadas(); let i = index"
          [ngClass]="getJugadaClass(jugada)"
          class="px-4 py-3 rounded-lg border text-sm gaming-subtitle animate-fade-in"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="text-ivory font-semibold">{{ jugada.jugador }}</div>
              <div class="text-ivory/70 text-xs mt-1">
                <span *ngIf="jugada.tipo === 'jugada'" class="text-cyan-400"
                  >Jugó: {{ jugada.ficha }}</span
                >
                <span *ngIf="jugada.tipo === 'paso'" class="text-orange-400"
                  >Pasó ❌</span
                >
                <span
                  *ngIf="jugada.tipo === 'mano-limpia'"
                  class="text-green-400"
                  >✓ Mano limpia!</span
                >
                <span *ngIf="jugada.tipo === 'tranque'" class="text-red-400"
                  >⛔ Tranque</span
                >
              </div>
            </div>
            <div class="text-ivory/40 text-xs">
              {{ getTimeAgo(jugada.timestamp) }}
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="jugadas().length === 0" class="text-center py-8">
          <p class="text-ivory/40 text-sm">Esperando primeras jugadas...</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-4 py-2 border-t border-gold/20 bg-felt-800/30">
        <p class="text-ivory/40 text-xs text-center">
          {{ jugadas().length }} jugadas totales
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
    `,
  ],
})
export class HistorialComponent {
  @Input() set agregarJugada(jugada: JugadaHistorico | null) {
    if (jugada) {
      this.jugadas.update((prev) => [jugada, ...prev.slice(0, 19)]); // Máximo 20 jugadas
    }
  }

  jugadas = signal<JugadaHistorico[]>([]);

  getJugadaClass(jugada: JugadaHistorico): string {
    const baseClass = 'border-l-4';
    const typeClasses: Record<string, string> = {
      jugada: 'border-l-cyan-400 bg-cyan-400/5',
      paso: 'border-l-orange-400 bg-orange-400/5',
      'mano-limpia': 'border-l-green-400 bg-green-400/5',
      tranque: 'border-l-red-400 bg-red-400/5',
    };

    return `${baseClass} ${typeClasses[jugada.tipo] || typeClasses['jugada']}`;
  }

  getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `hace ${seconds}s`;
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
    return `hace ${Math.floor(seconds / 3600)}h`;
  }
}
