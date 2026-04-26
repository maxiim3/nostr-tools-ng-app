# ToolStr Project Specification

Status: active  
Updated: 2026-04-26  
Source of truth: `specs/project/`

## Purpose

ToolStr is a Nostr-centered Angular web application focused first on the francophone starter pack.

The project combines:

- public pack access and request flows
- Nostr authentication for desktop and mobile web
- protected admin workflows using NIP-98 HTTP auth
- Nostr publishing workflows for packs, follows, direct messages, and future tools
- a product shell that can grow into several Nostr operator tools

## Source-of-Truth Contract

`specs/project/` is the only active project-management and specification directory.

It owns:

- milestones
- roadmap and sequencing
- user stories
- features
- task status
- task handoff briefs
- active acceptance criteria
- planning archive decisions

Supporting docs under `docs/` may explain architecture, research, historical context, visual direction, or protocol rules, but they do not own active planning state.

## User Scenarios & Testing

### User Story 1 - Find Current Project Direction (Priority: P1)

As a maintainer, I want one directory that contains milestones, roadmap, feature status, task status, and handoff details so that I can resume work without checking multiple competing documents.

**Independent Test**: Starting from the repository root, a maintainer can locate current milestones, current roadmap, ready tasks, blocked tasks, and detailed task briefs in `specs/project/` without opening deleted or demoted planning files.

Acceptance scenarios:

1. Given the maintainer opens `specs/project/README.md`, when they need active task status, then they are directed to `specs/project/tasks.md`.
2. Given the maintainer needs product sequencing, when they open `specs/project/roadmap.md`, then Now, Next, Later, priority themes, and dependencies are visible.
3. Given a supporting doc under `docs/` mentions active work, when the migration is complete, then it links back to `specs/project/` instead of owning the status itself.

### User Story 2 - Plan Feature Work From Canonical Stories And Tasks (Priority: P1)

As a contributor, I want user stories, feature records, and tasks to share stable IDs and acceptance criteria so that implementation can start from one coherent source.

**Independent Test**: For any current task in `specs/project/tasks.md`, a contributor can identify its feature, dependencies, done criteria, and first files to inspect.

Acceptance scenarios:

1. Given a task is marked Ready, when a contributor reads its brief, then it includes outcome, done criteria, dependencies, first files to inspect, and constraints.
2. Given a task belongs to a feature, when a contributor opens `features.md`, then the feature lists related tasks and user stories.
3. Given a future task is Backlog or Blocked, when a contributor reads it, then the prerequisite or blocker is explicit.

### User Story 3 - Keep Supporting Docs Non-Authoritative (Priority: P2)

As a maintainer, I want architecture, reference, research, history, and product-design docs to remain useful without competing with project planning so that context and execution do not drift apart.

**Independent Test**: A stale-reference scan finds removed active-planning paths only in historical extraction records, not as active destinations.

Acceptance scenarios:

1. Given `docs/README.md` is opened, when a maintainer asks where active planning lives, then it points to `specs/project/`.
2. Given a history or research document contains old planning context, when it mentions current work, then it directs readers to `specs/project/`.
3. Given future Speckit templates are used, when they describe project input, then they point to `specs/project/` rather than creating a competing active source.

### Edge Cases

- A future `/speckit.specify` invocation should not silently recreate a competing numbered active spec directory.
- Historical archive records may mention deleted paths, but only as extraction history.
- Code-adjacent README files may link to project context but must not own active planning state.
- Product/runtime tasks listed in `tasks.md` are planned work; this cleanup does not implement them.

## Requirements

### Functional Requirements

- **FR-001**: The project MUST have exactly one active source-of-truth directory for milestones, roadmap, user stories, features, tasks, and handoff briefs: `specs/project/`.
- **FR-002**: `specs/project/README.md` MUST explain how to use the source-of-truth directory.
- **FR-003**: `specs/project/milestones.md` MUST contain the active Pack francophone milestone and the planned Merge followers and Feed pack milestones.
- **FR-004**: `specs/project/roadmap.md` MUST contain Now, Next, Later sequencing and priority themes.
- **FR-005**: `specs/project/user-stories.md` MUST contain canonical user stories and acceptance criteria for pack access, admin, auth, mobile UX, async UI, merge followers, feed, and zap troubleshooting.
- **FR-006**: `specs/project/features.md` MUST contain a feature registry linking features to tasks, milestones, dependencies, and user stories.
- **FR-007**: `specs/project/tasks.md` MUST contain the canonical task board and detailed handoff briefs.
- **FR-008**: Old competing active planning sources MUST be deleted or demoted after extraction.
- **FR-009**: Supporting docs under `docs/` MUST point to `specs/project/` for active planning and MUST NOT own active roadmap/task status.
- **FR-010**: Speckit metadata, templates, and helper scripts SHOULD prefer `specs/project/` and avoid recreating competing active project sources.
- **FR-011**: The migration MUST NOT change app runtime behavior, production data, server behavior, or source code other than documentation links.

