# Master Phase 13 — Controlled User-Testing Readiness

## Objective

Prepare SabiWay V2 for controlled testing by real target users without confusing repository readiness with physical browser/device evidence.

## Current evidence

- Phase 12 software journey certification is merged and retained.
- Vercel has a READY production deployment for `main` at commit `9296729d8c9e5b462321f55c7efae71ac8b7fec8`.
- The stable Vercel project alias is `https://sabiway2026.vercel.app`.
- The shared Expo codebase now has explicit `development`, `qa`, `uat`, `beta` and `production` EAS build profiles.
- Android QA/UAT profiles produce internally distributable APKs.
- Beta and production profiles use store distribution so iOS can be distributed through TestFlight/App Store Connect once the Expo/Apple project credentials are connected.

## Evidence boundary

This repository does **not** claim that real Android/iPhone devices, Safari, Edge, Chrome or Firefox have been physically executed by CI. It also does not claim that an iOS TestFlight build exists until an actual EAS/store build and distribution record exists.

Those are mandatory runtime evidence items before SabiWay is signed off as ready for controlled user testing.

## Environment model

| Environment | Purpose | Required evidence |
|---|---|---|
| Development | Engineering work | local/Codespaces development works |
| QA/Test | Repeatable internal QA | backend/frontend/mobile configuration + QA build profile |
| Staging/UAT | Product-owner and pre-beta validation | UAT environment, seeded safe test accounts, cross-platform journey pass |
| Controlled beta | Real target-user testing | stable web URL + Android installable build + iOS TestFlight/equivalent |

Users must not be sent to developer-local environments.

## Tester cohorts

Recruit a controlled mix covering Android users, iPhone users, mobile-web users, desktop users, lower and higher digital-confidence users, different age groups, different network conditions, different SabiWay roles, Nigerian users and diaspora users where relevant.

Do not treat one technically confident tester on one device as representative coverage.

## Task script

Each tester receives realistic tasks rather than an instruction to simply explore.

| ID | Task | Critical |
|---|---|---:|
| T01 | Create an account without help | Yes |
| T02 | Complete your profile | Yes |
| T03 | Find a relevant user or service | Yes |
| T04 | Perform an interaction | Yes |
| T05 | Recover your password | Yes |
| T06 | Report a problem | Yes |
| T07 | Complete the core transaction journey | Yes |
| T08 | Receive and act on a notification | No |
| T09 | Complete payment where applicable | Yes |
| T10 | Sign out and sign back in | Yes |

For professional testers, include verification before any journey that depends on verified-provider state.

## Feedback capture

Use `qa/templates/phase13-user-testing-feedback.csv` as the minimum structured dataset.

Capture task completion, time, confusion, errors, abandonment, trust, satisfaction, usefulness, device, platform, network condition, severity and short notes. Do not collect passwords, card details, identity-document images or unnecessary sensitive data in feedback.

## Severity model

- **Severity 1 — Blocker:** a critical journey is impossible, or there is a security/serious data-risk issue.
- **Severity 2 — Major:** the journey is only possible with significant difficulty.
- **Severity 3 — Moderate:** usability is materially affected but the journey remains possible.
- **Severity 4 — Minor:** cosmetic or low-impact issue.

Severity is based on user impact, not how difficult the defect is to fix.

## Defect workflow

1. Record defects with the GitHub `Controlled user-testing defect` issue template.
2. Redact all personal, financial and identity-document data from screenshots/logs.
3. Reproduce on the same platform where possible.
4. Confirm whether the issue affects one platform or the shared backend.
5. Fix Severity 1 immediately before testing continues.
6. Resolve critical Severity 2 issues before the release gate can pass.
7. Regression-test the affected journey and any shared consumers.

## Runtime execution matrix

### Browsers

| Browser | Required | Current status |
|---|---:|---|
| Chrome | Yes | Physical/runtime execution required |
| Edge | Yes | Physical/runtime execution required |
| Safari | Yes | Physical/runtime execution required |
| Firefox where supported | Yes | Physical/runtime execution required |

### Mobile devices

| Device class | Required | Current status |
|---|---:|---|
| Low-range Android | Yes | Installable QA build + execution required |
| Mid-range Android | Yes | Installable QA build + execution required |
| Higher-range Android | Yes | Installable QA build + execution required |
| Older supported iPhone | Yes | TestFlight/equivalent build + execution required |
| Current supported iPhone | Yes | TestFlight/equivalent build + execution required |

## Cross-platform execution

Repeat the Phase 12 shared-journey scenarios using real clients:

1. Register on Android → update profile on Web → confirm update on iOS.
2. Create content on Web → engage on Android → receive/inspect notification on iOS.
3. Start a transaction on Android → inspect on Web → perform authorised admin state change → confirm on iOS.
4. Suspend a test user in shared admin → confirm restriction on Web, Android and iOS.

## Nigerian-condition checks

At least one test pass must use constrained mobile connectivity and a realistic lower/mid-range Android device. Record slow loading, retries, interrupted requests, upload behaviour and whether recovery preserves valid user input.

## Operational readiness

Before inviting testers, confirm:

- stable beta/staging URL
- backend/API environment is not using production secrets in test clients
- test accounts and seeded listings are synthetic or consented
- support route is visible
- incident owner is named internally
- rollback path is known
- monitoring from Phase 11 is active
- tester feedback route is ready
- release notes identify the exact build/commit under test

## Release gate

SabiWay may be labelled **READY FOR CONTROLLED USER TESTING** only when all of the following are evidenced:

- no known Severity 1 defects
- critical Severity 2 defects resolved
- Phase 12 regression remains green
- browser runtime checks passed
- real-device Android/iOS checks passed
- controlled Android and iOS distribution exists
- stable beta/staging web environment passed smoke testing
- critical cross-platform journeys passed on real clients
- support and incident paths are ready
- rollback is possible
- release notes identify the tested build

Until those external runtime/distribution checks are complete, repository preparation may be merged but the final Phase 13 sign-off remains **OPEN**.
