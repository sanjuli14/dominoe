# 🎲 Dominó Cubano - Multiplayer Streaming Game

Juego de Dominó Cubano completamente funcional, optimizado para streams en Twitch. Incluye modo demo offline (bots) y modo multiplayer con hasta 4 jugadores reales.

## 🚀 Inicio Rápido

### Opción 1: Demo (Funciona AHORA, sin configuración)

```bash
npm install
npm start
# Abre http://localhost:4200
# Haz clic en "MODO DEMO"
```

Demo mode:

- ✅ Te juega contra 3 bots
- ✅ Turnos automáticos
- ✅ Scoring real (cubano)
- ✅ Ganador a 200 pts
- ✅ Sin necesidad de Supabase

### Opción 2: Multiplayer (Requiere setup Supabase - 30 minutos)

Sigue la guía completa en:
**[PLAN_COMPLETACION.md](PLAN_COMPLETACION.md)** (paso-a-paso)
o
**[SUPABASE_SETUP_COMPLETE.md](SUPABASE_SETUP_COMPLETE.md)** (técnico)

---

## 📋 Requisitos

- Node.js 18+
- npm 10+
- (Opcional) Cuenta Supabase para multiplayer

## 🎮 Cómo Jugar

### Reglas Básicas

**Dominó Cubano con 28 fichas (0-6)**:

1. **Salida**: Jugador con doble más alto comienza
2. **Turno**: Juega una ficha que coincida con un extremo del tablero
3. **Pegada**: Si terminas todas tus fichas, ¡ganas la mano!
4. **Tranque**: Si nadie puede jugar, gana el equipo con menos puntos
5. **Victoria**: Primer equipo en 200 puntos

### Puntuación

- **Pegada**: 40 punch + suma de fichas del equipo contrario
- **Tranque**: Suma de fichas del equipo contrario (si tienen más)
- **Bono salida**: 20 puntos si juegas la primera ficha
- **Mano limpia**: Bonificación especial por pegada sin que el contrario tenga fichas

### Interfaz

```
┌─────────────────────────────────┐
│  LOBBY / TABLERO / MARCADOR    │
├─────────────────────────────────┤
│                                 │
│  [Fichas en mano del jugador]   │
│        [Tablero de juego]       │
│      [Equipo 1] vs [Equipo 2]   │
│                                 │
└─────────────────────────────────┘
```

- **Click en ficha**: Selecciona ficha para jugar
- **Click en tablero**: Coloca ficha a izquierda o derecha
- **Botón PASAR**: Si no tienes movimientos válidos
- **SOLICITAR COMPAÑERO**: Si no tienes dobles, pide al compañero

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── lobby/              # Entrada de sala (crear/unirse)
│   │   ├── tablero/            # Tablero principal de juego
│   │   ├── ficha/              # Componente individual de ficha
│   │   ├── mano/               # Hand display (fichas del jugador)
│   │   ├── marcador/           # Score display (equipos)
│   │   ├── toast-container/    # Notificaciones
│   │   └── historial/          # Game history
│   ├── services/
│   │   ├── game.service.ts     # Orquestación multiplayer (Supabase)
│   │   ├── enhanced-demo.service.ts  # IA offline (bots)
│   │   ├── audio.service.ts    # 8 sonidos procedurales
│   │   ├── toast.service.ts    # Notificaciones
│   │   └── util.service.ts     # Scoring, persistencia, validación
│   └── app.routes.ts           # Enrutador
├── styles.css                  # Tema gaming (purple/cyan/pink)
└── environments/               # Config Supabase

supabase/
├── functions/
│   ├── crear-sala/             # Crear room (Edge Function)
│   ├── unirse-sala/            # Join room
│   ├── iniciar-partida/        # Start game, repartir fichas
│   ├── realizar-jugada/        # Play tile, scoring
│   ├── siguiente-mano/         # Next hand, reshuffle
│   └── solicitar-companero/    # Ask partner for highest double
└── migrations/
    ├── 20260414104307_init.sql           # Tablas: partidas, jugadores, etc
    ├── 20260414110000_add_room_codes.sql # Códigos de sala
    └── 20260414120000_add_fichas_conteo.sql  # Control de fichas
