import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { NostrClientService } from '../../../core/nostr/application/nostr-client.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { PackManagerService, uniquePackMemberPubkeys } from './pack-manager.service';

const OWNER_PUBKEY = '0000000000000000000000000000000000000000000000000000000000000001';
const MEMBER_PUBKEY = '0000000000000000000000000000000000000000000000000000000000000002';
const OTHER_MEMBER_PUBKEY = '0000000000000000000000000000000000000000000000000000000000000003';

function createMocks() {
  const userMock = vi.fn().mockReturnValue({
    pubkey: OWNER_PUBKEY,
    npub: 'npub-owner',
    displayName: 'Owner',
    imageUrl: null,
    description: null,
    nip05: null,
  });
  const isAuthenticatedMock = vi.fn().mockReturnValue(true);
  const fetchEventsMock = vi.fn().mockResolvedValue([]);
  const fetchProfileMock = vi.fn().mockResolvedValue(null);
  const publishEventMock = vi.fn().mockResolvedValue('event-id');

  TestBed.configureTestingModule({
    providers: [
      PackManagerService,
      {
        provide: NostrClientService,
        useValue: {
          fetchEvents: fetchEventsMock,
          fetchProfile: fetchProfileMock,
          publishEvent: publishEventMock,
        },
      },
      {
        provide: NostrSessionService,
        useValue: {
          user: userMock,
          isAuthenticated: isAuthenticatedMock,
        },
      },
    ],
  });

  return {
    service: TestBed.inject(PackManagerService),
    userMock,
    isAuthenticatedMock,
    fetchEventsMock,
    fetchProfileMock,
    publishEventMock,
  };
}

describe('PackManagerService', () => {
  it('lists starter packs owned by the current user', async () => {
    const { service, fetchEventsMock } = createMocks();
    fetchEventsMock.mockResolvedValue([
      {
        id: 'pack-event',
        kind: 39089,
        pubkey: OWNER_PUBKEY,
        created_at: 10,
        tags: [
          ['d', 'my-pack'],
          ['title', 'My Pack'],
          ['description', 'A useful pack'],
          ['image', 'pack.png'],
          ['p', MEMBER_PUBKEY],
          ['p', MEMBER_PUBKEY],
          ['p', 'invalid'],
        ],
      },
    ]);

    await expect(service.listOwnedPacks()).resolves.toEqual([
      {
        id: `${OWNER_PUBKEY}:my-pack`,
        title: 'My Pack',
        description: 'A useful pack',
        imageUrl: 'pack.png',
        dTag: 'my-pack',
        memberCount: 1,
        url: `https://following.space/d/my-pack?p=${OWNER_PUBKEY}`,
        createdAt: 10,
      },
    ]);
    expect(fetchEventsMock).toHaveBeenCalledWith({
      kinds: [39089],
      authors: [OWNER_PUBKEY],
      limit: 100,
    });
  });

  it('loads members from a selected owned pack', async () => {
    const { service, fetchEventsMock, fetchProfileMock } = createMocks();
    fetchEventsMock.mockResolvedValue([
      {
        id: 'pack-event',
        kind: 39089,
        pubkey: OWNER_PUBKEY,
        tags: [
          ['d', 'my-pack'],
          ['p', MEMBER_PUBKEY],
        ],
      },
    ]);
    fetchProfileMock.mockResolvedValue({
      pubkey: MEMBER_PUBKEY,
      npub: 'npub-member',
      displayName: 'Alice',
      imageUrl: 'alice.png',
      description: null,
      nip05: null,
    });

    await expect(service.listPackMembers(`${OWNER_PUBKEY}:my-pack`)).resolves.toEqual([
      {
        pubkey: MEMBER_PUBKEY,
        npub: 'npub-member',
        username: 'Alice',
        avatarUrl: 'alice.png',
        primalUrl: 'https://primal.net/p/npub-member',
      },
    ]);
    expect(fetchProfileMock).toHaveBeenCalledWith(MEMBER_PUBKEY);
  });

  it('publishes a selected pack without the removed member', async () => {
    const { service, fetchEventsMock, publishEventMock } = createMocks();
    fetchEventsMock.mockResolvedValue([
      {
        id: 'pack-event',
        kind: 39089,
        pubkey: OWNER_PUBKEY,
        content: 'pack content',
        tags: [
          ['d', 'my-pack'],
          ['title', 'My Pack'],
          ['p', MEMBER_PUBKEY],
          ['p', OTHER_MEMBER_PUBKEY],
        ],
      },
    ]);

    await service.removePackMember(`${OWNER_PUBKEY}:my-pack`, MEMBER_PUBKEY);

    expect(publishEventMock).toHaveBeenCalledWith(
      39089,
      [
        ['d', 'my-pack'],
        ['title', 'My Pack'],
        ['p', OTHER_MEMBER_PUBKEY],
      ],
      'pack content'
    );
  });

  it('requires an authenticated user', async () => {
    const { service, userMock } = createMocks();
    userMock.mockReturnValue(null);

    await expect(service.listOwnedPacks()).rejects.toThrow(
      'Authentication is required before managing packs.'
    );
  });
});

describe('uniquePackMemberPubkeys', () => {
  it('normalizes, filters, and deduplicates p tags', () => {
    expect(
      uniquePackMemberPubkeys([
        ['p', MEMBER_PUBKEY.toUpperCase()],
        ['p', MEMBER_PUBKEY],
        ['p', 'invalid'],
        ['d', 'my-pack'],
      ])
    ).toEqual([MEMBER_PUBKEY]);
  });
});
