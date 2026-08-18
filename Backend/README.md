# SabiWay Backend

This directory contains the authoritative SabiWay V2 backend built with Django and Django REST Framework.

It is no longer limited to authentication, profiles, posts and notifications. It now owns the shared platform API, primary schema/migrations, marketplace, professional verification, SabiPay, support/operations, notifications, health/readiness, measurement and server-side authorisation used by both web and mobile.

Before changing this service, read root `AGENTS.md`, root `README.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT-MAP.md`, `docs/USER-JOURNEYS.md`, `docs/REGRESSION_TESTING.md` and `docs/ENVIRONMENTS.md`.

## 1. Backend authority

The Django backend is authoritative for:
- account identity;
- authentication/token issuance;
- product role data;
- server-side permissions;
- canonical business validation;
- marketplace/booking state;
- professional verification state;
- SabiPay/payment/work/dispute/refund/release state;
- persisted notifications/audit records;
- primary database schema and migrations;
- operational staff access.

Web/mobile clients may render allowed actions, but they are not the final authority for permission or state transitions.

## 2. Main apps

| App | Responsibility |
|---|---|
| `accounts/` | account identity, signup/login/JWT/password/OAuth-related behaviour, guarded internal review access |
| `profiles/` | profile data and profile-related side effects/signals |
| `search/` | bounded cross-domain search |
| `posts/` | SabiForum posts/comments/engagement/moderation-related content |
| `notifications/` | persisted notification history/preferences/delivery evidence |
| `marketplace/` | categories, service listings, client jobs, professional responses, booking/scheduling and transaction context |
| `verification/` | professional verification submission/evidence/review lifecycle |
| `sabipay/` | protected transaction/payment/work/dispute/refund/release lifecycle |
| `operations/` | support cases, operational configuration, consolidated audit/measurement/admin support |
| `health/` | liveness/readiness/health behaviour |
| `docs/` | backend-served API/documentation routes where configured |
| `sabiway/` | Django project settings, URLs and core configuration |

Verify exact current files/URLs from source before changing behaviour.

## 3. Setup

```bash
cd Backend
python -m venv .venv
```

Activate the environment, then:

```bash
pip install -r requirements.txt
```

Create `Backend/.env` using approved values based on `Backend/.env.example`. Never commit real secrets.

Run migrations:

```bash
python manage.py migrate
```

Start:

```bash
python manage.py runserver
```

Default local URL: `http://localhost:8000`.

## 4. Required quality commands

```bash
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
python manage.py test health accounts search posts notifications marketplace verification sabipay operations
```

These commands are part of Platform CI. A focused RED change should also add/run targeted tests for the changed permission/state/migration behaviour.

## 5. Schema and migrations

Django models + migrations are the primary platform schema authority.

Rules:
- model schema change requires migration;
- do not casually rewrite applied migrations;
- review generated SQL/data effect for material changes;
- preserve compatibility with both web and mobile;
- consider deployment order/backward compatibility;
- never mutate Production destructively to make tests pass;
- migration drift must remain green.

## 6. Important implementation pattern: signals

This codebase uses Django signals for some cross-domain side effects.

Examples historically include profile creation/counters and notification creation after engagement events.

When tracing “what happens after X?” inspect:
- model save/delete;
- endpoint/service;
- `signals.py` in the same/related app;
- notification/profile signal modules;
- tests.

Do not move or duplicate logic until you understand signal-driven behaviour. Otherwise you may create duplicate notifications/counters or remove hidden side effects.

## 7. Authentication

Authentication uses the backend account model and JWT-based flows, with optional Google OAuth integration.

Current security expectations include:
- bounded access-token lifetime;
- rotating/blacklisted refresh behaviour;
- server-side validation;
- production-safe cookie/origin settings as configured;
- rate limiting for sensitive auth endpoints;
- no raw bearer-token exposure in query-string OAuth redirects.

Any auth/token/OAuth change is RED and must be checked against both web and mobile.

## 8. Product roles and staff roles

Primary product roles:
- Client;
- Professional.

Operational/staff roles are separate permission groups used for verification, moderation, support, finance/admin/read-only operations.

Never infer staff permission from product role.

## 9. Internal review access

Development-only internal review access exists for UI/product inspection.

Expected guard:
- `DEBUG=True`;
- `INTERNAL_REVIEW_MODE=True`;
- review identities are non-staff/non-superuser;
- endpoint unavailable under Production-safe settings.

Never relax these guards to simplify testing.

