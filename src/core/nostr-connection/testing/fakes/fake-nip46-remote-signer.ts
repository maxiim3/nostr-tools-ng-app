import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';

import type { UnsignedNostrEvent } from '../../domain/nostr-event';
import type { Nip46RemoteSigner } from '../../infrastructure/nip46-nostrconnect-starter';

export interface FakeNip46RemoteSignerOptions {
  secretKey?: Uint8Array;
  getPublicKeyError?: Error;
  signError?: Error;
}

export class FakeNip46RemoteSigner implements Nip46RemoteSigner {
  private readonly secretKey: Uint8Array;
  stopCalls = 0;

  constructor(private readonly options: FakeNip46RemoteSignerOptions = {}) {
    this.secretKey = options.secretKey ?? generateSecretKey();
  }

  get pubkeyHex(): string {
    return getPublicKey(this.secretKey);
  }

  async getPublicKey(): Promise<string> {
    if (this.options.getPublicKeyError) {
      throw this.options.getPublicKeyError;
    }

    return this.pubkeyHex;
  }

  async sign(event: UnsignedNostrEvent & { pubkey: string }): Promise<string> {
    if (this.options.signError) {
      throw this.options.signError;
    }

    return finalizeEvent(event, this.secretKey).sig;
  }

  stop(): void {
    this.stopCalls += 1;
  }
}
