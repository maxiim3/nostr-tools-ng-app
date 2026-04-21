import { ConnectionDomainError } from '../../domain/connection-errors';
import { createConnectionSession } from '../../domain/connection-session';
import { runConnectionMethodContract } from '../contracts/connection-method.contract';
import { FakeActiveConnection } from './fake-active-connection';
import { FakeConnectionMethod } from './fake-connection-method';
import { FakeConnectionSigner } from './fake-connection-signer';

describe('FakeConnectionMethod', () => {
  runConnectionMethodContract({
    expectedId: 'nip07',
    createAvailableMethod: () => new FakeConnectionMethod({ id: 'nip07' }),
    createUnavailableMethod: () => new FakeConnectionMethod({ id: 'nip07', available: false }),
    createRejectedMethod: () =>
      new FakeConnectionMethod({
        id: 'nip07',
        completeError: new ConnectionDomainError('user_rejected', 'User rejected the request.'),
      }),
    createIdentityChangingMethod: () => {
      const currentSigner = new FakeConnectionSigner();
      const nextSigner = new FakeConnectionSigner();

      return new FakeConnectionMethod({
        id: 'nip07',
        connection: new FakeActiveConnection({
          signer: currentSigner,
          nextSigner,
          nextSession: createConnectionSession({
            pubkeyHex: nextSigner.publicKeyHex,
            methodId: 'nip07',
            capabilities: ['sign-event', 'nip98-auth'],
            validatedAt: 2,
          }),
        }),
      });
    },
  });
});
