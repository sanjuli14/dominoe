# 💡 Patrones & Arquitectura

## Patrones Utilizados

### 1. Signals Pattern (Angular 17+) 📡

**Uso**: Estado reactivo sin RxJS boilerplate

```typescript
// Definición
partida = signal<Partida | null>(null);
jugadores = signal<Jugador[]>([]);
manoActual = signal<number>(0);

// Lectura (automáticamente reactivo)
<p>Mano actual: {{ manoActual() }}</p>

// Actualización
this.partida.set(newPartida);
this.jugadores.update(prev => [...prev, newJugador]);

// Computed (derivado, lazy-evaluated)
miJugador = computed(() => {
  return this.jugadores().find(j => j.id === this.miId);
});
```

**Ventajas**:

- Sin memory leaks de subscriptions
- Change detection automático
- Type-safe
- No necesita async pipe

**Desventajas**:

- Requiere Angular 17+
- Aprendizaje nuevo para equipo RxJS

---

### 2. Service-Owned State Pattern 🏗️

**Uso**: GameService es dueño único del estado

```typescript
// ✅ CORRECTO: Service es el guardian del estado
export class GameService {
  partida = signal<Partida>(...)
  jugadores = signal<Jugador[]>(...)

  constructor(private supabase: SupabaseClient) {}

  jugarFicha(ficha: Ficha, lado: 'izq'|'der') {
    // Validar
    // Actualizar signals locales
    // Llamar Supabase RPC
    // Escuchar cambios via Realtime
  }
}

// ✅ CORRECTO: Component lee desde service computed
export class TableroComponent {
  fichasEnMesa = this.game.fichasEnMesa;
  esmiTurno = this.game.esmiTurno;

  constructor(private game: GameService) {}
}

// ❌ INCORRECTO: No crear signals en componentes
export class WrongComponent {
  misFichas = signal([]); // Evitar esto
}
```

**Patrón**:

```
Service (dueño) → Signals (estado)
                    ↓
              Computed (derivados)
                    ↓
             Component (consumidor)
```

---

### 3. Supabase Realtime Subscription Pattern 🔄

**Uso**: Sincronización bidireccional con backend

```typescript
subscribeToChanges() {
  // Tabla: partidas
  this.supabase
    .channel('partidas-changes')
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'partidas' },
      (payload: any) => {
        this.partida.set(payload.new);
      })
    .subscribe();

  // Tabla: fichas_mesa
  this.supabase
    .channel('mesa-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'fichas_mesa' },
      (payload: any) => {
        // Inserción: nueva ficha jugada
        // Actualización: cambio de estado
        // Eliminación: raramente usado
      })
    .subscribe();
}
```

**Flujo**:

```
Cliente A: jugarFicha()
        ↓
    RPC call a Supabase
        ↓
BD actualiza fichas_mesa
        ↓
Trigger postgres_changes
        ↓
Cliente B y C reciben UPDATE
        ↓
Signals se actualizan automáticamente
```

---

### 4. Component Communication Pattern 🔗

**Nivel 1: Parent → Child** (via @Input)

```typescript
@Input() fichas: Ficha[] = [];
@Input() esmiTurno: boolean = false;
```

**Nivel 2: Child → Parent** (via @Output + EventEmitter)

```typescript
@Output() fichaSeleccionada = new EventEmitter<{
  ficha: Ficha;
  lado: 'izquierda' | 'derecha';
}>();

onFichaClicked(ficha: Ficha) {
  this.fichaSeleccionada.emit({ ficha, lado: 'izquierda' });
}
```

**Nivel 3: Datos Globales** (via Service injected)

```typescript
constructor(private game: GameService) {
  // Acceder a jugadores(), fichasEnMesa(), etc
  this.game.partida() // Leer estado global
}
```

**Patrón Recomendado**:

```
Parent Input → Component Properties → Internal Signals
                                        ↓
                                   Template
                                        ↓
                                   @Output Event
                                        ↓
                                  Parent Handler
                                        ↓
                                  Service mutation
```

---

### 5. Algoritmo de Serpiente - Snake Pathfinding 🐍

**Propósito**: Posicionar fichas automáticamente en grid invisible

