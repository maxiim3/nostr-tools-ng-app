import type { ConnectionMethodId } from '../../domain/connection-method-id';
import {
  createConnectionSession,
  didConnectionIdentityChange,
  type ConnectionSession,
} from '../../domain/connection-session';
import type {
  ActiveConnection,
  ConnectionRevalidationResult,
} from '../../domain/active-connection';
import type { ConnectionCapability } from '../../domain/connection-capability';
import type { ConnectionSigner } from '../../domain/connection-signer';
import { FakeConnectionSigner } from './fake-connection-signer';

export interface FakeActiveConnectionOptions {
  signer?: FakeConnectionSigner;
  methodId?: ConnectionMethodId;
  capabilities?: readonly ConnectionCapability[];
  session?: ConnectionSession;
  nextSigner?: FakeConnectionSigner;
  nextSession?: ConnectionSession;
  disconnectError?: Error;
}

export class FakeActiveConnection implements ActiveConnection {
  private currentSigner: ConnectionSigner;
  private currentSession: ConnectionSession;
  private readonly nextSigner?: FakeConnectionSigner;
  private readonly nextSession?: ConnectionSession;
  private readonly disconnectError?: Error;

  disconnectCalls = 0;
  revalidateCalls = 0;

  constructor(options: FakeActiveConnectionOptions = {}) {
    const signer = options.signer ?? new FakeConnectionSigner();
    const methodId = options.methodId ?? 'nip07';
    const capabilities = options.capabilities ?? ['sign-event', 'nip98-auth'];

    this.currentSigner = signer;
    this.currentSession =
      options.session ??
      createConnectionSession({
        pubkeyHex: signer.publicKeyHex,
        methodId,
        capabilities,
        validatedAt: 1,
      });
    this.nextSigner = options.nextSigner;
    this.nextSession = options.nextSession;
    this.disconnectError = options.disconnectError;
  }

  get methodId(): ConnectionMethodId {
    return this.currentSession.methodId;
  }

  get signer(): ConnectionSigner {
    return this.currentSigner;
  }

  getSession(): ConnectionSession {
    return this.currentSession;
  }

  async revalidate(): Promise<ConnectionRevalidationResult> {
    this.revalidateCalls += 1;

    const previous = this.currentSession;
    const nextSigner = this.nextSigner ?? this.currentSigner;
    const current =
      this.nextSession ??
      createConnectionSession({
        pubkeyHex: await nextSigner.getPublicKey(),
        methodId: previous.methodId,
        capabilities: previous.capabilities,
        validatedAt: previous.validatedAt + 1,
      });

    this.currentSigner = nextSigner;
    this.currentSession = current;

    return {
      previous,
      current,
      changed: didConnectionIdentityChange(previous, current),
    };
  }

  async disconnect(): Promise<void> {
    this.disconnectCalls += 1;

    if (this.disconnectError) {
      throw this.disconnectError;
    }
  }
}
