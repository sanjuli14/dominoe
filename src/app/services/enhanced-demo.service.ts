import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Enhanced Demo Service para streams de Twitch
 * Proporciona un juego completamente jugable sin Supabase
 *
 * MODOS:
 * - 'auto': Bots juegan automáticamente (espectáculo)
 * - 'manual': Streamer juega manualmente con Equipo 1
 * - 'test': Modo de desarrollo
 */

export interface Ficha {
  id: string;
  valor_a: number;
  valor_b: number;
  en_juego: boolean;
}

export interface FichaEnMesa extends Ficha {
  orden: number;
  lado_jugado: 'a' | 'b';
}

export interface Jugador {
  id: string;
  nombre: string;
  posicion: 0 | 1 | 2 | 3;
  equipo: 0 | 1;
  fichas_mano: Ficha[];
}

export interface Partida {
  id: string;
  estado: 'lobby' | 'activa' | 'finalizada';
  tiene_salida: boolean;
  turno_posicion: 0 | 1 | 2 | 3;
  puntos_equipo_0: number;
  puntos_equipo_1: number;
  mano_numero: number;
}

@Injectable({
  providedIn: 'root',
})
export class EnhancedDemoService {
  // Signals
  partida = signal<Partida>({
    id: 'demo-001',
    estado: 'activa',
    tiene_salida: false,
    turno_posicion: 0,
    puntos_equipo_0: 0,
    puntos_equipo_1: 0,
    mano_numero: 1,
  });

  jugadores = signal<Jugador[]>([]);
  fichasEnMesa = signal<FichaEnMesa[]>([]);
  fichasEnMano = signal<Ficha[]>([]);
  manoActual = signal<number>(0);
  turnoActual = signal<number>(0);
  modoDemonstración = 'auto'; // 'auto' | 'manual'

  // Computed
  miJugador = computed(() => {
    const jugadores = this.jugadores();
    return jugadores.find((j) => j.posicion === 0);
  });

  esmiTurno = computed(() => {
    return this.turnoActual() === 0;
  });

  puntuacion = computed(() => {
    const p = this.partida();
    return {
      eq0: p.puntos_equipo_0,
      eq1: p.puntos_equipo_1,
    };
  });

  extremosActuales = computed(() => {
    const fichas = this.fichasEnMesa();
    if (fichas.length === 0) return { izq: null, der: null };

    const primera = fichas[0];
    const ultima = fichas[fichas.length - 1];

    const izq = primera.lado_jugado === 'a' ? primera.valor_a : primera.valor_b;

    const der = ultima.lado_jugado === 'a' ? ultima.valor_b : ultima.valor_a;

    return { izq, der };
  });

  // Observables para notificaciones
  fichaJugada$ = new Subject<{ jugador: string; ficha: string }>();
  turnoChanged$ = new Subject<{ jugador: string; posicion: number }>();
  manoTerminada$ = new Subject<{ ganador: string; puntos: number }>();

  constructor() {
    this.inicializarDemo();
  }

  // ==================== INICIALIZACIÓN ====================

  inicializarDemo(modo: 'auto' | 'manual' = 'manual') {
    this.modoDemonstración = modo;

    // Crear fichas del dominó (0-9)
    const todasLasFichas = this.generarFichas();

    // Repartir fichas: 7 a cada jugador
    const fichasJugador0 = todasLasFichas.splice(0, 7);
    const fichasJugador1 = todasLasFichas.splice(0, 7);
    const fichasJugador2 = todasLasFichas.splice(0, 7);
    const fichasJugador3 = todasLasFichas.splice(0, 7);

    // Fichas restantes en mesa (no se usan en demo)
    // const fichasEnStock = todasLasFichas;

    // Crear jugadores
    const nuevoJugadores: Jugador[] = [
      {
        id: 'j1',
        nombre: '🎬 STREAMER (Tú)',
        posicion: 0,
        equipo: 0,
        fichas_mano: fichasJugador0,
      },
      {
        id: 'j2',
        nombre: '🤖 Bot Jaime',
        posicion: 1,
        equipo: 1,
        fichas_mano: fichasJugador1,
      },
      {
        id: 'j3',
        nombre: '🤖 Bot María',
        posicion: 2,
        equipo: 0,
        fichas_mano: fichasJugador2,
      },
      {
        id: 'j4',
        nombre: '🤖 Bot Carlos',
        posicion: 3,
        equipo: 1,
        fichas_mano: fichasJugador3,
      },
    ];

    this.jugadores.set(nuevoJugadores);
    this.fichasEnMano.set(fichasJugador0); // Lo que ve el streamer
    this.turnoActual.set(0);

    // Sacar primera ficha (salida)
    this.realizarSalida();

    // Si es modo auto, empezar bot automáticamente
    if (modo === 'auto') {
      this.iniciarJuegoAutomático();
    }
  }

