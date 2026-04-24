import { Routes } from '@angular/router';

import { francophoneAdminGuard } from '../features/packs/presentation/guards/francophone-admin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'packs/francophone',
  },
  {
    path: 'packs/francophone',
    loadComponent: () =>
      import('../features/home/presentation/pages/home.page').then((module) => module.HomePage),
  },
  {
    path: 'home-test-3',
    loadComponent: () =>
      import('../features/home-test/presentation/pages/home-test-3.page').then(
        (module) => module.HomeTest3Page
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
    redirectTo: 'packs/francophone',
  },
];
