import { ConnectionFacade } from './connection-facade';
import { ConnectionOrchestrator } from './connection-orchestrator';
import { InMemoryConnectionSessionStore } from './in-memory-connection-session-store';
import { ConnectionDomainError } from '../domain/connection-errors';
import { FakeNip07Provider } from '../testing/fakes/fake-nip07-provider';
import { FakeConnectionMethod } from '../testing/fakes/fake-connection-method';
import { FakeConnectionAttempt } from '../testing/fakes/fake-connection-attempt';
import { FakeActiveConnection } from '../testing/fakes/fake-active-connection';
import { FakeConnectionSigner } from '../testing/fakes/fake-connection-signer';
import { Nip07ConnectionMethod } from './nip07-connection-method';
import { Nip46NostrconnectConnectionMethod } from './nip46-nostrconnect-connection-method';
import {
  FakeNip46NostrconnectAttemptHandle,
  FakeNip46NostrconnectStarter,
} from '../testing/fakes/fake-nip46-nostrconnect-starter';
import type { Nip46RemoteSigner } from '../infrastructure/nip46-nostrconnect-starter';

describe('ConnectionFacade', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads available methods from the orchestrator', async () => {
    const facade = createFacade([
      new FakeConnectionMethod({ id: 'nip07', available: true }),
      new FakeConnectionMethod({ id: 'nip46-bunker', available: false }),
    ]);

    await facade.refreshAvailableMethods();

    expect(facade.availableMethodIds()).toEqual(['nip07']);
  });

  it('starts a connection attempt and exposes its instructions', async () => {
    const facade = createFacade([
      new FakeConnectionMethod({
        id: 'nip46-bunker',
        attempt: new FakeConnectionAttempt('nip46-bunker', {
          methodId: 'nip46-bunker',
          connection: new FakeActiveConnection({ methodId: 'nip46-bunker' }),
          instructions: { copyValue: 'bunker://token' },
        }),
      }),
    ]);

    const attempt = await facade.startConnection('nip46-bunker', {
      reason: 'interactive-login',
      connectionToken: 'bunker://token',
    });

    expect(attempt.instructions).toEqual({ copyValue: 'bunker://token' });
    expect(facade.currentAttempt()).toBe(attempt);
    expect(facade.error()).toBeNull();
    expect(facade.authSessionState()).toEqual({
      status: 'awaitingBunkerApproval',
      methodId: 'nip46-bunker',
      attemptId: 1,
    });
  });

  it('cancels a previous attempt before starting a new one', async () => {
    const firstAttempt = new FakeConnectionAttempt('nip46-bunker', {
      methodId: 'nip46-bunker',
      connection: new FakeActiveConnection({ methodId: 'nip46-bunker' }),
    });
    const secondAttempt = new FakeConnectionAttempt('nip07', {
      methodId: 'nip07',
      connection: new FakeActiveConnection({ methodId: 'nip07' }),
    });
    const facade = createFacade([
      new FakeConnectionMethod({ id: 'nip46-bunker', attempt: firstAttempt }),
      new FakeConnectionMethod({ id: 'nip07', attempt: secondAttempt }),
    ]);

    await facade.startConnection('nip46-bunker', {
      reason: 'interactive-login',
      connectionToken: 'bunker://token',
    });
    await facade.startConnection('nip07', { reason: 'interactive-login' });

    expect(firstAttempt.cancelCalls).toBe(1);
    expect(facade.currentAttempt()).toBe(secondAttempt);
  });

  it('completes the current attempt and stores the current session', async () => {
    const connection = new FakeActiveConnection({ methodId: 'nip07' });
    const facade = createFacade([
      new FakeConnectionMethod({
        id: 'nip07',
        attempt: new FakeConnectionAttempt('nip07', { methodId: 'nip07', connection }),
      }),
    ]);

    await facade.startConnection('nip07', { reason: 'interactive-login' });
    const session = await facade.completeCurrentAttempt();

    expect(session).toEqual(connection.getSession());
    expect(facade.currentSession()).toEqual(connection.getSession());
    expect(facade.currentAttempt()).toBeNull();
    expect(facade.authSessionState()).toEqual({ status: 'connected', session });
  });

  it('clears the current attempt when it is cancelled', async () => {
    const attempt = new FakeConnectionAttempt('nip07', {
      methodId: 'nip07',
      connection: new FakeActiveConnection({ methodId: 'nip07' }),
    });
    const facade = createFacade([new FakeConnectionMethod({ id: 'nip07', attempt })]);

    await facade.startConnection('nip07', { reason: 'interactive-login' });
    await facade.cancelCurrentAttempt();

    expect(attempt.cancelCalls).toBe(1);
    expect(facade.currentAttempt()).toBeNull();
    expect(facade.authSessionState()).toEqual({
      status: 'cancelled',
      methodId: 'nip07',
      attemptId: 1,
      reasonCode: 'approval_cancelled',
    });
  });

  it('marks timed out when cancellation reason is timedOut', async () => {
    const attempt = new FakeConnectionAttempt('nip46-nostrconnect', {
      methodId: 'nip46-nostrconnect',
      connection: new FakeActiveConnection({ methodId: 'nip46-nostrconnect' }),
    });
    const facade = createFacade([new FakeConnectionMethod({ id: 'nip46-nostrconnect', attempt })]);

    await facade.startConnection('nip46-nostrconnect', { reason: 'interactive-login' });
    await facade.cancelCurrentAttempt({
      reason: 'timedOut',
      attemptId: facade.getCurrentAttemptId(),
    });

    expect(facade.authSessionState()).toEqual({
      status: 'timedOut',
      methodId: 'nip46-nostrconnect',
      attemptId: 1,
      reasonCode: 'approval_timed_out',
    });
  });

  it('disconnects the current session', async () => {
    const connection = new FakeActiveConnection({ methodId: 'nip07' });
    const facade = createFacade([
      new FakeConnectionMethod({
        id: 'nip07',
        attempt: new FakeConnectionAttempt('nip07', { methodId: 'nip07', connection }),
      }),
    ]);

    await facade.startConnection('nip07', { reason: 'interactive-login' });
    await facade.completeCurrentAttempt();
    await facade.disconnect();

    expect(connection.disconnectCalls).toBe(1);
    expect(facade.currentSession()).toBeNull();
  });

  it('revalidates the current session and updates it', async () => {
    const connection = new FakeActiveConnection({ methodId: 'nip07' });
    const facade = createFacade([
      new FakeConnectionMethod({
        id: 'nip07',
        attempt: new FakeConnectionAttempt('nip07', { methodId: 'nip07', connection }),
      }),
    ]);

    await facade.startConnection('nip07', { reason: 'interactive-login' });
    const session = await facade.completeCurrentAttempt();
    const revalidation = await facade.revalidateCurrentSession();

    expect(revalidation).not.toBeNull();
    expect(revalidation?.previous).toEqual(session);
    expect(facade.currentSession()).toEqual(revalidation?.current);
  });

  it('stores a domain error when start fails', async () => {
    const facade = createFacade([
      new FakeConnectionMethod({
        id: 'nip07',
        startError: new ConnectionDomainError('method_unavailable', 'Unavailable.'),
      }),
    ]);

    await expect(facade.startConnection('nip07', { reason: 'interactive-login' })).rejects.toThrow(
      'Unavailable.'
    );

    expect(facade.error()).toBe('Unavailable.');
    expect(facade.currentAttempt()).toBeNull();
    expect(facade.authSessionState()).toEqual({
      status: 'recoverableRetry',
      reasonCode: 'method_unavailable',
    });
  });

  it('stores a domain error when attempt completion fails', async () => {
    const facade = createFacade([
      new FakeConnectionMethod({
        id: 'nip07',
        attempt: new FakeConnectionAttempt('nip07', {
          methodId: 'nip07',
          connection: new FakeActiveConnection({ methodId: 'nip07' }),
          completeError: new ConnectionDomainError('user_rejected', 'Rejected.'),
        }),
      }),
    ]);

    await facade.startConnection('nip07', { reason: 'interactive-login' });
    await expect(facade.completeCurrentAttempt()).rejects.toThrow('Rejected.');

    expect(facade.error()).toBe('Rejected.');
    expect(facade.currentAttempt()).toBeNull();
    expect(facade.currentSession()).toBeNull();
    expect(facade.authSessionState()).toEqual({
      status: 'recoverableRetry',
      reasonCode: 'user_rejected',
    });
  });

  it('restores a stored nip07 session with signer validation', async () => {
    const storage = createStorage();
    const signer = new FakeConnectionSigner();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip07',
        pubkeyHex: signer.publicKeyHex,
        validatedAt: 1,
      })
    );
    const facade = createFacade([
      new Nip07ConnectionMethod({
        resolveProvider: () => new FakeNip07Provider({ signers: [signer] }),
      }),
    ]);

    const restored = await facade.restoreSessionFromStoredContext();

    expect(restored?.methodId).toBe('nip07');
    expect(facade.currentSession()?.pubkeyHex).toBe(signer.publicKeyHex);
    expect(facade.authSessionState().status).toBe('connected');
  });

  it('fails closed when restore pubkey does not match', async () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip07',
        pubkeyHex: 'b'.repeat(64),
        validatedAt: 1,
      })
    );
    const facade = createFacade([
      new Nip07ConnectionMethod({ resolveProvider: () => new FakeNip07Provider() }),
    ]);

    const restored = await facade.restoreSessionFromStoredContext();

    expect(restored).toBeNull();
    expect(facade.currentSession()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.restore.v1');
    expect(facade.authSessionState()).toEqual({
      status: 'revokedOrUnavailable',
      reasonCode: 'authorization_revoked_or_unavailable',
    });
  });

  it('maps missing provider during restore to reconnect-required state', async () => {
    vi.useFakeTimers();
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip07',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      })
    );
    const facade = createFacade([new Nip07ConnectionMethod({ resolveProvider: () => null })]);

    const restore = facade.restoreSessionFromStoredContext();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(2000);
    const restored = await restore;

    expect(restored).toBeNull();
    expect(facade.currentSession()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.restore.v1');
    expect(facade.authSessionState()).toEqual({
      status: 'revokedOrUnavailable',
      reasonCode: 'authorization_revoked_or_unavailable',
    });
  });

  it('waits for delayed nip07 provider injection before restoring', async () => {
    vi.useFakeTimers();
    const storage = createStorage();
    const signer = new FakeConnectionSigner();
    let provider: FakeNip07Provider | null = null;
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip07',
        pubkeyHex: signer.publicKeyHex,
        validatedAt: 1,
      })
    );
    const facade = createFacade([new Nip07ConnectionMethod({ resolveProvider: () => provider })]);

    const restore = facade.restoreSessionFromStoredContext();
    await Promise.resolve();
    provider = new FakeNip07Provider({ signers: [signer] });
    await vi.advanceTimersByTimeAsync(100);
    const restored = await restore;

    expect(restored?.pubkeyHex).toBe(signer.publicKeyHex);
    expect(facade.authSessionState().status).toBe('connected');
    expect(storage.removeItem).not.toHaveBeenCalledWith('nostr.connect.restore.v1');
  });

  it('maps provider rejection during restore to a safe retry state', async () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip07',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      })
    );
    const facade = createFacade([
      new Nip07ConnectionMethod({
        resolveProvider: () => ({
          getPublicKey: async () => Promise.reject(new Error('User rejected restore.')),
          signEvent: async () => null as never,
        }),
      }),
    ]);

    const restored = await facade.restoreSessionFromStoredContext();

    expect(restored).toBeNull();
    expect(facade.currentSession()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.restore.v1');
    expect(facade.authSessionState()).toEqual({
      status: 'recoverableRetry',
      reasonCode: 'user_rejected',
    });
  });

  it('times out a hanging nip07 restore and leaves a safe retry state', async () => {
    vi.useFakeTimers();
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip07',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      })
    );
    const facade = createFacade([
      new Nip07ConnectionMethod({
        resolveProvider: () => ({
          getPublicKey: () => new Promise<string>(() => undefined),
          signEvent: async () => null as never,
        }),
      }),
    ]);

    const restore = facade.restoreSessionFromStoredContext();
    await Promise.resolve();
    expect(facade.authSessionState()).toEqual({ status: 'restoring', methodId: 'nip07' });

    vi.advanceTimersByTime(8001);
    const restored = await restore;

    expect(restored).toBeNull();
    expect(facade.currentSession()).toBeNull();
    expect(facade.authSessionState()).toEqual({
      status: 'recoverableRetry',
      reasonCode: 'approval_timed_out',
    });
  });

  it('disconnects a restored active connection that resolves after timeout', async () => {
    vi.useFakeTimers();
    const storage = createStorage();
    const connectionDeferred = createDeferred<FakeActiveConnection>();
    const lateConnection = new FakeActiveConnection({ methodId: 'nip07' });
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip07',
        pubkeyHex: lateConnection.getSession().pubkeyHex,
        validatedAt: 1,
      })
    );
    const method = new Nip07ConnectionMethod({ resolveProvider: () => null });
    vi.spyOn(method, 'restoreActiveConnection').mockReturnValue(connectionDeferred.promise);
    const facade = createFacade([method]);

    const restore = facade.restoreSessionFromStoredContext();
    await Promise.resolve();
    vi.advanceTimersByTime(8001);
    await expect(restore).resolves.toBeNull();

    connectionDeferred.resolve(lateConnection);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(lateConnection.disconnectCalls).toBe(1);
  });

  it('ignores stale restore completion after disconnect', async () => {
    const storage = createStorage();
    const signer = new FakeConnectionSigner();
    const pubkeyDeferred = createDeferred<string>();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip07',
        pubkeyHex: signer.publicKeyHex,
        validatedAt: 1,
      })
    );
    const facade = createFacade([
      new Nip07ConnectionMethod({
        resolveProvider: () => ({
          getPublicKey: () => pubkeyDeferred.promise,
          signEvent: async () => null as never,
        }),
      }),
    ]);

    const restore = facade.restoreSessionFromStoredContext();
    await Promise.resolve();
    await facade.disconnect();
    pubkeyDeferred.resolve(signer.publicKeyHex);

    await expect(restore).resolves.toBeNull();
    expect(facade.currentSession()).toBeNull();
    expect(facade.authSessionState()).toEqual({ status: 'disconnected' });
  });

  it('detects either nip07 or nip46 restore context without starting a connection', () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.nip46.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'payload',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      })
    );
    const starter = new FakeNip46NostrconnectStarter();
    const facade = createFacade([new Nip46NostrconnectConnectionMethod(starter)]);

    expect(facade.hasRestoreContext()).toBe(true);
    expect(starter.startCalls).toBe(0);
  });

  it('restores a stored nip46 external signer session with signer validation', async () => {
    const storage = createStorage();
    const remoteSigner = createRemoteSigner('a'.repeat(64));
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.nip46.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'payload',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      })
    );
    const facade = createFacade([
      new Nip46NostrconnectConnectionMethod(new FakeNip46NostrconnectStarter(), {
        restoreRemoteSigner: vi.fn().mockResolvedValue(remoteSigner),
      }),
    ]);

    const restore = facade.restoreSessionFromStoredContext();
    expect(facade.authSessionState()).toEqual({
      status: 'restoring',
      methodId: 'nip46-nostrconnect',
    });
    const restored = await restore;

    expect(restored?.methodId).toBe('nip46-nostrconnect');
    expect(facade.currentSession()?.pubkeyHex).toBe('a'.repeat(64));
    expect(facade.ndkSigner()).toEqual({ marker: 'ndk-signer' });
    expect(facade.authSessionState().status).toBe('connected');
  });

  it('prefers nip46 restore when unrelated nip07 compatibility data also exists', async () => {
    const storage = createStorage();
    const remoteSigner = createRemoteSigner('a'.repeat(64));
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip07',
        pubkeyHex: 'b'.repeat(64),
        validatedAt: 1,
      })
    );
    storage.setItem(
      'nostr.connect.nip46.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'payload',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      })
    );
    const facade = createFacade([
      new Nip07ConnectionMethod({ resolveProvider: () => null }),
      new Nip46NostrconnectConnectionMethod(new FakeNip46NostrconnectStarter(), {
        restoreRemoteSigner: vi.fn().mockResolvedValue(remoteSigner),
      }),
    ]);

    const restored = await facade.restoreSessionFromStoredContext();

    expect(restored?.methodId).toBe('nip46-nostrconnect');
    expect(storage.removeItem).not.toHaveBeenCalledWith('nostr.connect.restore.v1');
  });

  it('purges nip46 restore context when restored user pubkey does not match', async () => {
    const storage = createStorage();
    const remoteSigner = createRemoteSigner('b'.repeat(64));
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.nip46.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'payload',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      })
    );
    const facade = createFacade([
      new Nip46NostrconnectConnectionMethod(new FakeNip46NostrconnectStarter(), {
        restoreRemoteSigner: vi.fn().mockResolvedValue(remoteSigner),
      }),
    ]);

    const restored = await facade.restoreSessionFromStoredContext();

    expect(restored).toBeNull();
    expect(facade.currentSession()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.nip46.restore.v1');
    expect(facade.authSessionState()).toEqual({
      status: 'revokedOrUnavailable',
      reasonCode: 'authorization_revoked_or_unavailable',
    });
  });

  it('saves nip46 restore context only after validated interactive nostrconnect login', async () => {
    const storage = createStorage();
    const remoteSigner = createRemoteSigner('a'.repeat(64), 'saved-payload');
    vi.stubGlobal('localStorage', storage);
    const facade = createFacade([
      new Nip46NostrconnectConnectionMethod(
        new FakeNip46NostrconnectStarter({
          attempt: new FakeNip46NostrconnectAttemptHandle({ remoteSigner }),
        })
      ),
    ]);

    await facade.startConnection('nip46-nostrconnect', { reason: 'interactive-login' });
    await facade.completeCurrentAttempt();

    expect(JSON.parse(storage.getItem('nostr.connect.nip46.restore.v1') ?? '')).toEqual({
      version: 1,
      methodId: 'nip46-nostrconnect',
      restorePayload: 'saved-payload',
      pubkeyHex: 'a'.repeat(64),
      validatedAt: expect.any(Number),
    });
  });

  it('clears nip46 restore context on disconnect', async () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem('nostr.connect.restore.v1', 'nip07');
    storage.setItem('nostr.connect.nip46.restore.v1', 'nip46');
    const facade = createFacade([]);

    await facade.disconnect();

    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.nip46.restore.v1');
    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.restore.v1');
  });

  it('clears nip46 restore context when restore is superseded by a newer attempt', async () => {
    const storage = createStorage();
    const remoteSigner = createRemoteSigner('a'.repeat(64));
    const restoreRemoteSigner = vi.fn().mockResolvedValue(remoteSigner);
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.nip46.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'payload',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      })
    );
    const facade = createFacade([
      new Nip46NostrconnectConnectionMethod(new FakeNip46NostrconnectStarter(), {
        restoreRemoteSigner,
      }),
      new FakeConnectionMethod({
        id: 'nip07',
        attempt: new FakeConnectionAttempt('nip07', {
          methodId: 'nip07',
          connection: new FakeActiveConnection({ methodId: 'nip07' }),
        }),
      }),
    ]);

    const restore = facade.restoreSessionFromStoredContext();
    await facade.startConnection('nip07', { reason: 'interactive-login' });
    await restore;

    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.nip46.restore.v1');
  });
});

function createFacade(
  methods: (FakeConnectionMethod | Nip07ConnectionMethod | Nip46NostrconnectConnectionMethod)[]
): ConnectionFacade {
  const orchestrator = new ConnectionOrchestrator(methods, new InMemoryConnectionSessionStore());
  return new ConnectionFacade(orchestrator);
}

function createStorage() {
  const map = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => map.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      map.delete(key);
    }),
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

function createRemoteSigner(pubkeyHex: string, payload = 'payload'): Nip46RemoteSigner {
  return {
    ndkSigner: { marker: 'ndk-signer' },
    async getPublicKey(): Promise<string> {
      return pubkeyHex;
    },
    async sign(): Promise<string> {
      return 'f'.repeat(128);
    },
    stop: vi.fn(),
    toPayload: vi.fn(() => payload),
  };
}
