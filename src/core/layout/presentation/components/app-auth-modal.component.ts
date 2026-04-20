import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { NostrSessionService } from '../../../nostr/application/nostr-session.service';

@Component({
  selector: 'app-auth-modal',
  imports: [ReactiveFormsModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (session.authModalOpen()) {
      <dialog class="modal modal-open">
        <div class="modal-box max-w-2xl">
          <div class="space-y-6">
            <div class="space-y-2">
              <h2 class="text-2xl font-bold text-base-content">{{ 'authModal.title' | transloco }}</h2>
              <p class="text-sm text-base-content/70">{{ 'authModal.subtitle' | transloco }}</p>
            </div>

            @if (session.error()) {
              <div class="rounded-box border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
                {{ session.error() }}
              </div>
            }

            <div class="grid gap-6 md:grid-cols-3">
              <section class="space-y-3 rounded-box border border-base-300 p-4">
                <h3 class="font-bold text-base-content">{{ 'authModal.extension.title' | transloco }}</h3>
                <p class="text-sm text-base-content/70">{{ 'authModal.extension.body' | transloco }}</p>
                <button
                  type="button"
                  class="btn btn-primary w-full"
                  [disabled]="!session.extensionAvailable() || session.connecting()"
                  (click)="loginWithExtension()"
                >
                  {{ 'authModal.extension.cta' | transloco }}
                </button>
              </section>

              <section class="space-y-3 rounded-box border border-base-300 p-4">
                <h3 class="font-bold text-base-content">{{ 'authModal.external.title' | transloco }}</h3>
                <p class="text-sm text-base-content/70">{{ 'authModal.external.body' | transloco }}</p>

                @if (session.externalAuthUri()) {
                  <div class="space-y-3">
                    <a [href]="session.externalAuthUri()!" class="btn btn-outline w-full">{{ 'authModal.external.open' | transloco }}</a>
                    <p class="break-all rounded-box bg-base-200 px-3 py-2 text-xs text-base-content/70">
                      {{ session.externalAuthUri() }}
                    </p>
                    @if (session.waitingForExternalAuth()) {
                      <p class="text-xs font-medium text-base-content/60">{{ 'authModal.external.waiting' | transloco }}</p>
                    }
                    <button type="button" class="btn btn-ghost btn-sm w-full" (click)="cancelExternalApp()">
                      {{ 'authModal.external.cancel' | transloco }}
                    </button>
                  </div>
                } @else {
                  <button type="button" class="btn btn-outline w-full" [disabled]="session.connecting()" (click)="startExternalApp()">
                    {{ 'authModal.external.cta' | transloco }}
                  </button>
                }
              </section>

              <section class="space-y-3 rounded-box border border-base-300 p-4">
                <h3 class="font-bold text-base-content">{{ 'authModal.privateKey.title' | transloco }}</h3>
                <p class="text-sm text-warning-content">{{ 'authModal.privateKey.warning' | transloco }}</p>
                <label class="form-control gap-2">
                  <span class="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">nsec / hex</span>
                  <input class="input input-bordered" [formControl]="privateKeyControl" type="password" />
                </label>
                <button
                  type="button"
                  class="btn btn-outline w-full"
                  [disabled]="session.connecting() || privateKeyControl.invalid"
                  (click)="loginWithPrivateKey()"
                >
                  {{ 'authModal.privateKey.cta' | transloco }}
                </button>
              </section>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" (click)="close()">{{ 'common.close' | transloco }}</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" (click)="close()">close</button>
        </form>
      </dialog>
    }
  `
})
export class AppAuthModalComponent {
  protected readonly session = inject(NostrSessionService);
  protected readonly privateKeyControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required]
  });
  protected readonly copied = signal(false);

  protected close(): void {
    this.privateKeyControl.setValue('');
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

    if (uri && typeof window !== 'undefined') {
      window.location.href = uri;
    }
  }

  protected cancelExternalApp(): void {
    this.session.cancelExternalAppLogin();
  }
}
