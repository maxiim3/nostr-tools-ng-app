import { computed, Injectable, signal } from '@angular/core';
import type { NDKSigner } from '@nostr-dev-kit/ndk';

import type { ActiveConnection, ConnectionRevalidationResult } from '../domain/active-connection';
import type { ConnectionAttempt } from '../domain/connection-attempt';
import { ConnectionDomainError } from '../domain/connection-errors';
import type { ConnectionMethodId } from '../domain/connection-method-id';
import type { ConnectionRequest } from '../domain/connection-method';
import type { ConnectionSession } from '../domain/connection-session';
import type { AuthSessionFailureReasonCode, AuthSessionState } from '../domain/auth-session-state';
import { isAuthSessionConnected } from '../domain/auth-session-state';
import { ConnectionOrchestrator } from './connection-orchestrator';
import { createDefaultConnectionOrchestrator } from './default-connection-orchestrator';

type AttemptTerminalStatus =
  | { kind: 'none' }
  | { kind: 'cancelled'; methodId: ConnectionMethodId; attemptId: number }
  | { kind: 'timedOut'; methodId: ConnectionMethodId; attemptId: number }
  | { kind: 'failed'; reasonCode: AuthSessionFailureReasonCode };

interface AttemptCancellationOptions {
  reason?: 'cancelled' | 'timedOut';
  attemptId?: number;
}

export class ConnectionFacade {
  readonly availableMethodIds = signal<ConnectionMethodId[]>([]);
  readonly currentAttempt = signal<ConnectionAttempt | null>(null);
  readonly currentSession = signal<ConnectionSession | null>(null);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  private readonly _attemptId = signal(0);
  private readonly _attemptTerminalStatus = signal<AttemptTerminalStatus>({ kind: 'none' });
  readonly authSessionState = computed<AuthSessionState>(() => {
    const session = this.currentSession();
    if (session) {
      return { status: 'connected', session };
    }

    const attempt = this.currentAttempt();
    if (attempt) {
      if (attempt.methodId === 'nip46-nostrconnect') {
        return {
          status: 'awaitingExternalSignerApproval',
          methodId: 'nip46-nostrconnect',
          attemptId: this._attemptId(),
        };
      }

      if (attempt.methodId === 'nip46-bunker') {
        return {
          status: 'awaitingBunkerApproval',
          methodId: 'nip46-bunker',
          attemptId: this._attemptId(),
        };
      }

      return {
        status: 'awaitingPermission',
        methodId: attempt.methodId,
        attemptId: this._attemptId(),
      };
    }

    const terminalStatus = this._attemptTerminalStatus();
    if (terminalStatus.kind === 'timedOut') {
      return {
        status: 'timedOut',
        methodId: terminalStatus.methodId,
        attemptId: terminalStatus.attemptId,
        reasonCode: 'approval_timed_out',
      };
    }

    if (terminalStatus.kind === 'cancelled') {
      return {
        status: 'cancelled',
        methodId: terminalStatus.methodId,
        attemptId: terminalStatus.attemptId,
        reasonCode: 'approval_cancelled',
      };
    }

    if (terminalStatus.kind === 'failed') {
      return { status: 'recoverableRetry', reasonCode: terminalStatus.reasonCode };
    }

    if (this.pending()) {
      return { status: 'detectingSigner' };
    }

    return { status: 'disconnected' };
  });
  readonly isAuthenticated = computed(() => isAuthSessionConnected(this.authSessionState()));
  readonly ndkSigner = signal<NDKSigner | null>(null);

  constructor(private readonly orchestrator: ConnectionOrchestrator) {}

  clearError(): void {
    this.error.set(null);
  }

  getActiveConnection(): ActiveConnection | null {
    return this.orchestrator.getActiveConnection();
  }

  async refreshAvailableMethods(): Promise<ConnectionMethodId[]> {
    const availableMethodIds = await this.orchestrator.listAvailableMethodIds();
    this.availableMethodIds.set(availableMethodIds);
    return availableMethodIds;
  }

  async startConnection(
    methodId: ConnectionMethodId,
    request: ConnectionRequest
  ): Promise<ConnectionAttempt> {
    let startedAttemptId = 0;
    this.pending.set(true);
    this.error.set(null);

    try {
      if (this.currentAttempt()) {
        await this.cancelCurrentAttempt();
      }

      const attemptId = this._attemptId() + 1;
      startedAttemptId = attemptId;
      this._attemptTerminalStatus.set({ kind: 'none' });
      this._attemptId.set(attemptId);

      const attempt = await this.orchestrator.start(methodId, request);
      if (this._attemptId() !== attemptId) {
        await attempt.cancel().catch(() => undefined);
        throw new ConnectionDomainError(
          'connection_failed',
          'Connection attempt is no longer active.'
        );
      }

      this.currentAttempt.set(attempt);
      return attempt;
    } catch (error) {
      if (startedAttemptId !== 0 && this._attemptId() !== startedAttemptId) {
        throw error;
      }

      this.error.set(resolveConnectionErrorMessage(error));
      this._attemptTerminalStatus.set({
        kind: 'failed',
        reasonCode: resolveAuthSessionFailureReasonCode(error),
      });
      throw error;
    } finally {
      this.pending.set(false);
    }
  }

