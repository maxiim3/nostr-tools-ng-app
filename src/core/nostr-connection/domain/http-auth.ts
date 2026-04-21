import type { ConnectionSigner } from './connection-signer';

export interface HttpAuthRequest {
  url: string;
  method: string;
  body?: Record<string, unknown>;
}

export interface HttpAuthPort {
  createAuthorizationHeader(signer: ConnectionSigner, request: HttpAuthRequest): Promise<string>;
}