```

---

## 🛠️ Desarrollo

### Instalación

```bash
npm install
npm start
```

Abre http://localhost:4200

La aplicación se recarga automáticamente cuando cambias los archivos.

### Build

```bash
npm run build
```

Archivos creados en `dist/dominos/`

### Tests (Opcional)

```bash
npm test    # Unit tests
npm run e2e # End-to-end tests
```

---

## 🎯 Características Completadas

### ✅ Dentro del Navegador

- [x] 7 componentes Angular (Lobby, Tablero, Ficha, Mano, Marcador, Toast, Historial)
- [x] 5 servicios (Game, Demo, Audio, Toast, Util)
- [x] UI/UX profesional (tema gaming Twitch-optimizado)
- [x] Animaciones GSAP
- [x] 8 sonidos procedurales generados en código
- [x] Scoring Cubano completo
- [x] Demo offline con IA (EnhancedDemoService)
- [x] Estado reactivo con Signals + Computed

### 🚀 Multiplayer Backend (Supabase)

- [x] 6 Edge Functions completamente implementadas
  - crear-sala, unirse-sala, iniciar-partida
  - realizar-jugada (con pegada + tranque)
  - siguiente-mano (reshuffle automático)
  - solicitar-companero (busca)
- [x] Schema SQL (5 tablas)
- [x] 3 Migraciones listas
- [ ] RLS Policies (crear en Supabase)
- [ ] Autenticación JWT (en progreso)

---

## 📚 Documentación

- **[PLAN_COMPLETACION.md](PLAN_COMPLETACION.md)** - Hoja de ruta, próximas acciones
- **[SUPABASE_SETUP_COMPLETE.md](SUPABASE_SETUP_COMPLETE.md)** - Setup detallado con códigos
- **Código comentado** - Métodos incluyen JSDoc completo

---

## 🎬 Para Streamers

### Demo Mode (Listo AHORA)

```
1. npm start
2. Click "MODO DEMO"
3. ¡A streamear!
```

### Multiplayer (Después de Supabase setup)

```
1. Sigue PLAN_COMPLETACION.md (30 min)
2. Invita 3 amigos a http://tudominio.com
3. Creen salas y jueguen en vivo
```

### Optimizaciones para Stream

- Colores: Purple/Cyan/Pink (alto contraste)
- Animaciones: Suaves, sin lag
- Sonidos: Volumen controlable
- Interfaz: 1080p responsive
- FPS: 60 target (GSAP optimizado)

---

## 🐛 Troubleshooting

### Error: "Las fichas no cargan"

```
→ Comprueba que EnhancedDemoService está inyectado
→ Abre DevTools (F12) → Console
→ Busca errores de importación
```

### Error: "Edge Function not found" (Multiplayer)

```
→ Verifica que creaste los Edge Functions en Supabase
→ Revisa SUPABASE_SETUP_COMPLETE.md paso 6
→ Copia-pega exactamente el código de cada función
```

### Error: ".env.local no se lee"

```
→ Las variables deben tener prefijo VITE_
→ Formato: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
→ Reinicia: Ctrl+C en npm start, luego npm start
```

---

## 🎨 Personalización

### Colores

Edita `src/styles.css` sección `:root`:

```css
--color-primary: #9d4edd; /* Purple */
--color-accent: #00f5ff; /* Cyan */
--color-danger: #ff006e; /* Pink */
```

### Sonidos

Edita `src/app/services/audio.service.ts`:

```typescript
// Cada "play" genera sonido procedural con Web Audio API
this.play("success"); // Frecuencia 800Hz, type sine
```

### Juego

- **Puntos para ganar**: `META_PUNTOS = 200` en Edge Functions
- **Fichas**: 28 (estándar) o 55 (juego largo)
- **Jugadores**: 4 (fijo, requerimiento del dominó)

---

## 📦 Tecnología

- **Frontend**: Angular 17.3 (SSR-ready)
- **UI**: Tailwind CSS + GSAP
- **Backend**: Supabase (PostgreSQL + Edge Functions/Deno)
- **Auth**: Supabase Auth (anonimo mejorado o JWT)
- **Realtime**: Supabase Realtime subscriptions
- **Hosting**: (Supabase integrado o Firebase)

---

## 🤝 Contribuir

Este proyecto está en desarrollo continuo. Para mejoras:

1. Crea una rama: `git checkout -b feature/mi-mejora`
2. Commit cambios: `git commit -am 'Agrego X funcionalidad'`
3. Push: `git push origin feature/mi-mejora`

---

## 📝 Licencia

MIT

---

**¿Problemas? Revisa:**

- [PLAN_COMPLETACION.md](PLAN_COMPLETACION.md) para roadmap
- [SUPABASE_SETUP_COMPLETE.md](SUPABASE_SETUP_COMPLETE.md) para detalles técnicos
- `src/app/services/` para referencia de API

**¡A disfrutar del dominó cubano! 🎲**
