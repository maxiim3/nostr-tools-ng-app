# Story 1.4: Make Auth Method Selection and Advanced Bunker Mode Clear

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Nostr user,
I want the app to guide me toward the right sign-in method,
so that I can connect without understanding protocol details.

## Acceptance Criteria

1. Given a disconnected user opens the auth modal, when auth methods are shown, then desktop users are guided toward browser extension auth, and mobile users are guided toward external signer app auth.
2. Given bunker auth remains supported, when the auth modal displays bunker access, then `bunker://` is labeled and positioned as advanced, and existing bunker functionality remains available.
3. Given private-key login exists in the app, when auth options are displayed, then private-key login is not presented as a normal primary method, and it is hidden behind an explicit advanced/reveal interaction if retained.
4. Given the auth modal is changed, when extension, external signer app, bunker, and private-key fallback actions are used, then the existing `NostrSessionService` calls, pending/cancel/retry behavior, QR/copy behavior, and timeout displays continue to work.
5. Given user-facing auth method copy changes, when implementation is complete, then `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, and `src/assets/i18n/es.json` contain matching keys with French preserved as the default/fallback product language.
6. Given the modal is an interactive authentication dialog, when it is rendered, then method guidance, advanced reveal controls, inputs, pending messages, and action buttons remain keyboard-operable, visibly focused, and understandable to screen-reader users without relying only on color.

## Tasks / Subtasks

- [x] Clarify primary auth method hierarchy in the existing auth modal (AC: 1, 4, 6)
  - [x] Update `src/core/layout/presentation/components/app-auth-modal.component.ts` only within the current presentation component unless a tiny local helper is required for clarity.
  - [x] Present browser extension as the desktop-recommended path and external signer app as the mobile-recommended path using plain labels/copy, not protocol-first terminology.
  - [x] Use responsive ordering, grouping, labels, or helper copy so extension is visibly primary on desktop and external signer is visibly primary on mobile; do not rely on user-agent parsing for auth behavior.
  - [x] Preserve existing click handlers: `loginWithExtension()`, `startExternalApp()`, `copyUri()`, `cancelExternalApp()`, and timeout retry behavior.
  - [x] Do not add device-specific branching that changes signer semantics. Recommendation cues can be responsive/copy-based; auth method availability remains owned by `NostrSessionService`/facade.
- [x] Move bunker behind an explicit advanced section while preserving the bunker flow (AC: 2, 4, 6)
  - [x] Add an intentional reveal control for advanced methods, likely a local `signal(false)` such as `advancedOptionsOpen` in `AppAuthModalComponent`.
  - [x] Place `bunker://` token input and bunker connect button inside the advanced area and label it as an advanced remote signer/bunker option.
  - [x] Preserve `bunkerTokenControl`, `submitBunker()`, `cancelBunker()`, `waitingForBunkerAuth()`, `bunkerAuthTimedOut()`, retry, cancellation, and token clearing behavior.
  - [x] Keep `bunker://` validation and signer mechanics out of the component; the existing `nip46-bunker` connection method owns token validation.
- [x] Hide private-key fallback behind the same explicit advanced/reveal interaction (AC: 3, 4, 6)
  - [x] Do not remove private-key fallback unless a product decision explicitly says to remove it.
  - [x] Keep `privateKeyControl` and `loginWithPrivateKey()` functional when revealed.
  - [x] Make the warning visible near the private-key field and avoid presenting it as a normal recommended sign-in method.
  - [x] Add an accessible label to the private-key input if it remains; it currently has only a placeholder.
  - [x] Replace the hard-coded private-key `Go` button text with translated copy in all locales.
  - [x] Do not log, persist, prefill, remember, or expose private-key values; preserve current clearing behavior on submit and modal close.
