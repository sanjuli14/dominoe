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
    <!-- Fondo animado con gradiente -->
    <div
      class="w-screen h-screen overflow-hidden relative"
      style="background: linear-gradient(-45deg, #030011, #0d0221, #1a0033, #0d0221);
              background-size: 400% 400%;
              animation: gradient 15s ease infinite;"
    >
      <!-- Elementos decorativos de fondo -->
      <div
        class="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full"
      ></div>

      <!-- Contenedor principal -->
      <div
        class="relative w-full h-full flex flex-col items-center justify-center px-4"
      >
        <!-- Logo y título -->
        <div class="text-center mb-12 animate-slide-up">
          <h1 class="title-xl mb-4">🎲 LA ESQUINA 🎲</h1>
          <p class="subtitle-lg text-gray-300">
            <span
              class="inline-block px-4 py-2 rounded-lg bg-purple-900/30 border border-purple-500/50"
            >
              DOMINÓ DOBLE 9 - MODO MULTIPLAYER
            </span>
          </p>
        </div>

        <!-- Tarjeta principal -->
        <div
          class="glass-panel w-full max-w-2xl px-8 py-12 animate-bounce-in"
          style="border: 2px solid rgba(0, 245, 255, 0.3);"
        >
          <!-- Información de juego -->
          <div class="grid grid-cols-3 gap-4 mb-10">
            <div
              class="text-center p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
            >
              <p class="text-2xl font-bold text-cyan-400">4</p>
              <p class="text-xs text-gray-400 mt-1">JUGADORES</p>
            </div>
            <div
              class="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/30"
            >
              <p class="text-2xl font-bold text-purple-400">2</p>
              <p class="text-xs text-gray-400 mt-1">EQUIPOS</p>
            </div>
            <div
              class="text-center p-4 rounded-lg bg-lime-500/10 border border-lime-500/30"
            >
              <p class="text-2xl font-bold text-lime-400">200</p>
              <p class="text-xs text-gray-400 mt-1">PUNTOS 🏆</p>
            </div>
          </div>

          <!-- Nombre del Jugador -->
          <div class="mb-6">
            <label class="block text-sm text-gray-400 mb-2 font-semibold"
              >TÚ NOMBRE</label
            >
            <input
              type="text"
              [(ngModel)]="nombreJugador"
              placeholder="Ej. El Master"
              maxlength="15"
              class="w-full px-4 py-3 bg-gray-800 text-white border border-purple-500/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-bold tracking-wide"
            />
          </div>

          <!-- Botones principales -->
          <div class="space-y-4">
            <!-- Crear sala -->
            <button
              (click)="crearSala()"
              class="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                     text-white font-bold rounded-lg gaming-title
                     transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                     border border-cyan-400/50 shadow-lg
                     uppercase tracking-wider"
            >
              ➕ CREAR SALA
            </button>

            <!-- Unirse a sala -->
            <button
              (click)="mostrarUnirse()"
              class="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                     text-white font-bold rounded-lg gaming-title
                     transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                     border border-purple-400/50 shadow-lg
                     uppercase tracking-wider"
            >
              🔑 UNIRSE A SALA
            </button>

            <!-- Modo demo -->
            <button
              (click)="goToDemo()"
              class="w-full py-4 px-6 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-400 hover:to-green-500
                     text-white font-bold rounded-lg gaming-title
                     transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                     border border-lime-400/50 shadow-lg
                     uppercase tracking-wider"
            >
              ⚡ MODO DEMO
            </button>
          </div>

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-purple-500/30 text-center">
            <p class="text-xs text-gray-500">v1.0 • Desarrollado para Twitch</p>
            <p class="text-xs text-gray-500 mt-1">
              🎯 Juego de Dominó Cubano Tradicional
            </p>
          </div>
        </div>

        <!-- Info abajo -->
        <div class="mt-12 text-center max-w-2xl">
          <div class="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div
              class="p-3 rounded-lg bg-purple-900/20 border border-purple-500/30"
            >
              <p class="font-semibold text-cyan-400">🎮 MULTIJUGADOR</p>
              <p class="text-xs mt-1">Juega con 4 personas en tiempo real</p>
            </div>
            <div
              class="p-3 rounded-lg bg-purple-900/20 border border-purple-500/30"
            >
              <p class="font-semibold text-lime-400">🔴 EN VIVO</p>
              <p class="text-xs mt-1">Perfectamente optimizado para Twitch</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para unirse -->
    <div
      *ngIf="mostraModal()"
      class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm"
      (click)="cerrarModal()"
    >
      <div
        class="glass-panel max-w-md w-full mx-4 p-8 rounded-2xl border border-purple-500/50 shadow-2xl relative"
        (click)="$event.stopPropagation()"
      >
        <h3 class="title-lg mb-4 text-center">Unirse a Sala</h3>
        <input
          type="text"
          [(ngModel)]="codigoSala"
          placeholder="Ingrese el código de sala"
          maxlength="6"
          class="w-full px-4 py-2 bg-gray-800 text-white border border-purple-500/50 rounded-lg
                 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400
                 mb-4 gaming-subtitle uppercase tracking-wider"
        />
        <div class="flex gap-4">
          <button
            (click)="cerrarModal()"
            class="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg
                   transition-all duration-300"
          >
            Cancelar
          </button>
          <button
            (click)="unirseASala()"
            class="flex-1 py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600
                   hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg
                   transition-all duration-300"
          >
            Unirse
          </button>
        </div>
      </div>
    </div>

    <!-- Modal PANTALLA DE ESPERA (LOBBY) -->
    <div
      *ngIf="mostraSalaEspera()"
      class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm"
    >
      <div
        class="glass-panel p-12 rounded-3xl border border-cyan-400/30 max-w-lg shadow-2xl text-center relative w-full mx-4"
      >
        <h1 class="gaming-title text-4xl text-cyan-400 mb-6">SALA DE ESPERA</h1>
        <p class="text-white text-lg mb-8">
          Esperando a que se unan los jugadores
        </p>

        <!-- Código de sala -->
        <div
          class="p-4 bg-cyan-900/20 rounded-xl border border-cyan-500/50 mb-6 relative"
        >
          <p
            class="text-gray-400 text-sm mb-2 uppercase font-bold tracking-widest"
          >
            Código de Invitar:
          </p>
          <div class="flex items-center justify-center gap-4">
            <span
              class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-widest"
            >
              {{ codigoSalaEspera() }}
            </span>
            <button
              (click)="copiarCodigoSala()"
              class="p-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 rounded-lg transition-all"
              title="Copiar código"
            >
              📋
            </button>
          </div>
        </div>

        <!-- Jugadores conectados -->
        <div
          class="bg-gray-800/50 p-6 rounded-xl border border-gray-600/50 mb-6"
        >
          <p
            class="text-cyan-400 font-bold uppercase tracking-widest text-sm mb-4"
          >
            JUGADORES CONECTADOS: {{ jugadores().length }}/4
          </p>
          <div class="space-y-2">
            <div
              *ngFor="let j of jugadores()"
              class="p-3 bg-cyan-400/10 rounded-lg border border-cyan-400/30 text-white"
            >
              <p class="font-bold text-lg">{{ j.nombre }}</p>
              <p class="text-xs text-gray-400 uppercase">
                Posición {{ j.posicion + 1 }}
              </p>
            </div>
            <div
              *ngFor="let i of generarEspacios(4 - jugadores().length)"
              class="p-3 bg-gray-800/80 rounded-lg border border-dashed border-gray-600 text-gray-500 text-center uppercase text-sm font-bold"
            >
              Esperando Jugador...
            </div>
          </div>
        </div>

        <!-- Botón para iniciar (solo si hay 4 jugadores y es Host) -->
        <div *ngIf="jugadores().length === 4">
          <button
            *ngIf="puedeIniciar()"
            (click)="iniciarPartida()"
            [disabled]="iniciandoPartida()"
            class="w-full px-6 py-4 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold rounded-lg hover:scale-105 transition-all text-xl disabled:opacity-50 uppercase tracking-widest shadow-xl shadow-cyan-500/20 border border-cyan-300/50"
          >
            {{ iniciandoPartida() ? 'Iniciando...' : '¡Empezar Partida!' }}
          </button>
          <p
            *ngIf="!puedeIniciar()"
            class="text-cyan-400 font-bold uppercase text-sm mt-4 animate-pulse"
          >
            El Anfitrión debe iniciar la partida
          </p>
        </div>

        <button
          (click)="salirSala()"
          class="mt-6 text-gray-400 hover:text-red-400 text-sm font-bold uppercase transition-colors underline"
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
