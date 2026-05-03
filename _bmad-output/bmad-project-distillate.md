---
type: bmad-distillate
sources:
  - '../README.md'
  - '../AGENTS.md'
  - 'project-context.md'
  - '../docs/README.md'
  - '../docs/product/roadmap.md'
  - '../docs/features/README.md'
  - '../docs/architecture/overview.md'
  - '../docs/architecture/decisions/README.md'
  - '../docs/auth/nostr-auth-rules.md'
  - '../docs/auth/mobile-auth-notes.md'
  - '../src/README.md'
  - '../src/core/README.md'
  - '../src/core/nostr/README.md'
  - '../src/core/nostr-connection/README.md'
  - '../src/features/packs/README.md'
downstream_consumer: 'BMAD agents for brownfield product, architecture, planning, and implementation context'
created: '2026-04-30'
token_estimate: 5495
parts: 1
---

## Product Snapshot

- ToolStr (`nostr-tools-ng-app`): existing Angular/Nostr app for francophone starter pack workflows; local frontend uses `bun install` + `bun run start` at `http://localhost:4200`; local API uses `bun run api` with Bun `server.mjs` at `http://127.0.0.1:3000`; source: `README.md`.
- Product core: Nostr authentication via NIP-07, NIP-46, and `nsec`; NIP-98 signed API requests; immediate francophone pack admission; Supabase-backed member persistence; protected admin UI for listing/removing members; Nostr event publication for follow list and DM; sources: `README.md`, `src/core/nostr/README.md`, `src/features/packs/README.md`.
- French-first product: Transloco default/fallback language `fr`; preserve French-first product/i18n content unless requested; sources: `_bmad-output/project-context.md`, `AGENTS.md`.
- Current milestone M1: pack francophone active; objective = immediate join flow plus admin backoffice to view/remove members; acceptance = auto-admission, protected member table, protected remove action, Supabase persistence across redeploys, clear extension loading feedback, session restore where supported, stable mobile auth, `bunker://` not presented as mainstream path; source: `docs/product/roadmap.md`.
- Later milestones: M2 merge followers tool for admin/operator comparing source/target follow lists; M3 public read-only kind 1 feed from francophone pack members; source: `docs/product/roadmap.md`.

## Current Architecture

- Stack: Angular `^21.1.0`, TypeScript `~5.9.2`, Bun `1.2.13`, RxJS `~7.8.0`, `@jsverse/transloco ^8.3.0`, `nostr-tools ^2.23.3`, `@nostr-dev-kit/ndk ^3.0.3`, `@nostr-dev-kit/ndk-cache-dexie ^2.6.44`, Tailwind CSS `^4.1.12`, DaisyUI `^5.5.19`, Vitest `^4.0.8`; source: `_bmad-output/project-context.md`.
- Layout: feature-first pseudo-DDD/hexagonal Angular app; `src/app` routes/config/root component; `src/core` cross-cutting services; `src/features` product features; `src/shared` only generic UI primitives/design tokens/pure helpers/simple shared types; source: `docs/architecture/overview.md`.
- Feature layers: `domain` = pure business types/value objects/rules/functions with no Angular/UI/Nostr/HTTP/Supabase; `application` = use cases/orchestration/ports with no UI dependencies; `infrastructure` = Nostr/NDK/HTTP/Supabase/relay/event adapters and port implementations; `presentation` = Angular pages/components/view models/UI state/template bindings; dependency direction presentation -> application -> domain, infrastructure implements ports; sources: `docs/architecture/overview.md`, `_bmad-output/project-context.md`.
- Backend: Bun `server.mjs` plus Supabase; API endpoints include `GET /api/health` unauthenticated, `GET /api/pack-members/me` NIP-98, `POST /api/pack-members` NIP-98 immediate admission, `GET /api/admin/pack-members` NIP-98 admin, `POST /api/admin/pack-members/:pubkey/remove` NIP-98 admin; source: `src/features/packs/README.md`.
- Supabase: `francophone_pack_members` persistent table; SQL migration `supabase/migrations/001_francophone_pack_members.sql`; required server env `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, optional `SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE`, `ADMIN_NPUBS`; `SUPABASE_SERVICE_ROLE_KEY` accepted only as server-side legacy fallback; sources: `README.md`, `src/features/packs/README.md`.
- Relays centralized in `src/core/nostr/infrastructure/relay.config.ts`: `wss://relay.damus.io`, `wss://relay.nostr.band`, `wss://nostr.oxtr.dev`, `wss://nostr-pub.wellorder.net`, `wss://nos.lol`, `wss://relay.primal.net`; source: `docs/architecture/overview.md`.
- Core Nostr: frontend-local app session state, NDK client, NIP-98 HTTP auth, follow list publishing, encrypted DM, generic publication; protected backend remains stateless and verifies each request via NIP-98; sources: `src/core/nostr/README.md`, `src/core/nostr-connection/README.md`.
- Connection subsystem: `ConnectionFacade` starts/completes via `ConnectionOrchestrator`; `ConnectionMethod.start(request)` returns `ConnectionAttempt`; attempt completes to `ActiveConnection`; `ConnectionSessionStore` persists active connection in memory only via `InMemoryConnectionSessionStore`; no backend session model; source: `src/core/nostr-connection/README.md`.
- Nostr methods: `nip07` browser extension is immediate; `nip46-nostrconnect` exposes URI/QR/deep link and waits for external approval; `nip46-bunker` requires validated `bunker://` token with bunker pubkey and relay URL; source: `src/core/nostr-connection/README.md`.
- Packs workflow: `PackRequestPage.submitRequest()` -> `StarterPackRequestService` -> `NostrHttpAuthService.createAuthorizationHeader()` -> `POST /api/pack-members` -> backend `requireNostrAuth()` -> Supabase upsert active member -> 201 member; admin list/remove routes require NIP-98 admin and preserve removal history via `removedAt`; source: `src/features/packs/README.md`.

