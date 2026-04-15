import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Jugador } from '../../services/game.service';

@Component({
  selector: 'app-marcador',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Panel de puntuación flotante - Optimizado para Twitch -->
    <div class="fixed top-6 right-6 z-50 w-80 animate-slide-up">
      <!-- Tarjeta principal del marcador -->
      <div class="glass-panel p-6 overflow-hidden">
        <!-- Header con número de mano -->
        <div
          class="flex justify-between items-center mb-6 pb-4 border-b border-purple-500/30"
        >
          <h3 class="title-lg text-2xl">🎲 LA ESQUINA</h3>
          <span class="badge badge-info">MANO #{{ manoActual }}</span>
        </div>

        <!-- Score Principal - Dos Equipos -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <!-- EQUIPO A (AZUL) -->
          <div
            class="relative p-4 rounded-xl transition-all duration-300 border"
            [ngClass]="{
              'ring-2 ring-cyan-400/50 bg-cyan-400/15 border-cyan-400/50':
                miEquipo === 0,
              'bg-purple-900/10 border-purple-500/30': miEquipo !== 0,
            }"
          >
            <div class="text-center">
              <p
                class="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1"
              >
                Equipo A
              </p>
              <p class="text-5xl font-black text-cyan-300">
                {{ puntuacion.eq0 }}
              </p>
              <div class="flex justify-center gap-1 mt-2">
                <span class="text-xs text-gray-400">Meta:</span>
                <span class="text-xs font-bold text-cyan-400">200</span>
              </div>
              <!-- Barra de progreso -->
              <div class="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                  [style.width.%]="(puntuacion.eq0 / 200) * 100"
                ></div>
              </div>
            </div>
          </div>

          <!-- EQUIPO B (PÚRPURA) -->
          <div
            class="relative p-4 rounded-xl transition-all duration-300 border"
            [ngClass]="{
              'ring-2 ring-pink-400/50 bg-pink-400/15 border-pink-400/50':
                miEquipo === 1,
              'bg-purple-900/10 border-purple-500/30': miEquipo !== 1,
            }"
          >
            <div class="text-center">
              <p
                class="text-xs font-bold text-pink-400 uppercase tracking-wider mb-1"
              >
                Equipo B
              </p>
              <p class="text-5xl font-black text-pink-300">
                {{ puntuacion.eq1 }}
              </p>
              <div class="flex justify-center gap-1 mt-2">
                <span class="text-xs text-gray-400">Meta:</span>
                <span class="text-xs font-bold text-pink-400">200</span>
              </div>
              <!-- Barra de progreso -->
              <div class="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-pink-400 to-red-500 transition-all duration-500"
                  [style.width.%]="(puntuacion.eq1 / 200) * 100"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Divisor -->
        <div
          class="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-4"
        ></div>

        <!-- Información de turno -->
        <div
          class="mb-4 p-4 rounded-lg bg-purple-900/30 border border-purple-500/40"
        >
          <p
            class="text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold"
          >
            Turno de:
          </p>
          <p class="text-lg gaming-title text-white">
            🎯 {{ turnoJugadorNombre() }}
          </p>
        </div>

        <!-- Alerta de final de partida -->
        <div
          *ngIf="puntosRestantes().eq0 <= 50 || puntosRestantes().eq1 <= 50"
          class="animate-glow-pulse p-3 rounded-lg mb-4 border"
          [ngClass]="{
            'bg-cyan-400/20 border-cyan-400 text-cyan-400':
              puntosRestantes().eq0 <= 50,
            'bg-pink-400/20 border-pink-400 text-pink-400':
              puntosRestantes().eq1 <= 50,
          }"
        >
          <p class="text-xs font-bold mb-1">⚠️ ¡ALERTA!</p>
          <p class="text-sm gaming-subtitle">
            {{ puntosRestantes().eq0 <= 50 ? 'Equipo A' : 'Equipo B' }} a punto
            de ganar
          </p>
        </div>

        <!-- Información de jugadores -->
        <div
          *ngIf="jugadores.length > 0"
          class="pt-4 border-t border-purple-500/30 space-y-2"
        >
          <p
            class="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3"
          >
            JUGADORES EN JUEGO
          </p>
          <div
            *ngFor="let j of jugadores"
            class="flex items-center justify-between p-2 rounded-lg"
            [ngClass]="{
              'bg-cyan-400/10': j.equipo === 0,
              'bg-pink-400/10': j.equipo === 1,
            }"
          >
            <div class="flex items-center gap-2 flex-1">
              <span class="text-lg">{{ j.equipo === 0 ? '🔵' : '🔴' }}</span>
              <span class="text-sm font-semibold text-gray-300">{{
                j.nombre
              }}</span>
            </div>
            <span class="text-xs text-gray-500">Pos {{ j.posicion }}</span>
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

  puntosRestantes() {
    return {
      eq0: 200 - this.puntuacion.eq0,
      eq1: 200 - this.puntuacion.eq1,
    };
  }
}
