# SabiWay

SabiWay is a cross-platform marketplace, community and protected-transaction product for Nigerians at home and abroad. This repository contains the current V2 web, mobile, shared backend, realtime service, SabiPay, verification, operations/admin and historical waitlist implementation.

## Mandatory engineering start
Before making product or infrastructure changes, read in this order:

1. [`AGENTS.md`](AGENTS.md) — mandatory repository bootstrap contract for every developer/AI session.
2. [`docs/DEVELOPER-START-HERE.md`](docs/DEVELOPER-START-HERE.md) — cold-start/readiness procedure.
3. [`CONTRIBUTING.md`](CONTRIBUTING.md) — preservation-first contribution/release rules.
4. [`docs/README.md`](docs/README.md) — engineering handbook index.

The repository uses a **Preservation-First Rolling Green Baseline**. A merge alone does not make a revision the baseline; required CI and, where applicable, deployment verification must succeed for the exact revision.

## Current service map

| Path | Stack | Responsibility |
|---|---|---|
| `frontend/` | Next.js / React / TypeScript | Responsive SabiWay web product: auth, marketplace, messages, SabiForum, profiles, notifications, verification, SabiPay, support/legal/public surfaces |
| `mobile/` | React Native / Expo / TypeScript | Android/iOS client using the same shared product identity and backend journeys |
| `Backend/` | Django / Django REST Framework | Authoritative API, data models/migrations, auth/authorisation, marketplace, verification, SabiPay, notifications, operations/admin and health/measurement |
| `ExpressJs/` | Node / Express / Socket.io | Authenticated realtime delivery |
| `WaitList/` | Flask | Separate historical/pre-launch waitlist utility |
| `design-system/` | shared tokens | Canonical cross-platform design tokens checked by CI |
| `Documentation/` | Markdown evidence | Historical phase completion, deployment, Figma-export and controlled-testing evidence |
| `docs/` | Markdown handbook | Current engineering governance, architecture, design, CI/CD, testing and onboarding |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for actual implementation boundaries and [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) for the current UI/UX baseline.

## Local development
Use [`docs/ONBOARDING.md`](docs/ONBOARDING.md) and the service-specific README files. Do not commit real credentials. Root [`.env.example`](.env.example) is a variable-name index; service examples remain authoritative for service-specific configuration.

Typical ports are documented in [`PORTS.md`](PORTS.md).

## Quality gates
GitHub Actions runs Platform CI for repository hygiene, design-system consistency, UI/UX/journey/readiness evidence, backend checks/tests/migration drift, frontend type/lint/Production build, mobile typecheck, realtime checks and waitlist syntax. See [`docs/CI-CD.md`](docs/CI-CD.md) and [`docs/REGRESSION_TESTING.md`](docs/REGRESSION_TESTING.md).

Known release/governance gaps are tracked openly in [`docs/OPEN-ISSUES.md`](docs/OPEN-ISSUES.md). Do not treat stale historical README claims or old phase branches as current architecture evidence.

## API documentation
When the Django backend is running, its API documentation is exposed through the configured Swagger/ReDoc routes under the backend docs URLs.

## Security
See [`SECURITY.md`](SECURITY.md). Auth, authorisation, Production data, canonical APIs, database security, deployment controls, secrets and critical business/payment rules are RED change scope and require explicit preservation boundaries and broad verification.
