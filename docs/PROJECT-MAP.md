# SabiWay Project Map

Use this document when you know **what product area you are changing but not yet where the relevant code lives**. It is a navigation guide, not a replacement for inspecting source.

## Root-level map

### `frontend/`
Current responsive web product built with Next.js/React/TypeScript.

Look here for:
- public landing/about/help/legal pages;
- auth pages and callbacks;
- authenticated product routes;
- marketplace discovery/jobs/listings;
- messaging workspace;
- SabiForum/community;
- profiles;
- notifications;
- verification;
- SabiPay presentation;
- shared web shell/navigation/components.

Useful places to inspect first:
- `frontend/app/` — App Router routes/layouts/loading/error states;
- `frontend/app/(auth)/` — authentication route group;
- `frontend/app/_components/` — shared route-level components;
- `frontend/app/config/` — web configuration;
- `frontend/app/design/` and shared styles — design-related implementation;
- `frontend/app/globals.css` — global styling/tokens integration;
- `frontend/app/layout.tsx` — root web layout/providers;
- `frontend/next.config.ts` — Next.js/runtime/header/image configuration;
- `frontend/package.json` — scripts/dependencies;
- `frontend/.env.example` or environment configuration if present.

When changing a route, inspect its page/component plus any shared auth/data helper it consumes.

### `mobile/`
React Native/Expo/TypeScript Android/iOS client.

Look here for:
- Client/Professional mobile navigation;
- home/dashboard;
- jobs/marketplace;
- messaging;
- SabiForum;
- profile;
- verification;
- SabiPay/earnings/history;
- mobile API/realtime integration.

Useful places:
- `mobile/App.tsx` — top-level mobile navigation/orchestration;
- `mobile/src/` — screens/components/services/state;
- `mobile/app.json` — Expo app configuration;
- `mobile/eas.json` — build/distribution profiles;
- `mobile/.env.example` — mobile configuration names;
- `mobile/package.json` — scripts/dependencies.

### `Backend/`
Authoritative Django/DRF backend and primary platform schema.

Important apps:
- `Backend/accounts/` — accounts/auth-related behaviour;
- `Backend/profiles/` — user profiles and profile side effects;
- `Backend/search/` — bounded search;
- `Backend/posts/` — SabiForum content/engagement;
- `Backend/notifications/` — persisted notifications/preferences/delivery evidence;
- `Backend/marketplace/` — categories/listings/jobs/responses/bookings/scheduling/messaging transaction context;
- `Backend/verification/` — professional verification lifecycle/evidence;
- `Backend/sabipay/` — payment/escrow/work/dispute/refund/release lifecycle;
- `Backend/operations/` — support/admin/config/audit/measurement operations;
- `Backend/health/` — liveness/readiness/health checks;
- `Backend/sabiway/` — Django project settings/URLs/core configuration.

Typical files inside an app:
- `models.py` — persistence/schema/domain objects;
- `serializers.py` — API validation/representation;
- `views.py` or viewsets — endpoints/orchestration;
- `urls.py` — routing;
- `permissions.py` — access control;
- `services.py` — domain/service logic where used;
- `signals.py` — side effects triggered by model events;
- `admin.py` — operational admin surface;
- `tests.py` / `test_*.py` — regression/permission/state tests;
- `migrations/` — schema history.

Always inspect signals before moving domain side effects.

### `ExpressJs/`
Node/Express/Socket.io realtime service.

Look here for:
- socket authentication;
- realtime connection lifecycle;
- room/user scoping;
- internal broadcast routes;
- payload/session limits;
- reconnection/recovery behaviour;
- realtime health.

Key entry point: `ExpressJs/server.js`.

### `WaitList/`
Historical Flask pre-launch waitlist utility.

It is separate from the authoritative SabiWay platform backend. Only modify it when the requested task explicitly concerns waitlist behaviour.

### `design-system/`
Canonical design-token source used by cross-platform design synchronisation.

Before changing colours/spacing/radius/etc., inspect:
- token source files;
- sync script under `scripts/`;
- affected frontend/mobile usage;
- `docs/DESIGN-SYSTEM.md`.

### `scripts/`
Repository verification utilities.

Current important scripts include checks for:
- design-token synchronisation;
- UI/UX fidelity evidence;
- Phase 12 journey contracts;
- Phase 13 controlled-testing readiness.

### `.github/workflows/`
GitHub Actions CI/release definitions.

Current primary workflow:
- `.github/workflows/phase-0-ci.yml` — Platform CI, aggregate Release Gate and Deployment Eligibility.

Treat workflow/required-check changes as RED release-control scope.

### `docs/`
Current engineering operating handbook.

This is where new operational guidance should usually go.

### `Documentation/`
Historical phase evidence and delivery artefacts.

