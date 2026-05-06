import '@angular/compiler';

import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { resolveRequestStatus, resolveSubmitErrorKey } from './pack-request.page';
import { PackRequestPage } from './pack-request.page';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from '../../application/francophone-pack-membership.service';
import { StarterPackRequestService } from '../../application/starter-pack-request.service';
import type { UserRequestState } from '../../application/starter-pack-request.service';

describe('PackRequestPage auth gating', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('opens auth instead of submitting join when sign-out leaves a stale profile display', async () => {
    const session = {
      isAuthenticated: signal(false),
      user: signal({
        pubkey: 'f'.repeat(64),
        npub: 'npub1staleprofile',
        displayName: 'Stale Profile',
        imageUrl: null,
        description: null,
        nip05: null,
      }),
      openAuthModal: vi.fn(),
    };
    const requestService = createRequestServiceMock();
    const page = createPage(session, requestService);

    await page.requestJoin();

    expect(session.openAuthModal).toHaveBeenCalledTimes(1);
    expect(requestService.submitRequest).not.toHaveBeenCalled();
    expect(page.loading()).toBe(false);
  });

  it('submits join only when active auth is present', async () => {
    const session = {
      isAuthenticated: signal(true),
      user: signal({
        pubkey: 'f'.repeat(64),
        npub: 'npub1activeprofile',
        displayName: 'Active Profile',
        imageUrl: null,
        description: null,
        nip05: null,
      }),
      openAuthModal: vi.fn(),
    };
    const requestService = createRequestServiceMock();
    const page = createPage(session, requestService);

    await page.requestJoin();

    expect(requestService.submitRequest).toHaveBeenCalledTimes(1);
    expect(session.openAuthModal).not.toHaveBeenCalled();
  });
});

describe('PackRequestPage pure helpers', () => {
  describe('resolveRequestStatus', () => {
    it('returns idle when user is a pack member', () => {
      const state: UserRequestState = { status: 'pending' };

      expect(resolveRequestStatus(state, true)).toBe('idle');
    });

    it('returns pending when state is pending and user is not a pack member', () => {
      const state: UserRequestState = { status: 'pending' };

      expect(resolveRequestStatus(state, false)).toBe('pending');
    });

    it('returns idle when state is idle and user is not a pack member', () => {
      const state: UserRequestState = { status: 'idle' };

      expect(resolveRequestStatus(state, false)).toBe('idle');
    });

    it('returns idle when state is approved but user is not a pack member', () => {
      const state: UserRequestState = { status: 'approved' };

      expect(resolveRequestStatus(state, false)).toBe('idle');
    });
  });

  describe('resolveSubmitErrorKey', () => {
    it('returns authError for 401 HttpErrorResponse', () => {
      const error = new HttpErrorResponse({ status: 401 });

      expect(resolveSubmitErrorKey(error)).toBe('request.submitError.authError');
    });

    it('returns forbidden for 403 HttpErrorResponse', () => {
      const error = new HttpErrorResponse({ status: 403 });

      expect(resolveSubmitErrorKey(error)).toBe('request.submitError.forbidden');
    });

    it('returns invalidRequest for 400 HttpErrorResponse', () => {
      const error = new HttpErrorResponse({ status: 400 });

      expect(resolveSubmitErrorKey(error)).toBe('request.submitError.invalidRequest');
    });

    it('returns generic submitError for other HttpErrorResponse', () => {
      const error = new HttpErrorResponse({ status: 500 });

      expect(resolveSubmitErrorKey(error)).toBe('request.submitError.generic');
    });

    it('returns generic submitError for non-HttpErrorResponse', () => {
      expect(resolveSubmitErrorKey(new Error('network'))).toBe('request.submitError.generic');
    });
  });
});

function createPage(
  session: Partial<NostrSessionService>,
  requestService = createRequestServiceMock()
): PackRequestPage {
  TestBed.configureTestingModule({
    providers: [
      { provide: NostrSessionService, useValue: session },
      { provide: StarterPackRequestService, useValue: requestService },
      {
        provide: FrancophonePackMembershipService,
        useValue: {
          isCurrentUserMember: vi.fn<() => Promise<boolean>>().mockResolvedValue(false),
        },
      },
    ],
  });

  return TestBed.runInInjectionContext(() => new PackRequestPage());
}

function createRequestServiceMock() {
  return {
    getUserState: vi.fn<() => Promise<UserRequestState>>().mockResolvedValue({ status: 'idle' }),
    submitRequest: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
}
