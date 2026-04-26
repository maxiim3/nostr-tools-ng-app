<!--
Sync Impact Report
Version change: unratified template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Angular and TypeScript Discipline
- Template principle 2 -> II. Accessible Product UX
- Template principle 3 -> III. Feature-First Boundaries
- Template principle 4 -> IV. Nostr Auth and Security
- Template principle 5 -> V. Verification Through Repo Scripts
Added sections:
- Technology Standards
- Development Workflow
Removed sections:
- Template placeholder section 2
- Template placeholder section 3
Templates requiring updates:
- updated .specify/templates/plan-template.md
- updated .specify/templates/spec-template.md
- updated .specify/templates/tasks-template.md
- updated .specify/templates/checklist-template.md
Follow-up TODOs: none
-->

# ToolStr Constitution

## Core Principles

### I. Angular and TypeScript Discipline

All frontend work MUST use strict TypeScript and current Angular patterns already
established for this project. Code MUST avoid `any` unless a narrow, reviewed
exception is documented; uncertain external data MUST be treated as `unknown`
and validated before use. Angular components, directives, and services MUST use
standalone APIs, signals for local state, `computed()` for derived state,
`input()` and `output()` functions for component contracts, `inject()` for
dependency access, and `ChangeDetectionStrategy.OnPush` for components.

Angular decorators MUST NOT set `standalone: true`, because standalone is the
default for this Angular version. Components MUST NOT use `@HostBinding`,
`@HostListener`, `ngClass`, or `ngStyle`; host bindings belong in decorator
`host` metadata, and styling variants belong in class/style bindings. Templates
MUST use native control flow (`@if`, `@for`, `@switch`) and MUST NOT rely on
unsupported globals or arrow functions.

Rationale: the app is an Angular 21 TypeScript codebase. Keeping one Angular
style prevents framework drift and makes features easier to review, test, and
maintain.

### II. Accessible Product UX

Every user-facing change MUST satisfy WCAG AA expectations and pass AXE checks
for the affected flows. UI states MUST be keyboard reachable, screen-reader
understandable, color-contrast compliant, and explicit about loading, disabled,
success, failure, timeout, cancellation, and retry states. Async actions that
can be double-submitted MUST expose a disabled/loading state with an accessible
label.

Product work MUST remain web/PWA first. Desktop authentication uses the browser
signer path; mobile authentication prioritizes an external Nostr Connect
application. `bunker://` remains available for advanced users but MUST NOT be
presented as the primary mobile path.

Rationale: ToolStr's current priorities are mobile Nostr auth reliability and
clear async UX. Accessibility and state clarity are part of functional
correctness, not polish.

### III. Feature-First Boundaries

Application structure MUST follow the documented feature-first, simplified
hexagonal architecture. Feature code SHOULD be organized by domain under
`src/features/<domain>/` using `domain`, `application`, `infrastructure`, and
`presentation` layers when the feature is large enough to need those boundaries.
Small changes MAY stay local, but they MUST NOT blur protocol, domain, and UI
responsibilities.

The `domain` layer MUST remain free of Angular, UI, Nostr transport, and browser
provider dependencies. The `presentation` layer MUST coordinate UI state and
template bindings, but MUST NOT contain raw relay or signer protocol logic.
Protocol details, NDK objects, browser providers, HTTP adapters, and persistence
adapters MUST stay in infrastructure or core adapter code. `shared/` MUST remain
strictly generic and MUST NOT become a dumping ground for feature-specific
logic.

Rationale: the project already separates product features, Nostr connection
logic, and shared UI. Preserving these boundaries keeps auth, storage, and UI
changes independently testable.

### IV. Nostr Auth and Security

Nostr authentication MUST preserve the project's protocol model unless an
explicit architecture decision changes it. `NIP-07` is the primary desktop web
signer path. `NIP-46 nostrconnect` is the primary mobile web/PWA path.
`NIP-46 bunker` is an explicit advanced strategy with its own contract and
tests. Backend-protected HTTP routes MUST continue to use stateless `NIP-98`
verification; backend sessions, cookies, JWT login, OAuth replacement, or
server-side identity state MUST NOT be introduced without a documented product
and architecture decision.

The signer is the cryptographic source of truth. The reference identity MUST be
the hex public key; `npub` and `NIP-05` are presentation attributes, not proof of
identity. NIP-46 flows MUST validate correlation data such as `secret` and
request identifiers, request the narrowest useful permissions, purge invalid
restore data, and fail closed. Sensitive values including NIP-46 secrets,
bunker tokens, auth URLs, and NIP-98 tokens MUST be redacted from logs.

