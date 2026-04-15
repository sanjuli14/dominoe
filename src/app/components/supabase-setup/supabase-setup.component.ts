import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-supabase-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md"
    >
      <div
        class="glass-panel p-12 max-w-2xl rounded-3xl border border-gold/30 shadow-2xl max-h-[90vh] overflow-auto"
      >
        <h1 class="gaming-title text-4xl text-gold mb-6 text-center">
          ⚙️ CONFIGURA SUPABASE
        </h1>

        <div class="space-y-6 text-ivory">
          <!-- Instrucciones -->
          <div class="bg-felt-700 p-6 rounded-xl border border-gold/20">
            <h2 class="gaming-subtitle text-lg text-gold mb-4">
              📋 PASOS RÁPIDOS:
            </h2>
            <ol class="space-y-3 text-sm">
              <li class="flex gap-3">
                <span class="text-gold font-bold">1.</span>
                <span
                  >Ve a
                  <a
                    href="https://app.supabase.com"
                    target="_blank"
                    class="text-cyan-400 hover:underline"
                    >app.supabase.com</a
                  >
                  y crea un proyecto</span
                >
              </li>
              <li class="flex gap-3">
                <span class="text-gold font-bold">2.</span>
                <span
                  >En <strong>Settings → API</strong>, copia
                  <strong>Project URL</strong> y
                  <strong>anon public</strong></span
                >
              </li>
              <li class="flex gap-3">
                <span class="text-gold font-bold">3.</span>
                <span>Pega tus credenciales abajo</span>
              </li>
            </ol>
          </div>

          <!-- Campos de entrada -->
          <div class="space-y-4">
            <div>
              <label class="block text-gold gaming-subtitle text-sm mb-2"
                >Project URL</label
              >
              <input
                [(ngModel)]="supabaseUrl"
                placeholder="https://abc123xyz456.supabase.co"
                class="w-full px-4 py-3 bg-felt-700 border border-gold/30 rounded-lg text-ivory placeholder-ivory/40
                       focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 font-mono text-sm"
              />
              <p class="text-ivory/50 text-xs mt-1">
                🔍 Encontrada en: Settings → API → Project URL
              </p>
            </div>

            <div>
              <label class="block text-gold gaming-subtitle text-sm mb-2"
                >Anon Public Key</label
              >
              <input
                [(ngModel)]="supabaseKey"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                class="w-full px-4 py-3 bg-felt-700 border border-gold/30 rounded-lg text-ivory placeholder-ivory/40
                       focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 font-mono text-sm"
              />
              <p class="text-ivory/50 text-xs mt-1">
                🔍 Encontrada en: Settings → API → Project API Keys → anon
              </p>
            </div>
          </div>

          <!-- Preview -->
          <div
            *ngIf="supabaseUrl() || supabaseKey()"
            class="bg-gold/10 p-4 rounded-xl border border-gold/30"
          >
            <p class="gaming-subtitle text-sm text-gold mb-3">
              ✓ Credenciales detectadas:
            </p>
            <div class="space-y-2 font-mono text-xs text-ivory/70">
              <p *ngIf="supabaseUrl()">
                URL:
                <span class="text-cyan-400"
                  >{{ supabaseUrl().substring(0, 40) }}...</span
                >
              </p>
              <p *ngIf="supabaseKey()">
                KEY:
                <span class="text-cyan-400"
                  >{{ supabaseKey().substring(0, 40) }}...</span
                >
              </p>
            </div>
          </div>

          <!-- Advertencia -->
          <div
            class="bg-amber-900/30 border border-amber-600/50 p-4 rounded-lg"
          >
            <p class="gaming-subtitle text-amber-400 text-sm mb-2">
              ⚠️ IMPORTANTE:
            </p>
            <p class="text-ivory/70 text-xs">
              Estas credenciales se guardarán en el navegador. Usa una clave
              Supabase con permisos limitados para testing.
            </p>
          </div>

          <!-- Botones -->
          <div class="flex gap-4">
            <button
              (click)="guardarConfiguracion()"
              [disabled]="!supabaseUrl() || !supabaseKey() || guardando()"
              class="flex-1 px-6 py-4 bg-gradient-to-r from-gold to-copper text-ebony font-bold rounded-lg
                     hover:scale-105 transition-all gaming-subtitle disabled:opacity-50"
            >
              {{ guardando() ? '⏳ GUARDANDO...' : '✓ GUARDAR Y CONTINUAR' }}
            </button>
            <button
              (click)="usarDemo()"
              class="px-6 py-4 bg-ivory/10 border border-ivory/30 text-ivory rounded-lg
                     hover:bg-ivory/20 transition-all gaming-subtitle"
            >
              O MODO DEMO
            </button>
          </div>

          <!-- Helper -->
          <p class="text-ivory/50 text-xs text-center">
            💡 Si necesitas ayuda, abre la consola (F12) para ver detalles
            técnicos
          </p>
        </div>
      </div>
    </div>
  `,
})
export class SupabaseSetupComponent {
  supabaseUrl = signal('');
  supabaseKey = signal('');
  guardando = signal(false);

  guardarConfiguracion() {
    const url = this.supabaseUrl().trim();
    const key = this.supabaseKey().trim();

    if (!url || !key) {
      alert('Por favor, ingresa ambas credenciales');
      return;
    }

    // Validar que se parece a una URL de Supabase
    if (!url.includes('supabase.co')) {
      alert('La URL no parece válida. Debe incluir "supabase.co"');
      return;
    }

    // Guardar en localStorage
    localStorage.setItem('SUPABASE_URL_OVERRIDE', url);
    localStorage.setItem('SUPABASE_KEY_OVERRIDE', key);

    this.guardando.set(true);
    // Recargar página para aplicar nuevas credenciales
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  usarDemo() {
    // Ir a modo demo
    localStorage.setItem('MODO_DEMO', 'true');
    window.location.href = '/';
  }
}
