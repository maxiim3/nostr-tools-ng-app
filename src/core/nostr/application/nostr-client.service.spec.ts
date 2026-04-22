import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { normalizeHexPubkey, NostrClientService } from './nostr-client.service';

const mockNdkInstance = {
  signer: undefined as unknown,
  activeUser: undefined as unknown,
  connect: vi.fn<() => Promise<void>>().mockResolvedValue(),
  getUser: vi.fn(),
  fetchEvents: vi.fn(),
};

const { mockNostrconnect } = vi.hoisted(() => ({
  mockNostrconnect: vi.fn(),
}));

vi.mock('@nostr-dev-kit/ndk', () => {
  class MockNDK {
    signer: unknown;
    activeUser: unknown;

    constructor() {
      this.signer = mockNdkInstance.signer;
      this.activeUser = mockNdkInstance.activeUser;
      return mockNdkInstance;
    }

    connect() {
      return mockNdkInstance.connect();
    }
  }

  return {
    default: MockNDK,
    NDKEvent: vi.fn(),
    NDKNip07Signer: vi.fn(),
    NDKPrivateKeySigner: vi.fn(),
    NDKNip46Signer: Object.assign(vi.fn(), { nostrconnect: mockNostrconnect }),
    NDKUser: vi.fn(),
  };
});

describe('normalizeHexPubkey', () => {
  it('accepts a valid 64-char lowercase hex pubkey', () => {
    const hex = '0123456789abcdef'.repeat(4);
    expect(normalizeHexPubkey(hex)).toBe(hex);
  });

  it('trims whitespace and lowercases before validation', () => {
    const hex = 'A'.repeat(64);
    expect(normalizeHexPubkey(`  ${hex}  `)).toBe(hex.toLowerCase());
  });

  it('rejects a pubkey that is too short', () => {
    expect(normalizeHexPubkey('abc123')).toBeNull();
  });

  it('rejects a pubkey that is too long', () => {
    expect(normalizeHexPubkey('a'.repeat(65))).toBeNull();
  });

  it('rejects a pubkey with non-hex characters', () => {
    expect(normalizeHexPubkey('g'.repeat(64))).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(normalizeHexPubkey('')).toBeNull();
  });
});

