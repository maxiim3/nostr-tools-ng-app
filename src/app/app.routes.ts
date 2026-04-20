import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../features/home/presentation/pages/home.page').then((module) => module.HomePage)
  },
  // {
  //   path: 'tools/merge-followers',
  //   canMatch: [toolAdminGuard],
  //   loadComponent: () =>
  //     import('../features/tools/presentation/pages/merge-followers-page.component').then(
  //       (module) => module.MergeFollowersPageComponent
  //     )
  // },
  // {
  //   path: 'packs/francophone',
  //   loadComponent: () =>
  //     import('../features/packs/presentation/pages/pack-home-page.component').then(
  //       (module) => module.PackHomePageComponent
  //     )
  // },
  // {
  //   path: 'packs/francophone/feed',
  //   loadComponent: () =>
  //     import('../features/packs/presentation/pages/pack-feed-page.component').then(
  //       (module) => module.PackFeedPageComponent
  //     )
  // },
  // {
  //   path: 'packs/francophone/request',
  //   loadComponent: () =>
  //     import('../features/packs/presentation/pages/pack-request-page.component').then(
  //       (module) => module.PackRequestPageComponent
  //     )
  // },
  // {
  //   path: 'packs/francophone/admin/requests',
  //   canMatch: [packAdminGuard],
  //   loadComponent: () =>
  //     import('../features/admin/presentation/pages/pack-admin-requests-page.component').then(
  //       (module) => module.PackAdminRequestsPageComponent
  //     )
  // },
  // {
  //   path: 'packs/francophone/admin',
  //   canMatch: [packAdminGuard],
  //   loadComponent: () =>
  //     import('../features/admin/presentation/pages/pack-admin-page.component').then(
  //       (module) => module.PackAdminPageComponent
  //     )
  // },
  // {
  //   path: 'legal/cgu',
  //   loadComponent: () =>
  //     import('../features/legal/presentation/pages/legal-cgu-page.component').then(
  //       (module) => module.LegalCguPageComponent
  //     )
  // },
  {
    path: '**',
    redirectTo: ''
  }
];