- [x] Improve modal accessibility without broad redesign (AC: 1, 2, 3, 6)
  - [x] Keep the existing DaisyUI modal pattern, but add stable dialog labelling such as `aria-labelledby`/`aria-describedby` on the dialog or modal box if needed by the current markup.
  - [x] Ensure the advanced reveal control exposes its expanded/collapsed state with `aria-expanded` and references the advanced content with `aria-controls` if content is conditionally rendered.
  - [x] Ensure generated QR image alt text is user-actionable and not just protocol jargon.
  - [x] Ensure external auth link uses `rel="noopener noreferrer"`, not only `noreferrer`, because it may open or navigate to an external signer URI/auth URL.
  - [x] Do not rely only on color for recommended, advanced, warning, waiting, error, or timeout states.
  - [x] If advanced options are hidden by default, ensure an already-pending bunker or private-key fallback error/recovery state is not stranded behind collapsed UI without a visible path to recover.
- [x] Update translations and legal/access copy consistency (AC: 1, 2, 3, 5)
  - [x] Update `authModal` keys in `src/assets/i18n/fr.json`, `en.json`, and `es.json` for recommended labels, advanced reveal/hide text, advanced description, bunker advanced copy, private-key fallback copy, and accessible labels as needed.
  - [x] Keep French copy polished and product-first; avoid raw protocol explanations except `bunker://` where necessary for advanced users.
  - [x] Review `cgu.sections.access.methods` in all three locale files because it currently lists extension, external app, and private key. If bunker becomes visible as an advanced method, update only the relevant method list text if it would otherwise be misleading.
- [x] Extend component tests for selector hierarchy and advanced reveal (AC: 1, 2, 3, 4, 6)
  - [x] Update `src/core/layout/presentation/components/app-auth-modal.component.spec.ts` to assert primary extension/external sections are visible by default.
  - [x] Assert the implementation exposes desktop/mobile recommendation cues through responsive classes, ordering, or copy without changing auth method semantics.
  - [x] Assert bunker and private-key controls are hidden until the advanced reveal is activated.
  - [x] Assert revealing advanced options preserves bunker submission, bunker cancel/retry, private-key submission, and field clearing.
  - [x] Assert private-key action copy is translated rather than hard-coded as `Go`.
  - [x] Assert external auth QR/copy/waiting behavior still works after the UI hierarchy changes.
  - [x] Assert the reveal control exposes expected accessibility attributes where practical in component tests.
- [x] Verify with repo scripts only (AC: 4, 5, 6)
  - [x] Run `bun run typecheck`.
  - [x] Run `bun run test`.
  - [x] Run `bun run check` if practical before moving the story to review.

### Review Findings

- [x] [Review][Patch] Mobile recommendation label is attached to the browser extension section [src/core/layout/presentation/components/app-auth-modal.component.ts:41]
- [x] [Review][Patch] Private-key advanced section can remain visible after user input and modal reset [src/core/layout/presentation/components/app-auth-modal.component.ts:288]
- [x] [Review][Patch] Tests do not assert desktop/mobile recommendation cue placement or advanced reset behavior [src/core/layout/presentation/components/app-auth-modal.component.spec.ts:137]
- [x] [Review][Patch] Collapsed advanced toggle references an element that is not in the DOM [src/core/layout/presentation/components/app-auth-modal.component.ts:149]

## Dev Notes

### Epic Context

Epic 1 makes Nostr authentication reliable across browser extension, external signer app, and bunker flows while keeping the user out of protocol details. Story 1.4 is a presentation/UX clarity story: make method selection obvious, position bunker as advanced, and hide private-key login behind an explicit reveal. It must not refactor signer/session architecture or reopen completed restore work. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.4: Make Auth Method Selection and Advanced Bunker Mode Clear`]

Covered requirements are FR1, FR2, FR3, and FR4. The supporting UX requirements are UX-DR7, UX-DR8, UX-DR9, UX-DR20, and UX-DR21: plain labels, desktop extension preference, mobile external signer preference, bunker advanced positioning, private-key advanced-only handling, keyboard operability, visible focus states, and non-color-only feedback. [Source: `_bmad-output/planning-artifacts/epics.md#Requirements Inventory`]

