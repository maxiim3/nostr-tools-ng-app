import { computed, inject, Injectable, signal } from '@angular/core';
import type { NDKSigner } from '@nostr-dev-kit/ndk';

import { FRANCOPHONE_PACK } from '../../../features/packs/domain/francophone-pack.config';
import { NostrConnectionFacadeService } from '../../nostr-connection/application/connection-facade';
import type {
  ConnectionAttempt,
  ConnectionAttemptInstructions,
} from '../../nostr-connection/domain/connection-attempt';
import { NostrClientService, type SessionUser } from './nostr-client.service';

@Injectable({ providedIn: 'root' })
export class NostrSessionService {
  private readonly facade = inject(NostrConnectionFacadeService);
  private readonly client = inject(NostrClientService);
  private currentExternalAttemptId = 0;
  private currentBunkerAttemptId = 0;
  private readonly AUTH_TIMEOUT_MS = 120000;
  private externalAuthTimeout?: ReturnType<typeof setTimeout>;
  private bunkerAuthTimeout?: ReturnType<typeof setTimeout>;
  private externalInstructionsUnsubscribe?: () => void;

  readonly user = signal<SessionUser | null>(null);
  readonly authModalOpen = signal(false);
  readonly connecting = computed(() => this.facade.pending());
  readonly error = signal<string | null>(null);
  readonly extensionAvailable = signal(false);
  readonly externalAuthUri = signal<string | null>(null);
  readonly waitingForExternalAuth = signal(false);
  readonly waitingForBunkerAuth = signal(false);
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
    void this.facade.refreshAvailableMethods().then(
      (methods) => this.extensionAvailable.set(methods.includes('nip07')),
      () => this.extensionAvailable.set(false)
    );
  }

  openAuthModal(): void {
    this.refreshAvailability();
    this.error.set(null);
    this.facade.clearError();
    this.authModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.authModalOpen.set(false);
  }

  async connectWithExtension(): Promise<boolean> {
    const methods = await this.facade.refreshAvailableMethods();
    this.extensionAvailable.set(methods.includes('nip07'));

    if (!this.extensionAvailable()) {
      this.error.set('NIP-07 extension not found.');
      return false;
    }

    try {
      await this.facade.startConnection('nip07', { reason: 'interactive-login' });
      const session = await this.facade.completeCurrentAttempt();

      if (session.methodId === 'nip07') {
        await this.client.applyNip07Signer(session.pubkeyHex);
      } else {
        const ndkSigner = this.facade.ndkSigner() as NDKSigner | null;
        if (ndkSigner) {
          await this.client.applyNdkSigner(ndkSigner, session.pubkeyHex);
        }
      }

      const profile = await this.client.fetchProfile(session.npub);
      this.user.set(profile);
      this.authModalOpen.set(false);
      return true;
    } catch (err) {
      if (this.facade.isAuthenticated()) {
        await this.facade.disconnect().catch(() => undefined);
      }
      await this.client.clearSigner().catch(() => undefined);
      this.error.set(err instanceof Error ? err.message : 'Unable to connect with Nostr.');
      return false;
    }
  }

  async connectWithPrivateKey(privateKeyOrNsec: string): Promise<boolean> {
    try {
      const sessionUser = await this.client.connectWithPrivateKey(privateKeyOrNsec);
      this.user.set(sessionUser);
      this.authModalOpen.set(false);
      return true;
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'Unable to connect with the provided private key.'
      );
      return false;
    }
  }

  async beginExternalAppLogin(): Promise<string | null> {
    this.error.set(null);
    this.facade.clearError();
    this.currentExternalAttemptId++;
    this.clearExternalInstructionsSubscription();
    const attemptId = this.currentExternalAttemptId;

    try {
      const attempt = await this.facade.startConnection('nip46-nostrconnect', {
        reason: 'interactive-login',
      });

      if (attemptId !== this.currentExternalAttemptId) {
        return null;
      }

      this.bindExternalInstructions(attemptId, attempt);
      const uri = resolveExternalAuthUri(attempt.instructions);
      this.externalAuthUri.set(uri);
      this.waitingForExternalAuth.set(true);
      void this.finishExternalAppLogin(attemptId);
      this.externalAuthTimeout = setTimeout(
        () => this.handleExternalAuthTimeout(attemptId),
        this.AUTH_TIMEOUT_MS
      );
      return uri;
    } catch (err) {
      if (attemptId === this.currentExternalAttemptId) {
        this.error.set(err instanceof Error ? err.message : 'Unable to start external app login.');
      }
      return null;
    }
  }

  cancelExternalAppLogin(): void {
    void this.facade.cancelCurrentAttempt().catch(() => undefined);
    this.clearExternalInstructionsSubscription();
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
    this.currentExternalAttemptId++;
    if (this.externalAuthTimeout) {
      clearTimeout(this.externalAuthTimeout);
      this.externalAuthTimeout = undefined;
    }
  }

  async beginBunkerLogin(connectionToken: string): Promise<boolean> {
    this.error.set(null);
    this.facade.clearError();
    this.currentBunkerAttemptId++;
    const attemptId = this.currentBunkerAttemptId;

    try {
      await this.facade.startConnection('nip46-bunker', {
        reason: 'interactive-login',
        connectionToken,
      });

      if (attemptId !== this.currentBunkerAttemptId) {
        return false;
      }

      this.waitingForBunkerAuth.set(true);
      void this.finishBunkerLogin(attemptId);
      this.bunkerAuthTimeout = setTimeout(
        () => this.handleBunkerAuthTimeout(attemptId),
        this.AUTH_TIMEOUT_MS
      );
      return true;
    } catch (err) {
      if (attemptId === this.currentBunkerAttemptId) {
        this.error.set(err instanceof Error ? err.message : 'Unable to start bunker login.');
      }
      return false;
    }
  }

  cancelBunkerLogin(): void {
    void this.facade.cancelCurrentAttempt().catch(() => undefined);
    this.waitingForBunkerAuth.set(false);
    this.currentBunkerAttemptId++;
    if (this.bunkerAuthTimeout) {
      clearTimeout(this.bunkerAuthTimeout);
      this.bunkerAuthTimeout = undefined;
    }
  }

  async disconnect(): Promise<void> {
    this.currentExternalAttemptId++;
    this.currentBunkerAttemptId++;
    this.clearExternalInstructionsSubscription();
    if (this.externalAuthTimeout) {
      clearTimeout(this.externalAuthTimeout);
      this.externalAuthTimeout = undefined;
    }
    if (this.bunkerAuthTimeout) {
      clearTimeout(this.bunkerAuthTimeout);
      this.bunkerAuthTimeout = undefined;
    }

    await this.facade.disconnect();
    await this.client.clearSigner();
    this.user.set(null);
    this.error.set(null);
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
    this.waitingForBunkerAuth.set(false);
    this.refreshAvailability();
  }

  private async finishExternalAppLogin(attemptId: number): Promise<void> {
    if (attemptId !== this.currentExternalAttemptId) {
      return;
    }

    try {
      const session = await this.facade.completeCurrentAttempt();
      if (attemptId !== this.currentExternalAttemptId) {
        return;
      }

      const ndkSigner = this.facade.ndkSigner() as NDKSigner | null;
      if (ndkSigner) {
        await this.client.applyNdkSigner(ndkSigner, session.pubkeyHex);
      }

      const profile = await this.client.fetchProfile(session.npub);
      if (attemptId !== this.currentExternalAttemptId) {
        return;
      }
      this.user.set(profile);
      this.authModalOpen.set(false);
    } catch (err) {
      if (attemptId !== this.currentExternalAttemptId) {
        return;
      }
      this.error.set(err instanceof Error ? err.message : 'External app login failed.');
    } finally {
      if (attemptId === this.currentExternalAttemptId) {
        this.clearExternalInstructionsSubscription();
        this.externalAuthUri.set(null);
        this.waitingForExternalAuth.set(false);
        if (this.externalAuthTimeout) {
          clearTimeout(this.externalAuthTimeout);
          this.externalAuthTimeout = undefined;
        }
      }
    }
  }

  private handleExternalAuthTimeout(attemptId: number): void {
    if (attemptId !== this.currentExternalAttemptId) {
      return;
    }

    this.currentExternalAttemptId++;
    this.clearExternalInstructionsSubscription();
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
    if (this.externalAuthTimeout) {
      clearTimeout(this.externalAuthTimeout);
      this.externalAuthTimeout = undefined;
    }
    this.error.set('External app login timed out. Please try again.');
    void this.facade.cancelCurrentAttempt().catch(() => undefined);
  }

  private bindExternalInstructions(attemptId: number, attempt: ConnectionAttempt): void {
    this.clearExternalInstructionsSubscription();

    this.externalInstructionsUnsubscribe = attempt.onInstructionsChange((instructions) => {
      if (attemptId !== this.currentExternalAttemptId) {
        return;
      }

      this.externalAuthUri.set(resolveExternalAuthUri(instructions));
    });
  }

  private clearExternalInstructionsSubscription(): void {
    if (!this.externalInstructionsUnsubscribe) {
      return;
    }

    this.externalInstructionsUnsubscribe();
    this.externalInstructionsUnsubscribe = undefined;
  }

  private async finishBunkerLogin(attemptId: number): Promise<void> {
    if (attemptId !== this.currentBunkerAttemptId) {
      return;
    }

    try {
      const session = await this.facade.completeCurrentAttempt();
      if (attemptId !== this.currentBunkerAttemptId) {
        return;
      }

      const ndkSigner = this.facade.ndkSigner() as NDKSigner | null;
      if (ndkSigner) {
        await this.client.applyNdkSigner(ndkSigner, session.pubkeyHex);
      }

      const profile = await this.client.fetchProfile(session.npub);
      if (attemptId !== this.currentBunkerAttemptId) {
        return;
      }
      this.user.set(profile);
      this.authModalOpen.set(false);
    } catch (err) {
      if (attemptId !== this.currentBunkerAttemptId) {
        return;
      }
      this.error.set(err instanceof Error ? err.message : 'Bunker login failed.');
    } finally {
      if (attemptId === this.currentBunkerAttemptId) {
        this.waitingForBunkerAuth.set(false);
        if (this.bunkerAuthTimeout) {
          clearTimeout(this.bunkerAuthTimeout);
          this.bunkerAuthTimeout = undefined;
        }
      }
    }
  }

  private handleBunkerAuthTimeout(attemptId: number): void {
    if (attemptId !== this.currentBunkerAttemptId) {
      return;
    }

    this.currentBunkerAttemptId++;
    this.waitingForBunkerAuth.set(false);
    if (this.bunkerAuthTimeout) {
      clearTimeout(this.bunkerAuthTimeout);
      this.bunkerAuthTimeout = undefined;
    }
    this.error.set('Bunker login timed out. Please try again.');
    void this.facade.cancelCurrentAttempt().catch(() => undefined);
  }
}

function resolveExternalAuthUri(instructions: ConnectionAttemptInstructions | null): string | null {
  return instructions?.authUrl ?? instructions?.launchUrl ?? instructions?.copyValue ?? null;
}
