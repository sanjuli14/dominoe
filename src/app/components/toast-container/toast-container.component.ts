import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-40 right-4 space-y-2 z-50">
      <div
        *ngFor="let toast of toasts()"
        [@toastAnimation]
        class="px-6 py-3 rounded-lg font-bold text-sm gaming-subtitle
               shadow-lg animate-slideInUp
               transition-all duration-300"
        [ngClass]="getToastClass(toast.type)"
      >
        {{ toast.message }}
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes slideInUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .animate-slideInUp {
        animation: slideInUp 0.3s ease-out;
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
    const baseClasses = 'border';
    switch (type) {
      case 'success':
        return `${baseClasses} border-success bg-success/20 text-success`;
      case 'error':
        return `${baseClasses} border-error bg-error/20 text-error`;
      case 'info':
        return `${baseClasses} border-ivory/30 bg-ivory/10 text-ivory`;
      case 'cubano':
        return 'bg-gradient-to-r from-gold to-copper text-ebony border-0 shadow-neon';
      default:
        return baseClasses;
    }
  }
}