### Previous Story Intelligence

Story 1.3 is complete and added NIP-46 external signer restore. Preserve those changes. Do not alter restore payload persistence, NIP-46 signer validation, operation-generation guards, timeout cleanup, or `facade.ndkSigner()` display bridge behavior while changing the modal presentation. [Source: `_bmad-output/implementation-artifacts/1-3-restore-valid-nip-46-external-signer-sessions-after-refresh.md#Completion Notes List`]

Key learnings from Stories 1.1-1.3 that apply here:

- `AuthSessionState` in `src/core/nostr-connection/domain/auth-session-state.ts` is the semantic source of auth state. Do not introduce loose booleans as auth truth.
- `NostrSessionService` is the current UI/session bridge. The modal should call it; it should not import `ConnectionFacade`, NDK, NIP-46 helpers, NIP-07 providers, or raw signer objects.
- Stale async completion bugs were real in previous stories. This story should avoid touching async orchestration unless necessary; if touched, preserve operation/attempt guards.
- Profile/display state is not authentication proof. This story should not change restore or connected identity semantics.
- Bunker remains supported but not mainstream. `nip46-bunker` is an existing method id and must not be replaced by a new alias.

### Current Code State To Preserve

- `src/core/layout/presentation/components/app-auth-modal.component.ts` currently renders extension, external app, bunker, and private-key sections in one visible list. It owns only presentation state: reactive form controls for private key/bunker token, copied state, external QR generation, modal close cleanup, and calls into `NostrSessionService`.
- Extension flow: button calls `loginWithExtension()`, which calls `session.connectWithExtension()` and clears the private-key field. Its disabled state depends on `!session.extensionAvailable() || session.connecting()`.
- External signer flow: button calls `startExternalApp()`, which calls `session.beginExternalAppLogin()`, resets copied state, and opens the returned URI through `openExternalUri()`. Existing UI preserves open/copy/QR/waiting/retry/cancel behavior through `session.externalAuthUri()`, `waitingForExternalAuth()`, and `externalAuthTimedOut()`.
- Bunker flow: token field uses `bunkerTokenControl`; submit calls `session.beginBunkerLogin(token)` and clears the token. Existing waiting/retry/cancel states depend on `session.waitingForBunkerAuth()` and `session.bunkerAuthTimedOut()`.
- Private-key fallback: field uses `privateKeyControl`; submit calls `session.connectWithPrivateKey(...)` and clears the field. It is currently visible by default and has a warning, which violates this story's AC.
- Private-key fallback currently has hard-coded submit text `Go`; implementation should replace it with an i18n key and should not add any persistence, logging, remember-me, or prefill behavior.
- The component already uses Angular standalone defaults, `ChangeDetectionStrategy.OnPush`, `inject()`, signals, reactive forms, inline template, and no `ngClass`/`ngStyle`. Preserve these patterns.
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts` already mocks `NostrSessionService`, QR generation, clipboard, and verifies extension, external app, QR/copy, cancel/close, timeout retry, bunker submit/wait/cancel/retry. Extend these tests instead of replacing them.
- Translation keys for `authModal` exist in `src/assets/i18n/fr.json`, `en.json`, and `es.json`. All new user-facing copy should be added in all three files.

### Required Implementation Shape

The minimal correct design is:

1. Keep `AppAuthModalComponent` as the auth modal; do not create a parallel modal or broad auth selector framework.
2. Add a clear method hierarchy in the existing template: recommended desktop browser extension and recommended mobile external signer app as the default visible choices.
3. Add an explicit advanced reveal area for bunker and private-key fallback.
4. Move the existing bunker token form into the advanced area and label it as advanced while preserving `bunker://` functionality.
5. Move the existing private-key form into the advanced area and keep the warning close to the field.
6. Add/update i18n keys in `fr`, `en`, and `es` for all new labels, helper text, reveal controls, input labels, and QR alt text.
7. Preserve recovery visibility: if bunker is already waiting/timed out or private-key fallback has a visible error, the user must still have a clear path to reveal/retry/cancel the relevant advanced flow.
8. Update component tests to prove default visibility and revealed advanced behavior, plus non-regression of existing external/bunker/private-key actions.

