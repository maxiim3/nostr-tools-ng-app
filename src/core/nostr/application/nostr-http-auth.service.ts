import { inject, Injectable } from '@angular/core';

import { NostrConnectionFacadeService } from '../../nostr-connection/application/connection-facade';
import { Nip98HttpAuthService } from '../../nostr-connection/application/nip98-http-auth.service';
import type { ConnectionSigner } from '../../nostr-connection/domain/connection-signer';
import type { HttpAuthRequest } from '../../nostr-connection/domain/http-auth';
import { NostrClientService } from './nostr-client.service';

@Injectable({ providedIn: 'root' })
export class NostrHttpAuthService {
  private readonly facade = inject(NostrConnectionFacadeService);
  private readonly client = inject(NostrClientService);
  private readonly nip98HttpAuth = new Nip98HttpAuthService();

  async createAuthorizationHeader(request: HttpAuthRequest): Promise<string> {
    const signer = await this.resolveSigner();
    return this.nip98HttpAuth.createAuthorizationHeader(signer, request);
  }

  private async resolveSigner(): Promise<ConnectionSigner> {
    const activeConnection = this.facade.getActiveConnection();

    if (activeConnection && activeConnection.signer.supports('nip98-auth')) {
      return activeConnection.signer;
    }

    return this.client.getHttpAuthSigner();
  }
}
