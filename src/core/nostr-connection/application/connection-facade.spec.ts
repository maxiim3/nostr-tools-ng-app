import { ConnectionFacade } from './connection-facade';
import { ConnectionOrchestrator } from './connection-orchestrator';
import { InMemoryConnectionSessionStore } from './in-memory-connection-session-store';
import { ConnectionDomainError } from '../domain/connection-errors';
import { FakeConnectionMethod } from '../testing/fakes/fake-connection-method';
import { FakeConnectionAttempt } from '../testing/fakes/fake-connection-attempt';
import { FakeActiveConnection } from '../testing/fakes/fake-active-connection';

describe('ConnectionFacade', () => {
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
});

function createFacade(methods: FakeConnectionMethod[]): ConnectionFacade {
  const orchestrator = new ConnectionOrchestrator(methods, new InMemoryConnectionSessionStore());
  return new ConnectionFacade(orchestrator);
}
