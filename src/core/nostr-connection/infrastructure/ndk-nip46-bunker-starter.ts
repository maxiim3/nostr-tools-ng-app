import type NDK from '@nostr-dev-kit/ndk';

import { DEFAULT_RELAY_URLS } from '../../nostr/infrastructure/relay.config';
import type { ConnectionCapability } from '../domain/connection-capability';
import { ConnectionDomainError } from '../domain/connection-errors';
import type { Nip46BunkerStarter } from './nip46-bunker-starter';
import { subscribeToNdkNip46AuthUrl, waitForNdkNip46SignerReady } from './ndk-nip46-shared';
import type { Nip46AttemptHandle } from './nip46-nostrconnect-starter';

const DEFAULT_BUNKER_CAPABILITIES: readonly ConnectionCapability[] = [
  'sign-event',
  'nip98-auth',
  'nip04-encrypt',
  'nip04-decrypt',
  'nip44-encrypt',
  'nip44-decrypt',
];

export interface NdkNip46BunkerStarterOptions {
  capabilities?: readonly ConnectionCapability[];
  timeoutMs?: number;
}

export class NdkNip46BunkerStarter implements Nip46BunkerStarter {
  private readonly ndkModulePromise = import('@nostr-dev-kit/ndk');
  private readonly capabilities: readonly ConnectionCapability[];
  private readonly timeoutMs: number;

  constructor(options: NdkNip46BunkerStarterOptions = {}) {
    this.capabilities = options.capabilities ?? DEFAULT_BUNKER_CAPABILITIES;
    this.timeoutMs = options.timeoutMs ?? 120000;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async start(connectionToken: string): Promise<Nip46AttemptHandle> {
    const ndk = await this.createNdk(connectionToken);
    const { NDKNip46Signer } = await this.ndkModulePromise;

    let signer: import('@nostr-dev-kit/ndk').NDKNip46Signer;
    try {
      signer = NDKNip46Signer.bunker(ndk, connectionToken);
    } catch (error) {
      throw new ConnectionDomainError(
        'validation_failed',
        'Unable to initialize the bunker connection token.',
        error
      );
    }

    return new NdkNip46BunkerAttemptHandle(signer, this.capabilities, this.timeoutMs);
  }

  private async createNdk(connectionToken: string): Promise<NDK> {
    const { default: NDK } = await this.ndkModulePromise;
    const relayUrls = extractRelayUrlsFromConnectionToken(connectionToken);
    const ndk = new NDK({
      explicitRelayUrls: [
        ...relayUrls,
        ...DEFAULT_RELAY_URLS.filter((relayUrl) => !relayUrls.includes(relayUrl)),
      ],
    });

    await ndk.connect(2000);
    return ndk;
  }
}

class NdkNip46BunkerAttemptHandle implements Nip46AttemptHandle {
  readonly instructions = null;

  constructor(
    private readonly signer: import('@nostr-dev-kit/ndk').NDKNip46Signer,
    readonly capabilities: readonly ConnectionCapability[],
    private readonly timeoutMs: number
  ) {}

  async waitForConnection() {
    return waitForNdkNip46SignerReady(this.signer, this.timeoutMs);
  }

  onAuthUrl(listener: (url: string) => void): () => void {
    return subscribeToNdkNip46AuthUrl(this.signer, listener);
  }

  async cancel(): Promise<void> {
    this.signer.stop();
  }
}

function extractRelayUrlsFromConnectionToken(connectionToken: string): string[] {
  try {
    const parsedUrl = new URL(connectionToken);

    return parsedUrl.searchParams
      .getAll('relay')
      .map((relayUrl) => relayUrl.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