### Success Criteria

- **SC-001**: A maintainer can find milestones, roadmap, user stories, features, and tasks from `specs/project/README.md` in under 2 minutes.
- **SC-002**: 100% of current active/ready/backlog/blocked tasks from the old planning system are represented in `specs/project/tasks.md`.
- **SC-003**: 100% of active product milestones from the old mission document are represented in `specs/project/milestones.md`.
- **SC-004**: A stale-reference scan finds removed planning paths only in explicit archive/validation/removed-source records.
- **SC-005**: `bun run format:check` passes.
- **SC-006**: Runtime source/server/config diffs are empty except documentation-only `src/README.md` link updates.

### Key Entities

- **Project Source Of Truth**: The `specs/project/` directory and its canonical Markdown files.
- **Milestone**: A product outcome grouping capabilities and acceptance criteria.
- **Feature Record**: A bounded feature with status, priority, milestone, tasks, dependencies, and user stories.
- **Task Record**: A unit of planned work with lifecycle state, priority, dependencies, done criteria, and handoff notes.
- **User Story**: A user- or maintainer-facing outcome with acceptance criteria.
- **Supporting Document**: Any retained `docs/` or `src/**/README.md` file that provides context but does not own active planning state.

## Product Domains

| Domain | Description                                                 | Current Role                                       |
| ------ | ----------------------------------------------------------- | -------------------------------------------------- |
| Packs  | Starter packs, request pages, quiz, membership, pack config | Main active product surface                        |
| Admin  | Request moderation and future member dashboard              | Active for request moderation, dashboard postponed |
| Tools  | Operator tools such as merge followers                      | Planned milestone                                  |
| Legal  | Terms and legal pages                                       | Present in milestone 1 scope                       |
| Home   | Landing page and product module shell                       | Present, with future module slots                  |

## Product Constraints

- The product remains a webapp/PWA, not a native mobile app.
- The product remains free for now.
- Desktop browser-extension auth is acceptable today.
- Mobile auth through an external Nostr Connect application is the immediate priority.
- `bunker://` remains available as an advanced mode, not the main public path.
- Backend-protected routes use NIP-98. No backend session, cookie session, JWT login, or OAuth replacement is planned for the current auth work.
- Runtime pack-request data must survive redeployments.

## Architecture Constraints

- Runtime app code lives under `src/` and follows the repository Angular and TypeScript rules.
- The backend is currently Bun based and must preserve public/admin endpoint behavior during storage migration.
- Nostr auth rules are defined by `docs/references/nostr-auth-rules.md` as a stable supporting reference.
- Durable architecture decisions live under `docs/architecture/decisions/`.

## Current Product State

- Milestone 1, Pack francophone, is active.
- Pack request and admin request flows exist.
- Auth refactor foundation has landed for NIP-07, NIP-46 Nostr Connect, NIP-46 Bunker, and temporary nsec.
- Mobile auth and session persistence remain unstable enough to require active follow-up.
- Runtime storage currently risks data loss across redeployments and must move to Supabase.

## Non-Goals For Current Planning Cleanup

- No application runtime behavior changes are part of this cleanup.
- No source files under `src/` are changed by this cleanup.
- Supabase migration is planned here but not implemented by this cleanup.
- Auth fixes are planned here but not implemented by this cleanup.
- External issue tracker synchronization is not part of this cleanup.

## Credits Requirement

The project uses and credits work by Calle and Following.space. Product surfaces related to the merge tool and footer must preserve visible credit.

- Calle npub: `npub12rv5lskctqxxs2c8rf2zlzc7xx3qpvzs3w4etgemauy9thegr43sf485vg`
- Following.space: `https://following.space`
- GitHub: `https://github.com/callebtc/following.space`
