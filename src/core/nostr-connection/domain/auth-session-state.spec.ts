import { createConnectionSession } from './connection-session';
import {
  isAuthSessionConnected,
  isAuthSessionPending,
  isAuthSessionRecoverable,
  requiresReconnect,
  type AuthSessionState,
} from './auth-session-state';

describe('auth session state', () => {
  it('supports all required statuses', () => {
    const session = createConnectionSession({
      pubkeyHex: 'a'.repeat(64),
      methodId: 'nip07',
      capabilities: ['sign-event'],
    });

    const states: AuthSessionState[] = [
      { status: 'disconnected' },
      { status: 'detectingSigner' },
      { status: 'awaitingPermission', methodId: 'nip07', attemptId: 1 },
      { status: 'awaitingExternalSignerApproval', methodId: 'nip46-nostrconnect', attemptId: 1 },
      { status: 'awaitingBunkerApproval', methodId: 'nip46-bunker', attemptId: 1 },
      { status: 'connected', session },
      { status: 'restoring', methodId: 'nip46-nostrconnect' },
      { status: 'expired', reasonCode: 'authorization_expired' },
      { status: 'revokedOrUnavailable', reasonCode: 'authorization_revoked_or_unavailable' },
      { status: 'cancelled', methodId: 'nip07', attemptId: 1, reasonCode: 'approval_cancelled' },
      {
        status: 'timedOut',
        methodId: 'nip46-nostrconnect',
        attemptId: 1,
        reasonCode: 'approval_timed_out',
      },
      { status: 'failed', reasonCode: 'connection_failed' },
      { status: 'recoverableRetry', reasonCode: 'method_unavailable' },
    ];

    expect(states).toHaveLength(13);
  });

  it('identifies connected state only when session exists', () => {
    const connected: AuthSessionState = {
      status: 'connected',
      session: createConnectionSession({
        pubkeyHex: 'b'.repeat(64),
        methodId: 'nip46-bunker',
        capabilities: ['sign-event', 'nip98-auth'],
      }),
    };
    const disconnected: AuthSessionState = { status: 'disconnected' };

    expect(isAuthSessionConnected(connected)).toBe(true);
    expect(isAuthSessionConnected(disconnected)).toBe(false);
  });

  it('identifies pending states', () => {
    const pendingStates: AuthSessionState[] = [
      { status: 'detectingSigner' },
      { status: 'awaitingPermission', methodId: 'nip07', attemptId: 1 },
      { status: 'awaitingExternalSignerApproval', methodId: 'nip46-nostrconnect', attemptId: 2 },
      { status: 'awaitingBunkerApproval', methodId: 'nip46-bunker', attemptId: 3 },
      { status: 'restoring', methodId: 'nip07' },
    ];

    expect(pendingStates.every((state) => isAuthSessionPending(state))).toBe(true);
    expect(
      isAuthSessionPending({
        status: 'connected',
        session: createConnectionSession({
          pubkeyHex: 'c'.repeat(64),
          methodId: 'nip07',
          capabilities: ['sign-event'],
        }),
      })
    ).toBe(false);
  });

  it('identifies recoverable and reconnect-required states', () => {
    const recoverable: AuthSessionState = {
      status: 'recoverableRetry',
      reasonCode: 'connection_failed',
    };
    const revoked: AuthSessionState = {
      status: 'revokedOrUnavailable',
      reasonCode: 'authorization_revoked_or_unavailable',
    };

    expect(isAuthSessionRecoverable(recoverable)).toBe(true);
    expect(isAuthSessionRecoverable(revoked)).toBe(true);
    expect(requiresReconnect(revoked)).toBe(true);
    expect(requiresReconnect({ status: 'disconnected' })).toBe(true);
    expect(requiresReconnect({ status: 'failed', reasonCode: 'validation_failed' })).toBe(false);
  });
});
