# ⚡ CONFIGURACIÓN DE SUPABASE - 3 MINUTOS

## 🔴 ¿ERROR "Error creando sala"?

**Causa**: Supabase no tiene credenciales reales configuradas.

**SOLUCIÓN RÁPIDA**: Sigue los 3 pasos abajo.

---

## PASO 1️⃣ : OBTENER TUS CREDENCIALES SUPABASE

1. Ve a https://app.supabase.com
2. Crea proyecto o inicia sesión
3. En **Settings → API**, copia:
   - **Project URL** (ej: `https://abc123.supabase.co`)
   - **anon public key** (ej: `eyJhbGc...`)

---

## PASO 2️⃣: CONFIGURAR EN EL CÓDIGO

Abre `src/app/config/supabase.config.ts` y busca esta sección:

```typescript
private loadConfig() {
    // Fallback to defaults (change these)
    if (!this.url) {
      this.url = 'https://your-supabase-url.supabase.co';  // ← CAMBIAR AQUÍ
    }
    if (!this.key) {
      this.key = 'your-supabase-anon-key';  // ← CAMBIAR AQUÍ
    }
}
```

Reemplaza `your-supabase-url.supabase.co` y `your-supabase-anon-key` con **TUS VALORES REALES**.

Ejemplo completo:

```typescript
private loadConfig() {
    if (!this.url) {
      this.url = 'https://abc123xyz456.supabase.co';
    }
    if (!this.key) {
      this.key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    }
}
```

---

## PASO 3️⃣: CREAR TABLAS EN SUPABASE

1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Ejecuta el SQL abajo:

### Configuración de Paso 1: Preparar el Proyecto en Supabase

### 1.1 Crear un Proyecto

1. Ve a [supabase.com](https://supabase.com)
2. Haz login o crea una cuenta
3. Crea un nuevo proyecto
4. Guarda tus credenciales:
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: `eyJ...` (la encontrarás en Settings > API)

### 1.2 Configuración en el Frontend

En `src/app/config/supabase.config.ts`, actualiza:

```typescript
class SupabaseConfigManager {
  private url = "https://your-project.supabase.co"; // ← Cambiar aquí
  private key = "eyJ..."; // ← Y aquí
}
```

O inyecta las variables en el index.html antes de `</head>`:

```html
<script>
  window.SUPABASE_URL = "https://your-project.supabase.co";
  window.SUPABASE_KEY = "eyJ...";
</script>
```

## Paso 2: Ejecutar las Migraciones

### Option A: Usando Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI
brew install supabase/tap/supabase  # macOS
# o descargar desde https://github.com/supabase/cli/releases

# 2. Login
supabase login

# 3. Vincular el proyecto
supabase link --project-ref=tu-project-ref

# 4. Ejecutar todas las migraciones
supabase db push
```

### Option B: SQL Manual

1. Ve a Supabase Dashboard > SQL Editor
2. Copia el contenido de `supabase/migrations/`
3. Pega en el editor y ejecuta

Los archivos en orden son:

- `20260414104307_init.sql` - Tablas base y RLS
- `20260414110000_add_room_codes.sql` - Códigos de sala
- `20260414120000_add_fichas_conteo.sql` - Conteo de fichas

## Paso 3: Configurar RLS (Row Level Security)

El esquema ya tiene RLS configurado. Verifica en Supabase:

1. Authentication > Policies
2. Cada tabla debe tener políticas definidas:
   - `partidas`: Jugadores pueden ver/actualizar su partida
   - `fichas_manos`: Solo el dueño puede ver sus fichas
   - `fichas_mesa`: Todos en la partida pueden ver
   - etc.

## Paso 4: Crear Edge Functions (Opcional)

Para transacciones complejas, usa Edge Functions.

```bash
# Crear función para jugar ficha
supabase functions new jugar-ficha

# Deploy
supabase functions deploy
```

Ejemplo: `supabase/functions/jugar-ficha/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const client = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

  const { mano_id, jugador_id, valor_a, valor_b, lado } = await req.json();

  // Tu lógica aquí
  const { error } = await client.from("fichas_mesa").insert({ mano_id, jugador_id, valor_a, valor_b, lado });

  return new Response(JSON.stringify({ success: !error }));
});
```

## Paso 5: Verificar la Configuración

### Test con cURL

```bash
# Obtener todas las partidas (requiere autenticación)
curl -H "apikey: TU_ANON_KEY" \
     -H "Authorization: Bearer TU_TOKEN" \
     https://tu-proyecto.supabase.co/rest/v1/partidas
```

### Test desde la App

En `src/main.ts`, agrega:

```typescript
import { GameService } from "./app/services/game.service";

// Inyecta el servicio para probar
const game = inject(GameService);
await game.setCurrentGame("test-id");
console.log(game.partida());
```

## Paso 6: Configurar Authentication (Opcional pero Recomendado)

1. En Supabase Dashboard, ve a Authentication
2. Enable Email/Password
3. Personaliza los templates de email si es necesario

En la app:

```typescript
const { data, error } = await supabase.auth.signUpWithPassword({
  email: "usuario@ejemplo.com",
  password: "password123",
});
```

## Troubleshooting

### Error: "CORS policy"

En Supabase, ve a Settings > API > CORS Allowed Origins
Agrega tu dominio:

```
http://localhost:4200
https://tu-dominio.com
```

### Error: "Row not found"

Asegúrate de que:

- El usuario tiene permisos RLS para acceder ese dato
- El ID de la partida existe en la DB
- El usuario está autenticado

### Error: "Permission denied"

Revisa las políticas RLS:

```sql
-- Ver políticas actuales
SELECT * FROM pg_policies WHERE tablename='partidas';
```

## Backup y Recuperación

```bash
# Hacer backup de la DB
pg_dump postgresql://user:password@localhost/database > backup.sql

# Restaurar
psql postgresql://user:password@localhost/database < backup.sql
```

## Staging vs Production

Se recomienda:

1. **Staging**: Proyecto de prueba con datos de desarrollo
2. **Production**: Proyecto real con datos de usuarios

En `supabase.config.ts`:

```typescript
const env = process.env["APP_ENV"] || "staging";
const projects = {
  staging: {
    /* credenciales staging */
  },
  production: {
    /* credenciales producción */
  },
};
```

## Performance Tips

1. **Índices**: Las migraciones ya incluyen índices en `partida_id`, `user_id`, etc.
2. **Realtime**: No suscribirse a todo, solo a lo necesario
3. **Query**: Usa `select()` con campos específicos, no `*`
4. **Batch**: Agrupa inserts/updates cuando sea posible

## Monitoreo

En Supabase Dashboard:

- **Database > Queries**: Ve queries lentas
- **Database > Replication**: Verifica el estado de Realtime
- **API > Usage**: Monitorea consumo de créditos

---

¡Con esto tu backend está configurado y listo para recibir jugadas de clientes! 🚀
