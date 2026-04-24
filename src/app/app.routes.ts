import { Routes } from '@angular/router';

import { francophoneAdminGuard } from '../features/packs/presentation/guards/francophone-admin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('../features/home/presentation/pages/home.page').then((module) => module.HomePage),
  },
  {
    path: 'packs',
    pathMatch: 'full',
    redirectTo: 'packs/francophone',
  },
  {
    path: 'packs/francophone',
    loadComponent: () =>
      import('../features/packs/presentation/pages/pack-fr.page').then(
        (module) => module.PackFRPage
      ),
  },
  {
    path: 'packs/francophone/request',
    loadComponent: () =>
      import('../features/packs/presentation/pages/pack-request.page').then(
        (module) => module.PackRequestPage
      ),
  },
  {
    path: 'packs/francophone/admin/requests',
    canMatch: [francophoneAdminGuard],
    loadComponent: () =>
      import('../features/admin/presentation/pages/pack-admin-requests.page').then(
        (module) => module.PackAdminRequestsPage
      ),
  },
  {
    path: 'legal/cgu',
    loadComponent: () =>
      import('../features/legal/presentation/pages/legal-cgu.page').then(
        (module) => module.LegalCguPage
      ),
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
