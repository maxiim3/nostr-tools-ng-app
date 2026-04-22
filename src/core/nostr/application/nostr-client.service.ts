import { Injectable } from '@angular/core';
import type NDK from '@nostr-dev-kit/ndk';
import type { NDKEvent, NDKFilter, NDKSigner, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';

import { PROJECT_INFO } from '../../config/project-info';
import type { ConnectionCapability } from '../../nostr-connection/domain/connection-capability';
import { ConnectionDomainError } from '../../nostr-connection/domain/connection-errors';
import type { ConnectionSigner } from '../../nostr-connection/domain/connection-signer';
import type {
  SignedNostrEvent,
  UnsignedNostrEvent,
} from '../../nostr-connection/domain/nostr-event';
import { DEFAULT_RELAY_URLS } from '../infrastructure/relay.config';

const EXTERNAL_AUTH_RELAY_URLS = [
  'wss://relay.nsec.app',
  'wss://relay.damus.io',
  'wss://relay.primal.net',
];
const EXTERNAL_AUTH_TIMEOUT_MS = 120000;

export interface SessionUser {
  pubkey: string;
  npub: string;
  displayName: string;
  imageUrl: string | null;
  description: string | null;
  nip05: string | null;
}

@Injectable({ providedIn: 'root' })
export class NostrClientService {
  private readonly ndkModulePromise = import('@nostr-dev-kit/ndk');
  private ndkPromise: Promise<NDK> | null = null;
  private pendingExternalSigner: import('@nostr-dev-kit/ndk').NDKNip46Signer | null = null;

  async connectWithExtension(): Promise<SessionUser> {
    const ndk = await this.ensureNdk();
    const { NDKNip07Signer } = await this.ndkModulePromise;
    const signer = new NDKNip07Signer(1500, ndk);
    const user = await signer.user();

    return this.applySigner(signer, user);
  }

  async connectWithPrivateKey(privateKeyOrNsec: string): Promise<SessionUser> {
    const ndk = await this.ensureNdk();
    const { NDKPrivateKeySigner } = await this.ndkModulePromise;
    const signer = new NDKPrivateKeySigner(privateKeyOrNsec.trim(), ndk);
    const user = await signer.user();

    return this.applySigner(signer, user);
  }

  async beginExternalAppLogin(): Promise<string> {
    const ndk = await this.ensureNdk();
    const { NDKNip46Signer } = await this.ndkModulePromise;
    const appUrl =
      typeof globalThis.location === 'undefined' ? undefined : globalThis.location.origin;

    this.pendingExternalSigner?.stop();

    const signer = NDKNip46Signer.nostrconnect(ndk, EXTERNAL_AUTH_RELAY_URLS[0], undefined, {
      name: PROJECT_INFO.name,
      url: appUrl,
      image: appUrl ? `${appUrl}/favicon.ico` : undefined,
    });

    if (!signer.nostrConnectUri) {
      signer.stop();
      throw new Error('Unable to create external app login link.');
    }

    this.pendingExternalSigner = signer;

    return signer.nostrConnectUri;
  }

  async completeExternalAppLogin(): Promise<SessionUser> {
    if (!this.pendingExternalSigner) {
      throw new Error('No external app login is pending.');
    }

    const signer = this.pendingExternalSigner;
    const user = await Promise.race([
      signer.blockUntilReady(),
      new Promise<NDKUser>((_, reject) =>
        setTimeout(() => {
          this.pendingExternalSigner?.stop();
          this.pendingExternalSigner = null;
          reject(new Error('External app login timed out. Please try again.'));
        }, EXTERNAL_AUTH_TIMEOUT_MS)
      ),
    ]);
    this.pendingExternalSigner = null;

    return this.applySigner(signer, user);
  }

  cancelExternalAppLogin(): void {
    this.pendingExternalSigner?.stop();
    this.pendingExternalSigner = null;
  }

  async applyNdkSigner(signer: NDKSigner, pubkeyHex: string): Promise<void> {
    const ndk = await this.ensureNdk();
    const { NDKUser } = await this.ndkModulePromise;
    const user = new NDKUser({ pubkey: pubkeyHex });
    user.ndk = ndk;
    ndk.signer = signer;
    ndk.activeUser = user;
  }

  async clearSigner(): Promise<void> {
    const ndk = await this.ensureNdk();
    ndk.signer = undefined;
    ndk.activeUser = undefined;
    this.cancelExternalAppLogin();
  }

  async getNdk(): Promise<NDK> {
    return this.ensureNdk();
  }

  async fetchProfile(identifier: string): Promise<SessionUser> {
    const ndk = await this.ensureNdk();
    const { NDKUser } = await this.ndkModulePromise;
    const user = identifier.startsWith('npub1')
      ? new NDKUser({ npub: identifier })
      : new NDKUser({ pubkey: identifier });
    user.ndk = ndk;

    const profile = await user.fetchProfile().catch(() => null);
    return this.toSessionUser(user.pubkey, user.npub, profile);
  }

  async fetchEvents(filters: NDKFilter | NDKFilter[]): Promise<NDKEvent[]> {
    const ndk = await this.ensureNdk();
    const events = await Promise.race([
      ndk.fetchEvents(filters),
      new Promise<Set<NDKEvent>>((resolve) => setTimeout(() => resolve(new Set()), 10_000)),
    ]);

    return [...events].sort((left, right) => (right.created_at ?? 0) - (left.created_at ?? 0));
  }

  async publishEvent(kind: number, tags: string[][], content: unknown): Promise<string> {
    const ndk = await this.ensureNdk();

    if (!ndk.signer || !ndk.activeUser) {
      throw new Error('NIP-07 authentication is required before publishing.');
    }

    const { NDKEvent } = await this.ndkModulePromise;
    const event = new NDKEvent(ndk);
    event.kind = kind;
    event.tags = tags as never;
    event.content = typeof content === 'string' ? content : JSON.stringify(content);
    event.created_at = Math.floor(Date.now() / 1000);

    await event.publish();
    return event.id;
  }

  async sendDirectMessage(recipientPubkey: string, message: string): Promise<string> {
    const ndk = await this.ensureNdk();

    if (!ndk.signer || !ndk.activeUser) {
      throw new Error('Nostr authentication is required before sending a DM.');
    }

    const normalizedRecipientPubkey = normalizeHexPubkey(recipientPubkey);
    if (!normalizedRecipientPubkey) {
      throw new Error('Invalid recipient pubkey.');
    }

    const messageContent = message.trim();
    if (!messageContent) {
      throw new Error('DM content cannot be empty.');
    }

    const { NDKEvent } = await this.ndkModulePromise;
    const event = new NDKEvent(ndk);
    event.kind = 4;
    event.tags = [['p', normalizedRecipientPubkey]] as never;
    event.content = messageContent;
    event.created_at = Math.floor(Date.now() / 1000);

    const recipient = ndk.getUser({ pubkey: normalizedRecipientPubkey });
    await event.encrypt(recipient, ndk.signer, 'nip04');
    await event.publish();

    return event.id;
  }

  async getHttpAuthSigner(): Promise<ConnectionSigner> {
    const ndk = await this.ensureNdk();

    if (!ndk.signer || !ndk.activeUser) {
      throw new Error('Nostr authentication is required before signing API requests.');
    }

    return new NdkConnectionSignerAdapter(ndk, this.ndkModulePromise);
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
      explicitRelayUrls: [...DEFAULT_RELAY_URLS],
    });

    await ndk.connect(2000);
    return ndk;
  }

  private async applySigner(signer: NDKSigner, user: NDKUser): Promise<SessionUser> {
    const ndk = await this.ensureNdk();
    ndk.signer = signer;
    ndk.activeUser = user;

    const profile = await user.fetchProfile().catch(() => null);
    return this.toSessionUser(user.pubkey, user.npub, profile);
  }

  private toSessionUser(pubkey: string, npub: string, profile: NDKUserProfile | null): SessionUser {
    const displayName =
      profile?.displayName?.trim() || profile?.name?.trim() || `${npub.slice(0, 12)}...`;

    return {
      pubkey,
      npub,
      displayName,
      imageUrl: profile?.picture ?? profile?.image ?? null,
      description: profile?.about?.trim() || null,
      nip05: profile?.nip05 ?? null,
    };
  }
}

