import type { ConnectionAttemptInstructions } from '../domain/connection-attempt';
import type { ConnectionCapability } from '../domain/connection-capability';
import type { UnsignedNostrEvent } from '../domain/nostr-event';

export interface Nip46RemoteSigner {
  getPublicKey(): Promise<string>;
  sign(event: UnsignedNostrEvent & { pubkey: string }): Promise<string>;
  stop(): void;
}

export interface Nip46AttemptHandle {
  readonly instructions: ConnectionAttemptInstructions | null;
  readonly capabilities: readonly ConnectionCapability[];

  waitForConnection(): Promise<Nip46RemoteSigner>;
  onAuthUrl(listener: (url: string) => void): () => void;
  cancel(): Promise<void>;
}

export interface Nip46NostrconnectStarter {
  isAvailable(): Promise<boolean>;
  start(): Promise<Nip46AttemptHandle>;
}
