import { inject, Injectable } from '@angular/core';

import { PROJECT_INFO } from '../../config/project-info';
import { NostrClientService } from './nostr-client.service';
import { NostrSessionService } from './nostr-session.service';

const OWNER_PUBKEY = '15a1989c2c483f6c6f18f2dda1033897a003669f449fc2fda4fa2fb6c9210900';

@Injectable({ providedIn: 'root' })
export class FollowService {
  private readonly client = inject(NostrClientService);
  private readonly session = inject(NostrSessionService);

  async followOwner(): Promise<void> {
    const user = this.session.user();
    if (!user) {
      throw new Error('Authentication required to follow.');
    }

    const events = await this.client.fetchEvents({
      kinds: [3],
      authors: [user.pubkey],
      limit: 1,
    });

    const existing = events[0];
    const existingTags = existing ? (existing.tags as string[][]) : [];
    const alreadyFollowing = existingTags.some((tag) => tag[0] === 'p' && tag[1] === OWNER_PUBKEY);

    if (alreadyFollowing) {
      return;
    }

    const updatedTags = [
      ...existingTags,
      ['p', OWNER_PUBKEY, 'wss://relay.damus.io', PROJECT_INFO.name],
    ];
    const content = existing?.content ?? '';

    await this.client.publishEvent(3, updatedTags, content);
  }
}
