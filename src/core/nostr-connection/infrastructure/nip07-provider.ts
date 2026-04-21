import type { SignedNostrEvent, UnsignedNostrEvent } from '../domain/nostr-event';

export interface Nip07EncryptionApi {
  encrypt(pubkey: string, plaintext: string): Promise<string>;
  decrypt(pubkey: string, ciphertext: string): Promise<string>;
}

export interface Nip07Provider {
  getPublicKey(): Promise<string>;
  signEvent(event: UnsignedNostrEvent): Promise<SignedNostrEvent>;
  nip04?: Nip07EncryptionApi;
  nip44?: Nip07EncryptionApi;
}

interface NostrWindow {
  nostr?: Nip07Provider;
}

export type Nip07ProviderResolver = () => Nip07Provider | null;

export function resolveDefaultNip07Provider(): Nip07Provider | null {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  return (globalThis as typeof globalThis & NostrWindow).nostr ?? null;
}
