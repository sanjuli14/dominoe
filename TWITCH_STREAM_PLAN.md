# 🔴 PLAN DE STREAM TWITCH - LA ESQUINA

## 🎯 Objetivo

**Demo completamente funcional lista para jugar EN VIVO en Twitch**

---

## 📋 FASE 1: PREPARACIÓN & POLISH (4-6 horas)

### 1.1 Demo Mode Mejorado ⭐ **CRÍTICO**

- [ ] Crear `enhanced-demo.service.ts` con partida COMPLETAMENTE jugable
- [ ] Auto-play simulado (4 jugadores juegan automáticamente)
- [ ] Modo manual: Streamer controla al equipo 1
- [ ] Asegurarse que `npm run start` inicie sin Supabase
- [ ] Botones para "Nueva Partida" y "Recarga de Demo"

### 1.2 Sonidos & Efectos 🔊

- [ ] Audios necesarios:
  - `ficha-clack.mp3` (sonido al jugar ficha)
  - `turno.mp3` (alertan nuevo turno)
  - `gana.mp3` (equipo gana)
  - `tranque.mp3` (nadie puede jugar)
- [ ] Crear `audio.service.ts` para manejar reproducción
- [ ] Integrar en FichaComponent al jugar
- [ ] Toggle de mute en UI

### 1.3 UI Polish para Twitch 📺

- [ ] Verificar responsive en resolución 1920x1080 (stream típico)
- [ ] Aumentar tamaños de fichas (más visibles)
- [ ] Mejorar contraste de colores
- [ ] Asegurar botones clickeables (tamaño >44px)
- [ ] Verificar y ajustar tipografía (legible en stream)

### 1.4 Animaciones Mejoradas ✨

- [ ] Confetti al ganar (celebración)
- [ ] Shake animation cuando tranque
- [ ] Expand animation fichas seleccionadas
- [ ] Smooth transitions entre turnos
- [ ] Particle effects al jugar ficha

---

## 📋 FASE 2: LÓGICA DE JUEGO (3-4 horas)

### 2.1 Scoring Completo 🎯

- [ ] Implementar cálculo de puntos:
  - Suma de fichas en mano contraria (al fin de mano)
  - +40 Pegue (si jugador más antiguo termina jugando)
  - +20 Salida inicial (bonito extra)
  - +10 Tranque (puntos distribuidos)
- [ ] Barra visual de puntuación (progreso a 200)
- [ ] Mostrar "GANÓ EQUIPO X" cuando llega a 200

### 2.2 Tranque (No hay fichas válidas) 🛑

- [ ] Detectar tranque automáticamente
- [ ] Calcular puntos de tranque
- [ ] Pasar turno al siguiente
- [ ] Mostrar alerta visual "¡TRANQUE!"
- [ ] Reproducir sonido dramatico

### 2.3 Fin de Mano 🎲

- [ ] Detectar cuando alguien juega la última ficha
- [ ] Mostrar "¡MANO LIMPIA!" con animación
- [ ] Sumar puntos de contrarios
- [ ] Avanzar a siguiente mano automáticamente

### 2.4 Sistema de Turnos Mejorado ⏱️

- [ ] Indicador visual de QUIÉN JUEGA (highlight en mano)
- [ ] Mostrar turno actual en grande
- [ ] Animación de "tu turno empieza en X segundos" si es demo
- [ ] Skip turn si nadie puede jugar (tranque)

---

## 📋 FASE 3: NAVEGACIÓN & UX (2-3 horas)

### 3.1 Breadcrumbs / Migas de Pan 🗺️

- [ ] Agregar en top: "Lobby > [Sala Code] > Partida en juego"
- [ ] Click en Lobby para volver
- [ ] Mostrar estado actual claramente

### 3.2 Game State Indicators 📊

- [ ] Mostrar quién está en cada posición
- [ ] Equipos claramente diferenciados (colores)
- [ ] Mano actual (cuántas fichas tiene cada uno)
- [ ] Extremos del tablero (fichas que pueden conectar)

### 3.3 Historial de Jugadas 📜

- [ ] Panel lateral derecho mostrando últimas 5 jugadas
- [ ] Formato: "Equipo A: Jaime jugó 3-4 izquierda"
- [ ] Scrollable si hay muchas
- [ ] (Opcional: estadísticas por equipo)

### 3.4 Controls Accesibles 🖱️

- [ ] Botones principales: JUGAR IZQ / JUGAR DER / PASAR
- [ ] Tamaños grandes (para click rápido en stream)
- [ ] Keyboard shortcuts (ENTER para jugar, ESC para pasar)
- [ ] Confirmación visual antes de jugar

---

## 📋 FASE 4: TWITCH-SPECIFIC FEATURES (2-3 horas)

### 4.1 Twitch-Friendly Layout 📐

- [ ] Dimensiones HD: 1920x1080
- [ ] Chat de Twitch visible en lateral (iframe)
- [ ] Scoreboard flotante sin obscurecer el tablero
- [ ] Botones grandes para accesibilidad en stream

### 4.2 Branding Cubano 🇨🇺

- [ ] Logo "La Esquina" en header
- [ ] Colores cubanos distintivos (rojo, blanco, azul) opcionales
- [ ] Frases cubanas en momentos clave
- [ ] Nombre de equipo customizable (Equipo A → Nombre real)

