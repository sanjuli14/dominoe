// Supabase Configuration
import { environment } from '../../environments/environment';

class SupabaseConfigManager {
  private url: string = '';
  private key: string = '';

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    // Use environment.ts configuration first (most reliable)
    if (environment.supabaseUrl && !environment.supabaseUrl.includes('your-supabase')) {
      this.url = environment.supabaseUrl;
    }
    if (environment.supabaseAnonKey && !environment.supabaseAnonKey.includes('your-supabase')) {
      this.key = environment.supabaseAnonKey;
    }

    // Try localStorage overrides (set via setup component)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const overrideUrl = localStorage.getItem('SUPABASE_URL_OVERRIDE');
      const overrideKey = localStorage.getItem('SUPABASE_KEY_OVERRIDE');

      if (overrideUrl) this.url = overrideUrl;
      if (overrideKey) this.key = overrideKey;
    }

    // Try to load from window (injected by build process)
    if (typeof window !== 'undefined' && (window as any)['SUPABASE_URL']) {
      this.url = (window as any)['SUPABASE_URL'];
    }
    if (typeof window !== 'undefined' && (window as any)['SUPABASE_KEY']) {
      this.key = (window as any)['SUPABASE_KEY'];
    }

    // Validate we have real credentials
    if (!this.url || this.url.includes('your-supabase')) {
      console.error('❌ SUPABASE_URL no configurada correctamente');
    }
    if (!this.key || this.key.includes('your-supabase')) {
      console.error('❌ SUPABASE_KEY no configurada correctamente');
    }
  }

  getUrl(): string {
    return this.url;
  }

  getKey(): string {
    return this.key;
  }

  setUrl(url: string) {
    this.url = url;
  }

  setKey(key: string) {
    this.key = key;
  }

  isConfigured(): boolean {
    return !!this.url && !!this.key && 
           !this.url.includes('your-supabase') && 
           !this.key.includes('your-supabase');
  }
}

export const supabaseConfigManager = new SupabaseConfigManager();

export const supabaseConfig = {
  get url() {
    return supabaseConfigManager.getUrl();
  },
  get key() {
    return supabaseConfigManager.getKey();
  },
  get isConfigured() {
    return supabaseConfigManager.isConfigured();
  },
};

export const appConfig = {
  appName: 'La Esquina',
  gameVersion: '1.0.0',
  targetScore: 200,
  maxPlayers: 4,
  initialTilesPerPlayer: 7,
  debug: false,
};
