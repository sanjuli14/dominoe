import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/lobby/lobby.component').then(
        (m) => m.LobbyComponent,
      ),
  },
  {
    path: 'partida/:id',
    loadComponent: () =>
      import('./components/tablero/tablero.component').then(
        (m) => m.TableroComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
