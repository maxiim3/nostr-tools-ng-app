import { runConnectionMethodContract } from '../testing/contracts/connection-method.contract';
import { FakeConnectionSigner } from '../testing/fakes/fake-connection-signer';
import { FakeNip07Provider } from '../testing/fakes/fake-nip07-provider';
import { Nip07ConnectionMethod } from './nip07-connection-method';

describe('Nip07ConnectionMethod', () => {
  runConnectionMethodContract({
    expectedId: 'nip07',
    createAvailableMethod: () =>
      new Nip07ConnectionMethod({ resolveProvider: () => new FakeNip07Provider() }),
    createUnavailableMethod: () => new Nip07ConnectionMethod({ resolveProvider: () => null }),
    createRejectedMethod: () =>
      new Nip07ConnectionMethod({
        resolveProvider: () =>
          new FakeNip07Provider({ getPublicKeyError: new Error('User rejected the request.') }),
      }),
    createIdentityChangingMethod: () => {
      const currentSigner = new FakeConnectionSigner();
      const nextSigner = new FakeConnectionSigner();

      return new Nip07ConnectionMethod({
        resolveProvider: () =>
          new FakeNip07Provider({ signers: [currentSigner, nextSigner], withNip44: true }),
      });
    },
  });

  it('detects provider availability from the resolver', async () => {
    const method = new Nip07ConnectionMethod({ resolveProvider: () => null });

    await expect(method.isAvailable()).resolves.toBe(false);
  });
});
