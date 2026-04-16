import { Component, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { UtilService } from '../../services/util.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- App Container -->
    <div class="w-full min-h-screen bg-twitch-black flex flex-col">
      <!-- Header Twitch Style -->
      <header class="nav-header shrink-0">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm text-twitch-text-muted">
            <span class="status-dot live"></span>
            <span>EN VIVO</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex items-center justify-center p-6">
        <div class="w-full max-w-lg animate-fade-in">
          <!-- Brand Logo -->
          <div class="flex flex-col items-center justify-center mb-8">
            <img
              src="assets/logo.svg"
              alt="La Esquina"
              class="w-40 h-40 mb-3 drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            />
            <span
              class="brand-gradient text-4xl tracking-wider font-extrabold uppercase"
              >LA ESQUINA</span
            >
          </div>

          <!-- Stats Row -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <div class="card text-center py-4">
              <p class="text-2xl font-bold text-twitch-purple">4</p>
              <p
                class="text-xs text-twitch-text-muted mt-1 uppercase tracking-wide"
              >
                Jugadores
              </p>
            </div>
            <div class="card text-center py-4">
              <p class="text-2xl font-bold text-accent-success">2</p>
              <p
                class="text-xs text-twitch-text-muted mt-1 uppercase tracking-wide"
              >
                Equipos
              </p>
            </div>
            <div class="card text-center py-4">
              <p class="text-2xl font-bold text-accent-info">200</p>
              <p
                class="text-xs text-twitch-text-muted mt-1 uppercase tracking-wide"
              >
                Puntos
              </p>
            </div>
          </div>

          <!-- Main Panel -->
          <div class="glass-panel p-6">
            <h2 class="title-md mb-6 text-center">Dominó Doble 9</h2>

            <!-- Name Input -->
            <div class="mb-5">
              <label
                class="block text-sm text-twitch-text-muted mb-2 font-medium"
              >
                Tu nombre de jugador
              </label>
              <input
                type="text"
                [(ngModel)]="nombreJugador"
                placeholder="Ej. El Master"
                maxlength="15"
                class="w-full input-twitch"
              />
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <button
                (click)="crearSala()"
                class="w-full btn-primary py-4 text-base"
              >
                Crear Sala
              </button>

              <button
                (click)="mostrarUnirse()"
                class="w-full btn-secondary py-4 text-base"
              >
                Unirse a Sala
              </button>

              <button
                (click)="goToDemo()"
                class="w-full btn-accent py-4 text-base"
              >
                Modo Demo
              </button>
            </div>
          </div>

          <!-- Footer Info -->
          <div class="mt-6 text-center">
            <p class="text-xs text-twitch-text-muted">
              Multijugador en tiempo real • Optimizado para Twitch
            </p>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal unirse -->
    <div
      *ngIf="mostraModal()"
      class="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex backdrop-blur-sm"
      (click)="cerrarModal()"
    >
      <div
        class="glass-panel w-[calc(100%-2rem)] max-w-md m-auto p-6"
        (click)="$event.stopPropagation()"
      >
        <h3 class="title-md mb-4 text-center">Unirse a Sala</h3>
        <input
          type="text"
          [(ngModel)]="codigoSala"
          placeholder="Ingresa el código de 6 caracteres"
          maxlength="6"
          class="w-full input-twitch mb-4 uppercase tracking-widest text-center"
        />
        <div class="flex gap-3">
          <button (click)="cerrarModal()" class="flex-1 btn-secondary py-3">
            Cancelar
          </button>
          <button (click)="unirseASala()" class="flex-1 btn-primary py-3">
            Unirse
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Sala de Espera -->
    <div
      *ngIf="mostraSalaEspera()"
      class="fixed inset-0 bg-black/95 z-50 overflow-y-auto flex backdrop-blur-sm"
    >
      <div
        class="glass-panel-purple w-[calc(100%-2rem)] max-w-lg m-auto p-8 my-8"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="title-lg">Sala de Espera</h2>
          <div class="flex items-center gap-2">
            <span class="status-dot online"></span>
            <span class="text-sm text-twitch-text-muted"
              >{{ jugadores().length }}/4</span
            >
          </div>
        </div>

        <!-- Código -->
        <div
          class="bg-twitch-darker border border-twitch-gray rounded-lg p-4 mb-6"
        >
          <p class="text-xs text-twitch-text-muted uppercase mb-2">
            Código de sala
          </p>
          <div class="flex items-center justify-between">
            <span class="text-4xl font-bold text-twitch-purple tracking-widest">
              {{ codigoSalaEspera() }}
            </span>
            <button
              (click)="copiarCodigoSala()"
              class="btn-secondary px-4 py-2 text-sm"
            >
              Copiar
            </button>
          </div>
        </div>

        <!-- Jugadores -->
        <div class="space-y-2 mb-6">
          <p class="text-xs text-twitch-text-muted uppercase mb-3">
            Jugadores conectados
          </p>
          <div
            *ngFor="let j of jugadores()"
            class="flex items-center justify-between p-3 bg-twitch-darker rounded-lg border border-twitch-gray"
          >
            <div class="flex items-center gap-3">
              <span class="status-dot online"></span>
              <span class="font-medium">{{ j.nombre }}</span>
            </div>
            <span class="text-xs text-twitch-text-muted"
              >Pos {{ j.posicion + 1 }}</span
            >
          </div>
          <div
            *ngFor="let i of generarEspacios(4 - jugadores().length)"
            class="p-3 bg-twitch-dark rounded-lg border border-dashed border-twitch-gray text-twitch-text-muted text-center text-sm"
          >
            Esperando...
          </div>
        </div>

        <!-- Iniciar -->
        <div *ngIf="jugadores().length === 4">
          <button
            *ngIf="puedeIniciar()"
            (click)="iniciarPartida()"
            [disabled]="iniciandoPartida()"
            class="w-full btn-success py-4 text-lg font-bold disabled:opacity-50"
          >
            {{ iniciandoPartida() ? 'Iniciando...' : 'Iniciar Partida' }}
          </button>
          <p
            *ngIf="!puedeIniciar()"
            class="text-center text-twitch-purple text-sm"
          >
            Esperando al anfitrión...
          </p>
        </div>

        <button
          (click)="salirSala()"
          class="mt-4 w-full text-twitch-text-muted hover:text-white text-sm transition-colors"
        >
          Salir de la sala
        </button>
      </div>
    </div>

    <style>
      @keyframes gradient {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
    </style>
  `,
})
export class LobbyComponent {
  mostraModal = signal(false);
  cargando = signal(false);
  nombreJugador = '';
  codigoSala = '';

  // Nuevo estado para la Sala de ESPERA en el Lobby
  mostraSalaEspera = signal(false);
  iniciandoPartida = signal(false);
  partidaId = signal('');

  // Computados al GameService
  jugadores = computed(() => this.gameService.jugadores());
  puedeIniciar = computed(() => this.gameService.miJugador()?.posicion === 0);
  codigoSalaEspera = computed(
    () => this.gameService.partida()?.codigo_sala || '',
  );

  // Cargar nombre guardado
  constructor(
    private router: Router,
    public gameService: GameService,
    private util: UtilService,
    private toast: ToastService,
  ) {
    this.nombreJugador = this.util.obtenerConfig().nombreJugador || 'Streamer';

    // Auto-Redirección cuando el Host inicie el juego
    effect(
      () => {
        const p = this.gameService.partida();
        // Si la sala de espera está abierta y el estado pasa a 'en_curso', es que ya inició!
        if (p && p.estado === 'en_curso' && this.mostraSalaEspera()) {
          this.mostraSalaEspera.set(false);
          this.toast.showToast('🔥 ¡La partida ha comenzado!', 'success', 2000);
          this.router.navigate([`/partida/${p.id}`]);
        }
      },
      { allowSignalWrites: true },
    );
  }

  // Navegar a modo demo
  goToDemo() {
    this.router.navigate(['/partida/DEMO01']);
  }

  // Crear nueva sala de juego
  async crearSala() {
    console.log('[crearSala] Botón clickeado');
    console.log('[crearSala] GameService:', this.gameService);
    console.log('[crearSala] Nombre jugador:', this.nombreJugador);

    // Validar nombre
    if (!this.util.esNombreValido(this.nombreJugador)) {
      console.log('[crearSala] Nombre inválido');
      this.toast.showToast(
        'Nombre inválido (2-30 caracteres, solo letras/números)',
        'error',
        3000,
      );
      return;
    }

    console.log('[crearSala] Nombre válido, procediendo...');

    // Guardar nombre en config
    this.util.guardarConfig({
      nombreJugador: this.nombreJugador,
      modoSonido: true,
    });

    this.cargando.set(true);
    try {
      console.log('[crearSala] Llamando a gameService.crearSala...');
      const partidaId = await this.gameService.crearSala(this.nombreJugador);
      console.log('[crearSala] Respuesta:', partidaId);

      if (partidaId) {
        this.toast.showToast('🎉 ¡Sala creada!', 'success', 2000);

        // Iniciar la escucha en vivo del GameService en vez de Navegar al Tablero
        await this.gameService.setCurrentGame(partidaId);
        this.partidaId.set(partidaId);
        this.mostraSalaEspera.set(true);
      } else {
        console.log('[crearSala] No se recibió partidaId');
        this.toast.showToast('Error: No se pudo crear la sala', 'error', 3000);
      }
    } catch (error) {
      console.error('[crearSala] Error:', error);
      this.toast.showToast(
        'Error creando sala. Intenta nuevamente.',
        'error',
        3000,
      );
    } finally {
      this.cargando.set(false);
    }
  }

  // Mostrar modal para unirse
  mostrarUnirse() {
    this.mostraModal.set(true);
  }

  // Cerrar modal
  cerrarModal() {
    this.mostraModal.set(false);
    this.codigoSala = '';
  }

  // Unirse a una sala existente
  async unirseASala() {
    // Validar código
    if (!this.util.esCodigoValido(this.codigoSala)) {
      this.toast.showToast(
        'Código inválido. Debe ser 6 caracteres.',
        'error',
        3000,
      );
      return;
    }

    // Validar nombre
    if (!this.util.esNombreValido(this.nombreJugador)) {
      this.toast.showToast(
        'Nombre inválido (2-30 caracteres, solo letras/números)',
        'error',
        3000,
      );
      return;
    }

    this.cargando.set(true);
    try {
      const partidaId = await this.gameService.unirseASala(
        this.codigoSala,
        this.nombreJugador,
      );

      if (partidaId) {
        this.toast.showToast('✅ ¡Te uniste a la sala!', 'success', 2000);
        this.cerrarModal();

        // Iniciar la escucha en vivo del GameService en vez de Navegar al Tablero
        await this.gameService.setCurrentGame(partidaId);
        this.partidaId.set(partidaId);
        this.mostraSalaEspera.set(true);
      }
    } catch (error) {
      this.toast.showToast(
        'Error uniéndose a sala. Verifica el código.',
        'error',
        3000,
      );
      console.error(error);
    } finally {
      this.cargando.set(false);
    }
  }

  generarEspacios(cantidad: number): number[] {
    return Array.from({ length: cantidad }, (_, i) => i);
  }

  copiarCodigoSala() {
    const codigo = this.codigoSalaEspera();
    if (codigo) {
      navigator.clipboard.writeText(codigo);
      this.toast.showToast('📋 Código copiado', 'info', 2000);
    }
  }

  async iniciarPartida() {
    this.iniciandoPartida.set(true);
    try {
      const exito = await this.gameService.iniciarPartida();
      if (!exito) {
        this.toast.showToast('Error al iniciar la partida', 'error', 3000);
      }
      // Nota: Si tiene éxito, el effect() definido en el constructor será el encargado
      // de navegar a /partida/:id porque el estado en Supabase será "en_curso".
    } catch (e) {
      console.error('Error inicializando partida:', e);
      this.toast.showToast('Error al iniciar la partida', 'error', 3000);
    } finally {
      this.iniciandoPartida.set(false);
    }
  }

  salirSala() {
    this.mostraSalaEspera.set(false);
    this.partidaId.set('');
  }
}
