import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: "John's Car App",
    loadComponent: () => import('./cars/pages/car-list/car-list').then(({ CarList }) => CarList),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