```typescript
private calculateFichaX(orden: number): number {
  const cellSize = 60;        // pixels por celda
  const containerWidth = 800; // ancho del tablero

  let x = orden * cellSize;

  // Wrap al borde derecho
  if (x > containerWidth) {
    x = (x % containerWidth) || containerWidth;
  }

  return this.startX + x;
}

private calculateFichaY(orden: number): number {
  const cellSize = 60;
  const containerWidth = 800;

  // Incrementar row cada wrap
  const row = Math.floor((orden * cellSize) / containerWidth);

  return this.startY + (row * cellSize);
}
```

**Visualización**:

```
Orden 0:  [F]___
Orden 1:  [F][F]
...
Orden 13: [F][F][F][F][F][F][F]
          [F][F][F][F]...
```

---

### 6. Animation Pattern con GSAP 🎬

**Componente con animaciones**:

```typescript
import gsap from "gsap";

export class FichaComponent {
  @ViewChild("fichaEl") fichaEl!: ElementRef;

  animateFly(targetX: number, targetY: number, duration: number = 0.5) {
    gsap.to(this.fichaEl.nativeElement, {
      x: targetX,
      y: targetY,
      duration: duration,
      ease: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      onComplete: () => {
        console.log("Animación completada");
      },
    });
  }

  animateDrag(fromX: number, fromY: number) {
    gsap.fromTo(this.fichaEl.nativeElement, { x: fromX, y: fromY, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.3 });
  }
}
```

**Evitar Memory Leaks**:

```typescript
ngOnDestroy() {
  gsap.killTweensOf(this.fichaEl.nativeElement);
}
```

---

### 7. Toast Notification Service Pattern 🎭

**Patrón Observer**:

```typescript
export interface Toast {
  id: string;
  mensaje: string;
  tipo: "success" | "error" | "info" | "cubano";
  duration: number;
}

export class ToastService {
  toasts = signal<Toast[]>([]);

  showToast(msg: string, type: "success" | "error" | "info" | "cubano", duration = 3000) {
    const id = Date.now().toString();
    const toast = { id, mensaje: msg, tipo: type, duration };

    this.toasts.update((prev) => [...prev, toast]);

    // Auto-remove después de duration
    setTimeout(() => this.removeToast(id), duration);
  }

  showCubano(delay = 500) {
    const talla = this.tallasCubanas[Math.floor(Math.random() * this.tallasCubanas.length)];

    setTimeout(() => {
      this.showToast(talla, "cubano", 4000);
    }, delay);
  }
}

// Consumidor
export class ToastContainerComponent {
  constructor(private toast: ToastService) {}

  toasts = this.toast.toasts; // Lectura reactiva
}
```

---

### 8. Type Safety con Interfaces 🎯

**Modelos de dominio**:

```typescript
export interface Ficha {
  id: string;
  valor_a: number; // 0-9
  valor_b: number; // 0-9
  en_juego: boolean;
}

export interface FichaEnMesa extends Ficha {
  orden: number; // Posición en serpiente
  lado_jugado: "a" | "b"; // Lado conectado
}

export interface Jugador {
  id: string;
  posicion: 0 | 1 | 2 | 3; // Orden de turno
  equipo: 0 | 1; // Team A o B
  fichas_mano: number; // Cantidad (no Array, por privacy)
}

export interface Partida {
  id: string;
  estado: "lobby" | "activa" | "finalizada";
  tiene_salida: boolean;
  turno_posicion: 0 | 1 | 2 | 3;
}
```

**Validación**:

```typescript
canPlayFicha(ficha: Ficha): boolean {
  const extremos = this.extremosActuales();

  // Type guard
  if (!extremos) return false;

  // Validación
  return (
    ficha.valor_a === extremos.izq ||
    ficha.valor_a === extremos.der ||
    ficha.valor_b === extremos.izq ||
    ficha.valor_b === extremos.der
  );
}
```

---

### 9. Environment Configuration Pattern 🔐

**Lazy loading seguro**:

```typescript
export class SupabaseConfigManager {
  private static instance: SupabaseConfigManager;
  private _url: string = "";
  private _key: string = "";

  static getInstance(): SupabaseConfigManager {
    if (!SupabaseConfigManager.instance) {
      SupabaseConfigManager.instance = new SupabaseConfigManager();
    }
    return SupabaseConfigManager.instance;
  }

  get url(): string {
    if (!this._url) {
      this._url = import.meta.env.VITE_SUPABASE_URL || "";
    }
    return this._url;
  }

  get key(): string {
    if (!this._key) {
      this._key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
    }
    return this._key;
  }
}

// Uso
const config = SupabaseConfigManager.getInstance();
const client = createClient(config.url, config.key);
```

