# SabiWay Engineering Onboarding

This guide is for a developer who is opening SabiWay for the first time and needs to understand the project, set up a safe local environment and know what “ready to contribute” means.

## 1. First-day objective

By the end of onboarding you should be able to:
- explain the web/mobile/backend/realtime architecture;
- identify the current repository and exact `main` revision;
- explain the Rolling Green Baseline model;
- run the services you need locally;
- run the main code-quality checks;
- identify where auth, marketplace, verification, SabiPay and operations logic live;
- explain the Client vs Professional product roles;
- identify current open risks before changing code;
- create a focused branch and PR without weakening existing protections.

## 2. Mandatory first read

Read in this order:

`AGENTS.md` → `README.md` → `docs/DEVELOPER-START-HERE.md` → `CONTRIBUTING.md` → `docs/README.md` → `docs/PROJECT-MAP.md` → `docs/ARCHITECTURE.md` → `docs/USER-JOURNEYS.md` → `docs/CI-CD.md` → `docs/REGRESSION_TESTING.md` → `docs/OPEN-ISSUES.md`.

For frontend/mobile work also read `docs/DESIGN-SYSTEM.md`.

Do not accept an improvement request until the Repository Readiness Brief is complete.

## 3. Prerequisites

Recommended local tooling:
- Git;
- GitHub account/repository access;
- Node.js 22 for closest parity with most CI jobs;
- Python 3.12 for backend/waitlist CI parity;
- npm;
- a code editor such as VS Code;
- approved local environment values;
- optional Docker/Codespaces tooling;
- Expo tooling for mobile runtime work.

Do not copy secrets from old chat messages, screenshots or source history. Obtain current values through the approved environment/secret process.

## 4. Clone and verify repository

```bash
git clone https://github.com/Sabiway-Ltd/Sabiway2026.git
cd Sabiway2026
git remote -v
git branch --show-current
git rev-parse HEAD
```

Confirm:
- remote points to `Sabiway-Ltd/Sabiway2026`;
- intended base is `main`;
- you understand whether current `main` is deployment-verified or merely merged.

Before making a branch, inspect `docs/OPEN-ISSUES.md` and active PRs.

## 5. Environment-file rules

Use:
- root `.env.example` as a high-level variable index;
- `Backend/.env.example` for backend variables;
- `mobile/.env.example` for mobile client variables;
- service-specific examples/readmes for other services.

Never commit:
- `.env` files with real values;
- access/refresh tokens;
- payment-provider secrets;
- database credentials;
- Cloudinary/email/OAuth secrets;
- local database files.

See `docs/ENVIRONMENTS.md`.

## 6. Backend setup

```bash
cd Backend
python -m venv .venv
```

Activate:

macOS/Linux:
```bash
source .venv/bin/activate
```

Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `Backend/.env` from approved local values.

Run migrations:

```bash
python manage.py migrate
```

Start backend:

```bash
python manage.py runserver
```

Default local URL: `http://localhost:8000`.

Useful health/API checks:
- readiness: backend health route;
- liveness: backend liveness route;
- Swagger/ReDoc routes when configured/running.

Quality checks:

```bash
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
python manage.py test health accounts search posts notifications marketplace verification sabipay operations
```

`check --deploy` may warn in intentionally non-Production local configuration; CI uses controlled environment values.

## 7. Web setup

In another terminal:

```bash
cd frontend
npm ci
```

Create `frontend/.env.local` with approved local API/realtime values.

Start:

```bash
npm run dev
```

Default local URL: `http://localhost:3000`.

Quality checks:

```bash
npm run type-check
npm run lint
npm run build
```

Always run the Production build before treating a material web change as ready. Development mode can hide build-time issues.

## 8. Realtime setup

```bash
cd ExpressJs
npm ci
npm run check
node server.js
```

Typical local port: `5000`.

Realtime needs correctly configured backend/internal/JWT-related values. It should be tested with authenticated clients; unauthenticated connections should not become an accepted shortcut.

