# 🚀 Guía de Deployment - La Esquina

## Opciones de Hosting

### 1. **Firebase App Hosting** (Recomendado para SSR + Backend)

Perfecto para una app con Angular SSR como ésta.

#### Setup

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy
```

**firebase.json:**

```json
{
  "hosting": {
    "public": "dist/dominos/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public,max-age=3600"
          }
        ]
      }
    ]
  }
}
```

---

### 2. **Vercel** (Más rápido, ideal para SSR)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Producción
vercel --prod
```

**vercel.json:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/dominos/browser",
  "framework": "angular"
}
```

---

### 3. **Netlify**

```bash
# Instalar CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist/dominos/browser
```

**netlify.toml:**

```toml
[build]
  command = "npm run build"
  publish = "dist/dominos/browser"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 4. **Docker + Cloud Run** (Google Cloud)

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist/dominos/browser ./dist

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
```

**Deploy:**

```bash
# Build imagen
docker build -t la-esquina:latest .

# Push a Container Registry
docker tag la-esquina:latest gcr.io/PROJECT_ID/la-esquina:latest
docker push gcr.io/PROJECT_ID/la-esquina:latest

# Deploy a Cloud Run
gcloud run deploy la-esquina \
  --image=gcr.io/PROJECT_ID/la-esquina:latest \
  --region=us-central1 \
  --platform=managed
```

---

## Pre-Deployment Checklist

- [ ] Credenciales de Supabase configuradas (no en código)
- [ ] Variables de entorno (.env) creadas
- [ ] Build sin errores: `npm run build`
- [ ] Tests pasando: `npm test`
- [ ] Lint limpio: `npm run lint`
- [ ] Security audit OK: `npm audit`

---

## Variables de Entorno para Deployment

### Firebase Hosting Environment Variables

```bash
firebase functions:config:set supabase.url="https://..." supabase.key="..."
```

### Vercel Environment Variables

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
```

### Netlify Build Variables

En Netlify Dashboard:

- Settings > Build & deploy > Environment
- Agregar variables

---

## Optimización Pre-Deployment

### 1. Angular Production Build

```bash
npm run build -- --configuration production

# O para SSR:
npm run build
```

### 2. Reducir tamaño de bundle

```bash
# Analizar
npm run build -- --stats-json
webpack-bundle-analyzer dist/**/*.json

# Lazy load rutas
# Suspense en componentes
# Tree shaking
```

### 3. Performance

- [ ] Lazy load de rutas
- [ ] Code splitting automático
- [ ] Compresión gzip en servidor
- [ ] CDN para assets estáticos
- [ ] Service Worker (PWA)

---

## Ejemplo: Deploy a Firebase Hosting

### Paso 1: Setup Firebase

```bash
firebase login
firebase init

# Select: Hosting
# Build directory: dist/dominos/browser
# Configure as single page app: Yes
# Overwrite dist/index.html: No
```

### Paso 2: Build

```bash
npm run build
```

### Paso 3: Deploy

```bash
firebase deploy --only hosting
```

### Paso 4: Ver URL

```bash
firebase hosting:sites:list
```

Tu app estará en: `https://your-project.web.app`

---

## CI/CD con GitHub Actions

**.github/workflows/deploy.yml:**

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - run: npm ci
      - run: npm run build

      - uses: actions/checkout@v3
        with:
          repository: firebase/firebase-tools-docker
          path: firebase-tools

      - run: |
          docker run --rm \
            -v ${{ github.workspace }}:/workspace \
            -e FIREBASE_TOKEN=${{ secrets.FIREBASE_TOKEN }} \
            firebase-tools \
            deploy --only hosting
```

Agregar `FIREBASE_TOKEN`:

```bash
firebase login:ci
# Copia el token a GitHub Secrets
```

---

## Monitoring Post-Deploy

### Google Analytics

En `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "GA_ID");
</script>
```

### Error Tracking (Sentry)

```bash
npm install @sentry/angular @sentry/tracing
```

```typescript
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: "https://...",
  environment: "production",
});
```

### Performance Monitoring

```typescript
import { performance } from "./services/performance.service";
performance.track("game-load");
```

---

## Rollback Strategy

### Firebase

```bash
# Ver versiones anteriores
firebase hosting:channels:list

# Deploy a versión anterior
firebase hosting:clone CHANNEL_NAME
```

### Vercel

```bash
# Ver deployments
vercel deployments

# Promover versión anterior
vercel promote <deployment-url>
```

---

## Optimizaciones Específicas para "La Esquina"

1. **Service Worker para modo offline**

   ```bash
   ng add @angular/pwa
   ```

2. **Caché de Assets**

   ```typescript
   // En app.config.ts
   import { withPreloading, PreloadAllModules } from "@angular/router";

   export const appConfig: ApplicationConfig = {
     providers: [withPreloading(PreloadAllModules)],
   };
   ```

3. **Compresión de Imágenes**
   - Convertir fichas a WebP
   - Usar `<picture>` con fallback

4. **Realtime Supabase Optimization**
   ```typescript
   // Solo suscribirse a cambios relevantes
   const channel = supabase.channel(`game:${gameId}`).on(event, filter, callback).subscribe({ skipEmptyChanges: true });
   ```

---

## Troubleshooting Deployment

### Error: "CORS"

- Agregar dominio a Supabase CORS
- Verificar headers de respuesta

### Error: "Out of memory"

- Reducir tamaño de bundle
- Lazy load rutas
- Usar server-side rendering

### Error: "Timeout"

- Optimizar queries Supabase
- Agregar índices a BD
- Usar CDN

---

## Conclusión

Una vez deployado, tu app La Esquina estará:

- 🚀 Disponible 24/7
- ⚡ Con Realtime sincronizado
- 🔒 Seguro con autenticación
- 📊 Monitoreado y escalable

¡A jugar dominó desde cualquier lugar del mundo! 🎲🇨🇺
