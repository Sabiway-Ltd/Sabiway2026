# SabiWay Engineering Onboarding

## Mandatory first read
Before setup or coding: `AGENTS.md` → `docs/DEVELOPER-START-HERE.md` → `CONTRIBUTING.md` → `docs/README.md` and linked architecture/design/CI/regression/open-issues documents.

Do not accept an improvement request until the Repository Readiness Brief is complete.

## Prerequisites
- Git and a GitHub account with appropriate repository access
- Node.js 22 for web/realtime CI parity
- Python 3.12 for backend/waitlist CI parity
- npm
- environment values supplied through approved secret/environment management
- optional Docker/Codespaces according to the existing service documentation

## Service setup

### Backend
```bash
cd Backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# create Backend/.env from approved local values; never commit it
python manage.py migrate
python manage.py runserver
```

### Web
```bash
cd frontend
npm ci
# create frontend/.env.local with approved local endpoints
npm run dev
```

### Realtime
```bash
cd ExpressJs
npm ci
npm run check
# run the service using its package scripts/README for the current branch
```

### Mobile
```bash
cd mobile
npm ci --ignore-scripts
npm run typecheck
# use Expo/EAS/local device tooling according to mobile configuration
```

### Waitlist
Only start `WaitList/` when the task affects it. It is a separate Flask utility.

## Environment variables
Use the service `.env.example` files plus root `.env.example` as a variable-name index. Never commit real values. Never use Production payment, database or storage credentials for local destructive testing.

## Before a branch
Verify live `main`, current Rolling Green Baseline, current CI/deployment evidence and open/stale work. Then document success criteria, preservation boundaries, journey and RED/AMBER/GREEN risk.

Branch naming should be focused, e.g. `fix/...`, `feat/...`, `chore/...`, `docs/...`. Do not develop features directly on `main`.

## Required checks
Use `docs/REGRESSION_TESTING.md` and `.github/workflows/phase-0-ci.yml`. Run every check required for the affected scope. Do not disable a check because a change makes it fail.

## PR workflow
PRs must explain success criteria, preservation boundaries, risk classification, tests, documentation, migration/security impact and rollback/release considerations. Merge only the exact reviewed/verified head.

## After merge
Fetch exact resulting `main` SHA, verify required checks, verify deployment where applicable, match deployed revision, perform safe smoke checks and retain the previous known-good revision. Only then update the Rolling Green Baseline status.
