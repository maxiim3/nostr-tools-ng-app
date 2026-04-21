import { runConnectionSignerContract } from '../testing/contracts/connection-signer.contract';
import { FakeNip07Provider } from '../testing/fakes/fake-nip07-provider';
import { Nip07ConnectionSigner } from './nip07-connection-signer';

describe('Nip07ConnectionSigner', () => {
  runConnectionSignerContract({
    createSigner: () => new Nip07ConnectionSigner(new FakeNip07Provider({ withNip44: true })),
    supportedCapability: 'nip44-encrypt',
    unsupportedCapability: 'nip04-decrypt',
  });

  it('maps a provider signature rejection to a domain error', async () => {
    const signer = new Nip07ConnectionSigner(
      new FakeNip07Provider({ signEventError: new Error('User rejected the request.') })
    );

    await expect(
      signer.signEvent({ kind: 1, content: 'hello', created_at: 1, tags: [] })
    ).rejects.toMatchObject({ code: 'user_rejected' });
  });
});
