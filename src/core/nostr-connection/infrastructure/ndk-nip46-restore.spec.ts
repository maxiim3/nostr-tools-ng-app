import { describe, expect, it, vi } from 'vitest';

import { ConnectionDomainError } from '../domain/connection-errors';
import { restoreNdkNip46SignerFromPayload } from './ndk-nip46-restore';
import type { Nip46RemoteSigner } from './nip46-nostrconnect-starter';

const { constructedNdkOptions, mockConnect, mockFromPayload, restoredSigner } = vi.hoisted(() => {
  const restoredSigner = {
    blockUntilReady: vi.fn<() => Promise<void>>().mockResolvedValue(),
    getPublicKey: vi.fn<() => Promise<string>>().mockResolvedValue('a'.repeat(64)),
    sign: vi.fn<() => Promise<string>>().mockResolvedValue('f'.repeat(128)),
    stop: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  return {
    constructedNdkOptions: [] as unknown[],
    mockConnect: vi.fn<(_timeoutMs?: number) => Promise<void>>().mockResolvedValue(),
    mockFromPayload: vi.fn().mockResolvedValue(restoredSigner),
    restoredSigner,
  };
});

vi.mock('@nostr-dev-kit/ndk', () => {
  class MockNDK {
    readonly options: unknown;

    constructor(options: unknown) {
      this.options = options;
      constructedNdkOptions.push(options);
    }

    connect(timeoutMs?: number) {
      return mockConnect(timeoutMs);
    }
  }

  return {
    default: MockNDK,
    NDKNip46Signer: {
      fromPayload: mockFromPayload,
    },
  };
});

describe('restoreNdkNip46SignerFromPayload', () => {
  it('restores a ready NIP-46 remote signer from an NDK payload', async () => {
    const remoteSigner = await restoreNdkNip46SignerFromPayload('payload-json', {
      relayUrls: ['wss://relay.example.com'],
      connectTimeoutMs: 1234,
      readyTimeoutMs: 10,
    });

    expect(constructedNdkOptions).toEqual([{ explicitRelayUrls: ['wss://relay.example.com'] }]);
    expect(mockConnect).toHaveBeenCalledWith(1234);
    expect(mockFromPayload).toHaveBeenCalledWith('payload-json', expect.any(Object));
    expect(restoredSigner.blockUntilReady).toHaveBeenCalledTimes(1);
    await expect(remoteSigner.getPublicKey()).resolves.toBe('a'.repeat(64));
    await expect(remoteSigner.sign(createUnsignedEvent())).resolves.toBe('f'.repeat(128));
  });

  it('wraps invalid payload restore errors as domain validation failures', async () => {
    mockFromPayload.mockRejectedValueOnce(new Error('invalid payload'));

    await expect(restoreNdkNip46SignerFromPayload('not-json')).rejects.toMatchObject({
      code: 'validation_failed',
      message: 'Unable to restore the NIP-46 signer payload.',
    } satisfies Partial<ConnectionDomainError>);
  });
});

function createUnsignedEvent(): Parameters<Nip46RemoteSigner['sign']>[0] {
  return {
    kind: 1,
    content: '',
    created_at: 0,
    tags: [],
    pubkey: 'a'.repeat(64),
  };
}
