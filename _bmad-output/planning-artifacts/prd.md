---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - _bmad-output/project-context.md
workflowType: 'prd'
documentCounts:
  productBriefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 1
classification:
  projectType: web_app
  domain: Nostr protocol / decentralized identity and authentication
  complexity: high
  projectContext: brownfield
releaseMode: single-release
status: complete
completedAt: 2026-04-30
---

# Product Requirements Document - nostr-tools-ng-app

**Author:** Maxime
**Date:** 2026-04-30

## Executive Summary

This PRD defines the next product direction for `nostr-tools-ng-app`, an existing Nostr web application whose immediate priority is reliable authentication across desktop and mobile. The product must make bunker, external signer, and browser extension authentication predictable under real usage conditions, including permission prompts, app/window focus transitions, long-lived authorization, refreshes, and session restoration. Pack registration remains important but secondary because it appears functionally viable; authentication reliability is the blocking foundation for user trust and future development.

The project is also a process reset. Earlier planning created useful artifacts for authentication and redesign, but execution became disordered. The project now uses BMAD for planning and keeps critical support knowledge in maintained docs. That preserved knowledge should later support a Karpathy-style wiki and practical Nostr development reference.

### What Makes This Special

The product's differentiator is not feature breadth. It is making Nostr authentication feel boring, durable, and trustworthy across the real signer environments users already rely on. Users should not need to understand why a bunker flow, external signer app, browser extension, permission state, focus change, or page refresh might break authentication; the app should handle those conditions consistently and explain recovery paths when needed.

The core insight is that a useful Nostr app must first solve the operational reliability of identity and signing. Once authentication is stable, the app can safely support pack registration and later scale into broader Nostr tooling. Preserved implementation decisions, architecture, incidents, and guides compound that value by becoming reusable context for future contributors and Nostr developers.

## Project Classification

- **Project Type:** Web application
- **Domain:** Nostr protocol, decentralized identity, and authentication
- **Complexity:** High
- **Project Context:** Brownfield

## Success Criteria

### User Success

Users can sign in with any supported Nostr authentication method: bunker, external signer app, or browser extension. After signing in, users remain authenticated for the duration allowed by the signer authorization. A page refresh must not clear an otherwise valid authentication state, unless the signer authorization has expired or the user removed/revoked access from the signer.

Authentication should feel fast, predictable, and low-friction. Because the app is not yet loading heavy feeds, notifications, or large relay-backed data, users should not experience long waits during sign-in. If an external signer or mobile app requires focus changes, permission prompts, or back-and-forth interaction, the app must preserve the authentication attempt state and guide the user to completion or clear recovery.

### Business Success

The immediate product success target is reliability for the current application, not broad platform extraction. The app can resume feature development once authentication and pack registration are stable enough to support the planned product roadmap.

A strong 3-month success outcome is that the app has scaled into the wanted feature set without authentication remaining the blocker. Authentication should become a dependable foundation rather than an area requiring repeated interruption, rework, or manual debugging.

### Technical Success

All three authentication methods must be implemented and validated as first-class supported flows: bunker, external signer app, and browser extension. Session restoration must respect signer-granted authorization duration and must survive refreshes when authorization remains valid.

The authentication implementation should separate core business logic from presentation concerns enough to make future extraction into a reusable Angular module plausible. Extraction is not part of the MVP, but current architecture should avoid coupling that would make reuse unnecessarily difficult.

Pack registration must remain functional and stable after authentication changes. Authentication fixes must not regress the existing rebrand/redesign or the current pack registration behavior.

Useful support knowledge must stay preserved in maintained docs. The project should retain Nostr authentication patterns, architecture decisions, research distillates, guides, and incidents so they are not lost during workflow cleanup.

### Measurable Outcomes

- A user can sign in successfully with bunker, external signer app, and browser extension flows.
- A user who refreshes the page remains signed in when signer authorization is still valid.
- A user is no longer treated as authenticated when signer authorization has expired or access has been revoked.
- External signer flows preserve state through permission prompts, mobile app switching, browser focus changes, and return-to-app behavior.
- Sign-in does not introduce avoidable waiting for nonessential data loading.
- Pack registration remains usable after authentication refactoring or fixes.
- Support knowledge relevant to Nostr auth patterns is preserved in maintained docs.
- The app can resume planned feature development without authentication being the primary blocker.

## Product Scope

### MVP - Minimum Viable Product

