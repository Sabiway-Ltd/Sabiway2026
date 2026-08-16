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
- [x] SabiWay V2 BRD ingested as the business-requirements source and mapped to Web + Android + iOS delivery.
- [x] Product-source precedence documented: Master Playbook → Product Owner clarification → BRD → approved app Figma → branding → existing/V1 implementation evidence.
- [x] Canonical Figma file/key recorded.
- [x] Figma page boundary verified: `Ui Mobile App Design` is V2 design authority; `Sabiway website` is V1 and excluded from V2 web-design authority.
- [x] Approved app-design page structure inspected sufficiently to identify branding, architecture/user-flow, Client and Professional design sections.
- [x] Supplied branding package inspected and initial brand-source colour/assets baseline documented.
- [x] New-web rule recorded: derive from the app design language but build native responsive web layouts rather than stretching mobile designs.

## Open Phase 0 gates

- [ ] **Detailed Figma frame audit:** source selection is resolved, but exhaustive app frame-by-frame inspection is temporarily blocked because the connected Figma account reached its MCP Starter-plan tool-call limit. Resume when available; never fall back to the V1 website design.
- [ ] **Credential rotation evidence:** confirm all historically exposed secrets/credentials have been rotated/revoked.
- [ ] **Branch protection:** manually verify enforced public-repository rules for `main`; connector cannot read this setting.
- [ ] **Backup governance:** confirm at least one trusted backup organization owner/admin and least-privilege team/developer access.
- [ ] **Staging boundary:** confirm isolated staging credentials/data, named staging owner and release approver.

## Phase 0 exit rule

Phase 1 must not be certified as started until the Phase 0 open gates above are either:

1. closed with evidence; or
2. explicitly accepted as a time-bounded risk by the named owner where the playbook permits operational follow-up.

The app Figma remains the mandatory design authority for the design-system and web-adaptation work. The V1 web Figma page must not be used to fill gaps while detailed app inspection is unavailable.

## Next action

Close the remaining manual/security/governance evidence and resume detailed app-Figma inspection when connector capacity is available. Then run CI on the Phase 0 branch, update this checklist to all-green and merge Phase 0 before beginning Phase 1.