## Source of Truth and Workflow

- BMAD is the project-management and agent workflow system going forward; future planning, stories, execution tracking, and agent workflows use BMAD conventions.
- Effective source precedence: current implementation facts and maintained docs under `docs/` > BMAD project context > generated planning artifacts. If docs conflict, preserve implementation facts and mark planning uncertainty.
- Maintained project documentation lives in `docs/`; start with `docs/product/roadmap.md`, then `docs/features/README.md`.
- Feature briefs preserve ordered feature intent, acceptance criteria, inspect-first notes, risks, and verification guidance; source: `docs/features/README.md`.
- Queue snapshot as of 2026-05-03: Now `001-auto-admit-pack-members`, `002-session-restore`, `003-extension-auth-loading`, `004-advanced-bunker-mode`; Next `005-mobile-auth-stability`, `006-async-button-pattern`, `007-permission-minimization`, `008-mobile-auth-states`; Later `009-bunker-permission-grants`, `010-follower-merge`, `011-francophone-pack-feed`; reconcile against implementation before BMAD execution; source: `docs/product/roadmap.md`.
- Commit/workflow rules: use repo scripts from `package.json`, not direct tools (`ng lint`, `tsc`, `vitest`, `prettier`); commit format `feat: <short lowercase description>` with no scope/body unless necessary; one logical change per commit; do not commit unless explicitly requested; sources: `AGENTS.md`, `_bmad-output/project-context.md`.

## Implemented Features

- Implemented admission/admin base: Supabase-backed pack member workflow exists; NIP-98 protected backend routes exist for current member lookup, immediate member creation, admin member list, and admin remove; source: `src/features/packs/README.md`.
- Implemented auth surfaces: NIP-07 extension, NIP-46 Nostr Connect, NIP-46 Bunker, and local `nsec` responsibility in `NostrClientService`; UI-facing state flows through `NostrSessionService`; source: `src/core/nostr/README.md`.
- Implemented NIP-98 flow: frontend creates `Authorization: Nostr <token>` with request URL/method/body; backend validates with `unpackEventFromToken`, `verifyEvent`, and `validateNip98Event`, returning 200/401/403; source: `src/core/nostr/README.md`.
- Implemented Nostr events: kind 3 follow list via `FollowService`; kind 4 encrypted DM via `NostrClientService.sendDirectMessage`; generic publish via `NostrClientService.publishEvent`; source: `src/core/nostr/README.md`.
- Implemented config: francophone pack config currently includes `slug`, `adminNpubs`, `starterPackUrl`, `followUrl`, `externalLoginUrl`, `zapHref`; earlier candidate fields are planning-only; source: `docs/architecture/overview.md`.

