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
    <div class="fixed right-4 top-80 w-72 max-h-80 glass-panel overflow-hidden z-40">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-twitch-gray bg-twitch-darker">
        <h3 class="text-sm font-semibold text-twitch-text">Historial</h3>
      </div>

      <!-- Moves -->
      <div class="p-3 overflow-y-auto max-h-64 space-y-2">
        <div *ngFor="let jugada of jugadas()"
             class="p-3 rounded-lg text-sm animate-fade-in"
             [ngClass]="getJugadaClass(jugada)">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium text-twitch-text">{{ jugada.jugador }}</div>
              <div class="text-xs mt-1">
                <span *ngIf="jugada.tipo === 'jugada'" class="text-twitch-purple">Jugó {{ jugada.ficha }}</span>
                <span *ngIf="jugada.tipo === 'paso'" class="text-accent-warning">Pasó</span>
                <span *ngIf="jugada.tipo === 'mano-limpia'" class="text-accent-success">Mano limpia</span>
                <span *ngIf="jugada.tipo === 'tranque'" class="text-accent-live">Tranque</span>
              </div>
            </div>
            <div class="text-xs text-twitch-text-muted">{{ getTimeAgo(jugada.timestamp) }}</div>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="jugadas().length === 0" class="text-center py-6">
          <p class="text-sm text-twitch-text-muted">Sin jugadas aún</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-3 py-2 border-t border-twitch-gray bg-twitch-dark">
        <p class="text-xs text-twitch-text-muted text-center">{{ jugadas().length }} jugadas</p>
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
    const baseClass = 'border-l-2';
    const typeClasses: Record<string, string> = {
      jugada: 'border-l-twitch-purple bg-twitch-purple/5',
      paso: 'border-l-accent-warning bg-accent-warning/5',
      'mano-limpia': 'border-l-accent-success bg-accent-success/5',
      tranque: 'border-l-accent-live bg-accent-live/5',
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