### Architecture Guardrails

- Continue from the existing Angular/Bun brownfield foundation. Do not initialize a new app, introduce a component library, add a state-management library, migrate routing, or extract a reusable auth module. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Keep pseudo-DDD boundaries. Presentation components render state and trigger application service commands; they do not own signer mechanics. [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`]
- `src/core/layout/presentation/components/app-auth-modal.component.ts` is the correct UPDATE file for auth modal presentation. Authentication methods and protocol behavior remain in `src/core/nostr-connection/`. [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`]
- Do not import NDK, `window.nostr` wrappers, NIP-46 restore helpers, bunker starters, NIP-98 services, Supabase, or backend APIs into the modal.
- Do not add backend sessions, cookies, JWT login, OAuth replacement, Supabase auth state, or server-side identity state. [Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- Do not change pack registration, admin, Supabase, NIP-98 verification, NIP-07/NIP-46 restore, session persistence, or signer adapter code for this story unless a compile/test break directly requires a small non-behavioral adjustment.

### UX And Accessibility Guardrails

- Preserve the existing Tailwind/DaisyUI `brutal` visual foundation. No new design system, palette, typography system, broad layout redesign, animation layer, or visual direction belongs in this story. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation`]
- Use user-facing labels such as browser extension, mobile signer app, and bunker. Avoid leading with NIP numbers except in advanced helper text where useful. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Auth Method Selector`]
- Desktop should favor browser extension authentication; mobile should favor external signer app authentication. Bunker remains available as advanced. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Auth Modal Pattern`]
- Private-key login is not a normal public web app flow. If retained, it must be separate from the standard flow and hidden behind an explicit advanced/reveal interaction. [Source: `docs/auth/nostr-auth-rules.md#User Private Key`]
- Raw private-key values must remain ephemeral UI input only. Do not log them, store them, put them in signals beyond the existing form control, or add any remember-me behavior. [Source: `_bmad-output/planning-artifacts/prd.md#Security`]
- Pending states should still name what is happening: waiting for app approval, waiting for extension approval, or waiting for bunker approval. This story should not replace those with generic loading copy. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Loading And Pending Pattern`]
- Dialog accessibility: MDN guidance says dialog UI must be properly labelled and keyboard focus must be managed correctly. The existing native `<dialog>`/DaisyUI pattern should at minimum have a clear title/description association and reachable controls. [Source: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role`]
- The QR code alt text should explain the action, for example scan to open/connect with a signer app, not only `Nostr Connect QR code` if a clearer translated label is added.

### Nostr Protocol And Security Constraints

- NIP-07 remains the primary desktop web signer path; NIP-46 external signer remains the primary mobile web signer path; bunker remains advanced. [Source: `docs/auth/nostr-auth-rules.md#Context`]
- NIP-46 requires the client to distinguish remote-signer pubkey from user pubkey and to call `get_public_key` after connect. This is already handled by the connection domain; do not duplicate it in UI. [Source: `https://github.com/nostr-protocol/nips/blob/master/46.md`]
- `bunker://` tokens, NIP-46 secrets, auth URLs, restore payloads, and NIP-98 tokens must not be logged. This story should avoid adding new logging around copy/open/submit actions. [Source: `docs/auth/nostr-auth-rules.md#Security Extraction For Web Scope`]
- External links/URLs opened by the app should avoid `window.opener`; use `rel="noopener noreferrer"` on external anchors. [Source: `docs/auth/mobile-auth-notes.md#Applicable Security Notes`]

### Latest Technical Information

