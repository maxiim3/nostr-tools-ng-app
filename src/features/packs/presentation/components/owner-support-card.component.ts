import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { FollowService } from '../../../../core/nostr/application/follow.service';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { ZapService } from '../../../../core/zap/zap.service';

@Component({
  selector: 'owner-support-card',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-md rounded-2xl bg-neutral p-6 text-center text-neutral-content">
      <div class="mb-4 flex items-center justify-center gap-4">
        <img
          [src]="ownerAvatarUrl"
          width="48"
          height="48"
          class="size-12 shrink-0 rounded-full object-cover ring-2 ring-white/10"
          alt=""
        />
        <p class="text-left text-sm leading-relaxed text-neutral-content/80">
          {{ 'supportCard.message' | transloco }}
        </p>
      </div>

      <div class="flex items-center justify-center gap-3">
        <button
          type="button"
          class="btn btn-outline btn-sm border-neutral-content/30 text-neutral-content hover:bg-neutral-content/10"
          [disabled]="followLoading()"
          (click)="followOwner()"
        >
          @if (followSuccess()) {
            {{ 'supportCard.followed' | transloco }}
          } @else {
            {{ 'supportCard.follow' | transloco }}
          }
        </button>
        <button type="button" class="btn btn-primary btn-sm" (click)="zap.openModal()">
          {{ 'supportCard.zap' | transloco }}
        </button>
      </div>
    </div>
  `,
})
export class OwnerSupportCardComponent {
  private readonly session = inject(NostrSessionService);
  private readonly followService = inject(FollowService);

  protected readonly zap = inject(ZapService);

  readonly ownerAvatarUrl =
    'https://r2.primal.net/cache/d/92/a3/d92a3ef8147c76b829c712ede63a03899ff844bc7027e8dc9d1cdf8cbd6aab1c.jpg';
  readonly followLoading = signal(false);
  readonly followSuccess = signal(false);

  async followOwner(): Promise<void> {
    if (!this.session.isAuthenticated() || this.followLoading()) return;

    this.followLoading.set(true);
    try {
      await this.followService.followOwner();
      this.followSuccess.set(true);
    } finally {
      this.followLoading.set(false);
    }
  }
}
