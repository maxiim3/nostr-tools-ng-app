import type { SignedNostrEvent, UnsignedNostrEvent } from '../../domain/nostr-event';
import type { Nip07Provider } from '../../infrastructure/nip07-provider';
import { FakeConnectionSigner } from './fake-connection-signer';

export interface FakeNip07ProviderOptions {
  signers?: readonly FakeConnectionSigner[];
  getPublicKeyError?: Error;
  signEventError?: Error;
  withNip04?: boolean;
  withNip44?: boolean;
}

export class FakeNip07Provider implements Nip07Provider {
  private readonly signers: readonly FakeConnectionSigner[];
  private currentSignerIndex = 0;
  private getPublicKeyCalls = 0;

  readonly nip04?: Nip07Provider['nip04'];
  readonly nip44?: Nip07Provider['nip44'];

  constructor(private readonly options: FakeNip07ProviderOptions = {}) {
    this.signers = options.signers ?? [new FakeConnectionSigner()];

    if (options.withNip04) {
      this.nip04 = {
        encrypt: async (_pubkey: string, plaintext: string) => plaintext,
        decrypt: async (_pubkey: string, ciphertext: string) => ciphertext,
      };
    }

    if (options.withNip44) {
      this.nip44 = {
        encrypt: async (_pubkey: string, plaintext: string) => plaintext,
        decrypt: async (_pubkey: string, ciphertext: string) => ciphertext,
      };
    }
  }

  async getPublicKey(): Promise<string> {
    if (this.options.getPublicKeyError) {
      throw this.options.getPublicKeyError;
    }

    const signer = this.signers[Math.min(this.getPublicKeyCalls, this.signers.length - 1)];
    this.currentSignerIndex = Math.min(this.getPublicKeyCalls, this.signers.length - 1);
    this.getPublicKeyCalls += 1;

    return signer.publicKeyHex;
  }

  async signEvent(event: UnsignedNostrEvent): Promise<SignedNostrEvent> {
    if (this.options.signEventError) {
      throw this.options.signEventError;
    }

    return this.signers[this.currentSignerIndex].signEvent(event);
  }
}
