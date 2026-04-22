import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { normalizeHexPubkey, NostrClientService } from './nostr-client.service';

const mockNdkInstance = {
  signer: undefined as unknown,
  activeUser: undefined as unknown,
  connect: vi.fn<() => Promise<void>>().mockResolvedValue(),
  getUser: vi.fn(),
  fetchEvents: vi.fn(),
};

const { mockNip07SignerCtor, mockNdkUserCtor } = vi.hoisted(() => ({
  mockNip07SignerCtor: vi.fn().mockImplementation(function MockNip07Signer() {
    return { tag: 'nip07-signer' };
  }),
  mockNdkUserCtor: vi.fn(),
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
    NDKNip07Signer: mockNip07SignerCtor,
    NDKPrivateKeySigner: vi.fn(),
    NDKNip46Signer: Object.assign(vi.fn(), { nostrconnect: vi.fn() }),
    NDKUser: mockNdkUserCtor,
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
    mockNdkInstance.connect.mockResolvedValue();
    mockNdkInstance.signer = undefined;
    mockNdkInstance.activeUser = undefined;

    mockNip07SignerCtor.mockReset();
    mockNip07SignerCtor.mockImplementation(function MockNip07Signer() {
      return { tag: 'nip07-signer' };
    });

    mockNdkUserCtor.mockReset();
    mockNdkUserCtor.mockImplementation(function MockNdkUser({
      pubkey,
      npub,
    }: {
      pubkey?: string;
      npub?: string;
    }) {
      return {
        pubkey: pubkey ?? 'f'.repeat(64),
        npub: npub ?? 'npub1test',
        ndk: undefined,
        fetchProfile: vi.fn().mockResolvedValue(null),
      };
    });

    service = new NostrClientService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('applies a NIP-07 signer with the connected user pubkey', async () => {
    await service.applyNip07Signer('f'.repeat(64));

    expect(mockNip07SignerCtor).toHaveBeenCalledWith(1500, mockNdkInstance);
    expect(mockNdkUserCtor).toHaveBeenCalledWith({ pubkey: 'f'.repeat(64) });
    expect(mockNdkInstance.signer).toEqual({ tag: 'nip07-signer' });
    expect(mockNdkInstance.activeUser).toMatchObject({ pubkey: 'f'.repeat(64) });
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
});
