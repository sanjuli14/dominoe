# 🎲 LA ESQUINA - Dominó Doble 9

Frontend premium para domino cubano estilo "Plato" construido con Angular 17, Tailwind CSS, Signals y Supabase.

## Características Principales

✨ **Interfaz Premium Dark**

- Diseño con estética de mesa de fieltro oscuro (felt)
- Colores gold y cobre para una sensación de lujo
- Animaciones suaves con GSAP

🎮 **Jugabilidad Completa**

- Soporte para 4 jugadores en 2 equipos
- Algoritmo de serpiente para posicionar fichas automáticamente
- Sistema de turnos en tiempo real con Supabase
- Reglas del dominó cubano (bonos, tranques, etc.)

🔄 **Sincronización en Tiempo Real**

- Supabase Realtime para actualización de estado
- Signals de Angular para reactividad
- Actualización automática del tablero

🎭 **Inmersión Cubana**

- "Tallas Cubanas": frases aleatorias auténticas del juego
- Sonidos de clack al jugar fichas
- Interfaz completamente en español

## Requisitos Previos

- Node.js ^18.0.0
- npm o yarn
- Cuenta de Supabase (para backend)

## Instalación

1. **Clonar el repositorio**

```bash
git clone <repo-url>
cd dominos
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
```

Editar `.env` y añadir tus credenciales de Supabase:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key
```

4. **Configurar Supabase**

```bash
# Hacer login en Supabase CLI
supabase login

# Conectar al proyecto
supabase link --project-ref=tu-project-ref

# Ejecutar migraciones
supabase db push
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run start

# La app estará disponible en http://localhost:4200/
```

## Compilación

```bash
# Build para producción
npm run build

# Salida en ./dist/
```

## Estructura de Carpetas

```
src/
├── app/
│   ├── components/
│   │   ├── ficha/          # Componente visual de fichas
│   │   ├── tablero/        # Tablero principal del juego
│   │   ├── mano/           # Panel de fichas del jugador
│   │   ├── marcador/       # Puntuación flotante
│   │   ├── lobby/          # Pantalla de inicio
│   │   └── toast-container/ # Notificaciones
│   ├── services/
│   │   ├── game.service.ts    # Lógica principal del juego
│   │   └── toast.service.ts   # Sistema de notificaciones
│   ├── config/
│   │   └── supabase.config.ts # Variables de configuración
│   ├── app.component.ts
│   └── app.routes.ts
└── styles.css               # Estilos globales con Tailwind
```

## Arquitectura

### GameService

Corazón de la aplicación que maneja:

- Estado del juego con Signals
- Conexión a Supabase (CRUD)
- Suscripción a cambios en tiempo real
- Lógica de validación de jugadas

### Componentes Visuales

- **FichaComponent**: Representación de una ficha con puntos y animaciones
- **TableroComponent**: Lienzo principal con el algoritmo de serpiente
- **ManoComponent**: UI inferior para seleccionar y jugar fichas
- **MarcadorComponent**: Puntuación flotante y estado del juego

## Flujo del Juego

1. **Lobby**: Crear sala o unirse con código
2. **Repartición**: Jugadores reciben 7 fichas (inicial: 10 para Doble 9)
3. **Turno del Jugador**: Jugar una ficha en izquierda o derecha
4. **Automático**: Fichas se posicionan en serpiente en el tablero
5. **Sincronización**: Todos ven cambios en tiempo real
6. **Tranque**: Si no hay juego, ganador con menos puntos en mano
7. **Puntuación**: +40 por pegue + puntos del contrario + bonos

## Reglas Cubanas Implementadas

- ✅ Puntuación a 200 puntos
- ✅ Bonos por pegue (+40)
- ✅ Bono de salida inicial (+20)
- ✅ Tranque automático
- ✅ Mulas perpendiculares al flujo
- ✅ Tallas Cubanas (mensajes aleatorios)

## Personalización

### Cambiar Colores

Editar `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'felt': { /* ... */ },
      'gold': '#ecc89a',
      // ...
    }
  }
}
```

### Agregar Tallas Cubanas

Editar en `src/app/services/toast.service.ts`:

```typescript
private tallasCubanas = [
  '¡Tu frase aquí!',
  // ...
];
```

## API de Supabase Esperada

Ver `supabase/schema.sql` para el esquema completo. Tablas principales:

- `partidas`: Juegos activos
- `jugadores`: Datos de jugadores
- `manos`: Rondas dentro de cada juego
- `fichas_manos`: Fichas en mano del jugador (privada)
- `fichas_mesa`: Fichas jugadas en el tablero

## Depuración

En `TableroComponent`, hay un botón de debug para ver la grid de la serpiente:

```typescript
debug = signal(false); // Cambiar a true
```

## Deployment

### Firebase Hosting / App Hosting

```bash
npm run build
firebase deploy
```

### Vercel

```bash
vercel
```

### Netlify

```bash
netlify deploy --prod
```

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repo
2. Crea rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre Pull Request

## Licencia

MIT

## Créditos

Desarrollado con ❤️ y 🇨🇺 para los amantes del dominó cubano.

## Soporte

¿Preguntas o problemas?

- Abre un Issue en GitHub
- Contacta al equipo de desarrollo

---

**Hecho en Cuba. Jugado en cualquier lugar del mundo. 🎲**