## Active/Pending Work

- P0/M1 `001-auto-admit-pack-members`: implementation docs indicate Supabase-backed immediate admission/admin routes exist; remaining/reconciliation items may include stale approve/reject UI/routes, SQLite-coupled tests, Supabase env/schema docs, and runtime verification; verify implementation before creating BMAD follow-up stories; sources: `src/features/packs/README.md`, `docs/features/README.md`.
- P0/M1 `002-session-restore`: valid NIP-07/NIP-46 auth should survive refresh/revalidate; invalid/expired/denied/revoked restore disconnects and purges invalid NIP-46 payload; cached profile alone never authenticates; sources: `docs/features/README.md`, `docs/auth/nostr-auth-rules.md`.
- P1/M1 `003-extension-auth-loading`: extension auth button needs accessible pending feedback, disabled state while unavailable/connecting/loading, duplicate-submit prevention, and reset on success/error/cancel/timeout-equivalent completion; source: `docs/features/README.md`.
- P3/M1 `004-advanced-bunker-mode`: external app auth remains primary mobile path; `bunker://` stays functional but visually/textually marked advanced behind explicit affordance; locale copy validated; source: `docs/features/README.md`.
- Backlog `005-mobile-auth-stability`: manually verify/document Amber and Primal mobile flows for waiting/success/refusal/timeout/refresh/return-to-site, then apply smallest observed fixes; depends on session restore and real mobile testing; source: `docs/features/README.md`.
- Backlog `006-async-button-pattern`: introduce shared async-button strategy only if at least three cases justify it; cover loading/disabled/a11y label/anti-double-submit; source: `docs/features/README.md`.
- Backlog `007-permission-minimization`: inventory requested permissions, map to feature needs, reduce startup scope safely, add just-in-time permission requests, keep signer prompts understandable; source: `docs/features/README.md`.
- Backlog `008-mobile-auth-states`: expose signer/auth state, retry, reopen app, disconnect, and read-only mode where relevant; source: `docs/features/README.md`.
- Blocked `009-bunker-permission-grants`: one-shot bunker permission grants only if clean NDK extension point exists; current blocker = NDK bunker flow lacks clean permission injection point; otherwise mark superseded; source: `docs/features/README.md`.
- Future M2 `010-follower-merge`: admin compares source list with target pack, separates importable/already-present/target-only, previews final total, republishes target pack, credits Calle/Following.space; detailed task breakdown still needed; sources: `docs/features/README.md`, `docs/product/roadmap.md`.
- Future M3 `011-francophone-pack-feed`: public read-only chronological kind 1 feed from pack members with pagination/load-more; no complex repost handling, long-form support, SEO SSR, or rich social engine; detailed task breakdown still needed; sources: `docs/features/README.md`, `docs/product/roadmap.md`.

## Critical Implementation Constraints

- TypeScript: strict compiler/template settings; `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `isolatedModules`; avoid `any`, prefer `unknown`; type-only imports for pure types; source: `_bmad-output/project-context.md`.
- Angular: standalone components only; do not set `standalone: true`; use `ChangeDetectionStrategy.OnPush`; use `input()`, `output()`, `signal()`, `computed()`; do not use signal `mutate`; use `update`/`set`; source: `AGENTS.md`.
- Angular DI/templates/routes: use `inject()` unless extending non-Angular base class; lazy routes via `loadComponent`; native control flow `@if`, `@for`, `@switch`; no `*ngIf`, `*ngFor`, `*ngSwitch`, `ngClass`, or `ngStyle`; source: `AGENTS.md`.
- Component/service placement: page/presentation components call application services and must not contain raw relay, NDK, or Supabase logic; services single-responsibility with `providedIn: 'root'`; source: `_bmad-output/project-context.md`.
- Browser globals: guard with `typeof globalThis`, `typeof navigator`, or Angular tokens when code can run outside browser context; source: `_bmad-output/project-context.md`.
- Static images: use `NgOptimizedImage`; it does not work for inline base64 images; source: `AGENTS.md`.
- Preserve connection semantics: `startConnection()` creates attempt; `completeCurrentAttempt()` completes; NIP-46 completion may wait for external approval; `attempt.instructions` is initial UI state and `attempt.onInstructionsChange(...)` receives later updates such as remote `auth_url`; source: `src/core/nostr-connection/README.md`.
- Product limits: do not open merge tools to non-admins; do not create self-serve custom request pages for other packs; do not add sub-admins; do not open meta/self-serve mode; keep architecture compatible with later growth; source: `docs/product/roadmap.md`.

## Security and Auth Rules

- Supabase secrets are server-only; never expose `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in Angular; Angular must call `server.mjs` after NIP-98 signing; sources: `README.md`, `_bmad-output/project-context.md`.
- Backend auth is stateless Nostr auth: no backend session model unless explicitly designed; protected actions require request-by-request NIP-98 signatures; sources: `src/core/nostr/README.md`, `src/core/nostr-connection/README.md`.
- Admin authorization must exist in both UI and backend: UI uses `NostrSessionService.isAdmin()`/pack config for visibility; backend validates `ADMIN_NPUBS`; never rely on UI-only authorization; sources: `src/features/packs/README.md`, `_bmad-output/project-context.md`.
- Session restore must never authenticate from cached profile alone; invalid/expired/denied/revoked signer restores return disconnected; invalid NIP-46 payload purged; source: `docs/features/README.md`.
- NIP-46 bunker tokens must validate `bunker://` schema, bunker pubkey, and at least one relay URL before connection; source: `src/core/nostr-connection/README.md`.
- Permission minimization target: inventory requested permissions, map each to feature need, reduce startup scope where safe, and use just-in-time prompts; source: `docs/features/README.md`.

