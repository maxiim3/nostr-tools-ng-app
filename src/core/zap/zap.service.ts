import { inject, Injectable, signal } from '@angular/core';
import QRCode from 'qrcode';

import { PROJECT_INFO } from '../config/project-info';
import { NostrClientService } from '../nostr/application/nostr-client.service';
import { NostrSessionService } from '../nostr/application/nostr-session.service';

@Injectable({ providedIn: 'root' })
export class ZapService {
  private readonly client = inject(NostrClientService);
  private readonly session = inject(NostrSessionService);

  readonly modalOpen = signal(false);
  readonly authRequiredOpen = signal(false);
  readonly selectedAmount = signal(42);
  readonly loading = signal(false);
  readonly paymentUri = signal<string | null>(null);
  readonly qrDataUrl = signal<string | null>(null);

  openModal(): void {
    if (!this.session.isAuthenticated()) {
      this.authRequiredOpen.set(true);
      return;
    }
    this.resetState();
    this.selectedAmount.set(42);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.resetState();
  }

  closeAuthRequired(): void {
    this.authRequiredOpen.set(false);
  }

  openAuthModal(): void {
    this.authRequiredOpen.set(false);
    this.session.openAuthModal();
  }

  setAmount(amount: number): void {
    this.selectedAmount.set(amount);
  }

  async submit(): Promise<void> {
    const amountMsat = this.selectedAmount() * 1000;
    this.loading.set(true);

    try {
      const pr = await this.fetchInvoice(amountMsat);
      await this.showPaymentUri(`lightning:${pr}`);
    } catch {
      await this.showPaymentUri(
        `lightning:${PROJECT_INFO.zapAddress}?amount=${amountMsat}`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchInvoice(amountMsat: number): Promise<string> {
    const ndk = await this.client.getNdk();
    const { NDKUser, NDKZapper } = await import('@nostr-dev-kit/ndk');

    const targetUser = new NDKUser({ npub: PROJECT_INFO.ownerNpub });
    targetUser.ndk = ndk;

    const invoicePromise = new Promise<string>((resolve, reject) => {
      const zapper = new NDKZapper(targetUser, amountMsat, 'msat', {
        ndk,
        lnPay: async ({ pr }) => {
          resolve(pr);
          return { preimage: '' };
        },
      });

      zapper.zap(['nip57']).catch(reject);
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Zap request timed out')), 15_000),
    );

    return Promise.race([invoicePromise, timeoutPromise]);
  }

  private async showPaymentUri(uri: string): Promise<void> {
    this.paymentUri.set(uri);
    const qr = await QRCode.toDataURL(uri, { width: 280, margin: 2 });
    this.qrDataUrl.set(qr);
  }

  private resetState(): void {
    this.loading.set(false);
    this.paymentUri.set(null);
    this.qrDataUrl.set(null);
  }
}
