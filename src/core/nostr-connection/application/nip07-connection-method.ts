import type { ActiveConnection, ConnectionRevalidationResult } from '../domain/active-connection';
import type { ConnectionAttempt } from '../domain/connection-attempt';
import type { ConnectionCapability } from '../domain/connection-capability';
import type { ConnectionMethod, ConnectionRequest } from '../domain/connection-method';
import { ConnectionDomainError } from '../domain/connection-errors';
import {
  createConnectionSession,
  didConnectionIdentityChange,
  type ConnectionSession,
} from '../domain/connection-session';
import type { ConnectionMethodId } from '../domain/connection-method-id';
import type { Nip07ProviderResolver } from '../infrastructure/nip07-provider';
import { resolveDefaultNip07Provider } from '../infrastructure/nip07-provider';
import { detectCapabilities, Nip07ConnectionSigner } from './nip07-connection-signer';

export interface Nip07ConnectionMethodOptions {
  resolveProvider?: Nip07ProviderResolver;
}

export class Nip07ConnectionMethod implements ConnectionMethod {
  readonly id: ConnectionMethodId = 'nip07';

  private readonly resolveProvider: Nip07ProviderResolver;

  constructor(options: Nip07ConnectionMethodOptions = {}) {
    this.resolveProvider = options.resolveProvider ?? resolveDefaultNip07Provider;
  }

  async isAvailable(): Promise<boolean> {
    return this.resolveProvider() !== null;
  }

  async start(_request?: ConnectionRequest): Promise<ConnectionAttempt> {
    const provider = this.resolveProvider();
    if (!provider) {
      throw new ConnectionDomainError('method_unavailable', 'NIP-07 provider is not available.');
    }

    const signer = new Nip07ConnectionSigner(provider);

    return new ImmediateConnectionAttempt(this.id, signer, detectCapabilities(provider));
  }
}

class ImmediateConnectionAttempt implements ConnectionAttempt {
  readonly instructions = null;

  constructor(
    readonly methodId: ConnectionMethodId,
    private readonly signer: Nip07ConnectionSigner,
    private readonly capabilities: readonly ConnectionCapability[]
  ) {}

  async complete(): Promise<ActiveConnection> {
    const session = await buildSession(this.signer, this.capabilities, this.methodId);
    return new Nip07ActiveConnection(this.signer, session);
  }

  onInstructionsChange(): () => void {
    return () => undefined;
  }

  async cancel(): Promise<void> {
    return Promise.resolve();
  }
}

class Nip07ActiveConnection implements ActiveConnection {
  readonly methodId: ConnectionMethodId = 'nip07';

  constructor(
    readonly signer: Nip07ConnectionSigner,
    private session: ConnectionSession
  ) {}

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
    return Promise.resolve();
  }
}

async function buildSession(
  signer: Nip07ConnectionSigner,
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
