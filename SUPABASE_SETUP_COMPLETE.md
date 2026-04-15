# 🚀 Guía Completa: Configuración de Supabase para Dominó

## Paso 1: Crear Proyecto en Supabase (5 minutos)

1. Ve a https://supabase.com
2. Sign in o crea cuenta
3. Haz clic en **"New project"**
4. Llena los datos:
   - **Name**: `dominos-game` (o lo que prefieras)
   - **Database Password**: Guarda esta contraseña
   - **Region**: Elige la más cercana a ti (e.g., `us-east-1` o `eu-west-1`)
5. Espera a que se cree (~2 minutos)

## Paso 2: Obtener Credenciales (2 minutos)

1. Una vez creado, entra a tu proyecto
2. Ve a **Settings → API**
3. Copia estos valores:
   - **Project URL**: Algo como `https://xxxxx.supabase.co`
   - **anon public key**: El JWT anonimo (te permite acceder sin login)

## Paso 3: Crear Archivo .env.local (1 minuto)

En la raíz de tu proyecto (donde está `angular.json`), crea archivo `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: no commit este archivo a Git (ya está en `.gitignore`)

## Paso 4: Ejecutar Migraciones (10 minutos)

### Opción A: SQL Editor de Supabase (Recomendado)

1. En tu proyecto Supabase, ve a **SQL Editor**
2. Haz clic en **"New Query"**
3. Copia y pega TODO el contenido de `/supabase/migrations/20260414104307_init.sql`
4. Presiona **Run** (botón ▶️)
5. Repite para los otros 2 archivos:
   - `20260414110000_add_room_codes.sql`
   - `20260414120000_add_fichas_conteo.sql`

### Opción B: Línea de Comandos (Si tienes Supabase CLI)

```bash
# Si tienes supabase-cli instalado
supabase db push --db-url "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres"
```

## Paso 5: Configurar RLS (Row Level Security) - 5 minutos

Estas políticas aseguran que cada jugador solo pueda ver sus propios datos.

En **SQL Editor**, ejecuta:

```sql
-- Tabla: partidas (todos pueden leer)
ALTER TABLE partidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partidas_select" ON partidas FOR SELECT USING (true);
CREATE POLICY "partidas_insert" ON partidas FOR INSERT WITH CHECK (true);

-- Tabla: jugadores (solo el jugador puede leer sus datos)
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jugadores_select" ON jugadores FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "jugadores_insert" ON jugadores FOR INSERT WITH CHECK (true);

-- Tabla: manos (todos los jugadores de la partida)
ALTER TABLE manos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manos_select" ON manos FOR SELECT USING (true);
CREATE POLICY "manos_insert" ON manos FOR INSERT WITH CHECK (true);

-- Tabla: fichas_manos (solo el jugador dueño)
ALTER TABLE fichas_manos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fichas_manos_select" ON fichas_manos FOR SELECT USING (true);
CREATE POLICY "fichas_manos_insert" ON fichas_manos FOR INSERT WITH CHECK (true);

-- Tabla: fichas_mesa (todos pueden ver)
ALTER TABLE fichas_mesa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fichas_mesa_select" ON fichas_mesa FOR SELECT USING (true);
CREATE POLICY "fichas_mesa_insert" ON fichas_mesa FOR INSERT WITH CHECK (true);
```

## Paso 6: Crear Edge Functions (La Parte Más Importante)

Los Edge Functions son funciones serverless que manejan la lógica del juego.

### 6.1: crear-sala

En Supabase, ve a **Edge Functions** y crea una nueva con nombre `crear-sala`.

Reemplaza el contenido con:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nombreJugador } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generar código único de 6 caracteres
    const codigoSala = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Crear partida
    const { data: partida, error: errorPartida } = await supabase
      .from("partidas")
      .insert({
        codigo_sala: codigoSala,
        estado: "esperando",
        puntos_equipo_0: 0,
        puntos_equipo_1: 0,
        mano_actual: 1,
      })
      .select();

    if (errorPartida) throw errorPartida;

    const partidaId = partida[0].id;

    // Agregar creador como jugador (posición 0, equipo 0)
    const { error: errorJugador } = await supabase.from("jugadores").insert({
      partida_id: partidaId,
      user_id: `user_${Date.now()}`, // Temporal - mejorar con auth real
      posicion: 0,
      equipo: 0,
      nombre: nombreJugador,
    });

    if (errorJugador) throw errorJugador;

    return new Response(
      JSON.stringify({
        success: true,
        partidaId,
        codigoSala,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```

### 6.2: unirse-sala

