import { ConnectionDomainError } from '../domain/connection-errors';
import type { Nip46RemoteSigner } from '../infrastructure/nip46-nostrconnect-starter';
import { runConnectionMethodContract } from '../testing/contracts/connection-method.contract';
import {
  FakeNip46NostrconnectAttemptHandle,
  FakeNip46NostrconnectStarter,
} from '../testing/fakes/fake-nip46-nostrconnect-starter';
import { Nip46NostrconnectConnectionMethod } from './nip46-nostrconnect-connection-method';

describe('Nip46NostrconnectConnectionMethod', () => {
  runConnectionMethodContract({
    expectedId: 'nip46-nostrconnect',
    createAvailableMethod: () =>
      new Nip46NostrconnectConnectionMethod(new FakeNip46NostrconnectStarter()),
    createUnavailableMethod: () =>
      new Nip46NostrconnectConnectionMethod(
        new FakeNip46NostrconnectStarter({
          available: false,
          startError: new ConnectionDomainError('method_unavailable', 'Unavailable.'),
        })
      ),
    createRejectedMethod: () =>
      new Nip46NostrconnectConnectionMethod(
        new FakeNip46NostrconnectStarter({
          attempt: new FakeNip46NostrconnectAttemptHandle({
            waitError: new ConnectionDomainError('user_rejected', 'Rejected.'),
          }),
        })
      ),
    createIdentityChangingMethod: () =>
      new Nip46NostrconnectConnectionMethod(
        new FakeNip46NostrconnectStarter({
          attempt: new FakeNip46NostrconnectAttemptHandle({
            remoteSigner: createIdentityChangingRemoteSigner(),
          }),
        })
      ),
  });

  it('exposes the nostrconnect URI in the attempt instructions', async () => {
    const method = new Nip46NostrconnectConnectionMethod(new FakeNip46NostrconnectStarter());

    const attempt = await method.start();

    expect(attempt.instructions).toEqual({
      launchUrl: 'nostrconnect://example',
      copyValue: 'nostrconnect://example',
      qrCodeValue: 'nostrconnect://example',
    });
  });

  it('updates instructions when an auth_url is emitted', async () => {
    const handle = new FakeNip46NostrconnectAttemptHandle();
    const method = new Nip46NostrconnectConnectionMethod(
      new FakeNip46NostrconnectStarter({ attempt: handle })
    );

    const attempt = await method.start();
    handle.emitAuthUrl('https://example.com/auth');

    expect(attempt.instructions?.authUrl).toBe('https://example.com/auth');
  });

  it('cancels the pending attempt through the starter handle', async () => {
    const handle = new FakeNip46NostrconnectAttemptHandle();
    const method = new Nip46NostrconnectConnectionMethod(
      new FakeNip46NostrconnectStarter({ attempt: handle })
    );

    const attempt = await method.start();
    await attempt.cancel();

    expect(handle.cancelCalls).toBe(1);
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
