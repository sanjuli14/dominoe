import {
  Component,
  OnInit,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
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
import gsap from 'gsap';

interface FichaEnTablero extends FichaEnMesa {
  x: number;
  y: number;
  rotacion: number;
}

@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [
    CommonModule,
    FichaComponent,
    ManoComponent,
    MarcadorComponent,
    ToastContainerComponent,
    HistorialComponent,
  ],
  template: `
    <div class="felt-table w-screen h-screen relative overflow-hidden">
      <!-- Fondo de mesa -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-wood-900 via-felt-800 to-ebony"
        style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%231a1410%22 width=%22100%22 height=%22100%22/><circle cx=%2250%22 cy=%2250%22 r=%227%22 fill=%22%23221108%22 opacity=%220.5%22/></svg>');"
      ></div>

      <!-- PANTALLA DE ESPERA DE JUGADORES -->
      <div
        *ngIf="esperandoJugadores()"
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
      >
        <div
          class="glass-panel p-12 rounded-3xl border border-gold/30 max-w-lg shadow-2xl text-center"
        >
          <h1 class="gaming-title text-5xl text-gold mb-6">🎲 ESPERANDO...</h1>
          <p class="text-ivory text-lg mb-8">
            Esperando a que se unan jugadores
          </p>

          <!-- Spinner de carga -->
          <div class="mb-10 flex justify-center">
            <div class="animate-spin">
              <div
                class="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full"
              ></div>
            </div>
          </div>

          <!-- Jugadores conectados -->
          <div class="bg-felt-700 p-6 rounded-xl border border-gold/20 mb-6">
            <p class="text-gold gaming-subtitle text-sm mb-4">
              JUGADORES CONECTADOS: {{ jugadores().length }}/4
            </p>
            <div class="space-y-2">
              <div
                *ngFor="let j of jugadores()"
                class="p-3 bg-gold/10 rounded-lg border border-gold/30 text-ivory"
              >
                <p class="gaming-subtitle">{{ j.nombre }}</p>
                <p class="text-xs text-ivory/60">
                  Posición {{ j.posicion }} - Equipo {{ j.equipo }}
                </p>
              </div>
              <div
                *ngFor="let i of generarEspacios(4 - jugadores().length)"
                class="p-3 bg-felt-600 rounded-lg border border-dashed border-ivory/20 text-ivory/40 text-center"
              >
                <p class="gaming-subtitle">Esperando jugador...</p>
              </div>
            </div>
          </div>

          <!-- Código de sala -->
          <div class="p-4 bg-gold/20 rounded-xl border border-gold/50 mb-6">
            <p class="text-ivory/70 text-sm mb-2">Código de sala:</p>
            <p class="gaming-title text-3xl text-gold mb-3">
              {{ codigoSala() }}
            </p>
            <button
              (click)="copiarCodigoSala()"
              class="w-full px-4 py-2 bg-gold/30 hover:bg-gold/40 border border-gold text-ivory rounded-lg gaming-subtitle text-sm transition-all"
            >
              📋 COPIAR CÓDIGO
            </button>
          </div>

          <!-- Botón para iniciar (solo si hay 4 jugadores) -->
          <button
            *ngIf="jugadores().length === 4 && puedeIniciar()"
            (click)="iniciarPartida()"
            [disabled]="iniciandoPartida()"
            class="w-full px-6 py-4 bg-gradient-to-r from-gold to-copper text-ebony font-bold rounded-lg
                   hover:scale-105 transition-all gaming-title text-lg disabled:opacity-50"
          >
            {{ iniciandoPartida() ? 'INICIANDO...' : '¡EMPEZAR PARTIDA!' }}
          </button>

          <!-- Info -->
          <p class="text-ivory/50 text-xs mt-6">
            Todos deben estar conectados para poder empezar
          </p>
        </div>
      </div>

      <!-- Contenedor del tablero (felt) -->
      <div
        #boardContainer
        class="absolute inset-8 felt-table rounded-3xl border-8 border-copper overflow-hidden shadow-2xl flex items-center justify-center"
      >
        <!-- Grid invisible para serpiente -->
        <svg
          *ngIf="mostrarGrid()"
          class="absolute inset-0 w-full h-full"
          style="background: transparent; pointer-events: none"
        >
          <!-- Lineas horizontales -->
          <line
            *ngFor="let i of generarGrid()"
            [attr.x1]="0"
            [attr.y1]="i * 60"
            [attr.x2]="'100%'"
            [attr.y2]="i * 60"
            stroke="rgba(236, 200, 154, 0.1)"
            stroke-width="1"
          />
          <!-- Lineas verticales -->
          <line
            *ngFor="let i of generarGrid()"
            [attr.x1]="i * 60"
            [attr.y1]="0"
            [attr.x2]="i * 60"
            [attr.y2]="'100%'"
            stroke="rgba(236, 200, 154, 0.1)"
            stroke-width="1"
          />
        </svg>

        <!-- Fichas en mesa -->
        <div class="absolute inset-0 w-full h-full">
          <div
            *ngFor="let ficha of fichasTablero()"
            #fichaElements
            class="absolute w-24 h-12 pointer-events-auto"
            [style.left.px]="ficha.x"
            [style.top.px]="ficha.y"
            [style.transform]="'rotate(' + ficha.rotacion + 'deg)'"
          >
            <app-ficha
              [valor_a]="ficha.valor_a"
              [valor_b]="ficha.valor_b"
              [id]="ficha.id"
            ></app-ficha>
          </div>
        </div>

        <!-- Placeholders para extremos -->
        <div
          *ngIf="extremosActuales().izq !== null"
          class="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2"
        >
          <div class="text-ivory/30 text-2xl gaming-subtitle">
            IZQUIERDA: {{ extremosActuales().izq }}
          </div>
        </div>
        <div
          *ngIf="extremosActuales().der !== null"
          class="absolute top-1/2 right-1/4 translate-y-1/2 translate-x-1/2"
        >
          <div class="text-ivory/30 text-2xl gaming-subtitle">
            DERECHA: {{ extremosActuales().der }}
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
      <app-historial [agregarJugada]="ultimaJugada()"></app-historial>

      <!-- Botón de debug -->
      <button
        *ngIf="debug()"
        (click)="toggleGrid()"
        class="fixed bottom-40 right-4 px-4 py-2 bg-gold/20 border border-gold text-gold rounded-lg z-50 text-xs font-mono hover:bg-gold/30"
      >
        GRID {{ mostrarGrid() ? 'ON' : 'OFF' }}
      </button>
    </div>
  `,
})
export class TableroComponent implements OnInit {
  private realGameService = inject(GameService);
  private gameService = signal<GameService | null>(null);
  debug = signal(false);
  mostrarGrid = signal(false);

