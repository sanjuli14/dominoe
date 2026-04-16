import {
  Component,
  Input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Jugador } from '../../services/game.service';

@Component({
  selector: 'app-marcador',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Score Panel -->
    <div class="fixed top-20 right-4 z-40 w-64 animate-fade-in">
      <div class="glass-panel p-4">
        <!-- Header -->
        <div
          class="flex justify-between items-center mb-4 pb-3 border-b border-twitch-gray"
        >
          <span class="text-sm font-semibold text-twitch-text"
            >Mano {{ manoActual }}</span
          >
          <span *ngIf="esMiTurno()" class="badge badge-live text-xs"
            >TURNO</span
          >
        </div>

        <!-- Teams -->
        <div class="space-y-3 mb-4">
          <!-- Team A -->
          <div
            class="p-3 rounded-lg border transition-all"
            [ngClass]="
              miEquipo === 0
                ? 'bg-twitch-purple/10 border-twitch-purple'
                : 'bg-twitch-darker border-twitch-gray'
            "
          >
            <div class="flex justify-between items-center">
              <span class="text-xs font-medium text-twitch-text-muted uppercase"
                >Equipo A</span
              >
              <span
                class="text-2xl font-bold"
                [ngClass]="
                  miEquipo === 0 ? 'text-twitch-purple' : 'text-twitch-text'
                "
                >{{ puntuacion.eq0 }}</span
              >
            </div>
            <div class="mt-2 h-1 bg-twitch-gray rounded-full overflow-hidden">
              <div
                class="h-full bg-twitch-purple transition-all duration-500"
                [style.width.%]="(puntuacion.eq0 / 200) * 100"
              ></div>
            </div>
          </div>

          <!-- Team B -->
          <div
            class="p-3 rounded-lg border transition-all"
            [ngClass]="
              miEquipo === 1
                ? 'bg-accent-info/10 border-accent-info'
                : 'bg-twitch-darker border-twitch-gray'
            "
          >
            <div class="flex justify-between items-center">
              <span class="text-xs font-medium text-twitch-text-muted uppercase"
                >Equipo B</span
              >
              <span
                class="text-2xl font-bold"
                [ngClass]="
                  miEquipo === 1 ? 'text-accent-info' : 'text-twitch-text'
                "
                >{{ puntuacion.eq1 }}</span
              >
            </div>
            <div class="mt-2 h-1 bg-twitch-gray rounded-full overflow-hidden">
              <div
                class="h-full bg-accent-info transition-all duration-500"
                [style.width.%]="(puntuacion.eq1 / 200) * 100"
              ></div>
            </div>
          </div>
        </div>

        <!-- Current turn -->
        <div class="p-3 bg-twitch-darker rounded-lg border border-twitch-gray">
          <p class="text-xs text-twitch-text-muted uppercase mb-1">Turno de</p>
          <p class="font-semibold text-twitch-text">
            {{ turnoJugadorNombre() }}
          </p>
        </div>

        <!-- Players list -->
        <div
          *ngIf="jugadores.length > 0"
          class="mt-4 pt-4 border-t border-twitch-gray space-y-1"
        >
          <p class="text-xs text-twitch-text-muted uppercase mb-2">Jugadores</p>
          <div
            *ngFor="let j of jugadores"
            class="flex items-center justify-between text-sm py-1"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full"
                [ngClass]="
                  j.equipo === 0 ? 'bg-twitch-purple' : 'bg-accent-info'
                "
              ></span>
              <span
                [class.font-semibold]="j.posicion === turnoActualPosicion"
                >{{ j.nombre }}</span
              >
            </div>
            <span
              *ngIf="j.posicion === turnoActualPosicion"
              class="status-dot live"
            ></span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MarcadorComponent {
  @Input() puntuacion: { eq0: number; eq1: number } = { eq0: 0, eq1: 0 };
  @Input() manoActual: number = 1;
  @Input() jugadores: Jugador[] = [];
  @Input() turnoActualPosicion: number = 0;
  @Input() miEquipo: number = 0;

  turnoJugadorNombre(): string {
    const jugador = this.jugadores.find(
      (j) => j.posicion === this.turnoActualPosicion,
    );
    return jugador?.nombre || `Jugador ${this.turnoActualPosicion}`;
  }

  esMiTurno(): boolean {
    const miJugador = this.jugadores.find((j) => j.equipo === this.miEquipo);
    return miJugador?.posicion === this.turnoActualPosicion;
  }

  puntosRestantes() {
    return {
      eq0: 200 - this.puntuacion.eq0,
      eq1: 200 - this.puntuacion.eq1,
    };
  }
}
