import { Pipe, PipeTransform, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';

import { NostrSessionService } from '../../../nostr/application/nostr-session.service';
import { AppAuthModalComponent } from './app-auth-modal.component';

const { toDataUrlMock } = vi.hoisted(() => ({
  toDataUrlMock: vi.fn<(uri: string) => Promise<string | null>>(),
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: toDataUrlMock,
  },
}));

@Pipe({
  name: 'transloco',
})
class MockTranslocoPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

interface SessionServiceMock {
  authModalOpen: WritableSignal<boolean>;
  extensionAvailable: WritableSignal<boolean>;
  connecting: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  externalAuthUri: WritableSignal<string | null>;
  waitingForExternalAuth: WritableSignal<boolean>;
  waitingForBunkerAuth: WritableSignal<boolean>;
  externalAuthTimedOut: WritableSignal<boolean>;
  bunkerAuthTimedOut: WritableSignal<boolean>;
  connectWithExtension: ReturnType<typeof vi.fn>;
  connectWithPrivateKey: ReturnType<typeof vi.fn>;
  beginExternalAppLogin: ReturnType<typeof vi.fn>;
  cancelExternalAppLogin: ReturnType<typeof vi.fn>;
  beginBunkerLogin: ReturnType<typeof vi.fn>;
  cancelBunkerLogin: ReturnType<typeof vi.fn>;
  closeAuthModal: ReturnType<typeof vi.fn>;
}

