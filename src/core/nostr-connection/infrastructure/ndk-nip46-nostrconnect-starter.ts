import type NDK from '@nostr-dev-kit/ndk';

import { PROJECT_INFO } from '../../config/project-info';
import { DEFAULT_RELAY_URLS } from '../../nostr/infrastructure/relay.config';
import type { ConnectionCapability } from '../domain/connection-capability';
import { ConnectionDomainError } from '../domain/connection-errors';
import type {
  Nip46NostrconnectAttemptHandle,
  Nip46NostrconnectStarter,
  Nip46RemoteSigner,
} from './nip46-nostrconnect-starter';

const DEFAULT_NOSTRCONNECT_CAPABILITIES: readonly ConnectionCapability[] = [
  'sign-event',
  'nip98-auth',
  'nip04-encrypt',
  'nip04-decrypt',
  'nip44-encrypt',
  'nip44-decrypt',
];

const DEFAULT_NOSTRCONNECT_PERMS = [
  'get_public_key',
  'sign_event',
  'nip04_encrypt',
  'nip04_decrypt',
  'nip44_encrypt',
  'nip44_decrypt',
].join(',');

export interface NdkNip46NostrconnectStarterOptions {
  relayUrl?: string;
  appName?: string;
  appUrl?: string;
  appImage?: string;
  perms?: string;
  capabilities?: readonly ConnectionCapability[];
  timeoutMs?: number;
}

export class NdkNip46NostrconnectStarter implements Nip46NostrconnectStarter {
  private readonly ndkModulePromise = import('@nostr-dev-kit/ndk');
  private ndkPromise: Promise<NDK> | null = null;
  private readonly relayUrl: string;
  private readonly appName: string;
  private readonly appUrl?: string;
  private readonly appImage?: string;
  private readonly perms: string;
  private readonly capabilities: readonly ConnectionCapability[];
  private readonly timeoutMs: number;

  constructor(options: NdkNip46NostrconnectStarterOptions = {}) {
    const locationOrigin =
      typeof globalThis.location === 'undefined' ? undefined : globalThis.location.origin;

    this.relayUrl = options.relayUrl ?? 'wss://relay.nsec.app';
    this.appName = options.appName ?? PROJECT_INFO.name;
    this.appUrl = options.appUrl ?? locationOrigin;
    this.appImage =
      options.appImage ?? (locationOrigin ? `${locationOrigin}/favicon.ico` : undefined);
    this.perms = options.perms ?? DEFAULT_NOSTRCONNECT_PERMS;
    this.capabilities = options.capabilities ?? DEFAULT_NOSTRCONNECT_CAPABILITIES;
    this.timeoutMs = options.timeoutMs ?? 120000;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async start(): Promise<Nip46NostrconnectAttemptHandle> {
    const ndk = await this.ensureNdk();
    const { NDKNip46Signer } = await this.ndkModulePromise;
    const signer = NDKNip46Signer.nostrconnect(ndk, this.relayUrl, undefined, {
      name: this.appName,
      url: this.appUrl,
      image: this.appImage,
      perms: this.perms,
    });

    if (!signer.nostrConnectUri) {
      signer.stop();
      throw new ConnectionDomainError('connection_failed', 'Unable to create a nostrconnect URI.');
    }

    return new NdkNip46NostrconnectAttemptHandle(signer, this.capabilities, this.timeoutMs);
  }

  private async ensureNdk(): Promise<NDK> {
    if (!this.ndkPromise) {
      this.ndkPromise = this.createNdk();
    }

    return this.ndkPromise;
  }

  private async createNdk(): Promise<NDK> {
    const { default: NDK } = await this.ndkModulePromise;
    const ndk = new NDK({
      explicitRelayUrls: [
        this.relayUrl,
        ...DEFAULT_RELAY_URLS.filter((url) => url !== this.relayUrl),
      ],
    });

    await ndk.connect(2000);
    return ndk;
  }
}

class NdkNip46NostrconnectAttemptHandle implements Nip46NostrconnectAttemptHandle {
  readonly uri: string;

  constructor(
    private readonly signer: import('@nostr-dev-kit/ndk').NDKNip46Signer,
    readonly capabilities: readonly ConnectionCapability[],
    private readonly timeoutMs: number
  ) {
    this.uri = signer.nostrConnectUri ?? '';
  }

  async waitForConnection(): Promise<Nip46RemoteSigner> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        this.signer.blockUntilReady(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            this.signer.stop();
            reject(new ConnectionDomainError('timeout', 'NIP-46 connection timed out.'));
          }, this.timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    return new NdkNip46RemoteSigner(this.signer);
  }

  onAuthUrl(listener: (url: string) => void): () => void {
    this.signer.on('authUrl', listener);

    return () => {
      this.signer.off('authUrl', listener);
    };
  }

  async cancel(): Promise<void> {
    this.signer.stop();
  }
}

class NdkNip46RemoteSigner implements Nip46RemoteSigner {
  constructor(private readonly signer: import('@nostr-dev-kit/ndk').NDKNip46Signer) {}

  async getPublicKey(): Promise<string> {
    return this.signer.getPublicKey();
  }

  async sign(
    event: Parameters<import('@nostr-dev-kit/ndk').NDKNip46Signer['sign']>[0]
  ): Promise<string> {
    return this.signer.sign(event);
  }

  stop(): void {
    this.signer.stop();
  }
}
