# Plan d'exécution — NostrTools Gate 0 + patch handoff

Fichier d'état pour reprise de session. Source : `NOSTRTOOLS_HANDOFF.md` + plan validé dans `/home/maxime/.claude/plans/nostrtools-handoff-md-salut-analyse-le-delightful-leaf.md`.

---

## Décisions actées (ne pas redébattre)

- **Ordre** : patch handoff (Partie A) + Gate 0 (Partie B) en parallèle
- **Kinds Nostr** : hybride — pack cible reste `kind 39089` (Following.space), requests/décisions sur kinds libres `30100` / `30101`
- **i18n** : `@jsverse/transloco` (signals-friendly, runtime switch)
- **Admin** : liste d'npubs dans `PackConfig.adminNpubs` (§27), comparaison avec pubkey NIP-07 au runtime, pas de backend
- **Validation** : `opencode run` en fin de Partie A puis Partie B ; reboucler si désaccord

## État projet (déjà installé)

- Angular 21.1 + Bun 1.2.13 + Tailwind v4 (`@tailwindcss/postcss`)
- Vitest (pas Karma)
- `AGENTS.md` + `.claude/CLAUDE.md` avec best practices Angular
- `src/app/` : shell App minimal, routes vides

---

## Partie A — Patch `NOSTRTOOLS_HANDOFF.md`

### ✅ Fait

- **A1 partiel** — hiérarchie markdown `##` → `###` (et `###` → `####` pour sub-sub) :
  - §3 Gates 0 à 5
  - §5 Création du projet, daisyUI, MCP Angular, Évaluation IA
  - §6 Obligations, Interdictions
  - §8 Nom global, Nature du produit, Important
  - §9 Visibilité des routes
  - §10 toutes les routes `/`, `/design-system`, `/tools/merge-followers`, `/packs/francophone`, `/packs/francophone/feed`, `/packs/francophone/request`, `/packs/francophone/admin`, `/packs/francophone/admin/requests`, `/legal/cgu`
  - §11 Inclus, Exclu pour l'instant
  - §12 Principe général, Définition des couches (+ sub-sub `domain`/`application`/`infrastructure`/`presentation` promus en `####`), Règles de dépendance, Dossier `shared`
  - §13 Définitions (+ sub-sub Atom/Molecule/Organism/Template/Page en `####`), Règles importantes, Variantes vs composants séparés
  - §14 États à prévoir (+ sub-sub Texte/Titre/Bouton/Lien/Carte en `####`)
  - §17 Ton général, Palette imposée, Usage recommandé, Thème
  - §19 Données à afficher + sub-sub `#### Moi`
- **A7** — §5 "MCP daisyUI" remplacé par "Support éditeur daisyUI" (pas de MCP officiel)

### ❌ Reste à faire (A1 fin)

- §19 : `### Calle` → `#### Calle`, `## Crédit Calle — obligation produit` → `###`
- §20 : `## Librairie principale`, `## Auth`, `## Relays`, `## Pack cible` → `###`
- §21 : `## Accès`, `## But` (dup avec §23), `## Entrées source acceptées`, `## Structure visuelle obligatoire`, `## Ordre de présentation obligatoire` (+ sub-sub `### Groupe 1/2/3` → `####`), `## Règles UX obligatoires`, `## Actions attendues` → `###`
- §22 : `## Route` (dup §23), `## Scope initial`, `## Non-scope initial feed` → `###`
- §23 : `## Route` (dup §22), `## But` (dup §21), `## Flow`, `## États à gérer` → `###` (utiliser contexte pour dédoublonner)
- §24 : `## \`/packs/francophone/admin\`` et `## \`/packs/francophone/admin/requests\`` → `###` (dup avec §10, utiliser contexte "Fonctions attendues")
- §25 : `## Event de demande`, `## Event de décision admin`, `## Statut calculé` → `###`
- §27 : `## Pack initial` → `###`

### ❌ A2 — kinds Nostr (§25)

- `kind 34550` → `kind 30100` (request)
- `kind 34551` → `kind 30101` (decision admin)
- Ajouter note : *"Les kinds 34550/34551 sont réservés par NIP-72. Le pack cible reste `kind 39089` (Following.space) ; les events de demande/décision utilisent des kinds addressables libres en 30100–30199."*

### ❌ A3 — §20 Librairie principale

