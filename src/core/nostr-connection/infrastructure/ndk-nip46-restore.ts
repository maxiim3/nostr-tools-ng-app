import type { NDKNip46Signer } from '@nostr-dev-kit/ndk';

import { DEFAULT_RELAY_URLS } from '../../nostr/infrastructure/relay.config';
import { ConnectionDomainError } from '../domain/connection-errors';
import { waitForNdkNip46SignerReady } from './ndk-nip46-shared';
import type { Nip46RemoteSigner } from './nip46-nostrconnect-starter';

export interface NdkNip46RestoreOptions {
  relayUrls?: readonly string[];
  connectTimeoutMs?: number;
  readyTimeoutMs?: number;
}

export async function restoreNdkNip46SignerFromPayload(
  payload: string,
  options: NdkNip46RestoreOptions = {}
): Promise<Nip46RemoteSigner> {
  const { default: NDK, NDKNip46Signer } = await import('@nostr-dev-kit/ndk');
  const ndk = new NDK({
    explicitRelayUrls: [...(options.relayUrls ?? DEFAULT_RELAY_URLS)],
  });

  await ndk.connect(options.connectTimeoutMs ?? 2000);

  let signer: NDKNip46Signer;
  try {
    signer = await NDKNip46Signer.fromPayload(payload, ndk);
  } catch (error) {
    throw new ConnectionDomainError(
      'validation_failed',
      'Unable to restore the NIP-46 signer payload.',
      error
    );
  }

  return waitForNdkNip46SignerReady(signer, options.readyTimeoutMs ?? 120000);
}
