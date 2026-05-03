You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Project Documentation and Planning

- Maintained project documentation lives in `docs/`.
- Start product/context review from `docs/product/roadmap.md`, then `docs/features/README.md` for feature briefs.
- `docs/architecture/overview.md` and `docs/architecture/decisions/` define architecture context and decisions.
- `docs/auth/nostr-auth-rules.md` defines stable Nostr authentication constraints.
- BMAD artifacts in `_bmad-output/` can inform planning and story execution, but generated planning output does not override current implementation facts, architecture decisions, or maintained docs.

## Nostr Auth and Security

- Preserve the current Nostr protocol model unless a new architecture decision changes it.
- Use NIP-07 as the primary desktop web signer path, NIP-46 external signer apps as the primary mobile path, and NIP-46 bunker as an advanced strategy.
- Backend-protected HTTP routes must use stateless NIP-98 verification; do not introduce backend sessions, cookies, JWT login, OAuth replacement, or server-side identity state without an explicit product and architecture decision.
- The signer is the cryptographic source of truth; hex public keys are identity references, while `npub` and NIP-05 are presentation attributes.
- Redact sensitive values from logs, including NIP-46 secrets, bunker tokens, auth URLs, and NIP-98 tokens.

## Commit Conventions

- Format: `feat: <short lowercase description>`
- No scope, no body unless necessary
- One logical change per commit
- Group related file changes together (domain, service, component)
- Always use the repo scripts from `package.json` for formatting, linting, type checking, testing, and build verification.
- Never call the underlying tools directly with commands like `bunx prettier`, `prettier`, `ng lint`, `tsc`, or `ng test` unless the user explicitly asks for that exact command.
- Preferred commands are `bun run format`, `bun run format:check`, `bun run lint`, `bun run lint:css`, `bun run typecheck`, `bun run test`, `bun run build`, `bun run fix`, and `bun run check`.
- Before committing, use `bun run fix`, `bun run check`, or the targeted `bun run ...` scripts from `package.json`.