## 10. Authorisation

Server-side permissions are authoritative.

When adding/changing endpoints, test:
- unauthenticated access;
- correct owner/participant;
- authenticated wrong user;
- wrong product role;
- staff group permissions where applicable;
- superuser/admin distinction where applicable.

Do not treat a hidden frontend button as proof that an API is safe.

## 11. Marketplace domain

Marketplace owns authoritative concepts for discovery and pre-payment transaction setup, including:
- categories/subcategories;
- Professional service listings;
- Client job postings;
- Professional responses;
- conversation/thread linkage;
- booking/agreement;
- scheduling.

Important invariant: generic marketplace status endpoints must not provide an alternate route into work/payment states that are owned by SabiPay.

## 12. SabiPay domain

SabiPay owns protected transaction state.

Key safety goals:
- idempotent payment initiation/retry;
- provider verification/reconciliation;
- explicit payment status;
- duplicate-charge prevention;
- funded-work gating;
- participant-authorised delivery/confirmation;
- dispute freeze/resolution;
- controlled release/refund;
- auditability.

Payment-provider responses are external evidence, not blindly trusted truth. Validate and reconcile.

Do not log Paystack secret keys, sensitive provider payloads or private dispute evidence.

## 13. Verification domain

Professional verification handles sensitive evidence and reviewer decisions.

Requirements:
- evidence access restricted;
- reviewer permissions explicit;
- retention/configuration respected;
- decisions auditable;
- Client/Professional cannot self-approve;
- sensitive evidence not exposed in general serializers/analytics.

## 14. Notifications

Notifications persist authoritative history/preferences/delivery evidence.

Realtime/email/push are delivery channels. Their failure should not remove/corrupt the authoritative business event.

When adding a notification:
- identify event source;
- avoid duplicate signal/service emission;
- identify recipients;
- keep sensitive payload minimal;
- test participant privacy.

## 15. Operations/admin

Django admin is the shared operational surface.

`operations/` provides shared support/config/audit/measurement capabilities and least-privilege staff groups.

Rules:
- internal notes stay internal;
- platform configuration must not become secret storage;
- material operational actions should be auditable;
- read-only roles should not gain mutation privileges accidentally.

## 16. Health/readiness

Health logic distinguishes process liveness from database-backed readiness.

Requirements:
- liveness should not depend unnecessarily on database health;
- readiness should fail safely when DB unavailable;
- public health responses must not leak raw exception/secret text;
- health responses should avoid stale caching.

## 17. API documentation

When configured/running, backend API documentation is available through Swagger/ReDoc/schema routes under the backend documentation URLs.

Use live generated schema/routes as current API evidence; do not treat old V1 docs as complete V2 API authority.

## 18. Environment configuration

Inspect `Backend/.env.example` and `sabiway/settings.py`.

Configuration areas include:
- database;
- JWT;
- CORS/CSRF;
- HTTPS/cookies/HSTS;
- Cloudinary;
- email;
- OAuth;
- verification;
- SabiPay/Paystack;
- realtime broadcast;
- throttling;
- upload/request bounds;
- internal review mode;
- analytics/retention.

Never add a real secret to source or `.env.example`.

## 19. Adding/changing an endpoint

Before coding:
1. identify authoritative domain;
2. inspect existing URL/viewset/service pattern;
3. define serializer validation;
4. define permissions;
5. define state transition/idempotency;
6. inspect signals/side effects;
7. add success + negative permission tests;
8. verify web/mobile compatibility;
9. update docs/journey if contract changes.

## 20. Adding/changing a model

Before coding:
1. determine if an existing model can be extended;
2. avoid duplicate transaction/order/audit models;
3. define constraints/indexes/default/null behaviour;
4. create migration;
5. review compatibility/rollback;
6. add tests;
7. update architecture/project-map docs if domain ownership changes.

## 21. Debugging workflow

When an unexpected API result occurs:
- reproduce with exact user/role/state;
- inspect response/status;
- inspect view/serializer/permission;
- inspect model/service/signals;
- inspect DB record state;
- inspect notification/audit side effects;
- inspect tests;
- do not immediately patch the frontend around a backend contract bug.

## 22. Before opening a PR

Confirm:
- risk classification correct;
- success criteria/preservation boundaries explicit;
- schema/auth/payment implications documented;
- targeted + backend journey tests green;
- migration drift green;
- no secrets/local DB tracked;
- docs updated;
- rollback implications recorded for material RED changes.
