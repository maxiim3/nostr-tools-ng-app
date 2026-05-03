import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import type { ActiveConnection } from '../../nostr-connection/domain/active-connection';
import type {
  ConnectionAttempt,
  ConnectionAttemptInstructions,
} from '../../nostr-connection/domain/connection-attempt';
import type { ConnectionSession } from '../../nostr-connection/domain/connection-session';
import type { AuthSessionState } from '../../nostr-connection/domain/auth-session-state';
import { NostrClientService, type SessionUser } from './nostr-client.service';
import { NostrSessionService } from './nostr-session.service';
import { NostrConnectionFacadeService } from '../../nostr-connection/application/connection-facade';

type NostrGlobal = typeof globalThis & {
  nostr?: {
    getPublicKey(): Promise<string>;
  };
};

const sessionUser: SessionUser = {
  pubkey: 'f'.repeat(64),
  npub: 'npub1testaccount',
  displayName: 'Test User',
  imageUrl: null,
  description: null,
  nip05: null,
};

const adminNpub = 'npub1zkse38pvfqlkcmcc7tw6zqecj7sqxe5lgj0u9ldylghmdjfppyqqtsa4du';
const adminPubkey = 'a'.repeat(64);
const adminUser: SessionUser = {
  pubkey: adminPubkey,
  npub: adminNpub,
  displayName: 'Admin',
  imageUrl: null,
  description: null,
  nip05: null,
};

let client: ReturnType<typeof createClientMock>;
let facadeState: ReturnType<typeof createFacadeState>;

