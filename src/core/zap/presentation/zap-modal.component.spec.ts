import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZapService } from '../zap.service';
import { ZapModalComponent } from './zap-modal.component';

type ZapStatus = 'idle' | 'submitting' | 'success' | 'error';

interface ZapServiceMock {
  authRequiredOpen: WritableSignal<boolean>;
  modalOpen: WritableSignal<boolean>;
  selectedAmount: WritableSignal<number>;
  invoiceLoading: WritableSignal<boolean>;
  invoiceQr: WritableSignal<string | null>;
  invoiceError: WritableSignal<boolean>;
  zapStatus: WritableSignal<ZapStatus>;
  clearInvoice: ReturnType<typeof vi.fn>;
  setAmount: ReturnType<typeof vi.fn>;
  generateInvoice: ReturnType<typeof vi.fn>;
  closeModal: ReturnType<typeof vi.fn>;
  closeAuthRequired: ReturnType<typeof vi.fn>;
  openAuthModal: ReturnType<typeof vi.fn>;
  sendZapEvent: ReturnType<typeof vi.fn>;
}

function createZapServiceMock(): ZapServiceMock {
  return {
    authRequiredOpen: signal(false),
    modalOpen: signal(false),
    selectedAmount: signal(42),
    invoiceLoading: signal(false),
    invoiceQr: signal('invoice-qr'),
    invoiceError: signal(false),
    zapStatus: signal<ZapStatus>('idle'),
    clearInvoice: vi.fn(),
    setAmount: vi.fn(),
    generateInvoice: vi.fn().mockResolvedValue(undefined),
    closeModal: vi.fn(),
    closeAuthRequired: vi.fn(),
    openAuthModal: vi.fn(),
    sendZapEvent: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ZapModalComponent', () => {
  let fixture: ComponentFixture<ZapModalComponent>;
  let component: ZapModalComponent;
  let zap: ZapServiceMock;

  beforeEach(async () => {
    zap = createZapServiceMock();

    await TestBed.configureTestingModule({
      imports: [ZapModalComponent],
      providers: [{ provide: ZapService, useValue: zap }],
    }).compileComponents();

    fixture = TestBed.createComponent(ZapModalComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('validates amount boundaries on the form control', () => {
    const amountControl = component['amountControl'];

    amountControl.setValue(20);
    expect(amountControl.hasError('min')).toBe(true);

    amountControl.setValue(100_001);
    expect(amountControl.hasError('max')).toBe(true);

    amountControl.setValue(21);
    expect(amountControl.valid).toBe(true);

    amountControl.setValue(100_000);
    expect(amountControl.valid).toBe(true);
  });

  it('clears invoice when the debounced amount is invalid', () => {
    vi.useFakeTimers();
    component.ngOnInit();

    component['amountControl'].setValue(20);
    vi.advanceTimersByTime(500);

    expect(zap.clearInvoice).toHaveBeenCalledTimes(1);
    expect(zap.setAmount).not.toHaveBeenCalled();
    expect(zap.generateInvoice).not.toHaveBeenCalled();
  });

  it('sets amount and regenerates invoice when debounced value is valid', () => {
    vi.useFakeTimers();
    component.ngOnInit();

    component['amountControl'].setValue(256);
    vi.advanceTimersByTime(499);
    expect(zap.setAmount).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(zap.setAmount).toHaveBeenCalledWith(256);
    expect(zap.generateInvoice).toHaveBeenCalledTimes(1);
  });

  it('selectPreset updates amount and only triggers one invoice generation', () => {
    vi.useFakeTimers();
    component.ngOnInit();

    component['selectPreset'](999);
    vi.advanceTimersByTime(500);

    expect(component['amountControl'].value).toBe(999);
    expect(zap.setAmount).toHaveBeenCalledWith(999);
    expect(zap.generateInvoice).toHaveBeenCalledTimes(1);
  });

  it('forwards action handlers to the zap service', () => {
    component['close']();
    component['closeAuthRequired']();
    component['openAuthModal']();
    component['retry']();
    component['submitZap']();

    expect(zap.closeModal).toHaveBeenCalledTimes(1);
    expect(zap.closeAuthRequired).toHaveBeenCalledTimes(1);
    expect(zap.openAuthModal).toHaveBeenCalledTimes(1);
    expect(zap.generateInvoice).toHaveBeenCalledTimes(1);
    expect(zap.sendZapEvent).toHaveBeenCalledTimes(1);
  });

  it('stops reacting to amount changes after destroy', () => {
    vi.useFakeTimers();
    component.ngOnInit();
    component.ngOnDestroy();

    component['amountControl'].setValue(256);
    vi.advanceTimersByTime(500);

    expect(zap.setAmount).not.toHaveBeenCalled();
    expect(zap.generateInvoice).not.toHaveBeenCalled();
    expect(zap.clearInvoice).not.toHaveBeenCalled();
  });

  it('disables submit button when amount or invoice state is invalid', () => {
    zap.modalOpen.set(true);
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button.btn-block') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(false);

    component['amountControl'].setValue(20, { emitEvent: false });
    fixture.detectChanges();
    expect(submitButton.disabled).toBe(true);

    component['amountControl'].setValue(42, { emitEvent: false });
    zap.invoiceLoading.set(true);
    fixture.detectChanges();
    expect(submitButton.disabled).toBe(true);

    zap.invoiceLoading.set(false);
    zap.invoiceQr.set(null);
    fixture.detectChanges();
    expect(submitButton.disabled).toBe(true);
  });
});