- Angular v21 style guidance continues to prefer `inject()`, protected template members, feature organization, co-located `.spec.ts` tests, focused presentation components, and `class`/`style` bindings over `ngClass`/`ngStyle`. [Source: `https://angular.dev/style-guide`]
- NIP-46 current spec explicitly says `remote-signer-key`/remote-signer pubkey and `user-pubkey` are distinct, client-initiated `nostrconnect://` requires `secret`, and clients must validate correlation. UI must not flatten this into misleading identity copy; show simple method labels and leave validation to adapters. [Source: `https://github.com/nostr-protocol/nips/blob/master/46.md`]
- Current project versions: Angular `^21.1.0`, TypeScript `~5.9.2`, Bun `1.2.13`, `nostr-tools ^2.23.3`, NDK `^3.0.3`, Tailwind CSS `^4.1.12`, DaisyUI `^5.5.19`, Transloco `^8.3.0`, Vitest `^4.0.8`, QR code `^1.5.4`. [Source: `package.json`]

### File Structure Requirements

Likely UPDATE files:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`: method hierarchy, advanced reveal state, accessible labels/attributes, existing section movement.
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`: default/revealed visibility, non-regression of extension/external/bunker/private-key interactions.
- `src/assets/i18n/fr.json`: default/fallback French auth modal copy.
- `src/assets/i18n/en.json`: English auth modal copy.
- `src/assets/i18n/es.json`: Spanish auth modal copy.

Maybe UPDATE files:

- `docs/auth/nostr-auth-rules.md` only if implementation creates a new durable auth method selection rule. This story likely should not need docs changes.
- CGU/legal translation sections only if auth methods listed there become materially misleading after adding bunker as an advanced visible method.

Avoid touching unless directly necessary:

- `src/core/nostr-connection/**`: signer/session model and completed restore behavior.
- `src/core/nostr/application/nostr-session.service.ts`: existing UI bridge, timers, attempt guards, restore handling.
- `server.mjs`, `server.test.mjs`, Supabase migrations, pack pages/services, admin pages, NIP-98 backend verification, NIP-07/NIP-46 restore stores.

### Testing Requirements

- Component tests should continue using the existing `NostrSessionService` mock and QR/clipboard mocks.
- Test default state: extension and external app choices are visible; bunker/private-key inputs are not visible until advanced options are revealed.
- Test reveal state: advanced button toggles content, exposes accessibility state, and bunker/private-key sections become available.
- Test action non-regression: extension connect, external start/open/copy/QR/waiting/cancel/retry, bunker submit/wait/cancel/retry, private-key submit/clear.
- If the template adds `aria-labelledby`, `aria-describedby`, `aria-expanded`, `aria-controls`, or translated input labels, assert the practical attributes where stable.
- Verification must use repository scripts from `package.json`: `bun run typecheck`, `bun run test`, and preferably `bun run check`. Do not call direct `tsc`, `vitest`, `ng test`, `prettier`, or lint tools. [Source: `_bmad-output/project-context.md#Development Workflow Rules`]

### Git Intelligence

- Recent commits: `c19f3e8 feat: restore nip-46 sessions`, `aaf7ae0 feat: create nip-46 restore story`, `33ec5d2 fix: persistant connection on reload (1.2)`, `fa65520 feat: restore extension sessions`, and `2b9f99a feat: create extension restore story`.
- Recent work concentrated in `connection-facade.ts`, `nostr-session.service.ts`, NIP-07/NIP-46 restore stores and tests, and auth docs. Story 1.4 should not disturb that domain/application work.
- Previous review findings found race and stale-completion bugs around auth operations. Avoid changing async orchestration in this story unless tests prove it remains safe.

### Anti-Reinvention Instructions

