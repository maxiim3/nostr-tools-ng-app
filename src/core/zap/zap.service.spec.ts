import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import QRCode from 'qrcode';

import { ZapService } from './zap.service';
import { NostrClientService } from '../nostr/application/nostr-client.service';
import { NostrSessionService } from '../nostr/application/nostr-session.service';

describe('ZapService', () => {
  let service: ZapService;

  const mockSession = {
    isAuthenticated: signal(false),
    openAuthModal: vi.fn(),
  };

  const mockNdk = {
    signer: { pubkey: 'abc' },
    pool: { connectedRelays: vi.fn().mockReturnValue([{ url: 'wss://relay.example.com' }]) },
    signEvent: vi.fn(),
  };

  const mockClient = {
    getNdk: vi.fn().mockResolvedValue(mockNdk),
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());

    TestBed.configureTestingModule({
      providers: [
        ZapService,
        { provide: NostrSessionService, useValue: mockSession },
        { provide: NostrClientService, useValue: mockClient },
      ],
    });

    service = TestBed.runInInjectionContext(() => new ZapService());

    mockSession.isAuthenticated.set(false);
    mockSession.openAuthModal.mockReset();
    mockClient.getNdk.mockResolvedValue(mockNdk);
    mockNdk.pool.connectedRelays.mockReturnValue([{ url: 'wss://relay.example.com' }]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('openModal sets authRequiredOpen when not authenticated', () => {
    mockSession.isAuthenticated.set(false);
    service.openModal();

    expect(service.authRequiredOpen()).toBe(true);
    expect(service.modalOpen()).toBe(false);
    expect(mockSession.openAuthModal).not.toHaveBeenCalled();
  });

  it('openModal opens modal, resets state and generates invoice when authenticated', async () => {
    mockSession.isAuthenticated.set(true);
    const fetchSpy = vi.mocked(fetch);
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pr: 'lnbc123invoice' }),
    } as Response);
    vi.spyOn(QRCode, 'toDataURL').mockImplementation(() =>
      Promise.resolve('data:image/png;base64,qr')
    );

    service.openModal();

    expect(service.modalOpen()).toBe(true);
    expect(service.selectedAmount()).toBe(42);

    await vi.waitFor(() => {
      expect(service.invoiceQr()).toBe('data:image/png;base64,qr');
    });
  });

  it('closeModal closes modal and resets state', () => {
    service.modalOpen.set(true);
    service.invoiceLoading.set(true);
    service.invoiceQr.set('data');
    service.invoiceError.set(true);
    service.zapStatus.set('success');

    service.closeModal();

    expect(service.modalOpen()).toBe(false);
    expect(service.invoiceLoading()).toBe(false);
    expect(service.invoiceQr()).toBeNull();
    expect(service.invoiceError()).toBe(false);
    expect(service.zapStatus()).toBe('idle');
  });

  it('openAuthModal closes authRequired and delegates to session', () => {
    service.authRequiredOpen.set(true);
    service.openAuthModal();

    expect(service.authRequiredOpen()).toBe(false);
    expect(mockSession.openAuthModal).toHaveBeenCalledTimes(1);
  });

  it('generateInvoice sets invoiceQr on success', async () => {
    mockSession.isAuthenticated.set(true);
    const fetchSpy = vi.mocked(fetch);
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pr: 'lnbc42invoice' }),
    } as Response);
    vi.spyOn(QRCode, 'toDataURL').mockImplementation(() => Promise.resolve('qr-data'));

    await service.generateInvoice();

    expect(service.invoiceQr()).toBe('qr-data');
    expect(service.invoiceLoading()).toBe(false);
    expect(service.invoiceError()).toBe(false);
  });

  it('generateInvoice sets invoiceError on fetch failure', async () => {
    mockSession.isAuthenticated.set(true);
    const fetchSpy = vi.mocked(fetch);
    fetchSpy.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    } as Response);

    await service.generateInvoice();

    expect(service.invoiceQr()).toBeNull();
    expect(service.invoiceError()).toBe(true);
    expect(service.invoiceLoading()).toBe(false);
  });

  it('generateInvoice sets invoiceError on invalid pr', async () => {
    mockSession.isAuthenticated.set(true);
    const fetchSpy = vi.mocked(fetch);
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pr: '' }),
    } as Response);

    await service.generateInvoice();

    expect(service.invoiceQr()).toBeNull();
    expect(service.invoiceError()).toBe(true);
  });

  it('sendZapEvent sets zapStatus to error when no signer', async () => {
    mockClient.getNdk.mockResolvedValue({ ...mockNdk, signer: null });

    await service.sendZapEvent();

    expect(service.zapStatus()).toBe('error');
  });
});
