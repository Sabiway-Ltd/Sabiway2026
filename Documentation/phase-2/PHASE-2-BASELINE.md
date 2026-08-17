# Phase 2 — Identity, Authentication & Onboarding

Status: **IN PROGRESS — IMPLEMENTATION COMPLETE, FINAL CI/SESSION GATE OPEN**

## Programme constraint

Vercel deployment is intentionally deferred until **Master Phase 5**. Until then, Phase 2–4 validation uses GitHub Platform CI plus Codespaces/manual checks. This does not waive any phase quality gate and must not be treated as production/user-testing deployment approval.

## Objective

Deliver one SabiWay identity across Web + Android + iOS using the shared Django/DRF backend as the source of truth.

## Audit decisions

| Capability | Existing state / result | Decision |
|---|---|---|
| User identity | Custom email-based Django `User` retained | **KEEP / IMPROVE** |
| Roles | `accounts.User.role` remains authoritative | **KEEP** |
| Email confirmation | Pending signup now carries role, canonical phone and terms into the real account | **KEEP / IMPROVE** |
| Password recovery | Existing non-enumerating reset flow retained | **KEEP / IMPROVE** |
| JWT | SimpleJWT refresh rotation/blacklisting retained | **KEEP / HARDEN CLIENT STORAGE** |
| Google auth | New accounts no longer receive a session without role + explicit terms onboarding | **REFACTOR COMPLETE** |
| Admin | Existing Django admin account management retained | **KEEP** |
| Mobile auth | Existing flow upgraded with phone, explicit terms consent and account-state messaging | **IMPROVE COMPLETE** |
| Web auth | Existing routes retained; signup now has role, phone and explicit terms parity | **IMPROVE COMPLETE** |
| Phone identity | Optional canonical Nigerian mobile stored as `+234…` | **ADD COMPLETE** |
| Terms/onboarding | `terms_accepted_at` and `onboarding_completed_at` stored centrally | **ADD COMPLETE** |

## Implemented identity rules

- one shared Django account for Web + Android + iOS
- explicit `client` / `professional` role selection
- email normalisation and duplicate/pending-signup protection
- Nigerian phone normalisation for local `07/08/09…` and `+234…` mobile formats
- explicit terms acceptance before account creation
- terms and phone survive pending-email-confirmation flow
- onboarding completion is authoritative on the account
- suspended/inactive accounts receive no JWT session
- first-time Google users cannot bypass role/terms onboarding
- web and mobile signup payloads use the same backend contract
- password recovery continues not to reveal whether an email exists
- role/phone/onboarding state returned consistently in login session payloads
- regression coverage added for the above identity rules

## Remaining Phase 2 gates

- [x] Audit existing backend/Web/mobile auth.
- [x] Establish `User.role` as authoritative role.
- [x] Add central phone, terms and onboarding state.
- [x] Add Nigerian phone normalisation/validation.
- [x] Propagate identity fields through pending signup → confirmation → login.
- [x] Prevent Google first-login role/onboarding bypass.
- [x] Block suspended/inactive account sessions.
- [x] Bring web signup into role/phone/terms parity.
- [x] Bring Android/iOS signup into role/phone/terms parity.
- [x] Add backend regression tests for identity/onboarding state.
- [ ] Final Platform CI green on current Phase 2 head.
- [ ] Production browser-session boundary: JavaScript-readable refresh-token persistence must be replaced before controlled user-testing readiness. This is tracked as a mandatory security-hardening gate rather than a blocker to integrating the Phase 2 domain model/API/client contract.

## Browser session security note

The current web client still uses JavaScript-readable token persistence inherited from the existing implementation. Phase 2 has corrected consistency problems (refresh/user state is now stored and cleared coherently), but **this is not the desired production trust boundary**. The preferred production direction is an HttpOnly/Secure/SameSite server-issued browser session or equivalent BFF token boundary so refresh credentials are not readable by application JavaScript.

For sequencing, Phase 2 may be integrated once its functional/CI gate is green, while this security item remains mandatory before controlled user-testing readiness under the Master security-hardening phase. It is not waived for production.

## Delivery sequencing

Phase 3 may proceed as stacked work-in-progress, but it cannot merge to `main` before this Phase 2 dependency is integrated and green.

## Deployment rule

Do **not** add or change Vercel deployment during Phase 2, Phase 3 or Phase 4. Revisit deployment in Master Phase 5 after the preceding capability gates are merged and green.