- Reuse the existing `AppAuthModalComponent`; do not create `AuthMethodSelectorComponent` unless the inline template becomes unmanageably large. The smallest correct change is preferred.
- Reuse `NostrSessionService`; do not bypass it with direct facade or signer adapter calls.
- Reuse method ids `nip07`, `nip46-nostrconnect`, and `nip46-bunker`; do not add aliases like `mobileSigner`, `externalSigner`, or `advancedBunker`.
- Reuse existing translation hierarchy under `authModal`; do not hard-code new user-facing strings in the template.
- Reuse existing DaisyUI/Tailwind classes and brutal visual language; do not introduce custom CSS files unless necessary.
- Do not add device detection libraries or user-agent parsing. Prefer responsive/copy cues and existing method availability.
- Do not introduce QR alternatives, signer discovery, NIP-55, PWA install, account creation, broad onboarding, or reusable Angular auth module extraction.

### Out Of Scope

- Changing NIP-07 restore, NIP-46 restore, bunker token validation, NIP-98 signing/verification, backend/session architecture, or pack registration.
- Implementing broader pending/timeout/cancelled/denied/retry state model changes; Story 1.5 owns explicit state expansion.
- Stabilizing Amber/Primal app return behavior or documenting app-specific limitations; Story 1.6 owns that.
- Permission minimization; Story 1.7 owns that.
- Accessible async-button abstraction; Story 1.8 owns that and abstraction is only allowed after at least three real async cases are inventoried.
- Sign-out artifact cleanup beyond preserving existing modal-close cancellation; Story 1.9 owns broad sign-out cleanup.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.4: Make Auth Method Selection and Advanced Bunker Mode Clear`
- `_bmad-output/planning-artifacts/prd.md#Nostr Authentication`
- `_bmad-output/planning-artifacts/prd.md#Accessibility`
- `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`
- `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Auth Method Selector`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Auth Modal Pattern`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `docs/auth/nostr-auth-rules.md#Method Rules`
- `docs/auth/mobile-auth-notes.md#Applicable Security Notes`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`
- `src/assets/i18n/fr.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`

## Dev Agent Record

### Agent Model Used

openai/gpt-5.5

### Debug Log References

- Updated sprint tracking to `in-progress` and selected Story 1.4 from `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Implemented auth modal hierarchy updates in `src/core/layout/presentation/components/app-auth-modal.component.ts` with desktop/mobile recommendation cues and advanced reveal behavior.
- Added accessibility improvements: dialog labeling, `aria-expanded`/`aria-controls` for advanced reveal, QR alt translation key, and `rel="noopener noreferrer"`.
- Updated locale keys and access-method copy in `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, and `src/assets/i18n/es.json`.
- Extended auth modal component test coverage in `src/core/layout/presentation/components/app-auth-modal.component.spec.ts` for default visibility, advanced reveal, accessibility attrs, and translated private-key CTA.
- Validation commands executed: `bun run typecheck`, `bun run test`, `bun run format`, `bun run check` (pass).

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Status set to `ready-for-dev` after source artifact, previous-story, current-code, protocol, UX/accessibility, and checklist analysis.
- Implemented explicit advanced method reveal with `advancedOptionsOpen` and automatic visibility during bunker pending/timeout states to preserve recovery access.
- Reworked modal method guidance so extension and external app remain primary choices with responsive recommendation copy for desktop vs mobile.
- Moved bunker and private-key flows under advanced options without changing existing `NostrSessionService` handlers or auth semantics.
- Replaced hardcoded private-key button text with translated copy and added accessible input labels for bunker and private-key fields.
- Updated QR image alt text and dialog/reveal ARIA attributes for improved screen-reader clarity.
- Added/updated component tests proving default hierarchy, advanced reveal behavior, accessibility attributes, and external/bunker/private-key non-regression.
- Updated legal access method wording in all locales to include bunker as an advanced method.
- Full repo checks pass via `bun run check`.

### File List

- src/core/layout/presentation/components/app-auth-modal.component.ts
- src/core/layout/presentation/components/app-auth-modal.component.spec.ts
- src/assets/i18n/fr.json
- src/assets/i18n/en.json
- src/assets/i18n/es.json

## Change Log

- 2026-05-04: Implemented Story 1.4 auth modal hierarchy and advanced bunker/private-key reveal flow with accessibility and i18n updates; expanded component tests and validated via repo scripts.
