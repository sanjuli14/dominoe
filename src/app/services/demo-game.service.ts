import { Injectable, signal } from '@angular/core';
import { Ficha, Jugador, Mano, Partida, FichaEnMesa } from './game.service';

@Injectable({
  providedIn: 'root',
})
export class DemoGameService {
  // Datos de demo
  private demoPartida: Partida = {
    id: 'demo-001',
    codigo_sala: 'DEMO01',
    estado: 'en_curso',
    puntos_equipo_0: 75,
    puntos_equipo_1: 120,
    mano_actual: 3,
    salida_inicial: false,
  };

  private demoJugadores: Jugador[] = [
    {
      id: 'p1',
      partida_id: 'demo-001',
      user_id: 'u1',
      posicion: 0,
      equipo: 0,
      nombre: 'Juan',
    },
    {
      id: 'p2',
      partida_id: 'demo-001',
      user_id: 'u2',
      posicion: 1,
      equipo: 1,
      nombre: 'María',
    },
    {
      id: 'p3',
      partida_id: 'demo-001',
      user_id: 'u3',
      posicion: 2,
      equipo: 0,
      nombre: 'Pedro',
    },
    {
      id: 'p4',
      partida_id: 'demo-001',
      user_id: 'u4',
      posicion: 3,
      equipo: 1,
      nombre: 'Rosa',
    },
  ];

  private demoMano: Mano = {
    id: 'mano-001',
    partida_id: 'demo-001',
    estado: 'en_curso',
    jugador_salida: 'p1',
    extremo_izquierdo: 6,
    extremo_derecho: 4,
    turno_actual: 0,
    sentido: 'horario',
  };

  private demoMisFichas: Ficha[] = [
    { id: 'f1', valor_a: 4, valor_b: 5 },
    { id: 'f2', valor_a: 4, valor_b: 6 },
    { id: 'f3', valor_a: 3, valor_b: 7 },
    { id: 'f4', valor_a: 8, valor_b: 9 },
    { id: 'f5', valor_a: 2, valor_b: 4 },
    { id: 'f6', valor_a: 1, valor_b: 1 },
    { id: 'f7', valor_a: 5, valor_b: 9 },
  ];

  private demoFichasEnMesa: FichaEnMesa[] = [
    {
      id: 'fm1',
      valor_a: 6,
      valor_b: 6,
      lado: 'izquierda',
      orientacion: 'normal',
      orden_jugada: 0,
      jugador_id: 'p1',
      posicion: { x: 400, y: 300 },
    },
    {
      id: 'fm2',
      valor_a: 6,
      valor_b: 2,
      lado: 'derecha',
      orientacion: 'normal',
      orden_jugada: 1,
      jugador_id: 'p2',
      posicion: { x: 460, y: 300 },
    },
    {
      id: 'fm3',
      valor_a: 2,
      valor_b: 5,
      lado: 'derecha',
      orientacion: 'normal',
      orden_jugada: 2,
      jugador_id: 'p3',
      posicion: { x: 520, y: 300 },
    },
    {
      id: 'fm4',
      valor_a: 5,
      valor_b: 4,
      lado: 'derecha',
      orientacion: 'normal',
      orden_jugada: 3,
      jugador_id: 'p4',
      posicion: { x: 580, y: 300 },
    },
    {
      id: 'fm5',
      valor_a: 4,
      valor_b: 4,
      lado: 'derecha',
      orientacion: 'normal',
      orden_jugada: 4,
      jugador_id: 'p1',
      posicion: { x: 640, y: 300 },
    },
  ];

  constructor() {}

  getPartida(): Partida {
    return this.demoPartida;
  }

  getJugadores(): Jugador[] {
    return this.demoJugadores;
  }

  getMano(): Mano {
    return this.demoMano;
  }

  getMisFichas(): Ficha[] {
    return this.demoMisFichas;
  }

  getFichasEnMesa(): FichaEnMesa[] {
    return this.demoFichasEnMesa;
  }

  // Simular jugada de ficha
  playFicha(ficha: Ficha, lado: 'izquierda' | 'derecha'): boolean {
    // Validar
    if (
      lado === 'izquierda' &&
      ficha.valor_a !== this.demoMano.extremo_izquierdo &&
      ficha.valor_b !== this.demoMano.extremo_izquierdo
    ) {
      return false;
    }
    if (
      lado === 'derecha' &&
      ficha.valor_a !== this.demoMano.extremo_derecho &&
      ficha.valor_b !== this.demoMano.extremo_derecho
    ) {
      return false;
    }

    // Simular que se agregó a mesa
    const nuevaFicha: FichaEnMesa = {
      ...ficha,
      lado,
      orientacion: 'normal',
      orden_jugada: this.demoFichasEnMesa.length,
      jugador_id: 'u1',
      posicion: { x: 0, y: 0 },
    };

    this.demoFichasEnMesa.push(nuevaFicha);

    // Remover de mano
    const idx = this.demoMisFichas.findIndex((f) => f.id === ficha.id);
    if (idx !== -1) {
      this.demoMisFichas.splice(idx, 1);
    }

    // Actualizar extremo
    if (lado === 'izquierda') {
      this.demoMano.extremo_izquierdo =
        ficha.valor_a === this.demoMano.extremo_izquierdo
          ? ficha.valor_b
          : ficha.valor_a;
    } else {
      this.demoMano.extremo_derecho =
        ficha.valor_a === this.demoMano.extremo_derecho
          ? ficha.valor_b
          : ficha.valor_a;
    }

    // Cambiar turno
    this.demoMano.turno_actual = (this.demoMano.turno_actual + 1) % 4;

    return true;
  }

  pasarTurno(): boolean {
    this.demoMano.turno_actual = (this.demoMano.turno_actual + 1) % 4;
    return true;
  }

  updateScore(equipo: number, puntos: number) {
    if (equipo === 0) {
      this.demoPartida.puntos_equipo_0 += puntos;
    } else {
      this.demoPartida.puntos_equipo_1 += puntos;
    }
  }
}