describe('NostrSessionService', () => {
  beforeEach(() => {
    client = createClientMock();
    facadeState = createFacadeState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as NostrGlobal).nostr;
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('connects with extension when a NIP-07 provider is available', async () => {
    facadeState.availableMethods = ['nip07'];
    facadeState.startConnectionResult = createFakeAttempt('nip07', null);
    facadeState.completeResult = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip07');

    const session = createService();
    session.openAuthModal();
    await flushAsync();

    const result = await session.connectWithExtension();
    await flushAsync();

    expect(result).toBe(true);
    expect(facadeState.startConnectionCalls).toEqual([['nip07', { reason: 'interactive-login' }]]);
    expect(facadeState.completeCalls).toBe(1);
    expect(client.applyNip07Signer).toHaveBeenCalledWith(sessionUser.pubkey);
    expect(client.fetchProfile).toHaveBeenCalledWith(sessionUser.npub);
    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.error()).toBeNull();
  });

  it('fails extension auth cleanly when no NIP-07 provider exists', async () => {
    facadeState.availableMethods = [];

    const session = createService();
    session.openAuthModal();
    await flushAsync();

    const result = await session.connectWithExtension();
    await flushAsync();

    expect(result).toBe(false);
    expect(client.applyNip07Signer).not.toHaveBeenCalled();
    expect(session.user()).toBeNull();
    expect(session.authModalOpen()).toBe(true);
    expect(session.error()).toBe('NIP-07 extension not found.');
  });

  it('keeps the auth modal open when extension auth fails', async () => {
    facadeState.availableMethods = ['nip07'];
    facadeState.startConnectionError = new Error('Extension rejected the request.');

    const session = createService();
    session.openAuthModal();
    await flushAsync();

    const result = await session.connectWithExtension();
    await flushAsync();

    expect(result).toBe(false);
    expect(session.user()).toBeNull();
    expect(session.authModalOpen()).toBe(true);
    expect(session.error()).toBe('Extension rejected the request.');
  });

  it('restores a valid nip07 session on startup', async () => {
    facadeState.restoreContextExists = true;
    facadeState.restoreResult = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip07');

    const session = createService();
    await flushAsync();

    expect(client.applyNip07Signer).toHaveBeenCalledWith(sessionUser.pubkey);
    expect(client.fetchProfile).toHaveBeenCalledWith(sessionUser.npub);
    expect(session.user()).toEqual(sessionUser);
  });

  it('does not authenticate from profile when restore fails', async () => {
    facadeState.restoreContextExists = true;
    facadeState.restoreResult = null;

    const session = createService();
    await flushAsync();

    expect(client.applyNip07Signer).not.toHaveBeenCalled();
    expect(session.user()).toBeNull();
  });

  it('keeps restored signer state when profile fetch fails', async () => {
    facadeState.restoreContextExists = true;
    facadeState.restoreResult = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip07');
    client.fetchProfile.mockRejectedValue(new Error('Profile relay unavailable.'));

    const session = createService();
    await flushAsync();

    expect(client.applyNip07Signer).toHaveBeenCalledWith(sessionUser.pubkey);
    expect(client.fetchProfile).toHaveBeenCalledWith(sessionUser.npub);
    expect(session.user()).toBeNull();
    expect(session.error()).toBeNull();
  });

  it('restores a valid nip46 external signer session on startup', async () => {
    facadeState.restoreContextExists = true;
    facadeState.restoreResult = createFakeSession(
      sessionUser.pubkey,
      sessionUser.npub,
      'nip46-nostrconnect'
    );
    facadeState.ndkSignerValue = { marker: 'ndk-signer' };

    const session = createService();
    await flushAsync();

    expect(client.applyNdkSigner).toHaveBeenCalledWith(
      { marker: 'ndk-signer' },
      sessionUser.pubkey
    );
    expect(client.fetchProfile).toHaveBeenCalledWith(sessionUser.npub);
    expect(session.user()).toEqual(sessionUser);
  });

  it('keeps restored nip46 signer state when profile fetch fails', async () => {
    facadeState.restoreContextExists = true;
    facadeState.restoreResult = createFakeSession(
      sessionUser.pubkey,
      sessionUser.npub,
      'nip46-nostrconnect'
    );
    facadeState.ndkSignerValue = { marker: 'ndk-signer' };
    client.fetchProfile.mockRejectedValue(new Error('Profile relay unavailable.'));

    const session = createService();
    await flushAsync();

    expect(client.applyNdkSigner).toHaveBeenCalledWith(
      { marker: 'ndk-signer' },
      sessionUser.pubkey
    );
    expect(session.user()).toBeNull();
    expect(session.error()).toBeNull();
  });

  it('ignores stale profile fetch after disconnect', async () => {
    facadeState.availableMethods = ['nip07'];
    facadeState.startConnectionResult = createFakeAttempt('nip07', null);
    facadeState.completeResult = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip07');
    const profileDeferred = createDeferred<SessionUser>();
    client.fetchProfile.mockImplementation(() => profileDeferred.promise);

    const session = createService();
    await flushAsync();

    const connectPromise = session.connectWithExtension();
    await flushAsync();
    await session.disconnect();
    profileDeferred.resolve(sessionUser);
    await connectPromise;
    await flushAsync();

    expect(session.user()).toBeNull();
  });

  it('ignores stale startup restore after private-key login', async () => {
    const restoreDeferred = createDeferred<ConnectionSession | null>();
    facadeState.restoreContextExists = true;
    facadeState.restoreFn = () => restoreDeferred.promise;
    client.connectWithPrivateKey.mockResolvedValue(sessionUser);

    const session = createService();
    session.openAuthModal();
    await flushAsync();

    const result = await session.connectWithPrivateKey('nsec1test');
    await flushAsync();
    restoreDeferred.resolve(createFakeSession('a'.repeat(64), 'npub1restored', 'nip07'));
    await flushAsync();

    expect(result).toBe(true);
    expect(client.applyNip07Signer).not.toHaveBeenCalled();
    expect(session.user()).toEqual(sessionUser);
    expect(session.isAuthenticated()).toBe(true);
  });

  it('ignores stale startup restore after manual external signer login starts', async () => {
    const restoreDeferred = createDeferred<ConnectionSession | null>();
    const externalDeferred = createDeferred<ConnectionSession>();
    const externalSession = createFakeSession(
      sessionUser.pubkey,
      sessionUser.npub,
      'nip46-nostrconnect'
    );
    facadeState.restoreContextExists = true;
    facadeState.restoreFn = () => restoreDeferred.promise;
    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', {
      launchUrl: 'nostrconnect://example',
    });
    facadeState.completeFn = () => externalDeferred.promise;
    facadeState.ndkSignerValue = { marker: 'ndk-signer' };

    const session = createService();
    await flushAsync();

    await session.beginExternalAppLogin();
    await flushAsync();
    restoreDeferred.resolve(
      createFakeSession('a'.repeat(64), 'npub1restored', 'nip46-nostrconnect')
    );
    await flushAsync();

    expect(session.user()).toBeNull();

    facadeState.currentSession = externalSession;
    externalDeferred.resolve(externalSession);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
  });

  it('does not let a stale extension failure clear a newer private-key session', async () => {
    const completionDeferred = createDeferred<ConnectionSession>();
    facadeState.availableMethods = ['nip07'];
    facadeState.startConnectionResult = createFakeAttempt('nip07', null);
    facadeState.completeFn = () => completionDeferred.promise;
    client.connectWithPrivateKey.mockResolvedValue(sessionUser);

    const session = createService();
    await flushAsync();

    const extensionLogin = session.connectWithExtension();
    await flushAsync();
    await session.connectWithPrivateKey('nsec1test');
    completionDeferred.reject(new Error('Late extension failure.'));
    await extensionLogin;
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.isAuthenticated()).toBe(true);
    expect(client.clearSigner).toHaveBeenCalledTimes(1);
    expect(session.error()).toBeNull();
  });

  it('cleans up facade on partial extension auth failure', async () => {
    facadeState.availableMethods = ['nip07'];
    facadeState.startConnectionResult = createFakeAttempt('nip07', null);
    facadeState.completeResult = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip07');
    client.applyNip07Signer.mockRejectedValue(new Error('NDK failure.'));

    const session = createService();
    session.openAuthModal();
    await flushAsync();

    const result = await session.connectWithExtension();
    await flushAsync();

    expect(result).toBe(false);
    expect(session.user()).toBeNull();
    expect(session.authModalOpen()).toBe(true);
    expect(session.error()).toBe('NDK failure.');
    expect(facadeState.disconnectCalls).toBeGreaterThanOrEqual(1);
  });

  it('connects with a private key and closes the modal', async () => {
    client.connectWithPrivateKey.mockResolvedValue(sessionUser);

    const session = createService();
    session.openAuthModal();

    const result = await session.connectWithPrivateKey('nsec1test');
    await flushAsync();

    expect(result).toBe(true);
    expect(client.connectWithPrivateKey).toHaveBeenCalledWith('nsec1test');
    expect(session.user()).toEqual(sessionUser);
    expect(session.isAuthenticated()).toBe(true);
    expect(session.authModalOpen()).toBe(false);
    expect(session.error()).toBeNull();
  });

  it('keeps the auth modal open when private key auth fails', async () => {
    client.connectWithPrivateKey.mockRejectedValue(new Error('Invalid private key.'));

    const session = createService();
    session.openAuthModal();

    const result = await session.connectWithPrivateKey('bad-key');
    await flushAsync();

    expect(result).toBe(false);
    expect(client.connectWithPrivateKey).toHaveBeenCalledWith('bad-key');
    expect(session.user()).toBeNull();
    expect(session.authModalOpen()).toBe(true);
    expect(session.error()).toBe('Invalid private key.');
  });

  it('starts external app login and waits for approval', async () => {
    const connectionSession = createFakeSession(
      sessionUser.pubkey,
      sessionUser.npub,
      'nip46-nostrconnect'
    );
    const deferred = createDeferred<ConnectionSession>();
    const instructions = {
      launchUrl: 'nostrconnect://example',
      copyValue: 'nostrconnect://example',
    };

    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', instructions);
    facadeState.completeFn = () => deferred.promise;
    facadeState.ndkSignerValue = {} as never;

    const session = createService();

    const uri = await session.beginExternalAppLogin();
    await flushAsync();

    expect(uri).toBe('nostrconnect://example');
    expect(facadeState.startConnectionCalls[0][0]).toBe('nip46-nostrconnect');
    expect(session.externalAuthUri()).toBe('nostrconnect://example');
    expect(session.waitingForExternalAuth()).toBe(true);

    facadeState.currentSession = connectionSession;
    deferred.resolve(connectionSession);
    await flushAsync();

    expect(client.applyNdkSigner).toHaveBeenCalledTimes(1);
    expect(client.fetchProfile).toHaveBeenCalledWith(sessionUser.npub);
    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(session.error()).toBeNull();
  });

  it('updates the external auth URI when the active attempt publishes a new auth URL', async () => {
    let notifyInstructions:
      | ((instructions: ConnectionAttemptInstructions | null) => void)
      | undefined;

    facadeState.startConnectionResult = createFakeAttempt(
      'nip46-nostrconnect',
      {
        launchUrl: 'nostrconnect://example',
      },
      (listener) => {
        notifyInstructions = listener;
        return () => {
          notifyInstructions = undefined;
        };
      }
    );
    facadeState.completeFn = () => createDeferred<ConnectionSession>().promise;

    const session = createService();

    await session.beginExternalAppLogin();
    await flushAsync();

    expect(session.externalAuthUri()).toBe('nostrconnect://example');

    notifyInstructions?.({
      authUrl: 'https://getalby.com/auth',
    });

    expect(session.externalAuthUri()).toBe('https://getalby.com/auth');
  });

  it('reports an error when external app login cannot start', async () => {
    facadeState.startConnectionError = new Error('Unable to create external app login link.');

    const session = createService();

    const uri = await session.beginExternalAppLogin();
    await flushAsync();

    expect(uri).toBeNull();
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(session.error()).toBe('Unable to create external app login link.');
  });

  it('clears pending external auth state when cancelled', async () => {
    const deferred = createDeferred<ConnectionSession>();
    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', {
      launchUrl: 'nostrconnect://example',
    });
    facadeState.completeFn = () => deferred.promise;

    const session = createService();

    await session.beginExternalAppLogin();
    await flushAsync();

    session.cancelExternalAppLogin();

    expect(facadeState.cancelCalls).toBeGreaterThanOrEqual(1);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
  });

  it('ignores stale external app login completion after retry', async () => {
    const deferred1 = createDeferred<ConnectionSession>();
    const deferred2 = createDeferred<ConnectionSession>();
    const session1 = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip46-nostrconnect');
    const session2 = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip46-nostrconnect');

    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', {
      launchUrl: 'nostrconnect://example1',
    });
    facadeState.completeFn = () => deferred1.promise;
    facadeState.ndkSignerValue = {} as never;

    const session = createService();

    await session.beginExternalAppLogin();
    await flushAsync();
    expect(session.externalAuthUri()).toBe('nostrconnect://example1');

    session.cancelExternalAppLogin();

    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', {
      launchUrl: 'nostrconnect://example2',
    });
    facadeState.completeFn = () => deferred2.promise;

    await session.beginExternalAppLogin();
    await flushAsync();
    expect(session.externalAuthUri()).toBe('nostrconnect://example2');

    facadeState.currentSession = session1;
    deferred1.resolve(session1);
    await flushAsync();

    expect(session.user()).toBeNull();

    facadeState.currentSession = session2;
    deferred2.resolve(session2);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
  });

  it('times out external auth and invalidates the timed out attempt', async () => {
    const deferred1 = createDeferred<ConnectionSession>();
    const deferred2 = createDeferred<ConnectionSession>();
    const session2 = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip46-nostrconnect');

    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', {
      launchUrl: 'nostrconnect://example1',
    });
    facadeState.completeFn = () => deferred1.promise;
    facadeState.ndkSignerValue = {} as never;

    const session = createService();

    await session.beginExternalAppLogin();
    await flushAsync();
    expect(session.externalAuthUri()).toBe('nostrconnect://example1');
    expect(session.waitingForExternalAuth()).toBe(true);

    vi.advanceTimersByTime(120001);
    await flushAsync();

    expect(session.error()).toContain('timed out');
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(facadeState.cancelCalls).toBeGreaterThanOrEqual(1);

    const session1 = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip46-nostrconnect');
    facadeState.currentSession = session1;
    deferred1.resolve(session1);
    await flushAsync();

    expect(session.user()).toBeNull();

    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', {
      launchUrl: 'nostrconnect://example2',
    });
    facadeState.completeFn = () => deferred2.promise;

    await session.beginExternalAppLogin();
    await flushAsync();
    expect(session.error()).toBeNull();
    expect(session.externalAuthUri()).toBe('nostrconnect://example2');
    expect(session.waitingForExternalAuth()).toBe(true);

    facadeState.currentSession = session2;
    deferred2.resolve(session2);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
  });

  it('allows retry after external app login cancellation', async () => {
    const deferred2 = createDeferred<ConnectionSession>();
    const session2 = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip46-nostrconnect');

    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', {
      launchUrl: 'nostrconnect://example1',
    });
    facadeState.completeFn = () => createDeferred<ConnectionSession>().promise;

    const session = createService();

    await session.beginExternalAppLogin();
    await flushAsync();
    expect(session.externalAuthUri()).toBe('nostrconnect://example1');
    expect(session.waitingForExternalAuth()).toBe(true);

    session.cancelExternalAppLogin();
    expect(facadeState.cancelCalls).toBeGreaterThanOrEqual(1);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);

    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', {
      launchUrl: 'nostrconnect://example2',
    });
    facadeState.completeFn = () => deferred2.promise;
    facadeState.ndkSignerValue = {} as never;

    await session.beginExternalAppLogin();
    await flushAsync();
    expect(session.externalAuthUri()).toBe('nostrconnect://example2');
    expect(session.waitingForExternalAuth()).toBe(true);

    facadeState.currentSession = session2;
    deferred2.resolve(session2);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(session.error()).toBeNull();
  });

  it('clears pending external auth state and exposes the failure reason', async () => {
    const deferred = createDeferred<ConnectionSession>();
    facadeState.startConnectionResult = createFakeAttempt('nip46-nostrconnect', {
      launchUrl: 'nostrconnect://example',
    });
    facadeState.completeFn = () => deferred.promise;

    const session = createService();

    await session.beginExternalAppLogin();
    await flushAsync();

    deferred.reject(new Error('Signer rejected the connection.'));
    await flushAsync();
    await flushAsync();

    expect(session.user()).toBeNull();
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
    expect(session.error()).toBe('Signer rejected the connection.');
  });

  it('closes the auth modal', () => {
    const session = createService();
    session.openAuthModal();
    expect(session.authModalOpen()).toBe(true);

    session.closeAuthModal();
    expect(session.authModalOpen()).toBe(false);
  });

  it('resets state on disconnect', async () => {
    facadeState.availableMethods = ['nip07'];
    facadeState.startConnectionResult = createFakeAttempt('nip07', null);
    facadeState.completeResult = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip07');
    client.clearSigner.mockResolvedValue(undefined);

    const session = createService();
    await session.connectWithExtension();
    await flushAsync();
    expect(session.user()).toEqual(sessionUser);

    await session.disconnect();

    expect(facadeState.disconnectCalls).toBeGreaterThanOrEqual(1);
    expect(client.clearSigner).toHaveBeenCalledTimes(1);
    expect(session.user()).toBeNull();
    expect(session.error()).toBeNull();
    expect(session.externalAuthUri()).toBeNull();
    expect(session.waitingForExternalAuth()).toBe(false);
  });

  it('exposes isAuthenticated as a computed signal reflecting user presence', async () => {
    facadeState.availableMethods = ['nip07'];
    facadeState.startConnectionResult = createFakeAttempt('nip07', null);
    facadeState.completeResult = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip07');
    client.clearSigner.mockResolvedValue(undefined);

    const session = createService();
    expect(session.isAuthenticated()).toBe(false);

    await session.connectWithExtension();
    await flushAsync();
    expect(session.isAuthenticated()).toBe(true);

    await session.disconnect();
    expect(session.isAuthenticated()).toBe(false);
  });

  it('identifies admin users via isAdmin', async () => {
    facadeState.availableMethods = ['nip07'];
    facadeState.startConnectionResult = createFakeAttempt('nip07', null);
    facadeState.completeResult = createFakeSession(adminPubkey, adminNpub, 'nip07');
    client.clearSigner.mockResolvedValue(undefined);

    const session = createService();
    expect(session.isAdmin()).toBe(false);

    await session.connectWithExtension();
    await flushAsync();
    expect(session.isAdmin()).toBe(true);

    await session.disconnect();
    expect(session.isAdmin()).toBe(false);
  });

  it('does not treat profile-only user data as authenticated session', () => {
    const session = createService();

    session.user.set(sessionUser);

    expect(session.isAuthenticated()).toBe(false);
  });

  it('exposes isAuthenticated for private key auth', async () => {
    client.connectWithPrivateKey.mockResolvedValue(sessionUser);
    client.clearSigner.mockResolvedValue(undefined);

    const session = createService();
    expect(session.isAuthenticated()).toBe(false);

    await session.connectWithPrivateKey('nsec1test');
    await flushAsync();
    expect(session.isAuthenticated()).toBe(true);
    expect(session.isAdmin()).toBe(false);

    await session.disconnect();
    expect(session.isAuthenticated()).toBe(false);
  });

  it('identifies admin for private key auth', async () => {
    client.connectWithPrivateKey.mockResolvedValue(adminUser);
    client.clearSigner.mockResolvedValue(undefined);

    const session = createService();
    expect(session.isAdmin()).toBe(false);

    await session.connectWithPrivateKey('nsec1admin');
    await flushAsync();
    expect(session.isAdmin()).toBe(true);

    await session.disconnect();
    expect(session.isAdmin()).toBe(false);
  });

  it('starts bunker login and waits for approval', async () => {
    const connectionSession = createFakeSession(
      sessionUser.pubkey,
      sessionUser.npub,
      'nip46-bunker'
    );
    const deferred = createDeferred<ConnectionSession>();

    facadeState.startConnectionResult = createFakeAttempt('nip46-bunker', null);
    facadeState.completeFn = () => deferred.promise;
    facadeState.ndkSignerValue = {} as never;

    const session = createService();

    const started = await session.beginBunkerLogin('bunker://abc?relay=wss://relay.example.com');
    await flushAsync();

    expect(started).toBe(true);
    expect(facadeState.startConnectionCalls[0]).toEqual([
      'nip46-bunker',
      {
        reason: 'interactive-login',
        connectionToken: 'bunker://abc?relay=wss://relay.example.com',
      },
    ]);
    expect(session.waitingForBunkerAuth()).toBe(true);

    facadeState.currentSession = connectionSession;
    deferred.resolve(connectionSession);
    await flushAsync();

    expect(client.applyNdkSigner).toHaveBeenCalledTimes(1);
    expect(client.fetchProfile).toHaveBeenCalledWith(sessionUser.npub);
    expect(session.user()).toEqual(sessionUser);
    expect(session.authModalOpen()).toBe(false);
    expect(session.waitingForBunkerAuth()).toBe(false);
    expect(session.error()).toBeNull();
  });

  it('reports an error when bunker login cannot start', async () => {
    facadeState.startConnectionError = new Error('Invalid bunker token.');

    const session = createService();

    const started = await session.beginBunkerLogin('bad-token');
    await flushAsync();

    expect(started).toBe(false);
    expect(session.waitingForBunkerAuth()).toBe(false);
    expect(session.error()).toBe('Invalid bunker token.');
  });

  it('clears pending bunker auth state when cancelled', async () => {
    const deferred = createDeferred<ConnectionSession>();
    facadeState.startConnectionResult = createFakeAttempt('nip46-bunker', null);
    facadeState.completeFn = () => deferred.promise;

    const session = createService();

    await session.beginBunkerLogin('bunker://abc?relay=wss://relay.example.com');
    await flushAsync();

    session.cancelBunkerLogin();

    expect(facadeState.cancelCalls).toBeGreaterThanOrEqual(1);
    expect(session.waitingForBunkerAuth()).toBe(false);
  });

  it('ignores stale bunker login completion after retry', async () => {
    const deferred1 = createDeferred<ConnectionSession>();
    const deferred2 = createDeferred<ConnectionSession>();
    const session1 = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip46-bunker');
    const session2 = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip46-bunker');

    facadeState.startConnectionResult = createFakeAttempt('nip46-bunker', null);
    facadeState.completeFn = () => deferred1.promise;
    facadeState.ndkSignerValue = {} as never;

    const session = createService();

    await session.beginBunkerLogin('bunker://abc?relay=wss://relay.example.com');
    await flushAsync();

    session.cancelBunkerLogin();

    facadeState.startConnectionResult = createFakeAttempt('nip46-bunker', null);
    facadeState.completeFn = () => deferred2.promise;

    await session.beginBunkerLogin('bunker://def?relay=wss://relay.example.com');
    await flushAsync();

    facadeState.currentSession = session1;
    deferred1.resolve(session1);
    await flushAsync();

    expect(session.user()).toBeNull();

    facadeState.currentSession = session2;
    deferred2.resolve(session2);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.waitingForBunkerAuth()).toBe(false);
  });

  it('times out bunker auth and allows retry', async () => {
    const deferred1 = createDeferred<ConnectionSession>();
    const deferred2 = createDeferred<ConnectionSession>();
    const session2 = createFakeSession(sessionUser.pubkey, sessionUser.npub, 'nip46-bunker');

    facadeState.startConnectionResult = createFakeAttempt('nip46-bunker', null);
    facadeState.completeFn = () => deferred1.promise;
    facadeState.ndkSignerValue = {} as never;

    const session = createService();

    await session.beginBunkerLogin('bunker://abc?relay=wss://relay.example.com');
    await flushAsync();
    expect(session.waitingForBunkerAuth()).toBe(true);

    vi.advanceTimersByTime(120001);
    await flushAsync();

    expect(session.error()).toContain('timed out');
    expect(session.waitingForBunkerAuth()).toBe(false);
    expect(facadeState.cancelCalls).toBeGreaterThanOrEqual(1);

    facadeState.startConnectionResult = createFakeAttempt('nip46-bunker', null);
    facadeState.completeFn = () => deferred2.promise;

    await session.beginBunkerLogin('bunker://def?relay=wss://relay.example.com');
    await flushAsync();
    expect(session.error()).toBeNull();
    expect(session.waitingForBunkerAuth()).toBe(true);

    facadeState.currentSession = session2;
    deferred2.resolve(session2);
    await flushAsync();

    expect(session.user()).toEqual(sessionUser);
    expect(session.waitingForBunkerAuth()).toBe(false);
  });

  it('clears bunker state on disconnect', async () => {
    const deferred = createDeferred<ConnectionSession>();
    facadeState.startConnectionResult = createFakeAttempt('nip46-bunker', null);
    facadeState.completeFn = () => deferred.promise;
    client.clearSigner.mockResolvedValue(undefined);

    const session = createService();

    await session.beginBunkerLogin('bunker://abc?relay=wss://relay.example.com');
    await flushAsync();
    expect(session.waitingForBunkerAuth()).toBe(true);

    await session.disconnect();

    expect(session.waitingForBunkerAuth()).toBe(false);
    expect(session.user()).toBeNull();
    expect(session.error()).toBeNull();
  });
});

