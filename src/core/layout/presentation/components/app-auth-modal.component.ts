import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import QRCode from 'qrcode';

import { NostrSessionService } from '../../../nostr/application/nostr-session.service';

@Component({
  selector: 'app-auth-modal',
  imports: [ReactiveFormsModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (session.authModalOpen()) {
      <dialog class="modal modal-open">
        <div
          class="modal-box max-w-lg bg-white px-5 pt-8 pb-6 sm:px-8 sm:pt-10 md:px-12 md:pt-12 md:pb-8"
        >
          <div class="space-y-6">
            <div class="space-y-2">
              <h2 class="text-2xl font-extrabold text-[#0a0a0a] sm:text-3xl">
                {{ 'authModal.title' | transloco }}
              </h2>
              <p class="text-sm text-[#0a0a0a]/60">{{ 'authModal.subtitle' | transloco }}</p>
            </div>

            @if (session.error()) {
              <div
                class="border-[3px] border-error bg-error/10 px-4 py-3 text-sm font-bold text-error"
              >
                {{ session.error() }}
              </div>
            }

            <div class="space-y-6">
              <section class="space-y-3">
                <h3 class="font-bold text-[#0a0a0a]">
                  {{ 'authModal.extension.title' | transloco }}
                </h3>
                <p class="text-sm text-[#0a0a0a]/60">
                  {{ 'authModal.extension.body' | transloco }}
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

              <section class="space-y-3">
                <h3 class="font-bold text-[#0a0a0a]">
                  {{ 'authModal.external.title' | transloco }}
                </h3>
                <p class="text-sm text-[#0a0a0a]/60">
                  {{ 'authModal.external.body' | transloco }}
                </p>

                @if (session.externalAuthUri()) {
                  <div class="space-y-3">
                    <a
                      [href]="session.externalAuthUri()!"
                      class="btn btn-outline h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                      rel="noreferrer"
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
                          alt="Nostr Connect QR code"
                          class="border-[3px] border-[#0a0a0a] size-40"
                        />
                      </div>
                    }
                    <p
                      class="break-all border-[3px] border-[#0a0a0a] bg-[#FFE600]/10 px-3 py-2 text-xs text-[#0a0a0a]/70"
                    >
                      {{ session.externalAuthUri() }}
                    </p>
                    @if (session.waitingForExternalAuth()) {
                      <p class="text-xs font-bold text-[#0a0a0a]/50">
                        {{ 'authModal.external.waiting' | transloco }}
                      </p>
                    }
                    @if (session.error()?.includes('timed out')) {
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
                <h3 class="font-bold text-[#0a0a0a]">
                  {{ 'authModal.bunker.title' | transloco }}
                </h3>
                <p class="text-sm text-[#0a0a0a]/60">
                  {{ 'authModal.bunker.body' | transloco }}
                </p>

                @if (session.waitingForBunkerAuth()) {
                  <p class="text-xs font-bold text-[#0a0a0a]/50">
                    {{ 'authModal.bunker.waiting' | transloco }}
                  </p>
                  @if (session.error()?.includes('timed out')) {
                    <button
                      type="button"
                      class="btn btn-secondary h-auto w-full px-4 py-3 text-sm whitespace-normal text-center sm:text-base sm:whitespace-nowrap"
                      (click)="cancelBunker(); submitBunker()"
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
                      [attr.aria-label]="'authModal.bunker.title' | transloco"
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
                  />
                  <button
                    type="button"
                    class="btn btn-primary flex-shrink-0 text-sm sm:text-base"
                    [disabled]="session.connecting() || privateKeyControl.invalid"
                    (click)="loginWithPrivateKey()"
                  >
                    Go
                  </button>
                </div>
                <p class="text-xs font-bold text-warning">
                  {{ 'authModal.privateKey.warning' | transloco }}
                </p>
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

  protected close(): void {
    this.privateKeyControl.setValue('');
    this.bunkerTokenControl.setValue('');
    this.copied.set(false);
    this.externalAuthQr.set(null);

    if (this.session.externalAuthUri() || this.session.waitingForExternalAuth()) {
      this.session.cancelExternalAppLogin();
    }

    if (this.session.waitingForBunkerAuth()) {
      this.session.cancelBunkerLogin();
    }

    this.session.closeAuthModal();
  }

  protected async loginWithExtension(): Promise<void> {
    await this.session.connectWithExtension();
    this.privateKeyControl.setValue('');
  }

  protected async loginWithPrivateKey(): Promise<void> {
    await this.session.connectWithPrivateKey(this.privateKeyControl.getRawValue());
    this.privateKeyControl.setValue('');
  }

  protected async startExternalApp(): Promise<void> {
    const uri = await this.session.beginExternalAppLogin();
    this.copied.set(false);

    if (!uri) {
      this.externalAuthQr.set(null);
      return;
    }

    const qr = await QRCode.toDataURL(uri, { width: 192, margin: 2 }).catch(() => null);
    this.externalAuthQr.set(qr);
  }

  protected cancelExternalApp(): void {
    this.copied.set(false);
    this.externalAuthQr.set(null);
    this.session.cancelExternalAppLogin();
  }

  protected async submitBunker(): Promise<void> {
    const token = this.bunkerTokenControl.getRawValue();
    this.bunkerTokenControl.setValue('');
    await this.session.beginBunkerLogin(token);
  }

  protected cancelBunker(): void {
    this.bunkerTokenControl.setValue('');
    this.session.cancelBunkerLogin();
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
}
