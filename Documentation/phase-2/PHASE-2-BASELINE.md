# Phase 2 — Identity, Authentication & Onboarding

Status: **IN PROGRESS**

## Programme constraint

Vercel deployment is intentionally deferred until **Master Phase 5**. Until then, Phase 2–4 validation uses GitHub Platform CI plus Codespaces/manual checks. This does not waive any phase quality gate and must not be treated as production/user-testing deployment approval.

## Objective

Deliver one SabiWay identity across Web + Android + iOS using the shared Django/DRF backend as the source of truth.

## Audit decisions

| Capability | Existing state | Decision |
|---|---|---|
| User identity | Custom email-based Django `User` exists | **KEEP / IMPROVE** |
| Roles | `client` / `professional` stored on `User` and pending signup | **KEEP** as authoritative identity role |
| Email confirmation | `PendingSignup` confirmation flow exists | **IMPROVE** |
| Password recovery | Code + reset token flow exists | **KEEP / IMPROVE** |
| JWT | SimpleJWT with refresh rotation/blacklisting exists | **IMPROVE** session/client handling |
| Google auth | Existing OAuth login/creation exists | **REFACTOR** so new users cannot bypass role/onboarding requirements |
| Admin | Django admin can search/manage users | **KEEP / IMPROVE** |
| Mobile auth | Existing `AuthFlow` covers role, signup, login and recovery | **IMPROVE**, do not rebuild |
| Web auth | Existing login/signup/recovery routes exist | **IMPROVE / REFACTOR** to shared design system and role parity |
| Phone identity | Not persisted/normalised | **ADD** Nigerian-friendly optional canonical phone field |
| Terms/onboarding state | Not persisted | **ADD** centrally |

## Phase 2 requirements being closed

- one shared account across all clients
- role persistence
- email confirmation
- password recovery
- secure logout/session expiry behaviour
- suspended account restriction
- duplicate-account controls
- Nigerian phone normalisation (`080…`, `070…`, `081…`, `090…`, `+234…`)
- terms acceptance and onboarding state
- admin account lookup
- web/mobile loading, error and accessibility parity
- cross-platform auth regression tests

## Deployment rule

Do **not** add or change Vercel deployment during Phase 2, Phase 3 or Phase 4. Revisit deployment in Master Phase 5 after the preceding capability gates are merged and green.
