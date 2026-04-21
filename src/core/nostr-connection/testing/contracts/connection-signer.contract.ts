import { describe, expect, it } from 'vitest';
import { verifyEvent } from 'nostr-tools';

import type { ConnectionCapability } from '../../domain/connection-capability';
import type { ConnectionSigner } from '../../domain/connection-signer';
import type { UnsignedNostrEvent } from '../../domain/nostr-event';

export interface ConnectionSignerContractHarness {
  createSigner(): ConnectionSigner;
  supportedCapability: ConnectionCapability;
  unsupportedCapability: ConnectionCapability;
}

export function runConnectionSignerContract(harness: ConnectionSignerContractHarness): void {
  describe('ConnectionSigner contract', () => {
    it('returns a valid hex public key', async () => {
      const signer = harness.createSigner();

      await expect(signer.getPublicKey()).resolves.toMatch(/^[0-9a-f]{64}$/);
    });

    it('signs a valid event for its own pubkey', async () => {
      const signer = harness.createSigner();
      const expectedPubkey = await signer.getPublicKey();

      const signedEvent = await signer.signEvent(createUnsignedEvent());

      expect(signedEvent.pubkey).toBe(expectedPubkey);
      expect(verifyEvent(signedEvent as never)).toBe(true);
    });

    it('produces an invalid signature if the event is mutated afterwards', async () => {
      const signer = harness.createSigner();
      const signedEvent = await signer.signEvent(createUnsignedEvent());

      const mutatedEvent = {
        ...signedEvent,
        content: 'event mutated after signature',
      };

      expect(verifyEvent(mutatedEvent as never)).toBe(false);
    });

    it('reports supported and unsupported capabilities explicitly', () => {
      const signer = harness.createSigner();

      expect(signer.supports(harness.supportedCapability)).toBe(true);
      expect(signer.supports(harness.unsupportedCapability)).toBe(false);
    });
  });
}

function createUnsignedEvent(): UnsignedNostrEvent {
  return {
    kind: 1,
    content: 'hello nostr',
    created_at: 1_700_000_000,
    tags: [['t', 'contract-test']],
  };
}