Ajouter :
- `@nostr-dev-kit/ndk-cache-dexie` pour cache IndexedDB
- Détection NIP-07 via `window.nostr` au boot ; fallback lecture seule

### ❌ A4 — §7 i18n lib

Ajouter : *"Lib retenue : `@jsverse/transloco` (runtime switch, signals-friendly, recommandé Angular 21). Persistance `localStorage`. Détection initiale via `navigator.language` avec fallback `fr`."*

### ❌ A5 — §26 mécanisme admin

Remplacer "admin = configuration explicite du pack" par : *"Les admins d'un pack sont définis dans `PackConfig.adminNpubs` (voir §27). Au runtime, la pubkey NIP-07 courante est comparée à cette liste pour autoriser l'accès aux routes `/packs/*/admin/**` et `/tools/**`. Route guards Angular (`CanMatch` fonctionnels)."*

### ❌ A6 — §5 Tailwind explicite

Ajouter avant sous-section daisyUI :
```bash
bun i -D tailwindcss@^4 @tailwindcss/postcss@^4
```
Note : *"Déjà installé si le projet vient de `ng new --style=css` + config `.postcssrc.json`."*

### ❌ A8 — §3 Gate 0 NDK

Remplacer dans la liste "Le LLM doit uniquement" le point "configurer les dépendances Nostr" par : *"8. installer NDK (`@nostr-dev-kit/ndk`) et son cache Dexie, sans créer de service applicatif ni de composant qui l'utilise"*

### ❌ A9 — §33 critères Gate 1–5

Ajouter après §33 (contenu complet dans plan `.claude/plans/nostrtools-handoff-md-salut-analyse-le-delightful-leaf.md` partie A9).

### ❌ Validation Partie A

```bash
opencode run "Review NOSTRTOOLS_HANDOFF.md. Check: markdown hierarchy is consistent (# doc title, ## numbered sections, ### sub-sections, #### sub-sub), kinds Nostr are 30100/30101 not 34550/34551, exit criteria exist for Gates 1-5. Output disagreements only."
```

Reboucler si désaccord.

---

## Partie B — Gate 0 setup (zéro produit)

### ❌ B1 — daisyUI

```bash
bun i -D daisyui@latest
```

Modifier `src/styles.css` :
```css
@import "tailwindcss";
@plugin "daisyui";
```

### ❌ B2 — NDK + cache Dexie

```bash
bun i @nostr-dev-kit/ndk @nostr-dev-kit/ndk-cache-dexie
```

**Ne pas créer de service NDK.**

### ❌ B3 — Transloco

```bash
bun x ng add @jsverse/transloco
```

- Langues : `['fr', 'en', 'es']`, default `'fr'`
- Fichiers : `src/assets/i18n/{fr,en,es}.json` squelettes `{}`
- `app.config.ts` intègre `provideTransloco`

### ❌ B4 — LanguageService

Créer `src/shared/i18n/language.service.ts` (signal + effect + persistance localStorage + détection navigator.language, fallback `fr`). Contenu complet dans plan `.claude/plans/...` partie B4.

### ❌ B5 — .mcp.json

Créer `.mcp.json` à la racine :
```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "bunx",
      "args": ["@angular/cli", "mcp"]
    }
  }
}
```

### ❌ B6 — Vérif boot

```bash
bun start
```

Attendu : serveur sur `:4200`, aucun warning bloquant, Tailwind + daisyUI + Transloco OK.

### ❌ Validation Partie B

```bash
opencode run "Review Gate 0 setup in nostr-tools-ng-app. Check: daisyUI v5 plugin loaded in styles.css, NDK + ndk-cache-dexie installed but no applicative service created, Transloco configured with fr/en/es and default fr, LanguageService uses signals + localStorage + navigator fallback, .mcp.json has angular-cli server, bun start succeeds. Output disagreements only."
```

Reboucler si désaccord.

---

## Hors scope Gate 0 (Gates 2+)

- Pages métier (`/`, `/design-system`, `/packs/*`, `/tools/*`, `/legal/*`)
- Composants UI (atoms, molecules, organisms)
- Service NDK applicatif (connexion, subscribe, publish)
- Guards admin actifs
- Design system

---

## Reprise de session

Commencer par : finir A1 (§19 Calle → §27 Pack initial), puis A2→A9 dans l'ordre, puis opencode Partie A, puis B1→B6, puis opencode Partie B.
