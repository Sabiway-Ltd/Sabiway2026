# Master Phase 12 — End-to-End QA & Cross-Platform Journey Certification

## Objective

Phase 12 certifies real SabiWay journeys across the shared backend and the Web, Android and iOS clients rather than treating isolated components as sufficient evidence.

This phase follows the Master Cross-Platform Playbook certification matrix: Register, Login, Password recovery, Profile, Verification, Search, Content, Messaging, Notifications, Transactions, Payments, Support/report and Logout.

## Pre-check decision

The repository already contained substantial domain regression tests, frontend TypeScript/lint checks, mobile TypeScript checks, realtime checks and a shared design-system check. There was no dedicated Playwright, Cypress, Detox or Maestro suite.

Decision: **KEEP + IMPROVE** the existing regression harness rather than introduce a new framework only for a phase label. Phase 12 adds a deterministic journey-contract gate and raises the frontend gate to include a production build. Physical browser/device execution remains separate evidence because GitHub CI cannot truthfully certify real Android and iPhone hardware.

## Automated software certification

`qa/phase12-certification.json` is the machine-readable certification matrix.

`scripts/verify-phase12-journeys.mjs` checks that every required journey has the expected Web/mobile/backend contracts and that the four playbook cross-device scenarios have the required shared-system ingredients. It deliberately fails when expected evidence disappears.

The Platform CI Phase 12 gate includes:

- repository hygiene
- design-system token synchronisation
- Django deploy check
- migration drift check
- complete backend regression suite
- realtime check
- frontend dependency install, TypeScript, lint and production build
- mobile dependency install and TypeScript
- waitlist syntax
- Phase 12 journey contract verification

## Journey matrix

| Journey | Web software evidence | Android/iOS shared mobile evidence | Backend evidence |
|---|---|---|---|
| Register | Signup route | AuthFlow create-account flow | Accounts signup endpoint/tests |
| Login | Login route | AuthFlow sign-in flow | Accounts login endpoint/tests |
| Password recovery | Forgot/reset routes | AuthFlow recovery/code/new-password flow | Forgot/confirm/reset endpoints/tests |
| Profile | V2 profile route/components | ProfileScreen | Profiles API/tests |
| Verification | Verification route | VerificationScreen | Verification API/admin/tests |
| Search | Shared discovery/search integration | Marketplace discovery/search | Search API and boundary tests |
| Content | Community/post UI | CommunityScreen | Posts API/tests |
| Messaging | Messages workspace | MessagingScreen | Marketplace messaging/realtime tests |
| Notifications | Notifications route | NotificationsScreen | Notifications API/realtime tests |
| Transactions | Marketplace journey | MarketplaceScreen | Booking/transaction tests |
| Payments | SabiPay route | SabiPayScreen | SabiPay state-machine/provider tests |
| Support/report | Help centre/support route | Post reporting path | Operations support + moderation tests |
| Logout | Shared auth path | App signOut state reset | Logout endpoint/tests |

The mobile client is one Expo codebase serving Android and iOS. Passing TypeScript/source contracts proves shared software availability, not physical-device behaviour.

## Cross-device scenarios

The automated contract confirms the shared architecture required for all four playbook scenarios:

1. Android registration -> Web profile update -> iOS view.
2. Web content creation -> Android engagement -> iOS notification.
3. Android transaction -> Web inspection -> admin state change -> iOS update.
4. Admin suspension -> Web, Android and iOS restriction.

Actual execution of those hand-offs on physical devices is recorded separately in the runtime matrix below.

## Runtime certification matrix

These checks cannot be honestly marked passed by repository inspection or Linux CI alone.

### Browsers

| Browser | Required | Status |
|---|---:|---|
| Chrome | Yes | Runtime execution required |
| Edge | Yes | Runtime execution required |
| Safari | Yes | Runtime execution required |
| Firefox where supported | Yes | Runtime execution required |

### Real mobile devices

| Device class | Required | Status |
|---|---:|---|
| Low-range Android | Yes | Physical-device execution required |
| Mid-range Android | Yes | Physical-device execution required |
| Higher-range Android | Yes | Physical-device execution required |
| Older supported iPhone | Yes | Physical-device execution required |
| Current supported iPhone | Yes | Physical-device execution required |

These runtime items are not silently converted into automated passes. They become the hands-on execution evidence before Phase 13 controlled user-testing readiness can be signed off.

## Severity model

- **Severity 1 — Blocker:** critical journey impossible, security issue or serious data risk.
- **Severity 2 — Major:** journey only possible with significant difficulty.
- **Severity 3 — Moderate:** usability issue but journey remains possible.
- **Severity 4 — Minor:** cosmetic or low-impact.

Automated CI must contain no unresolved Severity-1 software blocker before this branch can merge. A later physical/browser test finding can still reopen certification and must be triaged under the same severity model.

## Completion interpretation

Phase 12 has two evidence layers:

1. **Software certification gate** — contracts, buildability, backend journeys and regression. This is merge-gated in CI.
2. **Runtime device/browser certification** — explicit hands-on evidence on the playbook browser and physical-device matrix.

A green merge is therefore evidence that the repository is technically ready for the required runtime certification; it is **not** a fabricated claim that Safari, Edge or physical Android/iPhone sessions were executed by GitHub Actions.

## Phase 13 dependency

Phase 13 remains separate. Controlled user testing requires stable QA/staging/beta distribution and real tester cohorts. The Phase 12 runtime matrix must be completed before the final controlled-user-testing release gate is signed off.
