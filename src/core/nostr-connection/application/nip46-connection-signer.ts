import { getEventHash } from 'nostr-tools';

import type { ConnectionCapability } from '../domain/connection-capability';
import { ConnectionDomainError } from '../domain/connection-errors';
import { normalizeHexPublicKey } from '../domain/connection-session';
import type { ConnectionSigner } from '../domain/connection-signer';
import type { SignedNostrEvent, UnsignedNostrEvent } from '../domain/nostr-event';
import type { Nip46RemoteSigner } from '../infrastructure/nip46-nostrconnect-starter';

export class Nip46ConnectionSigner implements ConnectionSigner {
  readonly ndkSigner?: unknown;

  constructor(
    private readonly signer: Nip46RemoteSigner,
    private readonly capabilities: readonly ConnectionCapability[],
    ndkSigner?: unknown
  ) {
    this.ndkSigner = ndkSigner;
  }

  async getPublicKey(): Promise<string> {
    try {
      const pubkey = await this.signer.getPublicKey();
      const normalizedPubkey = normalizeHexPublicKey(pubkey);

      if (!normalizedPubkey) {
        throw new ConnectionDomainError(
          'validation_failed',
          'NIP-46 signer returned an invalid hex pubkey.'
        );
      }

      return normalizedPubkey;
    } catch (error) {
      throw toNip46DomainError(
        error,
        'connection_failed',
        'Unable to read the public key from the NIP-46 signer.'
      );
    }
  }

  async signEvent(event: UnsignedNostrEvent): Promise<SignedNostrEvent> {
    try {
      const pubkey = await this.getPublicKey();
      const eventToSign = {
        kind: event.kind,
        content: event.content,
        created_at: event.created_at,
        tags: event.tags,
        pubkey,
      };
      const sig = await this.signer.sign(eventToSign);
      const id = getEventHash(eventToSign);

      return {
        kind: eventToSign.kind,
        content: eventToSign.content,
        created_at: eventToSign.created_at,
        tags: eventToSign.tags,
        pubkey,
        id,
        sig,
      };
    } catch (error) {
      throw toNip46DomainError(
        error,
        'connection_failed',
        'Unable to sign the event with the NIP-46 signer.'
      );
    }
  }

  supports(capability: ConnectionCapability): boolean {
    return this.capabilities.includes(capability);
  }

  getRestorePayload(): string | null {
    try {
      return this.signer.toPayload?.() ?? null;
    } catch {
      return null;
    }
  }
}

function toNip46DomainError(
  error: unknown,
  fallbackCode: 'connection_failed' | 'validation_failed',
  fallbackMessage: string
): ConnectionDomainError {
  if (error instanceof ConnectionDomainError) {
    return error;
  }

  if (error instanceof Error && /reject|denied|cancel/i.test(error.message)) {
    return new ConnectionDomainError('user_rejected', 'The NIP-46 request was rejected.', error);
  }

  if (error instanceof Error && /timed out/i.test(error.message)) {
    return new ConnectionDomainError('timeout', 'The NIP-46 request timed out.', error);
  }

  return new ConnectionDomainError(fallbackCode, fallbackMessage, error);
}
