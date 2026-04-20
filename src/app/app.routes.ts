import { Routes } from '@angular/router';

import { packAdminGuard } from '../features/packs/presentation/guards/pack-admin.guard';
import { toolAdminGuard } from '../features/tools/presentation/guards/tool-admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../features/home/presentation/pages/home-page.component').then((module) => module.HomePageComponent)
  },
  {
    path: 'design-system',
    loadComponent: () =>
      import('../features/design-system/presentation/pages/design-system-page.component').then(
        (module) => module.DesignSystemPageComponent
      )
  },
  {
    path: 'tools/merge-followers',
    canMatch: [toolAdminGuard],
    loadComponent: () =>
      import('../features/tools/presentation/pages/merge-followers-page.component').then(
        (module) => module.MergeFollowersPageComponent
      )
  },
  {
    path: 'packs/francophone',
    loadComponent: () =>
      import('../features/packs/presentation/pages/pack-home-page.component').then(
        (module) => module.PackHomePageComponent
      )
  },
  {
    path: 'packs/francophone/feed',
    loadComponent: () =>
      import('../features/packs/presentation/pages/pack-feed-page.component').then(
        (module) => module.PackFeedPageComponent
      )
  },
  {
    path: 'packs/francophone/request',
    loadComponent: () =>
      import('../features/packs/presentation/pages/pack-request-page.component').then(
        (module) => module.PackRequestPageComponent
      )
  },
  {
    path: 'packs/francophone/admin/requests',
    canMatch: [packAdminGuard],
    loadComponent: () =>
      import('../features/admin/presentation/pages/pack-admin-requests-page.component').then(
        (module) => module.PackAdminRequestsPageComponent
      )
  },
  {
    path: 'packs/francophone/admin',
    canMatch: [packAdminGuard],
    loadComponent: () =>
      import('../features/admin/presentation/pages/pack-admin-page.component').then(
        (module) => module.PackAdminPageComponent
      )
  },
  {
    path: 'legal/cgu',
    loadComponent: () =>
      import('../features/legal/presentation/pages/legal-cgu-page.component').then(
        (module) => module.LegalCguPageComponent
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];
