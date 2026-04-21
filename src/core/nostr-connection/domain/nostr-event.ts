export interface UnsignedNostrEvent {
  kind: number;
  content: string;
  created_at: number;
  tags: string[][];
}

export interface SignedNostrEvent extends UnsignedNostrEvent {
  id: string;
  pubkey: string;
  sig: string;
}
