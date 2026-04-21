import { InMemoryConnectionSessionStore } from './in-memory-connection-session-store';
import { createConnectionSession } from '../domain/connection-session';
import { runConnectionSessionStoreContract } from '../testing/contracts/connection-session-store.contract';
import { FakeActiveConnection } from '../testing/fakes/fake-active-connection';
import { FakeConnectionSigner } from '../testing/fakes/fake-connection-signer';

describe('InMemoryConnectionSessionStore', () => {
  runConnectionSessionStoreContract({
    createStore: () => new InMemoryConnectionSessionStore(),
    createConnection: (options = {}) => {
      const nextSigner = new FakeConnectionSigner();
      const connection = new FakeActiveConnection(
        options.changeIdentity
          ? {
              nextSigner,
              nextSession: createConnectionSession({
                pubkeyHex: nextSigner.publicKeyHex,
                methodId: 'nip07',
                capabilities: ['sign-event', 'nip98-auth'],
                validatedAt: 2,
              }),
            }
          : {}
      );

      return {
        connection,
        getDisconnectCalls: () => connection.disconnectCalls,
        getRevalidateCalls: () => connection.revalidateCalls,
      };
    },
  });
});
