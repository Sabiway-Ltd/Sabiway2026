# SabiWay

SabiWay is a cross-platform marketplace, community and protected-transaction product designed for Nigerians at home and abroad. The current V2 product combines service discovery, jobs, messaging, SabiForum community, professional verification, bookings/scheduling, SabiPay-protected transactions, notifications, support and shared operations/admin capabilities across web and mobile.

This README is the orientation map for a new developer, new AI coding session, technical reviewer or contributor. It explains what the project is, where the code lives, how the major systems interact, how work must be started, and which documents are authoritative for each topic.

---

## 1. Start here — mandatory reading

Before changing code or infrastructure, read in this order:

1. [`AGENTS.md`](AGENTS.md) — mandatory repository bootstrap and AI/developer operating contract.
2. [`docs/DEVELOPER-START-HERE.md`](docs/DEVELOPER-START-HERE.md) — exact cold-start and readiness procedure.
3. [`CONTRIBUTING.md`](CONTRIBUTING.md) — branch/PR/testing/preservation rules.
4. [`docs/README.md`](docs/README.md) — engineering handbook index and role-specific reading paths.
5. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — service boundaries and authoritative system responsibilities.
6. [`docs/PROJECT-MAP.md`](docs/PROJECT-MAP.md) — repository structure, important folders and where to look first.
7. [`docs/USER-JOURNEYS.md`](docs/USER-JOURNEYS.md) — end-to-end critical user and staff journeys.
8. [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — UI/UX, Figma translation, responsive and accessibility rules.
9. [`docs/CI-CD.md`](docs/CI-CD.md) — CI, release gating, deployment evidence and Rolling Green rules.
10. [`docs/REGRESSION_TESTING.md`](docs/REGRESSION_TESTING.md) — required regression matrix.
11. [`docs/OPEN-ISSUES.md`](docs/OPEN-ISSUES.md) and [`docs/DECISIONS.md`](docs/DECISIONS.md) — known risks and consequential decisions.

`Documentation/` contains historical phase-completion, deployment, Figma-export and controlled-user-testing evidence. Preserve it as historical evidence; use `docs/` as the current operating handbook.

---

## 2. Product overview

SabiWay has two primary product roles:

- **Client** — discovers professionals/services, posts jobs, communicates, books work, pays through SabiPay, participates in community and manages history/profile.
- **Professional** — creates/maintains services, discovers/responds to work, manages conversations/bookings, completes verification, receives protected payments, manages earnings/history and participates in community.

Separate operational/staff roles exist in the Django backend for verification, moderation, support, finance and read-only operational work. Client-side role visibility is not authorisation; the backend remains authoritative.

### Core product areas

- Identity/authentication and password recovery
- Client/professional onboarding and profiles
- Professional verification and trust evidence
- Marketplace service categories/listings
- Client job posting and professional responses
- Messaging and booking/scheduling context
- Notifications and realtime delivery
- SabiForum community content and engagement
- SabiPay transaction lifecycle
- Disputes, refunds/releases and transaction safety
- Support/reporting/moderation
- Shared admin/operations
- Product analytics and technical monitoring

---

## 3. Repository architecture at a glance

| Path | Technology | Responsibility |
|---|---|---|
| `frontend/` | Next.js, React, TypeScript | Responsive web application and public/product surfaces |
| `mobile/` | React Native, Expo, TypeScript | Android/iOS client sharing the same backend/business journeys |
| `Backend/` | Django, Django REST Framework | Authoritative API, auth/permissions, models/migrations, marketplace, verification, SabiPay, notifications, operations and health/measurement |
| `ExpressJs/` | Node.js, Express, Socket.io | Authenticated realtime event delivery |
| `WaitList/` | Flask | Separate historical/pre-launch waitlist utility |
| `design-system/` | shared token files | Canonical cross-platform design tokens checked by CI |
| `scripts/` | Node utilities | Design-token sync and verification/readiness evidence checks |
| `docs/` | Markdown | Current engineering operating handbook |
| `Documentation/` | Markdown evidence | Historical phase completion, Figma/export, deployment and user-testing evidence |
| `.github/workflows/` | GitHub Actions | Platform CI and release evidence |

For a deeper explanation, read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/PROJECT-MAP.md`](docs/PROJECT-MAP.md).

---

## 4. How the systems interact

A typical authenticated request follows this shape:

`Web or Mobile UI` → `Django REST API` → `Django permissions/business rules` → `Django ORM/database`

For realtime-capable events:

`Django authoritative state` → `persisted notification/event evidence` → `Express/Socket.io delivery` → `connected Web/Mobile client`

Realtime is a delivery mechanism, not the source of truth. If realtime delivery fails, the underlying persisted business record must remain authoritative.

For SabiPay:

`booking/agreement` → `payment initialise/verify` → `funded state` → `work start/delivery` → `confirmation` → `release/refund/dispute`.

Do not introduce an alternate status path that bypasses the authoritative transaction state machine.

---

## 5. Rolling Green Baseline — how work is controlled

SabiWay uses a **Preservation-First Rolling Green Baseline**.

The latest merged commit is not automatically the trusted baseline. A new baseline requires:

1. exact `main` SHA verified;
2. required CI checks green for that exact revision;
3. deployment/promotion verified where applicable;
4. deployed revision matched to the intended Git SHA;
5. safe smoke checks complete;
6. previous known-good rollback revision retained.

See [`AGENTS.md`](AGENTS.md) and [`docs/CI-CD.md`](docs/CI-CD.md).

---

## 6. Current development workflow

Every material change should follow:

`Repository bootstrap` → `Readiness Brief` → `Success criteria` → `Preservation boundaries` → `Risk classification` → `Focused branch` → `Implementation` → `Tests` → `Docs` → `PR` → `Exact-head CI` → `Merge` → `Post-merge verification` → `Baseline advancement`.

Risk levels:

- **RED** — auth, permissions, data/schema/security, canonical APIs, payments, verification, deployment/secrets, critical business state.
- **AMBER** — shared navigation/forms/components/layouts/design system/common utilities.
- **GREEN** — isolated copy/styling/docs/contained presentation.

Green does not mean untested.

---

## 7. Local development quick start

Do not commit real secrets. Copy service `.env.example` files and obtain required values from the project owner/environment manager.

### Backend

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Default local port: `8000`.

Useful checks:

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test health accounts search posts notifications marketplace verification sabipay operations
```

### Web

```bash
cd frontend
npm ci
npm run dev
```

Default local port: `3000`.

Checks:

```bash
npm run type-check
npm run lint
npm run build
```

### Realtime

```bash
cd ExpressJs
npm ci
npm run check
node server.js
```

Default local port: `5000`.

### Mobile

```bash
cd mobile
npm ci
npm start
```

Type check:

```bash
npm run typecheck
```

Use Expo/EAS profiles according to `mobile/eas.json` for controlled builds.

### Waitlist

Only run this when working specifically on the historical waitlist utility:

```bash
cd WaitList
pip install -r requirements.txt
python app.py
```

See [`PORTS.md`](PORTS.md) and [`docs/ONBOARDING.md`](docs/ONBOARDING.md) for the full setup sequence.

---

## 8. Internal review mode

A development-only one-click review mode exists so authorised project reviewers can inspect protected internal product screens without using normal email/password/Google login.

It is intentionally guarded. It requires development-safe settings including backend `DEBUG=True` and `INTERNAL_REVIEW_MODE=True`, plus the frontend review flag. Review accounts are non-staff/non-superuser.

**Never enable or weaken this mechanism in Production.**

See `docs/ENVIRONMENTS.md` and the relevant auth implementation before changing it.

---

## 9. Database and schema ownership

Django models and versioned Django migrations under `Backend/` are the schema authority for the primary platform.

Rules:
- add a migration for model schema changes;
- do not casually rewrite applied migrations;
- preserve backward compatibility with both web and mobile where practical;
- never run destructive tests against Production;
- review rollback/data effects for irreversible schema changes;
- migration drift is checked in CI.

---

## 10. Authentication and authorisation

The backend is authoritative for access control.

Important rules:
- Client and Professional are product roles;
- operational/staff groups are separate;
- hidden buttons are not security controls;
- JWT/OAuth/session changes are RED;
- server-side permissions must be tested directly;
- internal review access must remain development-only.

---

## 11. UI/UX and design baseline

The product uses a shared SabiWay visual language based on the supplied Figma export and canonical design tokens.

Current principles include:
- SabiWay green/orange brand language;
- responsive web translation rather than stretched mobile frames;
- role-aware Client/Professional home and navigation experiences;
- clear trust/payment/verification states;
- accessible focus and keyboard behaviour on web;
- WCAG 2.2 AA target;
- no colour-only status communication.

Code-level Figma alignment is not the same as physical-device/browser visual certification. Do not claim pixel-perfect parity without runtime evidence.

Read [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) and the Figma-export matrix under `Documentation/`.

---

## 12. CI and release gates

The current Platform CI workflow is `.github/workflows/phase-0-ci.yml`.

It covers:
- repository hygiene;
- design-system token sync;
- UI/UX fidelity evidence;
- Phase 12 journey contracts;
- Phase 13 controlled-testing readiness;
- backend deploy checks, migration drift and backend journeys;
- realtime checks;
- frontend TypeScript/lint/Production build;
- mobile typecheck;
- waitlist syntax;
- aggregate Release Gate;
- Deployment Eligibility evidence.

See [`docs/CI-CD.md`](docs/CI-CD.md) for exact semantics and known deployment limitations.

---

## 13. Documentation map

Use the document that matches the question:

| Question | Read |
|---|---|
| What must an AI/developer do before coding? | `AGENTS.md`, `docs/DEVELOPER-START-HERE.md` |
| How do I contribute safely? | `CONTRIBUTING.md` |
| What is the system architecture? | `docs/ARCHITECTURE.md` |
| Where is a feature/file likely located? | `docs/PROJECT-MAP.md` |
| How do end-to-end journeys work? | `docs/USER-JOURNEYS.md` |
| How should the UI look/behave? | `docs/DESIGN-SYSTEM.md` |
| How do environments/config work? | `docs/ENVIRONMENTS.md` |
| What tests should I run? | `docs/REGRESSION_TESTING.md` |
| How does CI/deployment/baseline advancement work? | `docs/CI-CD.md` |
| What risks are open? | `docs/OPEN-ISSUES.md` |
| Why was an architectural/release decision made? | `docs/DECISIONS.md` |
| How do I set up locally? | `docs/ONBOARDING.md` |
| What historical phase evidence exists? | `Documentation/` |

---

## 14. Security

See [`SECURITY.md`](SECURITY.md).

Treat the following as RED scope: authentication, authorisation, Production data, database security, canonical APIs, verification evidence, SabiPay/payment controls, secrets and deployment controls.

Never commit credentials, access tokens, real `.env` files, Production exports or local database files.

---

## 15. When documentation and code disagree

Do not guess.

1. Inspect the current code and live repository state.
2. Check recent `docs/DECISIONS.md` and `docs/OPEN-ISSUES.md`.
3. Check relevant historical evidence under `Documentation/`.
4. Treat current code/runtime evidence as authoritative for implementation reality.
5. Update stale operational documentation in the same PR as the correction.

The goal of this handbook is to make a cold-start session productive without relying on hidden conversation history.
