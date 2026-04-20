import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

        <div class="ml-auto flex items-center gap-3">
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
      </div>
    </header>
  `,
})
export class AppHeaderComponent {
  protected readonly project = PROJECT_INFO;
  protected readonly language = inject(LanguageService);
  protected readonly session = inject(NostrSessionService);
  protected readonly zap = inject(ZapService);

  protected initials(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('');
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
