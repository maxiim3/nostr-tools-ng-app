import { computed, Injectable, signal } from '@angular/core';
import type { NDKSigner } from '@nostr-dev-kit/ndk';

import type { ActiveConnection, ConnectionRevalidationResult } from '../domain/active-connection';
import type { ConnectionAttempt } from '../domain/connection-attempt';
import type { ConnectionMethodId } from '../domain/connection-method-id';
import type { ConnectionRequest } from '../domain/connection-method';
import type { ConnectionSession } from '../domain/connection-session';
import { ConnectionOrchestrator } from './connection-orchestrator';
import { createDefaultConnectionOrchestrator } from './default-connection-orchestrator';

export class ConnectionFacade {
  readonly availableMethodIds = signal<ConnectionMethodId[]>([]);
  readonly currentAttempt = signal<ConnectionAttempt | null>(null);
  readonly currentSession = signal<ConnectionSession | null>(null);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.currentSession() !== null);
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
    this.pending.set(true);
    this.error.set(null);

    try {
      if (this.currentAttempt()) {
        await this.cancelCurrentAttempt();
      }

      const attempt = await this.orchestrator.start(methodId, request);
      this.currentAttempt.set(attempt);
      return attempt;
    } catch (error) {
      this.error.set(resolveConnectionErrorMessage(error));
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

    this.pending.set(true);
    this.error.set(null);

    try {
      const session = await this.orchestrator.completeAttempt(attempt);
      this.currentSession.set(session);
      this.currentAttempt.set(null);
      this.syncNdkSigner();
      return session;
    } catch (error) {
      this.currentAttempt.set(null);
      this.error.set(resolveConnectionErrorMessage(error));
      throw error;
    } finally {
      this.pending.set(false);
    }
  }

  async cancelCurrentAttempt(): Promise<void> {
    const attempt = this.currentAttempt();
    if (!attempt) {
      return;
    }

    this.pending.set(true);

    try {
      await attempt.cancel();
      this.currentAttempt.set(null);
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
    } finally {
      this.pending.set(false);
    }
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
