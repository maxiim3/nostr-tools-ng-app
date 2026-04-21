import { inject, Injectable } from '@angular/core';

import { PROJECT_INFO } from '../../../core/config/project-info';
import { NostrClientService } from '../../../core/nostr/application/nostr-client.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';

const PACK_EVENT_KIND = 39089;

interface PackReference {
  authorPubkey: string;
  dTag: string;
}

@Injectable({ providedIn: 'root' })
export class FrancophonePackMembershipService {
  private readonly nostrClient = inject(NostrClientService);
  private readonly session = inject(NostrSessionService);

  async isCurrentUserMember(): Promise<boolean> {
    const currentUser = this.session.user();
    if (!currentUser) {
      return false;
    }

    return this.isMember(currentUser.pubkey);
  }

  async isMember(pubkey: string): Promise<boolean> {
    const normalizedPubkey = normalizeHexPubkey(pubkey);
    if (!normalizedPubkey) {
      return false;
    }

    const packReference = parsePackReference(PROJECT_INFO.packFRUrl);
    const currentPackEvent = await this.loadPackEvent(packReference);

    return hasMemberTag(currentPackEvent.tags, normalizedPubkey);
  }

  async addMember(requesterPubkey: string): Promise<void> {
    const normalizedRequesterPubkey = normalizeHexPubkey(requesterPubkey);
    if (!normalizedRequesterPubkey) {
      throw new Error('Invalid requester pubkey.');
    }

    const packReference = parsePackReference(PROJECT_INFO.packFRUrl);
    this.assertPublisherAccess(packReference);

    const currentPackEvent = await this.loadPackEvent(packReference);

    if (hasMemberTag(currentPackEvent.tags, normalizedRequesterPubkey)) {
      return;
    }

    const updatedTags = addMemberTag(
      currentPackEvent.tags,
      normalizedRequesterPubkey,
      packReference.dTag
    );
    await this.nostrClient.publishEvent(PACK_EVENT_KIND, updatedTags, currentPackEvent.content);
  }

  private async loadPackEvent(packReference: PackReference) {
    const [currentPackEvent] = await this.nostrClient.fetchEvents({
      kinds: [PACK_EVENT_KIND],
      authors: [packReference.authorPubkey],
      '#d': [packReference.dTag],
      limit: 1,
    });

    if (!currentPackEvent) {
      throw new Error('Unable to load the current pack event.');
    }

    return currentPackEvent;
  }

  private assertPublisherAccess(packReference: PackReference): void {
    const currentUser = this.session.user();

    if (!currentUser) {
      throw new Error('Authentication is required to publish a pack update.');
    }

    const normalizedCurrentPubkey = normalizeHexPubkey(currentUser.pubkey);
    if (!normalizedCurrentPubkey || normalizedCurrentPubkey !== packReference.authorPubkey) {
      throw new Error('The connected account cannot publish this pack.');
    }
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

  const authorPubkey = normalizeHexPubkey(parsedUrl.searchParams.get('p'));
  if (!authorPubkey) {
    throw new Error('Pack URL is missing the owner pubkey reference.');
  }

  return {
    authorPubkey,
    dTag,
  };
}

function hasMemberTag(tags: string[][], memberPubkey: string): boolean {
  return tags.some((tag) => tag[0] === 'p' && normalizeHexPubkey(tag[1]) === memberPubkey);
}

function addMemberTag(tags: string[][], memberPubkey: string, dTag: string): string[][] {
  const nextTags = tags.map((tag) => [...tag]);

  if (
    !nextTags.some(
      (tag) => tag[0] === 'd' && typeof tag[1] === 'string' && tag[1].trim().length > 0
    )
  ) {
    nextTags.unshift(['d', dTag]);
  }

  nextTags.push(['p', memberPubkey]);
  return nextTags;
}

function normalizeHexPubkey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(trimmedValue) ? trimmedValue : null;
}