function createService(): NostrSessionService {
  TestBed.configureTestingModule({
    providers: [
      { provide: NostrClientService, useValue: client },
      { provide: NostrConnectionFacadeService, useValue: createFacadeProxy(facadeState) },
    ],
  });

  return TestBed.inject(NostrSessionService);
}

function createClientMock() {
  return {
    applyNip07Signer: vi.fn<(hex: string) => Promise<void>>().mockResolvedValue(undefined),
    connectWithPrivateKey: vi.fn<(key: string) => Promise<SessionUser>>(),
    applyNdkSigner: vi
      .fn<(signer: unknown, hex: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    clearSigner: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    fetchProfile: vi
      .fn<(id: string) => Promise<SessionUser>>()
      .mockImplementation(async (id: string) => {
        if (id === adminUser.npub) return adminUser;
        return sessionUser;
      }),
  };
}

interface FacadeState {
  availableMethods: string[];
  currentSession: ConnectionSession | null;
  ndkSignerValue: unknown;
  startConnectionResult: ConnectionAttempt | null;
  startConnectionError: Error | null;
  startConnectionCalls: unknown[][];
  completeResult: ConnectionSession | null;
  completeFn: (() => Promise<ConnectionSession>) | null;
  completeCalls: number;
  cancelCalls: number;
  disconnectCalls: number;
  currentFacadeAttemptId: number;
  currentFacadeAttemptMethodId: string | null;
  restoreContextExists: boolean;
  restoreResult: ConnectionSession | null;
  restoreFn: (() => Promise<ConnectionSession | null>) | null;
}

function createFacadeState(): FacadeState {
  return {
    availableMethods: [],
    currentSession: null,
    ndkSignerValue: null,
    startConnectionResult: null,
    startConnectionError: null,
    startConnectionCalls: [],
    completeResult: null,
    completeFn: null,
    completeCalls: 0,
    cancelCalls: 0,
    disconnectCalls: 0,
    currentFacadeAttemptId: 0,
    currentFacadeAttemptMethodId: null,
    restoreContextExists: false,
    restoreResult: null,
    restoreFn: null,
  };
}

function createFacadeProxy(state: FacadeState) {
  const authSessionState = signal<AuthSessionState>(
    state.currentSession
      ? { status: 'connected', session: state.currentSession }
      : { status: 'disconnected' }
  );

  return {
    pending: () => false,
    error: () => null,
    currentAttempt: () => null,
    currentSession: () => state.currentSession,
    authSessionState,
    ndkSigner: () => state.ndkSignerValue,
    isAuthenticated: () => state.currentSession !== null,
    availableMethodIds: () => state.availableMethods,
    refreshAvailableMethods: vi
      .fn<() => Promise<string[]>>()
      .mockResolvedValue(state.availableMethods),
    hasRestoreContext: vi.fn<() => boolean>().mockImplementation(() => state.restoreContextExists),
    restoreSessionFromStoredContext: vi
      .fn<() => Promise<ConnectionSession | null>>()
      .mockImplementation(async () => {
        if (state.restoreFn) {
          return state.restoreFn();
        }

        return state.restoreResult;
      }),
    clearError: vi.fn(),
    startConnection: vi
      .fn<(methodId: string, req: unknown) => Promise<ConnectionAttempt>>()
      .mockImplementation(async (methodId, req) => {
        state.startConnectionCalls.push([methodId, req]);
        if (state.startConnectionError) throw state.startConnectionError;
        if (!state.startConnectionResult) throw new Error('startConnection not configured');
        state.currentFacadeAttemptId++;
        state.currentFacadeAttemptMethodId = methodId;
        if (methodId === 'nip46-nostrconnect') {
          authSessionState.set({
            status: 'awaitingExternalSignerApproval',
            methodId,
            attemptId: state.currentFacadeAttemptId,
          });
        } else if (methodId === 'nip46-bunker') {
          authSessionState.set({
            status: 'awaitingBunkerApproval',
            methodId,
            attemptId: state.currentFacadeAttemptId,
          });
        }
        return state.startConnectionResult;
      }),
    completeCurrentAttempt: vi
      .fn<() => Promise<ConnectionSession>>()
      .mockImplementation(async () => {
        state.completeCalls++;
        if (state.completeFn) return state.completeFn();
        if (state.completeResult) {
          state.currentSession = state.completeResult;
          state.currentFacadeAttemptMethodId = null;
          authSessionState.set({ status: 'connected', session: state.completeResult });
          return state.completeResult;
        }
        throw new Error('completeCurrentAttempt not configured');
      }),
    cancelCurrentAttempt: vi
      .fn<(options?: { reason?: 'cancelled' | 'timedOut'; attemptId?: number }) => Promise<void>>()
      .mockImplementation(async (options) => {
        state.cancelCalls++;
        const methodId = state.currentFacadeAttemptMethodId;
        if (
          !methodId ||
          (options?.attemptId && options.attemptId !== state.currentFacadeAttemptId)
        ) {
          return;
        }

        if (options?.reason === 'timedOut') {
          authSessionState.set({
            status: 'timedOut',
            methodId: methodId as never,
            attemptId: state.currentFacadeAttemptId,
            reasonCode: 'approval_timed_out',
          });
        } else {
          authSessionState.set({
            status: 'cancelled',
            methodId: methodId as never,
            attemptId: state.currentFacadeAttemptId,
            reasonCode: 'approval_cancelled',
          });
        }
        state.currentFacadeAttemptMethodId = null;
      }),
    disconnect: vi.fn<() => Promise<void>>().mockImplementation(async () => {
      state.disconnectCalls++;
      state.currentSession = null;
      state.ndkSignerValue = null;
      state.currentFacadeAttemptMethodId = null;
      authSessionState.set({ status: 'disconnected' });
    }),
    getCurrentAttemptId: vi
      .fn<() => number>()
      .mockImplementation(() => state.currentFacadeAttemptId),
  };
}

function createFakeAttempt(
  methodId: string,
  instructions: ConnectionAttemptInstructions | null,
  onInstructionsChange?: (
    listener: (instructions: ConnectionAttemptInstructions | null) => void
  ) => () => void
): ConnectionAttempt {
  return {
    methodId: methodId as never,
    instructions,
    onInstructionsChange:
      onInstructionsChange ??
      (() => {
        return () => undefined;
      }),
    complete: async (): Promise<ActiveConnection> => null as never,
    cancel: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
}

function createFakeSession(pubkeyHex: string, npub: string, methodId: string): ConnectionSession {
  return {
    pubkeyHex,
    npub,
    methodId: methodId as never,
    capabilities: ['sign-event'],
    validatedAt: Date.now(),
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
