import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AudioService } from './services/audio.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: [],
})
export class AppComponent implements OnInit {
  private audioService = inject(AudioService);
  private hasInteracted = false;

  ngOnInit() {
    // Intentar reproducir si es posible, o esperar interacción
  }

  @HostListener('document:click')
  @HostListener('document:keydown')
  onUserInteraction() {
    if (!this.hasInteracted) {
      this.audioService.playBgMusic();
      this.hasInteracted = true;
    }
  }
}