## 9. Mobile setup

```bash
cd mobile
npm ci
npm start
```

Type check:

```bash
npm run typecheck
```

The project uses Expo/EAS configuration (`mobile/eas.json`) for controlled build profiles.

For runtime work, verify:
- mobile API base URL points to an address reachable from the device/emulator;
- localhost assumptions are correct for emulator/device type;
- Android and iOS layout differences where relevant;
- physical-device certification is not implied by typecheck.

## 10. Waitlist setup

Only run this service when the task affects the historical waitlist utility.

```bash
cd WaitList
pip install -r requirements.txt
python app.py
```

Do not mistake WaitList storage/logic for the authoritative main SabiWay backend.

## 11. Internal review mode for UI inspection

Development-only review access can be enabled for internal product review.

Backend example:

```env
DEBUG=True
INTERNAL_REVIEW_MODE=True
```

Frontend example:

```env
NEXT_PUBLIC_INTERNAL_REVIEW_MODE=true
```

Then restart affected services and use the login-page internal review controls.

Important:
- review users are non-staff/non-superuser;
- review mode must remain disabled in Production;
- this mode does not replace real authentication testing.

## 12. Local service order

A useful startup order is:

1. database/backend;
2. realtime;
3. web;
4. mobile if needed.

If the frontend shows unexpected auth/API failures, first verify the backend health and configured API URL rather than changing UI code immediately.

## 13. Common setup problems

### Frontend loads but API calls fail
Check:
- backend is running;
- frontend API environment value;
- CORS/CSRF origin configuration;
- browser network panel;
- backend logs.

### Mobile cannot reach local backend
A physical phone cannot usually use the development computer’s `localhost`. Use an accessible LAN/tunnel URL configured for the mobile app.

### Realtime appears disconnected
Check:
- Express service running;
- JWT/access token validity;
- socket URL;
- allowed origin/configuration;
- internal broadcast/auth settings.

### Django reports migration drift
Do not ignore it. Determine whether a model change is missing a migration or an unintended local edit exists.

### Vercel preview differs from local
Verify deployment Git SHA, environment variables, root directory and whether the preview is from the branch you think it is.

See `docs/TROUBLESHOOTING.md` for a deeper matrix.

## 14. Before creating your first branch

Complete the Readiness Brief, then write:
- success criteria;
- preservation boundaries;
- affected journey(s);
- risk RED/AMBER/GREEN;
- proposed files;
- tests;
- docs to update.

Example branch names:
- `feat/marketplace-filter-improvement`;
- `fix/verification-permission-regression`;
- `chore/release-gate-hardening`;
- `docs/deep-project-handbook`.

Do not work directly on protected `main`.

## 15. Your first safe test change

For a first contribution, prefer a contained GREEN/AMBER task that does not alter payments/auth/schema. This helps you learn:
- branch/PR workflow;
- exact-head CI;
- design/test conventions;
- post-merge baseline verification.

Do not use a SabiPay/auth migration as an onboarding exercise.

## 16. PR expectations

A PR should explain:
- problem/root cause;
- success criteria;
- preservation boundaries;
- risk;
- affected systems/journeys;
- tests/checks;
- docs updated;
- screenshots/runtime evidence for UI changes;
- migration/security/payment implications;
- rollback considerations.

Merge only the exact verified head.

## 17. Post-merge responsibility

After merge, do not immediately start stacking another material change.

Verify:
- exact resulting `main` SHA;
- required checks/Release Gate;
- deployment revision if applicable;
- safe smoke checks;
- previous rollback revision.

Only then advance the Rolling Green Baseline.

## 18. Where to ask “where does this live?”

Use `docs/PROJECT-MAP.md` first. Then inspect the relevant service/app directly.

If documentation and code disagree, current code/runtime evidence is authoritative for implementation reality, and stale operational docs should be corrected in the same PR.
