import { describe, expect, it } from 'vitest';
import type { ActiveConnection } from '../../domain/active-connection';
import type { ConnectionSessionStore } from '../../domain/connection-session-store';

export interface ConnectionSessionStoreHarness {
  connection: ActiveConnection;
  getDisconnectCalls(): number;
  getRevalidateCalls(): number;
}

export interface ConnectionSessionStoreContractHarness {
  createStore(): ConnectionSessionStore;
  createConnection(options?: { changeIdentity?: boolean }): ConnectionSessionStoreHarness;
}

export function runConnectionSessionStoreContract(
  harness: ConnectionSessionStoreContractHarness
): void {
  describe('ConnectionSessionStore contract', () => {
    it('is empty by default', () => {
      const store = harness.createStore();

      expect(store.getCurrent()).toBeNull();
    });

    it('stores and exposes the current active connection', () => {
      const store = harness.createStore();
      const current = harness.createConnection();

      store.setCurrent(current.connection);

      expect(store.getCurrent()).toBe(current.connection);
    });

    it('returns null when revalidating without an active connection', async () => {
      const store = harness.createStore();

      await expect(store.revalidateCurrent()).resolves.toBeNull();
    });

    it('delegates revalidation to the active connection', async () => {
      const store = harness.createStore();
      const current = harness.createConnection({ changeIdentity: true });
      store.setCurrent(current.connection);

      const result = await store.revalidateCurrent();

      expect(result).not.toBeNull();
      expect(result?.changed).toBe(true);
      expect(current.getRevalidateCalls()).toBe(1);
      expect(store.getCurrent()?.getSession()).toEqual(result?.current);
    });

    it('disconnects and clears the current connection on logout', async () => {
      const store = harness.createStore();
      const current = harness.createConnection();
      store.setCurrent(current.connection);

      await store.clear();

      expect(current.getDisconnectCalls()).toBe(1);
      expect(store.getCurrent()).toBeNull();
    });
  });
}
