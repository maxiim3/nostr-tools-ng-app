import { describe, expect, it, vi } from 'vitest';

import { NdkNip46NostrconnectStarter } from './ndk-nip46-nostrconnect-starter';

const { mockConnect, mockNostrconnect } = vi.hoisted(() => ({
  mockConnect: vi.fn<(_timeoutMs?: number) => Promise<void>>().mockResolvedValue(undefined),
  mockNostrconnect: vi.fn(),
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
      nostrconnect: mockNostrconnect,
    },
  };
});

describe('NdkNip46NostrconnectStarter', () => {
  beforeEach(() => {
    mockConnect.mockClear();
    mockNostrconnect.mockReset().mockReturnValue({
      nostrConnectUri: 'nostrconnect://example',
      stop: vi.fn(),
      blockUntilReady: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getPublicKey: vi.fn(),
      sign: vi.fn(),
    });
  });

  it('requests only minimal startup permissions', async () => {
    const starter = new NdkNip46NostrconnectStarter();

    await starter.start();

    const options = mockNostrconnect.mock.calls[0]?.[3];
    expect(options?.perms).toBe('get_public_key,sign_event');
  });

  it('exposes only sign-event and nip98-auth capabilities by default', async () => {
    const starter = new NdkNip46NostrconnectStarter();

    const attempt = await starter.start();

    expect(attempt.capabilities).toEqual(['sign-event', 'nip98-auth']);
  });
});