Examples include:
- phase completion reports;
- Vercel/Codespaces deployment evidence;
- Figma-export screen matrix;
- final UI/UX fidelity audit;
- controlled-user-testing readiness documents.

Preserve history. Link to it from current docs instead of rewriting it.

## “I need to change X — where do I start?”

### Login/authentication
Inspect:
- `frontend/app/(auth)/`;
- mobile auth screens/state in `mobile/src/`;
- `Backend/accounts/`;
- Django settings/JWT configuration;
- auth tests;
- internal review-mode guards.

Risk: RED.

### Client/Professional role behaviour
Inspect:
- account/profile role fields;
- backend permissions;
- web/mobile navigation logic;
- role-specific home/dashboard components;
- tests for role isolation.

Risk: AMBER or RED if permissions change.

### Marketplace search/categories
Inspect:
- `Backend/search/` and/or `Backend/marketplace/`;
- web marketplace routes/components;
- mobile marketplace/job screens;
- pagination/filter code;
- journey tests.

### Service listing
Inspect:
- marketplace models/serializers/views;
- professional UI forms;
- listing ownership permissions;
- web/mobile listing rendering.

### Client job posting / Professional job responses
Inspect:
- marketplace models and response lifecycle;
- ownership/role permissions;
- web/mobile job forms/lists/details;
- conversation hand-off.

### Booking/scheduling
Inspect:
- marketplace booking/schedule models/services/endpoints;
- messaging booking context;
- web/mobile booking status presentation;
- SabiPay hand-off.

Risk: RED if changing authoritative lifecycle.

### Messaging
Inspect:
- backend message/thread persistence in relevant marketplace/messaging code;
- participant permissions;
- web messaging workspace;
- mobile messaging screen;
- Express realtime delivery.

### Notifications
Inspect:
- `Backend/notifications/`;
- signal/event creation points;
- web/mobile notification UI;
- Express delivery if realtime update involved.

### SabiForum/community
Inspect:
- `Backend/posts/`;
- post/comment/engagement signals/permissions;
- `frontend/app/community/` and related components;
- mobile community screens;
- moderation/reporting paths.

### Professional verification
Inspect:
- `Backend/verification/`;
- verification evidence storage/access rules;
- reviewer/admin permissions;
- web/mobile verification screens;
- gating logic.

Risk: RED.

### SabiPay/payment/dispute
Inspect:
- `Backend/sabipay/` models/services/views/tests;
- marketplace booking hand-off;
- Paystack integration code/config;
- web/mobile SabiPay screens;
- operations/admin finance/dispute views;
- transaction audit/notification logic.

Risk: RED.

### Support/admin/moderation
Inspect:
- `Backend/operations/`;
- Django admin registration;
- moderation/reporting models;
- staff groups/permissions;
- user support API/UI.

### Analytics/monitoring
Inspect:
- measurement models/services/endpoints under backend operations/health/analytics-related code;
- client event instrumentation;
- admin/operations measurement views;
- retention/pruning commands;
- docs Phase 11 evidence.

### UI design-system change
Inspect:
- `design-system/`;
- sync script;
- `frontend/app/globals.css` and shared components;
- mobile shared styles/components;
- Figma/export evidence;
- `docs/DESIGN-SYSTEM.md`.

### Deployment/Vercel
Inspect:
- `.github/workflows/phase-0-ci.yml`;
- `docs/CI-CD.md`;
- `Documentation/DEPLOYMENT-VERCEL-CODESPACES.md`;
- Vercel project metadata;
- current `main` and deployed Git SHA.

Risk: RED.

## Source-of-truth rules by concern

| Concern | Authority |
|---|---|
| User identity/auth/permissions | Django backend |
| Primary schema | Django models + migrations |
| Marketplace/booking lifecycle | Django marketplace domain |
| SabiPay/payment state | Django SabiPay domain + validated provider evidence |
| Realtime delivery | Express/Socket.io (delivery only) |
| Persisted notification history | Django notifications |
| Product roles | Backend account/profile role + server permissions |
| Operational staff permissions | Django groups/permissions/admin |
| Canonical design tokens | `design-system/` |
| Current engineering process | `AGENTS.md` + `docs/` |
| Historical phase evidence | `Documentation/` |
| Release workflow | `.github/workflows/phase-0-ci.yml` + live branch protection |
| Production web deployment | live Vercel deployment metadata |

## When this map is not enough

If you cannot identify the owner of a behaviour:
1. search for the API route/model/component name;
2. inspect tests;
3. inspect signals;
4. inspect recent `docs/DECISIONS.md`;
5. inspect historical phase evidence;
6. only then propose a new abstraction.

Do not create duplicate domain models or parallel status machines just because the existing ownership was not immediately obvious.
