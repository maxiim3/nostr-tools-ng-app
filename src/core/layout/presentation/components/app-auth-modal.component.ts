import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import QRCode from 'qrcode';

import { NostrSessionService } from '../../../nostr/application/nostr-session.service';
import type { AuthSessionState } from '../../../nostr-connection/domain/auth-session-state';
import type { ConnectionMethodId } from '../../../nostr-connection/domain/connection-method-id';

@Component({
  selector: 'app-auth-modal',
  imports: [ReactiveFormsModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (session.authModalOpen()) {
      <dialog
        class="modal modal-open"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
      >
        <div
          class="modal-box max-w-lg bg-white px-5 pt-8 pb-6 sm:px-8 sm:pt-10 md:px-12 md:pt-12 md:pb-8"
        >
          <div class="space-y-6">
            <div class="space-y-2">
              <h2 id="auth-modal-title" class="text-2xl font-extrabold text-[#0a0a0a] sm:text-3xl">
                {{ 'authModal.title' | transloco }}
              </h2>
              <p id="auth-modal-description" class="text-sm text-[#0a0a0a]/60">
                {{ 'authModal.subtitle' | transloco }}
              </p>
            </div>

            @if (modalStatus(); as status) {
              <div
                class="rounded-box border-[3px] border-[#0a0a0a] bg-[#FFE600]/10 px-4 py-3"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <p class="text-sm font-bold text-[#0a0a0a]">{{ status.titleKey | transloco }}</p>
                <p class="mt-1 text-sm text-[#0a0a0a]/70">{{ status.bodyKey | transloco }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  @if (status.action === 'retry-current') {
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      (click)="retryCurrentMethod()"
                    >
                      {{ 'authModal.status.action.retry' | transloco }}
                    </button>
                  }
                  @if (status.action === 'reconnect') {
                    <button type="button" class="btn btn-secondary btn-sm" (click)="reconnect()">
                      {{ 'authModal.status.action.reconnect' | transloco }}
                    </button>
                  }
                  @if (status.action === 'choose-method') {
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      (click)="chooseAnotherMethod()"
                    >
                      {{ 'authModal.status.action.chooseMethod' | transloco }}
                    </button>
                  }
                </div>
              </div>
            }

            @if (showRawError()) {
              <div
                class="border-[3px] border-error bg-error/10 px-4 py-3 text-sm font-bold text-error"
              >
                {{ session.error() }}
              </div>
            }

            <div class="space-y-6">
              <section class="space-y-3 rounded-box border-[3px] border-[#0a0a0a] p-3">
                <h3 class="font-bold text-[#0a0a0a]">
                  {{ 'authModal.extension.title' | transloco }}
                </h3>
                <p class="text-sm text-[#0a0a0a]/60">
                  {{ 'authModal.extension.body' | transloco }}
                </p>
                <p class="hidden text-xs font-bold text-[#0a0a0a]/70 sm:block">
                  {{ 'authModal.extension.recommendedDesktop' | transloco }}
                </p>
                <button
                  type="button"
                  class="btn btn-primary h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                  [disabled]="!session.extensionAvailable() || session.connecting()"
                  (click)="loginWithExtension()"
                >
                  {{ 'authModal.extension.cta' | transloco }}
                </button>
              </section>

              <hr class="border-[#0a0a0a]" style="border-width: 3px" />

              <section class="space-y-3 rounded-box border-[3px] border-[#0a0a0a] p-3">
                <p class="text-xs font-bold text-[#0a0a0a]/70 sm:hidden">
                  {{ 'authModal.external.recommendedMobile' | transloco }}
                </p>
                <h3 class="font-bold text-[#0a0a0a]">
                  {{ 'authModal.external.title' | transloco }}
                </h3>
                <p class="text-sm text-[#0a0a0a]/60">
                  {{ 'authModal.external.body' | transloco }}
                </p>

                @if (session.externalAuthUri() || session.externalAuthTimedOut()) {
                  <div class="space-y-3">
                    @if (session.externalAuthUri()) {
                      <a
                        [href]="session.externalAuthUri()!"
                        class="btn btn-outline h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                        rel="noopener noreferrer"
                      >
                        {{ 'authModal.external.open' | transloco }}
                      </a>
                      <button
                        type="button"
                        class="btn btn-secondary h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                        (click)="copyUri()"
                      >
                        {{
                          (copied() ? 'authModal.external.copied' : 'authModal.external.copy')
                            | transloco
                        }}
                      </button>
                      @if (externalAuthQr()) {
                        <div class="flex justify-center">
                          <img
                            [src]="externalAuthQr()!"
                            [attr.alt]="'authModal.external.qrAlt' | transloco"
                            class="border-[3px] border-[#0a0a0a] size-40"
                          />
                        </div>
                      }
                      <p
                        class="break-all border-[3px] border-[#0a0a0a] bg-[#FFE600]/10 px-3 py-2 text-xs text-[#0a0a0a]/70"
                      >
                        {{ session.externalAuthUri() }}
                      </p>
                    }
                    @if (session.waitingForExternalAuth()) {
                      <p class="text-xs font-bold text-[#0a0a0a]/50">
                        {{ 'authModal.external.waiting' | transloco }}
                      </p>
                    }
                    @if (session.externalAuthTimedOut()) {
                      <button
                        type="button"
                        class="btn btn-secondary h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                        (click)="cancelExternalApp(); startExternalApp()"
                      >
                        {{ 'authModal.external.retry' | transloco }}
                      </button>
                    }
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                      (click)="cancelExternalApp()"
                    >
                      {{ 'authModal.external.cancel' | transloco }}
                    </button>
                  </div>
                } @else {
                  <button
                    type="button"
                    class="btn btn-outline h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                    [disabled]="session.connecting()"
                    (click)="startExternalApp()"
                  >
                    {{ 'authModal.external.cta' | transloco }}
                  </button>
                }
              </section>

              <hr class="border-[#0a0a0a]" style="border-width: 3px" />

              <section class="space-y-3">
                <button
                  type="button"
                  class="btn btn-outline h-auto w-full px-4 py-3 text-sm whitespace-normal text-left sm:text-base"
                  [attr.aria-expanded]="advancedVisible()"
                  aria-controls="auth-modal-advanced-options"
                  (click)="toggleAdvancedOptions()"
                >
                  {{
                    (advancedVisible() ? 'authModal.advanced.hide' : 'authModal.advanced.show')
                      | transloco
                  }}
                </button>
                <p class="text-xs font-bold text-[#0a0a0a]/60">
                  {{ 'authModal.advanced.description' | transloco }}
                </p>

                <div
                  id="auth-modal-advanced-options"
                  class="space-y-6 rounded-box border-[3px] border-[#0a0a0a] p-3"
                  [hidden]="!advancedVisible()"
                >
                  <section class="space-y-3">
                    <h3 class="font-bold text-[#0a0a0a]">
                      {{ 'authModal.bunker.title' | transloco }}
                    </h3>
                    <p class="text-sm text-[#0a0a0a]/60">
                      {{ 'authModal.bunker.body' | transloco }}
                    </p>

                    @if (session.waitingForBunkerAuth() || session.bunkerAuthTimedOut()) {
                      @if (session.waitingForBunkerAuth()) {
                        <p class="text-xs font-bold text-[#0a0a0a]/50">
                          {{ 'authModal.bunker.waiting' | transloco }}
                        </p>
                      }
                      @if (session.bunkerAuthTimedOut()) {
                        <button
                          type="button"
                          class="btn btn-secondary h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                          (click)="cancelBunker({ clearToken: false }); retryCurrentMethod()"
                        >
                          {{ 'authModal.bunker.retry' | transloco }}
                        </button>
                      }
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                        (click)="cancelBunker()"
                      >
                        {{ 'authModal.bunker.cancel' | transloco }}
                      </button>
                    } @else {
                      <div class="flex gap-2">
                        <input
                          class="input flex-1"
                          [formControl]="bunkerTokenControl"
                          type="text"
                          placeholder="bunker://..."
                          [attr.aria-label]="'authModal.bunker.inputLabel' | transloco"
                        />
                        <button
                          type="button"
                          class="btn btn-outline flex-shrink-0 text-sm sm:text-base"
                          [disabled]="session.connecting() || bunkerTokenControl.invalid"
                          (click)="submitBunker()"
                        >
                          {{ 'authModal.bunker.cta' | transloco }}
                        </button>
                      </div>
                    }
                  </section>

                  <hr class="border-[#0a0a0a]" style="border-width: 3px" />

                  <section class="space-y-3">
                    <h3 class="font-bold text-[#0a0a0a]">
                      {{ 'authModal.privateKey.title' | transloco }}
                    </h3>
                    <div class="flex gap-2">
                      <input
                        class="input flex-1"
                        [formControl]="privateKeyControl"
                        type="password"
                        placeholder="nsec / hex"
                        [attr.aria-label]="'authModal.privateKey.inputLabel' | transloco"
                      />
                      <button
                        type="button"
                        class="btn btn-primary flex-shrink-0 text-sm sm:text-base"
                        [disabled]="session.connecting() || privateKeyControl.invalid"
                        (click)="loginWithPrivateKey()"
                      >
                        {{ 'authModal.privateKey.cta' | transloco }}
                      </button>
                    </div>
                    <p class="text-xs font-bold text-warning">
                      {{ 'authModal.privateKey.warning' | transloco }}
                    </p>
                  </section>
                </div>
              </section>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn btn-ghost" (click)="close()">
              {{ 'common.close' | transloco }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" (click)="close()">close</button>
        </form>
      </dialog>
    }
  `,
})
export class AppAuthModalComponent {
  protected readonly session = inject(NostrSessionService);
  protected readonly privateKeyControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly bunkerTokenControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly copied = signal(false);
  protected readonly externalAuthQr = signal<string | null>(null);
  protected readonly advancedOptionsOpen = signal(false);
  private readonly lastAttemptedMethod = signal<AuthRetryMethod | null>(null);
  private readonly lastBunkerToken = signal('');
  protected readonly modalStatus = computed(() =>
    resolveModalStatus(this.session.authSessionState())
  );
  protected readonly showRawError = computed(
    () => this.session.error() !== null && this.modalStatus() === null
  );
  private externalAuthQrRequestId = 0;

  constructor() {
    effect(() => {
      void this.syncExternalAuthQr(this.session.externalAuthUri());
    });
  }

  protected close(): void {
    this.privateKeyControl.setValue('');
    this.privateKeyControl.markAsPristine();
    this.bunkerTokenControl.setValue('');
    this.bunkerTokenControl.markAsPristine();
    this.copied.set(false);
    this.externalAuthQr.set(null);
    this.advancedOptionsOpen.set(false);
    this.lastBunkerToken.set('');

    if (this.session.externalAuthUri() || this.session.waitingForExternalAuth()) {
      this.session.cancelExternalAppLogin();
    }

    if (this.session.waitingForBunkerAuth()) {
      this.session.cancelBunkerLogin();
    }

    this.session.closeAuthModal();
  }

  protected toggleAdvancedOptions(): void {
    this.advancedOptionsOpen.update((open) => !open);
  }

  protected advancedVisible(): boolean {
    return (
      this.advancedOptionsOpen() ||
      this.session.waitingForBunkerAuth() ||
      this.session.bunkerAuthTimedOut()
    );
  }

  protected async loginWithExtension(): Promise<void> {
    this.lastAttemptedMethod.set('nip07');
    await this.session.connectWithExtension();
    this.privateKeyControl.setValue('');
    this.privateKeyControl.markAsPristine();
  }

  protected async loginWithPrivateKey(): Promise<void> {
    await this.session.connectWithPrivateKey(this.privateKeyControl.getRawValue());
    this.privateKeyControl.setValue('');
    this.privateKeyControl.markAsPristine();
  }

  protected async startExternalApp(): Promise<void> {
    this.lastAttemptedMethod.set('nip46-nostrconnect');
    const uri = await this.session.beginExternalAppLogin();
    this.copied.set(false);

    if (!uri) {
      return;
    }

    this.openExternalUri(uri);
  }

  protected cancelExternalApp(): void {
    this.copied.set(false);
    this.externalAuthQr.set(null);
    this.session.cancelExternalAppLogin();
  }

  protected async submitBunker(): Promise<void> {
    const token = this.bunkerTokenControl.getRawValue();
    this.lastAttemptedMethod.set('nip46-bunker');
    this.lastBunkerToken.set(token);
    this.bunkerTokenControl.setValue('');
    this.bunkerTokenControl.markAsPristine();
    await this.session.beginBunkerLogin(token);
  }

  protected cancelBunker(options: { clearToken?: boolean } = { clearToken: true }): void {
    if (options.clearToken !== false) {
      this.lastBunkerToken.set('');
    }
    this.bunkerTokenControl.setValue('');
    this.bunkerTokenControl.markAsPristine();
    this.session.cancelBunkerLogin();
  }

  protected async chooseAnotherMethod(): Promise<void> {
    const state = this.session.authSessionState();

    if (this.session.waitingForExternalAuth() || this.session.externalAuthUri()) {
      this.cancelExternalApp();
    }

    if (this.session.waitingForBunkerAuth()) {
      this.cancelBunker({ clearToken: true });
    }

    if (state.status === 'awaitingPermission' && state.methodId === 'nip07') {
      await this.session.disconnect();
    }

    this.copied.set(false);
    this.externalAuthQr.set(null);
  }

  protected async reconnect(): Promise<void> {
    await this.session.disconnect();
  }

  protected async retryCurrentMethod(): Promise<void> {
    const state = this.session.authSessionState();
    if (state.status === 'timedOut' || state.status === 'cancelled') {
      await this.retryMethod(state.methodId);
      return;
    }

    if (state.status === 'recoverableRetry' && state.reasonCode === 'user_rejected') {
      await this.retryMethod(this.lastAttemptedMethod());
      return;
    }

    if (state.status === 'recoverableRetry') {
      if (this.session.waitingForExternalAuth() || this.session.externalAuthUri()) {
        await this.startExternalApp();
      }
    }
  }

  private async retryMethod(methodId: ConnectionMethodId | null): Promise<void> {
    if (methodId === 'nip07') {
      await this.loginWithExtension();
      return;
    }

    if (methodId === 'nip46-nostrconnect') {
      await this.startExternalApp();
      return;
    }

    if (methodId === 'nip46-bunker') {
      const token = this.lastBunkerToken();
      if (!token) {
        return;
      }

      this.lastAttemptedMethod.set('nip46-bunker');
      await this.session.beginBunkerLogin(token);
    }
  }

  protected copyUri(): void {
    const uri = this.session.externalAuthUri();
    if (uri) {
      navigator.clipboard
        .writeText(uri)
        .then(() => {
          this.copied.set(true);
          setTimeout(() => this.copied.set(false), 2000);
        })
        .catch((err) => console.error('Failed to copy URI', err));
    }
  }

  private openExternalUri(uri: string): void {
    if (typeof globalThis.location === 'undefined') {
      return;
    }

    globalThis.location.href = uri;
  }

  private async syncExternalAuthQr(uri: string | null): Promise<void> {
    const requestId = ++this.externalAuthQrRequestId;

    if (!uri) {
      this.externalAuthQr.set(null);
      return;
    }

    const qr = await QRCode.toDataURL(uri, { width: 192, margin: 2 }).catch(() => null);
    if (requestId !== this.externalAuthQrRequestId) {
      return;
    }

    this.externalAuthQr.set(qr);
  }
}

type ModalStatusAction = 'retry-current' | 'reconnect' | 'choose-method';
type AuthRetryMethod = 'nip07' | 'nip46-nostrconnect' | 'nip46-bunker';

interface ModalStatus {
  titleKey: string;
  bodyKey: string;
  action: ModalStatusAction;
}

function resolveModalStatus(state: AuthSessionState): ModalStatus | null {
  if (state.status === 'awaitingPermission' && state.methodId === 'nip07') {
    return {
      titleKey: 'authModal.status.pending.extension.title',
      bodyKey: 'authModal.status.pending.extension.body',
      action: 'choose-method',
    };
  }

  if (state.status === 'awaitingExternalSignerApproval') {
    return {
      titleKey: 'authModal.status.pending.external.title',
      bodyKey: 'authModal.status.pending.external.body',
      action: 'choose-method',
    };
  }

  if (state.status === 'awaitingBunkerApproval') {
    return {
      titleKey: 'authModal.status.pending.bunker.title',
      bodyKey: 'authModal.status.pending.bunker.body',
      action: 'choose-method',
    };
  }

  if (state.status === 'timedOut') {
    return {
      titleKey: 'authModal.status.recovery.timeout.title',
      bodyKey: 'authModal.status.recovery.timeout.body',
      action: 'retry-current',
    };
  }

  if (state.status === 'cancelled') {
    return {
      titleKey: 'authModal.status.recovery.cancelled.title',
      bodyKey: 'authModal.status.recovery.cancelled.body',
      action: 'retry-current',
    };
  }

  if (state.status === 'recoverableRetry' && state.reasonCode === 'user_rejected') {
    return {
      titleKey: 'authModal.status.recovery.denied.title',
      bodyKey: 'authModal.status.recovery.denied.body',
      action: 'retry-current',
    };
  }

  if (state.status === 'expired') {
    return {
      titleKey: 'authModal.status.recovery.expired.title',
      bodyKey: 'authModal.status.recovery.expired.body',
      action: 'reconnect',
    };
  }

  if (state.status === 'revokedOrUnavailable') {
    return {
      titleKey: 'authModal.status.recovery.revokedOrUnavailable.title',
      bodyKey: 'authModal.status.recovery.revokedOrUnavailable.body',
      action: 'reconnect',
    };
  }

  if (state.status === 'recoverableRetry' || state.status === 'failed') {
    return {
      titleKey: 'authModal.status.recovery.generic.title',
      bodyKey: 'authModal.status.recovery.generic.body',
      action: 'choose-method',
    };
  }

  return null;
}
