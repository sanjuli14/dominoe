# 🔴 LA ESQUINA - LIVE STREAM GUIDE

## ✅ PRE-STREAM VERIFICATION (5 MIN)

Antes de presionar "GO LIVE" en Twitch:

```bash
# 1. Verificar que todo esté compilado
cd /home/juliocesar/Documentos/VSC/dominos
npm run build

# 2. Si build pasó, iniciar dev server
npm run start

# Debería abrir: http://localhost:4200
```

### Visual Checklist

- [ ] Page carga sin errores (F12 para abrir DevTools)
- [ ] Fichas se ven grandes y claras
- [ ] Botones son visibles y clickeables
- [ ] Colores cubanos se ven bien
- [ ] Fuentes son legibles

### Audio Checklist

- [ ] Volumen está en un nivel cómodo (no distorsionado)
- [ ] Sonidos de fichas se escuchan bien
- [ ] No hay clicks o pops

---

## 🎮 CÓMO EMPEZAR UN STREAM

### Opción 1: MODO AUTO (Espectáculo puro)

```
1. En Lobby → Click "PRUEBA RÁPIDA"
2. Esperar a que la partida cargue
3. Bots juegan automáticamente
4. Puedes comentar mientras ves
```

**Ventaja**: Sin tener que jugar, puedes focusarte en hablar
**Desventaja**: Menos control, menos interacción

### Opción 2: MODO MANUAL (Lo mejor para Twitch)

```
1. En Lobby → Click "PRUEBA RÁPIDA"
2. Tablero abre en MODO MANUAL
3. TÚ controlass tu equipo (Posición 0)
4. Los 3 bots juegan automáticamente
5. Comenta tus decisiones, explica estrategia
```

**Ventaja**: Interactivo, educativo, profesional
**Desventaja**: Requiere saber las reglas básicamente

---

## 🎯 GAMEPLAY BASICO

### Tu Mano (Abajo)

```
Verás tus fichas aquí
- Click en una ficha para seleccionar (se levanta)
- Botones aparecen:
  ◄ IZQUIERDA  |  DERECHA ►  | ✕ CANCELAR
```

### Tablero (Centro)

```
Las fichas se colocan automáticamente en serpiente
Puedes ver los extremos
Fichas dobles (mulas) están rotadas 90°
```

### Marcador (Arriba derecha)

```
Equipo 0 vs Equipo 1
Barras de progreso hacia 200 puntos
Indicador de turno actual
```

### Historial (Derecha)

```
Últimas jugadas realizadas
Tipo de jugada (Jugada, Paso, Mano limpia)
Timestamp usando "hace X segundos"
```

---

## 📢 NARRACIÓN RECOMENDADA

### Al empezar

```
"Bienvenidos a La Esquina, un dominó doble 9
en línea. Yo soy el equipo rojo (STREAMER).
Los otros tres son bots controlados por IA.
El objetivo es llegar a 200 puntos primero.

Empezamos con 7 fichas cada uno..."
```

### Durante el juego

```
"Voy a jugar un 3-4 en la izquierda..."
[click]
"Ahora turno del bot..."

"Mira la serpiente de fichas en el medio,
se coloca automáticamente."

"¡Tranque! Nadie puede jugar. Distribuimos
puntos y comenzamos nueva mano."
```

### Al ganar

```
"¡GANAMOS! Mi equipo llegó a 200 primero.
Fue una partida intensa, ¿verdad?"
```

---

## 🎬 OBS SETUP (Opcional)

### Recomendado para Twitch

```toml
# Resolution: 1920x1080 (Full HD)
# FPS: 60 (para fluidity)
# Bitrate: 6000 kbps (para buena calidad)

# Audios
- Desktop Audio: De la PC
- Mic: Tu voz
- Volumen: equilibrado, sin picos
```

### Scene

```
[] Browser Source
   URL: http://localhost:4200
   Width: 1920
   Height: 1080
   (Sin BrowserUI)

[] Camera (opcional, overlay top-left)

[] Chat Overlay (opcional, top-right)
```

---

## 🚨 TROUBLESHOOTING DURANTE STREAM