The MVP scope is limited to authentication reliability, pack registration stability, and preservation of critical support knowledge. Authentication must support bunker, external signer app, and browser extension flows with predictable session persistence, refresh behavior, permission handling, and recovery paths. Pack registration must continue to work and be validated against the improved authentication model.

Knowledge preservation is included only as migration support: preserve relevant Nostr authentication patterns, architecture decisions, research distillates, guides, and incidents. A polished developer-facing wiki is not part of the MVP.

### Growth Features (Post-MVP)

Post-MVP scope includes scaling the wanted application features after authentication is stable. Future implementation may also prepare the authentication business logic for extraction into a reusable Angular module, but that extraction is not required for the MVP.

### Vision (Future)

The future vision includes a self-documenting Nostr development knowledge base built from preserved support materials and BMAD process. The wiki can later become a practical developer-facing Nostr auth and app development reference.

## User Journeys

### Journey 1: Nostr User Registers for a Pack Successfully

A Nostr user arrives at Toolstr because they already use Nostr and want access to a pack without manual coordination. They are familiar with Nostr authentication and already have an account, signer, or bunker setup. Their goal is simple: sign in, request access, and be added automatically.

They choose one of the supported authentication methods: bunker, external signer app, or browser extension. The app completes the sign-in without unnecessary delay or confusing intermediate states. Once authenticated, the user requests to join the pack. Within a couple of seconds, the request is processed and the user is auto-added.

The value moment is immediate: the user does not need to message an admin, wait for manual handling, or wonder whether the request worked. The app confirms the outcome clearly. The user leaves with confidence that Toolstr handled Nostr authentication and pack registration correctly.

### Journey 2: Nostr User Is Already in the Pack

A returning Nostr user signs in to Toolstr to request pack access, but their account is already part of the pack. They may not remember whether they previously joined, or they may be checking the status from another device.

After sign-in, the user requests pack access. Instead of reprocessing the request, creating duplicate state, or showing an ambiguous error, the app detects existing membership and displays a clear message that the user is already in the pack.

The value moment is clarity. The user understands that nothing is broken and no further action is needed. This prevents unnecessary admin requests and reduces support friction.

### Journey 3: Nostr User Completes an External Signer or Bunker Flow

A Nostr user starts authentication through an external signer app or bunker flow. The flow may require permission prompts, switching apps, changing browser/window focus, waiting for approval, or returning to Toolstr after a signing interaction.

The user expects the app to preserve the authentication attempt while these external interactions happen. If approval succeeds, Toolstr completes the session and returns the user to the intended next step: pack registration. If the approval is delayed, denied, expired, or interrupted, the app explains the state and gives the user a clear recovery path.

The value moment is predictability. The user does not lose their place, does not get stuck in an unclear loading state, and does not need to understand the technical details of signer permissions or focus changes.

### Journey 4: Admin Reviews and Manages Pack Membership

An admin uses the admin panel to monitor pack membership created through Toolstr. They need to see which users came from the Toolstr app and verify that auto-registration is working as expected.

When a user is auto-added to the pack, the admin can identify that source in the panel. If a user should no longer be in the pack, the admin can remove them. The admin does not need to manually process normal join requests anymore, which directly addresses the current operational pain caused by growing demand.

The value moment is operational relief. The admin moves from manual registration work to oversight and exception handling.

### Journey 5: Future User Discovers Broader Toolstr Capabilities

In a later iteration, a Nostr user arrives at Toolstr not only for pack registration, but for a broader set of Nostr tools, onboarding explanations, account creation assistance, developer tools, and documentation. This future user may be less familiar with Nostr than the current target user.

This journey is outside the current MVP. It remains important as a future direction, but current product work should not delay authentication reliability or auto pack registration to serve this broader audience.

### Journey Requirements Summary

These journeys reveal the following required capabilities:

- Support bunker, external signer app, and browser extension authentication.
- Preserve authentication attempt state through signer permissions, app switching, focus changes, delays, denials, and recovery.
- Restore valid authentication after refresh when signer authorization remains valid.
- Process pack registration automatically after sign-in.
- Detect and clearly communicate existing pack membership.
- Keep pack registration fast, ideally completing within 2-3 seconds under normal conditions.
- Give admins visibility into users added through Toolstr.
- Let admins remove users from the pack.
- Preserve the existing redesign and avoid adding broader onboarding, account creation, developer tooling, or polished wiki functionality to the current MVP.

## Domain-Specific Requirements

### Compliance & Regulatory