  // Propiedades locales
  jugadores = signal<Jugador[]>([]);
  misFichas = signal<Ficha[]>([]);
  fichasEnMesa = signal<FichaEnMesa[]>([]);
  manoActual = signal(1);
  esmiTurno = signal(false);
  extremosActuales = signal({
    izq: null as number | null,
    der: null as number | null,
  });
  puntuacion = signal({ eq0: 0, eq1: 0 });
  turnoActualPosicion = signal(0);
  miEquipo = signal(0);
  ultimaJugada = signal<JugadaHistorico | null>(null);

  // Propiedades para espera
  esperandoJugadores = signal(false);
  codigoSala = computed(
    () => this.gameService()?.partida?.()?.codigo_sala || '',
  );
  iniciandoPartida = signal(false);
  puedeIniciar = signal(false);

  // Computed
  fichasTablero = computed(() => {
    return this.fichasEnMesa().map((f) => ({
      ...f,
      x: this.calculateFichaX(f.orden_jugada),
      y: this.calculateFichaY(f.orden_jugada),
      rotacion: this.calculateRotacion(f),
    }));
  });

  constructor(
    private route: ActivatedRoute,
    private toast: ToastService,
    private audio: AudioService,
    private demoService: EnhancedDemoService,
  ) {
    this.playAmbientSound();
  }