describe('NostrClientService', () => {
  let service: NostrClientService;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('location', { origin: 'https://app.example' });
    mockNdkInstance.connect.mockResolvedValue();
    mockNdkInstance.signer = undefined;
    mockNdkInstance.activeUser = undefined;
    service = new NostrClientService();
  });

  afterEach(() => {
    service.cancelExternalAppLogin();
    vi.unstubAllGlobals();
  });

  it('throws from completeExternalAppLogin when no pending signer exists', async () => {
    service = new NostrClientService();
    await expect(service.completeExternalAppLogin()).rejects.toThrow(
      'No external app login is pending.'
    );
  });

  it('throws from publishEvent when no signer is set', async () => {
    mockNdkInstance.signer = undefined;
    mockNdkInstance.activeUser = undefined;

    await expect(service.publishEvent(1, [], 'test')).rejects.toThrow(
      'NIP-07 authentication is required before publishing.'
    );
  });

  it('throws from sendDirectMessage when no signer is set', async () => {
    mockNdkInstance.signer = undefined;
    mockNdkInstance.activeUser = undefined;

    await expect(service.sendDirectMessage('a'.repeat(64), 'hello')).rejects.toThrow(
      'Nostr authentication is required before sending a DM.'
    );
  });

  it('throws from getHttpAuthSigner when no signer is set', async () => {
    mockNdkInstance.signer = undefined;
    mockNdkInstance.activeUser = undefined;

    await expect(service.getHttpAuthSigner()).rejects.toThrow(
      'Nostr authentication is required before signing API requests.'
    );
  });

  it('returns an HTTP auth signer when user is authenticated', async () => {
    mockNdkInstance.signer = {} as never;
    mockNdkInstance.activeUser = { pubkey: 'A'.repeat(64) } as never;

    const signer = await service.getHttpAuthSigner();

    expect(signer.supports('nip98-auth')).toBe(true);
    await expect(signer.getPublicKey()).resolves.toBe('a'.repeat(64));
  });

  it('throws from sendDirectMessage with an invalid recipient pubkey when signed in', async () => {
    mockNdkInstance.signer = {} as never;
    mockNdkInstance.activeUser = {} as never;

    await expect(service.sendDirectMessage('not-a-hex', 'hello')).rejects.toThrow(
      'Invalid recipient pubkey.'
    );
  });

  it('throws from sendDirectMessage with empty message content when signed in', async () => {
    mockNdkInstance.signer = {} as never;
    mockNdkInstance.activeUser = {} as never;

    await expect(service.sendDirectMessage('a'.repeat(64), '   ')).rejects.toThrow(
      'DM content cannot be empty.'
    );
  });

  it('cancelExternalAppLogin does not throw when no pending signer exists', () => {
    expect(() => service.cancelExternalAppLogin()).not.toThrow();
  });

  it('beginExternalAppLogin returns nostrconnect URI', async () => {
    const signer = {
      nostrConnectUri: 'nostrconnect://test',
      stop: vi.fn(),
      blockUntilReady: vi.fn(),
    };
    mockNostrconnect.mockReturnValue(signer);

    const result = await service.beginExternalAppLogin();

    expect(result).toBe('nostrconnect://test');
    expect(mockNostrconnect).toHaveBeenCalledWith(
      mockNdkInstance,
      'wss://relay.nsec.app',
      undefined,
      { name: 'ToolStr', url: 'https://app.example', image: 'https://app.example/favicon.ico' }
    );
  });

  it('beginExternalAppLogin stops previous pending signer', async () => {
    const firstSigner = {
      nostrConnectUri: 'nostrconnect://first',
      stop: vi.fn(),
      blockUntilReady: vi.fn(),
    };
    const secondSigner = {
      nostrConnectUri: 'nostrconnect://second',
      stop: vi.fn(),
      blockUntilReady: vi.fn(),
    };
    mockNostrconnect.mockReturnValueOnce(firstSigner).mockReturnValueOnce(secondSigner);

    await service.beginExternalAppLogin();
    await service.beginExternalAppLogin();

    expect(firstSigner.stop).toHaveBeenCalledTimes(1);
  });

  it('beginExternalAppLogin rejects when nostrConnectUri is missing', async () => {
    const signer = { nostrConnectUri: undefined, stop: vi.fn(), blockUntilReady: vi.fn() };
    mockNostrconnect.mockReturnValue(signer);

    await expect(service.beginExternalAppLogin()).rejects.toThrow(
      'Unable to create external app login link.'
    );
  });

  it('completeExternalAppLogin success applies signer and returns SessionUser', async () => {
    const fakeUser = {
      pubkey: 'f'.repeat(64),
      npub: 'npub1test',
      fetchProfile: vi.fn().mockResolvedValue({
        displayName: 'Test',
        picture: 'pic',
        about: 'bio',
        nip05: 't@e.com',
      }),
    };
    const signer = {
      nostrConnectUri: 'nostrconnect://test',
      stop: vi.fn(),
      blockUntilReady: vi.fn().mockResolvedValue(fakeUser),
    };
    mockNostrconnect.mockReturnValue(signer);

    await service.beginExternalAppLogin();
    const sessionUser = await service.completeExternalAppLogin();

    expect(sessionUser).toEqual({
      pubkey: 'f'.repeat(64),
      npub: 'npub1test',
      displayName: 'Test',
      imageUrl: 'pic',
      description: 'bio',
      nip05: 't@e.com',
    });
    expect(mockNdkInstance.signer).toBe(signer);
    expect(mockNdkInstance.activeUser).toBe(fakeUser);
  });

  it('cancelExternalAppLogin clears pending so complete rejects', async () => {
    const signer = {
      nostrConnectUri: 'nostrconnect://test',
      stop: vi.fn(),
      blockUntilReady: vi.fn(),
    };
    mockNostrconnect.mockReturnValue(signer);

    await service.beginExternalAppLogin();
    service.cancelExternalAppLogin();

    expect(signer.stop).toHaveBeenCalled();
    await expect(service.completeExternalAppLogin()).rejects.toThrow(
      'No external app login is pending.'
    );
  });
});
