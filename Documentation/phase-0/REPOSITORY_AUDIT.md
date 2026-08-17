# Phase 0 — Current Repository, Security & Delivery Audit

Audit refreshed: 2026-08-17  
Repository: `Sabiway-Ltd/Sabiway2026`  
Default branch: `main`

## Current verified state

- Repository is public.
- Current product code is split across `frontend/`, `mobile/`, `Backend/`, `ExpressJs/`, `WaitList/` and `Documentation/`.
- `frontend/` is a Next.js/React/TypeScript application.
- `mobile/` is an Expo/React Native/TypeScript application.
- `Backend/` is Django + Django REST Framework with JWT support.
- `ExpressJs/` is an Express + Socket.IO realtime service.
- `.github/workflows/phase-0-ci.yml` exists and runs repository hygiene, Django system/migration/tests, realtime checks, frontend type/lint, waitlist syntax and mobile typecheck.
- `.github/dependabot.yml` exists.
- The latest verified `main` Platform CI run inspected during this refresh completed successfully.
- Repository hygiene CI rejects tracked `.env`, local databases, Python bytecode/cache, `node_modules` and virtual-environment directories.
- `ExpressJs/.env.example` exists; a live `.env` is not present in the current ExpressJs tree.
- Realtime internal broadcast endpoints now require `x-sabiway-internal-token` and authenticated Socket.IO connections validate access JWTs.

## Historical findings and present decision

| Historical issue | Current decision | Current status |
|---|---|---|
| Tracked `.env` / generated dependencies / local databases | REMOVE from source and reject in CI | Current tree protected by hygiene gate; historical Git exposure still requires credential rotation evidence |
| Hard-coded application secrets | REPLACE with environment-driven configuration | Current Phase 0 must verify sensitive settings remain environment-driven before exit |
| Unauthenticated realtime broadcast | REFACTOR | Remediated in current `ExpressJs/server.js`; KEEP current protected approach pending Phase 6 architecture review |
| No CI | REPLACE | Remediated; KEEP and improve as phase gates grow |
| No Dependabot | REPLACE | Remediated; KEEP |
| No mobile application | Historical assumption invalid | Mobile application now exists and must be audited as a first-class client |
| Frontend TypeScript/lint debt | IMPROVE | Current CI has blocking TypeScript/lint jobs and latest inspected `main` run passed |
| Sparse automated tests | IMPROVE | Backend journey tests now run in CI; coverage depth still expands by phase |
| Branch protection not enforced while private | RE-CHECK | Repository is now public, but the connected GitHub integration cannot read branch protection; manual GitHub Settings verification remains required |

## Current risks / Phase 0 blockers

### 1. Credential-rotation evidence — OPEN
Credentials previously exposed in repository history must be treated as compromised until rotation is confirmed. Current-tree cleanup alone is insufficient.

### 2. Branch-protection enforcement — MANUAL VERIFICATION REQUIRED
The repository is public, removing the previous private/free-plan limitation, but the current integration receives HTTP 403 when reading the protection endpoint. Confirm in GitHub Settings that `main` requires pull requests, required checks, resolved conversations and appropriate review rules.

### 3. Figma design audit — OPEN
The master playbook requires the existing mobile Figma to be inspected screen-by-screen. The repository does not provide the Figma file key, so design audit cannot be certified from GitHub alone.

### 4. Environment separation — OPEN EVIDENCE
Development, staging and production must use separate credentials and data. Code structure supports environment configuration, but Phase 0 requires named staging ownership and evidence before this control is considered closed.

### 5. Architecture authority review — IN PROGRESS
Existing functionality spans Django, Next.js, Expo and Express. Phase 0 must explicitly document which system owns identity, roles, profiles, verification, transactions, payments, realtime and admin decisions to prevent future duplication.

## Phase 0 repository decision

KEEP the current monorepo and current primary stacks. Do not perform a greenfield rewrite. Refactor only where a single-source-of-truth, security, maintainability, accessibility, performance or cross-platform gap is demonstrated.