const HTTP_AUTH_CAPABILITIES: readonly ConnectionCapability[] = ['sign-event', 'nip98-auth'];

class NdkConnectionSignerAdapter implements ConnectionSigner {
  constructor(
    private readonly ndk: NDK,
    private readonly ndkModulePromise: Promise<typeof import('@nostr-dev-kit/ndk')>
  ) {}

  async getPublicKey(): Promise<string> {
    const pubkey = this.ndk.activeUser?.pubkey;
    const normalizedPubkey = pubkey ? normalizeHexPubkey(pubkey) : null;

    if (!normalizedPubkey) {
      throw new ConnectionDomainError(
        'validation_failed',
        'Active signer returned an invalid hex pubkey.'
      );
    }

    return normalizedPubkey;
  }

  async signEvent(event: UnsignedNostrEvent): Promise<SignedNostrEvent> {
    const ndkSigner = this.ndk.signer;
    if (!ndkSigner) {
      throw new ConnectionDomainError(
        'no_active_connection',
        'A signer is required before signing HTTP auth events.'
      );
    }

    const { NDKEvent } = await this.ndkModulePromise;
    const ndkEvent = new NDKEvent(this.ndk);
    ndkEvent.kind = event.kind;
    ndkEvent.tags = event.tags as never;
    ndkEvent.content = event.content;
    ndkEvent.created_at = event.created_at;

    await ndkEvent.sign(ndkSigner as NDKSigner);

    return ndkEvent.rawEvent() as SignedNostrEvent;
  }

  supports(capability: ConnectionCapability): boolean {
    return HTTP_AUTH_CAPABILITIES.includes(capability);
  }
}

export function normalizeHexPubkey(pubkey: string): string | null {
  const trimmedPubkey = pubkey.trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(trimmedPubkey) ? trimmedPubkey : null;
}
