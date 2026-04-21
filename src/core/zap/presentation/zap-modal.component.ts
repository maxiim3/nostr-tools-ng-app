import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject, debounceTime, takeUntil } from 'rxjs';

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
        <div class="modal-box max-w-md bg-white px-8 pt-10 pb-6">
          <div class="space-y-6">
            <h2 class="text-2xl font-extrabold text-[#0a0a0a]">
              {{ 'zap.authRequired.title' | transloco }}
            </h2>

            <button type="button" class="btn btn-primary gap-2" (click)="openAuthModal()">
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
        <div class="modal-box max-w-md bg-white px-8 pt-10 pb-6">
          @if (zap.zapStatus() === 'submitting') {
            <div class="flex flex-col items-center gap-4 py-12 text-center">
              <span class="loading loading-spinner loading-lg text-[#0a0a0a]"></span>
              <p class="text-[#0a0a0a]/70">
                {{ 'zap.modal.processing' | transloco }}
              </p>
            </div>
          } @else if (zap.zapStatus() === 'success') {
            <div class="flex flex-col items-center gap-4 py-12 text-center">
              <span class="text-6xl" aria-hidden="true">🫶</span>
              <p class="font-bold text-[#0a0a0a]">
                {{ 'zap.modal.success' | transloco }}
              </p>
            </div>
          } @else if (zap.zapStatus() === 'error') {
            <div class="flex flex-col items-center gap-4 py-12 text-center">
              <span class="text-6xl" aria-hidden="true">❌</span>
              <p class="font-bold text-[#0a0a0a]">
                {{ 'zap.modal.error' | transloco }}
              </p>
              <button type="button" class="btn btn-outline" (click)="submitZap()">
                {{ 'common.retry' | transloco }}
              </button>
            </div>
          } @else if (zap.invoiceError()) {
            <div class="flex flex-col items-center gap-4 py-8">
              <p class="text-[#0a0a0a]/70">
                {{ 'zap.modal.invoiceError' | transloco }}
              </p>
              <button type="button" class="btn btn-outline" (click)="retry()">
                {{ 'common.retry' | transloco }}
              </button>
            </div>
          } @else {
            <div class="space-y-6">
              <h2 class="text-center text-2xl font-extrabold text-[#0a0a0a]">
                {{ 'zap.modal.title' | transloco }}
              </h2>

              @if (zap.invoiceQr(); as qr) {
                <div class="flex justify-center">
                  <img [src]="qr" alt="Invoice QR" class="border-[3px] border-[#0a0a0a] size-48" />
                </div>
                <p class="text-center text-sm text-[#0a0a0a]/70">
                  {{ 'zap.modal.scanToPay' | transloco }}
                </p>
              } @else {
                <div class="flex justify-center">
                  <div
                    class="flex size-48 items-center justify-center border-[3px] border-[#0a0a0a] bg-[#0a0a0a]/5"
                  >
                    <span class="loading loading-spinner loading-lg text-[#0a0a0a]"></span>
                  </div>
                </div>
              }

              <div class="flex items-center justify-center gap-3">
                @for (preset of presets; track preset.amount) {
                  <button
                    type="button"
                    class="btn btn-sm border-[3px] border-[#0a0a0a] px-5"
                    [class.preset-active]="selectedAmount() === preset.amount"
                    (click)="selectPreset(preset.amount)"
                  >
                    {{ preset.amount }} {{ preset.emoji }}
                  </button>
                }
              </div>

              <div class="form-control">
                <input
                  type="number"
                  class="input w-full text-center text-lg font-bold"
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
                [disabled]="amountControl.invalid || zap.invoiceLoading() || !zap.invoiceQr()"
                (click)="submitZap()"
              >
                {{ 'zap.modal.cta' | transloco: { amount: amountControl.value } }}
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
export class ZapModalComponent implements OnInit, OnDestroy {
  protected readonly zap = inject(ZapService);
  protected readonly presets = PRESETS;
  protected readonly MIN_AMOUNT = 21;
  protected readonly MAX_AMOUNT = 100_000;

  protected readonly selectedAmount = this.zap.selectedAmount;

  protected readonly amountControl = new FormControl(42, {
    nonNullable: true,
    validators: [Validators.min(21), Validators.max(100_000)],
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.amountControl.valueChanges
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe((amount) => {
        if (this.amountControl.invalid) {
          this.zap.clearInvoice();
          return;
        }

        this.zap.setAmount(amount);
        void this.zap.generateInvoice();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected selectPreset(amount: number): void {
    this.zap.setAmount(amount);
    this.amountControl.setValue(amount, { emitEvent: false });
    void this.zap.generateInvoice();
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

  protected retry(): void {
    void this.zap.generateInvoice();
  }

  protected submitZap(): void {
    void this.zap.sendZapEvent();
  }
}
