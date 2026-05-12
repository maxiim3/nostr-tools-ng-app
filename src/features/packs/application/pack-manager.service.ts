import { inject, Injectable } from '@angular/core';
import { nip19 } from 'nostr-tools';

import {
  normalizeHexPubkey,
  NostrClientService,
  type SessionUser,
} from '../../../core/nostr/application/nostr-client.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';

const STARTER_PACK_KIND = 39089;
const FOLLOWING_SPACE_ORIGIN = 'https://following.space';

export interface OwnedPackSummary {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  dTag: string;
  memberCount: number;
  url: string;
  createdAt: number;
}

export interface PackMember {
  pubkey: string;
  npub: string;
  username: string;
  avatarUrl: string | null;
  primalUrl: string;
}

interface PackEvent {
  id?: string;
  pubkey: string;
  kind?: number;
  tags: string[][];
  content?: string;
  created_at?: number;
}

interface PackReference {
  authorPubkey: string;
  dTag: string;
}

@Injectable({ providedIn: 'root' })
export class PackManagerService {
  private readonly client = inject(NostrClientService);
  private readonly session = inject(NostrSessionService);

  async listOwnedPacks(): Promise<OwnedPackSummary[]> {
    const user = this.requireCurrentUser();
    const events = await this.fetchOwnedPackEvents(user.pubkey);

    return events
      .map((event) => toOwnedPackSummary(event, user.pubkey))
      .filter((pack): pack is OwnedPackSummary => pack !== null)
      .sort((left, right) => right.createdAt - left.createdAt);
  }

  async listPackMembers(packId: string): Promise<PackMember[]> {
    const user = this.requireCurrentUser();
    const event = await this.findOwnedPackEvent(user.pubkey, packId);
    if (!event) {
      throw new Error('Selected pack was not found.');
    }

    const pubkeys = uniquePackMemberPubkeys(event.tags);
    const members = await Promise.all(pubkeys.map((pubkey) => this.toPackMember(pubkey)));

    return members.sort((left, right) => left.username.localeCompare(right.username));
  }

  async listPackMembersFromUrl(packUrl: string): Promise<PackMember[]> {
    const packReference = parsePackReference(packUrl);
    const event = await this.findPackEventByReference(packReference);
    if (!event) {
      throw new Error('Pack was not found.');
    }

    const pubkeys = uniquePackMemberPubkeys(event.tags);
    const members = await Promise.all(pubkeys.map((pubkey) => this.toPackMember(pubkey)));

    return members.sort((left, right) => left.username.localeCompare(right.username));
  }

  async addPackMembers(packId: string, pubkeys: readonly string[]): Promise<void> {
    const user = this.requireCurrentUser();
    const memberPubkeys = uniqueNormalizedPubkeys(pubkeys);
    if (memberPubkeys.length === 0) {
      throw new Error('Invalid member pubkey.');
    }

    const event = await this.findOwnedPackEvent(user.pubkey, packId);
    if (!event) {
      throw new Error('Selected pack was not found.');
    }

    const existingPubkeys = new Set(uniquePackMemberPubkeys(event.tags));
    const tagsToAdd = memberPubkeys.filter((pubkey) => !existingPubkeys.has(pubkey));
    if (tagsToAdd.length === 0) {
      return;
    }

    const nextTags = [...event.tags, ...tagsToAdd.map((pubkey) => ['p', pubkey])];
    await this.client.publishEvent(STARTER_PACK_KIND, nextTags, event.content ?? '');
  }

  async removePackMember(packId: string, pubkey: string): Promise<void> {
    const user = this.requireCurrentUser();
    const memberPubkey = normalizeHexPubkey(pubkey);
    if (!memberPubkey) {
      throw new Error('Invalid member pubkey.');
    }

    const event = await this.findOwnedPackEvent(user.pubkey, packId);
    if (!event) {
      throw new Error('Selected pack was not found.');
    }

    const nextTags = event.tags.filter(
      (tag) => !(tag[0] === 'p' && normalizeHexPubkey(tag[1] ?? '') === memberPubkey)
    );

    if (nextTags.length === event.tags.length) {
      return;
    }

    await this.client.publishEvent(STARTER_PACK_KIND, nextTags, event.content ?? '');
  }

  private async fetchOwnedPackEvents(pubkey: string): Promise<PackEvent[]> {
    const events = await this.client.fetchEvents({
      kinds: [STARTER_PACK_KIND],
      authors: [pubkey],
      limit: 100,
    });

    return events
      .filter((event) => event.kind === STARTER_PACK_KIND)
      .filter((event) => event.pubkey === pubkey)
      .map((event) => ({
        id: event.id,
        pubkey: event.pubkey,
        kind: event.kind,
        tags: event.tags.map((tag) => [...tag]),
        content: event.content,
        created_at: event.created_at,
      }))
      .filter((event) => Boolean(readTagValue(event.tags, 'd')));
  }