- No formal regulatory compliance requirement is in scope for this PRD.
- The product must respect Nostr's security model: private keys remain outside the application, and signing authority comes only from the selected signer method.
- The application must not present a user as authenticated based only on remembered local profile/session state when signer authorization is expired, revoked, unavailable, or unverified.

### Technical Constraints

- The app must support three signer contexts as first-class flows: bunker, external signer app, and browser extension.
- The app must never store or request private keys.
- Protected backend actions, including pack registration where applicable, must use signed authorization consistent with the current Nostr auth model.
- Session restoration after refresh must validate that signer authorization is still usable or still within the allowed duration.
- Authentication state must distinguish between identity discovery, signer availability, signer permission, active session, expired session, and revoked/removed signer authorization.
- External signer and bunker flows must survive normal mobile/desktop behavior: permission prompts, delayed approvals, app switching, browser focus changes, and return-to-app transitions.
- Sign-in must not wait on nonessential relay/feed/notification data.
- Authentication failures must produce clear user-facing recovery paths rather than indefinite loading, silent failure, or inconsistent partial state.

### Integration Requirements

- Browser extension authentication must account for extension availability, permission prompts, approval, denial, and refresh behavior.
- External signer app authentication must account for app switching, delayed responses, cancellation, and return focus behavior.
- Bunker authentication must account for remote approval, delayed completion, relay availability, and authorization persistence.
- Backend pack registration must remain protected by valid Nostr authorization and must not rely on UI-only authentication state.
- Admin pack management must remain authoritative: admins can see users added through Toolstr and remove users from the pack.

### Risk Mitigations

- Risk: a user appears signed in after refresh even though signer authorization is no longer valid.
  Mitigation: session restoration must verify signer authorization semantics before treating the user as authenticated.

- Risk: external signer or bunker flow loses state during app/window focus transitions.
  Mitigation: authentication attempts must be modeled as durable in-progress state with explicit completion, cancellation, timeout, and recovery paths.

- Risk: authentication feels slow because the app waits on nonessential network or relay data.
  Mitigation: sign-in completion must be separated from optional data loading.

- Risk: pack auto-registration bypasses authorization or creates inconsistent membership state.
  Mitigation: pack registration must require valid signed authorization and must handle already-member cases idempotently.

- Risk: authentication fixes regress the accepted redesign or pack registration behavior.
  Mitigation: acceptance coverage must include current UI flow preservation and pack registration validation.

## Web App Specific Requirements

### Project-Type Overview

Toolstr is currently delivered as a multi-page application experience for the MVP. The immediate web-app requirement is not broad platform polish; it is the minimum reliable browser experience needed to roll out authentication and auto pack registration.

The MVP should prioritize correctness, predictable auth state, and fast pack registration over SEO, PWA installation, tailored mobile UX, or broad browser retrocompatibility.

### Technical Architecture Considerations

The MVP web experience must support the current application structure while keeping authentication and pack registration behavior stable across page loads and refreshes. Refresh behavior is especially important because users must remain authenticated when signer authorization is still valid.

The implementation should avoid coupling authentication to a single page lifecycle assumption. Auth state, signer authorization checks, and pack registration should work predictably even when navigation or refresh occurs.

### Browser Matrix

MVP browser support should cover the minimal practical set required to roll out the current product safely. Browser support should be driven by the signer methods users actually use for bunker, external signer app, and browser extension authentication.

Longer-term browser retrocompatibility, including support roughly five years backward, is a growth requirement and should not block the MVP unless a required signer flow depends on it.

### Responsive Design

The MVP must remain usable on desktop and mobile for authentication and pack registration. A fully tailored mobile experience is post-MVP, but mobile must not break core external signer and bunker flows, especially app switching, focus changes, and return-to-app behavior.

### Performance Targets

Sign-in and pack registration should feel fast because the MVP does not require heavy feed, notification, or relay data loading. Pack registration should complete within 2-3 seconds under normal conditions.

Authentication completion must not be blocked by nonessential data fetching.

### SEO Strategy

SEO is not a current MVP requirement because the priority flow is authenticated pack registration for users who already know Nostr and have accounts/signers. Public discoverability, onboarding content, and documentation SEO belong to later Toolstr growth.

### Accessibility Level

WCAG AA accessibility remains a project requirement, but MVP effort should focus on the core auth and pack registration flows: clear labels, visible focus states, keyboard operability, readable status messages, and accessible error/recovery messaging.

Broader accessibility hardening across future Toolstr tools is post-MVP.

### Implementation Considerations

