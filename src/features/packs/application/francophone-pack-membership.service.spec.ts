import '@angular/compiler';
import { TestBed } from '@angular/core/testing';

import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from './francophone-pack-membership.service';
import { StarterPackRequestService } from './starter-pack-request.service';

const USER_PUBKEY = '0000000000000000000000000000000000000000000000000000000000000001';
const OTHER_PUBKEY = '0000000000000000000000000000000000000000000000000000000000000002';

function createMocks(status: 'idle' | 'joined' = 'idle') {
  const userMock = vi.fn().mockReturnValue({ pubkey: USER_PUBKEY });
  const getUserStateMock = vi.fn().mockResolvedValue({ status });

  TestBed.configureTestingModule({
    providers: [
      FrancophonePackMembershipService,
      { provide: NostrSessionService, useValue: { user: userMock } },
      { provide: StarterPackRequestService, useValue: { getUserState: getUserStateMock } },
    ],
  });

  const service = TestBed.inject(FrancophonePackMembershipService);

  return { service, userMock, getUserStateMock };
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
});
