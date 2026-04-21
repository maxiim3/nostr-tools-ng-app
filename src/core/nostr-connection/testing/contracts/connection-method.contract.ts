import { describe, expect, it } from 'vitest';
import type { ConnectionMethod } from '../../domain/connection-method';
import type { ConnectionMethodId } from '../../domain/connection-method-id';
import type { ConnectionRequest } from '../../domain/connection-method';

export interface ConnectionMethodContractHarness {
  expectedId: ConnectionMethodId;
  createAvailableMethod(): ConnectionMethod;
  createUnavailableMethod(): ConnectionMethod;
  createRejectedMethod(): ConnectionMethod;
  createIdentityChangingMethod(): ConnectionMethod;
  availableRequest?: ConnectionRequest;
  rejectedRequest?: ConnectionRequest;
  identityChangingRequest?: ConnectionRequest;
}

export function runConnectionMethodContract(harness: ConnectionMethodContractHarness): void {
  describe('ConnectionMethod contract', () => {
    it('exposes a stable method id', () => {
      const method = harness.createAvailableMethod();

      expect(method.id).toBe(harness.expectedId);
    });

    it('reports availability and returns a matching active connection', async () => {
      const method = harness.createAvailableMethod();
      await expect(method.isAvailable()).resolves.toBe(true);

      const attempt = await method.start(
        harness.availableRequest ?? { reason: 'interactive-login' }
      );
      const connection = await attempt.complete();
      const session = connection.getSession();

      expect(attempt.methodId).toBe(harness.expectedId);
      expect(session.methodId).toBe(harness.expectedId);
      await expect(connection.signer.getPublicKey()).resolves.toBe(session.pubkeyHex);
    });

    it('fails with a domain error when the method is unavailable', async () => {
      const method = harness.createUnavailableMethod();
      await expect(method.isAvailable()).resolves.toBe(false);

      await expect(method.start()).rejects.toMatchObject({
        code: 'method_unavailable',
      });
    });

    it('surfaces user rejection as a domain error', async () => {
      const method = harness.createRejectedMethod();

      const attempt = await method.start(harness.rejectedRequest);

      await expect(attempt.complete()).rejects.toMatchObject({
        code: 'user_rejected',
      });
    });

    it('revalidates identity changes explicitly', async () => {
      const method = harness.createIdentityChangingMethod();
      const attempt = await method.start(harness.identityChangingRequest);
      const connection = await attempt.complete();

      const revalidation = await connection.revalidate();

      expect(revalidation.changed).toBe(true);
      expect(revalidation.current.pubkeyHex).not.toBe(revalidation.previous.pubkeyHex);
      expect(connection.getSession()).toEqual(revalidation.current);
      await expect(connection.signer.getPublicKey()).resolves.toBe(revalidation.current.pubkeyHex);
    });
  });
}
