import type { ConnectionMethodId } from './connection-method-id';
import type { ConnectionSession } from './connection-session';

export type AuthSessionFailureReasonCode =
  | 'connection_failed'
  | 'user_rejected'
  | 'method_unavailable'
  | 'signer_unavailable'
  | 'approval_timed_out'
  | 'approval_cancelled'
  | 'authorization_expired'
  | 'authorization_revoked_or_unavailable'
  | 'authorization_invalid'
  | 'validation_failed'
  | 'unknown';

export type AuthSessionState =
  | { status: 'disconnected' }
  | { status: 'detectingSigner' }
  | { status: 'awaitingPermission'; methodId: ConnectionMethodId; attemptId: number }
  | {
      status: 'awaitingExternalSignerApproval';
      methodId: 'nip46-nostrconnect';
      attemptId: number;
    }
  | {
      status: 'awaitingBunkerApproval';
      methodId: 'nip46-bunker';
      attemptId: number;
    }
  | { status: 'connected'; session: ConnectionSession }
  | { status: 'restoring'; methodId: ConnectionMethodId }
  | { status: 'expired'; reasonCode: 'authorization_expired' }
  | { status: 'revokedOrUnavailable'; reasonCode: 'authorization_revoked_or_unavailable' }
  | {
      status: 'cancelled';
      methodId: ConnectionMethodId;
      attemptId: number;
      reasonCode: 'approval_cancelled';
    }
  | {
      status: 'timedOut';
      methodId: ConnectionMethodId;
      attemptId: number;
      reasonCode: 'approval_timed_out';
    }
  | { status: 'failed'; reasonCode: AuthSessionFailureReasonCode }
  | { status: 'recoverableRetry'; reasonCode: AuthSessionFailureReasonCode };

export function isAuthSessionConnected(
  state: AuthSessionState
): state is Extract<AuthSessionState, { status: 'connected' }> {
  return state.status === 'connected';
}

export function isAuthSessionPending(state: AuthSessionState): boolean {
  return (
    state.status === 'detectingSigner' ||
    state.status === 'awaitingPermission' ||
    state.status === 'awaitingExternalSignerApproval' ||
    state.status === 'awaitingBunkerApproval' ||
    state.status === 'restoring'
  );
}

export function isAuthSessionRecoverable(state: AuthSessionState): boolean {
  return (
    state.status === 'recoverableRetry' ||
    state.status === 'timedOut' ||
    state.status === 'cancelled' ||
    state.status === 'revokedOrUnavailable' ||
    state.status === 'expired'
  );
}

export function requiresReconnect(state: AuthSessionState): boolean {
  return (
    state.status === 'revokedOrUnavailable' ||
    state.status === 'expired' ||
    state.status === 'disconnected'
  );
}
