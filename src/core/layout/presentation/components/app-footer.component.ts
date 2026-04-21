import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { PROJECT_INFO } from '../../../config/project-info';
import { FollowService } from '../../../nostr/application/follow.service';
import { NostrSessionService } from '../../../nostr/application/nostr-session.service';
import { ZapService } from '../../../zap/zap.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t-[3px] border-[#0a0a0a] bg-[#0a0a0a] text-white">
      <div class="mx-auto max-w-7xl px-6 py-10">
        <div class="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <nav>
            <h6
              class="mb-4 text-xs font-bold uppercase tracking-widest text-[#FFE600]"
            >
              {{ 'footer.contact' | transloco }}
            </h6>
            <div class="space-y-2">
              <a
                [href]="project.primalProfileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block text-sm text-white/70 transition-colors hover:text-white hover:underline hover:decoration-[#FFE600] hover:decoration-[3px] hover:underline-offset-4"
              >
                {{ 'footer.dm' | transloco }}
              </a>
              <button
                type="button"
                class="block text-sm text-white/70 transition-colors hover:text-white hover:underline hover:decoration-[#FFE600] hover:decoration-[3px] hover:underline-offset-4"
                (click)="followOwner()"
              >
                @if (followSuccess()) {
                  {{ 'footer.followed' | transloco }}
                } @else {
                  {{ 'footer.follow' | transloco }}
                }
              </button>
              <button
                type="button"
                class="block text-sm text-white/70 transition-colors hover:text-white hover:underline hover:decoration-[#FFE600] hover:decoration-[3px] hover:underline-offset-4"
                (click)="zap.openModal()"
              >
                {{ 'footer.support' | transloco }}
              </button>
            </div>
          </nav>

          <nav>
            <h6
              class="mb-4 text-xs font-bold uppercase tracking-widest text-[#FFE600]"
            >
              {{ 'footer.credits' | transloco }}
            </h6>
            <div class="space-y-2">
              <a
                [href]="'https://njump.me/' + project.calleNpub"
                target="_blank"
                rel="noopener noreferrer"
                class="block text-sm text-white/70 transition-colors hover:text-white hover:underline hover:decoration-[#FFE600] hover:decoration-[3px] hover:underline-offset-4"
              >
                @calle
              </a>
              <a
                [href]="project.followingSpaceUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block text-sm text-white/70 transition-colors hover:text-white hover:underline hover:decoration-[#FFE600] hover:decoration-[3px] hover:underline-offset-4"
              >
                Following.space
              </a>
              <a
                [href]="project.followingSpaceGithub"
                target="_blank"
                rel="noopener noreferrer"
                class="block text-sm text-white/70 transition-colors hover:text-white hover:underline hover:decoration-[#FFE600] hover:decoration-[3px] hover:underline-offset-4"
              >
                GitHub
              </a>
            </div>
          </nav>

          <nav>
            <h6
              class="mb-4 text-xs font-bold uppercase tracking-widest text-[#FFE600]"
            >
              {{ 'footer.legal' | transloco }}
            </h6>
            <div class="space-y-2">
              <a
                routerLink="/legal/cgu"
                class="block text-sm text-white/70 transition-colors hover:text-white hover:underline hover:decoration-[#FFE600] hover:decoration-[3px] hover:underline-offset-4"
              >
                {{ 'footer.cgu' | transloco }}
              </a>
            </div>
          </nav>
        </div>

        <div class="mt-10 border-t border-white/10 pt-6 text-center">
          <span class="modak-regular text-2xl text-white/30">ToolStr</span>
        </div>
      </div>
    </footer>
  `,
})
export class AppFooterComponent {
  protected readonly project = PROJECT_INFO;
  protected readonly zap = inject(ZapService);
  private readonly session = inject(NostrSessionService);
  private readonly followService = inject(FollowService);

  readonly followSuccess = signal(false);

  async followOwner(): Promise<void> {
    if (!this.session.isAuthenticated() || this.followSuccess()) return;

    try {
      await this.followService.followOwner();
      this.followSuccess.set(true);
    } catch {
      // silently ignore
    }
  }
}
