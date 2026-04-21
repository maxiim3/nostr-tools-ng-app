import type { ConnectionMethodId } from './connection-method-id';
import type { ConnectionSession } from './connection-session';
import type { ConnectionSigner } from './connection-signer';

export interface ConnectionRevalidationResult {
  previous: ConnectionSession;
  current: ConnectionSession;
  changed: boolean;
}

export interface ActiveConnection {
  readonly methodId: ConnectionMethodId;
  readonly signer: ConnectionSigner;

  getSession(): ConnectionSession;
  revalidate(): Promise<ConnectionRevalidationResult>;
  disconnect(): Promise<void>;
}
