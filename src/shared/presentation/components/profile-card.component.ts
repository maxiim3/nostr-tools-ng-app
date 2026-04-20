import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

export type ProfileCardStatus = 'skeleton' | 'muted' | 'success' | 'transparent';

export interface ProfileCardUser {
  displayName: string;
  imageUrl: string | null;
  description: string | null;
}

@Component({
  selector: 'app-profile-card',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card card-border relative h-52 w-96 overflow-hidden bg-base-100">
      <section class="card-body gap-4">
        @if (status() === 'skeleton') {
          <header class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-full skeleton"></div>
            <div class="space-y-2">
              <div class="h-5 w-32 rounded-full skeleton"></div>
              <div class="h-4 w-24 rounded-full skeleton"></div>
            </div>
          </header>

          <div class="space-y-2">
            <div class="h-4 w-full rounded-full skeleton"></div>
            <div class="h-4 w-11/12 rounded-full skeleton"></div>
            <div class="h-4 w-8/12 rounded-full skeleton"></div>
          </div>
        } @else {
          <header class="flex items-center gap-4">
            @if (user()?.imageUrl; as imageUrl) {
              <img
                [src]="imageUrl"
                [alt]="avatarAlt()"
                class="h-12 w-12 rounded-full object-cover"
                loading="lazy"
              />
            } @else {
              <span class="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-content">
                {{ initials() }}
              </span>
            }

            <div class="min-w-0">
              <h2 class="card-title truncate">{{ user()?.displayName ?? ('profile.unknownUser' | transloco) }}</h2>
            </div>
          </header>

          <p class="line-clamp-2 text-sm leading-6 text-base-content/75">
            {{ truncatedDescription() || ('profile.noDescription' | transloco) }}
          </p>
        }
      </section>

      @if (overlayClass(); as overlayClass) {
        <div [class]="overlayClass" aria-hidden="true"></div>
      }
    </article>
  `
})
export class ProfileCardComponent {
  readonly user = input<ProfileCardUser | null>(null);
  readonly status = input<ProfileCardStatus>('transparent');

  protected readonly overlayClass = computed(() => {
    switch (this.status()) {
      case 'muted':
        return 'absolute inset-0 bg-white/60';
      case 'success':
        return 'absolute inset-0 bg-success/10';
      case 'transparent':
        return 'absolute inset-0 bg-transparent';
      default:
        return null;
    }
  });

  protected readonly avatarAlt = computed(() => {
    const displayName = this.user()?.displayName ?? 'Unknown user';
    return `${displayName} avatar`;
  });

  protected readonly initials = computed(() => {
    const displayName = this.user()?.displayName ?? '';

    return displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('') || '?';
  });

  protected readonly truncatedDescription = computed(() => {
    const raw = this.user()?.description?.trim() ?? null;
    const max = 65;
    if (!raw) return null;
    return raw.length > max ? raw.slice(0, max).trimEnd() + '…' : raw;
  });
}
