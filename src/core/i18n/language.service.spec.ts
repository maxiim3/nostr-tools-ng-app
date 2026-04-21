import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { LanguageService } from './language.service';
import { SUPPORTED_LANGUAGES } from './language.model';

describe('LanguageService', () => {
  let service: LanguageService;
  let mockTransloco: { setAvailableLangs: ReturnType<typeof vi.fn>; setActiveLang: ReturnType<typeof vi.fn> };
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};

    mockTransloco = {
      setAvailableLangs: vi.fn(),
      setActiveLang: vi.fn(),
    };

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn(),
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'fr' },
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslocoService, useValue: mockTransloco },
        { provide: DOCUMENT, useValue: { documentElement: { lang: '' } } },
      ],
    });

    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to fr when no stored value and unsupported browser language', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'zh' },
      writable: true,
      configurable: true,
    });

    const svc = TestBed.runInInjectionContext(() => new LanguageService());
    expect(svc.currentLanguage()).toBe('fr');
  });

  it('resolves initial language from browser language', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'en-US' },
      writable: true,
      configurable: true,
    });

    const svc = TestBed.runInInjectionContext(() => new LanguageService());
    expect(svc.currentLanguage()).toBe('en');
  });

  it('resolves initial language from stored value', () => {
    store['nostrtools.language'] = 'es';

    const svc = TestBed.runInInjectionContext(() => new LanguageService());
    expect(svc.currentLanguage()).toBe('es');
  });

  it('ignores invalid stored language and falls back to browser then fr', () => {
    store['nostrtools.language'] = 'xx';
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'fr' },
      writable: true,
      configurable: true,
    });

    const svc = TestBed.runInInjectionContext(() => new LanguageService());
    expect(svc.currentLanguage()).toBe('fr');
  });

  it('setLanguage updates the current language signal', () => {
    service.setLanguage('en');
    expect(service.currentLanguage()).toBe('en');
  });

  it('supportedLanguages matches SUPPORTED_LANGUAGES', () => {
    expect(service.supportedLanguages).toEqual(SUPPORTED_LANGUAGES);
  });
});