Rationale: auth bugs can create security, privacy, and trust failures. The
existing Nostr rules are a stable design input and take precedence over
convenience shortcuts.

### V. Verification Through Repo Scripts

All formatting, linting, type checking, testing, and build verification MUST run
through scripts declared in `package.json`. Contributors and agents MUST use
commands such as `bun run format`, `bun run format:check`, `bun run lint`,
`bun run lint:css`, `bun run typecheck`, `bun run test`, `bun run build`,
`bun run fix`, and `bun run check`. They MUST NOT call underlying tools such as
`prettier`, `ng lint`, `tsc`, or `ng test` directly unless a user explicitly
asks for that exact command.

Tests MUST scale with risk. Auth, signer restore, storage persistence,
admin-protected backend behavior, data validation, and reusable async UI
patterns require targeted tests before or alongside implementation. A change
that cannot run the relevant script locally MUST document the reason and the
remaining risk before handoff.

Rationale: repo scripts are the stable project interface for quality gates, and
the riskiest current work is in auth, storage, and user-facing state.

## Technology Standards

The primary application is an Angular 21 TypeScript web/PWA using Bun for
project scripts and a Bun HTTP API in `server.mjs`. The frontend uses Angular
Router, Reactive Forms when forms are needed, Transloco for i18n, Tailwind CSS
and daisyUI styling, NDK and `nostr-tools` for Nostr behavior, and QR code
support where the auth flow requires it.

Runtime storage currently includes SQLite for local pack requests, with active
plans to migrate persistent runtime storage to Supabase. Plans and tasks that
touch storage MUST state the current storage mode, the migration target, data
persistence expectations, environment variables, and how protected admin
behavior remains covered by `NIP-98`.

Documentation sources have defined roles. `specs/project/` is the active
project source of truth. `specs/project/queue.md` owns execution order and
`specs/project/features/<id-name>/` owns actionable spec/plan/tasks units.
`specs/project/support/architecture/overview.md` and
`specs/project/support/decisions/` define structure and architectural
decisions. `specs/project/support/references/nostr-auth-rules.md` defines
stable Nostr auth constraints. `specs/project/support/research/`,
`specs/project/support/history/`, and `specs/project/support/design/` contain
supporting material only and do not own active planning status.

## Development Workflow

Feature work MUST start from `specs/project/queue.md` and then the selected
`specs/project/features/<id-name>/` directory, identifying the independently
testable user outcome before implementation details.
Plans MUST capture the real project structure rather than generic template
layouts. Tasks MUST be grouped by user story or operational outcome, include
exact file paths, identify dependencies, and include explicit verification
steps.

For UI work, specs and tasks MUST include accessibility acceptance criteria,
focus behavior, keyboard behavior, async states, and responsive PWA behavior
where relevant. For Nostr auth work, specs and tasks MUST include protocol
method, signer lifecycle, restore behavior, permission scope, cancellation,
timeout, failure, logout cleanup, and redaction expectations. For backend or
storage work, specs and tasks MUST include protected endpoint behavior,
environment configuration, persistence expectations, and migration/documentation
updates.

Commits, when requested, MUST use the project convention `feat: <short
lowercase description>` with no scope and no body unless needed. Each commit
MUST represent one logical change and SHOULD group related files by domain,
service, or component.

## Governance

This constitution supersedes conflicting generated Spec Kit guidance for this
repository. When project documents conflict, `specs/project/` wins over
supporting or historical documents, architecture decisions win over
implementation shortcuts, and this constitution wins over generic templates.

Amendments require updating `.specify/memory/constitution.md`, adding or
updating the Sync Impact Report, reviewing dependent Spec Kit templates, and
recording the rationale for the version bump. Versioning follows semantic
versioning: MAJOR for incompatible governance or principle changes, MINOR for
new principles or materially expanded guidance, and PATCH for clarifications or
wording changes.

Every generated plan MUST perform a Constitution Check before research and
again after design. Reviews MUST verify Angular/TypeScript discipline,
accessibility, feature boundaries, Nostr auth/security constraints, and repo
script verification. Any approved violation MUST be documented with the reason,
the rejected simpler alternative, and a follow-up path.

**Version**: 1.0.0 | **Ratified**: 2026-04-26 | **Last Amended**: 2026-04-26
