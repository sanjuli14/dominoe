# 🚀 Quick Commands & Cheatsheet

## Comandos Más Usados

### 🏃 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run start

# Build para producción
npm run build

# Ejecutar tests
npm run test

# Limpiar dist/
rm -rf dist/

# Reinstalar dependencias
rm -rf node_modules package-lock.json && npm install
```

### 🔧 Supabase

```bash
# Login
supabase login

# Ver estado local
supabase status

# Ejecutar migraciones
supabase db push

# Crear nueva migración
supabase migration new nombre_migracion

# Ejecutar consultas SQL
supabase sql

# Ver logs de Edge Functions
supabase functions list
```

### 🌐 Deployment

#### Firebase

```bash
firebase login
npm run build
firebase deploy --only hosting
firebase open hosting:site
```

#### Vercel

```bash
npm i -g vercel
vercel --prod
# Sigue las instrucciones interactivas
```

#### Docker

```bash
docker build -t la-esquina .
docker run -p 8080:8080 la-esquina
```

### 📚 Git Workflow

```bash
# Crear rama para feature
git checkout -b feature/nombre-feature

# Commit con estándar Conventional
git commit -m "feat: descripción del cambio"

# Push a origin
git push origin feature/nombre-feature

# Crear PR en GitHub (o GitLab, etc)
```

## Variables de Entorno Críticas

```bash
# .env / .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxx...
```

**⚠️ NUNCA commitear .env con credenciales reales**

## File Shortcuts

| Archivo                                           | Propósito                       |
| ------------------------------------------------- | ------------------------------- |
| `src/app/services/game.service.ts`                | Lógica central del juego        |
| `src/app/components/tablero/tablero.component.ts` | Renderizado del tablero         |
| `src/app/services/toast.service.ts`               | Notificaciones y Tallas Cubanas |
| `src/app/config/supabase.config.ts`               | Config de credenciales          |
| `tailwind.config.js`                              | Tema y colores                  |
| `styles.css`                                      | Estilos globales y animaciones  |
| `supabase/schema.sql`                             | Estructura de BD                |

## Debugging

### Ver estado en consola

```typescript
// En game.service.ts
console.log("Estado actuales:", this.jugadores());
console.log("Mi jugador:", this.miJugador());
console.log("Extremos:", this.extremosActuales());
```

### Activar grid de depuración

En `tablero.component.ts`:

```typescript
debug = signal(true); // Muestra grid invisible
```

### Ver logs de Supabase

```bash
supabase logs realtime
supabase logs regular
```

### Chrome DevTools

1. F12 para abrir DevTools
2. Console para errores
3. Network para verificar subscriptions realtime
4. Application > Storage para localStorage

## Problemas Comunes

### ❌ "Cannot find Supabase client"

**Solución**: Verificar `supabase.config.ts` tiene credenciales correctas

```bash
echo "URL: $VITE_SUPABASE_URL"
echo "KEY: $VITE_SUPABASE_ANON_KEY"
```

### ❌ "Fichas no aparecen en tablero"

**Solución**: Verificar que `fichasEnMesa` signal tiene datos

```typescript
console.log("Fichas en mesa:", this.game.fichasEnMesa());
```

### ❌ "Realtime no sincroniza"

**Solución**:

1. Verificar WebSocket: Chrome DevTools > Network > WS
2. Revisar RLS policies en Supabase
3. Reiniciar subscription: `setCurrentGame(gameId)`

### ❌ "Build falla con estilos"

**Solución**:

```bash
rm -rf .angular/ node_modules/
npm install
npm run build
```

### ❌ "Puerto 4200 en uso"

**Solución**:

```bash
ng serve --port 4201 --open
# O matar proceso
lsof -ti:4200 | xargs kill -9
```

## Performance Tips

- **GSAP**: Usar `killTweensOf()` para evitar memory leaks
- **Signals**: No crear signals en templates, calcular en componente
- **Build**: `npm run build -- --configuration production` para optimizaciones
- **Bundle**: Usar `ng build --stats-json && webpack-bundle-analyzer`

## Testing Workflow

```bash
# Unit tests
ng test --watch

# E2E tests (Cypress/Playwright)
ng e2e

# Coverage report
ng test --code-coverage
```

## Code Quality

```bash
# Linter (ESLint)
npm run lint

# Format code (Prettier recomendado)
npm install -D prettier
prettier --write "src/**/*.ts"

# Type check
npx tsc --noEmit
```

## Monitoreo en Producción

### Sentry (Error Tracking)

```bash
npm install @sentry/angular
```

### Firebase Analytics

```bash
npm install firebase
# Configurar en environment.prod.ts
```

### Datadog (APM)

```bash
npm install @datadog/browser-rum
```

## Security Checklist

- [ ] RLS policies en Supabase configuradas
- [ ] Credenciales no en repositorio
- [ ] CORS headers configurados
- [ ] Input validation en forms
- [ ] XSS protection habilitada
- [ ] CSRF tokens (si aplica)

## Útiles

### Generar Alias en Terminal

```bash
# En ~/.bashrc o ~/.zshrc
alias la-esquina="cd /home/juliocesar/Documentos/VSC/dominos && npm run start"
alias la-build="cd /home/juliocesar/Documentos/VSC/dominos && npm run build"
alias la-test="cd /home/juliocesar/Documentos/VSC/dominos && npm run test"

source ~/.bashrc  # Recargar
```

### VS Code Extensions Recomendados

- Angular Language Service
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- GitLens
- Thunder Client (API testing)

### Documentación Rápida

- [Angular 17 Docs](https://angular.io)
- [Signals Guide](https://angular.io/guide/signals)
- [Supabase Realtime](https://supabase.io/docs/guides/realtime)
- [Tailwind CSS](https://tailwindcss.com)
- [GSAP Docs](https://gsap.com/docs)

---

**Tip**: Guarda este archivo y consulta cuando necesites recordar comandos comunes 🚀
