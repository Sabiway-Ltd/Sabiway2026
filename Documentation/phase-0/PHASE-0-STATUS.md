# Phase 0 — Authoritative Status & Exit Gate

Status: **CERTIFIED WITH OWNER-ACCEPTED TIME-BOUNDED RISKS**

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
- [x] Platform CI run #121 passed on the latest inspected Phase 0 head before certification update.
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
- [x] Vercel project `sabiway2026` inspected; a READY preview deployment exists.
- [x] Repository admin permission confirmed for `OlaoluwajohnsonT`.
- [x] Connected Supabase organisation inspected; no SabiWay project is currently visible there.
- [x] Manual closure tracking created as GitHub issue #38.

## Owner-accepted time-bounded risks

On 2026-08-17 the Product Owner explicitly directed the programme to continue to the next phase while he is the only active person working on the repository. The following items are therefore accepted as controlled, time-bounded operational risks rather than blockers to Phase 1:

- **Credential rotation evidence:** provider-side proof of historical credential rotation/revocation remains to be recorded. No secret values are to be stored in GitHub.
- **Branch protection:** `main` protection remains manually verifiable because the branch-protection API returns 403 to this integration. Until formally enabled/verified, changes should continue through feature branches and pull requests.
- **Backup governance:** a second trusted Sabiway-Ltd organisation owner/admin is still to be confirmed before broader contributor access or production launch.
- **Staging boundary:** isolated staging credentials/data, a named staging owner and release approver must be established before production-readiness certification. Existing GitHub Preview/Production environments do not by themselves satisfy this requirement.

Tracking issue: **#38 — Phase 0 manual security and governance closure** remains open and must be completed before production/user-testing readiness certification even though it no longer blocks Phase 1 development.

## Design-gate note

The Product Owner-supplied export of the approved V2 app design closes the Phase 0 design-baseline gate. Live Figma remains the authoritative editable source for later screen-level implementation work. The V1 `Sabiway website` Figma page remains excluded from V2 design authority.

## Phase 0 certification decision

**Phase 0 is CERTIFIED WITH OWNER-ACCEPTED TIME-BOUNDED RISKS.**

This certification permits Master Phase 1 — Shared Technical Foundation & Design System — to begin. It does not waive the open governance/security actions for production or controlled-user-testing readiness.
