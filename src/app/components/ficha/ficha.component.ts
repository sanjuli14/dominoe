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
      class="ficha-base w-32 h-16 relative cursor-grab active:cursor-grabbing
             bg-gradient-to-b from-ivory via-yellow-50 to-yellow-100
             rounded-lg shadow-ficha border-2 border-amber-300
             transition-all duration-300 hover:scale-110 hover:shadow-2xl
             flex items-center justify-center gap-1
             select-none"
      [style.transform]="'rotate(' + rotation + 'deg)'"
      (click)="onClick()"
      (mousedown)="onMouseDown($event)"
      [class.opacity-50]="disabled"
      [class.cursor-not-allowed]="disabled"
    >
      <!-- Centro hendido -->
      <div class="absolute inset-0 flex">
        <div
          class="w-1/2 border-r-2 border-amber-300 flex flex-col items-center justify-center"
        >
          <div
            class="aspect-square w-full p-2 flex flex-wrap content-center justify-center gap-1"
          >
            <!-- Puntos lado A -->
            <ng-container *ngFor="let i of generateDots(valor_a)">
              <div class="w-2.5 h-2.5 bg-ebony rounded-full dot"></div>
            </ng-container>
          </div>
        </div>
        <div class="w-1/2 flex flex-col items-center justify-center">
          <div
            class="aspect-square w-full p-2 flex flex-wrap content-center justify-center gap-1"
          >
            <!-- Puntos lado B -->
            <ng-container *ngFor="let i of generateDots(valor_b)">
              <div class="w-2.5 h-2.5 bg-ebony rounded-full dot"></div>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Efecto de relieve -->
      <div
        class="absolute inset-0 rounded-lg pointer-events-none
               shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.1)]"
      ></div>

      <!-- Indicador de selección -->
      <div
        *ngIf="selected"
        class="absolute inset-0 rounded-lg border-2 border-gold animate-pulse-glow"
      ></div>
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

  onClick() {
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
