import { Nip46RestoreContextStore } from './nip46-restore-context-store';

describe('Nip46RestoreContextStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads a valid external signer restore context with a normalized expected pubkey', () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.nip46.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'ndk-payload',
        pubkeyHex: 'A'.repeat(64),
        validatedAt: 1,
        relayUrls: ['wss://relay.example.com'],
        permissions: ['sign_event'],
      })
    );

    expect(new Nip46RestoreContextStore().load()).toEqual({
      version: 1,
      methodId: 'nip46-nostrconnect',
      restorePayload: 'ndk-payload',
      pubkeyHex: 'a'.repeat(64),
      validatedAt: 1,
      relayUrls: ['wss://relay.example.com'],
      permissions: ['sign_event'],
    });
  });

  it('purges malformed JSON', () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem('nostr.connect.nip46.restore.v1', '{');

    expect(new Nip46RestoreContextStore().load()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.nip46.restore.v1');
  });

  it('purges wrong method ids, missing payloads, and invalid expected pubkeys', () => {
    const invalidPayloads = [
      {
        version: 1,
        methodId: 'nip07',
        restorePayload: 'payload',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      },
      {
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: '',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      },
      {
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'payload',
        pubkeyHex: 'bad',
        validatedAt: 1,
      },
    ];

    for (const payload of invalidPayloads) {
      const storage = createStorage();
      vi.stubGlobal('localStorage', storage);
      storage.setItem('nostr.connect.nip46.restore.v1', JSON.stringify(payload));

      expect(new Nip46RestoreContextStore().load()).toBeNull();
      expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.nip46.restore.v1');
    }
  });

  it('purges malformed optional relay and permission metadata', () => {
    const invalidPayloads = [
      {
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'payload',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
        relayUrls: [123],
      },
      {
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'payload',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
        permissions: 'sign_event',
      },
    ];

    for (const payload of invalidPayloads) {
      const storage = createStorage();
      vi.stubGlobal('localStorage', storage);
      storage.setItem('nostr.connect.nip46.restore.v1', JSON.stringify(payload));

      expect(new Nip46RestoreContextStore().load()).toBeNull();
      expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.nip46.restore.v1');
    }
  });

  it('tolerates throwing localStorage access and storage operations', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      removeItem: vi.fn(() => {
        throw new Error('blocked');
      }),
    });

    const store = new Nip46RestoreContextStore();

    expect(store.load()).toBeNull();
    expect(() =>
      store.save({
        version: 1,
        methodId: 'nip46-nostrconnect',
        restorePayload: 'payload',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
      })
    ).not.toThrow();
    expect(() => store.clear()).not.toThrow();
  });

  it('saves only the minimal method-discriminated restore context', () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);

    new Nip46RestoreContextStore().save({
      version: 1,
      methodId: 'nip46-nostrconnect',
      restorePayload: 'payload',
      pubkeyHex: 'A'.repeat(64),
      validatedAt: 1,
      relayUrls: ['wss://relay.example.com'],
      permissions: ['sign_event'],
    });

    expect(JSON.parse(storage.getItem('nostr.connect.nip46.restore.v1') ?? '')).toEqual({
      version: 1,
      methodId: 'nip46-nostrconnect',
      restorePayload: 'payload',
      pubkeyHex: 'a'.repeat(64),
      validatedAt: 1,
      relayUrls: ['wss://relay.example.com'],
      permissions: ['sign_event'],
    });
  });

  it('clears the NIP-46 restore key only', () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);

    new Nip46RestoreContextStore().clear();

    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.nip46.restore.v1');
    expect(storage.removeItem).not.toHaveBeenCalledWith('nostr.connect.restore.v1');
  });
});

function createStorage() {
  const map = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => map.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      map.delete(key);
    }),
  };
}
