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
  readonly invoiceQr = signal<string | null>(null);
  readonly invoiceError = signal(false);

  openModal(): void {
    if (!this.session.isAuthenticated()) {
      this.authRequiredOpen.set(true);
      return;
    }
    this.resetState();
    this.selectedAmount.set(42);
    this.modalOpen.set(true);
    this.generateInvoice();
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
    this.generateInvoice();
  }

  async generateInvoice(): Promise<void> {
    this.invoiceError.set(false);
    try {
      const pr = await this.fetchInvoice(this.selectedAmount() * 1000);
      const invoiceUri = `lightning:${pr}`;
      const qr = await QRCode.toDataURL(invoiceUri, { width: 192, margin: 2 });
      this.invoiceQr.set(qr);
    } catch (err) {
      console.error('Invoice error:', err);
      this.invoiceQr.set(null);
      this.invoiceError.set(true);
    }
  }

  async sendZapEvent(): Promise<void> {
    const ndk = await this.client.getNdk();
    const { NDKUser, NDKZapper } = await import('@nostr-dev-kit/ndk');
    const targetUser = new NDKUser({ npub: PROJECT_INFO.ownerNpub });
    targetUser.ndk = ndk;
    const zapper = new NDKZapper(
      targetUser,
      this.selectedAmount() * 1000,
      'msat',
      { ndk },
    );
    await zapper.zap(['nip57']);
  }

  private async fetchInvoice(amountMsat: number): Promise<string> {
    const ndk = await this.client.getNdk();
    const { NDKUser, NDKZapper } = await import('@nostr-dev-kit/ndk');

    const targetUser = new NDKUser({ npub: PROJECT_INFO.ownerNpub });
    targetUser.ndk = ndk;

    return new Promise<string>((resolve, reject) => {
      const zapper = new NDKZapper(targetUser, amountMsat, 'msat', {
        ndk,
        lnPay: async ({ pr }) => {
          resolve(pr);
          return { preimage: '' };
        },
      });

      zapper.zap(['nip57']).catch(reject);
      setTimeout(() => reject(new Error('Invoice timeout')), 15_000);
    });
  }

  private resetState(): void {
    this.invoiceQr.set(null);
    this.invoiceError.set(false);
  }
}