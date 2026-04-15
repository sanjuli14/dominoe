import { Injectable, signal, computed, effect } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { supabaseConfig } from '../config/supabase.config';
import { environment } from '../../environments/environment';

export interface Ficha {
  id: string;
  valor_a: number;
  valor_b: number;
}

export interface FichaEnMesa extends Ficha {
  lado: 'izquierda' | 'derecha';
  orientacion: 'normal' | 'invertida';
  orden_jugada: number;
  jugador_id: string;
  posicion?: { x: number; y: number }; // Para la UI
}

export interface Jugador {
  id: string;
  partida_id: string;
  user_id: string;
  posicion: number; // 0, 1, 2, 3
  equipo: number; // 0 o 1
  nombre: string;
}

export interface Mano {
  id: string;
  partida_id: string;
  estado: 'repartiendo' | 'en_curso' | 'finalizada' | 'trancada';
  jugador_salida: string;
  extremo_izquierdo: number | null;
  extremo_derecho: number | null;
  turno_actual: number;
  sentido: 'horario' | 'antihorario';
  razon_fin?: string;
}

export interface Partida {
  id: string;
  codigo_sala: string;
  estado: 'esperando' | 'en_curso' | 'finalizada';
  puntos_equipo_0: number;
  puntos_equipo_1: number;
  mano_actual: number;
  salida_inicial: boolean;
  ganador?: number;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private supabase!: SupabaseClient;
  private partida_id = signal<string | null>(null);
  private user_id = signal<string | null>(null);
  private authReady = signal<boolean>(false);

  // Estado del Juego
  partida = signal<Partida | null>(null);
  jugadores = signal<Jugador[]>([]);
  manoActual = signal<Mano | null>(null);
  fichasEnMesa = signal<FichaEnMesa[]>([]);
  fichasEnMano = signal<Ficha[]>([]);
  turnoActual = signal<number>(0);

  // Derivados
  miJugador = computed(() => {
    const uid = this.user_id();
    const jugs = this.jugadores();
    return uid ? jugs.find((j) => j.user_id === uid) || null : null;
  });

  esmiTurno = computed(() => {
    const mano = this.manoActual();
    const mi = this.miJugador();
    if (!mano || !mi) return false;
    return mano.turno_actual === mi.posicion;
  });

  extremosActuales = computed(() => {
    const mano = this.manoActual();
    if (!mano) return { izq: null, der: null };
    return { izq: mano.extremo_izquierdo, der: mano.extremo_derecho };
  });

  puntuacion = computed(() => {
    const p = this.partida();
    return p
      ? { eq0: p.puntos_equipo_0, eq1: p.puntos_equipo_1 }
      : { eq0: 0, eq1: 0 };
  });

  // Observables para eventos
  toastMessage$ = new Subject<string>();
  errorMessage$ = new Subject<string>();

  constructor() {
    this.initSupabase();
    this.ensureAnonymousAuth(); // Autenticar al inicio
  }

  private initSupabase() {
    this.supabase = createClient(supabaseConfig.url, supabaseConfig.key);
  }

  // Asegurar que el usuario esté autenticado anónimamente
  async ensureAnonymousAuth(): Promise<void> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await this.supabase.auth.getSession();

      if (sessionError || !session) {
        if (sessionError) {
          console.log(
            '[GameService] Error validando sesión, limpiando...',
            sessionError,
          );

          // Intentar cerrar sesión pero NO fallar si da error

          try {
            await this.supabase.auth.signOut();
          } catch (e) {
            console.warn('Fallo signOut, ignorando', e);
          }
        }

        console.log('[GameService] Iniciando autenticación anónima...');

        const { data, error } = await this.supabase.auth.signInAnonymously();

        if (error) {
          console.error('[GameService] Error en autenticación anónima:', error);

          if (
            error.message?.includes('ES256') ||
            error.message?.includes('algorithm')
          ) {
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith('sb-') && key.endsWith('-auth-token'))
                localStorage.removeItem(key);
            });

            console.log('Limpié el localStorage porque falló el JWT.');

            const retry = await this.supabase.auth.signInAnonymously();

