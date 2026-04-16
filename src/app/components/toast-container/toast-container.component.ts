import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 flex flex-col items-center justify-center space-y-4 z-[100] pointer-events-none"
    >
      <div
        *ngFor="let toast of toasts()"
        class="px-8 py-4 md:px-12 md:py-6 rounded-2xl text-2xl md:text-5xl font-extrabold uppercase tracking-wider animate-zoomIn flex items-center justify-center text-center shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-md pointer-events-none transition-all"
        [ngClass]="getToastClass(toast.type)"
      >
        {{ toast.message }}
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes zoomIn {
        0% {
          transform: scale(0.5) translateY(50px);
          opacity: 0;
        }
        60% {
          transform: scale(1.1) translateY(-10px);
        }
        100% {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }

      .animate-zoomIn {
        animation: zoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
    `,
  ],
})
export class ToastContainerComponent {
  toasts = signal<any[]>([]);

  constructor(private toastService: ToastService) {
    this.toasts = this.toastService.toasts;
  }

  getToastClass(type: string): string {
    const baseClasses = 'border-4 shadow-[0_10px_60px_rgba(0,0,0,0.9)]';
    switch (type) {
      case 'success':
        return `${baseClasses} border-accent-success bg-twitch-dark/95 text-accent-success`;
      case 'error':
        return `${baseClasses} border-accent-live bg-twitch-dark/95 text-accent-live`;
      case 'info':
        return `${baseClasses} border-twitch-purple bg-twitch-dark/95 text-twitch-purple-light`;
      case 'cubano':
        return `${baseClasses} border-twitch-purple bg-twitch-dark/95 text-twitch-purple-light`;
      default:
        return `${baseClasses} border-twitch-gray bg-twitch-dark/95 text-white`;
    }
  }
}
