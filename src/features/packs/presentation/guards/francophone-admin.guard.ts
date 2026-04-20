import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';

export const francophoneAdminGuard: CanMatchFn = () => {
  const session = inject(NostrSessionService);
  const router = inject(Router);

  return session.isAdmin() ? true : router.createUrlTree(['/packs/francophone/request']);
};