| Problema               | Solución                                           |
| ---------------------- | -------------------------------------------------- |
| Pantalla negra         | F5 para recargar, Ctrl+Shift+R para hard refresh   |
| Fichas no aparecen     | Click en Historial → Vuelve a cargar la página     |
| Sonidos no se escuchan | Verifica volumen del browser (🔊 icon)             |
| Botones no clickean    | Browser zoom es muy alto, presiona Ctrl+0          |
| Lag visible            | Dile a stream que está optimizando, recarga página |
| ¿Se cierra ventana?    | Tienes otra tab acaparando recursos, ciérrala      |

---

## 💡 PRO TIPS

### Mantén el Chat Enganchado

```
"Comunidad, ¿qué ficha debería jugar?
Dejen su voto en chat..."

→ Implementa un mini-voting en el futuro
```

### Explica Las Reglas

```
"El dominó tiene dos equipos.
Los puntos se restan de los otros...

Las fichas dobles (mulas) se rotan así [gesto]"
```

### Usa El Historial

```
"Miren el panel derecho, pueden ver
todas las jugadas que se hicieron..."
```

### Speed-run

```
Abre "MODO AUTO" para 2-3 partidas rápidas
Luego explica estrategia en "MODO MANUAL"
```

---

## 📊 SAMPLE STREAM STRUCTURE (2 horas)

```
00:00-05:00  | Introducción, setup
05:00-20:00  | MODO AUTO (2 partidas completamente automáticas)
20:00-25:00  | Explicar reglas mientras ves el historial
25:00-60:00  | MODO MANUAL (jugar 4-5 partidas explicando)
60:00-70:00  | Q&A del chat
70:00-90:00  | Más MODO MANUAL, velocidad más rápida
90:00-120:00 | Repetir secciones favoritas, despedida
```

---

## 🔐 SEGURIDAD & PRIVACY

```
✅ NO expongas nada sensible:
   - URLs de Supabase
   - API Keys
   - Credenciales personales

✅ Si streameas código, cubre:
   - Archivos .env
   - Keys en URL
   - Información de BD
```

---

## 🎥 POST-STREAM

### Guardar VOD

```
1. Twitch → Videos → Crear Highlight
2. Dar nombre descriptivo
3. Compartir en redes
```

### Analytics

```
Twitch Stats → Peak viewers
¿Cuál modo gustó más? (Auto vs Manual)
¿Qué momentos fueron más emocionantes?
```

### Mejorar Para Próximo Stream

```
- Grabar notas de qué salió bien/mal
- Agregar features que pidió el chat
- Practicar narración
```

---

## 🎯 COMMANDS RÁPIDOS

```bash
# Si algo falla, en terminal:
npm run start                      # Reinicia dev
Ctrl+C                            # Para servidor
npm run build && npm run start    # Build + run

# En navegador:
Ctrl+Shift+R                      # Hard refresh
F12                               # DevTools
F11                               # Fullscreen
```

---

## 📱 MOBILE VIEW (Si lo necesitas)

```
Responsive en:
✓ Desktop (1920x1080)
✓ Tablet (iPad)
✗ Mobile (pantaia muy pequeña)

Para mobile stream:
- Usar laptop/desktop para mejor experiencia
```

---

## 🇨🇺 CUBANO STREAMER TIPS

```
"¡Suena el zapato!"        → Cuando alguien juega
"¡Paso y gano!"            → Al pasar turno
"Mula doble"               → Fichas con mismo valor
"Tranque salao"            → Acción llena de drama
"¡Arrastro!"               → Cuando ganas con mano limpia

Usa estos en momentos clave
para máximo engagement del chat cubano 🇨🇺
```

---

## ✨ FLESHING OUT FEATURES (FUTURO)

Cosas que podrías agregar en siguientes streams:

- [ ] Chat integration (Twitch API)
- [ ] Leaderboard en pantalla
- [ ] Betting system (puntos de canal)
- [ ] Sound effects personalizados
- [ ] Overlay con estadísticas en vivo
- [ ] Multi-view (4 jugadores con faces separadas)
- [ ] Integración con Discord

---

## 🆘 SOPORTE RÁPIDO

Si tienes problemas:

1. **Console errors**: F12 → Console tab → Screenshot
2. **Build failure**: `npm run build` → Copy error message
3. **Performance**: Close other tabs in browser
4. **Audio issues**: Mute/unmute botón en page

---

**¡LISTO PARA STREAM! 🚀**

Presiona GO LIVE en Twitch y que comience la magia cubana.

_última actualización: 14 Abril 2026_
