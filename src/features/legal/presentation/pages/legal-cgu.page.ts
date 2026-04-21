import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'legal-cgu-page',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header class="space-y-2">
        <h1 class="text-3xl font-bold">{{ 'cgu.title' | transloco }}</h1>
        <p class="text-sm text-base-content/50">{{ 'cgu.lastUpdated' | transloco }}</p>
      </header>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.purpose.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.purpose.body' | transloco }}
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.definitions.title' | transloco }}</h2>
        <dl class="space-y-1">
          <div class="flex gap-2">
            <dt class="font-medium">Nostr —</dt>
            <dd class="text-base-content/70">
              {{ 'cgu.sections.definitions.items.nostr' | transloco }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium">Relay —</dt>
            <dd class="text-base-content/70">
              {{ 'cgu.sections.definitions.items.relay' | transloco }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium">Starter pack —</dt>
            <dd class="text-base-content/70">
              {{ 'cgu.sections.definitions.items.starterPack' | transloco }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium">Zap —</dt>
            <dd class="text-base-content/70">
              {{ 'cgu.sections.definitions.items.zap' | transloco }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium">NIP-07 —</dt>
            <dd class="text-base-content/70">
              {{ 'cgu.sections.definitions.items.nip07' | transloco }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium">
              {{ 'cgu.sections.definitions.items.publicKey' | transloco }} —
            </dt>
            <dd class="text-base-content/70">
              {{ 'cgu.sections.definitions.items.privateKey' | transloco }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.service.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.service.body' | transloco }}
        </p>
        <ul class="list-disc list-inside space-y-1 text-base-content/70">
          <li>{{ 'cgu.sections.service.features.request' | transloco }}</li>
          <li>{{ 'cgu.sections.service.features.status' | transloco }}</li>
          <li>{{ 'cgu.sections.service.features.follow' | transloco }}</li>
          <li>{{ 'cgu.sections.service.features.zap' | transloco }}</li>
          <li>{{ 'cgu.sections.service.features.admin' | transloco }}</li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.access.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.access.body' | transloco }}
        </p>
        <ul class="list-disc list-inside space-y-1 text-base-content/70">
          <li>{{ 'cgu.sections.access.methods.extension' | transloco }}</li>
          <li>{{ 'cgu.sections.access.methods.external' | transloco }}</li>
          <li>{{ 'cgu.sections.access.methods.privateKey' | transloco }}</li>
        </ul>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.access.quiz' | transloco }}
        </p>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.access.free' | transloco }}
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.privacy.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.privacy.body' | transloco }}
        </p>
        <ul class="list-disc list-inside space-y-1 text-base-content/70">
          <li>{{ 'cgu.sections.privacy.items.public' | transloco }}</li>
          <li>{{ 'cgu.sections.privacy.items.noCollection' | transloco }}</li>
          <li>{{ 'cgu.sections.privacy.items.relayData' | transloco }}</li>
          <li>{{ 'cgu.sections.privacy.items.rgpd' | transloco }}</li>
          <li>{{ 'cgu.sections.privacy.items.cookies' | transloco }}</li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.zaps.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.zaps.body' | transloco }}
        </p>
        <div class="alert alert-warning">
          <p class="text-base-content/80 text-sm">
            {{ 'cgu.sections.zaps.disclaimer' | transloco }}
          </p>
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.ip.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">{{ 'cgu.sections.ip.body' | transloco }}</p>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.liability.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.liability.body' | transloco }}
        </p>
        <ul class="list-disc list-inside space-y-1 text-base-content/70">
          <li>{{ 'cgu.sections.liability.items.availability' | transloco }}</li>
          <li>{{ 'cgu.sections.liability.items.relayContent' | transloco }}</li>
          <li>{{ 'cgu.sections.liability.items.lightning' | transloco }}</li>
          <li>{{ 'cgu.sections.liability.items.thirdParty' | transloco }}</li>
        </ul>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.liability.limit' | transloco }}
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.changes.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.changes.body' | transloco }}
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.law.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.law.body' | transloco }}
        </p>
      </section>

      <section class="space-y-2">
        <h2 class="text-xl font-semibold">{{ 'cgu.sections.contact.title' | transloco }}</h2>
        <p class="text-base-content/70 leading-relaxed">
          {{ 'cgu.sections.contact.body' | transloco }}
        </p>
      </section>
    </main>
  `,
})
export class LegalCguPage {}
