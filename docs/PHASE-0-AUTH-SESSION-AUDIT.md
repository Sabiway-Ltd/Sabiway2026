# Phase 0 — Authentication & Session Lifecycle Audit

Status: IN PROGRESS
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
Baseline: `main@ed53bf74191ff2e0d7da3e86973624160a5e0c51`

## 1. Objective

Establish the current web authentication/session truth before designing the new role-aware identity architecture.

Audit scope:
- email/password login;
- signup;
- Google OAuth callback;
- access/refresh storage;
- cookie behaviour;
- localStorage behaviour;
- session hydration;
- route guards;
- logout;
- expiry/refresh;
- return-to-intent;
- role/onboarding resolution;
- internal review mode.

This document does not authorise weakening authentication. Phase 20 will integrate the final server-authoritative model.

## 2. Current session model observed

### Email/password login
`useAuthStore.login()` calls Django `/api/auth/login/` and then `storeSession()`:
- access token -> `access` cookie;
- access token -> `localStorage.access`;
- refresh token -> `localStorage.refresh`;
- user -> `localStorage.user`;
- Zustand state -> user/access/refresh.

The cookie is client-written with:
`max-age=28800; SameSite=Strict; Secure`
(8 hours).

### Google callback
Google callback reads access/refresh from URL fragment or query fallback, removes credentials from browser history, then:
- writes access to `localStorage`;
- writes refresh to `localStorage`;
- writes access cookie with `max-age=1800` (30 minutes);
- fetches `/api/profiles/me/` using Bearer access token;
- writes normalized user to localStorage;
- sends user into Zustand;
- redirects to `/home`.

### Session hydration
`loadUserFromStorage()` trusts that both serialized `user` and `access` exist in localStorage and then hydrates Zustand. It does not validate token expiry or refresh before treating the local session as usable presentation state.

### Middleware
Middleware checks only for the presence of `access` cookie, not token validity, user role or onboarding state.

### Logout
Active Zustand `logout()`:
- expires the access cookie;
- deletes access/refresh/user/review markers from localStorage;
- clears Zustand;
- redirects `/`.

A separate `auth.logout()` API helper exists which posts the refresh token to `/auth/logout/`, but the active Zustand logout path does not call it.

## 3. Confirmed findings

### A0-001 — Authentication authority is fragmented across cookie, localStorage and Zustand
Severity: P1
Decision: REPLACE architecture; preserve temporary compatibility during migration

There are multiple copies of session state:
- cookie access;
- localStorage access;
- localStorage refresh;
- localStorage user;
- Zustand user/access/refresh.

Middleware trusts cookie presence, while AppShell/MarketplaceShell rely on localStorage/user state.

Impact:
- the sources can disagree;
- stale values can create contradictory UI;
- logout/expiry can affect one layer before another;
- server and client may render different access assumptions.

Required outcome:
Define one canonical server/session authority and a client session projection. Presentation must not decide authentication truth.

### A0-002 — No refresh/expiry recovery exists in the active store
Severity: P1
Decision: BUILD controlled session lifecycle

The store retains a refresh token but contains no active refresh routine or expiry recovery path.

Impact:
- expired access may leave stale local user state;
- middleware can continue seeing a cookie until its client-set expiry even if the JWT is invalid;
- API calls may fail without a coordinated transition to refresh or signed-out state.

Required Phase 20 outcome:
- server-authoritative access validity;
- controlled refresh/rotation strategy where backend supports it;
- single retry policy;
- hard failure -> clear session -> preserve safe return intent -> role-aware login.

### A0-003 — Normal and Google login write different access-cookie lifetimes
Severity: P1 correctness
Decision: REPLACE with one session policy

Normal login: 8 hours.
Google callback: 30 minutes.

Impact:
A user's routing experience differs depending on authentication method even if backend tokens have the same real validity.

Required outcome:
Cookie/session lifetime must be derived from one backend/security policy, not duplicated literals in UI flows.

### A0-004 — Client JavaScript writes the access cookie
Severity: P1 security architecture
Decision: REVIEW/REPLACE during backend integration

Current access cookie is created with `document.cookie`, so it cannot be HttpOnly.

Risk:
Any XSS with script execution can read browser-accessible token state. The project also duplicates the token into localStorage.

Required Phase 20 security decision:
Prefer an architecture where browser JavaScript does not need long-lived bearer credentials if backend/deployment topology supports secure HttpOnly cookies/BFF/session handling. If bearer-token architecture remains necessary, formally threat-model and minimise token exposure/lifetime.

Do not change this piecemeal without backend contract work.

### A0-005 — Active logout does not call available backend logout endpoint
Severity: P1 security/session lifecycle
Decision: REWORK

`frontend/app/services/auth.ts` exposes `auth.logout({ refresh })`, but `useAuthStore.logout()` only clears client state.