  ngOnInit() {
    this.route.params.subscribe(async (params) => {
      const gameId = params['id'];

      // Detectar si es modo demo
      const isDemo = gameId?.includes('DEMO') || gameId?.includes('demo');

      if (isDemo) {
        // Modo demo mejorado
        this.demoService.inicializarDemo('manual');

        // Sincronizar señales
        effect(() => {
          this.jugadores.set(
            this.demoService.jugadores() as unknown as Jugador[],
          );
          this.misFichas.set(
            this.demoService.fichasEnMano() as unknown as Ficha[],
          );
          this.fichasEnMesa.set(
            this.demoService.fichasEnMesa() as unknown as FichaEnMesa[],
          );
          this.esmiTurno.set(this.demoService.esmiTurno());
          this.extremosActuales.set(this.demoService.extremosActuales() as any);
          this.puntuacion.set(this.demoService.puntuacion());
          this.turnoActualPosicion.set(this.demoService.turnoActual());
          this.miEquipo.set(this.demoService.miJugador()?.equipo || 0);
        });

        // Suscribirse a eventos del demo
        this.demoService.fichaJugada$.subscribe(({ jugador, ficha }) => {
          // No agreguar si es STREAMER (ya se agregó en onFichaSeleccionada)
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

        this.demoService.turnoChanged$.subscribe(({ jugador }) => {
          if (jugador.includes('STREAMER')) {
            this.toast.showToast('¡ES TU TURNO!', 'info', 2000);
            this.audio.playTurno();
          } else {
            this.toast.showToast(`Turno de ${jugador}`, 'info', 1500);
          }
        });

        this.demoService.manoTerminada$.subscribe(({ ganador, puntos }) => {
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
        // Modo normal con GameService
        const game = this.realGameService;
        this.gameService.set(game);

        // Guardar el código de sala

        await game.setCurrentGame(gameId);

        // Sincronizar señales
        effect(() => {
          this.jugadores.set(game.jugadores());
          this.misFichas.set(game.fichasEnMano());
          this.fichasEnMesa.set(game.fichasEnMesa());
          this.manoActual.set(game.partida()?.mano_actual || 1);
          this.esmiTurno.set(game.esmiTurno());
          this.extremosActuales.set(game.extremosActuales());
          this.puntuacion.set(game.puntuacion());
          this.turnoActualPosicion.set(game.manoActual()?.turno_actual || 0);
          this.miEquipo.set(game.miJugador()?.equipo || 0);

          // Verificar si estamos esperando jugadores
          const partida = game.partida();
          if (partida) {
            this.esperandoJugadores.set(partida.estado === 'esperando');
            this.puedeIniciar.set(
              partida.estado === 'esperando' && this.jugadores().length === 4,
            );
          }
        });

        // Suscribirse a mensajes
        game.toastMessage$.subscribe((msg) => {
          this.toast.showToast(msg, 'success', 3000);
          this.audio.playFichaClack();
        });

        game.errorMessage$.subscribe((msg) => {
          this.toast.showToast(msg, 'error', 3000);
          this.audio.playError();
        });
      }
    });
  }

  onFichaSeleccionada(event: { ficha: Ficha; lado: 'izquierda' | 'derecha' }) {
    const game = this.gameService();

    if (game) {
      game.jugarFicha(event.ficha, event.lado);
      this.toast.showCubano();
    } else {
      // Modo demo
      this.demoService.jugarFicha(event.ficha as any, event.lado);

      // Agregar al historial
      this.ultimaJugada.set({
        id: `jugada-${Date.now()}`,
        jugador: '🎬 STREAMER',
        ficha: `${event.ficha.valor_a}-${event.ficha.valor_b}`,
        lado: event.lado,
        timestamp: Date.now(),
        tipo: 'jugada',
      });
    }
  }

  onPasarTurno() {
    const game = this.gameService();

    if (game) {
      game.pasarTurno();
    } else {
      // Modo demo
      this.demoService.pasarTurno();

      // Agregar al historial
      this.ultimaJugada.set({
        id: `paso-${Date.now()}`,
        jugador: '🎬 STREAMER',
        ficha: '',
        timestamp: Date.now(),
        tipo: 'paso',
      });
    }

    this.toast.showCubano();
  }

  private calculateFichaX(orden: number): number {
    const cellSize = 60;
    const containerWidth = 800;
    const startX = 100;

    let x = orden * cellSize;
    if (x > containerWidth) {
      x = x % containerWidth || containerWidth;
    }
    return startX + x;
  }

  private calculateFichaY(orden: number): number {
    const cellSize = 60;
    const containerWidth = 800;
    const startY = 100;

    let totalX = orden * cellSize;
    const rows = Math.floor(totalX / containerWidth);
    return startY + rows * cellSize;
  }

  private calculateRotacion(ficha: FichaEnMesa): number {
    // Mulas (dobles) se rotan 90 grados
    if (ficha.valor_a === ficha.valor_b) {
      return 90;
    }
    // Fichas normales están horizontales
    return 0;
  }

  generarGrid(): number[] {
    return Array.from({ length: 15 }, (_, i) => i);
  }

  generarEspacios(cantidad: number): number[] {
    return Array.from({ length: cantidad }, (_, i) => i);
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
        this.esperandoJugadores.set(false);
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

  private playAmbientSound() {
    // Sonido ambiental del tablero (opcional)
    // Esto podría ser un sonido suave de fondo
  }
}
