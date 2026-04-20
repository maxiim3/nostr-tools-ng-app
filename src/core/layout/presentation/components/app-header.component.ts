import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { PROJECT_INFO } from '../../../config/project-info';
import { LanguageService } from '../../../i18n/language.service';
import { NostrSessionService } from '../../../nostr/application/nostr-session.service';
import { ZapService } from '../../../zap/zap.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-20 w-full bg-orange-500 shadow-sm">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <a
          routerLink="/"
          class="shrink-0 text-3xl modak-regular font-bold font-sans uppercase text-white"
        >
          {{ project.name }}
        </a>

        <nav class="hidden flex-1 items-center gap-4 md:flex">
          <a
            routerLink="/packs/francophone/request"
            class="text-sm font-semibold text-white/80 transition hover:text-white"
          >
            {{ 'header.request' | transloco }}
          </a>

          @if (session.isAdmin()) {
            <a
              routerLink="/packs/francophone/admin/requests"
              class="text-sm font-semibold text-white/80 transition hover:text-white"
            >
              {{ 'header.adminRequests' | transloco }}
            </a>
          }
        </nav>

        <div class="hidden md:flex ml-auto items-center gap-3">
          @if (session.user(); as user) {
            <div class="flex items-center gap-3 rounded-full bg-white/15 px-3 py-1.5 text-white">
              @if (user.imageUrl) {
                <img
                  [src]="user.imageUrl"
                  [alt]="user.displayName"
                  class="h-10 w-10 rounded-full object-cover"
                />
              } @else {
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white"
                >
                  {{ initials(user.displayName) }}
                </span>
              }

              <span class="max-w-36 truncate text-sm font-semibold">{{ user.displayName }}</span>

            </div>

            <button type="button" class="btn btn-primary gap-2" (click)="disconnect()">
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              {{ 'common.logout' | transloco }}
            </button>
          } @else {
            <button
              type="button"
              class="btn btn-primary gap-2"
              [disabled]="session.connecting()"
              (click)="openAuthModal()"
            >
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
          }

          <button
            type="button"
            class="btn btn-accent"
            [attr.aria-label]="'zap.buttonAria' | transloco"
            (click)="zap.openModal()"
          >
            ❤️
          </button>

          <div
            class="inline-flex items-center gap-1 rounded-full bg-white/10 p-1"
            role="group"
            aria-label="Language switcher"
          >
            @for (lang of language.supportedLanguages; track lang) {
              @if (language.currentLanguage() === lang) {
                <button
                  type="button"
                  class="rounded-full bg-white px-3 py-1 text-sm font-semibold text-orange-600 transition"
                  aria-pressed="true"
                  (click)="language.setLanguage(lang)"
                >
                  {{ lang.toUpperCase() }}
                </button>
              } @else {
                <button
                  type="button"
                  class="rounded-full px-3 py-1 text-sm font-medium text-white/60 transition hover:text-white"
                  aria-pressed="false"
                  (click)="language.setLanguage(lang)"
                >
                  {{ lang.toUpperCase() }}
                </button>
              }
            }
          </div>
        </div>

        <!-- Mobile hamburger -->
        <button
          type="button"
          class="ml-auto md:hidden flex items-center justify-center size-10 rounded-lg text-white transition hover:bg-white/10"
          aria-label="Toggle menu"
          (click)="toggleMobileMenu()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            class="size-6"
          >
            @if (mobileMenuOpen()) {
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            } @else {
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            }
          </svg>
        </button>
      </div>

      @if (mobileMenuOpen()) {
        <nav class="absolute inset-x-0 top-16 mx-auto max-w-7xl border-t border-white/10 bg-orange-500 shadow-2xl md:hidden">
          <!-- Close header -->
          <div class="flex items-center justify-between p-4 border-b border-white/20">
            <button
              type="button"
              class="text-xl font-bold text-white transition hover:text-white/80"
              (click)="closeMobileMenu()"
            >
              {{ project.name }}
            </button>
            <button
              type="button"
              class="flex size-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
              (click)="closeMobileMenu()"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Nav section -->
          <div class="p-4 space-y-1">
            <a
              routerLink="/packs/francophone/request"
              class="mx-auto block max-w-xs w-full rounded-xl py-4 px-6 text-lg font-semibold text-white/90 transition hover:bg-white/10"
              (click)="closeMobileMenu()"
            >
              {{ 'header.request' | transloco }}
            </a>
            @if (session.isAdmin()) {
              <a
                routerLink="/packs/francophone/admin/requests"
                class="mx-auto block max-w-xs w-full rounded-xl py-4 px-6 text-lg font-semibold text-white/90 transition hover:bg-white/10"
                (click)="closeMobileMenu()"
              >
                {{ 'header.adminRequests' | transloco }}
              </a>
            }
          </div>

          <hr class="border-white/20">

          <!-- Actions -->
          <div class="p-4 space-y-3">
            <button
              type="button"
              class="mx-auto block max-w-xs w-full h-14 rounded-xl bg-white/10 px-6 py-3 text-lg font-semibold text-white transition hover:bg-white/20"
              [attr.aria-label]="'zap.buttonAria' | transloco"
              (click)="zap.openModal(); closeMobileMenu()"
            >
              ❤️ Zaps
            </button>

            <div class="flex gap-2 justify-center">
              <div class="inline-flex items-center gap-1 rounded-full bg-white/10 p-1" role="group" aria-label="Language switcher">
                @for (lang of language.supportedLanguages; track lang) {
                  @if (language.currentLanguage() === lang) {
                    <button
                      type="button"
                      class="rounded-full bg-white px-4 py-2 text-base font-semibold text-orange-600 transition"
                      aria-pressed="true"
                      (click)="language.setLanguage(lang); closeMobileMenu()"
                    >
                      {{ lang.toUpperCase() }}
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="rounded-full px-4 py-2 text-base font-medium text-white/70 transition hover:text-white hover:bg-white/10"
                      aria-pressed="false"
                      (click)="language.setLanguage(lang); closeMobileMenu()"
                    >
                      {{ lang.toUpperCase() }}
                    </button>
                  }
                }
              </div>
            </div>
          </div>

          <!-- Profile section -->
          <div class="border-t border-white/20 bg-white/5 p-4">
            @if (session.user(); as user) {
              <div class="mb-4 flex items-center gap-4">
                @if (user.imageUrl) {
                  <img
                    [src]="user.imageUrl"
                    [alt]="user.displayName"
                    class="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                  />
                } @else {
                  <span class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-base font-bold text-white flex-shrink-0">
                    {{ initials(user.displayName) }}
                  </span>
                }
                <span class="truncate text-base font-semibold text-white">{{ user.displayName }}</span>
              </div>
              <button
                type="button"
                class="mx-auto block max-w-xs w-full h-12 rounded-xl bg-white/10 px-4 text-base font-semibold text-white transition hover:bg-white/20"
                (click)="disconnect(); closeMobileMenu()"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="inline size-5 mr-2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                {{ 'common.logout' | transloco }}
              </button>
            } @else {
              <button
                type="button"
                class="mx-auto block max-w-xs w-full h-14 rounded-xl btn btn-primary text-base"
                [disabled]="session.connecting()"
                (click)="openAuthModal(); closeMobileMenu()"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="inline size-5 mr-2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                </svg>
                {{ 'common.login' | transloco }}
              </button>
            }
          </div>
        </nav>
      }
    </header>
  `,
})
export class AppHeaderComponent {
  protected readonly project = PROJECT_INFO;
  protected readonly language = inject(LanguageService);
  protected readonly session = inject(NostrSessionService);
  protected readonly zap = inject(ZapService);

  protected readonly mobileMenuOpen = signal(false);

  protected initials(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected async login(): Promise<void> {
    await this.session.connectWithExtension();
  }

  protected openAuthModal(): void {
    this.session.openAuthModal();
  }

  protected async disconnect(): Promise<void> {
    await this.session.disconnect();
  }
}
