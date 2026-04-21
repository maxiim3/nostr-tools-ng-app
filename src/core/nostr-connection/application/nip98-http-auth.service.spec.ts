import { Nip98HttpAuthService } from './nip98-http-auth.service';
import { runHttpAuthContract } from '../testing/contracts/http-auth.contract';
import { FakeConnectionSigner } from '../testing/fakes/fake-connection-signer';

describe('Nip98HttpAuthService', () => {
  runHttpAuthContract({
    createService: () => new Nip98HttpAuthService(),
    createSigner: () => new FakeConnectionSigner({ capabilities: ['sign-event', 'nip98-auth'] }),
  });
});
