import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-44 left-4 space-y-2 z-50">
      <div *ngFor="let toast of toasts()"
           class="px-4 py-3 rounded-lg text-sm font-medium animate-slideInUp"
           [ngClass]="getToastClass(toast.type)">
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
    const baseClasses = 'border shadow-lg';
    switch (type) {
      case 'success':
        return `${baseClasses} border-accent-success bg-twitch-dark text-accent-success`;
      case 'error':
        return `${baseClasses} border-accent-live bg-twitch-dark text-accent-live`;
      case 'info':
        return `${baseClasses} border-twitch-purple bg-twitch-dark text-twitch-purple-light`;
      case 'cubano':
        return `${baseClasses} border-twitch-purple bg-twitch-purple text-white`;
      default:
        return `${baseClasses} border-twitch-gray bg-twitch-dark text-twitch-text`;
    }
  }
}