  async completeCurrentAttempt(): Promise<ConnectionSession> {
    const attempt = this.currentAttempt();
    if (!attempt) {
      throw new Error('No connection attempt is active.');
    }
    const attemptId = this._attemptId();

    this.pending.set(true);
    this.error.set(null);

    try {
      const session = await this.orchestrator.completeAttempt(attempt, () =>
        this.isCurrentAttempt(attempt, attemptId)
      );
      this.currentSession.set(session);
      this.currentAttempt.set(null);
      this._attemptTerminalStatus.set({ kind: 'none' });
      this.syncNdkSigner();
      return session;
    } catch (error) {
      if (!this.isCurrentAttempt(attempt, attemptId)) {
        throw error;
      }

      this.currentAttempt.set(null);
      this.error.set(resolveConnectionErrorMessage(error));
      this._attemptTerminalStatus.set({
        kind: 'failed',
        reasonCode: resolveAuthSessionFailureReasonCode(error),
      });
      throw error;
    } finally {
      this.pending.set(false);
    }
  }

  async cancelCurrentAttempt(options: AttemptCancellationOptions = {}): Promise<void> {
    const attempt = this.currentAttempt();
    if (!attempt) {
      return;
    }
    const activeAttemptId = this._attemptId();
    if (options.attemptId !== undefined && options.attemptId !== activeAttemptId) {
      return;
    }

    this.pending.set(true);
    this.currentAttempt.set(null);
    this._attemptTerminalStatus.set({
      kind: options.reason === 'timedOut' ? 'timedOut' : 'cancelled',
      methodId: attempt.methodId,
      attemptId: activeAttemptId,
    });

    try {
      await attempt.cancel();
    } finally {
      this.pending.set(false);
    }
  }

  async disconnect(): Promise<void> {
    this.pending.set(true);
    this.error.set(null);

    try {
      await this.cancelCurrentAttempt();
      await this.orchestrator.disconnect();
      this.currentSession.set(null);
      this.ndkSigner.set(null);
      this._attemptTerminalStatus.set({ kind: 'none' });
    } finally {
      this.pending.set(false);
    }
  }

  getCurrentAttemptId(): number {
    return this._attemptId();
  }

  async revalidateCurrentSession(): Promise<ConnectionRevalidationResult | null> {
    const revalidation = await this.orchestrator.revalidateCurrent();

    if (revalidation) {
      this.currentSession.set(revalidation.current);
    }

    return revalidation;
  }

  private syncNdkSigner(): void {
    const connection = this.orchestrator.getActiveConnection();
    if (!connection) {
      this.ndkSigner.set(null);
      return;
    }

    const signer = connection.signer;
    if (signer && typeof signer === 'object' && 'ndkSigner' in signer) {
      this.ndkSigner.set((signer as { ndkSigner: NDKSigner }).ndkSigner);
    } else {
      this.ndkSigner.set(null);
    }
  }

  private isCurrentAttempt(attempt: ConnectionAttempt, attemptId: number): boolean {
    return this.currentAttempt() === attempt && this._attemptId() === attemptId;
  }
}

@Injectable({ providedIn: 'root' })
export class NostrConnectionFacadeService extends ConnectionFacade {
  constructor() {
    super(createDefaultConnectionOrchestrator());
  }
}

function resolveConnectionErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to complete the connection flow.';
}

function resolveAuthSessionFailureReasonCode(error: unknown): AuthSessionFailureReasonCode {
  if (error instanceof ConnectionDomainError) {
    switch (error.code) {
      case 'method_unavailable':
        return 'method_unavailable';
      case 'user_rejected':
        return 'user_rejected';
      case 'timeout':
        return 'approval_timed_out';
      case 'invalid_pubkey':
      case 'validation_failed':
        return 'validation_failed';
      case 'connection_failed':
      case 'no_active_connection':
      case 'unsupported_capability':
        return 'connection_failed';
    }
  }

  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const message = error.message.toLowerCase();
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'approval_timed_out';
  }

  if (message.includes('reject') || message.includes('denied') || message.includes('cancel')) {
    return 'user_rejected';
  }

  if (message.includes('unavailable') || message.includes('not found')) {
    return 'method_unavailable';
  }

  if (message.includes('invalid')) {
    return 'validation_failed';
  }

  return 'connection_failed';
}
