# Phase 0 — Authoritative Status & Exit Gate

Status: **IN PROGRESS — NOT YET CERTIFIED**

This file is the controlling Phase 0 status for the SabiWay V2 master playbook. Older phase numbering and historical completion notes must not override it.

## Completed / verified

- [x] Repository and major code surfaces inventoried.
- [x] Existing implementation treated as upgrade-in-place, not greenfield.
- [x] Web stack identified as Next.js/React/TypeScript.
- [x] Mobile stack identified as Expo/React Native/TypeScript.
- [x] Shared backend identified as Django/DRF/JWT.
- [x] Realtime service identified as Express/Socket.IO.
- [x] Shared Django API/domain routes inventoried.
- [x] One-business-authority architecture baseline documented.
- [x] Critical cross-platform journeys baselined.
- [x] Responsive/device/accessibility baseline refreshed.
- [x] Existing CI verified on current `main`; latest inspected Platform CI run passed.
- [x] Dependabot exists.
- [x] Current-tree hygiene CI rejects `.env`, generated dependencies/caches and local DB files.
- [x] Realtime broadcast authentication is present in current code.
- [x] Existing mobile code is recognised as a first-class current implementation.
- [x] KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE decision framework applied to the major architecture surfaces.

## Open Phase 0 gates

- [ ] **Figma audit:** canonical existing mobile Figma file URL/key must be recorded and screen-by-screen audit completed.
- [ ] **Credential rotation evidence:** confirm all historically exposed secrets/credentials have been rotated/revoked.
- [ ] **Branch protection:** manually verify enforced public-repository rules for `main`; connector cannot read this setting.
- [ ] **Backup governance:** confirm at least one trusted backup organization owner/admin and least-privilege team/developer access.
- [ ] **Staging boundary:** confirm isolated staging credentials/data, named staging owner and release approver.

## Phase 0 exit rule

Phase 1 must not be certified as started until the Phase 0 open gates above are either:

1. closed with evidence; or
2. explicitly accepted as a time-bounded risk by the named owner where the playbook permits operational follow-up.

The Figma audit is not optional because it directly controls the design-system and web adaptation work that begins in Phase 1.

## Next action

Complete the remaining manual/design evidence, update this checklist to all-green, run CI on the Phase 0 branch, then merge the Phase 0 baseline before beginning Phase 1.
