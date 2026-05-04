import { computed, inject, Injectable, signal } from '@angular/core';
import type { NDKSigner } from '@nostr-dev-kit/ndk';

import { FRANCOPHONE_PACK } from '../../../features/packs/domain/francophone-pack.config';
import { NostrConnectionFacadeService } from '../../nostr-connection/application/connection-facade';
import type {
  ConnectionAttempt,
  ConnectionAttemptInstructions,
} from '../../nostr-connection/domain/connection-attempt';
import type { ConnectionSession } from '../../nostr-connection/domain/connection-session';
import {
  isAuthSessionConnected,
  type AuthSessionState,
} from '../../nostr-connection/domain/auth-session-state';
import { NostrClientService, type SessionUser } from './nostr-client.service';

@Injectable({ providedIn: 'root' })
export class NostrSessionService {
  private readonly facade = inject(NostrConnectionFacadeService);
  private readonly client = inject(NostrClientService);
  private currentExternalAttemptId = 0;
  private currentBunkerAttemptId = 0;
  private currentAuthOperationId = 0;
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
  private readonly privateKeyFallbackActive = signal(false);
  readonly authSessionState = computed(() => this.facade.authSessionState());
  readonly externalAuthTimedOut = computed(() =>
    isTimedOutFor(this.authSessionState(), 'nip46-nostrconnect')
  );
  readonly bunkerAuthTimedOut = computed(() =>
    isTimedOutFor(this.authSessionState(), 'nip46-bunker')
  );
  readonly isAuthenticated = computed(
    () => isAuthSessionConnected(this.authSessionState()) || this.privateKeyFallbackActive()
  );
  readonly isAdmin = computed(() => {
    const currentUser = this.user();
    return currentUser
      ? FRANCOPHONE_PACK.adminNpubs.some((npub) => npub === currentUser.npub)
      : false;
  });

  constructor() {
    void this.initializeSession();
  }

  private async initializeSession(): Promise<void> {
    this.refreshAvailability();

    if (!this.facade.hasRestoreContext()) {
      return;
    }

    const operationId = ++this.currentAuthOperationId;
    const restoredSession = await this.facade.restoreSessionFromStoredContext();
    if (operationId !== this.currentAuthOperationId) {
      return;
    }

    if (!restoredSession) {
      this.user.set(null);
      return;
    }

    await this.applySessionForDisplay(restoredSession, operationId, {
      tolerateProfileFailure: true,
    });
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
    const operationId = ++this.currentAuthOperationId;
    const methods = await this.facade.refreshAvailableMethods();
    this.extensionAvailable.set(methods.includes('nip07'));

    if (!this.extensionAvailable()) {
      this.error.set('NIP-07 extension not found.');
      return false;
    }

    try {
      await this.facade.startConnection('nip07', { reason: 'interactive-login' });
      const session = await this.facade.completeCurrentAttempt();
      if (operationId !== this.currentAuthOperationId) {
        await this.clearStaleFacadeSession(session);
        return false;
      }

      await this.applySessionForDisplay(session, operationId);
      this.privateKeyFallbackActive.set(false);
      this.authModalOpen.set(false);
      this.clearExternalInstructionsSubscription();
      this.externalAuthUri.set(null);
      this.waitingForExternalAuth.set(false);
      this.cancelExternalTimer();
      return true;
    } catch (err) {
      if (operationId !== this.currentAuthOperationId) {
        return false;
      }

      if (this.facade.isAuthenticated()) {
        await this.facade.disconnect().catch(() => undefined);
      }
      await this.client.clearSigner().catch(() => undefined);
      this.privateKeyFallbackActive.set(false);
      this.error.set(err instanceof Error ? err.message : 'Unable to connect with Nostr.');
      return false;
    }
  }

  async connectWithPrivateKey(privateKeyOrNsec: string): Promise<boolean> {
    this.currentAuthOperationId++;
    this.currentExternalAttemptId++;
    this.currentBunkerAttemptId++;
    this.clearExternalInstructionsSubscription();
    this.cancelExternalTimer();
    this.cancelBunkerTimer();
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
    this.waitingForBunkerAuth.set(false);
    await this.facade.disconnect().catch(() => undefined);
    await this.client.clearSigner().catch(() => undefined);

    try {
      const sessionUser = await this.client.connectWithPrivateKey(privateKeyOrNsec);
      this.user.set(sessionUser);
      this.privateKeyFallbackActive.set(true);
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
    this.currentAuthOperationId++;
    this.error.set(null);
    this.facade.clearError();
    this.cancelBunkerTimer();
    this.waitingForBunkerAuth.set(false);
    this.currentBunkerAttemptId++;
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
    this.currentAuthOperationId++;
    void this.facade.cancelCurrentAttempt().catch(() => undefined);
    this.clearExternalInstructionsSubscription();
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
    this.currentExternalAttemptId++;
    this.cancelExternalTimer();
  }

  async beginBunkerLogin(connectionToken: string): Promise<boolean> {
    this.currentAuthOperationId++;
    this.error.set(null);
    this.facade.clearError();
    this.currentExternalAttemptId++;
    this.clearExternalInstructionsSubscription();
    this.cancelExternalTimer();
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
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
    this.cancelBunkerTimer();
  }

  async disconnect(): Promise<void> {
    this.currentAuthOperationId++;
    this.currentExternalAttemptId++;
    this.currentBunkerAttemptId++;
    this.clearExternalInstructionsSubscription();
    this.cancelExternalTimer();
    this.cancelBunkerTimer();

    await this.facade.disconnect();
    await this.client.clearSigner();
    this.user.set(null);
    this.privateKeyFallbackActive.set(false);
    this.error.set(null);
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
    this.waitingForBunkerAuth.set(false);
    this.refreshAvailability();
  }

  private async finishExternalAppLogin(attemptId: number): Promise<void> {
    const operationId = ++this.currentAuthOperationId;
    if (attemptId !== this.currentExternalAttemptId) {
      return;
    }

    try {
      const session = await this.facade.completeCurrentAttempt();
      if (attemptId !== this.currentExternalAttemptId) {
        return;
      }

      this.clearExternalInstructionsSubscription();
      this.externalAuthUri.set(null);
      this.waitingForExternalAuth.set(false);
      this.cancelExternalTimer();
      await this.applySessionForDisplay(session, operationId);
      if (
        attemptId !== this.currentExternalAttemptId ||
        operationId !== this.currentAuthOperationId
      ) {
        return;
      }

      this.privateKeyFallbackActive.set(false);
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
        this.cancelExternalTimer();
      }
    }
  }

