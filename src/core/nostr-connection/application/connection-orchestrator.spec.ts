import { ConnectionOrchestrator } from './connection-orchestrator';
import { InMemoryConnectionSessionStore } from './in-memory-connection-session-store';
import { FakeActiveConnection } from '../testing/fakes/fake-active-connection';
import { FakeConnectionMethod } from '../testing/fakes/fake-connection-method';
import { FakeConnectionSigner } from '../testing/fakes/fake-connection-signer';

describe('ConnectionOrchestrator', () => {
  it('returns registered methods in declaration order', () => {
    const orchestrator = new ConnectionOrchestrator(
      [new FakeConnectionMethod({ id: 'nip07' }), new FakeConnectionMethod({ id: 'nip46-bunker' })],
      new InMemoryConnectionSessionStore()
    );

    expect(orchestrator.getRegisteredMethodIds()).toEqual(['nip07', 'nip46-bunker']);
  });

  it('lists only available methods', async () => {
    const orchestrator = new ConnectionOrchestrator(
      [
        new FakeConnectionMethod({ id: 'nip07', available: true }),
        new FakeConnectionMethod({ id: 'nip46-bunker', available: false }),
      ],
      new InMemoryConnectionSessionStore()
    );

    await expect(orchestrator.listAvailableMethodIds()).resolves.toEqual(['nip07']);
  });

  it('connects with the selected strategy and stores the active session', async () => {
    const method = new FakeConnectionMethod({ id: 'nip07' });
    const orchestrator = new ConnectionOrchestrator([method], new InMemoryConnectionSessionStore());

    const session = await orchestrator.connect('nip07');

    expect(session.methodId).toBe('nip07');
    expect(orchestrator.getCurrentSession()).toEqual(session);
  });

  it('revalidates the current connection through the store', async () => {
    const currentSigner = new FakeConnectionSigner();
    const nextSigner = new FakeConnectionSigner();
    const method = new FakeConnectionMethod({
      id: 'nip07',
      connection: new FakeActiveConnection({
        signer: currentSigner,
        nextSigner,
      }),
    });
    const orchestrator = new ConnectionOrchestrator([method], new InMemoryConnectionSessionStore());

    await orchestrator.connect('nip07');
    const revalidation = await orchestrator.revalidateCurrent();

    expect(revalidation).not.toBeNull();
    expect(revalidation?.changed).toBe(true);
    expect(orchestrator.getCurrentSession()).toEqual(revalidation?.current);
  });

  it('disconnects the current active connection', async () => {
    const connection = new FakeActiveConnection();
    const method = new FakeConnectionMethod({ id: 'nip07', connection });
    const orchestrator = new ConnectionOrchestrator([method], new InMemoryConnectionSessionStore());

    await orchestrator.connect('nip07');
    await orchestrator.disconnect();

    expect(connection.disconnectCalls).toBe(1);
    expect(orchestrator.getCurrentSession()).toBeNull();
  });

  it('disconnects the previous connection only after a successful replacement', async () => {
    const firstConnection = new FakeActiveConnection();
    const secondConnection = new FakeActiveConnection({ methodId: 'nip46-bunker' });
    const firstMethod = new FakeConnectionMethod({ id: 'nip07', connection: firstConnection });
    const secondMethod = new FakeConnectionMethod({
      id: 'nip46-bunker',
      connection: secondConnection,
    });
    const orchestrator = new ConnectionOrchestrator(
      [firstMethod, secondMethod],
      new InMemoryConnectionSessionStore()
    );

    await orchestrator.connect('nip07');
    const session = await orchestrator.connect('nip46-bunker');

    expect(firstConnection.disconnectCalls).toBe(1);
    expect(secondConnection.disconnectCalls).toBe(0);
    expect(session.methodId).toBe('nip46-bunker');
    expect(orchestrator.getCurrentSession()).toEqual(session);
  });

  it('fails with a domain error when connecting through an unknown strategy', async () => {
    const orchestrator = new ConnectionOrchestrator([], new InMemoryConnectionSessionStore());

    await expect(orchestrator.connect('nip07')).rejects.toMatchObject({
      code: 'method_unavailable',
    });
  });
});
