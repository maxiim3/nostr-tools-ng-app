import { ConnectionDomainError } from '../domain/connection-errors';
import { runConnectionMethodContract } from '../testing/contracts/connection-method.contract';
import { FakeNip46AttemptHandle } from '../testing/fakes/fake-nip46-nostrconnect-starter';
import { FakeNip46BunkerStarter } from '../testing/fakes/fake-nip46-bunker-starter';
import type { Nip46RemoteSigner } from '../infrastructure/nip46-nostrconnect-starter';
import {
  assertValidBunkerConnectionToken,
  Nip46BunkerConnectionMethod,
  normalizeBunkerConnectionToken,
} from './nip46-bunker-connection-method';

const VALID_BUNKER_TOKEN =
  'bunker://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa?relay=wss%3A%2F%2Frelay.example.com&secret=hello';

describe('Nip46BunkerConnectionMethod', () => {
  runConnectionMethodContract({
    expectedId: 'nip46-bunker',
    createAvailableMethod: () => new Nip46BunkerConnectionMethod(new FakeNip46BunkerStarter()),
    createUnavailableMethod: () =>
      new Nip46BunkerConnectionMethod(
        new FakeNip46BunkerStarter({
          available: false,
          startError: new ConnectionDomainError('method_unavailable', 'Unavailable.'),
        })
      ),
    createRejectedMethod: () =>
      new Nip46BunkerConnectionMethod(
        new FakeNip46BunkerStarter({
          attempt: new FakeNip46AttemptHandle({
            waitError: new ConnectionDomainError('user_rejected', 'Rejected.'),
          }),
        })
      ),
    createIdentityChangingMethod: () =>
      new Nip46BunkerConnectionMethod(
        new FakeNip46BunkerStarter({
          attempt: new FakeNip46AttemptHandle({
            remoteSigner: createIdentityChangingRemoteSigner(),
          }),
        })
      ),
    availableRequest: {
      reason: 'interactive-login',
      connectionToken: VALID_BUNKER_TOKEN,
    },
    rejectedRequest: {
      reason: 'interactive-login',
      connectionToken: VALID_BUNKER_TOKEN,
    },
    identityChangingRequest: {
      reason: 'interactive-login',
      connectionToken: VALID_BUNKER_TOKEN,
    },
  });

  it('requires a bunker token to start', async () => {
    const method = new Nip46BunkerConnectionMethod(new FakeNip46BunkerStarter());

    await expect(method.start({ reason: 'interactive-login' })).rejects.toMatchObject({
      code: 'validation_failed',
    });
  });

  it('rejects an invalid bunker token before starting the connection', async () => {
    const method = new Nip46BunkerConnectionMethod(new FakeNip46BunkerStarter());

    await expect(
      method.start({ reason: 'interactive-login', connectionToken: 'not-a-token' })
    ).rejects.toMatchObject({ code: 'validation_failed' });
  });

  it('passes the normalized bunker token to the starter', async () => {
    const starter = new FakeNip46BunkerStarter();
    const method = new Nip46BunkerConnectionMethod(starter);

    await method.start({
      reason: 'interactive-login',
      connectionToken: `  ${VALID_BUNKER_TOKEN}  `,
    });

    expect(starter.lastConnectionToken).toBe(VALID_BUNKER_TOKEN);
  });
});

describe('bunker token helpers', () => {
  it('normalizes a bunker token by trimming whitespace', () => {
    expect(normalizeBunkerConnectionToken(`  ${VALID_BUNKER_TOKEN}  `)).toBe(VALID_BUNKER_TOKEN);
  });

  it('validates a bunker token with bunker scheme and relay', () => {
    expect(() => assertValidBunkerConnectionToken(VALID_BUNKER_TOKEN)).not.toThrow();
  });

  it('rejects tokens with an invalid scheme', () => {
    expect(() =>
      assertValidBunkerConnectionToken(VALID_BUNKER_TOKEN.replace('bunker://', 'nostrconnect://'))
    ).toThrow('Bunker connection token must use the bunker:// scheme.');
  });

  it('rejects tokens without relay URLs', () => {
    expect(() =>
      assertValidBunkerConnectionToken(
        'bunker://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      )
    ).toThrow('Bunker connection token must include at least one relay URL.');
  });
});

function createIdentityChangingRemoteSigner(): Nip46RemoteSigner {
  let index = 0;
  const pubkeys = ['a'.repeat(64), 'b'.repeat(64)] as const;

  return {
    async getPublicKey(): Promise<string> {
      const pubkey = pubkeys[Math.min(index, pubkeys.length - 1)];
      index += 1;
      return pubkey;
    },
    async sign(): Promise<string> {
      return 'f'.repeat(128);
    },
    stop(): void {
      return;
    },
  };
}
