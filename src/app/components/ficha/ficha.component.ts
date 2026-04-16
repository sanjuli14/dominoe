import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';

export interface Ficha {
  id?: string;
  valor_a: number;
  valor_b: number;
}

@Component({
  selector: 'app-ficha',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #fichaElement
      class="ficha-base relative cursor-grab active:cursor-grabbing
             transition-all duration-300 hover:scale-110
             select-none"
      [class.w-32]="!vertical"
      [class.h-16]="!vertical"
      [class.w-16]="vertical"
      [class.h-32]="vertical"
      [style.transform]="'rotate(' + rotation + 'deg)'"
      (click)="onClick()"
      (mousedown)="onMouseDown($event)"
      [class.opacity-50]="disabled"
      [class.cursor-not-allowed]="disabled"
    >
      <!-- SVG Horizontal -->
      <svg *ngIf="!vertical" class="w-full h-full" viewBox="0 0 64 32" preserveAspectRatio="xMidYMid meet">
        <defs>
          <!-- Aged ivory/cream gradient - envejecido como ficha de verdad -->
          <linearGradient id="hueso-h-{{id}}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFF8F0" />
            <stop offset="30%" stop-color="#F5E6D3" />
            <stop offset="70%" stop-color="#E8D4B8" />
            <stop offset="100%" stop-color="#D4C4A8" />
          </linearGradient>
          <!-- Aged metallic divider -->
          <linearGradient id="metallic-h-{{id}}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#6B5344" />
            <stop offset="30%" stop-color="#B8A090" />
            <stop offset="50%" stop-color="#D4C4B0" />
            <stop offset="70%" stop-color="#B8A090" />
            <stop offset="100%" stop-color="#6B5344" />
          </linearGradient>
          <!-- Subtle pip relief - matte effect -->
          <filter id="pipRelief-h-{{id}}">
            <feDropShadow dx="0.2" dy="0.2" stdDeviation="0.2" flood-color="#000" flood-opacity="0.4"/>
          </filter>
          <!-- Aging texture filter -->
          <filter id="aging-h-{{id}}">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.03 0" in="noise" result="coloredNoise"/>
            <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite"/>
            <feBlend mode="multiply" in="composite" in2="SourceGraphic"/>
          </filter>
        </defs>

        <!-- Long street-lamp shadow -->
        <rect x="3" y="4" width="62" height="30" rx="4" fill="rgba(0,0,0,0.4)" filter="blur(2px)"/>
        <!-- Base ficha - aged ivory -->
        <rect x="0" y="0" width="64" height="32" rx="4" [attr.fill]="'url(#hueso-h-' + id + ')'" stroke="#8B7355" stroke-width="0.8"/>
        <!-- Aged border -->
        <rect x="1.5" y="1.5" width="61" height="29" rx="3" fill="none" stroke="rgba(107,83,68,0.3)" stroke-width="0.5"/>

        <!-- Divider line -->
        <line x1="32" y1="2" x2="32" y2="30" [attr.stroke]="'url(#metallic-h-' + id + ')'" stroke-width="2"/>
        <line x1="31" y1="2" x2="31" y2="30" stroke="rgba(60,40,30,0.3)" stroke-width="0.5"/>
        <line x1="33" y1="2" x2="33" y2="30" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>

        <!-- Matte black pips - slightly irregular for realism -->
        <g transform="translate(16, 16)">
          <circle *ngFor="let pip of getPips(valor_a); let i = index" 
                  [attr.cx]="pip.x * 1.1" 
                  [attr.cy]="pip.y * 1.6" 
                  r="2.2" 
                  fill="#1a1a1a"
                  [attr.opacity]="0.9 + (i % 2) * 0.05"
                  [attr.filter]="'url(#pipRelief-h-' + id + ')'"/>
        </g>
        <g transform="translate(48, 16)">
          <circle *ngFor="let pip of getPips(valor_b); let i = index" 
                  [attr.cx]="pip.x * 1.1" 
                  [attr.cy]="pip.y * 1.6" 
                  r="2.2" 
                  fill="#1a1a1a"
                  [attr.opacity]="0.9 + (i % 2) * 0.05"
                  [attr.filter]="'url(#pipRelief-h-' + id + ')'"/>
        </g>
      </svg>

      <!-- SVG Vertical -->
      <svg *ngIf="vertical" class="w-full h-full" viewBox="0 0 32 64" preserveAspectRatio="xMidYMid meet">
        <defs>
          <!-- Aged ivory gradient for vertical -->
          <linearGradient id="hueso-v-{{id}}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFF8F0" />
            <stop offset="30%" stop-color="#F5E6D3" />
            <stop offset="70%" stop-color="#E8D4B8" />
            <stop offset="100%" stop-color="#D4C4A8" />
          </linearGradient>
          <!-- Aged metallic divider horizontal -->
          <linearGradient id="metallic-v-{{id}}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6B5344" />
            <stop offset="30%" stop-color="#B8A090" />
            <stop offset="50%" stop-color="#D4C4B0" />
            <stop offset="70%" stop-color="#B8A090" />
            <stop offset="100%" stop-color="#6B5344" />
          </linearGradient>
          <!-- Matte pip relief -->
          <filter id="pipRelief-v-{{id}}">
            <feDropShadow dx="0.2" dy="0.2" stdDeviation="0.2" flood-color="#000" flood-opacity="0.4"/>
          </filter>
        </defs>

        <!-- Long street-lamp shadow for vertical -->
        <rect x="3" y="4" width="30" height="62" rx="4" fill="rgba(0,0,0,0.4)" filter="blur(2px)"/>
        <!-- Base ficha - aged ivory -->
        <rect x="0" y="0" width="32" height="64" rx="4" [attr.fill]="'url(#hueso-v-' + id + ')'" stroke="#8B7355" stroke-width="0.8"/>
        <!-- Aged border -->
        <rect x="1.5" y="1.5" width="29" height="61" rx="3" fill="none" stroke="rgba(107,83,68,0.3)" stroke-width="0.5"/>

        <!-- Horizontal divider -->
        <line x1="2" y1="32" x2="30" y2="32" [attr.stroke]="'url(#metallic-v-' + id + ')'" stroke-width="2"/>
        <line x1="2" y1="31" x2="30" y2="31" stroke="rgba(60,40,30,0.3)" stroke-width="0.5"/>
        <line x1="2" y1="33" x2="30" y2="33" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>

        <!-- Matte black pips for vertical -->
        <g transform="translate(16, 14)">
          <circle *ngFor="let pip of getPips(valor_a); let i = index" 
                  [attr.cx]="pip.x * 1.4" 
                  [attr.cy]="pip.y * 1.4" 
                  r="2.2" 
                  fill="#1a1a1a"
                  [attr.opacity]="0.9 + (i % 2) * 0.05"
                  [attr.filter]="'url(#pipRelief-v-' + id + ')'"/>
        </g>
        <g transform="translate(16, 50)">
          <circle *ngFor="let pip of getPips(valor_b); let i = index" 
                  [attr.cx]="pip.x * 1.4" 
                  [attr.cy]="pip.y * 1.4" 
                  r="2.2" 
                  fill="#1a1a1a"
                  [attr.opacity]="0.9 + (i % 2) * 0.05"
                  [attr.filter]="'url(#pipRelief-v-' + id + ')'"/>
        </g>
      </svg>

      <!-- Selection indicator -->
      <div *ngIf="selected" class="absolute inset-0 rounded-lg border-2 border-twitch-purple animate-twitch-glow pointer-events-none"></div>
    </div>
  `,
  styles: [
    `
      .dot {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      :host {
        display: inline-block;
      }
    `,
  ],
})
export class FichaComponent {
  @Input() valor_a = 0;
  @Input() valor_b = 0;
  @Input() id?: string;
  @Input() disabled = false;
  @Input() selected = false;
  @Input() rotation = 0;
  @Input() vertical = false; // Nueva propiedad para orientación vertical
  @Output() fichaClicked = new EventEmitter<Ficha>();
  @Output() fichaDoubleClicked = new EventEmitter<Ficha>();

  fichaElement: HTMLElement | null = null;
  private lastClickTime = 0;

  generateDots(value: number): number[] {
    const patterns: { [key: number]: number[] } = {
      0: [],
      1: [0],
      2: [0, 1],
      3: [0, 1, 2],
      4: [0, 1, 2, 3],
      5: [0, 1, 2, 3, 4],
      6: [0, 1, 2, 3, 4, 5],
      7: [0, 1, 2, 3, 4, 5, 6],
      8: [0, 1, 2, 3, 4, 5, 6, 7],
      9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    };
    return patterns[value] || [];
  }

  // Posiciones de los pips (puntos) en el patrón de dominó
  getPips(valor: number): { x: number; y: number }[] {
    const d = 6; // Distancia desde centro
    const positions: { [key: number]: { x: number; y: number }[] } = {
      0: [],
      1: [{ x: 0, y: 0 }],
      2: [{ x: -d, y: -d }, { x: d, y: d }],
      3: [{ x: -d, y: -d }, { x: 0, y: 0 }, { x: d, y: d }],
      4: [{ x: -d, y: -d }, { x: d, y: -d }, { x: -d, y: d }, { x: d, y: d }],
      5: [{ x: -d, y: -d }, { x: d, y: -d }, { x: 0, y: 0 }, { x: -d, y: d }, { x: d, y: d }],
      6: [{ x: -d, y: -d }, { x: -d, y: 0 }, { x: -d, y: d }, { x: d, y: -d }, { x: d, y: 0 }, { x: d, y: d }],
      7: [{ x: -d, y: -d }, { x: 0, y: -d }, { x: d, y: -d }, { x: 0, y: 0 }, { x: -d, y: d }, { x: 0, y: d }, { x: d, y: d }],
      8: [{ x: -d, y: -d }, { x: 0, y: -d }, { x: d, y: -d }, { x: -d, y: 0 }, { x: d, y: 0 }, { x: -d, y: d }, { x: 0, y: d }, { x: d, y: d }],
      9: [{ x: -d, y: -d }, { x: 0, y: -d }, { x: d, y: -d }, { x: -d, y: 0 }, { x: 0, y: 0 }, { x: d, y: 0 }, { x: -d, y: d }, { x: 0, y: d }, { x: d, y: d }],
    };
    return positions[valor] || [];
  }

  onClick() {
    if (this.disabled) return;

    const now = Date.now();
    const isDoubleClick = now - this.lastClickTime < 300;
    this.lastClickTime = now;

    const ficha: Ficha = {
      id: this.id,
      valor_a: this.valor_a,
      valor_b: this.valor_b,
    };

    if (isDoubleClick) {
      this.fichaDoubleClicked.emit(ficha);
      this.animateClick();
    } else {
      this.fichaClicked.emit(ficha);
    }
  }

  onMouseDown(event: MouseEvent) {
    if (this.disabled) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - event.clientX;
      const deltaY = moveEvent.clientY - event.clientY;
      this.animateDrag(offsetX, offsetY, deltaX, deltaY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  private animateClick() {
    if (!this.fichaElement) return;
    gsap.to(this.fichaElement, {
      scale: 1.1,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
    });
  }

  private animateDrag(
    offsetX: number,
    offsetY: number,
    deltaX: number,
    deltaY: number,
  ) {
    if (!this.fichaElement) return;
    gsap.to(this.fichaElement, {
      x: deltaX,
      y: deltaY,
      duration: 0.1,
      overwrite: 'auto',
    });
  }

  animateFly(targetX: number, targetY: number, duration: number = 0.6) {
    if (!this.fichaElement) return;
    gsap.to(this.fichaElement, {
      x: targetX,
      y: targetY,
      duration,
      ease: 'back.out',
      scale: 1.05,
    });
  }

  animateToHand() {
    if (!this.fichaElement) return;
    gsap.to(this.fichaElement, {
      x: 0,
      y: 0,
      duration: 0.3,
      ease: 'back.out',
    });
  }
}
