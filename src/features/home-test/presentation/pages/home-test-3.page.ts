import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'home-test-3-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="brutal-grid min-h-[calc(100vh-4rem)] px-6 py-12 text-[#0a0a0a]">
      <section class="mx-auto max-w-6xl space-y-6">
        <span class="brutal-sticker -rotate-1 bg-white text-xs text-[#0a0a0a]"
          >TOOLSTR · NOSTR FRANCOPHONE</span
        >
        <h1
          class="max-w-4xl text-balance text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl lg:text-8xl"
        >
          Moins de friction. Plus de liens. Un Nostr francophone plus accessible.
        </h1>
        <p class="max-w-3xl text-base leading-8 text-[#0a0a0a]/75 md:text-lg">
          Commence avec le starter pack, decouvre les bons profils, puis retrouve ici les outils
          utiles pour explorer Nostr sans partir de zero.
        </p>
      </section>

      <section class="mx-auto mt-12 max-w-6xl">
        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article class="border-[3px] border-[#0a0a0a] bg-[#FF5C00] p-6 text-white">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-2xl font-extrabold">Starter pack francophone</h2>
              <span
                class="border-[2px] border-[#0a0a0a] bg-white px-2 py-1 text-xs font-bold uppercase text-[#0a0a0a]"
                >Disponible</span
              >
            </div>
            <p class="mt-4 text-sm leading-7 text-white/85 md:text-base">
              Le point d'entree pour suivre rapidement des profils francophones actifs et savoir qui
              ecouter au depart.
            </p>
            <a
              routerLink="/packs/francophone/request"
              class="btn btn-sm mt-6 h-auto min-h-11 bg-white px-6 py-3 text-sm text-[#0a0a0a] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Demander l'acces
            </a>
          </article>

          <article class="border-[3px] border-[#0a0a0a] bg-white p-6">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-2xl font-extrabold">Fusion des listes</h2>
              <span
                class="border-[2px] border-[#0a0a0a] bg-white px-2 py-1 text-xs font-bold uppercase"
                >Bientot</span
              >
            </div>
            <p class="mt-4 text-sm leading-7 text-[#0a0a0a]/75 md:text-base">
              Un outil pour fusionner plusieurs listes Nostr et construire plus vite une selection
              utile.
            </p>
            <button
              type="button"
              disabled
              class="btn btn-sm mt-6 h-auto min-h-11 px-6 py-3 text-sm"
            >
              En construction
            </button>
          </article>

          <article
            class="border-[3px] border-[#0a0a0a] bg-[#f4f4f4] p-6 md:col-span-2 xl:col-span-1"
          >
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-2xl font-extrabold text-[#0a0a0a]/75">Onboarding Nostr</h2>
              <span
                class="border-[2px] border-[#0a0a0a] bg-white px-2 py-1 text-xs font-bold uppercase text-[#0a0a0a]/80"
                >Bientot</span
              >
            </div>
            <p class="mt-4 text-sm leading-7 text-[#0a0a0a]/60 md:text-base">
              Un parcours pour comprendre Nostr et demarrer avec de bons reperes, cote utilisateur
              comme cote developpeur.
            </p>
            <button
              type="button"
              disabled
              class="btn btn-sm mt-6 h-auto min-h-11 px-6 py-3 text-sm opacity-70"
            >
              En construction
            </button>
          </article>
        </div>
      </section>

      <section class="mx-auto mt-14 max-w-6xl border-[3px] border-[#0a0a0a] bg-white p-8">
        <h2 class="text-balance text-3xl font-extrabold md:text-5xl">
          ToolStr commence simple, mais n'est pas pense petit.
        </h2>
        <p class="mt-4 max-w-4xl text-sm leading-7 text-[#0a0a0a]/75 md:text-base">
          Chaque outil doit repondre a une friction reelle : trouver qui suivre, comprendre les
          usages, soutenir les bons projets, puis avancer dans Nostr avec plus de reperes.
        </p>
      </section>
    </main>
  `,
})
export class HomeTest3Page {}
