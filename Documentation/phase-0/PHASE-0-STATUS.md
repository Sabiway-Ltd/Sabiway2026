# Phase 0 — Authoritative Status & Exit Gate

Status: **IN PROGRESS — OWNER-CONTROLLED GOVERNANCE EVIDENCE REMAINS**

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
- [x] Platform CI run #121 passed on the latest inspected Phase 0 head.
- [x] Dependabot exists.
- [x] Current-tree hygiene CI rejects `.env`, generated dependencies/caches and local DB files.
- [x] Realtime broadcast authentication is present in current code.
- [x] Existing mobile code is recognised as a first-class current implementation.
- [x] KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE decision framework applied to the major architecture surfaces.
- [x] SabiWay V2 BRD ingested as the business-requirements source and mapped to Web + Android + iOS delivery.
- [x] Product-source precedence documented: Master Playbook → Product Owner clarification → BRD → approved app Figma → branding → existing/V1 implementation evidence.
- [x] Canonical Figma file/key recorded.
- [x] Figma page boundary verified: `Ui Mobile App Design` is V2 design authority; `Sabiway website` is V1 and excluded from V2 web-design authority.
- [x] Supplied V2 app export audited as an auditable snapshot of the approved `Ui Mobile App Design` page.
- [x] Exported client, professional, auth, discovery, marketplace/job, messaging, community, verification, payment/escrow, withdrawal/history/receipt and review screens inventoried at Phase 0 capability level.
- [x] Exported user-flow audited across client/provider/community/SabiPay/dispute/admin paths.
- [x] Design-system, state-completeness, accessibility, trust, marketplace-state, messaging, search/filter and payment-state refinements documented.
- [x] Supplied branding package inspected and initial brand-source colour/assets baseline documented.
- [x] New-web rule recorded: derive from the approved app design language but build native responsive web layouts rather than stretching mobile designs.
- [x] GitHub environments inspected: `Preview` and `Production` exist.
- [x] Vercel project `sabiway2026` inspected; latest deployment is READY and preview-targeted (`target: null`), not production.
- [x] Repository admin permission confirmed for `OlaoluwajohnsonT`.
- [x] Connected Supabase organisation inspected; no SabiWay project is currently visible there, so no staging/production Supabase separation can be claimed.
- [x] Manual closure tracking created as GitHub issue #38.

## Open Phase 0 gates

These are now limited to evidence/actions that cannot be truthfully completed by the connected tooling alone:

- [ ] **Credential rotation evidence:** confirm all historically exposed secrets/credentials have been rotated/revoked at their providers. Do not store secret values in GitHub; record only provider + rotation/revocation date.
- [ ] **Branch protection:** manually verify enforced rules for `main`. The branch-protection API returns 403 to this integration. Minimum target: PR required, Platform CI required, no normal direct pushes, and force-push/deletion protection where appropriate.
- [ ] **Backup governance:** confirm at least one trusted backup Sabiway-Ltd organisation owner/admin and least-privilege developer/team access. Organisation membership detail is not readable by this integration.
- [ ] **Staging boundary:** establish isolated staging credentials/data and record a named staging owner and release approver. GitHub currently has `Preview` and `Production`, but both lack deployment protection rules; Vercel currently has a READY preview deployment; no SabiWay Supabase project is visible in the connected Supabase organisation.

Tracking issue: **#38 — Phase 0 manual security and governance closure**.

## Design-gate note

The Figma MCP Starter-plan tool-call limit no longer blocks Phase 0 design-baseline certification because the Product Owner supplied an export of the approved V2 app design. The export has been audited and is sufficient for Phase 0 baseline decisions. Live Figma remains the authoritative editable source for later screen-level implementation work.

The V1 `Sabiway website` Figma page remains excluded from V2 design authority.

## Phase 0 exit rule

Phase 1 must not be certified as started until the four open gates above are either:

1. closed with evidence; or
2. explicitly accepted as a time-bounded risk by the named owner where the playbook permits operational follow-up.

## Next action

Complete issue #38, update this file to `CERTIFIED`, mark PR #37 ready, merge Phase 0, then begin Master Phase 1 — Shared Technical Foundation & Design System.