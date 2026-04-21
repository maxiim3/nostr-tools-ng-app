import type { ConnectionAttempt } from '../domain/connection-attempt';
import { ConnectionDomainError } from '../domain/connection-errors';
import type { ConnectionMethod, ConnectionRequest } from '../domain/connection-method';
import type { ConnectionMethodId } from '../domain/connection-method-id';
import type { Nip46BunkerStarter } from '../infrastructure/nip46-bunker-starter';
import { createNip46ConnectionAttempt } from './nip46-connection-attempt';

export class Nip46BunkerConnectionMethod implements ConnectionMethod {
  readonly id: ConnectionMethodId = 'nip46-bunker';

  constructor(private readonly starter: Nip46BunkerStarter) {}

  async isAvailable(): Promise<boolean> {
    return this.starter.isAvailable();
  }

  async start(request?: ConnectionRequest): Promise<ConnectionAttempt> {
    if (!(await this.starter.isAvailable())) {
      throw new ConnectionDomainError('method_unavailable', 'NIP-46 bunker is not available.');
    }

    const connectionToken = normalizeBunkerConnectionToken(request?.connectionToken);
    if (!connectionToken) {
      throw new ConnectionDomainError(
        'validation_failed',
        'A bunker connection token is required.'
      );
    }

    assertValidBunkerConnectionToken(connectionToken);

    const handle = await this.starter.start(connectionToken);
    return createNip46ConnectionAttempt(handle, this.id);
  }
}

export function normalizeBunkerConnectionToken(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export function assertValidBunkerConnectionToken(connectionToken: string): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(connectionToken);
  } catch {
    throw new ConnectionDomainError(
      'validation_failed',
      'Bunker connection token must be a valid URL.'
    );
  }

  if (parsedUrl.protocol !== 'bunker:') {
    throw new ConnectionDomainError(
      'validation_failed',
      'Bunker connection token must use the bunker:// scheme.'
    );
  }

  const bunkerPubkey = parsedUrl.hostname || parsedUrl.pathname.replace(/^\/\//, '');
  if (!/^[0-9a-f]{64}$/i.test(bunkerPubkey.trim())) {
    throw new ConnectionDomainError(
      'validation_failed',
      'Bunker connection token must include a valid bunker pubkey.'
    );
  }

  const relayUrls = parsedUrl.searchParams
    .getAll('relay')
    .map((relay) => relay.trim())
    .filter(Boolean);

  if (relayUrls.length === 0) {
    throw new ConnectionDomainError(
      'validation_failed',
      'Bunker connection token must include at least one relay URL.'
    );
  }

  for (const relayUrl of relayUrls) {
    try {
      const parsedRelayUrl = new URL(relayUrl);
      if (parsedRelayUrl.protocol !== 'wss:' && parsedRelayUrl.protocol !== 'ws:') {
        throw new Error('invalid relay protocol');
      }
    } catch {
      throw new ConnectionDomainError(
        'validation_failed',
        'Bunker connection token contains an invalid relay URL.'
      );
    }
  }
}
