import type { ActiveConnection, ConnectionRevalidationResult } from '../domain/active-connection';
import type {
  ConnectionAttempt,
  ConnectionAttemptInstructions,
} from '../domain/connection-attempt';
import {
  createConnectionSession,
  didConnectionIdentityChange,
  type ConnectionSession,
} from '../domain/connection-session';
import type { ConnectionCapability } from '../domain/connection-capability';
import type { ConnectionMethodId } from '../domain/connection-method-id';
import type { Nip46AttemptHandle } from '../infrastructure/nip46-nostrconnect-starter';
import { Nip46ConnectionSigner } from './nip46-connection-signer';

export function createNip46ConnectionAttempt(
  handle: Nip46AttemptHandle,
  methodId: ConnectionMethodId
): ConnectionAttempt {
  return new Nip46ConnectionAttempt(handle, methodId);
}

class Nip46ConnectionAttempt implements ConnectionAttempt {
  private currentInstructions: ConnectionAttemptInstructions;
  private readonly unsubscribeAuthUrl: () => void;

  constructor(
    private readonly handle: Nip46AttemptHandle,
    readonly methodId: ConnectionMethodId
  ) {
    this.currentInstructions = handle.instructions ?? {};

    this.unsubscribeAuthUrl = handle.onAuthUrl((authUrl) => {
      this.currentInstructions = {
        ...this.currentInstructions,
        authUrl,
      };
    });
  }

  get instructions(): ConnectionAttemptInstructions {
    return this.currentInstructions;
  }

  async complete(): Promise<ActiveConnection> {
    const remoteSigner = await this.handle.waitForConnection();
    this.unsubscribeAuthUrl();

    const signer = new Nip46ConnectionSigner(remoteSigner, this.handle.capabilities);
    const session = await buildNip46Session(signer, this.handle.capabilities, this.methodId);

    return new Nip46ActiveConnection(signer, session, remoteSigner);
  }

  async cancel(): Promise<void> {
    this.unsubscribeAuthUrl();
    await this.handle.cancel();
  }
}

class Nip46ActiveConnection implements ActiveConnection {
  constructor(
    readonly signer: Nip46ConnectionSigner,
    private session: ConnectionSession,
    private readonly remoteSigner: { stop(): void }
  ) {}

  get methodId(): ConnectionMethodId {
    return this.session.methodId;
  }

  getSession(): ConnectionSession {
    return this.session;
  }

  async revalidate(): Promise<ConnectionRevalidationResult> {
    const previous = this.session;
    const current = await buildNip46Session(this.signer, previous.capabilities, this.methodId);
    this.session = current;

    return {
      previous,
      current,
      changed: didConnectionIdentityChange(previous, current),
    };
  }

  async disconnect(): Promise<void> {
    this.remoteSigner.stop();
  }
}

async function buildNip46Session(
  signer: Nip46ConnectionSigner,
  capabilities: readonly ConnectionCapability[],
  methodId: ConnectionMethodId
): Promise<ConnectionSession> {
  const pubkeyHex = await signer.getPublicKey();

  return createConnectionSession({
    pubkeyHex,
    methodId,
    capabilities,
  });
}
