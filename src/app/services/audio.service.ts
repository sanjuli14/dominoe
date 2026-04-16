import { Injectable } from '@angular/core';

/**
 * Audio Service - Maneja todos los sonidos del juego
 * Sonidos generados con Web Audio API (no requiere archivos externos)
 */

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private isMuted = false;
  private bgMusicBuffer: AudioBuffer | null = null;
  private bgMusicSource: AudioBufferSourceNode | null = null;
  private bgGainNode: GainNode | null = null;
  private bgMusicPlaying = false;

  constructor() {
    this.initAudioContext();
    this.loadBgMusic();
  }

  private async loadBgMusic() {
    try {
      const response = await fetch(
        'assets/juliush-ritmo-de-cuba-son-cubano-tradicional-503313.mp3',
      );
      const arrayBuffer = await response.arrayBuffer();

      if (this.audioContext) {
        this.bgMusicBuffer =
          await this.audioContext.decodeAudioData(arrayBuffer);
      }
    } catch (e) {
      console.error('Error cargando o decodificando música de fondo', e);
    }
  }

  playBgMusic() {
    if (
      !this.bgMusicBuffer ||
      !this.audioContext ||
      this.bgMusicPlaying ||
      this.isMuted
    )
      return;

    try {
      this.bgMusicSource = this.audioContext.createBufferSource();
      this.bgMusicSource.buffer = this.bgMusicBuffer;
      this.bgMusicSource.loop = true;

      this.bgGainNode = this.audioContext.createGain();
      this.bgGainNode.gain.value = 0.1;

      this.bgMusicSource.connect(this.bgGainNode);
      this.bgGainNode.connect(this.audioContext.destination);

      this.bgMusicSource.start(0);
      this.bgMusicPlaying = true;
    } catch (e) {
      console.warn('Requiere interacción previa', e);
    }
  }

  toggleBgMusic() {
    if (!this.bgMusicBuffer) return false;

    if (this.bgMusicPlaying) {
      this.stopBgMusic();
    } else {
      this.playBgMusic();
    }
    return this.bgMusicPlaying;
  }

  private stopBgMusic() {
    if (this.bgMusicSource) {
      try {
        this.bgMusicSource.stop();
        this.bgMusicSource.disconnect();
      } catch (e) {}
      this.bgMusicSource = null;
    }
    this.bgMusicPlaying = false;
  }

  setBgVolume(volume: number) {
    if (this.bgGainNode) {
      this.bgGainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  private initAudioContext() {
    try {
      const audioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new audioCtx();
    } catch (e) {
      console.error('Web Audio API no soportado', e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.bgMusicPlaying) {
      this.stopBgMusic();
    } else if (!this.isMuted && !this.bgMusicPlaying) {
      this.playBgMusic();
    }
    return this.isMuted;
  }

  // ==================== SONIDOS ====================

  /**
   * Sonido al jugar una ficha - ¡CLACK! fuerte como en la acera
   */
  playFichaClack(esMula: boolean = false) {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Sonido principal - golpe seco de hueso sobre madera
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Frecuencia de impacto seco
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.08);

    // Volumen más alto para el "¡clack!"
    const volumen = esMula ? 0.6 : 0.45;
    gain1.gain.setValueAtTime(volumen, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc1.start(now);
    osc1.stop(now + 0.08);

    // Segundo oscilador para el "resonance" de la mesa
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.frequency.setValueAtTime(150, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    gain2.gain.setValueAtTime(volumen * 0.4, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc2.start(now + 0.02);
    osc2.stop(now + 0.15);
  }

  /**
   * Sonido de victoria - ¡Toma tu data! (más fuerte)
   */
  playDatazo() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Triple golpe fuerte como cuando ganan en la esquina
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + i * 0.12;
      osc.frequency.setValueAtTime(500, startTime);
      osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.1);

      gain.gain.setValueAtTime(0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    }
  }

  /**
   * Sonido de tu turno (suave)
   */
  playTurno() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Sonido de victoria con fanfare
   */
  playVictoria() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const notas = [523, 659, 784, 1047]; // C5, E5, G5, C6 (Do Mayor)

    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + i * 0.15;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  /**
   * Sonido de tranque (incómodo)
   */
  playTranque() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Primer beep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(400, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Segundo beep más bajo
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(300, now + 0.2);
    gain2.gain.setValueAtTime(0.2, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.35);
  }

  /**
   * Sonido de derrota (triste)
   */
  playDerrota() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const notas = [400, 350, 300, 250]; // Notas descendentes

    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + i * 0.15;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  /**
   * Sonido suave de hover/selección
   */
  playHover() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Sonido de mano limpia (limpia del juego)
   */
  playManoLimpia() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Triple sonido de celebración
    const notas = [800, 1000, 800];

    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + i * 0.1;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  /**
   * Sonido de error/ficha inválida
   */
  playError() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Ambience suave (background loop - opcional)
   */
  playAmbience() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(60, now);
    gain.gain.setValueAtTime(0.05, now);

    osc.start(now);
    // Para mantener continuo: no llamar a stop()
    // O usar setTimeout para detenerlo
  }

  /**
   * Pausa el audio context
   */
  pause() {
    if (this.audioContext) {
      this.audioContext.suspend();
    }
  }

  /**
   * Resume el audio context
   */
  resume() {
    if (this.audioContext) {
      this.audioContext.resume();
    }
  }
}