  private async findOwnedPackEvent(pubkey: string, packId: string): Promise<PackEvent | null> {
    const normalizedPackId = packId.trim();
    if (!normalizedPackId) {
      return null;
    }

    const events = await this.fetchOwnedPackEvents(pubkey);

    return (
      events.find(
        (event) => buildPackId(pubkey, readTagValue(event.tags, 'd') ?? '') === normalizedPackId
      ) ?? null
    );
  }

  private async findPackEventByReference(packReference: PackReference): Promise<PackEvent | null> {
    const events = await this.client.fetchEvents([
      {
        kinds: [STARTER_PACK_KIND],
        authors: [packReference.authorPubkey],
        '#d': [packReference.dTag],
        limit: 1,
      },
      {
        '#d': [packReference.dTag],
        limit: 20,
      },
    ]);

    return (
      events
        .filter((event) => event.kind === STARTER_PACK_KIND)
        .filter((event) => event.pubkey === packReference.authorPubkey)
        .filter((event) =>
          event.tags.some((tag) => tag[0] === 'd' && tag[1] === packReference.dTag)
        )
        .sort((left, right) => (right.created_at ?? 0) - (left.created_at ?? 0))
        .map((event) => ({
          id: event.id,
          pubkey: event.pubkey,
          kind: event.kind,
          tags: event.tags.map((tag) => [...tag]),
          content: event.content,
          created_at: event.created_at,
        }))[0] ?? null
    );
  }

  private requireCurrentUser(): SessionUser {
    const user = this.session.user();
    if (!user || !this.session.isAuthenticated()) {
      throw new Error('Authentication is required before managing packs.');
    }

    return user;
  }

  private async toPackMember(pubkey: string): Promise<PackMember> {
    const profile = await this.client.fetchProfile(pubkey).catch(() => null);
    const npub = profile?.npub ?? nip19.npubEncode(pubkey);
    const username = profile?.displayName ?? `${npub.slice(0, 12)}...`;

    return {
      pubkey,
      npub,
      username,
      avatarUrl: profile?.imageUrl ?? null,
      primalUrl: `https://primal.net/p/${npub}`,
    };
  }
}

export function uniquePackMemberPubkeys(tags: string[][]): string[] {
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

function uniqueNormalizedPubkeys(pubkeys: readonly string[]): string[] {
  const normalizedPubkeys = new Set<string>();

  for (const pubkey of pubkeys) {
    const normalizedPubkey = normalizeHexPubkey(pubkey);
    if (normalizedPubkey) {
      normalizedPubkeys.add(normalizedPubkey);
    }
  }

  return [...normalizedPubkeys];
}

export function parsePackReference(packUrl: string): PackReference {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(packUrl);
  } catch {
    throw new Error('Invalid pack URL.');
  }

  if (parsedUrl.origin !== FOLLOWING_SPACE_ORIGIN) {
    throw new Error('Invalid pack URL.');
  }

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const dTag = pathSegments[0] === 'd' ? decodeURIComponent(pathSegments[1]?.trim() ?? '') : '';
  if (!dTag) {
    throw new Error('Invalid pack URL.');
  }

  const authorPubkey = normalizeHexPubkey(parsedUrl.searchParams.get('p') ?? '');
  if (!authorPubkey) {
    throw new Error('Invalid pack URL.');
  }

  return {
    authorPubkey,
    dTag,
  };
}

function toOwnedPackSummary(event: PackEvent, ownerPubkey: string): OwnedPackSummary | null {
  const dTag = readTagValue(event.tags, 'd');
  if (!dTag) {
    return null;
  }

  const title = readTagValue(event.tags, 'title') || dTag;

  return {
    id: buildPackId(ownerPubkey, dTag),
    title,
    description: readTagValue(event.tags, 'description'),
    imageUrl: readTagValue(event.tags, 'image'),
    dTag,
    memberCount: uniquePackMemberPubkeys(event.tags).length,
    url: buildFollowingSpaceUrl(ownerPubkey, dTag),
    createdAt: event.created_at ?? 0,
  };
}

function readTagValue(tags: string[][], tagName: string): string | null {
  const value = tags.find((tag) => tag[0] === tagName)?.[1]?.trim();
  return value || null;
}

function buildPackId(ownerPubkey: string, dTag: string): string {
  return `${ownerPubkey}:${dTag}`;
}

function buildFollowingSpaceUrl(ownerPubkey: string, dTag: string): string {
  return `${FOLLOWING_SPACE_ORIGIN}/d/${encodeURIComponent(dTag)}?p=${ownerPubkey}`;
}
