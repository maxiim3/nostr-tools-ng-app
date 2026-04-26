# Roadmap

Status: active  
Updated: 2026-04-26

This file owns product sequencing and priority themes.

## Now

| Order | Theme                       | Related Tasks        | Outcome                                                      |
| ----- | --------------------------- | -------------------- | ------------------------------------------------------------ |
| 1     | Persistent runtime storage  | `INFRA-01`, `DOC-03` | Pack requests survive redeployments                          |
| 2     | Nostr session persistence   | `AUTH-02`, `AUTH-07` | Refresh does not lose a still-valid Nostr authorization      |
| 3     | Mobile external-app auth    | `AUTH-08`, `AUTH-04` | Amber and Primal flows are clear, tested, and stable         |
| 4     | Auth interaction feedback   | `UI-01`, `UI-02`     | Users see loading and disabled states for async auth actions |
| 5     | Advanced bunker positioning | `AUTH-05`, `AUTH-06` | `bunker://` stays available without dominating mainstream UX |

## Next

| Theme                   | Related Tasks        | Outcome                                                 |
| ----------------------- | -------------------- | ------------------------------------------------------- |
| Permission minimization | `AUTH-03`, `AUTH-06` | Login requests the minimum useful permissions first     |
| Admin members dashboard | Future task          | Admin can manage or review pack members beyond requests |
| Home module evolution   | Future task          | Landing page can expose additional modules honestly     |

## Later

| Theme                   | Milestone | Outcome                                                               |
| ----------------------- | --------- | --------------------------------------------------------------------- |
| Merge followers tool    | M2        | Admin imports missing follows from a source list into the target pack |
| Feed pack francophone   | M3        | Public users can read pack member posts                               |
| Onboarding Nostr module | Future    | Product can guide users and developers into Nostr basics              |
| Recommended profiles    | Future    | Product can recommend useful profiles without overloading M1          |

## Priority Themes

| Priority | Theme                               | Outcome                                                         |
| -------- | ----------------------------------- | --------------------------------------------------------------- |
| P0       | Data persistence with Supabase      | Pack requests survive redeployments                             |
| P0       | Nostr session persistence           | Refresh does not break a valid NIP-07 or NIP-46 authorization   |
| P0       | Project source of truth             | All planning lives in `specs/project/`                          |
| P1       | Mobile external-app auth            | Amber and Primal flows are reliable and documented              |
| P1       | Local Nostr Connect signer restore  | Users do not restart from zero after reload or return           |
| P1       | Auth button loading/disabled states | Double clicks are prevented and waiting states are visible      |
| P2       | Finer permissions                   | Login is less scary and asks for fewer permissions upfront      |
| P2       | Mobile auth UX                      | Connected, retry, disconnect, and read-only states are explicit |
| P3       | Bunker                              | Advanced mode remains useful without carrying the default UX    |

## Sequencing Rules

- `INFRA-01` can start immediately and should not be mixed with auth changes in the same session.
- `AUTH-07` can start immediately but should not be implemented in parallel with overlapping auth sessions.
- `AUTH-08` depends on `AUTH-07` because refresh/session behavior is part of the mobile verification matrix.
- `UI-02` depends on `UI-01` because the first loading-state fix should remain local before abstraction.
- `DOC-03` depends on `INFRA-01` because architecture docs should reflect the final storage implementation.
- `AUTH-04` should follow `AUTH-07` and ideally `AUTH-08` so UX states are based on verified behavior.