Impact:
If backend logout/revocation/blacklisting is part of intended security semantics, current web logout may leave the server-side refresh credential valid until natural expiry.

Required outcome:
Final logout contract must explicitly state whether refresh tokens are revoked/rotated/blacklisted and must execute the authoritative server logout when applicable, followed by deterministic client cleanup even when network logout fails.

### A0-006 — Middleware treats cookie presence as authentication
Severity: P1
Decision: REPLACE route contract

No validity, role or onboarding check occurs in middleware.

Required outcome:
Middleware/route guards should consume a trusted session signal appropriate to the chosen backend architecture. Role/object permission remains backend-authoritative.

### A0-007 — Local session hydration trusts serialized user state
Severity: P1 correctness/security UX
Decision: REWORK

`loadUserFromStorage()` parses local serialized user when local access exists. The role/name/onboarding information is not revalidated at hydration time.

Impact:
- stale role or onboarding state;
- UI may expose incorrect navigation until an API rejects actions;
- local data can be manually altered, meaning it must never be treated as permission authority.

Required outcome:
Client user data is presentation/cache only. Role/permission authority remains server-side; session bootstrap should resolve current user state from authoritative session/profile when backend is live.

### A0-008 — Google callback ignores original return intent
Severity: P1 conversion/UX
Decision: REWORK

Successful Google authentication always routes to `/home`.

Required outcome:
OAuth state must securely preserve:
- intended Client/Professional journey;
- safe return path;
- required onboarding continuation.

Never put sensitive data in OAuth state or analytics.

### A0-009 — Email/password and Google success routing are not governed by one destination resolver
Severity: P1 IA
Decision: BUILD central destination resolver

Email login page reads `next` and otherwise uses `/home`.
Google uses `/home` directly.
Middleware with an access cookie visiting login/signup sends to `/community`.

There are therefore at least three competing post-auth destination rules.

Required target resolution order:
1. suspended/blocked/account action state;
2. required role-specific onboarding;
3. safe pending intent if user is authorised;
4. Client home or Professional home;
5. explicit fallback/error state.

### A0-010 — Review mode is coupled to real backend availability
Severity: P2 development workflow
Decision: KEEP secure backend review mode; BUILD separate demo adapter

Current `reviewLogin()` calls the backend internal review endpoint.

The guarded backend mode is useful when a development backend exists and should remain protected. It does not solve current frontend architecture review while no usable backend is deployed.

Required Phase 7 outcome:
- deterministic frontend demo state;
- Client and Professional demo identities;
- zero claims of real authentication;
- no production enablement;
- easy removal when backend integration is complete.

## 4. Security/privacy observations

### Credentials in URL handling
Google callback primarily reads credentials from fragment, with query fallback for compatibility, and removes browser history before profile fetch. This cleanup behaviour is positive and should be preserved during redesign where applicable.

However query-based credential fallback should be considered temporary and removed when compatibility need ends because URLs can leak through logs/history/referrers depending on environment.

### Analytics
No credentials, refresh tokens, access tokens, password values, private verification evidence or payment details may be captured in product analytics.

### Demo mode
Demo fixtures must contain invented non-sensitive data only. Never seed with copied production/user personal data.

## 5. Target session states for future architecture

The UI should explicitly model at least:

- `unknown` / bootstrapping;
- `guest`;
- `authenticated_client`;
- `authenticated_professional`;
- `onboarding_required`;
- `session_refreshing` where applicable;
- `session_expired`;
- `suspended/blocked`;
- `permission_denied`;
- `demo_client`;
- `demo_professional`.

Do not represent every failure as “not logged in”.

## 6. Phase 1 identity/access contract inputs

Phase 1 must define:
- route access classes;
- role-aware navigation ownership;
- guest vs authenticated transitions;
- return-to-intent contract;
- central post-auth destination resolver;
- onboarding route ownership;
- demo state isolation.

Phase 4–6 will define the role-specific user experience.
Phase 20 will define the final server/session implementation.

## 7. Testing requirements derived from this audit

Future automated coverage must include:

- guest -> protected action -> login -> original action;
- Client login -> Client home;
- Professional login -> Professional home;
- Professional acquisition -> Professional signup preserved through OAuth;
- incomplete onboarding -> correct onboarding continuation;
- invalid/expired session -> safe recovery;
- logout -> server/client cleanup;
- stale local user data cannot grant server permission;
- direct URL to Client-only/Professional-only/staff-only routes;
- Google and password login produce equivalent destination/session semantics;
- demo sessions cannot access real privileged/backend operations.

## 8. Audit status

Completed this pass:
- active auth store;
- middleware interaction;
- Google callback;
- logout helper comparison;
- post-auth routing inconsistencies.

Next:
- inspect backend auth contract to distinguish intentional token semantics from frontend drift;
- Client vs Professional target IA;
- onboarding code/state audit;
- social/profile visibility policy.