            if (!retry.error && retry.data.user)
              this.user_id.set(retry.data.user.id);
            else throw retry.error;
          } else {
            this.authReady.set(true);

            throw error;
          }
        } else if (data.user) {
          this.user_id.set(data.user.id);
        }
      } else {
        this.user_id.set(session.user?.id || null);
      }
    } catch (error) {
      console.error('[GameService] Error en ensureAnonymousAuth:', error);

      // Limpiar datos locales asumiendo algo se corrompió

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token'))
          localStorage.removeItem(key);
      });
    } finally {
      this.authReady.set(true);
    }
  }

  // Esperar a que la autenticación esté lista
  async waitForAuth(): Promise<void> {
    // Si ya está listo, retornar inmediatamente
    if (this.authReady()) {
      return;
    }

    // Esperar hasta 5 segundos por la autenticación
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (this.authReady()) {
        return;
      }
    }

    console.warn('[GameService] Timeout esperando autenticación');
  }

  async setCurrentGame(gameId: string) {
    this.partida_id.set(gameId);
    const { data } = await this.supabase.auth.getUser();
    this.user_id.set(data.user?.id || null);

    // Cargar estado inicial
    await Promise.all([
      this.loadPartida(),
      this.loadJugadores(),
      this.loadManoActual(),
      this.loadFichasEnMesa(),
      this.loadMisFichas(),
    ]);

    // Suscribirse a cambios en tiempo real
    this.subscribeToChanges();
  }

  private async loadPartida() {
    const id = this.partida_id();
    if (!id) return;

    const { data, error } = await this.supabase
      .from('partidas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.errorMessage$.next(`Error cargando partida: ${error.message}`);
      return;
    }
    this.partida.set(data);
  }

  private async loadJugadores() {
    const id = this.partida_id();
    if (!id) return;

    const { data, error } = await this.supabase
      .from('jugadores')
      .select('*')
      .eq('partida_id', id);

    if (error) {
      this.errorMessage$.next(`Error cargando jugadores: ${error.message}`);
      return;
    }
    this.jugadores.set(data || []);
  }

  private async loadManoActual() {
    const id = this.partida_id();
    if (!id) return;

    const { data, error } = await this.supabase
      .from('manos')
      .select('*')
      .eq('partida_id', id)
      .neq('estado', 'finalizada')
      .order('fecha_inicio', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      this.errorMessage$.next(`Error cargando mano: ${error.message}`);
      return;
    }
    this.manoActual.set(data || null);
  }

  private async loadFichasEnMesa() {
    const mano_id = this.manoActual()?.id;
    if (!mano_id) return;

    const { data, error } = await this.supabase
      .from('fichas_mesa')
      .select('*')
      .eq('mano_id', mano_id)
      .order('orden_jugada', { ascending: true });

    if (error) {
      this.errorMessage$.next(
        `Error cargando fichas en mesa: ${error.message}`,
      );
      return;
    }
    this.fichasEnMesa.set(
      (data || []).map((f) => ({
        ...f,
        posicion: this.calculateFichaPosition(f.orden_jugada),
      })),
    );
  }

  private async loadMisFichas() {
    const mano_id = this.manoActual()?.id;
    const mi = this.miJugador();
    if (!mano_id || !mi) return;

    const { data, error } = await this.supabase
      .from('fichas_manos')
      .select('*')
      .eq('mano_id', mano_id)
      .eq('jugador_id', mi.id);

    if (error) {
      this.errorMessage$.next(`Error cargando mis fichas: ${error.message}`);
      return;
    }
    this.fichasEnMano.set(data || []);
  }

  private subscribeToChanges() {
    const id = this.partida_id();
    if (!id) return;

    // Suscribirse a cambios en partidas
    this.supabase
      .channel(`partidas:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'partidas',
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          this.partida.set(payload.new);
        },
      )
      .subscribe();

    // Suscribirse a jugadores
    this.supabase.channel(`jugadores:${id}`).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jugadores', filter: `partida_id=eq.${id}` },
      async () => {
        await this.loadJugadores();
      }
    ).subscribe();

    // Suscribirse a cambios en manos
    this.supabase
      .channel(`manos:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manos',
          filter: `partida_id=eq.${id}`,
        },
        async () => {
          await this.loadManoActual();
          await this.loadFichasEnMesa();
        },
      )
      .subscribe();

    // Suscribirse a fichas en mesa
    this.supabase
      .channel(`fichas_mesa:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fichas_mesa' },
        async (payload) => {
          if (
            payload.eventType === 'INSERT' ||
            payload.eventType === 'UPDATE'
          ) {
            await this.loadFichasEnMesa();
          }
        },
      )
      .subscribe();

    // Suscribirse a mis fichas
    const mi = this.miJugador();
    if (mi) {
      this.supabase
        .channel(`fichas_manos:${mi.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'fichas_manos',
            filter: `jugador_id=eq.${mi.id}`,
          },
          async () => {
            await this.loadMisFichas();
          },
        )
        .subscribe();
    }
  }

  // ==================== SALAS ====================

  async crearSala(nombreJugador: string): Promise<string | null> {
    try {
      // Esperar a que la autenticación esté lista
      await this.waitForAuth();

      // Obtener token de sesión
      const { data: sessionData } = await this.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        console.error(
          '[crearSala] No hay token de sesión después de esperar autenticación',
        );
        throw new Error('No hay sesión activa');
      }

      console.log('[crearSala] Token obtenido, llamando Edge Function...');

      // Usar fetch directo para mayor control
      const resp = await fetch(
        `${environment.supabaseUrl}/functions/v1/crear-sala`,
        {
          method: 'POST',
          headers: {
            // Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: nombreJugador,
            conBots: false,
            userId:
              this.user_id() ||
              `temp_${Math.random().toString(36).substring(7)}`,
          }),
        },
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[crearSala] Error:', resp.status, errorText);
        throw new Error(
          `Error ${resp.status}: ${errorText || 'Error al crear sala'}`,
        );
      }

      const data = await resp.json();

      if (!data || !data.partidaId) {
        this.errorMessage$.next('Error: No se recibió ID de partida');
        return null;
      }

      this.toastMessage$.next(`✓ Sala creada: ${data.codigoSala}`);
      console.log('Sala creada:', data);
      return data.partidaId;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
      console.error('Exception creando sala:', e);
      this.errorMessage$.next(`Error: ${errorMsg}`);
      return null;
    }
  }

  async unirseASala(
    codigo: string,
    nombreJugador: string,
  ): Promise<string | null> {
    try {
      // Esperar a que la autenticación esté lista
      await this.waitForAuth();

      // Obtener token de sesión
      const { data: sessionData } = await this.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        console.error(
          '[unirseASala] No hay token de sesión después de esperar autenticación',
        );
        throw new Error('No hay sesión activa');
      }

      console.log('[unirseASala] Token obtenido, llamando Edge Function...');

      // Usar fetch directo para mayor control
      const resp = await fetch(
        `${environment.supabaseUrl}/functions/v1/unirse-sala`,
        {
          method: 'POST',
          headers: {
            // Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            codigoSala: codigo.toUpperCase(),
            nombre: nombreJugador,
            userId:
              this.user_id() ||
              `temp_${Math.random().toString(36).substring(7)}`,
          }),
        },
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[unirseASala] Error:', resp.status, errorText);
        throw new Error(
          `Error ${resp.status}: ${errorText || 'Error al unirse a sala'}`,
        );
      }

      const data = await resp.json();

      if (!data || !data.partidaId) {
        this.errorMessage$.next('Error: No se pudo unir a la sala');
        return null;
      }

      this.toastMessage$.next(`✓ Unido a sala ${codigo}`);
      console.log('Unido a sala:', data);
      return data.partidaId;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
      console.error('Exception uniéndose a sala:', e);
      this.errorMessage$.next(`Error: ${errorMsg}`);
      return null;
    }
  }

  async iniciarPartida(): Promise<boolean> {
    const id = this.partida_id();
    if (!id) return false;

    try {
      // Esperar a que la autenticación esté lista
      await this.waitForAuth();

      // Obtener token de sesión
      const { data: sessionData } = await this.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        console.error(
          '[iniciarPartida] No hay token de sesión después de esperar autenticación',
        );
        throw new Error('No hay sesión activa');
      }

      console.log('[iniciarPartida] Token obtenido, llamando Edge Function...');

      // Usar fetch directo para mayor control
      const resp = await fetch(
        `${environment.supabaseUrl}/functions/v1/iniciar-partida`,
        {
          method: 'POST',
          headers: {
            // Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ partida_id: id }),
        },
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[iniciarPartida] Error:', resp.status, errorText);
        throw new Error(
          `Error ${resp.status}: ${errorText || 'Error al iniciar partida'}`,
        );
      }

      const data = await resp.json();

      if (!data?.success) {
        this.errorMessage$.next(
          data?.message || 'No se pudo iniciar la partida',
        );
        return false;
      }

      this.toastMessage$.next('¡Partida iniciada!');
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
      console.error('Exception iniciando partida:', e);
      this.errorMessage$.next(`Error: ${errorMsg}`);
      return false;
    }
  }

  // ==================== JUEGO ====================

  async jugarFicha(
    ficha: Ficha,
    lado: 'izquierda' | 'derecha',
  ): Promise<boolean> {
    const mano = this.manoActual();
    const mi = this.miJugador();
    const id = this.partida_id();

    if (!mano || !mi || !id) return false;

    // Validar que sea tu turno
    if (mano.turno_actual !== mi.posicion) {
      this.errorMessage$.next('No es tu turno');
      return false;
    }

    // Validar que la ficha coincida con un extremo
    const extremos = this.extremosActuales();
    const puedeJugar = this.canPlayFicha(ficha, lado, extremos);
    if (!puedeJugar) {
      this.errorMessage$.next('Ficha no válida para este extremo');
      return false;
    }

    try {
      // Esperar a que la autenticación esté lista
      await this.waitForAuth();

      // Obtener token de sesión
      const { data: sessionData } = await this.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        console.error(
          '[jugarFicha] No hay token de sesión después de esperar autenticación',
        );
        throw new Error('No hay sesión activa');
      }

      console.log('[jugarFicha] Token obtenido, llamando Edge Function...');

      // Usar fetch directo para mayor control
      const resp = await fetch(
        `${environment.supabaseUrl}/functions/v1/realizar-jugada`,
        {
          method: 'POST',
          headers: {
            // Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partidaId: id,
            fichaId: ficha.id,
            lado: lado,
            userId:
              this.user_id() ||
              `temp_${Math.random().toString(36).substring(7)}`,
          }),
        },
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[jugarFicha] Error:', resp.status, errorText);
        throw new Error(
          `Error ${resp.status}: ${errorText || 'Error al jugar ficha'}`,
        );
      }

      const data = await resp.json();

      if (!data?.success) {
        this.errorMessage$.next(data?.message || 'No se pudo jugar la ficha');
        return false;
      }

      this.toastMessage$.next('¡Ficha jugada!');
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
      console.error('Exception jugando ficha:', e);
      this.errorMessage$.next(`Error: ${errorMsg}`);
      return false;
    }
  }

  canPlayFicha(
    ficha: Ficha,
    lado: 'izquierda' | 'derecha',
    extremos: { izq: number | null; der: number | null },
  ): boolean {
    if (!extremos.izq || !extremos.der) return true; // Primera ficha

    if (lado === 'izquierda') {
      return ficha.valor_a === extremos.izq || ficha.valor_b === extremos.izq;
    }
    if (lado === 'derecha') {
      return ficha.valor_a === extremos.der || ficha.valor_b === extremos.der;
    }
    return false;
  }

  private calculateFichaPosition(orden: number): { x: number; y: number } {
    // Lógica de serpiente para posicionar fichas
    const cellSize = 60;
    const containerWidth = 800;

    let x = orden * cellSize;
    let y = 0;

    if (x > containerWidth) {
      const rows = Math.floor(x / containerWidth);
      x = x % containerWidth || containerWidth;
      y = rows * cellSize;
    }

    return { x, y };
  }

  async pasarTurno(): Promise<boolean> {
    const mano = this.manoActual();
    const mi = this.miJugador();

    if (!mano || !mi) return false;

    const { error } = await this.supabase.rpc('pasar_turno', {
      p_mano_id: mano.id,
      p_jugador_id: mi.id,
    });

    if (error) {
      this.errorMessage$.next(`Error al pasar: ${error.message}`);
      return false;
    }

    this.toastMessage$.next('¡Paso!');
    return true;
  }

  // ==================== HELPER METHODS ====================

  obtenerEquipoJugador(jugador: Jugador): number {
    return jugador.equipo;
  }

  obtenerJugadoresEquipo(equipo: number): Jugador[] {
    return this.jugadores().filter((j) => j.equipo === equipo);
  }

  obtenerNombrePosicion(posicion: number): string {
    const posiciones = ['NORTE', 'ESTE', 'SUR', 'OESTE'];
    return posiciones[posicion] || 'UNKNOWN';
  }
}
