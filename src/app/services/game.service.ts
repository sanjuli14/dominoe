import {
  Injectable,
  signal,
  computed,
  effect,
  NgZone,
  inject,
} from '@angular/core';
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
  private ngZone = inject(NgZone);

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
  tallaMessage$ = new Subject<string>();
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
    // Limpiar canales de partida anterior si existe
    if (this.partida_id()) {
      this.cleanupChannels();
    }

    this.partida_id.set(gameId);

    const { data } = await this.supabase.auth.getSession();
    if (data.session?.user?.id) {
      this.user_id.set(data.session.user.id);
    }

    // Cargar dependencias básicas primero
    await Promise.all([
      this.loadPartida(),
      this.loadJugadores(),
      this.loadManoActual(),
    ]);

    // Luego cargar dependencias de datos en base al estado anterior
    await Promise.all([this.loadFichasEnMesa(), this.loadMisFichas()]);

    // Suscribirse a cambios en tiempo real
    await this.subscribeToChanges();
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
    this.ngZone.run(() => {
      this.partida.set(data);
    });
  }

  private async loadJugadores() {
    const id = this.partida_id();
    if (!id) return;

    const { data, error } = await this.supabase
      .from('jugadores')
      .select('*')
      .eq('partida_id', id)
      .order('posicion', { ascending: true });

    if (error) {
      this.errorMessage$.next(`Error cargando jugadores: ${error.message}`);
      return;
    }
    this.ngZone.run(() => {
      this.jugadores.set(data || []);
    });
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
    this.ngZone.run(() => {
      this.manoActual.set(data || null);
    });
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
    this.ngZone.run(() => {
      this.fichasEnMesa.set(
        (data || []).map((f) => ({
          ...f,
          posicion: this.calculateFichaPosition(f.orden_jugada),
        })),
      );
    });
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
    this.ngZone.run(() => {
      this.fichasEnMano.set(data || []);
    });
  }

  private async subscribeToChanges() {
    const id = this.partida_id();
    if (!id) return;

    // Limpiar canales existentes antes de crear nuevos
    this.cleanupChannels();

    // Evitar suscribirse múltiples veces al mismo canal
    const topic = `realtime:game:${id}`;
    if (this.supabase.getChannels().find((c) => c.topic === topic)) {
      console.log(
        `[Realtime] Ya estamos suscritos al canal principal: ${topic}`,
      );
      // Sin embargo, podemos necesitar suscribirnos a las fichas si no lo estábamos
      const mi = this.miJugador();
      if (mi) this.subscribeMisFichas(mi.id);
      return;
    }

    const mi = this.miJugador();

    // Crear un único canal para la partida para optimizar
    const channel = this.supabase.channel(`game:${id}`);

    // DEBUG GENERAL
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        console.log(
          '[Realtime Master DEBUG] Evento en schema public:',
          payload,
        );
      },
    );

    // Suscribirse a cambios en partidas
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'partidas',
        filter: `id=eq.${id}`,
      },
      (payload: any) => {
        this.ngZone.run(() => {
          this.partida.set(payload.new);
        });
      },
    );

    // Suscribirse a jugadores
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'jugadores',
        filter: `partida_id=eq.${id}`,
      },
      async (payload: any) => {
        console.log('[Realtime] Cambio en jugadores:', payload);

        if (payload.eventType === 'INSERT') {
          this.ngZone.run(() => {
            const current = this.jugadores();
            const exists = current.find((j) => j.id === payload.new.id);
            if (!exists) {
              this.jugadores.set(
                [...current, payload.new].sort(
                  (a, b) => a.posicion - b.posicion,
                ),
              );
            }
          });
        } else if (payload.eventType === 'UPDATE') {
          this.ngZone.run(() => {
            const current = this.jugadores();
            const updated = current.map((j) =>
              j.id === payload.new.id ? payload.new : j,
            );
            this.jugadores.set(updated.sort((a, b) => a.posicion - b.posicion));
          });
        } else {
          // DELETE o cualquier otro
          await this.loadJugadores();
        }

        // Al recargar jugadores podría habernos asignado un miJugador() nuevo
        const nuevoMi = this.miJugador();
        if (nuevoMi && !mi) {
          // Si antes no teníamos jugador y ahora sí, escuchar sus manos
          this.subscribeMisFichas(nuevoMi.id);
        }
      },
    );

    // Suscribirse a cambios en manos
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'manos',
        filter: `partida_id=eq.${id}`,
      },
      async (payload: any) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          this.ngZone.run(() => {
            const current = this.manoActual();
            if (current && payload.new) {
              this.manoActual.set({ ...current, ...payload.new });
            }
          });
        }

        await this.loadManoActual(); // De cualquier forma, recargar para asegurar
        await this.loadFichasEnMesa();
        await this.loadMisFichas();
      },
    );

    // Suscribirse a fichas en mesa
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'fichas_mesa' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          await this.loadFichasEnMesa();
        }
      },
    );

    // Escuchar tallas
    channel.on('broadcast', { event: 'talla' }, (payload: any) => {
      this.ngZone.run(() => {
        if (payload.payload && payload.payload.mensaje) {
          this.tallaMessage$.next(payload.payload.mensaje);
        }
      });
    });

    channel.subscribe((status) => {
      console.log('Realtime channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Realtime OK. Eventos deben llegar.');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.error('Realtime error/closed:', status);
      }
    });

    // Suscribirse a mis fichas si ya sabemos quiénes somos
    if (mi) {
      this.subscribeMisFichas(mi.id);
    }
  }

  private subscribeMisFichas(jugadorId: string) {
    const channelName = `fichas_manos:${jugadorId}`;

    // Evitar suscribirse nuevamente si ya está suscrito
    if (
      this.supabase
        .getChannels()
        .find((c) => c.topic === `realtime:${channelName}`)
    ) {
      return;
    }

    // Escuchar fichas específicas del jugador actual
    this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fichas_manos',
          filter: `jugador_id=eq.${jugadorId}`,
        },
        async () => {
          await this.loadMisFichas();
        },
      )
      .subscribe();
  }

  // ==================== SALAS ====================

  async crearSala(nombreJugador: string): Promise<string | null> {
    try {
      // Asegurar autenticación anónima
      await this.ensureAnonymousAuth();

      // Obtener token de sesión
      const { data: sessionData } = await this.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        console.error('[crearSala] No hay token de sesión');
        this.errorMessage$.next('Error: No hay sesión activa');
        return null;
      }

      // El userId AHORA viene SOLO de Supabase Auth - nunca de localStorage ni temp_
      const actualUserId = this.user_id();
      if (!actualUserId) {
        console.error('[crearSala] No hay user_id de Supabase');
        this.errorMessage$.next('Error de autenticación');
        return null;
      }

      console.log('[crearSala] Creando sala con userId:', actualUserId);

      // Usar fetch con JWT Authorization header
      const resp = await fetch(
        `${environment.supabaseUrl}/functions/v1/crear-sala`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: nombreJugador,
            conBots: false,
            // NO enviamos userId - el Edge Function lo saca del JWT
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
    console.log('[unirseASala] ===== INICIO =====');
    console.log('[unirseASala] Codigo:', codigo, 'Nombre:', nombreJugador);

    try {
      console.log('[unirseASala] Paso 1: ensureAnonymousAuth...');
      // Asegurar autenticación anónima
      await this.ensureAnonymousAuth();
      console.log('[unirseASala] Paso 1: DONE');

      console.log('[unirseASala] Paso 2: getSession...');
      // Obtener token de sesión
      const { data: sessionData } = await this.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      console.log('[unirseASala] Paso 2: DONE, token:', accessToken ? 'PRESENTE' : 'AUSENTE');

      if (!accessToken) {
        console.error('[unirseASala] No hay token de sesión');
        this.errorMessage$.next('Error: No hay sesión activa');
        return null;
      }

      console.log('[unirseASala] Paso 3: user_id...');
      // El userId AHORA viene SOLO de Supabase Auth
      const actualUserId = this.user_id();
      console.log('[unirseASala] Paso 3: DONE, userId:', actualUserId);

      if (!actualUserId) {
        console.error('[unirseASala] No hay user_id de Supabase');
        this.errorMessage$.next('Error de autenticación');
        return null;
      }

      console.log('[unirseASala] Paso 4: Preparando fetch con userId:', actualUserId);

      // Usar fetch con JWT Authorization header
      const resp = await fetch(
        `${environment.supabaseUrl}/functions/v1/unirse-sala`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            codigoSala: codigo.toUpperCase(),
            nombre: nombreJugador,
            // NO enviamos userId - el Edge Function lo saca del JWT
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

      if (data.error || (!data.partidaId && !data.success)) {
        this.errorMessage$.next(
          data.error || data.message || 'No se pudo iniciar la partida',
        );
        return false;
      }

      this.toastMessage$.next('¡Partida iniciada!');

      // Actualizar el estado de la partida localmente para no depender solo de Realtime
      const partidaActual = this.partida();
      if (partidaActual) {
        this.ngZone.run(() => {
          this.partida.set({ ...partidaActual, estado: 'en_curso' });
        });
      }

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

      // Verificar que tenemos un user_id válido de Supabase
      const actualUserId = this.user_id();
      if (!actualUserId) {
        console.error('[jugarFicha] No hay user_id de Supabase');
        this.errorMessage$.next('Error de autenticación');
        return false;
      }

      console.log('[jugarFicha] Token obtenido, llamando Edge Function...');

      // Usar fetch con JWT Authorization header
      const resp = await fetch(
        `${environment.supabaseUrl}/functions/v1/realizar-jugada`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partidaId: id,
            fichaId: ficha.id,
            lado: lado,
            // NO enviamos userId - el Edge Function lo saca del JWT
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

      if (!data?.success && !data?.exito) {
        this.errorMessage$.next(
          data?.message || data?.error || 'No se pudo jugar la ficha',
        );
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

  // ==================== TALLAS (CHAT RAPIDO) ====================
  async enviarTalla(mensaje: string) {
    const p = this.partida();
    const j = this.miJugador();
    if (!p || !j) return;

    const canal = this.supabase
      .getChannels()
      .find((c) => c.topic === `realtime:game:${p.id}`);
    if (canal) {
      await canal.send({
        type: 'broadcast',
        event: 'talla',
        payload: { mensaje: `Dice ${j.nombre}: ${mensaje}` },
      });
      // Mostrarse a sí mismo también
      this.tallaMessage$.next(`Dice ${j.nombre}: ${mensaje}`);
    }
  }

  // ============================================
  // SALIR DE LA PARTIDA (LIMPIEZA COMPLETA)
  // ============================================
  salirPartida() {
    console.log('[salirPartida] Limpiando estado y canales...');

    // Limpiar todos los canales
    this.cleanupChannels();

    // Resetear estado
    this.partida_id.set(null);
    this.jugadores.set([]);
    this.manoActual.set(null);
    this.fichasEnMano.set([]);
    this.fichasEnMesa.set([]);
    this.turnoActual.set(0);
    this.errorMessage$.next('');
    this.toastMessage$.next('');

    console.log('[salirPartida] Estado limpiado');
  }

  // ============================================
  // LIMPIEZA DE CANALES
  // ============================================
  private cleanupChannels() {
    console.log('[cleanupChannels] Limpiando canales anteriores...');
    const channels = this.supabase.getChannels();
    channels.forEach((channel) => {
      console.log('[cleanupChannels] Removiendo canal:', channel.topic);
      this.supabase.removeChannel(channel);
    });
  }
}
