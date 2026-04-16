import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewChecked,
  HostListener,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  GameService,
  Ficha,
  FichaEnMesa,
  Jugador,
} from '../../services/game.service';
import {
  EnhancedDemoService,
  Ficha as DemoFicha,
  FichaEnMesa as DemoFichaEnMesa,
  Jugador as DemoJugador,
} from '../../services/enhanced-demo.service';
import { ToastService } from '../../services/toast.service';
import { AudioService } from '../../services/audio.service';
import { FichaComponent } from '../ficha/ficha.component';
import { ManoComponent } from '../mano/mano.component';
import { MarcadorComponent } from '../marcador/marcador.component';
import { ToastContainerComponent } from '../toast-container/toast-container.component';
import {
  HistorialComponent,
  JugadaHistorico,
} from '../historial/historial.component';

// ============================================
// SISTEMA DE GRID ABSTRACTO
// ============================================
interface GridCell {
  x: number;
  y: number;
}

interface Direction {
  x: number;
  y: number;
  angle: number;
  name: 'N' | 'S' | 'E' | 'W';
}

const DIRECTIONS = {
  N: { x: 0, y: -1, angle: 270, name: 'N' as const },
  S: { x: 0, y: 1, angle: 90, name: 'S' as const },
  E: { x: 1, y: 0, angle: 0, name: 'E' as const },
  W: { x: -1, y: 0, angle: 180, name: 'W' as const },
};

const GRID_CONFIG = {
  CELL_SIZE: 32, // Tamaño de celda en px (32*2=64px = ancho exacto de ficha)
  FICHA_WIDTH_CELLS: 2, // Ficha normal: 2 celdas de largo
  FICHA_HEIGHT_CELLS: 1, // Ficha normal: 1 celda de ancho
  MULA_SIZE_CELLS: 1, // Mula: ocupa 1x1 pero se renderiza perpendicular
  VIEWBOX_WIDTH: 1000,
  VIEWBOX_HEIGHT: 700,
  MARGIN_X: 80,
  MARGIN_Y: 80,
};

// Extremo libre de la cadena de fichas
interface Extremo {
  gridX: number;
  gridY: number;
  direccion: Direction;
  valorLibre: number | null;
  isActivo: boolean;
}

// Ficha normalizada para el tablero
interface FichaTablero {
  id: string;
  valor_a: number;
  valor_b: number;
  esMula: boolean;
  cx: number;
  cy: number;
  rotacion: number;
  lado: 'izquierda' | 'derecha';
  orden: number;
}

