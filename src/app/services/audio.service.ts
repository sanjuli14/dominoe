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

  constructor() {
    this.initAudioContext();
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
    return this.isMuted;
  }

  // ==================== SONIDOS ====================

  /**
   * Sonido al jugar una ficha (clic plástico)
   */
  playFichaClack() {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
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
