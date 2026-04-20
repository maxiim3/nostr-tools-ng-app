import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'legal-cgu-page',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <h1 class="text-3xl font-bold">{{ 'cgu.title' | transloco }}</h1>
      <p class="text-base-content/70">{{ 'cgu.placeholder' | transloco }}</p>
    </main>
  `,
})
export class LegalCguPage {}
