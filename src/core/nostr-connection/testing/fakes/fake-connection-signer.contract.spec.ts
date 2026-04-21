import { runConnectionSignerContract } from '../contracts/connection-signer.contract';
import { FakeConnectionSigner } from './fake-connection-signer';

describe('FakeConnectionSigner', () => {
  runConnectionSignerContract({
    createSigner: () => new FakeConnectionSigner({ capabilities: ['sign-event', 'nip98-auth'] }),
    supportedCapability: 'nip98-auth',
    unsupportedCapability: 'nip44-encrypt',
  });
});