## Testing and Quality Rules

- Use repo scripts only: preferred `bun run format`, `bun run format:check`, `bun run lint`, `bun run lint:css`, `bun run typecheck`, `bun run test`, `bun run build`, `bun run fix`, `bun run check`; do not run underlying tools directly unless user requests exact command; source: `AGENTS.md`.
- Tests: `*.spec.ts` next to implementation; Vitest globals via `tsconfig.spec.json`; pure domain functions tested without TestBed; application orchestration tested with fakes/stubs for ports/signers; UI tests focus on user-visible state, guards, and service interaction; source: `_bmad-output/project-context.md`.
- Update/add tests when changing connection flows, NIP-98 signing, admin authorization, request status resolution, or Supabase API behavior; reusable test doubles belong in `testing/fakes` or `testing/contracts` inside relevant domain/core area; source: `_bmad-output/project-context.md`.
- Accessibility: must pass AXE and WCAG AA; maintain focus management, contrast, ARIA, and Angular template accessibility lint rules; source: `AGENTS.md`.
- Verification risk areas: session restore false positives from stale local data, desktop/mobile signer differences, NDK payload drift, loading state reset on exceptional paths, mobile timeout/return-to-site variance, permission reduction breaking post-login actions; source: `docs/features/README.md`.

- Manual admin approve/reject is no longer the primary membership workflow; auto-admit plus admin member table replaces/demotes it; source: `docs/features/README.md`.
- Runtime SQLite storage is retired for francophone pack membership after Supabase migration; source: `docs/features/README.md`.
- Public Following.space Pack FR merge/source-of-truth integration was attempted but unreliable in the running app; do not claim admin table contains all Pack FR members until revisited; source: `docs/features/README.md`.
- Bunker one-shot permission grant work is blocked by lack of clean NDK extension point and may be superseded; source: `docs/features/README.md`.

## Open Questions / Gaps

- `001-auto-admit-pack-members`: publishing/removing members can fail after DB write unless ordering is explicit; Nostr profile/counter data may be incomplete/slow; stale approve/reject routes/UI may remain; Supabase deploy credentials may be misconfigured; tests may still couple to removed SQLite internals; source: `docs/features/README.md`.
- `002-session-restore`: reload currently drops active connection even after user selected 1-hour option; must reproduce/fix without changing Supabase membership flow; source: `docs/features/README.md`.
- `005-mobile-auth-stability`: needs real Amber/Primal mobile verification; device/browser variance may hide flaky waiting/success/refusal/timeout/refresh/return-to-site states; source: `docs/features/README.md`.
- `006-async-button-pattern`: only proceed if duplication is proven across at least three cases; avoid abstraction that increases complexity or hurts a11y; source: `docs/features/README.md`.
- `010-follower-merge` and `011-francophone-pack-feed`: high-level specs exist but detailed M2/M3 task breakdown remains missing; source: `docs/features/README.md`.
