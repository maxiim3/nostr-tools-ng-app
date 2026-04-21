import type { ConnectionCapability } from './connection-capability';
import type { SignedNostrEvent, UnsignedNostrEvent } from './nostr-event';

export interface ConnectionSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: UnsignedNostrEvent): Promise<SignedNostrEvent>;
  supports(capability: ConnectionCapability): boolean;
}
