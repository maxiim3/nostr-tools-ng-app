import { inject, Injectable } from '@angular/core';

import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { StarterPackRequestService } from './starter-pack-request.service';

@Injectable({ providedIn: 'root' })
export class FrancophonePackMembershipService {
  private readonly requests = inject(StarterPackRequestService);
  private readonly session = inject(NostrSessionService);

  async isCurrentUserMember(): Promise<boolean> {
    const currentUser = this.session.user();
    if (!currentUser) {
      return false;
    }

    const state = await this.requests.getUserState();
    return state.status === 'joined';
  }

  async isMember(pubkey: string): Promise<boolean> {
    const currentUser = this.session.user();
    if (!currentUser || currentUser.pubkey !== pubkey) {
      return false;
    }

    return this.isCurrentUserMember();
  }
}
