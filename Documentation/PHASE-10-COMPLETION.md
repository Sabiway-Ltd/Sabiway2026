# Master Phase 10 — Security, Privacy, Performance & Reliability Hardening

## Objective
Move the feature-complete SabiWay V2 platform toward user-safe operation without rebuilding the product or duplicating business rules.

## Existing-system audit and decisions
- Django/DRF security controls: **IMPROVE**. Existing JWT authentication, server-side permissions and audit records are retained; transport/session settings, token lifetime and rate limiting are hardened.
- Authentication recovery: **IMPROVE**. Generic password-reset responses were already enumeration-resistant; scoped abuse throttling is added.
- Google OAuth redirect: **REFACTOR**. JWTs are moved from URL query parameters to the URI fragment and removed from browser history immediately after capture.
- Verification documents: **KEEP/IMPROVE**. Existing encrypted storage, authenticated download and retention controls remain authoritative.
- Marketplace message uploads: **KEEP**. Existing 10 MB limit, MIME allow-list, extension/MIME agreement and basename sanitisation remain in force; global request-memory limits add another boundary.
- Search/feed/marketplace discovery: **IMPROVE**. Existing pagination/result caps remain; public search input is additionally capped at 120 characters.
- Realtime: **IMPROVE**. Existing JWT-authenticated Socket.IO and internal broadcast token remain; payload size, session count, timeouts and state recovery are bounded.
- Health checks: **REFACTOR**. Public readiness no longer leaks raw database exceptions; a database-independent liveness route is added.
- Web delivery: **IMPROVE**. Standard security headers, compression and modern image formats are configured centrally.

## Security controls delivered
- 30-minute default JWT access lifetime and 30-day rotating/blacklisted refresh lifetime, both configurable by environment.
- Adaptive DRF throttling for anonymous, authenticated, login, signup, reset, OAuth and token-refresh traffic.
- Generic login/password-reset failure behaviour retained.
- OAuth JWTs excluded from query strings, HTTP access logs and Referer headers by using URI fragments.
- Django anti-sniffing, clickjacking, referrer and cross-origin opener policies.
- Secure/session/HSTS settings are environment controlled so local development is not broken before HTTPS is configured.
- Admin session lifetime bounded to eight hours and browser-close expiry.
- Upload/request memory limits and existing feature-specific upload allow-lists retained.
- Production-secret placeholders remain environment-only; no production key is introduced into source.
- Express removes framework disclosure, rejects invalid/oversized broadcasts and requires expiring access JWTs.

## Privacy controls
| Data | Purpose | Primary access | Storage/control | Retention/change path |
|---|---|---|---|---|
| Account/profile data | identity, marketplace/community use | user + authorised operations | shared Django data layer | profile/account workflows; deletion policy remains operational/legal decision |
| Verification evidence | trust/eligibility | professional + authorised verification reviewers | encrypted verification storage | configurable retention; purge state already audited |
| Private messages | transaction communication | conversation participants | marketplace data layer | admin sees report/support metadata rather than routine bodies |
| Payment/transaction data | payment, escrow, reconciliation | transaction participants + finance/admin permissions | SabiPay records | financial/audit retention governed operationally |
| Support cases | user support | case owner + authorised support staff | operations app | internal notes never exposed to ordinary users |
| Operational audit | accountability | authorised administrators/analysts | append-only domain/operations records | retained for operational evidence |

Sensitive values are not added to analytics payloads in this phase. Full product/technical measurement belongs to Phase 11.

## Performance and realistic-network hardening
- Existing feed and marketplace pagination retained.
- Search results remain bounded and query length is now bounded.
- Next.js compression and AVIF/WebP output enabled.
- Django request-memory ceilings prevent unbounded in-memory multipart bodies.
- Socket.IO maximum payload size is 256 KB; per-user concurrent realtime sessions default to five.
- Socket.IO ping/recovery windows are bounded and temporary disconnect recovery is enabled for two minutes.
- Django-to-realtime broadcast remains best effort: database state is source of truth and a realtime outage does not roll back a successful transaction mutation.

## Reliability/failure behaviour
- `/api/health/live/` checks process liveness without requiring the database.
- `/api/health/` and `/api/health/ready/` check database readiness and return HTTP 503 without exposing driver/connection error text.
- Paystack requests already use explicit timeouts and translate provider/network failures into controlled SabiPay errors; this remains authoritative.
- Realtime service applies request/header/keep-alive timeouts and handles malformed client connections safely.
- Client OAuth callback removes credentials from browser history before fetching the profile and clears local credentials on failure.

## Automated evidence
Phase 10 adds tests for:
- bounded JWT lifetimes and refresh rotation/blacklisting;
- OAuth credentials not appearing in query strings;
- sensitive endpoint throttle-scope selection;
- database-independent liveness;
- readiness failure returning 503 without exception details;
- oversized public search rejection.

The existing Platform CI remains the regression gate for Django deploy checks, migration drift, backend journeys, frontend TypeScript/lint, mobile TypeScript, realtime syntax/behaviour, design-system sync, repository hygiene and waitlist syntax.

## Phase boundary / residual certification
This phase does **not** claim penetration-test certification, production load-test certification, physical low-end Android testing, physical iPhone testing or public-launch readiness. Phase 11 owns full observability/product measurement; Phase 12 owns end-to-end browser/device certification; Phase 13 owns controlled real-user testing readiness. Production must enable HTTPS-only cookie/redirect/HSTS settings only after the real domains and reverse proxy are verified.

## Exit criteria
Phase 10 can close when the exact PR head passes Platform CI and the hardening regression tests with no critical regression. The architecture remains one backend, one source of truth and one shared admin across web, Android and iOS.