  private handleExternalAuthTimeout(attemptId: number): void {
    if (attemptId !== this.currentExternalAttemptId) {
      return;
    }

    this.currentExternalAttemptId++;
    this.currentAuthOperationId++;
    this.clearExternalInstructionsSubscription();
    this.externalAuthUri.set(null);
    this.waitingForExternalAuth.set(false);
    this.cancelExternalTimer();
    this.error.set('External app login timed out. Please try again.');
    void this.facade
      .cancelCurrentAttempt({ reason: 'timedOut', attemptId: this.facade.getCurrentAttemptId() })
      .catch(() => undefined);
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
    const operationId = ++this.currentAuthOperationId;
    if (attemptId !== this.currentBunkerAttemptId) {
      return;
    }

    try {
      const session = await this.facade.completeCurrentAttempt();
      if (attemptId !== this.currentBunkerAttemptId) {
        return;
      }

      this.waitingForBunkerAuth.set(false);
      this.cancelBunkerTimer();
      await this.applySessionForDisplay(session, operationId);
      this.privateKeyFallbackActive.set(false);
      this.authModalOpen.set(false);
    } catch (err) {
      if (attemptId !== this.currentBunkerAttemptId) {
        return;
      }
      this.error.set(err instanceof Error ? err.message : 'Bunker login failed.');
    } finally {
      if (attemptId === this.currentBunkerAttemptId) {
        this.waitingForBunkerAuth.set(false);
        this.cancelBunkerTimer();
      }
    }
  }

  private handleBunkerAuthTimeout(attemptId: number): void {
    if (attemptId !== this.currentBunkerAttemptId) {
      return;
    }

    this.currentBunkerAttemptId++;
    this.waitingForBunkerAuth.set(false);
    this.cancelBunkerTimer();
    this.error.set('Bunker login timed out. Please try again.');
    void this.facade
      .cancelCurrentAttempt({ reason: 'timedOut', attemptId: this.facade.getCurrentAttemptId() })
      .catch(() => undefined);
  }

  private cancelExternalTimer(): void {
    if (!this.externalAuthTimeout) {
      return;
    }

    clearTimeout(this.externalAuthTimeout);
    this.externalAuthTimeout = undefined;
  }

  private cancelBunkerTimer(): void {
    if (!this.bunkerAuthTimeout) {
      return;
    }

    clearTimeout(this.bunkerAuthTimeout);
    this.bunkerAuthTimeout = undefined;
  }

  private async applySessionForDisplay(
    session: ConnectionSession,
    operationId: number,
    options: { tolerateProfileFailure?: boolean } = {}
  ): Promise<void> {
    if (operationId !== this.currentAuthOperationId) {
      return;
    }

    if (session.methodId === 'nip07') {
      await this.client.applyNip07Signer(session.pubkeyHex);
    } else {
      const ndkSigner = this.facade.ndkSigner() as NDKSigner | null;
      if (ndkSigner) {
        await this.client.applyNdkSigner(ndkSigner, session.pubkeyHex);
      }
    }

    if (operationId !== this.currentAuthOperationId) {
      if (!this.facade.isAuthenticated() && !this.privateKeyFallbackActive()) {
        await this.client.clearSigner().catch(() => undefined);
      }
      return;
    }

    let profile: SessionUser | null;
    try {
      profile = await this.client.fetchProfile(session.npub);
    } catch (error) {
      if (options.tolerateProfileFailure) {
        profile = null;
      } else {
        throw error;
      }
    }

    if (!profile) {
      return;
    }

    if (operationId !== this.currentAuthOperationId) {
      return;
    }

    this.user.set(profile);
  }

  private async clearStaleFacadeSession(session: ConnectionSession): Promise<void> {
    if (this.facade.currentSession()?.pubkeyHex !== session.pubkeyHex) {
      return;
    }

    await this.facade.disconnect().catch(() => undefined);
  }
}

function resolveExternalAuthUri(instructions: ConnectionAttemptInstructions | null): string | null {
  return instructions?.authUrl ?? instructions?.launchUrl ?? instructions?.copyValue ?? null;
}

function isTimedOutFor(
  state: AuthSessionState,
  methodId: 'nip46-nostrconnect' | 'nip46-bunker'
): boolean {
  return state.status === 'timedOut' && state.methodId === methodId;
}
