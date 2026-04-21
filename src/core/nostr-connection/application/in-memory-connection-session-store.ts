import type { ConnectionRevalidationResult } from '../domain/active-connection';
import type { ActiveConnection } from '../domain/active-connection';
import type { ConnectionSessionStore } from '../domain/connection-session-store';

export class InMemoryConnectionSessionStore implements ConnectionSessionStore {
  private current: ActiveConnection | null = null;

  getCurrent(): ActiveConnection | null {
    return this.current;
  }

  setCurrent(connection: ActiveConnection): void {
    this.current = connection;
  }

  async clear(): Promise<void> {
    const current = this.current;
    this.current = null;

    if (!current) {
      return;
    }

    await current.disconnect();
  }

  async revalidateCurrent(): Promise<ConnectionRevalidationResult | null> {
    if (!this.current) {
      return null;
    }

    return this.current.revalidate();
  }
}
