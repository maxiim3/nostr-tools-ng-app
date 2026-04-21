import type { ConnectionRevalidationResult } from '../domain/active-connection';
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

  async connect(
    methodId: ConnectionMethodId,
    request: ConnectionRequest = { reason: 'interactive-login' }
  ): Promise<ConnectionSession> {
    const method = this.methodsById.get(methodId);
    if (!method) {
      throw new ConnectionDomainError(
        'method_unavailable',
        `Connection method ${methodId} is not registered.`
      );
    }

    const attempt = await method.start(request);
    const nextConnection = await attempt.complete();
    const previousConnection = this.store.getCurrent();

    this.store.setCurrent(nextConnection);

    if (previousConnection && previousConnection !== nextConnection) {
      await previousConnection.disconnect();
    }

    return nextConnection.getSession();
  }

  async revalidateCurrent(): Promise<ConnectionRevalidationResult | null> {
    return this.store.revalidateCurrent();
  }

  async disconnect(): Promise<void> {
    await this.store.clear();
  }
}