### 4.3 Mode Selector Mejorado 🎮

- [ ] "AUTO DEMO" - Juego completamente automático
- [ ] "MANUAL DEMO" - Streamer juega vs IA (3 bots)
- [ ] "MULTIPLAYER" - Con Supabase (si está configurado)
- [ ] Botón grande para cambiar modo rápido

### 4.4 Estadísticas & Stats 📈

- [ ] Panel con win rate si hay múltiples partidas
- [ ] "Partidas jugadas hoy"
- [ ] Equipo ganador del stream
- [ ] (Opcional: integración con Twitch API para badges)

---

## 📋 FASE 5: TESTING & REFINEMENT (1-2 horas)

### 5.1 Pruebas Completas ✅

- [ ] Jugar partida manual START TO FINISH
- [ ] Verificar scoring correcto
- [ ] Probar tranque
- [ ] Probar fin de mano
- [ ] Verificar sonidos funcionan
- [ ] Test en 1920x1080 (stream res)

### 5.2 Bug Fixes 🐛

- [ ] Revisar consola por errores
- [ ] Animaciones sin lag
- [ ] Performance en stream (60fps)
- [ ] Responsive en diferentes tamaños

### 5.3 Performance Optimization 🚀

- [ ] Build final sin errors
- [ ] Bundle size < 2MB
- [ ] Load time < 2 segundos
- [ ] No memory leaks detectados

---

## 🔧 HERRAMIENTAS NECESARIAS

| Herramienta       | Uso                                |
| ----------------- | ---------------------------------- |
| Audacity / FFmpeg | Crear/generar sonidos              |
| Chrome DevTools   | Performance testing                |
| OBS Studio        | Preview de stream                  |
| Figma             | Diseño de UI (si cambios visuales) |

---

## 🎬 CHECKLIST PRE-STREAM

```
ANTES DE GRABAR/STREAMEAR:

Funcionalidad:
- [ ] Demo mode funciona al hacer npm start
- [ ] Puedo jugar partida completa sin errores
- [ ] Scoring calcula correctamente
- [ ] Sonidos se escuchan
- [ ] Animaciones muestran bien

Visual:
- [ ] Se ve bien en 1920x1080
- [ ] Fichas son visibles y clickeables
- [ ] Colores son atractivos
- [ ] No hay flashing o movimientos molestos

Performance:
- [ ] 60fps constante
- [ ] Sin lag visible
- [ ] Baja latencia en turnos
- [ ] Carga rápido al iniciar

Streaming:
- [ ] Audio niveles correctos (no muy fuerte)
- [ ] Música de fondo (opcional)
- [ ] Cam setup (si usas)
- [ ] Twitch chat visible (si quieres)
```

---

## 📅 TIMELINE ESTIMADO

| Fase            | Duración      | Prioridad  |
| --------------- | ------------- | ---------- |
| 1.1 Demo Mode   | 45 min        | 🔴 CRÍTICA |
| 1.2 Sonidos     | 30 min        | 🔴 CRÍTICA |
| 1.3 UI Polish   | 45 min        | 🟡 ALTA    |
| 1.4 Animaciones | 30 min        | 🟡 ALTA    |
| 2.1-2.4 Scoring | 180 min       | 🟡 ALTA    |
| 3.1-3.4 UX      | 120 min       | 🟢 MEDIA   |
| 4.1-4.4 Twitch  | 120 min       | 🟢 MEDIA   |
| 5.1-5.3 Testing | 90 min        | 🟡 ALTA    |
| **TOTAL**       | **~12 horas** |            |

---

## 📊 MVP vs NICE-TO-HAVE

### MVP para Stream (NECESARIO)

✅ Demo completamente jugable
✅ Scoring visible
✅ Turnos claros
✅ UI limpia
✅ Sin errores en consola

### Nice-to-Have (SI HAY TIEMPO)

⭐ Confetti al ganar
⭐ Historial de jugadas
⭐ Estadísticas
⭐ Integración Twitch Chat
⭐ IA mejorada

---

## 🎮 COMO VERÁ EL STREAM

```
┌─────────────────────────────────────────┐
│  LOGO LA ESQUINA        BREADCRUMB      │
├──────────────────┬──────────────────────┤
│  TABLERO (70%)   │ HISTORIAL (20%)      │
│                  │ - Equipo A: J.3-4    │
│   🎲🎲🎲        │ - Equipo B: M.5-5    │
│  [Fichas jugadas]│ - Tranque en ronda 3 │
│                  │                      │
├──────────────────┴──────────────────────┤
│ MANO DEL STREAMER (6 fichas)            │
│ [F] [F] [F] [F] [F] [F]                 │
│      ↑ seleccionada                     │
├──────────────────────────────────────────┤
│ MARCADOR: Equipo X: 120 pts  Equipo Y: 95 pts │
│ [▓▓▓▓░░░] vs [▓▓▓░░░░░░]                │
├──────────────────────────────────────────┤
│ CONTROLES: [JUGAR IZQ] [JUGAR DER] [PASAR] │
│ TU TURNO - Selecciona una ficha         │
└──────────────────────────────────────────┘
```

---

## 🚀 NEXT STEP

**EMPEZAR CON FASE 1.1: Demo Mode Mejorado**

---

_Ultima actualización: 14 Abril 2026_
_Status: Plan creado, listos para trabajar_
