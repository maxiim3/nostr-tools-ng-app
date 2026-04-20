export interface Nip07Provider {
  getPublicKey(): Promise<string>;
}

interface NostrWindow {
  nostr?: Nip07Provider;
}

export function getNip07Provider(): Nip07Provider | null {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  return (globalThis as typeof globalThis & NostrWindow).nostr ?? null;
}