describe('AppAuthModalComponent', () => {
  let fixture: ComponentFixture<AppAuthModalComponent>;
  let component: AppAuthModalComponent;
  let session: SessionServiceMock;

  beforeEach(async () => {
    session = createSessionServiceMock();
    toDataUrlMock.mockResolvedValue('data:image/png;base64,qr-code');
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn<(value: string) => Promise<void>>().mockResolvedValue(undefined),
      },
    });

    TestBed.overrideComponent(AppAuthModalComponent, {
      remove: { imports: [TranslocoPipe] },
      add: { imports: [MockTranslocoPipe] },
    });

    await TestBed.configureTestingModule({
      imports: [AppAuthModalComponent],
      providers: [{ provide: NostrSessionService, useValue: session }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppAuthModalComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('calls extension auth when the extension CTA is clicked', async () => {
    fixture.detectChanges();

    clickButton(fixture, 'authModal.extension.cta');
    await fixture.whenStable();

    expect(session.connectWithExtension).toHaveBeenCalledTimes(1);
    expect(component['privateKeyControl'].value).toBe('');
  });

  it('submits the provided private key and clears the field', async () => {
    fixture.detectChanges();

    clickButton(fixture, 'authModal.advanced.show');

    component['privateKeyControl'].setValue('nsec1componenttest');
    fixture.detectChanges();

    clickButton(fixture, 'authModal.privateKey.cta');
    await fixture.whenStable();

    expect(session.connectWithPrivateKey).toHaveBeenCalledWith('nsec1componenttest');
    expect(component['privateKeyControl'].value).toBe('');
  });

  it('starts external auth, shows the waiting state, and renders a QR code', async () => {
    const openExternalUriSpy = vi
      .spyOn(
        AppAuthModalComponent.prototype as unknown as { openExternalUri: (uri: string) => void },
        'openExternalUri'
      )
      .mockImplementation(() => undefined);

    fixture.detectChanges();

    await component['startExternalApp']();
    await flushAsync();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(session.beginExternalAppLogin).toHaveBeenCalledTimes(1);
    expect(openExternalUriSpy).toHaveBeenCalledWith('nostrconnect://example');
    expect(session.externalAuthUri()).toBe('nostrconnect://example');
    expect(session.waitingForExternalAuth()).toBe(true);
    expect(toDataUrlMock).toHaveBeenCalledWith('nostrconnect://example', { width: 192, margin: 2 });
    expect(component['externalAuthQr']()).toBe('data:image/png;base64,qr-code');

    const link = fixture.nativeElement.querySelector(
      'a[href="nostrconnect://example"]'
    ) as HTMLAnchorElement | null;

    expect(link).not.toBeNull();
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(fixture.nativeElement.textContent).toContain('authModal.external.waiting');
  });

  it('shows primary extension and external actions while advanced methods are hidden by default', () => {
    fixture.detectChanges();

    const sections = fixture.nativeElement.querySelectorAll('section') as NodeListOf<HTMLElement>;
    const extensionSection = sections[0];
    const externalSection = sections[1];
    const advancedPanel = fixture.nativeElement.querySelector(
      '#auth-modal-advanced-options'
    ) as HTMLElement | null;

    expect(fixture.nativeElement.textContent).toContain('authModal.extension.cta');
    expect(fixture.nativeElement.textContent).toContain('authModal.external.cta');
    expect(extensionSection.textContent).toContain('authModal.extension.recommendedDesktop');
    expect(extensionSection.textContent).not.toContain('authModal.external.recommendedMobile');
    expect(externalSection.textContent).toContain('authModal.external.recommendedMobile');
    expect(fixture.nativeElement.textContent).toContain('authModal.advanced.show');
    expect(advancedPanel?.hidden).toBe(true);
  });

  it('toggles advanced options and exposes accessibility attributes', () => {
    fixture.detectChanges();

    const toggleButton = [...fixture.nativeElement.querySelectorAll('button')].find((element) =>
      element.textContent?.includes('authModal.advanced.show')
    ) as HTMLButtonElement;

    expect(toggleButton.getAttribute('aria-controls')).toBe('auth-modal-advanced-options');
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

    toggleButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('authModal.bunker.cta');
    expect(fixture.nativeElement.textContent).toContain('authModal.privateKey.cta');
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#auth-modal-advanced-options')?.hidden).toBe(false);
  });

  it('resets advanced visibility after private-key input and modal close', () => {
    fixture.detectChanges();

    clickButton(fixture, 'authModal.advanced.show');
    component['privateKeyControl'].setValue('nsec1dirty');
    component['privateKeyControl'].markAsDirty();

    component['close']();
    session.authModalOpen.set(true);
    fixture.detectChanges();

    expect(component['privateKeyControl'].pristine).toBe(true);
    expect(component['advancedVisible']()).toBe(false);
    expect(fixture.nativeElement.querySelector('#auth-modal-advanced-options')?.hidden).toBe(true);
  });

  it('keeps advanced options visible when bunker flow is pending', () => {
    session.waitingForBunkerAuth.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('authModal.bunker.waiting');
    expect(fixture.nativeElement.textContent).toContain('authModal.bunker.cancel');
    expect(fixture.nativeElement.textContent).toContain('authModal.advanced.hide');
  });

  it('copies the external auth URI and resets the copied state after a delay', async () => {
    vi.useFakeTimers();
    session.externalAuthUri.set('nostrconnect://copy-me');
    session.waitingForExternalAuth.set(true);
    fixture.detectChanges();

    clickButton(fixture, 'authModal.external.copy');
    await flushAsync();
    fixture.detectChanges();

    expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith('nostrconnect://copy-me');
    expect(fixture.nativeElement.textContent).toContain('authModal.external.copied');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('authModal.external.copy');
  });

  it('cancels pending external auth when the modal is closed', () => {
    session.externalAuthUri.set('nostrconnect://close');
    session.waitingForExternalAuth.set(true);
    fixture.detectChanges();

    clickButton(fixture, 'common.close');

    expect(session.cancelExternalAppLogin).toHaveBeenCalledTimes(1);
    expect(session.closeAuthModal).toHaveBeenCalledTimes(1);
  });

  it('does not render the dialog when authModalOpen is false', () => {
    session.authModalOpen.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
  });

  it('does not copy when externalAuthUri is null', async () => {
    session.externalAuthUri.set(null);
    fixture.detectChanges();

    await component['copyUri']();

    expect(globalThis.navigator.clipboard.writeText).not.toHaveBeenCalled();
    expect(component['copied']()).toBe(false);
  });

  it('clears QR and copied state when startExternalApp returns null', async () => {
    session.beginExternalAppLogin.mockResolvedValue(null);
    const openExternalUriSpy = vi
      .spyOn(
        AppAuthModalComponent.prototype as unknown as { openExternalUri: (uri: string) => void },
        'openExternalUri'
      )
      .mockImplementation(() => undefined);

    await component['startExternalApp']();
    await flushAsync();

    expect(component['externalAuthQr']()).toBeNull();
    expect(component['copied']()).toBe(false);
    expect(openExternalUriSpy).not.toHaveBeenCalled();
  });

  it('resets local state on cancelExternalApp', () => {
    component['copied'].set(true);
    component['externalAuthQr'].set('data:image/png;base64,qr');

    component['cancelExternalApp']();

    expect(component['copied']()).toBe(false);
    expect(component['externalAuthQr']()).toBeNull();
    expect(session.cancelExternalAppLogin).toHaveBeenCalledTimes(1);
  });

  it('resets local state when closing the modal without active external auth', () => {
    component['privateKeyControl'].setValue('nsec1abc');
    component['bunkerTokenControl'].setValue('bunker://abc');
    component['copied'].set(true);
    component['externalAuthQr'].set('data:image/png;base64,qr');

    component['close']();

    expect(component['privateKeyControl'].value).toBe('');
    expect(component['privateKeyControl'].pristine).toBe(true);
    expect(component['bunkerTokenControl'].value).toBe('');
    expect(component['bunkerTokenControl'].pristine).toBe(true);
    expect(component['copied']()).toBe(false);
    expect(component['externalAuthQr']()).toBeNull();
    expect(session.cancelExternalAppLogin).not.toHaveBeenCalled();
    expect(session.cancelBunkerLogin).not.toHaveBeenCalled();
    expect(session.closeAuthModal).toHaveBeenCalledTimes(1);
  });

  it('displays retry button when external auth times out', async () => {
    session.externalAuthUri.set('nostrconnect://example');
    session.waitingForExternalAuth.set(true);
    session.externalAuthTimedOut.set(true);
    fixture.detectChanges();

    clickButton(fixture, 'authModal.external.retry');

    expect(session.cancelExternalAppLogin).toHaveBeenCalledTimes(1);
    expect(session.beginExternalAppLogin).toHaveBeenCalledTimes(1);
  });

  it('modal cancels pending external auth on close', () => {
    session.externalAuthUri.set('nostrconnect://example');
    session.waitingForExternalAuth.set(true);
    fixture.detectChanges();

    clickButton(fixture, 'common.close');

    expect(session.cancelExternalAppLogin).toHaveBeenCalledTimes(1);
    expect(session.closeAuthModal).toHaveBeenCalledTimes(1);
  });

  it('submits bunker token and clears the field', async () => {
    fixture.detectChanges();
    clickButton(fixture, 'authModal.advanced.show');

    component['bunkerTokenControl'].setValue('bunker://abc?relay=wss://relay.example.com');
    fixture.detectChanges();

    clickButton(fixture, 'authModal.bunker.cta');
    await fixture.whenStable();

    expect(session.beginBunkerLogin).toHaveBeenCalledWith(
      'bunker://abc?relay=wss://relay.example.com'
    );
    expect(component['bunkerTokenControl'].value).toBe('');
  });

  it('shows waiting state when bunker auth is in progress', async () => {
    session.waitingForBunkerAuth.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('authModal.bunker.waiting');
    expect(fixture.nativeElement.textContent).toContain('authModal.bunker.cancel');
  });

  it('cancels pending bunker auth when cancel is clicked', () => {
    session.waitingForBunkerAuth.set(true);
    fixture.detectChanges();

    clickButton(fixture, 'authModal.bunker.cancel');

    expect(session.cancelBunkerLogin).toHaveBeenCalledTimes(1);
  });

  it('cancels pending bunker auth when modal is closed', () => {
    session.waitingForBunkerAuth.set(true);
    fixture.detectChanges();

    clickButton(fixture, 'common.close');

    expect(session.cancelBunkerLogin).toHaveBeenCalledTimes(1);
    expect(session.closeAuthModal).toHaveBeenCalledTimes(1);
  });

  it('retries bunker auth on timeout retry click', async () => {
    session.waitingForBunkerAuth.set(true);
    session.bunkerAuthTimedOut.set(true);
    fixture.detectChanges();

    clickButton(fixture, 'authModal.bunker.retry');
    await fixture.whenStable();

    expect(session.cancelBunkerLogin).toHaveBeenCalledTimes(1);
    expect(session.beginBunkerLogin).toHaveBeenCalledTimes(1);
  });

  it('renders translated private-key action and input label', () => {
    fixture.detectChanges();
    clickButton(fixture, 'authModal.advanced.show');

    const privateKeyInput = fixture.nativeElement.querySelector(
      'input[type="password"]'
    ) as HTMLInputElement | null;

    expect(fixture.nativeElement.textContent).toContain('authModal.privateKey.cta');
    expect(privateKeyInput?.getAttribute('aria-label')).toBe('authModal.privateKey.inputLabel');
  });

  it('uses accessible labels for dialog and external signer QR', async () => {
    const openExternalUriSpy = vi
      .spyOn(
        AppAuthModalComponent.prototype as unknown as { openExternalUri: (uri: string) => void },
        'openExternalUri'
      )
      .mockImplementation(() => undefined);

    fixture.detectChanges();
    await component['startExternalApp']();
    await flushAsync();
    await fixture.whenStable();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement | null;
    const qrImage = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;

    expect(dialog?.getAttribute('aria-labelledby')).toBe('auth-modal-title');
    expect(dialog?.getAttribute('aria-describedby')).toBe('auth-modal-description');
    expect(qrImage?.getAttribute('alt')).toBe('authModal.external.qrAlt');
    expect(openExternalUriSpy).toHaveBeenCalledTimes(1);
  });
});

function createSessionServiceMock(): SessionServiceMock {
  const session = {
    authModalOpen: signal(true),
    extensionAvailable: signal(true),
    connecting: signal(false),
    error: signal<string | null>(null),
    externalAuthUri: signal<string | null>(null),
    waitingForExternalAuth: signal(false),
    waitingForBunkerAuth: signal(false),
    externalAuthTimedOut: signal(false),
    bunkerAuthTimedOut: signal(false),
    connectWithExtension: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
    connectWithPrivateKey: vi.fn<(value: string) => Promise<boolean>>().mockResolvedValue(true),
    beginExternalAppLogin: vi.fn<() => Promise<string | null>>().mockImplementation(async () => {
      session.externalAuthUri.set('nostrconnect://example');
      session.waitingForExternalAuth.set(true);
      return 'nostrconnect://example';
    }),
    cancelExternalAppLogin: vi.fn<() => void>().mockImplementation(() => {
      session.externalAuthUri.set(null);
      session.waitingForExternalAuth.set(false);
      session.externalAuthTimedOut.set(false);
    }),
    beginBunkerLogin: vi.fn<(token: string) => Promise<boolean>>().mockImplementation(async () => {
      session.waitingForBunkerAuth.set(true);
      session.bunkerAuthTimedOut.set(false);
      return true;
    }),
    cancelBunkerLogin: vi.fn<() => void>().mockImplementation(() => {
      session.waitingForBunkerAuth.set(false);
      session.bunkerAuthTimedOut.set(false);
    }),
    closeAuthModal: vi.fn<() => void>().mockImplementation(() => {
      session.authModalOpen.set(false);
    }),
  } satisfies SessionServiceMock;

  return session;
}

function clickButton(fixture: ComponentFixture<AppAuthModalComponent>, text: string): void {
  const button = [...fixture.nativeElement.querySelectorAll('button')].find((element) =>
    element.textContent?.includes(text)
  ) as HTMLButtonElement | undefined;

  if (!button) {
    throw new Error(`Button containing "${text}" not found.`);
  }

  button.click();
  fixture.detectChanges();
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
