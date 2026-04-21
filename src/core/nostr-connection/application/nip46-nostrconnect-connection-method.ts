import type { ActiveConnection, ConnectionRevalidationResult } from '../domain/active-connection';
import type {
  ConnectionAttempt,
  ConnectionAttemptInstructions,
} from '../domain/connection-attempt';
import type { ConnectionMethod, ConnectionRequest } from '../domain/connection-method';
import {
  createConnectionSession,
  didConnectionIdentityChange,
  type ConnectionSession,
} from '../domain/connection-session';
import type { ConnectionCapability } from '../domain/connection-capability';
import type { ConnectionMethodId } from '../domain/connection-method-id';
import type {
  Nip46NostrconnectAttemptHandle,
  Nip46NostrconnectStarter,
} from '../infrastructure/nip46-nostrconnect-starter';
import { Nip46ConnectionSigner } from './nip46-connection-signer';

export class Nip46NostrconnectConnectionMethod implements ConnectionMethod {
  readonly id: ConnectionMethodId = 'nip46-nostrconnect';

  constructor(private readonly starter: Nip46NostrconnectStarter) {}

  async isAvailable(): Promise<boolean> {
    return this.starter.isAvailable();
  }

  async start(_request?: ConnectionRequest): Promise<ConnectionAttempt> {
    if (!(await this.starter.isAvailable())) {
      throw new Error('NIP-46 nostrconnect is not available.');
    }

    const handle = await this.starter.start();
    return new Nip46NostrconnectAttempt(handle, this.id);
  }
}

class Nip46NostrconnectAttempt implements ConnectionAttempt {
  private currentInstructions: ConnectionAttemptInstructions;
  private readonly unsubscribeAuthUrl: () => void;

  constructor(
    private readonly handle: Nip46NostrconnectAttemptHandle,
    readonly methodId: ConnectionMethodId
  ) {
    this.currentInstructions = {
      launchUrl: handle.uri,
      copyValue: handle.uri,
      qrCodeValue: handle.uri,
    };

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
    const session = await buildSession(signer, this.handle.capabilities, this.methodId);

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
    const current = await buildSession(this.signer, previous.capabilities, this.methodId);
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

async function buildSession(
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