  // ==================== LÓGICA DEL JUEGO ====================

  private realizarSalida() {
    // En modo demo, Streamer sale primero (siempre)
    const fichasStreamer = this.miJugador()?.fichas_mano || [];

    if (fichasStreamer.length > 0) {
      const fichaInicial = fichasStreamer[0]; // Primera ficha
      const nuevaEnMesa: FichaEnMesa = {
        ...fichaInicial,
        orden: 0,
        lado_jugado: 'a',
      };

      this.fichasEnMesa.set([nuevaEnMesa]);

      // Actualizar estado
      const p = this.partida();
      this.partida.set({ ...p, tiene_salida: true });

      this.fichaJugada$.next({
        jugador: '🎬 STREAMER',
        ficha: `${fichaInicial.valor_a}-${fichaInicial.valor_b}`,
      });

      // Siguiente turno
      this.avanzarTurno();
    }
  }

  jugarFicha(ficha: Ficha, lado: 'izquierda' | 'derecha') {
    if (!this.esmiTurno()) {
      console.warn('No es tu turno');
      return;
    }

    if (!this.canPlayFicha(ficha)) {
      console.warn('No puedes jugar esa ficha');
      return;
    }

    const extremos = this.extremosActuales();
    const fichasEnMesa = this.fichasEnMesa();

    let ladoJugado: 'a' | 'b';
    if (lado === 'izquierda') {
      ladoJugado = ficha.valor_b === extremos.izq ? 'a' : 'b';
    } else {
      ladoJugado = ficha.valor_a === extremos.der ? 'a' : 'b';
    }

    const nuevaEnMesa: FichaEnMesa = {
      ...ficha,
      en_juego: true,
      orden: fichasEnMesa.length,
      lado_jugado: ladoJugado,
    };

    // Agregar a mesa
    if (lado === 'izquierda') {
      this.fichasEnMesa.set([nuevaEnMesa, ...fichasEnMesa]);
    } else {
      this.fichasEnMesa.set([...fichasEnMesa, nuevaEnMesa]);
    }

    // Remover de mano del jugador
    const miMano = this.fichasEnMano();
    const indexFicha = miMano.findIndex((f) => f.id === ficha.id);
    if (indexFicha > -1) {
      miMano.splice(indexFicha, 1);
      this.fichasEnMano.set([...miMano]);
    }

    // Notificación
    this.fichaJugada$.next({
      jugador: '🎬 STREAMER',
      ficha: `${ficha.valor_a}-${ficha.valor_b}`,
    });

    // Verificar si ganó (mano limpia)
    if (miMano.length === 0) {
      this.finalizarMano(0);
      return;
    }

    // Siguiente turno
    this.avanzarTurno();

    // Si es modo auto, siguiente juega automáticamente
    if (this.modoDemonstración === 'auto') {
      setTimeout(() => this.botJuega(), 1500);
    }
  }

  pasarTurno() {
    if (!this.esmiTurno()) return;

    this.fichaJugada$.next({
      jugador: '🎬 STREAMER',
      ficha: 'PASÓ',
    });

    this.avanzarTurno();

    if (this.modoDemonstración === 'auto') {
      setTimeout(() => this.botJuega(), 1500);
    }
  }

  private botJuega() {
    const turno = this.turnoActual();
    const jugador = this.jugadores()[turno];

    if (!jugador) return;

    const fichas = jugador.fichas_mano;
    const extremos = this.extremosActuales();

    // Buscar ficha válida
    let fictaValida: { ficha: Ficha; lado: 'izquierda' | 'derecha' } | null =
      null;

    for (const ficha of fichas) {
      if (ficha.valor_a === extremos.izq || ficha.valor_b === extremos.izq) {
        fictaValida = { ficha, lado: 'izquierda' };
        break;
      }
      if (ficha.valor_a === extremos.der || ficha.valor_b === extremos.der) {
        fictaValida = { ficha, lado: 'derecha' };
        break;
      }
    }

    if (fictaValida) {
      // Bot juega
      const fichasEnMesa = this.fichasEnMesa();
      let ladoJugado: 'a' | 'b';

      if (fictaValida.lado === 'izquierda') {
        ladoJugado = fictaValida.ficha.valor_b === extremos.izq ? 'a' : 'b';
        this.fichasEnMesa.set([
          {
            ...fictaValida.ficha,
            en_juego: true,
            orden: fichasEnMesa.length,
            lado_jugado: ladoJugado,
          },
          ...fichasEnMesa,
        ]);
      } else {
        ladoJugado = fictaValida.ficha.valor_a === extremos.der ? 'a' : 'b';
        this.fichasEnMesa.set([
          ...fichasEnMesa,
          {
            ...fictaValida.ficha,
            en_juego: true,
            orden: fichasEnMesa.length,
            lado_jugado: ladoJugado,
          },
        ]);
      }

      // Remover de mano del bot
      jugador.fichas_mano = jugador.fichas_mano.filter(
        (f) => f.id !== fictaValida!.ficha.id,
      );

      this.fichaJugada$.next({
        jugador: jugador.nombre,
        ficha: `${fictaValida.ficha.valor_a}-${fictaValida.ficha.valor_b}`,
      });

      // Verificar mano limpia del bot
      if (jugador.fichas_mano.length === 0) {
        this.finalizarMano(jugador.posicion);
        return;
      }

      this.avanzarTurno();

      // Continuar si es modo auto
      if (this.modoDemonstración === 'auto') {
        setTimeout(() => this.botJuega(), 1500);
      }
    } else {
      // Bot pasa
      this.fichaJugada$.next({
        jugador: jugador.nombre,
        ficha: 'PASÓ',
      });

      this.avanzarTurno();

      if (this.modoDemonstración === 'auto') {
        setTimeout(() => this.botJuega(), 1500);
      }
    }
  }

