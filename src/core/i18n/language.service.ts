import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { isSupportedLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from './language.model';

const STORAGE_KEY = 'nostrtools.language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);
  private readonly storage = typeof globalThis !== 'undefined' ? globalThis.localStorage : null;

  readonly supportedLanguages = SUPPORTED_LANGUAGES;
  readonly currentLanguage = signal<SupportedLanguage>(this.resolveInitialLanguage());

  constructor() {
    this.transloco.setAvailableLangs([...SUPPORTED_LANGUAGES]);

    effect(() => {
      const language = this.currentLanguage();
      this.transloco.setActiveLang(language);
      this.document.documentElement.lang = language;
      this.storage?.setItem(STORAGE_KEY, language);
    });
  }

  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage.set(language);
  }

  private resolveInitialLanguage(): SupportedLanguage {
    const storedLanguage = this.storage?.getItem(STORAGE_KEY);
    if (storedLanguage && isSupportedLanguage(storedLanguage)) {
      return storedLanguage;
    }

    const browserLanguage =
      typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'fr';
    return isSupportedLanguage(browserLanguage) ? browserLanguage : 'fr';
  }
}
