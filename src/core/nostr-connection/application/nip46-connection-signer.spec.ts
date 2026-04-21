import { runConnectionSignerContract } from '../testing/contracts/connection-signer.contract';
import { FakeNip46RemoteSigner } from '../testing/fakes/fake-nip46-remote-signer';
import { Nip46ConnectionSigner } from './nip46-connection-signer';

describe('Nip46ConnectionSigner', () => {
  runConnectionSignerContract({
    createSigner: () =>
      new Nip46ConnectionSigner(new FakeNip46RemoteSigner(), [
        'sign-event',
        'nip98-auth',
        'nip44-encrypt',
      ]),
    supportedCapability: 'nip44-encrypt',
    unsupportedCapability: 'nip04-decrypt',
  });

  it('maps timeouts to a domain timeout error', async () => {
    const signer = new Nip46ConnectionSigner(
      new FakeNip46RemoteSigner({ signError: new Error('External app login timed out.') }),
      ['sign-event', 'nip98-auth']
    );

    await expect(
      signer.signEvent({ kind: 1, content: 'hello', created_at: 1, tags: [] })
    ).rejects.toMatchObject({ code: 'timeout' });
  });
});
