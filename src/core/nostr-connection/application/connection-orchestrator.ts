import type { ActiveConnection, ConnectionRevalidationResult } from '../domain/active-connection';
import type { ConnectionAttempt } from '../domain/connection-attempt';
import type { ConnectionMethod, ConnectionRequest } from '../domain/connection-method';
import { ConnectionDomainError } from '../domain/connection-errors';
import type { ConnectionMethodId } from '../domain/connection-method-id';
import type { ConnectionSession } from '../domain/connection-session';
import type { ConnectionSessionStore } from '../domain/connection-session-store';

export class ConnectionOrchestrator {
  private readonly methodsById: ReadonlyMap<ConnectionMethodId, ConnectionMethod>;

  constructor(
    private readonly methods: readonly ConnectionMethod[],
    private readonly store: ConnectionSessionStore
  ) {
    this.methodsById = new Map(methods.map((method) => [method.id, method]));
  }

  getRegisteredMethodIds(): ConnectionMethodId[] {
    return this.methods.map((method) => method.id);
  }

  getMethod(methodId: ConnectionMethodId): ConnectionMethod | undefined {
    return this.methodsById.get(methodId);
  }

  async listAvailableMethodIds(): Promise<ConnectionMethodId[]> {
    const availability = await Promise.all(
      this.methods.map(async (method) => ({
        id: method.id,
        available: await method.isAvailable(),
      }))
    );

    return availability.filter((entry) => entry.available).map((entry) => entry.id);
  }

  getCurrentSession(): ConnectionSession | null {
    return this.store.getCurrent()?.getSession() ?? null;
  }

  getActiveConnection(): ActiveConnection | null {
    return this.store.getCurrent();
  }

  async start(
    methodId: ConnectionMethodId,
    request: ConnectionRequest = { reason: 'interactive-login' }
  ): Promise<ConnectionAttempt> {
    const method = this.methodsById.get(methodId);
    if (!method) {
      throw new ConnectionDomainError(
        'method_unavailable',
        `Connection method ${methodId} is not registered.`
      );
    }

    return method.start(request);
  }

  async completeAttempt(
    attempt: ConnectionAttempt,
    shouldCommit: () => boolean = () => true
  ): Promise<ConnectionSession> {
    const nextConnection = await attempt.complete();
    if (!shouldCommit()) {
      await nextConnection.disconnect();
      throw new ConnectionDomainError(
        'connection_failed',
        'Connection attempt is no longer active.'
      );
    }

    const previousConnection = this.store.getCurrent();

    this.store.setCurrent(nextConnection);

    if (previousConnection && previousConnection !== nextConnection) {
      await previousConnection.disconnect();
    }

    return nextConnection.getSession();
  }

  async connect(
    methodId: ConnectionMethodId,
    request: ConnectionRequest = { reason: 'interactive-login' }
  ): Promise<ConnectionSession> {
    const attempt = await this.start(methodId, request);
    return this.completeAttempt(attempt);
  }

  async revalidateCurrent(): Promise<ConnectionRevalidationResult | null> {
    return this.store.revalidateCurrent();
  }

  async disconnect(): Promise<void> {
    await this.store.clear();
  }
}
