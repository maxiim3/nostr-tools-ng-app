import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'legal-cgu-page',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="brutal-grid min-h-[calc(100vh-4rem)] mx-auto max-w-3xl px-6 py-16">
      <header class="mb-12 border-b-[3px] border-[#0a0a0a] pb-6">
        <h1 class="text-4xl font-extrabold text-[#0a0a0a]">{{ 'cgu.title' | transloco }}</h1>
        <p class="mt-2 text-sm text-[#0a0a0a]/50">{{ 'cgu.lastUpdated' | transloco }}</p>
      </header>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.purpose.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.purpose.body' | transloco }}
        </p>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.definitions.title' | transloco }}
        </h2>
        <dl class="space-y-3">
          <div class="border-l-[4px] border-[#ff5c00] pl-4">
            <dt class="font-bold text-[#0a0a0a]">Nostr</dt>
            <dd class="text-sm text-[#0a0a0a]/70">
              {{ 'cgu.sections.definitions.items.nostr' | transloco }}
            </dd>
          </div>
          <div class="border-l-[4px] border-[#ffe600] pl-4">
            <dt class="font-bold text-[#0a0a0a]">Relay</dt>
            <dd class="text-sm text-[#0a0a0a]/70">
              {{ 'cgu.sections.definitions.items.relay' | transloco }}
            </dd>
          </div>
          <div class="border-l-[4px] border-[#ff5c00] pl-4">
            <dt class="font-bold text-[#0a0a0a]">Starter pack</dt>
            <dd class="text-sm text-[#0a0a0a]/70">
              {{ 'cgu.sections.definitions.items.starterPack' | transloco }}
            </dd>
          </div>
          <div class="border-l-[4px] border-[#ffe600] pl-4">
            <dt class="font-bold text-[#0a0a0a]">Zap</dt>
            <dd class="text-sm text-[#0a0a0a]/70">
              {{ 'cgu.sections.definitions.items.zap' | transloco }}
            </dd>
          </div>
          <div class="border-l-[4px] border-[#ff5c00] pl-4">
            <dt class="font-bold text-[#0a0a0a]">NIP-07</dt>
            <dd class="text-sm text-[#0a0a0a]/70">
              {{ 'cgu.sections.definitions.items.nip07' | transloco }}
            </dd>
          </div>
          <div class="border-l-[4px] border-[#ffe600] pl-4">
            <dt class="font-bold text-[#0a0a0a]">
              {{ 'cgu.sections.definitions.items.publicKey' | transloco }}
            </dt>
            <dd class="text-sm text-[#0a0a0a]/70">
              {{ 'cgu.sections.definitions.items.privateKey' | transloco }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.service.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.service.body' | transloco }}
        </p>
        <ul class="mt-3 space-y-1.5">
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.service.features.request' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.service.features.status' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.service.features.follow' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.service.features.zap' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.service.features.admin' | transloco }}
          </li>
        </ul>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.access.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.access.body' | transloco }}
        </p>
        <ul class="mt-3 space-y-1.5">
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.access.methods.extension' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.access.methods.external' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.access.methods.privateKey' | transloco }}
          </li>
        </ul>
        <p class="mt-3 text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.access.request' | transloco }}
        </p>
        <p class="mt-2 text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.access.free' | transloco }}
        </p>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.privacy.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.privacy.body' | transloco }}
        </p>
        <ul class="mt-3 space-y-1.5">
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.privacy.items.public' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.privacy.items.noCollection' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.privacy.items.relayData' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.privacy.items.rgpd' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.privacy.items.cookies' | transloco }}
          </li>
        </ul>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.zaps.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.zaps.body' | transloco }}
        </p>
        <div class="mt-4 border-[3px] border-[#0a0a0a] bg-[#ffe600]/15 p-4 brutal-shadow-sm">
          <p class="text-sm font-bold text-[#0a0a0a]">
            {{ 'cgu.sections.zaps.disclaimer' | transloco }}
          </p>
        </div>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.ip.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">{{ 'cgu.sections.ip.body' | transloco }}</p>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.liability.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.liability.body' | transloco }}
        </p>
        <ul class="mt-3 space-y-1.5">
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.liability.items.availability' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.liability.items.relayContent' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.liability.items.lightning' | transloco }}
          </li>
          <li class="flex gap-2 text-[#0a0a0a]/70">
            <span class="text-[#ff5c00] font-bold">▪</span>
            {{ 'cgu.sections.liability.items.thirdParty' | transloco }}
          </li>
        </ul>
        <p class="mt-3 text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.liability.limit' | transloco }}
        </p>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.changes.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.changes.body' | transloco }}
        </p>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.law.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.law.body' | transloco }}
        </p>
      </section>

      <section class="mb-10">
        <h2
          class="text-lg font-extrabold text-[#0a0a0a] border-b-[2px] border-[#0a0a0a]/10 pb-2 mb-3"
        >
          {{ 'cgu.sections.contact.title' | transloco }}
        </h2>
        <p class="text-[#0a0a0a]/70 leading-relaxed">
          {{ 'cgu.sections.contact.body' | transloco }}
        </p>
      </section>
    </main>
  `,
})
export class LegalCguPage {}
