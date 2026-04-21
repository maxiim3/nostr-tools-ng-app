import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';

import type { ConnectionCapability } from '../../domain/connection-capability';
import type { ConnectionSigner } from '../../domain/connection-signer';
import type { SignedNostrEvent, UnsignedNostrEvent } from '../../domain/nostr-event';

export interface FakeConnectionSignerOptions {
  secretKey?: Uint8Array;
  capabilities?: readonly ConnectionCapability[];
}

export class FakeConnectionSigner implements ConnectionSigner {
  private readonly secretKey: Uint8Array;
  private readonly capabilities: ReadonlySet<ConnectionCapability>;

  constructor(options: FakeConnectionSignerOptions = {}) {
    this.secretKey = options.secretKey ?? generateSecretKey();
    this.capabilities = new Set(options.capabilities ?? ['sign-event', 'nip98-auth']);
  }

  get publicKeyHex(): string {
    return getPublicKey(this.secretKey);
  }

  async getPublicKey(): Promise<string> {
    return this.publicKeyHex;
  }

  async signEvent(event: UnsignedNostrEvent): Promise<SignedNostrEvent> {
    const signedEvent = finalizeEvent(
      {
        kind: event.kind,
        content: event.content,
        created_at: event.created_at,
        tags: event.tags,
      },
      this.secretKey
    );

    return {
      id: signedEvent.id,
      pubkey: signedEvent.pubkey,
      created_at: signedEvent.created_at,
      kind: signedEvent.kind,
      tags: signedEvent.tags,
      content: signedEvent.content,
      sig: signedEvent.sig,
    };
  }

  supports(capability: ConnectionCapability): boolean {
    return this.capabilities.has(capability);
  }
}
