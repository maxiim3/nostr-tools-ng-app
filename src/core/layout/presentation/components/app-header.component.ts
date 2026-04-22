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
    <header class="sticky top-0 z-20 w-full border-b-[3px] border-[#0a0a0a] bg-[#FF5C00]">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <a
          routerLink="/packs/francophone"
          class="shrink-0 text-3xl font-extrabold uppercase text-white tracking-tight"
        >
          {{ project.name }}
        </a>

        <nav class="hidden flex-1 items-center gap-6 md:flex">
          <a
            routerLink="/packs/francophone/request"
            class="text-sm font-bold text-white decoration-white/30 decoration-[3px] underline underline-offset-4 transition-all hover:decoration-white"
          >
            {{ 'header.request' | transloco }}
          </a>

          @if (session.isAdmin()) {
            <a
              routerLink="/packs/francophone/admin/requests"
              class="text-sm font-bold text-white decoration-white/30 decoration-[3px] underline underline-offset-4 transition-all hover:decoration-white"
            >
              {{ 'header.adminRequests' | transloco }}
            </a>
          }
        </nav>

        <div class="ml-auto hidden items-center gap-3 md:flex">
          @if (session.user(); as user) {
            <div
              class="flex items-center gap-3 border-[3px] border-[#0a0a0a] bg-white/15 px-3 py-1.5 text-white"
            >
              @if (user.imageUrl) {
                <img
                  [src]="user.imageUrl"
                  [alt]="user.displayName"
                  class="h-10 w-10 border-[2px] border-[#0a0a0a] object-cover"
                />
              } @else {
                <span
                  class="flex h-10 w-10 items-center justify-center border-[2px] border-[#0a0a0a] bg-white/25 text-sm font-bold text-white"
                >
                  {{ initials(user.displayName) }}
                </span>
              }

              <span class="max-w-36 truncate text-sm font-bold">{{ user.displayName }}</span>
            </div>

            <button type="button" class="btn btn-sm bg-white text-[#0a0a0a]" (click)="disconnect()">
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
              class="btn btn-sm bg-white text-[#0a0a0a]"
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

          @if (session.user()) {
            <button
              type="button"
              class="text-sm font-semibold text-white/80 transition hover:text-white"
              (click)="zap.openModal()"
            >
              {{ 'header.support' | transloco }}
            </button>
          }

          <div
            class="inline-flex items-center border-[3px] border-[#0a0a0a] bg-white"
            role="group"
            aria-label="Language switcher"
          >
            @for (lang of language.supportedLanguages; track lang) {
              @if (language.currentLanguage() === lang) {
                <button
                  type="button"
                  class="bg-[#0a0a0a] px-3 py-1 text-sm font-bold text-white"
                  aria-pressed="true"
                  (click)="language.setLanguage(lang)"
                >
                  {{ lang.toUpperCase() }}
                </button>
              } @else {
                <button
                  type="button"
                  class="px-3 py-1 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-[#0a0a0a]/5"
                  aria-pressed="false"
                  (click)="language.setLanguage(lang)"
                >
                  {{ lang.toUpperCase() }}
                </button>
              }
            }
          </div>
        </div>

        <button
          type="button"
          class="ml-auto flex size-10 items-center justify-center border-[3px] border-[#0a0a0a] bg-white text-[#0a0a0a] md:hidden"
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
            stroke-width="2.5"
            class="size-5"
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
        <nav class="border-t-[3px] border-[#0a0a0a] bg-[#FF5C00] md:hidden">
          <div class="space-y-0 p-4">
            <a
              routerLink="/packs/francophone/request"
              class="block border-[3px] border-[#0a0a0a] bg-white px-6 py-4 text-center text-lg font-bold text-[#0a0a0a] transition-colors hover:bg-[#FFE600]"
              (click)="closeMobileMenu()"
            >
              {{ 'header.request' | transloco }}
            </a>
            @if (session.isAdmin()) {
              <a
                routerLink="/packs/francophone/admin/requests"
                class="mt-1 block border-[3px] border-[#0a0a0a] bg-white px-6 py-4 text-center text-lg font-bold text-[#0a0a0a] transition-colors hover:bg-[#FFE600]"
                (click)="closeMobileMenu()"
              >
                {{ 'header.adminRequests' | transloco }}
              </a>
            }
          </div>

          <div class="border-t-[3px] border-[#0a0a0a] p-4">
            @if (session.user(); as user) {
              <div class="mb-4 flex items-center gap-4">
                @if (user.imageUrl) {
                  <img
                    [src]="user.imageUrl"
                    [alt]="user.displayName"
                    class="h-12 w-12 shrink-0 border-[3px] border-[#0a0a0a] object-cover"
                  />
                } @else {
                  <span
                    class="flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-[#0a0a0a] bg-white/25 text-base font-bold text-white"
                  >
                    {{ initials(user.displayName) }}
                  </span>
                }
                <span class="truncate text-base font-bold text-white">{{ user.displayName }}</span>
              </div>
              <button
                type="button"
                class="block w-full border-[3px] border-[#0a0a0a] bg-white px-4 py-3 text-center text-base font-bold text-[#0a0a0a] transition-colors hover:bg-[#FFE600]"
                (click)="disconnect(); closeMobileMenu()"
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
                  class="mr-2 inline size-5"
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
                class="block w-full border-[3px] border-[#0a0a0a] bg-white px-4 py-4 text-center text-lg font-bold text-[#0a0a0a] transition-colors hover:bg-[#FFE600]"
                [disabled]="session.connecting()"
                (click)="openAuthModal(); closeMobileMenu()"
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
                  class="mr-2 inline size-5"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                </svg>
                {{ 'common.login' | transloco }}
              </button>
            }
          </div>

          <div class="border-t-[3px] border-[#0a0a0a] p-4">
            <div class="flex justify-center">
              <div
                class="inline-flex items-center border-[3px] border-[#0a0a0a] bg-white"
                role="group"
                aria-label="Language switcher"
              >
                @for (lang of language.supportedLanguages; track lang) {
                  @if (language.currentLanguage() === lang) {
                    <button
                      type="button"
                      class="bg-[#0a0a0a] px-4 py-2 text-base font-bold text-white"
                      aria-pressed="true"
                      (click)="language.setLanguage(lang); closeMobileMenu()"
                    >
                      {{ lang.toUpperCase() }}
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="px-4 py-2 text-base font-medium text-[#0a0a0a] hover:bg-[#0a0a0a]/5"
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
