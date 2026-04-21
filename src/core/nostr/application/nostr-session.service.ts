import { computed, inject, Injectable, signal } from '@angular/core';

import { FRANCOPHONE_PACK } from '../../../features/packs/domain/francophone-pack.config';
import { getNip07Provider } from '../domain/nip07.types';
import { NostrClientService, type SessionUser } from './nostr-client.service';

@Injectable({ providedIn: 'root' })
export class NostrSessionService {
  private readonly client = inject(NostrClientService);
  private currentExternalAttemptId = 0;
  private readonly EXTERNAL_AUTH_TIMEOUT_MS = 120000;
  private externalAuthTimeout?: ReturnType<typeof setTimeout>;

  readonly user = signal<SessionUser | null>(null);
  readonly connecting = signal(false);
  readonly error = signal<string | null>(null);
  readonly authModalOpen = signal(false);
  readonly extensionAvailable = signal(false);
  readonly externalAuthUri = signal<string | null>(null);
  readonly waitingForExternalAuth = signal(false);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => {
    const currentUser = this.user();
    return currentUser
      ? FRANCOPHONE_PACK.adminNpubs.some((npub) => npub === currentUser.npub)
      : false;
  });

  constructor() {
    this.refreshAvailability();
  }

  refreshAvailability(): void {
    this.extensionAvailable.set(getNip07Provider() !== null);
  }

  openAuthModal(): void {
    this.refreshAvailability();
    this.error.set(null);
    this.authModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.authModalOpen.set(false);
  }

  async connectWithExtension(): Promise<boolean> {
    this.refreshAvailability();

    if (!this.extensionAvailable()) {
      this.error.set('NIP-07 extension not found.');
      return false;
    }

    this.connecting.set(true);
    this.error.set(null);

    try {
      const sessionUser = await this.client.connectWithExtension();
      this.user.set(sessionUser);
      this.authModalOpen.set(false);
      return true;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to connect with Nostr.');
      return false;
    } finally {
      this.connecting.set(false);
    }
  }

  async connectWithPrivateKey(privateKeyOrNsec: string): Promise<boolean> {
    this.connecting.set(true);
    this.error.set(null);

    try {
      const sessionUser = await this.client.connectWithPrivateKey(privateKeyOrNsec);
      this.user.set(sessionUser);
      this.authModalOpen.set(false);
      return true;
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Unable to connect with the provided private key.'
      );
      return false;
    } finally {
      this.connecting.set(false);
    }
  }

  async beginExternalAppLogin(): Promise<string | null> {
    this.connecting.set(true);
    this.error.set(null);
    this.currentExternalAttemptId++;
    const attemptId = this.currentExternalAttemptId;

    try {
      const uri = await this.client.beginExternalAppLogin();
      this.externalAuthUri.set(uri);
      this.waitingForExternalAuth.set(true);
      void this.finishExternalAppLogin(attemptId);
      this.externalAuthTimeout = setTimeout(
        () => this.handleExternalAuthTimeout(),
        this.EXTERNAL_AUTH_TIMEOUT_MS
      );
      return uri;
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Unable to start external app login.'
      );
      return null;
    } finally {
      this.connecting.set(false);
    }
  }

  cancelExternalAppLogin(): void {
    this.client.cancelExternalAppLogin();
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
    this.currentExternalAttemptId++;
    if (this.externalAuthTimeout) {
      clearTimeout(this.externalAuthTimeout);
      this.externalAuthTimeout = undefined;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.clearSigner();
    this.user.set(null);
    this.error.set(null);
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
    this.refreshAvailability();
  }

  private async finishExternalAppLogin(attemptId: number): Promise<void> {
    if (attemptId !== this.currentExternalAttemptId) {
      return;
    }

    try {
      const sessionUser = await this.client.completeExternalAppLogin();
      this.user.set(sessionUser);
      this.authModalOpen.set(false);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'External app login failed.');
    } finally {
      this.externalAuthUri.set(null);
      this.waitingForExternalAuth.set(false);
      if (this.externalAuthTimeout) {
        clearTimeout(this.externalAuthTimeout);
        this.externalAuthTimeout = undefined;
      }
    }
  }

  private handleExternalAuthTimeout(): void {
    this.waitingForExternalAuth.set(false);
    this.error.set('External app login timed out. Please try again.');
    this.client.cancelExternalAppLogin();
  }
}
