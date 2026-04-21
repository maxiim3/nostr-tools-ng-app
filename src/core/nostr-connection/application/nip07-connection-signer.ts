import { ConnectionDomainError } from '../domain/connection-errors';
import { normalizeHexPublicKey } from '../domain/connection-session';
import type { ConnectionCapability } from '../domain/connection-capability';
import type { ConnectionSigner } from '../domain/connection-signer';
import type { SignedNostrEvent, UnsignedNostrEvent } from '../domain/nostr-event';
import type { Nip07Provider } from '../infrastructure/nip07-provider';

export class Nip07ConnectionSigner implements ConnectionSigner {
  private readonly capabilities: readonly ConnectionCapability[];

  constructor(private readonly provider: Nip07Provider) {
    this.capabilities = detectCapabilities(provider);
  }

  async getPublicKey(): Promise<string> {
    try {
      const pubkey = await this.provider.getPublicKey();
      const normalizedPubkey = normalizeHexPublicKey(pubkey);

      if (!normalizedPubkey) {
        throw new ConnectionDomainError(
          'validation_failed',
          'NIP-07 provider returned an invalid hex pubkey.'
        );
      }

      return normalizedPubkey;
    } catch (error) {
      throw toNip07DomainError(
        error,
        'connection_failed',
        'Unable to read the public key from the NIP-07 provider.'
      );
    }
  }

  async signEvent(event: UnsignedNostrEvent): Promise<SignedNostrEvent> {
    try {
      const signedEvent = await this.provider.signEvent(event);
      const normalizedPubkey = normalizeHexPublicKey(signedEvent.pubkey);

      if (!normalizedPubkey) {
        throw new ConnectionDomainError(
          'validation_failed',
          'NIP-07 provider returned a signed event with an invalid pubkey.'
        );
      }

      return {
        ...signedEvent,
        pubkey: normalizedPubkey,
      };
    } catch (error) {
      throw toNip07DomainError(
        error,
        'connection_failed',
        'Unable to sign the event with the NIP-07 provider.'
      );
    }
  }

  supports(capability: ConnectionCapability): boolean {
    return this.capabilities.includes(capability);
  }
}

export function detectCapabilities(provider: Nip07Provider): readonly ConnectionCapability[] {
  const capabilities: ConnectionCapability[] = ['sign-event', 'nip98-auth'];

  if (provider.nip04?.encrypt) {
    capabilities.push('nip04-encrypt');
  }

  if (provider.nip04?.decrypt) {
    capabilities.push('nip04-decrypt');
  }

  if (provider.nip44?.encrypt) {
    capabilities.push('nip44-encrypt');
  }

  if (provider.nip44?.decrypt) {
    capabilities.push('nip44-decrypt');
  }

  return capabilities;
}

function toNip07DomainError(
  error: unknown,
  fallbackCode: 'connection_failed' | 'validation_failed',
  fallbackMessage: string
): ConnectionDomainError {
  if (error instanceof ConnectionDomainError) {
    return error;
  }

  if (isUserRejectedError(error)) {
    return new ConnectionDomainError('user_rejected', 'The NIP-07 request was rejected.', error);
  }

  return new ConnectionDomainError(fallbackCode, fallbackMessage, error);
}

function isUserRejectedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /reject|denied|cancel/i.test(error.message);
}
