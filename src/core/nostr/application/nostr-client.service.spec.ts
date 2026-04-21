import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { normalizeHexPubkey, NostrClientService } from './nostr-client.service';

const mockNdkInstance = {
  signer: undefined as unknown,
  activeUser: undefined as unknown,
  connect: vi.fn<() => Promise<void>>().mockResolvedValue(),
  getUser: vi.fn(),
  fetchEvents: vi.fn(),
};

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
    NDKNip46Signer: vi.fn(),
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
    mockNdkInstance.connect.mockResolvedValue();
    mockNdkInstance.signer = undefined;
    mockNdkInstance.activeUser = undefined;
    service = new NostrClientService();
  });

  afterEach(() => {
    service.cancelExternalAppLogin();
  });

  it('throws from completeExternalAppLogin when no pending signer exists', async () => {
    service = new NostrClientService();
    await expect(service.completeExternalAppLogin()).rejects.toThrow(
      'No external app login is pending.',
    );
  });

  it('throws from publishEvent when no signer is set', async () => {
    mockNdkInstance.signer = undefined;
    mockNdkInstance.activeUser = undefined;

    await expect(service.publishEvent(1, [], 'test')).rejects.toThrow(
      'NIP-07 authentication is required before publishing.',
    );
  });

  it('throws from sendDirectMessage when no signer is set', async () => {
    mockNdkInstance.signer = undefined;
    mockNdkInstance.activeUser = undefined;

    await expect(service.sendDirectMessage('a'.repeat(64), 'hello')).rejects.toThrow(
      'Nostr authentication is required before sending a DM.',
    );
  });

  it('throws from createHttpAuthHeader when no signer is set', async () => {
    mockNdkInstance.signer = undefined;
    mockNdkInstance.activeUser = undefined;

    await expect(service.createHttpAuthHeader('https://example.com', 'GET')).rejects.toThrow(
      'Nostr authentication is required before signing API requests.',
    );
  });

  it('throws from sendDirectMessage with an invalid recipient pubkey when signed in', async () => {
    mockNdkInstance.signer = {} as never;
    mockNdkInstance.activeUser = {} as never;

    await expect(service.sendDirectMessage('not-a-hex', 'hello')).rejects.toThrow(
      'Invalid recipient pubkey.',
    );
  });

  it('throws from sendDirectMessage with empty message content when signed in', async () => {
    mockNdkInstance.signer = {} as never;
    mockNdkInstance.activeUser = {} as never;

    await expect(service.sendDirectMessage('a'.repeat(64), '   ')).rejects.toThrow(
      'DM content cannot be empty.',
    );
  });

  it('cancelExternalAppLogin does not throw when no pending signer exists', () => {
    expect(() => service.cancelExternalAppLogin()).not.toThrow();
  });
});