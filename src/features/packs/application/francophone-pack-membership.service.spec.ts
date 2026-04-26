import '@angular/compiler';
import { TestBed } from '@angular/core/testing';

import { NostrClientService } from '../../../core/nostr/application/nostr-client.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from './francophone-pack-membership.service';
import { StarterPackRequestService } from './starter-pack-request.service';

const USER_PUBKEY = '0000000000000000000000000000000000000000000000000000000000000001';
const OTHER_PUBKEY = '0000000000000000000000000000000000000000000000000000000000000002';
const PACK_OWNER_PUBKEY = '15a1989c2c483f6c6f18f2dda1033897a003669f449fc2fda4fa2fb6c9210900';

function createMocks(status: 'idle' | 'joined' = 'idle') {
  const userMock = vi.fn().mockReturnValue({ pubkey: USER_PUBKEY });
  const getUserStateMock = vi.fn().mockResolvedValue({ status });
  const fetchEventsMock = vi.fn().mockResolvedValue([]);
  const fetchProfileMock = vi.fn();

  TestBed.configureTestingModule({
    providers: [
      FrancophonePackMembershipService,
      {
        provide: NostrClientService,
        useValue: { fetchEvents: fetchEventsMock, fetchProfile: fetchProfileMock },
      },
      { provide: NostrSessionService, useValue: { user: userMock } },
      { provide: StarterPackRequestService, useValue: { getUserState: getUserStateMock } },
    ],
  });

  const service = TestBed.inject(FrancophonePackMembershipService);

  return { service, userMock, getUserStateMock, fetchEventsMock, fetchProfileMock };
}

describe('FrancophonePackMembershipService', () => {
  it('returns false when no user is authenticated', async () => {
    const { service, userMock, getUserStateMock } = createMocks();
    userMock.mockReturnValue(null);

    const result = await service.isCurrentUserMember();

    expect(result).toBe(false);
    expect(getUserStateMock).not.toHaveBeenCalled();
  });

  it('returns true when the API reports the current user as joined', async () => {
    const { service } = createMocks('joined');

    await expect(service.isCurrentUserMember()).resolves.toBe(true);
  });

  it('returns false when the API reports the current user as idle', async () => {
    const { service } = createMocks('idle');

    await expect(service.isCurrentUserMember()).resolves.toBe(false);
  });

  it('only checks explicit membership for the current user', async () => {
    const { service, getUserStateMock } = createMocks('joined');

    await expect(service.isMember(OTHER_PUBKEY)).resolves.toBe(false);
    expect(getUserStateMock).not.toHaveBeenCalled();
  });

  it('lists unique public pack p tags with profile snapshots', async () => {
    const { service, fetchEventsMock, fetchProfileMock } = createMocks();
    fetchEventsMock.mockResolvedValue([
      {
        kind: 39089,
        pubkey: PACK_OWNER_PUBKEY,
        tags: [
          ['d', 'xd0520r38aua'],
          ['p', USER_PUBKEY],
          ['p', USER_PUBKEY],
          ['p', OTHER_PUBKEY],
          ['p', 'invalid'],
        ],
      },
    ]);
    fetchProfileMock.mockImplementation((pubkey: string) =>
      Promise.resolve({
        pubkey,
        displayName: pubkey === USER_PUBKEY ? 'Alice' : 'Bob',
        description: pubkey === USER_PUBKEY ? 'Bonjour' : null,
        imageUrl: pubkey === USER_PUBKEY ? 'alice.png' : null,
      })
    );

    const result = await service.listPublicPackMembers();

    expect(fetchEventsMock).toHaveBeenCalledWith([
      {
        kinds: [39089],
        authors: [PACK_OWNER_PUBKEY],
        '#d': ['xd0520r38aua'],
        limit: 1,
      },
      {
        '#d': ['xd0520r38aua'],
        limit: 20,
      },
    ]);
    expect(fetchProfileMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      {
        pubkey: USER_PUBKEY,
        username: 'Alice',
        description: 'Bonjour',
        avatarUrl: 'alice.png',
      },
      {
        pubkey: OTHER_PUBKEY,
        username: 'Bob',
        description: null,
        avatarUrl: null,
      },
    ]);
  });

  it('filters fallback events to the configured pack kind and owner', async () => {
    const { service, fetchEventsMock, fetchProfileMock } = createMocks();
    fetchEventsMock.mockResolvedValue([
      {
        kind: 39089,
        pubkey: OTHER_PUBKEY,
        tags: [
          ['d', 'xd0520r38aua'],
          ['p', OTHER_PUBKEY],
        ],
      },
      {
        kind: 39089,
        pubkey: PACK_OWNER_PUBKEY,
        tags: [
          ['d', 'xd0520r38aua'],
          ['p', USER_PUBKEY],
        ],
      },
    ]);
    fetchProfileMock.mockResolvedValue({
      pubkey: USER_PUBKEY,
      displayName: 'Alice',
      description: null,
      imageUrl: null,
    });

    await service.listPublicPackMembers();

    expect(fetchEventsMock).toHaveBeenCalledWith([
      {
        kinds: [39089],
        authors: [PACK_OWNER_PUBKEY],
        '#d': ['xd0520r38aua'],
        limit: 1,
      },
      {
        '#d': ['xd0520r38aua'],
        limit: 20,
      },
    ]);
    expect(fetchProfileMock).toHaveBeenCalledOnce();
    expect(fetchProfileMock).toHaveBeenCalledWith(USER_PUBKEY);
  });
});
