import {
  createConnectionSession,
  didConnectionIdentityChange,
  normalizeHexPublicKey,
} from './connection-session';

describe('connection session helpers', () => {
  it('normalizes a valid hex pubkey', () => {
    expect(normalizeHexPublicKey(`  ${'A'.repeat(64)}  `)).toBe('a'.repeat(64));
  });

  it('creates a session from a hex pubkey and derives npub', () => {
    const session = createConnectionSession({
      pubkeyHex: 'a'.repeat(64),
      methodId: 'nip07',
      capabilities: ['sign-event', 'nip98-auth', 'sign-event'],
      validatedAt: 42,
    });

    expect(session.pubkeyHex).toBe('a'.repeat(64));
    expect(session.npub.startsWith('npub1')).toBe(true);
    expect(session.capabilities).toEqual(['sign-event', 'nip98-auth']);
    expect(session.validatedAt).toBe(42);
  });

  it('reports when identity changed between two sessions', () => {
    const previous = createConnectionSession({
      pubkeyHex: 'a'.repeat(64),
      methodId: 'nip07',
      capabilities: ['sign-event'],
      validatedAt: 1,
    });
    const current = createConnectionSession({
      pubkeyHex: 'b'.repeat(64),
      methodId: 'nip07',
      capabilities: ['sign-event'],
      validatedAt: 2,
    });

    expect(didConnectionIdentityChange(previous, current)).toBe(true);
  });

  it('does not report identity change when only validatedAt changes', () => {
    const previous = createConnectionSession({
      pubkeyHex: 'a'.repeat(64),
      methodId: 'nip07',
      capabilities: ['sign-event'],
      validatedAt: 1,
    });
    const current = createConnectionSession({
      pubkeyHex: 'a'.repeat(64),
      methodId: 'nip07',
      capabilities: ['sign-event'],
      validatedAt: 2,
    });

    expect(didConnectionIdentityChange(previous, current)).toBe(false);
  });

  it('throws when creating a session with an invalid pubkey', () => {
    expect(() =>
      createConnectionSession({
        pubkeyHex: 'not-a-pubkey',
        methodId: 'nip07',
        capabilities: ['sign-event'],
      })
    ).toThrow('Connection session requires a valid hex pubkey.');
  });
});
