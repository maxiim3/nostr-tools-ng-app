import type { NDKNip46Signer } from '@nostr-dev-kit/ndk';

import { ConnectionDomainError } from '../domain/connection-errors';
import type { Nip46RemoteSigner } from './nip46-nostrconnect-starter';

export async function waitForNdkNip46SignerReady(
  signer: NDKNip46Signer,
  timeoutMs: number
): Promise<Nip46RemoteSigner> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const stopSigner = () => {
    if (stopped) {
      return;
    }

    stopped = true;
    signer.stop();
  };

  try {
    await Promise.race([
      signer.blockUntilReady(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          stopSigner();
          reject(new ConnectionDomainError('timeout', 'NIP-46 connection timed out.'));
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    stopSigner();
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  return new NdkNip46RemoteSigner(signer);
}

export function subscribeToNdkNip46AuthUrl(
  signer: NDKNip46Signer,
  listener: (url: string) => void
): () => void {
  signer.on('authUrl', listener);

  return () => {
    signer.off('authUrl', listener);
  };
}

export class NdkNip46RemoteSigner implements Nip46RemoteSigner {
  constructor(private readonly signer: NDKNip46Signer) {}

  get ndkSigner(): NDKNip46Signer {
    return this.signer;
  }

  async getPublicKey(): Promise<string> {
    return this.signer.getPublicKey();
  }

  async sign(event: Parameters<NDKNip46Signer['sign']>[0]): Promise<string> {
    return this.signer.sign(event);
  }

  stop(): void {
    this.signer.stop();
  }

  toPayload(): string {
    return this.signer.toPayload();
  }
}
