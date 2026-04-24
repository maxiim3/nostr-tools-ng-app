import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'home-test-3-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="brutal-grid min-h-[calc(100vh-4rem)] px-6 py-12 text-[#0a0a0a]">
      <section class="mx-auto max-w-6xl space-y-6">
        <span class="brutal-sticker -rotate-1 bg-white text-xs text-[#0a0a0a]">TOOLSTR · TOOLBOARD</span>
        <h1 class="max-w-4xl text-balance text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl lg:text-8xl">
          Une home pensee comme tableau d'outils, faite pour evoluer sans perdre son style.
        </h1>
        <p class="max-w-3xl text-base leading-8 text-[#0a0a0a]/75 md:text-lg">
          Cette version assume une logique scalable. Chaque bloc correspond a un module concret de
          ToolStr, avec un statut clair pour ne pas survendre ce qui n'est pas encore en ligne.
        </p>
      </section>

      <section class="mx-auto mt-12 max-w-6xl">
        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article class="border-[3px] border-[#0a0a0a] bg-white p-6">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-2xl font-extrabold">Starter pack francophone</h2>
              <span class="border-[2px] border-[#0a0a0a] bg-[#FFE600] px-2 py-1 text-xs font-bold uppercase">Disponible</span>
            </div>
            <p class="mt-4 text-sm leading-7 text-[#0a0a0a]/75 md:text-base">
              Le module d'onboarding actif pour rejoindre rapidement les profils francophones.
            </p>
            <a
              routerLink="/packs/francophone/request"
              class="btn btn-cta btn-sm mt-6 h-auto min-h-11 px-6 py-3 text-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#0a0a0a]"
            >
              Ouvrir
            </a>
          </article>

          <article class="border-[3px] border-[#0a0a0a] bg-white p-6">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-2xl font-extrabold">Profils recommandes</h2>
              <span class="border-[2px] border-[#0a0a0a] bg-white px-2 py-1 text-xs font-bold uppercase">Bientot</span>
            </div>
            <p class="mt-4 text-sm leading-7 text-[#0a0a0a]/75 md:text-base">
              Un module dedie a la decouverte de profils par theme pour accelerer l'exploration.
            </p>
            <button type="button" disabled class="btn btn-sm mt-6 h-auto min-h-11 px-6 py-3 text-sm">En preparation</button>
          </article>

          <article class="border-[3px] border-[#0a0a0a] bg-[#FF5C00] p-6 text-white md:col-span-2 xl:col-span-1">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-2xl font-extrabold">Soutien & zaps</h2>
              <span class="border-[2px] border-[#0a0a0a] bg-white px-2 py-1 text-xs font-bold uppercase text-[#0a0a0a]">Actif</span>
            </div>
            <p class="mt-4 text-sm leading-7 text-white/85 md:text-base">
              Une couche de soutien communautaire deja presente pour faire vivre l'ecosysteme.
            </p>
            <a
              routerLink="/packs/francophone/request"
              class="btn btn-sm mt-6 h-auto min-h-11 bg-white px-6 py-3 text-sm text-[#0a0a0a] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Voir le parcours
            </a>
          </article>
        </div>
      </section>

      <section class="mx-auto mt-14 max-w-6xl border-[3px] border-[#0a0a0a] bg-white p-8">
        <h2 class="text-balance text-3xl font-extrabold md:text-5xl">Le style reste brutaliste, la structure devient extensible.</h2>
        <p class="mt-4 max-w-4xl text-sm leading-7 text-[#0a0a0a]/75 md:text-base">
          Ce format permet de brancher de nouveaux modules sans recoder la landing complete. Chaque ajout
          reste lisible, priorise l'action, et conserve l'identite forte de ToolStr.
        </p>
      </section>
    </main>
  `,
})
export class HomeTest3Page {}
