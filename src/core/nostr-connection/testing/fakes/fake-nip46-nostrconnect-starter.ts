import type { ConnectionCapability } from '../../domain/connection-capability';
import type {
  Nip46NostrconnectAttemptHandle,
  Nip46NostrconnectStarter,
  Nip46RemoteSigner,
} from '../../infrastructure/nip46-nostrconnect-starter';
import { FakeNip46RemoteSigner } from './fake-nip46-remote-signer';

export interface FakeNip46NostrconnectAttemptHandleOptions {
  uri?: string;
  capabilities?: readonly ConnectionCapability[];
  remoteSigner?: Nip46RemoteSigner;
  waitError?: Error;
}

export class FakeNip46NostrconnectAttemptHandle implements Nip46NostrconnectAttemptHandle {
  readonly uri: string;
  readonly capabilities: readonly ConnectionCapability[];

  cancelCalls = 0;
  waitCalls = 0;

  private readonly listeners = new Set<(url: string) => void>();
  private readonly remoteSigner: Nip46RemoteSigner;
  private readonly waitError?: Error;

  constructor(options: FakeNip46NostrconnectAttemptHandleOptions = {}) {
    this.uri = options.uri ?? 'nostrconnect://example';
    this.capabilities = options.capabilities ?? [
      'sign-event',
      'nip98-auth',
      'nip44-encrypt',
      'nip44-decrypt',
    ];
    this.remoteSigner = options.remoteSigner ?? new FakeNip46RemoteSigner();
    this.waitError = options.waitError;
  }

  emitAuthUrl(url: string): void {
    for (const listener of this.listeners) {
      listener(url);
    }
  }

  async waitForConnection(): Promise<Nip46RemoteSigner> {
    this.waitCalls += 1;

    if (this.waitError) {
      throw this.waitError;
    }

    return this.remoteSigner;
  }

  onAuthUrl(listener: (url: string) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async cancel(): Promise<void> {
    this.cancelCalls += 1;
  }
}

export interface FakeNip46NostrconnectStarterOptions {
  available?: boolean;
  startError?: Error;
  attempt?: Nip46NostrconnectAttemptHandle;
}

export class FakeNip46NostrconnectStarter implements Nip46NostrconnectStarter {
  isAvailableCalls = 0;
  startCalls = 0;

  private readonly available: boolean;
  private readonly startError?: Error;
  private readonly attempt: Nip46NostrconnectAttemptHandle;

  constructor(options: FakeNip46NostrconnectStarterOptions = {}) {
    this.available = options.available ?? true;
    this.startError = options.startError;
    this.attempt = options.attempt ?? new FakeNip46NostrconnectAttemptHandle();
  }

  async isAvailable(): Promise<boolean> {
    this.isAvailableCalls += 1;
    return this.available;
  }

  async start(): Promise<Nip46NostrconnectAttemptHandle> {
    this.startCalls += 1;

    if (this.startError) {
      throw this.startError;
    }

    return this.attempt;
  }
}
