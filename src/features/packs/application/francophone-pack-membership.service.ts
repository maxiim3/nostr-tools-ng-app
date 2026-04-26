import { inject, Injectable } from '@angular/core';

import { PROJECT_INFO } from '../../../core/config/project-info';
import {
  NostrClientService,
  normalizeHexPubkey,
} from '../../../core/nostr/application/nostr-client.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { StarterPackRequestService } from './starter-pack-request.service';

const PACK_EVENT_KIND = 39089;

interface PackReference {
  authorPubkey: string;
  dTag: string;
}

export interface PublicPackMemberEntry {
  pubkey: string;
  username: string;
  description: string | null;
  avatarUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class FrancophonePackMembershipService {
  private readonly nostrClient = inject(NostrClientService);
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

  async listPublicPackMembers(): Promise<PublicPackMemberEntry[]> {
    const packReference = parsePackReference(PROJECT_INFO.packFRUrl);
    const currentPackEvent = await this.findCurrentPackEvent(packReference);

    if (!currentPackEvent) {
      return [];
    }

    const pubkeys = uniquePublicMemberPubkeys(currentPackEvent.tags);
    const profiles = await Promise.all(
      pubkeys.map(async (pubkey) => {
        const profile = await this.nostrClient.fetchProfile(pubkey).catch(() => null);

        return {
          pubkey,
          username: profile?.displayName ?? `${pubkey.slice(0, 12)}...`,
          description: profile?.description ?? null,
          avatarUrl: profile?.imageUrl ?? null,
        };
      })
    );

    return profiles.sort((left, right) => left.username.localeCompare(right.username));
  }

  private async findCurrentPackEvent(packReference: PackReference) {
    const events = await this.nostrClient.fetchEvents([
      {
        kinds: [PACK_EVENT_KIND],
        authors: [packReference.authorPubkey],
        '#d': [packReference.dTag],
        limit: 1,
      },
      {
        '#d': [packReference.dTag],
        limit: 20,
      },
    ]);

    return events.find((event) => {
      if (event.kind !== PACK_EVENT_KIND) {
        return false;
      }

      if (event.pubkey !== packReference.authorPubkey) {
        return false;
      }

      return event.tags.some((tag) => tag[0] === 'd' && tag[1] === packReference.dTag);
    });
  }
}

function parsePackReference(packUrl: string): PackReference {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(packUrl);
  } catch {
    throw new Error('Invalid pack URL.');
  }

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const dTag = pathSegments[0] === 'd' ? pathSegments[1]?.trim() : '';
  if (!dTag) {
    throw new Error('Pack URL is missing the d tag reference.');
  }

  const authorPubkey = normalizeHexPubkey(parsedUrl.searchParams.get('p') ?? '');
  if (!authorPubkey) {
    throw new Error('Pack URL is missing the owner pubkey reference.');
  }

  return {
    authorPubkey,
    dTag,
  };
}

function uniquePublicMemberPubkeys(tags: string[][]): string[] {
  const pubkeys = new Set<string>();

  for (const tag of tags) {
    if (tag[0] !== 'p') {
      continue;
    }

    const pubkey = normalizeHexPubkey(tag[1] ?? '');
    if (pubkey) {
      pubkeys.add(pubkey);
    }
  }

  return [...pubkeys];
}
