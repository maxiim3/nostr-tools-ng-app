import type { Event, EventTemplate } from 'nostr-tools';
import { getToken } from 'nostr-tools/nip98';

import { ConnectionDomainError } from '../domain/connection-errors';
import type { HttpAuthPort, HttpAuthRequest } from '../domain/http-auth';
import type { SignedNostrEvent, UnsignedNostrEvent } from '../domain/nostr-event';
import type { ConnectionSigner } from '../domain/connection-signer';

export class Nip98HttpAuthService implements HttpAuthPort {
  async createAuthorizationHeader(
    signer: ConnectionSigner,
    request: HttpAuthRequest
  ): Promise<string> {
    this.assertSigner(signer);
    this.assertRequest(request);

    if (!signer.supports('nip98-auth')) {
      throw new ConnectionDomainError(
        'unsupported_capability',
        'Current signer does not support NIP-98 HTTP authentication.'
      );
    }

    return getToken(
      request.url,
      request.method,
      async (template: EventTemplate) =>
        this.signTemplate(signer, {
          kind: template.kind,
          tags: template.tags,
          content: template.content,
          created_at: template.created_at,
        }),
      true,
      request.body
    );
  }

  private assertSigner(
    signer: ConnectionSigner | null | undefined
  ): asserts signer is ConnectionSigner {
    if (
      !signer ||
      typeof signer.getPublicKey !== 'function' ||
      typeof signer.signEvent !== 'function' ||
      typeof signer.supports !== 'function'
    ) {
      throw new ConnectionDomainError(
        'no_active_connection',
        'A signer is required for HTTP auth.'
      );
    }
  }

  private assertRequest(request: HttpAuthRequest): void {
    if (!request.url.trim()) {
      throw new ConnectionDomainError('validation_failed', 'HTTP auth URL is required.');
    }

    try {
      new URL(request.url);
    } catch {
      throw new ConnectionDomainError('validation_failed', 'HTTP auth requires an absolute URL.');
    }

    if (!request.method.trim()) {
      throw new ConnectionDomainError('validation_failed', 'HTTP auth method is required.');
    }
  }

  private async signTemplate(
    signer: ConnectionSigner,
    template: UnsignedNostrEvent
  ): Promise<Event> {
    const signedEvent = await signer.signEvent(template);
    return toNostrToolsEvent(signedEvent);
  }
}

function toNostrToolsEvent(event: SignedNostrEvent): Event {
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
    sig: event.sig,
  };
}
