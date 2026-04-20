import { Injectable } from '@angular/core';
import type NDK from '@nostr-dev-kit/ndk';
import type { NDKEvent, NDKFilter, NDKSigner, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';

import { DEFAULT_RELAY_URLS } from '../infrastructure/relay.config';

const EXTERNAL_AUTH_RELAY_URL = 'wss://relay.nsec.app';

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

    this.pendingExternalSigner?.stop();

    const signer = NDKNip46Signer.nostrconnect(ndk, EXTERNAL_AUTH_RELAY_URL);
    this.pendingExternalSigner = signer;

    if (!signer.nostrConnectUri) {
      throw new Error('Unable to create external app login link.');
    }

    return signer.nostrConnectUri;
  }

  async completeExternalAppLogin(): Promise<SessionUser> {
    if (!this.pendingExternalSigner) {
      throw new Error('No external app login is pending.');
    }

    const signer = this.pendingExternalSigner;
    const user = await signer.blockUntilReady();
    this.pendingExternalSigner = null;

    return this.applySigner(signer, user);
  }

  cancelExternalAppLogin(): void {
    this.pendingExternalSigner?.stop();
    this.pendingExternalSigner = null;
  }

  async clearSigner(): Promise<void> {
    const ndk = await this.ensureNdk();
    ndk.signer = undefined;
    ndk.activeUser = undefined;
    this.cancelExternalAppLogin();
  }

  async fetchProfile(identifier: string): Promise<SessionUser> {
    const ndk = await this.ensureNdk();
    const { NDKUser } = await this.ndkModulePromise;
    const user = identifier.startsWith('npub1') ? new NDKUser({ npub: identifier }) : new NDKUser({ pubkey: identifier });
    user.ndk = ndk;

    const profile = await user.fetchProfile().catch(() => null);
    return this.toSessionUser(user.pubkey, user.npub, profile);
  }

  async fetchEvents(filters: NDKFilter | NDKFilter[]): Promise<NDKEvent[]> {
    const ndk = await this.ensureNdk();
    const events = await ndk.fetchEvents(filters);

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
    event.content = JSON.stringify(content);
    event.created_at = Math.floor(Date.now() / 1000);

    await event.publish();
    return event.id;
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
      explicitRelayUrls: [...DEFAULT_RELAY_URLS]
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
    const displayName = profile?.displayName?.trim() || profile?.name?.trim() || `${npub.slice(0, 12)}...`;

    return {
      pubkey,
      npub,
      displayName,
      imageUrl: profile?.picture ?? profile?.image ?? null,
      description: profile?.about?.trim() || null,
      nip05: profile?.nip05 ?? null
    };
  }
}
