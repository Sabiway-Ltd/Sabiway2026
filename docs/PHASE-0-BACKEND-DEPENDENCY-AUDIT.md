# Phase 0 — Backend Dependency & Demo Architecture Audit

Status: IN PROGRESS
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
Related: `docs/PHASE-0-AUTH-SESSION-AUDIT.md`, `docs/PHASE-0-ROLE-IA-AUDIT.md`
Baseline reviewed: `main@ed53bf74191ff2e0d7da3e86973624160a5e0c51`

## 1. Objective

Identify which frontend experiences depend on backend/realtime services, how failures are represented today, where session handling is fragmented, and what deterministic frontend demo architecture is required before the deployed backend is ready.

## 2. Current service configuration

Public environment defaults currently resolve to:
- Django API: `https://backend.sabiway.com`
- realtime service: `https://realtime.sabiway.com`
- waitlist service: `https://waitlist.sabiway.com`

The product therefore assumes service endpoints even when the practical review environment does not have a usable connected backend.

Decision: **IMPROVE environment contracts and make data-source mode explicit.**

## 3. Current API access patterns

At least two backend access strategies are present:

### A. Axios shared API client
`frontend/app/services/api.ts`

Behaviour:
- injects `Authorization: Bearer <localStorage.access>`;
- on 401 attempts refresh using `localStorage.refresh`;
- writes refreshed access token back to `localStorage`;
- retries the failed request;
- redirects to `/login` if no refresh token or refresh fails.

Strength:
- centralised request/refresh behaviour for callers that actually use this client.

Critical defect:
- refreshed access is only written to localStorage;
- the middleware access cookie is not renewed here;
- therefore browser API state may consider the user valid while Next.js middleware still sees an expired/missing cookie and redirects routes to login.

Decision: **REWORK into one authoritative session/request strategy.**

### B. Raw `fetch()` calls
Important flows inspected in Phase 0 use direct `fetch()` rather than the shared Axios client, including auth login/signup/review flow, Google callback profile load and marketplace server data loading.

Impact:
- central Axios refresh/retry behaviour does not automatically apply;
- error handling differs by feature;
- auth/session behaviour is inconsistent;
- future telemetry/retry/correlation logic would need duplication.

Decision: **REWORK. Establish typed domain/API adapters rather than allowing arbitrary mixed request strategies.**

## 4. Session synchronisation defect

### BD0-001 — Cookie and localStorage can drift after refresh
Severity: P1

The middleware reads an `access` cookie.
The Axios API client reads and refreshes `localStorage.access`.
The refresh interceptor does not update the cookie.

Possible state:
1. user logs in;
2. cookie and localStorage initially contain the access token;
3. access token expires;
4. API request receives 401;
5. Axios refresh succeeds and updates localStorage;
6. middleware cookie remains expired/stale;
7. subsequent navigation can be redirected to `/login` even though API calls possess a refreshed token.

Required future outcome:
- one session authority;
- coordinated refresh;
- server-aware route state;
- no independently expiring copies that control different parts of the product.

## 5. Marketplace dependency defect

### BD0-002 — Infrastructure failure is represented as empty marketplace data
Severity: P1

Current marketplace server loading catches backend errors and returns empty arrays for listings, jobs and categories.

This collapses several distinct states into the same result:
- true zero supply;
- invalid environment URL;
- backend unavailable;
- network timeout/failure;
- unexpected API contract;
- authorisation failure where applicable.

Required data-state model:
- loading;
- success with data;
- success with genuine empty state;
- partial data;
- degraded/offline/unavailable;
- retryable error;
- permission/auth error;
- demo fixture state.

## 6. Demo architecture requirement

The rebuild needs a frontend review environment before backend integration is complete. This must not be implemented as a fake JWT or production auth bypass.

### Required model
Introduce an explicit data-source/application mode abstraction later in the rebuild:

`production | development-api | demo-fixtures`

The exact names are implementation details; the principle is mandatory.

### Demo mode characteristics
- clearly labelled non-production experience;
- no production credentials/tokens required;
- deterministic Client fixture account;
- deterministic Professional fixture account;
- realistic linked objects and states;
- no writes to real backend;
- no staff/admin identity simulation unless separately governed;
- removable/disableable without changing real authentication permissions.

### Client fixture set should include
- Client identity/profile;
- service/location preferences;
- recommended Professionals/services;
- at least one draft/open job;
- at least one job with responses;
- one active conversation;
- one upcoming/active booking;
- transaction/payment state examples;
- notification states;
- SabiForum examples;
- review/history states.

### Professional fixture set should include
- Professional identity/public profile;
- service listings;
- service area/delivery mode;
- verification state;
- relevant opportunities;
- submitted proposal/lead states;
- active conversation;
- upcoming work;
- earnings/pending payout examples;
- reviews/reputation;
- notifications;
- SabiForum examples.

## 7. Domain adapter strategy

Phase 7/20 should avoid embedding demo conditionals throughout pages.

Preferred conceptual architecture:

`UI -> domain hook/service -> data adapter -> [demo fixture adapter OR API adapter]`

