import { inject, Injectable, signal } from '@angular/core';
import QRCode from 'qrcode';

import { PROJECT_INFO } from '../config/project-info';
import { NostrClientService } from '../nostr/application/nostr-client.service';
import { DEFAULT_RELAY_URLS } from '../nostr/infrastructure/relay.config';
import { NostrSessionService } from '../nostr/application/nostr-session.service';

type ZapStatus = 'idle' | 'submitting' | 'success' | 'error';

interface ZapMetadata {
  tag: 'payRequest';
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
}

@Injectable({ providedIn: 'root' })
export class ZapService {
  private readonly client = inject(NostrClientService);
  private readonly session = inject(NostrSessionService);
  private invoiceRequestId = 0;

  readonly modalOpen = signal(false);
  readonly authRequiredOpen = signal(false);
  readonly selectedAmount = signal(42);
  readonly invoiceLoading = signal(false);
  readonly invoiceQr = signal<string | null>(null);
  readonly invoiceError = signal(false);
  readonly zapStatus = signal<ZapStatus>('idle');

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
  }

  clearInvoice(): void {
    this.invoiceRequestId += 1;
    this.invoiceLoading.set(false);
    this.invoiceQr.set(null);
    this.invoiceError.set(false);
  }

  async generateInvoice(): Promise<void> {
    const requestId = ++this.invoiceRequestId;

    this.invoiceLoading.set(true);
    this.invoiceError.set(false);
    this.zapStatus.set('idle');
    try {
      const pr = await this.fetchLightningInvoice(this.selectedAmount() * 1000);
      const invoiceUri = `lightning:${pr}`;
      const qr = await QRCode.toDataURL(invoiceUri, { width: 192, margin: 2 });

      if (requestId !== this.invoiceRequestId) {
        return;
      }

      this.invoiceQr.set(qr);
    } catch (err) {
      if (requestId !== this.invoiceRequestId) {
        return;
      }

      console.error('Invoice error:', err);
      this.invoiceQr.set(null);
      this.invoiceError.set(true);
    } finally {
      if (requestId === this.invoiceRequestId) {
        this.invoiceLoading.set(false);
      }
    }
  }

  async sendZapEvent(): Promise<void> {
    this.zapStatus.set('submitting');
    try {
      const ndk = await this.client.getNdk();
      const signer = ndk.signer;
      if (!signer) {
        throw new Error('Nostr authentication is required before zapping.');
      }

      const metadata = await this.fetchZapMetadata();
      const { NDKRelaySet, NDKUser, generateZapRequest } = await import('@nostr-dev-kit/ndk');
      const targetUser = new NDKUser({ npub: PROJECT_INFO.ownerNpub });
      targetUser.ndk = ndk;

      const relayUrls = ndk.pool.connectedRelays().map((relay) => relay.url);
      const publishRelays = relayUrls.length > 0 ? relayUrls : [...DEFAULT_RELAY_URLS];
      const zapRequest = await generateZapRequest(
        targetUser,
        ndk,
        metadata,
        targetUser.pubkey,
        this.selectedAmount() * 1000,
        publishRelays,
        '',
        undefined,
        signer,
      );

      if (!zapRequest) {
        throw new Error('Unable to generate zap request.');
      }

      await zapRequest.publish(NDKRelaySet.fromRelayUrls(publishRelays, ndk));
      this.zapStatus.set('success');
      setTimeout(() => this.closeModal(), 1200);
    } catch (err) {
      console.error('Zap error:', err);
      this.zapStatus.set('error');
    }
  }

  private async fetchLightningInvoice(amountMsat: number): Promise<string> {
    const url = buildApiUrl(
      `/api/lnurl?address=${encodeURIComponent(PROJECT_INFO.zapAddress)}&amount=${amountMsat}`,
    );

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }
    const data = (await response.json()) as { pr?: string };
    if (typeof data.pr !== 'string' || !data.pr.trim()) {
      throw new Error('Invalid invoice response');
    }
    return data.pr;
  }

  private async fetchZapMetadata(): Promise<ZapMetadata> {
    const [name, domain] = PROJECT_INFO.zapAddress.split('@');
    if (!name || !domain) {
      throw new Error('Invalid lightning address.');
    }

    const response = await fetch(
      `https://${domain}/.well-known/lnurlp/${encodeURIComponent(name)}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch zap metadata.');
    }

    const data = (await response.json()) as {
      tag?: string;
      callback?: string;
      minSendable?: number;
      maxSendable?: number;
      metadata?: string;
    };
    if (
      data.tag !== 'payRequest' ||
      typeof data.callback !== 'string' ||
      !data.callback.trim() ||
      typeof data.minSendable !== 'number' ||
      typeof data.maxSendable !== 'number' ||
      typeof data.metadata !== 'string' ||
      !data.metadata.trim()
    ) {
      throw new Error('Invalid zap metadata response.');
    }

    return {
      tag: 'payRequest',
      callback: data.callback,
      minSendable: data.minSendable,
      maxSendable: data.maxSendable,
      metadata: data.metadata,
    };
  }

  private resetState(): void {
    this.invoiceRequestId += 1;
    this.invoiceLoading.set(false);
    this.invoiceQr.set(null);
    this.invoiceError.set(false);
    this.zapStatus.set('idle');
  }
}

function buildApiUrl(path: string): string {
  if (typeof globalThis === 'undefined' || !globalThis.location) {
    return path;
  }

  const isLocal =
    globalThis.location.hostname === 'localhost' || globalThis.location.hostname === '127.0.0.1';
  const origin = isLocal ? 'http://127.0.0.1:3000' : globalThis.location.origin;

  return `${origin}${path}`;
}