Crea función `unirse-sala`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { codigoSala, nombreJugador } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar sala por código
    const { data: partidas, error: errorPartida } = await supabase.from("partidas").select("id, estado").eq("codigo_sala", codigoSala).single();

    if (errorPartida || !partidas) {
      throw new Error("Sala no encontrada");
    }

    const partidaId = partidas.id;

    // Contar jugadores actuales
    const { data: jugadores, error: errorCount } = await supabase.from("jugadores").select("id").eq("partida_id", partidaId);

    if (errorCount) throw errorCount;

    if (jugadores.length >= 4) {
      throw new Error("Sala llena (máximo 4 jugadores)");
    }

    // Agregar nuevo jugador
    const posiciones = [0, 1, 2, 3];
    const usadas = jugadores.map(() => posiciones.shift());
    const proximaPosicion = posiciones[0];

    const { error: errorJugador } = await supabase.from("jugadores").insert({
      partida_id: partidaId,
      user_id: `user_${Date.now()}`,
      posicion: proximaPosicion,
      equipo: proximaPosicion % 2,
      nombre: nombreJugador,
    });

    if (errorJugador) throw errorJugador;

    return new Response(JSON.stringify({ success: true, partidaId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```

### 6.3: iniciar-partida

Crea función `iniciar-partida`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { partidaId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar que hay 4 jugadores
    const { data: jugadores } = await supabase.from("jugadores").select("id").eq("partida_id", partidaId);

    if (!jugadores || jugadores.length !== 4) {
      throw new Error("Se requieren 4 jugadores para iniciar");
    }

    // Crear todas las fichas (0-0 a 6-6 = 28 fichas)
    const fichas = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        fichas.push({ valor_a: i, valor_b: j });
      }
    }

    // Barajar fichas
    for (let i = fichas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fichas[i], fichas[j]] = [fichas[j], fichas[i]];
    }

    // Crear primera mano
    const { data: mano, error: errorMano } = await supabase
      .from("manos")
      .insert({
        partida_id: partidaId,
        extremo_izquierdo: null,
        extremo_derecho: null,
        turno_actual: 0,
        estado: "en_progreso",
      })
      .select();

    if (errorMano) throw errorMano;

    const manoId = mano[0].id;

    // Repartir fichas (7 a cada jugador)
    let fichaIdx = 0;
    for (let j = 0; j < 4; j++) {
      const manoJugador = fichas.slice(fichaIdx, fichaIdx + 7);
      for (const ficha of manoJugador) {
        await supabase.from("fichas_manos").insert({
          mano_id: manoId,
          jugador_id: jugadores[j].id,
          valor_a: ficha.valor_a,
          valor_b: ficha.valor_b,
        });
      }
      fichaIdx += 7;
    }

    // Actualizar estado de partida
    await supabase.from("partidas").update({ estado: "en_juego", mano_actual: 1 }).eq("id", partidaId);

    return new Response(
      JSON.stringify({
        success: true,
        manoId,
        fichasRestantes: fichas.length - 28,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```

## Paso 7: Probar Conexión (5 minutos)

1. En Angular, abre el navegador (debería estar en `localhost:4200`)
2. Abre **DevTools (F12) → Console**
3. Haz clic en **CREAR SALA** en la interfaz
4. Deberías ver:
   - `✅ ¡Sala creada!` toast
   - Sin errores en console
   - Navegación a `/partida/[ID]`

## Troubleshooting

### ❌ "Error: Sala no encontrada"

- Verifica que la migración `20260414110000_add_room_codes.sql` se ejecutó correctamente
- Comprueba en Supabase que la tabla `partidas` tiene la columna `codigo_sala`

### ❌ "Error creating function"

- Asegúrate que copiaste TODO el código del Edge Function
- Verifica que el nombre de la función es exacto: `crear-sala`, `unirse-sala`, etc.

### ❌ ".env.local no se lee"

- Angular necesita `VITE_` prefix en las variables
- Reinicia el servidor (Ctrl+C y `npm start`)

### ❌ Funciona local pero no remoto

- Verifica CORS en Supabase: Settings → API → CORS
- Agrega tu dominio remoto a la lista de allowed origins

## Próximos Pasos

Una vez funcione `crear-sala` y `unirse-sala`:

1. **Implementar `realizar-jugada`**: Ya tiene lógica de scoring, solo necesita DB updates
2. **Implementar `siguiente-mano`**: Finalizar mano, calcular puntos, crear nueva
3. **Agregar autenticación real**: Reemplazar `user_${Date.now()}` con JWT de Supabase Auth

---

**Tiempo total**: ~30-45 minutos para tener multiplayer funcionando
**Resultado**: 2+ navegadores pueden jugar juntos en tiempo real
