# 009 Bunker Permission Grants

Status: blocked  
Priority: P3  
Milestone: M1

## Outcome

Enable one-shot bunker permission grants only when a clean implementation path exists.

## User Stories

- `US-AUTH-04` Use bunker as advanced mode
- `US-AUTH-06` Grant fewer permissions upfront

## Acceptance Criteria

- Either one-shot permission flow is implemented cleanly,
- or this feature is explicitly superseded with a documented replacement.

## Blocker

Current NDK bunker flow does not expose a clean extension point to inject the full requested permission set into connect.
