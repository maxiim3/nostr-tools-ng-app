import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { ZapService } from '../zap.service';

const PRESETS = [
  { amount: 42, emoji: '\u{1FAE1}' },
  { amount: 256, emoji: '\u{1F451}' },
  { amount: 999, emoji: '\u{2764}\u{FE0F}' },
] as const;

@Component({
  selector: 'app-zap-modal',
  imports: [ReactiveFormsModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (zap.authRequiredOpen()) {
      <dialog class="modal modal-open">
        <div
          class="modal-box max-w-md bg-base-100/95 px-8 pt-10 pb-6 backdrop-blur-xl rounded-3xl shadow-2xl border border-base-200/50"
        >
          <div class="space-y-6">
            <h2 class="text-2xl font-bold text-base-content leading-tight">
              {{ 'zap.authRequired.title' | transloco }}
            </h2>

            <button
              type="button"
              class="btn btn-primary gap-2"
              (click)="openAuthModal()"
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                class="size-4"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
              {{ 'common.login' | transloco }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" (click)="closeAuthRequired()">close</button>
        </form>
      </dialog>
    }

    @if (zap.modalOpen()) {
      <dialog class="modal modal-open">
        <div
          class="modal-box max-w-md bg-base-100/95 px-8 pt-10 pb-6 backdrop-blur-xl rounded-3xl shadow-2xl border border-base-200/50"
        >
          @if (zap.loading()) {
            <div class="flex flex-col items-center gap-4 py-8">
              <span class="loading loading-spinner loading-lg text-primary"></span>
              <p class="text-sm text-base-content/70">
                {{ 'zap.modal.loading' | transloco }}
              </p>
            </div>
          } @else if (zap.paymentUri(); as uri) {
            <div class="space-y-6">
              <h2 class="text-2xl font-bold text-base-content leading-tight text-center">
                {{ 'zap.modal.invoiceTitle' | transloco }}
              </h2>

              @if (zap.qrDataUrl(); as qr) {
                <div class="flex justify-center">
                  <img [src]="qr" alt="QR Code" class="rounded-xl" width="280" height="280" />
                </div>
              }

              <div class="flex flex-col gap-2">
                <a
                  [href]="uri"
                  class="btn btn-primary btn-block text-lg"
                >
                  {{ 'zap.modal.openWallet' | transloco }}
                </a>
                <button
                  type="button"
                  class="btn btn-ghost btn-block"
                  (click)="close()"
                >
                  {{ 'common.close' | transloco }}
                </button>
              </div>
            </div>
          } @else {
            <div class="space-y-6">
              <h2 class="text-2xl font-bold text-base-content leading-tight">
                {{ 'zap.modal.title' | transloco }}
              </h2>

              <div class="flex items-center justify-center gap-3">
                @for (preset of presets; track preset.amount) {
                  <button
                    type="button"
                    class="btn btn-sm rounded-full px-5 transition-all"
                    [class.btn-primary]="selectedAmount() === preset.amount"
                    [class.btn-outline]="selectedAmount() !== preset.amount"
                    (click)="selectPreset(preset.amount)"
                  >
                    {{ preset.amount }} {{ preset.emoji }}
                  </button>
                }
              </div>

              <div class="form-control">
                <input
                  type="number"
                  class="input input-bordered w-full text-center text-lg font-semibold"
                  [formControl]="amountControl"
                  [min]="MIN_AMOUNT"
                  [max]="MAX_AMOUNT"
                  aria-label="Zap amount in sats"
                />
                @if (amountControl.errors?.['min'] || amountControl.errors?.['max']) {
                  <label class="label">
                    <span class="label-text-alt text-error">
                      {{ 'zap.modal.validation' | transloco }}
                    </span>
                  </label>
                }
              </div>

              <button
                type="button"
                class="btn btn-primary btn-block text-lg"
                [disabled]="amountControl.invalid"
                (click)="submit()"
              >
                {{ 'zap.modal.cta' | transloco }}
              </button>
            </div>
          }
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" (click)="close()">close</button>
        </form>
      </dialog>
    }
  `,
})
export class ZapModalComponent {
  protected readonly zap = inject(ZapService);
  protected readonly presets = PRESETS;
  protected readonly MIN_AMOUNT = 21;
  protected readonly MAX_AMOUNT = 100_000;

  protected readonly selectedAmount = this.zap.selectedAmount;

  protected readonly amountControl = new FormControl(42, {
    nonNullable: true,
    validators: [Validators.min(21), Validators.max(100_000)],
  });

  protected selectPreset(amount: number): void {
    this.zap.setAmount(amount);
    this.amountControl.setValue(amount);
  }

  protected close(): void {
    this.zap.closeModal();
  }

  protected closeAuthRequired(): void {
    this.zap.closeAuthRequired();
  }

  protected openAuthModal(): void {
    this.zap.openAuthModal();
  }

  protected submit(): void {
    this.zap.setAmount(this.amountControl.value);
    this.zap.submit();
  }
}
