import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'pack-fr-page',
  imports: [RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="brutal-grid relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6"
    >
      <div class="relative z-10 max-w-3xl space-y-10 text-center">
        <div>
          <span class="brutal-sticker -rotate-2 bg-[#FFE600] text-xs text-[#0a0a0a]">
            FRANCOPHONE ⚡
          </span>
        </div>

        <h1
          class="text-6xl font-extrabold leading-[0.9] tracking-tight text-[#0a0a0a] md:text-8xl lg:text-9xl"
        >
          <span data-title="TOOLSTR">{{ 'home.title' | transloco }}</span>
        </h1>

        <p class="mx-auto max-w-lg text-lg leading-relaxed text-[#0a0a0a]/60">
          {{ 'home.description' | transloco }}
        </p>

        <div>
          <a
            routerLink="/packs/francophone/request"
            class="btn btn-cta btn-lg h-auto whitespace-pre-line px-8 py-4 text-lg leading-tight"
          >
            {{ 'home.cta' | transloco }}
          </a>
        </div>
      </div>
    </main>
  `,
})
export class PackFRPage {}