@Component({
  selector: 'app-tablero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ManoComponent,
    MarcadorComponent,
    ToastContainerComponent,
  ],
  template: `
    <div class="w-screen h-screen bg-twitch-black flex flex-col">
      <!-- Header -->
      <header class="nav-header shrink-0 z-50">
        <div class="nav-brand">
          <img src="assets/logo.svg" alt="La Esquina" class="w-7 h-7" />
          <span class="brand-gradient text-lg">LA ESQUINA</span>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <div *ngIf="isDemoMode()" class="badge badge-purple">DEMO</div>
          <div *ngIf="!isDemoMode()" class="flex items-center gap-2">
            <span class="status-dot online"></span>
            <span class="text-twitch-text-muted">Sala: {{ codigoSala() }}</span>
          </div>
        </div>
      </header>

      <!-- Game Area -->
      <div class="flex-1 relative felt-table overflow-hidden">
        <!-- Waiting Screen -->
        <div
          *ngIf="esperandoJugadores()"
          class="absolute inset-0 bg-twitch-black/95 flex items-center justify-center z-40"
        >
          <div class="glass-panel-purple max-w-md w-full mx-4 p-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="title-lg">Sala de Espera</h2>
              <div class="flex items-center gap-2">
                <span class="status-dot online"></span>
                <span class="text-sm text-twitch-text-muted"
                  >{{ jugadores().length }}/4</span
                >
              </div>
            </div>

            <div
              class="bg-twitch-darker border border-twitch-gray rounded-lg p-4 mb-6"
            >
              <p class="text-xs text-twitch-text-muted uppercase mb-2">
                Código
              </p>
              <div class="flex items-center justify-between">
                <span
                  class="text-3xl font-bold text-twitch-purple tracking-widest"
                  >{{ codigoSala() }}</span
                >
                <button
                  (click)="copiarCodigoSala()"
                  class="btn-secondary px-4 py-2 text-sm"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div class="space-y-2 mb-6">
              <div
                *ngFor="let j of jugadores()"
                class="flex items-center gap-3 p-3 bg-twitch-darker rounded-lg border border-twitch-gray"
              >
                <span class="status-dot online"></span>
                <span class="font-medium">{{ j.nombre }}</span>
                <span class="text-xs text-twitch-text-muted ml-auto"
                  >Eq {{ j.equipo }}</span
                >
              </div>
              <div
                *ngFor="let i of generarEspacios(4 - jugadores().length)"
                class="p-3 bg-twitch-dark rounded-lg border border-dashed border-twitch-gray text-twitch-text-muted text-center text-sm"
              >
                Esperando jugador...
              </div>
            </div>

            <button
              *ngIf="jugadores().length === 4 && puedeIniciar()"
              (click)="iniciarPartida()"
              [disabled]="iniciandoPartida()"
              class="w-full btn-success py-4 font-bold disabled:opacity-50"
            >
              {{ iniciandoPartida() ? 'Iniciando...' : 'Iniciar Partida' }}
            </button>
          </div>
        </div>

        <!-- CONTENEDOR PRINCIPAL DEL TABLERO -->
        <div
          class="absolute inset-4 rounded-2xl border-4 border-amber-900/50 shadow-2xl overflow-hidden"
          style="background: rgba(40, 25, 15, 0.3);"
        >
          <!-- SVG TABLERO -->
          <svg
            class="w-full h-full"
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <!-- Gradiente metálico para la hendidura -->
              <linearGradient id="metallic" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#8B7355" />
                <stop offset="30%" stop-color="#D4C5B0" />
                <stop offset="50%" stop-color="#F5F5DC" />
                <stop offset="70%" stop-color="#D4C5B0" />
                <stop offset="100%" stop-color="#8B7355" />
              </linearGradient>

              <!-- Sombra de la ficha -->
              <filter
                id="fichaShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="2"
                  dy="3"
                  stdDeviation="2"
                  flood-color="#000"
                  flood-opacity="0.4"
                />
              </filter>

              <!-- Relieve para los pips -->
              <filter
                id="pipRelief"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0.5"
                  dy="0.5"
                  stdDeviation="0.5"
                  flood-color="#000"
                  flood-opacity="0.5"
                />
              </filter>

              <!-- Gradiente de hueso/marfil para la ficha -->
              <linearGradient
                id="huesoGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stop-color="#FFFEF5" />
                <stop offset="50%" stop-color="#F5F5DC" />
                <stop offset="100%" stop-color="#E8E4D0" />
              </linearGradient>
            </defs>

            <!-- GRID DEBUG (opcional) -->
            <g *ngIf="mostrarGrid()">
              <line
                *ngFor="let i of gridLinesX()"
                [attr.x1]="i"
                y1="0"
                [attr.x2]="i"
                y2="700"
                stroke="rgba(255,255,255,0.1)"
                stroke-width="1"
              />
              <line
                *ngFor="let i of gridLinesY()"
                x1="0"
                [attr.y1]="i"
                x2="1000"
                [attr.y2]="i"
                stroke="rgba(255,255,255,0.1)"
                stroke-width="1"
              />
            </g>

            <!-- FICHAS EN EL TABLERO -->
            <g id="domino-snake">
              <g
                *ngFor="let f of fichasTablero(); trackBy: trackByFicha"
                [attr.transform]="
                  'translate(' +
                  f.cx +
                  ', ' +
                  f.cy +
                  ') rotate(' +
                  f.rotacion +
                  ')'
                "
              >
                <!-- Sombra proyectada -->
                <rect
                  x="-34"
                  y="-16"
                  width="68"
                  height="32"
                  rx="5"
                  fill="none"
                  filter="url(#fichaShadow)"
                />

                <!-- Base de la ficha (hueso/marfil) -->
                <rect
                  x="-32"
                  y="-16"
                  width="64"
                  height="32"
                  rx="5"
                  fill="url(#huesoGradient)"
                  stroke="#C4B49A"
                  stroke-width="1"
                />

                <!-- Borde interior sutil -->
                <rect
                  x="-30"
                  y="-14"
                  width="60"
                  height="28"
                  rx="3"
                  fill="none"
                  stroke="rgba(0,0,0,0.05)"
                  stroke-width="1"
                />

                <!-- Hendidura central metálica -->
                <line
                  x1="0"
                  y1="-15"
                  x2="0"
                  y2="15"
                  stroke="url(#metallic)"
                  stroke-width="3"
                />

                <!-- Sombra sutil de la hendidura -->
                <line
                  x1="-1"
                  y1="-15"
                  x2="-1"
                  y2="15"
                  stroke="rgba(0,0,0,0.2)"
                  stroke-width="1"
                />
                <line
                  x1="1"
                  y1="-15"
                  x2="1"
                  y2="15"
                  stroke="rgba(255,255,255,0.5)"
                  stroke-width="1"
                />

                <!-- Lado A (izquierda) -->
                <g transform="translate(-16, 0)">
                  <circle
                    *ngFor="let pip of getPips(f.valor_a)"
                    [attr.cx]="pip.x"
                    [attr.cy]="pip.y"
                    r="3"
                    fill="#1a1a1a"
                    filter="url(#pipRelief)"
                  />
                </g>

                <!-- Lado B (derecha) -->
                <g transform="translate(16, 0)">
                  <circle
                    *ngFor="let pip of getPips(f.valor_b)"
                    [attr.cx]="pip.x"
                    [attr.cy]="pip.y"
                    r="3"
                    fill="#1a1a1a"
                    filter="url(#pipRelief)"
                  />
                </g>
              </g>
            </g>

            <!-- DEBUG: Mostrar posición de extremos -->
            <g *ngIf="debug()">
              <text
                x="10"
                y="20"
                fill="#0f0"
                font-size="12"
                font-family="monospace"
              >
                Fichas: {{ fichasTablero().length }} | Izq:
                {{ extremosDebug()?.izq }} | Der: {{ extremosDebug()?.der }}
              </text>
            </g>
          </svg>

          <!-- Extremos actuales (HUD) -->
          <div
            class="absolute top-4 left-1/2 -translate-x-1/2 flex gap-8 z-10 opacity-70"
          >
            <div
              *ngIf="extremosActuales().izq !== null"
              class="bg-black/60 px-4 py-2 rounded-full text-ivory gaming-subtitle border border-ivory/30 backdrop-blur-sm"
            >
              <span class="text-gold">IZQ:</span> {{ extremosActuales().izq }}
            </div>
            <div
              *ngIf="extremosActuales().der !== null"
              class="bg-black/60 px-4 py-2 rounded-full text-ivory gaming-subtitle border border-ivory/30 backdrop-blur-sm"
            >
              <span class="text-gold">DER:</span> {{ extremosActuales().der }}
            </div>
          </div>
        </div>

        <!-- Marcador flotante -->
        <app-marcador
          [puntuacion]="puntuacion()"
          [manoActual]="manoActual()"
          [jugadores]="jugadores()"
          [turnoActualPosicion]="turnoActualPosicion()"
          [miEquipo]="miEquipo()"
        ></app-marcador>

        <!-- Mano del jugador -->
        <app-mano
          [fichas]="misFichas()"
          [misTurno]="esmiTurno()"
          (fichaSeleccionada)="onFichaSeleccionada($event)"
          (pasarTurno)="onPasarTurno()"
        ></app-mano>

        <!-- Toast container -->
        <app-toast-container></app-toast-container>

        <!-- Historial de jugadas -->
        <!-- <app-historial [agregarJugada]="ultimaJugada()"></app-historial> -->

        <!-- Tallas / Chat Básico -->
        <div class="fixed bottom-44 left-4 z-50 flex flex-col gap-2">
          <button
            *ngIf="!tallasMenuAhi()"
            (click)="abrirMenuTallas()"
            [disabled]="tallaCooldown() > 0"
            class="w-14 h-14 rounded-full bg-twitch-darker border border-twitch-purple text-twitch-purple hover:bg-twitch-purple hover:text-white transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(145,70,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              *ngIf="tallaCooldown() > 0"
              class="text-sm font-bold text-white"
              >{{ tallaCooldown() }}s</span
            >
            <span *ngIf="tallaCooldown() === 0" class="text-2xl pt-1">💬</span>
          </button>

          <div
            *ngIf="tallasMenuAhi()"
            class="bg-twitch-darker border-2 border-twitch-purple/50 rounded-xl p-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col gap-2 w-[280px]"
          >
            <div class="flex justify-between items-center mb-1 px-1">
              <span
                class="text-sm font-extrabold text-twitch-purple-light uppercase"
                >Hablarle a la mesa</span
              >
              <button
                (click)="tallasMenuAhi.set(false)"
                class="text-twitch-text flex items-center justify-center w-6 h-6 hover:text-accent-live bg-black/40 rounded-full"
              >
                ✕
              </button>
            </div>
            <button
              *ngFor="let t of tallasOpciones()"
              (click)="enviarTallaPropia(t)"
              class="text-left text-sm px-3 py-2 rounded-lg bg-twitch-black hover:bg-twitch-purple text-white transition-all transform hover:scale-105"
            >
              {{ t }}
            </button>
          </div>
        </div>

        <!-- Debug buttons -->
        <div
          class="fixed bottom-32 right-4 flex flex-col gap-2 z-50"
          *ngIf="debug()"
        >
          <button
            (click)="toggleGrid()"
            class="px-3 py-2 bg-twitch-gray border border-twitch-purple text-twitch-purple rounded text-xs font-mono hover:bg-twitch-purple hover:text-white transition-colors"
          >
            GRID: {{ mostrarGrid() ? 'ON' : 'OFF' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class TableroComponent implements OnInit {
  private realGameService = inject(GameService);
  private gameService = signal<GameService | null>(null);

  // Señales de estado
  debug = signal(false);
  mostrarGrid = signal(false);
  isDemoMode = signal(false);
  ultimaJugada = signal<JugadaHistorico | null>(null);
  iniciandoPartida = signal(false);
  tallasMenuAhi = signal(false);
  tallaCooldown = signal(0);
  tallasOpciones = signal<string[]>([]);

  // ============================================
  // PROPIEDADES REACTIVAS UNIFICADAS
  // ============================================
  jugadores = computed(() => {
    return this.isDemoMode()
      ? (this.demoService.jugadores() as unknown as Jugador[])
      : this.gameService()?.jugadores() || [];
  });

  misFichas = computed(() => {
    return this.isDemoMode()
      ? (this.demoService.fichasEnMano() as unknown as Ficha[])
      : this.gameService()?.fichasEnMano() || [];
  });

  fichasEnMesa = computed(() => {
    return this.isDemoMode()
      ? (this.demoService.fichasEnMesa() as unknown as FichaEnMesa[])
      : this.gameService()?.fichasEnMesa() || [];
  });

  manoActual = computed(() => {
    return this.isDemoMode()
      ? 1
      : this.gameService()?.partida()?.mano_actual || 1;
  });

  esmiTurno = computed(() => {
    return this.isDemoMode()
      ? this.demoService.esmiTurno()
      : this.gameService()?.esmiTurno() || false;
  });

  extremosActuales = computed(() => {
    return this.isDemoMode()
      ? (this.demoService.extremosActuales() as any)
      : this.gameService()?.extremosActuales() || { izq: null, der: null };
  });

  extremosDebug = computed(() => {
    const fichas = this.fichasTablero();
    if (fichas.length === 0) return null;
    return {
      izq: fichas[0]?.valor_a + '-' + fichas[0]?.valor_b,
      der:
        fichas[fichas.length - 1]?.valor_a +
        '-' +
        fichas[fichas.length - 1]?.valor_b,
    };
  });

  puntuacion = computed(() => {
    return this.isDemoMode()
      ? this.demoService.puntuacion()
      : this.gameService()?.puntuacion() || { eq0: 0, eq1: 0 };
  });

  turnoActualPosicion = computed(() => {
    return this.isDemoMode()
      ? this.demoService.turnoActual()
      : this.gameService()?.manoActual()?.turno_actual || 0;
  });

  miEquipo = computed(() => {
    return this.isDemoMode()
      ? this.demoService.miJugador()?.equipo || 0
      : this.gameService()?.miJugador()?.equipo || 0;
  });

  esperandoJugadores = computed(() => {
    if (this.isDemoMode()) return false;
    return this.gameService()?.partida()?.estado === 'esperando';
  });

  codigoSala = computed(() => {
    return this.gameService()?.partida()?.codigo_sala || '';
  });

  puedeIniciar = computed(() => {
    if (this.isDemoMode()) return false;
    return this.esperandoJugadores() && this.jugadores().length === 4;
  });

  // Grid debug lines
  gridLinesX = computed(() => {
    const lines = [];
    for (let i = 0; i <= 1000; i += GRID_CONFIG.CELL_SIZE) {
      lines.push(i);
    }
    return lines;
  });

  gridLinesY = computed(() => {
    const lines = [];
    for (let i = 0; i <= 700; i += GRID_CONFIG.CELL_SIZE) {
      lines.push(i);
    }
    return lines;
  });

  // ============================================
  // ALGORITMO SNAKE - RENDERIZADO DE FICHAS
  // ============================================
  fichasTablero = computed((): FichaTablero[] => {
    const rawFichas = this.fichasEnMesa();

    if (!rawFichas || rawFichas.length === 0) {
      return [];
    }

    // Normalizar fichas de ambos servicios al formato interno
    const fichasNormalizadas = this.normalizarFichas(rawFichas);

    // Ordenar por orden de jugada
    const fichasOrdenadas = fichasNormalizadas.sort(
      (a, b) => a.orden - b.orden,
    );

    // Calcular posiciones en el grid
    return this.calcularPosicionesSnake(fichasOrdenadas);
  });

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private toast: ToastService,
    private audio: AudioService,
    private demoService: EnhancedDemoService,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (params) => {
        const gameId = params['id'];
        const isDemo = gameId?.includes('DEMO') || gameId?.includes('demo');

        if (isDemo) {
          this.isDemoMode.set(true);
          this.demoService.inicializarDemo('manual');

          this.demoService.fichaJugada$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(({ jugador, ficha }) => {
              if (!jugador.includes('STREAMER')) {
                this.ultimaJugada.set({
                  id: `jugada-${Date.now()}`,
                  jugador: jugador,
                  ficha: ficha === 'PASÓ' ? '' : ficha,
                  timestamp: Date.now(),
                  tipo: ficha === 'PASÓ' ? 'paso' : 'jugada',
                });
              }
              this.toast.showToast(`${jugador} jugó ${ficha}`, 'cubano', 2000);
              this.audio.playFichaClack();
            });

          this.demoService.turnoChanged$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(({ jugador }) => {
              if (jugador.includes('STREAMER')) {
                this.toast.showToast('¡ES TU TURNO!', 'info', 2000);
                this.audio.playTurno();
              } else {
                this.toast.showToast(`Turno de ${jugador}`, 'info', 1500);
              }
            });

          this.demoService.manoTerminada$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(({ ganador, puntos }) => {
              this.ultimaJugada.set({
                id: `mano-limpia-${Date.now()}`,
                jugador: ganador,
                ficha: `+${puntos}`,
                timestamp: Date.now(),
                tipo: 'mano-limpia',
              });
              this.toast.showToast(
                `${ganador} ganó +${puntos} puntos`,
                'success',
                3000,
              );
              this.audio.playManoLimpia();
            });
        } else if (gameId) {
          this.isDemoMode.set(false);
          const game = this.realGameService;
          this.gameService.set(game);
          await game.setCurrentGame(gameId);

          game.toastMessage$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((msg) => {
              this.toast.showToast(msg, 'success', 3000);
              this.audio.playFichaClack();
            });

          game.tallaMessage$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((msg) => {
              this.toast.showEspontaneo(msg);
              this.empezarCooldown(60);
            });

          game.errorMessage$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((msg) => {
              this.toast.showToast(msg, 'error', 3000);
              this.audio.playError();
            });
        }
      });
  }

  // ============================================
  // NORMALIZACIÓN DE FICHAS
  // ============================================
  private normalizarFichas(fichas: any[]): FichaTablero[] {
    return fichas.map((f, index) => {
      // Detectar formato del servicio
      const isGameService = 'lado' in f && 'orden_jugada' in f;
      const isDemoService = 'lado_jugado' in f && 'orden' in f;

      let lado: 'izquierda' | 'derecha';
      let orden: number;

      if (isGameService) {
        // Formato GameService
        lado = f.lado;
        orden = f.orden_jugada ?? index;
      } else if (isDemoService) {
        // Formato DemoService - convertir
        lado = f.lado_jugado === 'a' ? 'izquierda' : 'derecha';
        orden = f.orden ?? index;
      } else {
        // Fallback
        lado = 'derecha';
        orden = index;
      }

      return {
        id: f.id || `ficha-${index}`,
        valor_a: f.valor_a,
        valor_b: f.valor_b,
        esMula: f.valor_a === f.valor_b,
        cx: 0,
        cy: 0,
        rotacion: 0,
        lado,
        orden,
      };
    });
  }

  // ============================================
  // ALGORITMO SNAKE - GRID ESTRICTO
  // ============================================
  // Usamos coordenadas de grid (enteros) para alineación perfecta
  // Celda = 32px. Ficha normal = 2 celdas (64px). Mula = 1 celda ancho (32px).

  private calcularPosicionesSnake(fichas: FichaTablero[]): FichaTablero[] {
    if (fichas.length === 0) return [];

    const { CELL_SIZE, VIEWBOX_WIDTH, VIEWBOX_HEIGHT } = GRID_CONFIG;

    // Centro en coordenadas de grid (cada celda = 32px)
    const gridCenterX = Math.floor(VIEWBOX_WIDTH / 2 / CELL_SIZE);
    const gridCenterY = Math.floor(VIEWBOX_HEIGHT / 2 / CELL_SIZE);

    // Límites del grid (en celdas, dejando margen)
    const MIN_COL = 3; // 3 celdas de margen izquierdo
    const MAX_COL = Math.floor(VIEWBOX_WIDTH / CELL_SIZE) - 3;
    const MIN_ROW = 3; // 3 celdas de margen superior
    const MAX_ROW = Math.floor(VIEWBOX_HEIGHT / CELL_SIZE) - 3;

    const resultado: FichaTablero[] = [];

    // Interface para seguimiento de extremos en coordenadas de grid
    interface GridExtremo {
      col: number;
      row: number;
      dir: Direction;
      valorLibre: number | null;
      isActivo: boolean;
      esMula: boolean; // Tipo de la última ficha colocada en este extremo
    }

    let extremoIzq: GridExtremo = {
      col: gridCenterX,
      row: gridCenterY,
      dir: DIRECTIONS.W,
      valorLibre: null,
      isActivo: false,
      esMula: false,
    };

    let extremoDer: GridExtremo = {
      col: gridCenterX,
      row: gridCenterY,
      dir: DIRECTIONS.E,
      valorLibre: null,
      isActivo: false,
      esMula: false,
    };

    // Sistema de giro determinístico simple
    // Cada extremo gira en una secuencia fija cuando llega a un borde
    const girarIzquierda = (dir: Direction): Direction => {
      // Secuencia: W -> N -> E -> S -> W (sentido horario desde perspectiva del centro)
      switch (dir.name) {
        case 'W':
          return DIRECTIONS.N;
        case 'N':
          return DIRECTIONS.E;
        case 'E':
          return DIRECTIONS.S;
        case 'S':
          return DIRECTIONS.W;
        default:
          return dir;
      }
    };

    const girarDerecha = (dir: Direction): Direction => {
      // Secuencia: E -> S -> W -> N -> E (sentido anti-horario desde perspectiva del centro)
      switch (dir.name) {
        case 'E':
          return DIRECTIONS.S;
        case 'S':
          return DIRECTIONS.W;
        case 'W':
          return DIRECTIONS.N;
        case 'N':
          return DIRECTIONS.E;
        default:
          return dir;
      }
    };

    // Función para verificar si necesitamos girar (llegamos al borde)
    const necesitaGirar = (extremo: GridExtremo, esMula: boolean): boolean => {
      const avanceCeldas = esMula ? 1 : 2;
      const testCol = extremo.col + extremo.dir.x * avanceCeldas;
      const testRow = extremo.row + extremo.dir.y * avanceCeldas;

      return (
        testCol < MIN_COL ||
        testCol > MAX_COL ||
        testRow < MIN_ROW ||
        testRow > MAX_ROW
      );
    };

    fichas.forEach((ficha, index) => {
      const esMula = ficha.esMula;

      if (index === 0) {
        // Primera ficha: en el centro del grid
        const fichaCentro = {
          ...ficha,
          cx: gridCenterX * CELL_SIZE,
          cy: gridCenterY * CELL_SIZE,
          rotacion: esMula ? 90 : 0,
        };
        resultado.push(fichaCentro);

        // Configurar extremos según el tipo de ficha inicial
        // TODAS las fichas ocupan 64px (2 celdas) en su dimensión horizontal
        // El extremo es donde se conecta el CENTRO de la siguiente ficha (a 2 celdas de distancia)
        extremoIzq = {
          col: gridCenterX - 2,
          row: gridCenterY,
          dir: DIRECTIONS.W,
          valorLibre: ficha.valor_a,
          isActivo: true,
          esMula: esMula,
        };
        extremoDer = {
          col: gridCenterX + 2,
          row: gridCenterY,
          dir: DIRECTIONS.E,
          valorLibre: ficha.valor_b,
          isActivo: true,
          esMula: esMula,
        };
      } else {
        // Fichas subsiguientes
        const esExtremoIzq = ficha.lado === 'izquierda';
        let extremo = esExtremoIzq ? extremoIzq : extremoDer;

        if (!extremo.isActivo) return;

        // Verificar si necesitamos girar
        if (necesitaGirar(extremo, esMula)) {
          // Girar según el extremo (izquierdo gira en sentido horario, derecho anti-horario)
          const nuevaDir = esExtremoIzq
            ? girarIzquierda(extremo.dir)
            : girarDerecha(extremo.dir);
          const dirAnterior = extremo.dir;
          extremo.dir = nuevaDir;

          // Para que la ficha quede pegada al girar, debemos ajustar la posición del extremo
          // El centro de la nueva ficha debe estar alineado con el borde de la última ficha colocada
          // Una ficha normal mide 64px (2 celdas), una mula 32px (1 celda)

          // Ajuste fino para el giro: retroceder 1 celda en la dirección anterior
          // para que la nueva ficha quede pegada a la anterior
          if (dirAnterior.name === 'E') {
            // Íbamos a la derecha, ahora giramos (N o S)
            // Retroceder a la columna anterior para que quede pegada
            extremo.col = extremo.col - 1;
            if (nuevaDir.name === 'S')
              extremo.row = Math.min(extremo.row + 2, MAX_ROW);
            if (nuevaDir.name === 'N')
              extremo.row = Math.max(extremo.row - 2, MIN_ROW);
          } else if (dirAnterior.name === 'W') {
            // Íbamos a la izquierda, ahora giramos (N o S)
            extremo.col = extremo.col + 1;
            if (nuevaDir.name === 'S')
              extremo.row = Math.min(extremo.row + 2, MAX_ROW);
            if (nuevaDir.name === 'N')
              extremo.row = Math.max(extremo.row - 2, MIN_ROW);
          } else if (dirAnterior.name === 'N') {
            // Íbamos arriba, ahora giramos (E o W)
            extremo.row = extremo.row + 1;
            if (nuevaDir.name === 'E')
              extremo.col = Math.min(extremo.col + 2, MAX_COL);
            if (nuevaDir.name === 'W')
              extremo.col = Math.max(extremo.col - 2, MIN_COL);
          } else if (dirAnterior.name === 'S') {
            // Íbamos abajo, ahora giramos (E o W)
            extremo.row = extremo.row - 1;
            if (nuevaDir.name === 'E')
              extremo.col = Math.min(extremo.col + 2, MAX_COL);
            if (nuevaDir.name === 'W')
              extremo.col = Math.max(extremo.col - 2, MIN_COL);
          }
        }

        // Calcular rotación
        let rotacion: number;
        if (esMula) {
          // Mulas perpendiculares a la dirección
          rotacion =
            extremo.dir.name === 'E' || extremo.dir.name === 'W' ? 90 : 0;
        } else {
          const embonaA = ficha.valor_a === extremo.valorLibre;
          rotacion = embonaA
            ? extremo.dir.angle
            : (extremo.dir.angle + 180) % 360;
        }

        // Posicionar ficha (convertir grid a píxeles)
        const fichaPosicionada = {
          ...ficha,
          cx: extremo.col * CELL_SIZE,
          cy: extremo.row * CELL_SIZE,
          rotacion,
        };
        resultado.push(fichaPosicionada);

        // Actualizar extremo para siguiente ficha
        const nuevoValorLibre =
          ficha.valor_a === extremo.valorLibre ? ficha.valor_b : ficha.valor_a;

        // Todas las fichas ocupan 64px (2 celdas) en su dimensión horizontal
        // El centro de cada ficha está separado por 2 celdas (64px) para que queden pegadas
        const avanceCeldas = 2;

        const nuevoExtremo: GridExtremo = {
          col: extremo.col + extremo.dir.x * avanceCeldas,
          row: extremo.row + extremo.dir.y * avanceCeldas,
          dir: extremo.dir,
          valorLibre: nuevoValorLibre,
          isActivo: true,
          esMula: esMula,
        };

        if (esExtremoIzq) extremoIzq = nuevoExtremo;
        else extremoDer = nuevoExtremo;
      }
    });

    return resultado;
  }

  // ============================================
  // PIPS (PUNTOS) DE LAS FICHAS
  // ============================================
  getPips(valor: number): { x: number; y: number }[] {
    const d = 8; // Distancia desde centro

    // Posiciones relativas al centro de cada mitad de ficha
    const positions: { [key: number]: { x: number; y: number }[] } = {
      0: [],
      1: [{ x: 0, y: 0 }],
      2: [
        { x: -d, y: -d },
        { x: d, y: d },
      ],
      3: [
        { x: -d, y: -d },
        { x: 0, y: 0 },
        { x: d, y: d },
      ],
      4: [
        { x: -d, y: -d },
        { x: d, y: -d },
        { x: -d, y: d },
        { x: d, y: d },
      ],
      5: [
        { x: -d, y: -d },
        { x: d, y: -d },
        { x: 0, y: 0 },
        { x: -d, y: d },
        { x: d, y: d },
      ],
      6: [
        { x: -d, y: -d },
        { x: -d, y: 0 },
        { x: -d, y: d },
        { x: d, y: -d },
        { x: d, y: 0 },
        { x: d, y: d },
      ],
      7: [
        { x: -d, y: -d },
        { x: 0, y: -d },
        { x: d, y: -d },
        { x: 0, y: 0 },
        { x: -d, y: d },
        { x: 0, y: d },
        { x: d, y: d },
      ],
      8: [
        { x: -d, y: -d },
        { x: 0, y: -d },
        { x: d, y: -d },
        { x: -d, y: 0 },
        { x: d, y: 0 },
        { x: -d, y: d },
        { x: 0, y: d },
        { x: d, y: d },
      ],
      9: [
        { x: -d, y: -d },
        { x: 0, y: -d },
        { x: d, y: -d },
        { x: -d, y: 0 },
        { x: 0, y: 0 },
        { x: d, y: 0 },
        { x: -d, y: d },
        { x: 0, y: d },
        { x: d, y: d },
      ],
    };

    return positions[valor] || [];
  }

  trackByFicha(index: number, ficha: FichaTablero): string {
    return ficha.id;
  }

  // ============================================
  // EVENTOS DEL JUEGO
  // ============================================
  onFichaSeleccionada(event: { ficha: Ficha; lado: 'izquierda' | 'derecha' }) {
    const game = this.gameService();
    const esMula = event.ficha.valor_a === event.ficha.valor_b;
    const esPrimeraFicha = this.fichasEnMesa().length === 0;

    // Sonido de clack al jugar ficha (más fuerte si es mula)
    this.audio.playFichaClack(esMula);

    if (game) {
      game.jugarFicha(event.ficha, event.lado);
      // Solo jugar
      if (esPrimeraFicha) {
        // Primera ficha
      } else if (esMula) {
        // Es mula
      }
    } else {
      this.demoService.jugarFicha(event.ficha as any, event.lado);
      this.ultimaJugada.set({
        id: `jugada-${Date.now()}`,
        jugador: '🎬 STREAMER',
        ficha: `${event.ficha.valor_a}-${event.ficha.valor_b}`,
        lado: event.lado,
        timestamp: Date.now(),
        tipo: 'jugada',
      });
      // Solo jugar en la demo
      if (esPrimeraFicha) {
        // Primera ficha demo
      } else if (esMula) {
        // Es mula demo
      }
    }
  }

  onPasarTurno() {
    const game = this.gameService();

    // Sonido de pasar (más suave)
    this.audio.playTurno();

    if (game) {
      game.pasarTurno();
    } else {
      this.demoService.pasarTurno();
      this.ultimaJugada.set({
        id: `paso-${Date.now()}`,
        jugador: '🎬 STREAMER',
        ficha: '',
        timestamp: Date.now(),
        tipo: 'paso',
      });
    }
    // Mostrar talla cubana de pasar
    // this.toast.showPasar();
  }

  tontoInterval: any;

  empezarCooldown(segundos: number) {
    if (this.tontoInterval) clearInterval(this.tontoInterval);
    this.tallaCooldown.set(segundos);
    this.tontoInterval = setInterval(() => {
      this.tallaCooldown.update((c) => Math.max(0, c - 1));
      if (this.tallaCooldown() === 0) clearInterval(this.tontoInterval);
    }, 1000);
  }

  abrirMenuTallas() {
    this.tallasOpciones.set(this.toast.getAleatorias());
    this.tallasMenuAhi.set(!this.tallasMenuAhi());
  }

  enviarTallaPropia(talla: string) {
    if (this.tallaCooldown() > 0) return;
    this.tallasMenuAhi.set(false);

    const game = this.gameService();
    if (game) {
      game.enviarTalla(talla);
    } else {
      this.toast.showEspontaneo(`Dice 🎬 STREAMER: ${talla}`);
      this.empezarCooldown(60);
    }
  }

  toggleGrid() {
    this.mostrarGrid.update((v) => !v);
  }

  async iniciarPartida() {
    const game = this.gameService();
    if (!game) return;

    this.iniciandoPartida.set(true);
    try {
      const exito = await game.iniciarPartida();
      if (exito) {
        this.toast.showToast('¡Partida iniciada!', 'success', 3000);
        this.audio.playTurno();
      } else {
        this.toast.showToast('Error al iniciar la partida', 'error', 3000);
      }
    } catch (e) {
      console.error('Error inicializando partida:', e);
      this.toast.showToast('Error al iniciar la partida', 'error', 3000);
    } finally {
      this.iniciandoPartida.set(false);
    }
  }

  copiarCodigoSala() {
    const codigo = this.codigoSala();
    if (codigo) {
      navigator.clipboard.writeText(codigo);
      this.toast.showToast('📋 Código copiado', 'info', 2000);
    }
  }

  generarEspacios(cantidad: number): number[] {
    return Array.from({ length: cantidad }, (_, i) => i);
  }
}