  private avanzarTurno() {
    const turnoActual = this.turnoActual();
    const nuevoTurno = (turnoActual + 1) % 4;

    this.turnoActual.set(nuevoTurno);

    const jugador = this.jugadores()[nuevoTurno];
    if (jugador) {
      this.turnoChanged$.next({
        jugador: jugador.nombre,
        posicion: nuevoTurno,
      });
    }
  }

  private finalizarMano(ganadorPosicion: number) {
    const jugador = this.jugadores()[ganadorPosicion];
    const equipo = jugador?.equipo || 0;

    // Sumar puntos: cantidad de fichas en mano de contrarios
    let puntos = 0;
    this.jugadores().forEach((j) => {
      if (j.equipo !== equipo) {
        puntos += j.fichas_mano.reduce(
          (sum, f) => sum + f.valor_a + f.valor_b,
          0,
        );
      }
    });

    // Bonus cubano: +40 por pegue
    puntos += 40;

    // Actualizar puntuación
    const p = this.partida();
    const nuevaPuntuacion =
      equipo === 0 ? p.puntos_equipo_0 + puntos : p.puntos_equipo_1 + puntos;

    this.partida.set({
      ...p,
      puntos_equipo_0: equipo === 0 ? nuevaPuntuacion : p.puntos_equipo_0,
      puntos_equipo_1: equipo === 1 ? nuevaPuntuacion : p.puntos_equipo_1,
      mano_numero: p.mano_numero + 1,
    });

    this.manoTerminada$.next({
      ganador: jugador?.nombre || 'Unknown',
      puntos: puntos,
    });

    // Verificar si ganó la partida (200+ puntos)
    if (nuevaPuntuacion >= 200) {
      const equipoNombre = equipo === 0 ? 'EQUIPO 0' : 'EQUIPO 1';
      console.log(`🎉 ${equipoNombre} GANÓ LA PARTIDA!`);
      this.partida.update((p) => ({ ...p, estado: 'finalizada' }));
    } else {
      // Reiniciar para siguiente mano
      setTimeout(
        () =>
          this.inicializarDemo(
            this.modoDemonstración === 'auto' ? 'auto' : 'manual',
          ),
        3000,
      );
    }
  }

  canPlayFicha(ficha: Ficha): boolean {
    const extremos = this.extremosActuales();

    if (!extremos.izq || !extremos.der) return true; // Primera ficha

    return (
      ficha.valor_a === extremos.izq ||
      ficha.valor_a === extremos.der ||
      ficha.valor_b === extremos.izq ||
      ficha.valor_b === extremos.der
    );
  }

  // ==================== UTILIDADES ====================

  private generarFichas(): Ficha[] {
    const fichas: Ficha[] = [];
    let id = 0;

    for (let a = 0; a <= 9; a++) {
      for (let b = a; b <= 9; b++) {
        fichas.push({
          id: `ficha-${id++}`,
          valor_a: a,
          valor_b: b,
          en_juego: false,
        });
      }
    }

    // Shuffle
    for (let i = fichas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fichas[i], fichas[j]] = [fichas[j], fichas[i]];
    }

    return fichas;
  }

  private iniciarJuegoAutomático() {
    // El juego comienza automáticamente en modo auto
    setTimeout(() => this.botJuega(), 1500);
  }

  // ==================== CONTROLES DEL STREAMER ====================

  reiniciarPartida() {
    const modo = this.modoDemonstración;
    this.inicializarDemo(modo as 'auto' | 'manual');
  }

  cambiarModo(modo: 'auto' | 'manual') {
    this.modoDemonstración = modo;
    this.reiniciarPartida();
  }
}