**Ventajas**:

- Credenciales no expuestas en imports
- Singleton para reutilización
- Fácil para testing con mocks

---

### 10. Standalone Components Pattern 🏃

**Estructura moderna (Angular 17)**:

```typescript
@Component({
  selector: "app-ficha",
  standalone: true,
  imports: [CommonModule, GSAP], // Importar dependencias locales
  template: `...`,
  styles: [`...`],
})
export class FichaComponent {
  // Sin modularizar, sin declarations
}

// En app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    GameService,
    ToastService,
    // Otros servicios globales
  ],
};
```

**Ventajas**:

- Sin NgModule boilerplate
- Lazy loading automático
- Tree-shaking mejorado

---

## Anti-Patrones Evitados

❌ **No hacer**:

```typescript
// 1. Signals en componentes (estado distribuido)
fichas = signal([]);

// 2. Directamente mutando arrays
this.jugadores.push(new Jugador()); // Usa .update()

// 3. Multiple subscriptions sin unsubscribe
this.game.fichasEnMesa.subscribe(...); // Leak de memoria

// 4. Props como signals en @Input
@Input() misFichas = signal([]);  // Use plain property

// 5. Nested change detection (async pipe en template)
<ficha [dados]="game.fichasEnMesa | async"></ficha> // Evitar si pasado signal

// 6. Hardcoding valores mágicos
const X_POSITION = 100; // Mejor: const CELL_SIZE = 60

// 7. Lógica de negocio en componentes
jugarFicha() { ... } // Debe estar en GameService
```

---

## Decisiones Arquitectónicas Clave

| Decisión               | Razón                                      |
| ---------------------- | ------------------------------------------ |
| Signals over RxJS      | Menos boilerplate, mejor DX en Angular 17  |
| Service-owned state    | Single source of truth, debugging fácil    |
| Standalone components  | No NgModule clutter, modern Angular        |
| Supabase Realtime      | Realtime out-of-box, menos servidor        |
| GSAP over CSS          | Controles programáticos, 60fps garantizado |
| Tailwind CSS           | Utility-first, rápido desarrollo UI        |
| TypeScript strict      | Catch bugs en compile-time                 |
| Component @Input plain | Signals solo internos, inputs simples      |

---

## Testing Patterns

### Unit Test Mockeo

```typescript
describe("GameService", () => {
  let service: GameService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jasmine.createSpy("from").and.returnValue({
        select: jasmine.createSpy("select"),
      }),
    };

    TestBed.configureTestingModule({
      providers: [GameService, { provide: SupabaseClient, useValue: mockSupabase }],
    });

    service = TestBed.inject(GameService);
  });

  it("debe cargar partida", () => {
    service.setCurrentGame("123");
    expect(service.partida()).toBeDefined();
  });
});
```

---

## Performance Tips

1. **Change Detection**: Signals hacen OnPush automático
2. **Lazy Loading**: Routes con `loadComponent: () => import(...)`
3. **Virtual Scrolling**: Para muchas fichas, usar CDK virtual scroll
4. **Image Optimization**: Usar next-gen formats (webp)
5. **Tree Shaking**: RxJS operators = dynamic imports

---

## Convenciones de Código

### Nombres

```typescript
- Signals: camelCase (fichasEnMesa)
- Interfaces: PascalCase (Partida, Jugador)
- Classes: PascalCase (GameService)
- Constants: SCREAMING_SNAKE_CASE (DEFAULT_TILES = 7)
- Private: _prefixedCamelCase (_loadJugador)
```

### Organizaci

```
src/
├── app/
│   ├── components/
│   │   ├── ficha/
│   │   │   ├── ficha.component.ts
│   │   │   ├── ficha.component.html
│   │   │   └── ficha.component.css
│   ├── services/
│   │   ├── game.service.ts
│   │   └── toast.service.ts
│   └── config/
│       └── supabase.config.ts
```

---

## Recursos & Referencias

- [Angular 17 Best Practices](https://angular.io)
- [Signals Deep Dive](https://angular.io/guide/signals)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [GSAP Performance Tips](https://gsap.com/resources/get-started/)
- [Tailwind Best Practices](https://tailwindcss.com/docs/optimization)

---

**¡Usa estos patrones como referencia para mantener código limpio y mantenible! 📚**
