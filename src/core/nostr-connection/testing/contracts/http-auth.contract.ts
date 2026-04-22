import { describe, expect, it } from 'vitest';
import { unpackEventFromToken, validateEvent as validateNip98Event } from 'nostr-tools/nip98';

import type { HttpAuthPort } from '../../domain/http-auth';
import type { ConnectionSigner } from '../../domain/connection-signer';

export interface HttpAuthContractHarness {
  createService(): HttpAuthPort;
  createSigner(): ConnectionSigner;
}

export function runHttpAuthContract(harness: HttpAuthContractHarness): void {
  describe('HttpAuthPort contract', () => {
    it('creates a NIP-98 Authorization header that validates server-side', async () => {
      const service = harness.createService();
      const signer = harness.createSigner();
      const request = {
        url: 'https://example.com/api/pack-requests',
        method: 'POST',
        body: { displayName: 'Alice', imageUrl: 'img.png' },
      };

      const header = await service.createAuthorizationHeader(signer, request);
      const event = await unpackEventFromToken(header);

      expect(header.startsWith('Nostr ')).toBe(true);
      expect(event.pubkey).toBe(await signer.getPublicKey());
      await expect(
        validateNip98Event(event, request.url, request.method, request.body)
      ).resolves.toBe(true);
      expect(event.tags.some((tag) => tag[0] === 'payload')).toBe(true);
    });

    it('rejects invalid absolute URLs', async () => {
      const service = harness.createService();
      const signer = harness.createSigner();

      await expect(
        service.createAuthorizationHeader(signer, { url: '/relative', method: 'GET' })
      ).rejects.toMatchObject({
        code: 'validation_failed',
      });
    });

    it('rejects when the signer does not support NIP-98 auth', async () => {
      const service = harness.createService();
      const baseSigner = harness.createSigner();
      const signer = {
        getPublicKey: () => baseSigner.getPublicKey(),
        signEvent: (event) => baseSigner.signEvent(event),
        supports: () => false,
      } satisfies ConnectionSigner;

      await expect(
        service.createAuthorizationHeader(signer, {
          url: 'https://example.com/api/pack-requests',
          method: 'GET',
        })
      ).rejects.toMatchObject({
        code: 'unsupported_capability',
      });
    });

    it('rejects when no signer is provided', async () => {
      const service = harness.createService();

      await expect(
        service.createAuthorizationHeader(null as unknown as ConnectionSigner, {
          url: 'https://example.com/api/pack-requests',
          method: 'GET',
        })
      ).rejects.toMatchObject({
        code: 'no_active_connection',
      });
    });
  });
}
