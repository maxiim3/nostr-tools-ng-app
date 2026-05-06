import { describe, expect, it, vi } from 'vitest';

import { NdkNip46BunkerStarter } from './ndk-nip46-bunker-starter';

const { mockConnect, mockBunker } = vi.hoisted(() => ({
  mockConnect: vi.fn<(_timeoutMs?: number) => Promise<void>>().mockResolvedValue(undefined),
  mockBunker: vi.fn(),
}));

vi.mock('@nostr-dev-kit/ndk', () => {
  class MockNDK {
    constructor(_options: unknown) {
      return;
    }

    connect(timeoutMs?: number) {
      return mockConnect(timeoutMs);
    }
  }

  return {
    default: MockNDK,
    NDKNip46Signer: {
      bunker: mockBunker,
    },
  };
});

describe('NdkNip46BunkerStarter', () => {
  beforeEach(() => {
    mockConnect.mockClear();
    mockBunker.mockReset().mockReturnValue({
      stop: vi.fn(),
      blockUntilReady: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getPublicKey: vi.fn(),
      sign: vi.fn(),
    });
  });

  it('exposes only sign-event and nip98-auth capabilities by default', async () => {
    const starter = new NdkNip46BunkerStarter();

    const attempt = await starter.start(
      'bunker://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa?relay=wss%3A%2F%2Frelay.example.com&secret=test'
    );

    expect(attempt.capabilities).toEqual(['sign-event', 'nip98-auth']);
  });
});
