import '@angular/compiler';
import { TestBed } from '@angular/core/testing';

import { NostrClientService } from '../../../core/nostr/application/nostr-client.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from './francophone-pack-membership.service';

const OWNER_PUBKEY = '15a1989c2c483f6c6f18f2dda1033897a003669f449fc2fda4fa2fb6c9210900';
const OTHER_PUBKEY = '0000000000000000000000000000000000000000000000000000000000000001';
const PACK_EVENT = {
  kind: 39089,
  tags: [
    ['d', 'xd0520r38aua'],
    ['p', OWNER_PUBKEY],
  ],
  content: '',
};

function createMocks(fetchEventsResult: unknown[] = [PACK_EVENT]) {
  const fetchEventsMock = vi.fn().mockResolvedValue(fetchEventsResult);
  const publishEventMock = vi.fn().mockResolvedValue('event-id');
  const userMock = vi.fn().mockReturnValue(null);

  TestBed.configureTestingModule({
    providers: [
      FrancophonePackMembershipService,
      {
        provide: NostrClientService,
        useValue: { fetchEvents: fetchEventsMock, publishEvent: publishEventMock },
      },
      { provide: NostrSessionService, useValue: { user: userMock } },
    ],
  });

  const service = TestBed.inject(FrancophonePackMembershipService);

  return { service, fetchEventsMock, publishEventMock, userMock };
}

describe('FrancophonePackMembershipService', () => {
  describe('isCurrentUserMember', () => {
    it('returns false when no user is authenticated', async () => {
      const { service, userMock } = createMocks();
      userMock.mockReturnValue(null);

      const result = await service.isCurrentUserMember();

      expect(result).toBe(false);
    });

    it('returns true when current user is a member of the pack', async () => {
      const { service, userMock } = createMocks();
      userMock.mockReturnValue({ pubkey: OWNER_PUBKEY });

      const result = await service.isCurrentUserMember();

      expect(result).toBe(true);
    });

    it('returns false when current user is not a member of the pack', async () => {
      const { service, userMock } = createMocks();
      userMock.mockReturnValue({ pubkey: OTHER_PUBKEY });

      const result = await service.isCurrentUserMember();

      expect(result).toBe(false);
    });
  });

  describe('isMember', () => {
    it('returns false for an invalid pubkey', async () => {
      const { service } = createMocks();

      const result = await service.isMember('invalid');

      expect(result).toBe(false);
    });

    it('returns false when pubkey is not in pack member tags', async () => {
      const { service } = createMocks();

      const result = await service.isMember(OTHER_PUBKEY);

      expect(result).toBe(false);
    });

    it('returns true when pubkey is in pack member tags', async () => {
      const { service } = createMocks();

      const result = await service.isMember(OWNER_PUBKEY);

      expect(result).toBe(true);
    });
  });

  describe('addMember', () => {
    it('throws when pubkey is invalid', async () => {
      const { service } = createMocks();

      await expect(service.addMember('invalid')).rejects.toThrow('Invalid requester pubkey.');
    });

    it('throws when no user is authenticated', async () => {
      const { service, userMock } = createMocks();
      userMock.mockReturnValue(null);

      await expect(service.addMember(OTHER_PUBKEY)).rejects.toThrow('Authentication is required');
    });

    it('throws when connected account is not the pack publisher', async () => {
      const { service, userMock } = createMocks();
      userMock.mockReturnValue({ pubkey: OTHER_PUBKEY });

      await expect(service.addMember(OTHER_PUBKEY)).rejects.toThrow('cannot publish this pack');
    });

    it('does not publish when member already exists in pack', async () => {
      const { service, userMock, publishEventMock } = createMocks();
      userMock.mockReturnValue({ pubkey: OWNER_PUBKEY });

      await service.addMember(OWNER_PUBKEY);

      expect(publishEventMock).not.toHaveBeenCalled();
    });

    it('publishes updated event when adding a new member', async () => {
      const { service, userMock, publishEventMock } = createMocks();
      userMock.mockReturnValue({ pubkey: OWNER_PUBKEY });

      await service.addMember(OTHER_PUBKEY);

      expect(publishEventMock).toHaveBeenCalledTimes(1);
      const [kind, tags] = publishEventMock.mock.calls[0];
      expect(kind).toBe(39089);
      expect(tags.some((tag: string[]) => tag[0] === 'p' && tag[1] === OTHER_PUBKEY)).toBe(true);
    });
  });
});
