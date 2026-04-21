import { TestBed } from '@angular/core/testing';

import { NostrClientService, type SessionUser } from './nostr-client.service';
import { NostrSessionService } from './nostr-session.service';

type NostrGlobal = typeof globalThis & {
  nostr?: {
    getPublicKey(): Promise<string>;
  };
};

type NostrClientMock = Pick<
  NostrClientService,
  | 'connectWithExtension'
  | 'connectWithPrivateKey'
  | 'beginExternalAppLogin'
  | 'completeExternalAppLogin'
  | 'cancelExternalAppLogin'
  | 'clearSigner'
>;

describe('NostrSessionService', () => {
  const sessionUser: SessionUser = {
    pubkey: 'f'.repeat(64),
    npub: 'npub1testaccount',
    displayName: 'Test User',
    imageUrl: null,
    description: null,
    nip05: null,
  };

  let client: ReturnType<typeof createClientMock>;

  beforeEach(() => {
    client = createClientMock();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as NostrGlobal).nostr;
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (globalThis as NostrGlobal).nostr;
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('connects with extension when a NIP-07 provider is available', async () => {
    (globalThis as NostrGlobal).nostr = {
      getPublicKey: vi.fn<() => Promise<string>>().mockResolvedValue(sessionUser.pubkey),
    };
    client.connectWithExtension.mockResolvedValue(sessionUser);

    const session = createService(client);
    session.openAuthModal();

    await expect(session.connectWithExtension()).resolves.toBe(true);

    expect(client.connectWithExtension).toHaveBeenCalledTimes(1);
    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.error()).toBeNull();
    expect(session.connecting()).toBe(false);
  });

  it('fails extension auth cleanly when no NIP-07 provider exists', async () => {
    const session = createService(client);
    session.openAuthModal();

    await expect(session.connectWithExtension()).resolves.toBe(false);

    expect(client.connectWithExtension).not.toHaveBeenCalled();
    expect(session.user()).toBeNull();
    expect(session.authModalOpen()).toBe(true);
    expect(session.error()).toBe('NIP-07 extension not found.');
    expect(session.connecting()).toBe(false);
  });

  it('keeps the auth modal open when extension auth fails', async () => {
    (globalThis as NostrGlobal).nostr = {
      getPublicKey: vi.fn<() => Promise<string>>().mockResolvedValue(sessionUser.pubkey),
    };
    client.connectWithExtension.mockRejectedValue(new Error('Extension rejected the request.'));

    const session = createService(client);
    session.openAuthModal();

    await expect(session.connectWithExtension()).resolves.toBe(false);

    expect(client.connectWithExtension).toHaveBeenCalledTimes(1);
    expect(session.user()).toBeNull();
    expect(session.authModalOpen()).toBe(true);
    expect(session.error()).toBe('Extension rejected the request.');
    expect(session.connecting()).toBe(false);
  });

  it('connects with a private key and closes the modal', async () => {
    client.connectWithPrivateKey.mockResolvedValue(sessionUser);

    const session = createService(client);
    session.openAuthModal();

    await expect(session.connectWithPrivateKey('nsec1test')).resolves.toBe(true);

    expect(client.connectWithPrivateKey).toHaveBeenCalledWith('nsec1test');
    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.error()).toBeNull();
    expect(session.connecting()).toBe(false);
  });

  it('keeps the auth modal open when private key auth fails', async () => {
    client.connectWithPrivateKey.mockRejectedValue(new Error('Invalid private key.'));

    const session = createService(client);
    session.openAuthModal();

    await expect(session.connectWithPrivateKey('bad-key')).resolves.toBe(false);

    expect(client.connectWithPrivateKey).toHaveBeenCalledWith('bad-key');
    expect(session.user()).toBeNull();
    expect(session.authModalOpen()).toBe(true);
    expect(session.error()).toBe('Invalid private key.');
    expect(session.connecting()).toBe(false);
  });

  it('starts external app login and waits for approval', async () => {
    const deferred = createDeferred<SessionUser>();
    client.beginExternalAppLogin.mockResolvedValue('nostrconnect://example');
    client.completeExternalAppLogin.mockReturnValue(deferred.promise);

    const session = createService(client);

    await expect(session.beginExternalAppLogin()).resolves.toBe('nostrconnect://example');

    expect(client.beginExternalAppLogin).toHaveBeenCalledTimes(1);
    expect(client.completeExternalAppLogin).toHaveBeenCalledTimes(1);
    expect(session.externalAuthUri()).toBe('nostrconnect://example');
    expect(session.waitingForExternalAuth()).toBe(true);
    expect(session.connecting()).toBe(false);

    deferred.resolve(sessionUser);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(session.error()).toBeNull();
  });

  it('reports an error when external app login cannot start', async () => {
    client.beginExternalAppLogin.mockRejectedValue(
      new Error('Unable to create external app login link.')
    );

    const session = createService(client);

    await expect(session.beginExternalAppLogin()).resolves.toBeNull();

    expect(client.completeExternalAppLogin).not.toHaveBeenCalled();
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(session.error()).toBe('Unable to create external app login link.');
    expect(session.connecting()).toBe(false);
  });

  it('clears pending external auth state when cancelled', async () => {
    const deferred = createDeferred<SessionUser>();
    client.beginExternalAppLogin.mockResolvedValue('nostrconnect://example');
    client.completeExternalAppLogin.mockReturnValue(deferred.promise);

    const session = createService(client);

    await session.beginExternalAppLogin();
    session.cancelExternalAppLogin();

    expect(client.cancelExternalAppLogin).toHaveBeenCalledTimes(1);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
  });

  it('ignores stale external app login completion after retry', async () => {
    const deferred1 = createDeferred<SessionUser>();
    const deferred2 = createDeferred<SessionUser>();
    client.beginExternalAppLogin
      .mockResolvedValueOnce('nostrconnect://example1')
      .mockResolvedValueOnce('nostrconnect://example2');
    client.completeExternalAppLogin
      .mockReturnValueOnce(deferred1.promise)
      .mockReturnValueOnce(deferred2.promise);

    const session = createService(client);

    await session.beginExternalAppLogin();
    expect(session.externalAuthUri()).toBe('nostrconnect://example1');

    session.cancelExternalAppLogin();
    await session.beginExternalAppLogin();
    expect(session.externalAuthUri()).toBe('nostrconnect://example2');

    deferred1.resolve(sessionUser);
    await flushAsync();

    expect(session.user()).toBeNull();

    deferred2.resolve(sessionUser);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
  });

  it('times out external auth and invalidates the timed out attempt', async () => {
    const deferred1 = createDeferred<SessionUser>();
    const deferred2 = createDeferred<SessionUser>();
    client.beginExternalAppLogin
      .mockResolvedValueOnce('nostrconnect://example1')
      .mockResolvedValueOnce('nostrconnect://example2');
    client.completeExternalAppLogin
      .mockReturnValueOnce(deferred1.promise)
      .mockReturnValueOnce(deferred2.promise);

    const session = createService(client);

    await session.beginExternalAppLogin();
    expect(session.externalAuthUri()).toBe('nostrconnect://example1');
    expect(session.waitingForExternalAuth()).toBe(true);

    vi.advanceTimersByTime(120001);
    await flushAsync();

    expect(session.error()).toContain('timed out');
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(client.cancelExternalAppLogin).toHaveBeenCalledTimes(1);

    deferred1.resolve(sessionUser);
    await flushAsync();

    expect(session.user()).toBeNull();
    expect(session.error()).toContain('timed out');
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);

    await session.beginExternalAppLogin();
    expect(session.error()).toBeNull();
    expect(session.externalAuthUri()).toBe('nostrconnect://example2');
    expect(session.waitingForExternalAuth()).toBe(true);

    deferred2.resolve(sessionUser);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
  });

  it('allows retry after external app login cancellation', async () => {
    const deferred1 = createDeferred<SessionUser>();
    const deferred2 = createDeferred<SessionUser>();
    client.beginExternalAppLogin
      .mockResolvedValueOnce('nostrconnect://example1')
      .mockResolvedValueOnce('nostrconnect://example2');
    client.completeExternalAppLogin
      .mockReturnValueOnce(deferred1.promise)
      .mockReturnValueOnce(deferred2.promise);

    const session = createService(client);

    await session.beginExternalAppLogin();
    expect(session.externalAuthUri()).toBe('nostrconnect://example1');
    expect(session.waitingForExternalAuth()).toBe(true);

    session.cancelExternalAppLogin();
    expect(client.cancelExternalAppLogin).toHaveBeenCalledTimes(1);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);

    await session.beginExternalAppLogin();
    expect(session.externalAuthUri()).toBe('nostrconnect://example2');
    expect(session.waitingForExternalAuth()).toBe(true);

    deferred2.resolve(sessionUser);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(session.error()).toBeNull();
  });

  it('clears pending external auth state and exposes the failure reason', async () => {
    const deferred = createDeferred<SessionUser>();
    client.beginExternalAppLogin.mockResolvedValue('nostrconnect://example');
    client.completeExternalAppLogin.mockReturnValue(deferred.promise);

    const session = createService(client);

    await session.beginExternalAppLogin();
    deferred.reject(new Error('Signer rejected the connection.'));
    await flushAsync();

    expect(session.user()).toBeNull();
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(session.error()).toBe('Signer rejected the connection.');
  });

  it('closes the auth modal', () => {
    const session = createService(client);
    session.openAuthModal();
    expect(session.authModalOpen()).toBe(true);

    session.closeAuthModal();
    expect(session.authModalOpen()).toBe(false);
  });

  it('resets state on disconnect', async () => {
    (globalThis as NostrGlobal).nostr = {
      getPublicKey: vi.fn<() => Promise<string>>().mockResolvedValue(sessionUser.pubkey),
    };
    client.connectWithExtension.mockResolvedValue(sessionUser);
    client.clearSigner.mockResolvedValue(undefined);

    const session = createService(client);
    await session.connectWithExtension();
    expect(session.user()).toEqual(sessionUser);

    await session.disconnect();

    expect(client.clearSigner).toHaveBeenCalledTimes(1);
    expect(session.user()).toBeNull();
    expect(session.error()).toBeNull();
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
  });

  it('exposes isAuthenticated as a computed signal reflecting user presence', async () => {
    (globalThis as NostrGlobal).nostr = {
      getPublicKey: vi.fn<() => Promise<string>>().mockResolvedValue(sessionUser.pubkey),
    };
    client.connectWithExtension.mockResolvedValue(sessionUser);
    client.clearSigner.mockResolvedValue(undefined);

    const session = createService(client);
    expect(session.isAuthenticated()).toBe(false);

    await session.connectWithExtension();
    expect(session.isAuthenticated()).toBe(true);

    await session.disconnect();
    expect(session.isAuthenticated()).toBe(false);
  });

  it('identifies admin users via isAdmin', async () => {
    const adminUser: SessionUser = {
      ...sessionUser,
      npub: 'npub1zkse38pvfqlkcmcc7tw6zqecj7sqxe5lgj0u9ldylghmdjfppyqqtsa4du',
    };
    (globalThis as NostrGlobal).nostr = {
      getPublicKey: vi.fn<() => Promise<string>>().mockResolvedValue(adminUser.pubkey),
    };
    client.connectWithExtension.mockResolvedValue(adminUser);
    client.clearSigner.mockResolvedValue(undefined);

    const session = createService(client);
    expect(session.isAdmin()).toBe(false);

    await session.connectWithExtension();
    expect(session.isAdmin()).toBe(true);

    await session.disconnect();
    expect(session.isAdmin()).toBe(false);
  });
});

function createService(client: NostrClientMock): NostrSessionService {
  TestBed.configureTestingModule({
    providers: [{ provide: NostrClientService, useValue: client }],
  });

  return TestBed.inject(NostrSessionService);
}

function createClientMock() {
  return {
    connectWithExtension: vi.fn<() => Promise<SessionUser>>(),
    connectWithPrivateKey: vi.fn<(privateKeyOrNsec: string) => Promise<SessionUser>>(),
    beginExternalAppLogin: vi.fn<() => Promise<string>>(),
    completeExternalAppLogin: vi.fn<() => Promise<SessionUser>>(),
    cancelExternalAppLogin: vi.fn<() => void>(),
    clearSigner: vi.fn<() => Promise<void>>(),
  } satisfies NostrClientMock;
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