Examples:
- `MarketplaceRepository`
- `JobsRepository`
- `MessagesRepository`
- `BookingsRepository`
- `PaymentsRepository`
- `ProfileRepository`
- `NotificationsRepository`

Naming may differ. The goal is isolation.

Benefits:
- UI can be reviewed without backend;
- backend integration later swaps adapters instead of rewriting screens;
- deterministic automated tests become easier;
- failure states can be intentionally simulated;
- API contract changes remain localised.

## 8. Features by backend dependency

### Mostly public/static today
These can be rendered without authenticated backend data, subject to route fixes and any dynamic category/location enrichment:
- homepage marketing content;
- For Clients;
- For Professionals;
- How it works;
- Fees;
- Trust & Safety;
- SabiPay explained;
- Verification information;
- company/legal/support information pages.

Decision: **KEEP publicly renderable; do not force login.**

### Backend-enriched / guest-capable
- marketplace search/results;
- service categories;
- service/location pages if data-backed;
- Professional public profiles;
- public/guest SabiForum content if approved.

Required behaviour when backend unavailable:
- explicit degraded/demo state, not fabricated success.

### Authenticated backend-dependent
- Home personalisation;
- My Jobs / opportunities;
- messages;
- notifications;
- own profile management;
- service listing management;
- bookings/scheduling;
- verification submission/status;
- earnings/payment/transaction surfaces;
- review creation;
- support cases;
- authenticated community interactions.

These need demo adapters before meaningful frontend-only product review.

### Realtime-dependent but must degrade safely
- message delivery updates;
- online/presence state where supported;
- live notifications;
- feed/event refresh where relevant.

Canonical state must remain backend-persisted after real integration. Realtime is delivery optimisation, not authority.

## 9. Failure-state requirements

Every backend-dependent screen must eventually support deliberately testable states:
- loading/skeleton;
- success;
- empty;
- partial;
- server unavailable;
- network unavailable;
- unauthorised/session expired;
- forbidden/role mismatch;
- retry in progress;
- stale data;
- offline/realtime disconnected where relevant.

Do not use one empty state for infrastructure failure.

## 10. API architecture defects

### BD0-003 — Mixed raw fetch and Axios architecture
Severity: P1/P2
Decision: REWORK

Central refresh/error logic cannot govern raw fetch callers.

### BD0-004 — Environment defaults imply services may exist when review backend is unavailable
Severity: P2
Decision: IMPROVE

The frontend should know whether it is in API-backed or demo mode rather than discovering backend absence through failed requests.

### BD0-005 — Demo access was previously coupled to authentication
Severity: P1 product testing
Decision: REPLACE approach

The previous temporary demo attempt tried to establish a synthetic auth state. The safer long-term frontend-review model is explicit demo application/data mode with deterministic role fixtures.

### BD0-006 — Data ownership boundaries need explicit contracts
Severity: P1 architecture
Decision: REWORK

Canonical domain state must belong to backend after integration. UI/local stores should manage presentation/cache/optimistic state, not become independent authorities for bookings, payment, verification, roles or reputation.

## 11. Security/privacy constraints for demo fixtures

Demo fixtures must:
- contain fictional data only;
- contain no copied production PII;
- contain no real verification documents;
- contain no payment secrets/provider references that resemble live credentials;
- be clearly recognisable as demo data;
- never enable staff/admin access;
- never weaken server-side API permission checks;
- never become a hidden production backdoor.

## 12. Testing benefit of fixture architecture

The same fixtures/adapters can support:
- visual regression;
- role-specific E2E;
- empty/error state testing;
- accessibility review;
- responsive screenshots;
- deterministic user-testing prototypes;
- frontend development during backend outages.

Fixtures should cover realistic state combinations, not only happy-path sample cards.

## 13. KEEP / IMPROVE / REWORK / REPLACE summary

### KEEP
- backend as future canonical domain authority;
- existing backend API concept;
- realtime as supplemental delivery layer;
- central request-client concept;
- guarded backend internal-review endpoint as a separate development facility.

### IMPROVE
- environment configuration;
- typed API contracts;
- failure observability;
- error/empty/loading states.

### REWORK
- mixed fetch/Axios request strategy;
- token refresh/session coordination;
- marketplace failure handling;
- feature-level backend coupling;
- local client state boundaries.

### REPLACE
- auth-bypass-as-demo architecture;
- implicit backend-presence assumptions.

## 14. Phase 1 / Phase 7 / Phase 20 inputs

### Phase 1
- route access must not depend on data adapter mode;
- public pages remain public even if backend is unavailable;
- protected routes use one session contract.

### Phase 7
- implement Client and Professional demo fixture adapters;
- enable complete internal frontend inspection without fake production auth;
- build realistic cross-screen state.

### Phase 20
- swap demo adapters to authoritative backend adapters;
- consolidate session/cookie/refresh strategy;
- enforce backend permissions and object-level security;
- add contract/integration tests.

## 15. Status

Backend dependency/demo architecture audit: **FIRST PASS COMPLETE**.

Further work is required to enumerate endpoint-by-endpoint dependencies for every screen family, but the primary architectural defects and rebuild direction are established.
