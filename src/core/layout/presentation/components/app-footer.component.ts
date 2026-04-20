import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { PROJECT_INFO } from '../../../config/project-info';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer sm:footer-horizontal bg-neutral text-neutral-content px-10 py-12">
      <nav>
        <h6 class="footer-title">{{ 'footer.contact' | transloco }}</h6>
        <a
          [href]="'nostr:' + project.ownerNpub"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >
          {{ 'footer.dm' | transloco }}
        </a>
        <a
          [href]="'https://primal.net/p/' + project.ownerNpub"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >
          {{ 'footer.zapMe' | transloco }}
        </a>
      </nav>

      <nav>
        <h6 class="footer-title">{{ 'footer.credits' | transloco }}</h6>
        <a
          [href]="'nostr:' + project.calleNpub"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >
          @calle
        </a>
        <a
          [href]="project.followingSpaceUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >
          Following.space
        </a>
        <a
          [href]="project.followingSpaceGithub"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >
          GitHub
        </a>
      </nav>

      <nav>
        <h6 class="footer-title">{{ 'footer.legal' | transloco }}</h6>
        <a routerLink="/legal/cgu" class="link link-hover">
          {{ 'footer.cgu' | transloco }}
        </a>
      </nav>
    </footer>
  `,
})
export class AppFooterComponent {
  protected readonly project = PROJECT_INFO;
}