Post-MVP web-app improvements include browser retrocompatibility targeting approximately five years backward, stronger accessibility coverage, a tailored mobile experience, and installable PWA support. These should be planned as growth work after authentication and auto pack registration are stable.

## Project Scoping

### Strategy & Philosophy

**Approach:** Single upcoming release focused on operational reliability.

This release exists to unblock Toolstr usage and resume product development. The strategy is to make the existing app dependable for the current high-demand workflow: Nostr users authenticate, request pack access, and are auto-added without manual admin work.

The release should avoid expanding into broader Toolstr capabilities, onboarding, account creation, developer documentation, PWA work, or reusable module extraction. Those directions remain valid, but they should not compete with authentication reliability and auto pack registration.

**Resource Requirements:** implementation requires Angular frontend expertise, Nostr signer/authentication expertise, Bun API/backend authorization knowledge, and enough QA coverage to validate desktop/mobile signer flows.

### Complete Feature Set

**Core User Journeys Supported:**

- Nostr user signs in and registers for a pack successfully.
- Nostr user signs in and receives a clear already-in-pack message.
- Nostr user completes external signer or bunker authentication through permission prompts, app/window focus changes, delays, or recovery.
- Admin reviews users added through Toolstr and removes users from the pack when needed.

**Must-Have Capabilities:**

- Support bunker authentication.
- Support external signer app authentication.
- Support browser extension authentication.
- Preserve authentication attempt state through signer permissions, focus changes, app switching, delayed approval, denial, timeout, and cancellation.
- Restore valid authentication after refresh when signer authorization remains valid.
- End authentication when signer authorization has expired, been revoked, or is unavailable.
- Keep sign-in completion separate from nonessential relay/feed/notification data loading.
- Auto-add authenticated users to the pack after request.
- Handle already-in-pack state idempotently with a clear user-facing message.
- Protect pack registration with valid Nostr authorization, not UI-only state.
- Show admins which users came from Toolstr.
- Allow admins to remove users from the pack.
- Preserve the accepted redesign/rebrand during auth and pack changes.
- Preserve critical support knowledge needed for BMAD migration in maintained docs.

**Nice-to-Have Capabilities:**

- Reusable Angular authentication module extraction.
- Broader Toolstr tools.
- Nostr onboarding explanations.
- Nostr account creation tooling.
- Developer tools and documentation.
- Polished Karpathy-style wiki as a public developer reference.
- Browser retrocompatibility targeting approximately five years backward.
- Tailored mobile UX beyond MVP usability.
- Installable PWA support.
- SEO/public discoverability improvements.

### Risk Mitigation Strategy

**Technical Risks:** the highest risk is signer-flow unpredictability across bunker, external signer apps, browser extensions, mobile app switching, permission prompts, and refreshes. Mitigation is to model authentication as explicit state with durable in-progress attempts, clear terminal states, and acceptance coverage for each supported signer method.

**Market Risks:** the current risk is not lack of demand; demand for pack access already exists. The risk is user/admin trust erosion if auto-registration is unreliable. Mitigation is to keep scope narrow and validate the pack registration journey end to end before adding broader Toolstr features.

**Resource Risks:** if implementation capacity is constrained, the release should not reduce the three required auth methods without explicit decision. Instead, reduce polish and future-facing work first. The absolute minimum release remains reliable authentication, auto pack registration, already-in-pack handling, admin removal, and preservation of critical support knowledge.

## Functional Requirements

### Nostr Authentication

- FR1: Users can sign in with a bunker-based Nostr authentication method.
- FR2: Users can sign in with an external signer app.
- FR3: Users can sign in with a browser extension signer.
- FR4: Users can choose among the supported Nostr authentication methods available to them.
- FR5: Users can complete authentication after external permission prompts or approval steps.
- FR6: Users can recover from delayed, denied, cancelled, expired, or interrupted authentication attempts.
- FR7: Users can see whether authentication is pending, successful, failed, expired, or requires action.
- FR8: Users can sign out of the application.
- FR9: The system can distinguish identity discovery from active signer authorization.
- FR10: The system can distinguish signer availability, signer permission, active session, expired session, and revoked or removed authorization.

### Session Continuity

- FR11: Users remain authenticated after page refresh when signer authorization remains valid.
- FR12: Users are no longer treated as authenticated when signer authorization has expired.
- FR13: Users are no longer treated as authenticated when signer access has been revoked or removed.
- FR14: The system can restore a valid authenticated session without requiring unnecessary re-authentication.
- FR15: The system can require re-authentication when the remembered local state is insufficient to prove active authorization.
- FR16: The system can preserve in-progress authentication attempts across normal navigation, app switching, and browser focus changes.
- FR17: The system can provide a clear recovery path when session restoration cannot complete.

