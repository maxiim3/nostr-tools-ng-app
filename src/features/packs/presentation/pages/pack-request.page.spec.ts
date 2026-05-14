import '@angular/compiler';

import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { resolveRequestStatus, resolveSubmitErrorKey } from './pack-request.page';
import { PackRequestPage } from './pack-request.page';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import {
  PackApiTimeoutError,
  StarterPackRequestService,
} from '../../application/starter-pack-request.service';
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
    await waitForIdle(page);

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
    await waitForIdle(page);

    await page.requestJoin();

    expect(requestService.submitRequest).toHaveBeenCalledTimes(1);
    expect(session.openAuthModal).not.toHaveBeenCalled();
  });

  it('marks membership as coming from the completed join request', async () => {
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
    await waitForIdle(page);

    await page.requestJoin();

    expect(page.isPackMember()).toBe(true);
    expect(page.joinedFromRequest()).toBe(true);
  });

  it('uses the join response without making a second signed status request', async () => {
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
    await waitForIdle(page);

    expect(requestService.getUserState).toHaveBeenCalledTimes(1);

    await page.requestJoin();

    expect(requestService.submitRequest).toHaveBeenCalledTimes(1);
    expect(requestService.getUserState).toHaveBeenCalledTimes(1);
    expect(page.isPackMember()).toBe(true);
  });

  it('ignores duplicate join attempts while a join request is loading', async () => {
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
    const submitDeferred = createDeferred<UserRequestState>();
    const requestService = createRequestServiceMock();
    requestService.submitRequest.mockReturnValue(submitDeferred.promise);
    const page = createPage(session, requestService);
    await waitForIdle(page);

    const firstSubmit = page.requestJoin();
    await page.requestJoin();
    submitDeferred.resolve({ status: 'joined' });
    await firstSubmit;

    expect(requestService.submitRequest).toHaveBeenCalledTimes(1);
    expect(page.loading()).toBe(false);
    expect(page.isPackMember()).toBe(true);
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

    it('returns packPublisherUnavailable for pack publisher backend failures', () => {
      expect(resolveSubmitErrorKey(new HttpErrorResponse({ status: 502 }))).toBe(
        'request.submitError.packPublisherUnavailable'
      );
      expect(resolveSubmitErrorKey(new HttpErrorResponse({ status: 503 }))).toBe(
        'request.submitError.packPublisherUnavailable'
      );
    });

    it('returns timeout for pack API timeout errors', () => {
      expect(resolveSubmitErrorKey(new PackApiTimeoutError())).toBe('request.submitError.timeout');
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
    ],
  });

  return TestBed.runInInjectionContext(() => new PackRequestPage());
}

function createRequestServiceMock() {
  return {
    getUserState: vi.fn<() => Promise<UserRequestState>>().mockResolvedValue({ status: 'idle' }),
    submitRequest: vi.fn<() => Promise<UserRequestState>>().mockResolvedValue({ status: 'joined' }),
  };
}

async function waitForIdle(page: PackRequestPage): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(page.loading()).toBe(false);
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}
