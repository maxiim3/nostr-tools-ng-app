import { Nip07RestoreContextStore } from './nip07-restore-context-store';

describe('Nip07RestoreContextStore', () => {
  it('saves and loads a valid context', () => {
    const storage = createStorage();
    const store = new Nip07RestoreContextStore();
    vi.stubGlobal('localStorage', storage);

    store.save({
      version: 1,
      methodId: 'nip07',
      pubkeyHex: 'a'.repeat(64),
      validatedAt: 123,
    });

    expect(store.load()).toEqual({
      version: 1,
      methodId: 'nip07',
      pubkeyHex: 'a'.repeat(64),
      validatedAt: 123,
    });
  });

  it('purges malformed payloads', () => {
    const storage = createStorage();
    const store = new Nip07RestoreContextStore();
    vi.stubGlobal('localStorage', storage);
    storage.setItem('nostr.connect.restore.v1', '{ bad json');

    expect(store.load()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.restore.v1');
  });

  it('purges non-nip07 payloads and ignores extra fields', () => {
    const storage = createStorage();
    const store = new Nip07RestoreContextStore();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      'nostr.connect.restore.v1',
      JSON.stringify({
        version: 1,
        methodId: 'nip46-bunker',
        pubkeyHex: 'a'.repeat(64),
        validatedAt: 1,
        npub: 'legacy',
        capabilities: ['x'],
      })
    );

    expect(store.load()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith('nostr.connect.restore.v1');
  });

  it('tolerates throwing localStorage property access', () => {
    const store = new Nip07RestoreContextStore();

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('denied');
      },
    });

    expect(store.load()).toBeNull();
    expect(() =>
      store.save({ version: 1, methodId: 'nip07', pubkeyHex: 'a'.repeat(64), validatedAt: 1 })
    ).not.toThrow();
    expect(() => store.clear()).not.toThrow();
  });

  it('tolerates throwing getItem/setItem/removeItem', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      removeItem: vi.fn(() => {
        throw new Error('blocked');
      }),
    };
    vi.stubGlobal('localStorage', storage);
    const store = new Nip07RestoreContextStore();

    expect(store.load()).toBeNull();
    expect(() =>
      store.save({ version: 1, methodId: 'nip07', pubkeyHex: 'a'.repeat(64), validatedAt: 1 })
    ).not.toThrow();
    expect(() => store.clear()).not.toThrow();
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