### Pack Registration

- FR18: Authenticated users can request to join the pack.
- FR19: The system can automatically add an eligible authenticated user to the pack after request.
- FR20: Users can receive confirmation when pack registration succeeds.
- FR21: Users can receive a clear message when they are already in the pack.
- FR22: The system can process repeated pack registration requests idempotently.
- FR23: The system can prevent unauthenticated users from registering for the pack.
- FR24: The system can protect pack registration with valid Nostr authorization.
- FR25: The system can preserve pack registration behavior after authentication changes.

### Admin Pack Management

- FR26: Admins can view pack members in the admin panel.
- FR27: Admins can identify users who were added through Toolstr.
- FR28: Admins can remove users from the pack.
- FR29: Admins can verify that auto-registration is working without manually processing normal join requests.
- FR30: The system can enforce admin-only access to pack management capabilities.

### User Feedback and Recovery

- FR31: Users can see clear status messages during sign-in and pack registration.
- FR32: Users can understand when they need to switch to a signer app, approve a permission, return to Toolstr, retry, or choose another method.
- FR33: Users can retry authentication after a failed or interrupted attempt.
- FR34: Users can retry pack registration after a recoverable failure.
- FR35: Users can understand when no further action is needed because they are already registered.
- FR36: The system can avoid indefinite loading states by reaching a clear success, failure, pending, timeout, or recovery state.

### Migration and Knowledge Preservation

- FR37: The project can preserve critical support knowledge in maintained docs.
- FR38: The project can retain Nostr authentication patterns, architecture decisions, research, guides, and incident knowledge needed for BMAD migration.
- FR39: The preserved knowledge can support future wiki creation without making the polished wiki part of the current release.

### Scope Control

- FR40: The current release excludes Nostr account creation tooling.
- FR41: The current release excludes broad Nostr onboarding explanations beyond what is needed for supported auth flows.
- FR42: The current release excludes broader Toolstr developer tools.
- FR43: The current release excludes reusable Angular auth module extraction.
- FR44: The current release excludes installable PWA support.
- FR45: The current release excludes SEO/public discoverability work.
- FR46: The current release excludes polished public developer documentation/wiki delivery.

## Non-Functional Requirements

### Performance

- Sign-in completion must not wait on nonessential feed, notification, or broad relay data.
- Pack registration should complete within 2-3 seconds under normal operating conditions.
- Auth status changes should become visible to the user promptly after signer approval, denial, timeout, or return-to-app.
- The app must avoid indefinite loading states during authentication and pack registration.

### Security

- The app must never request, store, transmit, or derive user private keys.
- Protected backend actions must require valid Nostr authorization and must not rely on UI-only session state.
- Remembered local state must not be treated as proof of active authentication without valid signer authorization semantics.
- Admin-only pack management capabilities must remain protected by both frontend and backend authorization checks.
- Session restoration must stop treating a user as authenticated when authorization is expired, revoked, removed, or unavailable.

### Reliability

- Bunker, external signer app, and browser extension authentication must each be validated as supported flows.
- Authentication attempts must survive normal desktop and mobile focus transitions, app switching, permission prompts, delayed approvals, denials, cancellations, and timeouts.
- Page refresh must preserve valid authenticated state when signer authorization remains valid.
- Authentication failures must resolve to an explicit user-visible state: recoverable error, retry, timeout, cancellation, expired authorization, or sign-out.
- Pack registration must be idempotent for users already in the pack.
- Auth changes must not regress existing pack registration, admin removal, or the accepted redesign.

### Accessibility

- Core authentication and pack registration flows must meet WCAG AA expectations.
- Status, error, pending, success, and recovery messages must be perceivable and understandable without relying only on color.
- Interactive controls in auth and pack registration flows must be keyboard operable and have visible focus states.
- External signer guidance must be clear enough for users to understand the required next action.

### Integration

- Browser extension signer integration must handle unavailable extension, approval, denial, permission changes, and refresh behavior.
- External signer app integration must handle app switching, delayed response, cancellation, and return-to-app behavior.
- Bunker integration must handle remote approval, relay availability issues, delayed completion, and authorization persistence.
- Backend pack registration must remain compatible with the current Nostr signed authorization model.
- Admin pack management must remain consistent with backend membership state.
