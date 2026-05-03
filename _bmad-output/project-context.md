---
project_name: nostr-tools-ng-app
user_name: Maxime
date: 2026-04-30
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
existing_patterns_found: 8
status: complete
rule_count: 60
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- Angular `^21.1.0` with standalone components and `@angular/build:application`.
- TypeScript `~5.9.2` with strict compiler settings and strict Angular templates.
- Bun `1.2.13` is the package manager and API runtime.
- RxJS `~7.8.0` is available; Angular local state primarily uses signals.
- Transloco `^8.3.0` handles i18n with `fr` default/fallback.
- Nostr stack: `nostr-tools ^2.23.3`, `@nostr-dev-kit/ndk ^3.0.3`, `@nostr-dev-kit/ndk-cache-dexie ^2.6.44`.
- Styling uses Tailwind CSS `^4.1.12` and DaisyUI `^5.5.19`.
- Tests use Vitest `^4.0.8` via Angular unit-test builder.
- Backend API is `server.mjs` running on Bun, with Supabase persistence server-side only.

## Critical Implementation Rules

### Language-Specific Rules

- Keep `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `isolatedModules`, and Angular `strictTemplates` constraints in mind when editing.
- Prefer `unknown` over `any`; note ESLint currently allows explicit `any`, but project guidance still discourages it.
- Use type-only imports for pure types, as seen with `import type { ... }`.
- Keep domain models and pure functions free of Angular dependencies.
- Convert Observable HTTP calls to Promises with `firstValueFrom` in application services when matching existing service style.
- Handle caught errors as `unknown` and narrow with `instanceof`, e.g. `HttpErrorResponse` or `Error`.
- Guard browser globals with `typeof globalThis`, `typeof navigator`, or injected Angular tokens when code may run outside a browser context.

### Framework-Specific Rules

- Use standalone Angular components; do not set `standalone: true` because Angular v20+ makes it the default.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` on components.
- Use `input()`, `output()`, `signal()`, and `computed()` for component state and APIs; do not use signal `mutate`.
- Use `inject()` instead of constructor injection in Angular services/components, unless extending a non-Angular base class requires a constructor.
- Use lazy `loadComponent` routes for pages.
- Use native template control flow (`@if`, `@for`, `@switch`), not structural directives.
- Do not use `ngClass` or `ngStyle`; use class/style bindings.
- Keep presentation code thin: page components call application services and must not contain raw relay, NDK, or Supabase logic.
- Keep app session frontend-local; backend remains stateless and protected calls are signed request-by-request with NIP-98.
- Transloco keys are resolved in templates with `TranslocoPipe`; default/fallback language is `fr`.

### Testing Rules

- Place tests next to implementation files as `*.spec.ts`.
- Use Vitest globals through `tsconfig.spec.json`; run tests through `bun run test`, not direct `vitest`.
- Keep reusable test doubles under `testing/fakes` or `testing/contracts` inside the relevant domain/core area.
- Test pure domain functions directly without Angular TestBed.
- Test application orchestration by injecting fakes/stubs for ports and signers.
- For Angular UI behavior, prefer focused component/page tests that verify user-visible state, guards, and service interaction.
- Add or update tests when changing connection flows, NIP-98 signing, admin authorization, request status resolution, or Supabase API behavior.

### Code Quality & Style Rules

- Follow feature-first pseudo-DDD layout: `domain`, `application`, `infrastructure`, `presentation`.
- `domain` must contain only business types, value objects, and pure rules; no Angular, UI, Nostr, HTTP, or Supabase dependencies.
- `application` may orchestrate use cases and ports, but must not depend on UI components.
- `infrastructure` contains technical adapters such as Nostr/NDK, relay, serialization, or port implementations.
- `shared` is strict: only genuinely reusable UI primitives, tokens, pure helpers, or cross-cutting simple types.
- Use kebab-case filenames with suffixes that match the role: `.service.ts`, `.page.ts`, `.component.ts`, `.guard.ts`, `.config.ts`.
- Keep comments rare and useful; prefer self-explanatory code and focused README updates for workflow documentation.
- Preserve existing French-first product/i18n content unless explicitly asked to change content language.
- Style linting covers `src/**/*.css`; keep Tailwind/DaisyUI utility usage consistent with existing templates.

### Development Workflow Rules

- Maintained Nostr and Lightning protocol/architecture documentation lives in `docs/`.
- Use `docs/` for auth, signer, zap, LNURL, NWC, and Lightning integration context before changing those areas.
- BMAD artifacts in `_bmad-output/` can inform planning, but generated output does not override current implementation facts or maintained protocol documentation.
- Use repo scripts from `package.json`: `bun run format`, `bun run lint`, `bun run lint:css`, `bun run typecheck`, `bun run test`, `bun run build`, `bun run fix`, `bun run check`.
- Do not invoke underlying tools directly (`ng lint`, `tsc`, `vitest`, `prettier`) unless explicitly requested.
- Commit format is `feat: <short lowercase description>` with no scope/body unless necessary.
- One logical change per commit; do not commit unless explicitly asked.

### Critical Don't-Miss Rules

- Never expose `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in Angular; Supabase access is server-only through `server.mjs`.
- Angular must call the Bun API for pack membership; it must not write directly to Supabase.
- Protected frontend API calls must include NIP-98 authorization generated from the current Nostr signer.
- Admin checks exist in both UI (`NostrSessionService.isAdmin()`) and backend (`ADMIN_NPUBS`); never rely on UI-only authorization.
- Do not introduce a backend session model for Nostr auth unless explicitly designed; current auth is local frontend state plus per-request NIP-98.
- Do not put raw NDK/relay logic into page components; route through core/application services.
- Preserve connection semantics: `startConnection()` creates an attempt, `completeCurrentAttempt()` completes it, and NIP-46 completion may wait for external approval.
- For NIP-46 bunker tokens, validate `bunker://`, bunker pubkey, and relay presence before attempting connection.
- Do not treat `shared/` as a dumping ground for feature-specific logic.
- Maintain WCAG AA/accessibility expectations when editing UI; Angular template accessibility lint rules are enabled.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code.
- Follow all rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new project-specific implementation patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update it when the technology stack or architecture rules change.
- Review periodically for outdated rules.
- Remove rules that become obvious or stop preventing mistakes.

Last Updated: 2026-04-30
