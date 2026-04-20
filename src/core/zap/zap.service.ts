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
  readonly amountQrPreview = signal<string | null>(null);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  openModal(): void {
    if (!this.session.isAuthenticated()) {
      this.authRequiredOpen.set(true);
      return;
    }
    this.resetState();
    this.selectedAmount.set(42);
    this.modalOpen.set(true);
    this.generateAmountQrPreview(42);
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

  async generateAmountQrPreview(amountSat: number): Promise<void> {
    const amountMsat = amountSat * 1000;
    const uri = `lightning:${PROJECT_INFO.zapAddress}?amount=${amountMsat}`;
    const qr = await QRCode.toDataURL(uri, { width: 192, margin: 2 });
    this.amountQrPreview.set(qr);
  }

  async submit(): Promise<void> {
    this.success.set(false);
    this.error.set(null);
    this.loading.set(true);
    try {
      const ndk = await this.client.getNdk();
      const { NDKUser, NDKZapper } = await import('@nostr-dev-kit/ndk');
      const targetUser = new NDKUser({ npub: PROJECT_INFO.ownerNpub });
      targetUser.ndk = ndk;
      const zapper = new NDKZapper(targetUser, this.selectedAmount() * 1000, 'msat', { ndk });
      await zapper.zap(['nip57']);
      this.success.set(true);
      setTimeout(() => this.closeModal(), 2000);
    } catch (err) {
      this.error.set('Erreur zap');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  private resetState(): void {
    this.loading.set(false);
    this.amountQrPreview.set(null);
    this.success.set(false);
    this.error.set(null);
  }
}