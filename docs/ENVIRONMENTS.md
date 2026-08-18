# SabiWay Environments and Configuration

This document explains environment boundaries, configuration ownership and safety rules. It exists to prevent local/review/test conveniences from leaking into Production.

## 1. Environment classes

Treat these as separate operational contexts:

### Local development
Purpose: developer implementation and debugging.

Characteristics:
- local backend/web/realtime/mobile tooling;
- local or development database;
- development-safe credentials;
- internal review mode may be enabled deliberately;
- payment provider must use sandbox/test credentials;
- destructive/disposable test data is allowed only in local/test stores.

### Preview
Purpose: branch/PR web review.

Characteristics:
- Vercel preview deployment of `frontend/`;
- branch-specific Git SHA;
- may use preview environment variables;
- not equivalent to Production approval;
- should not be trusted with Production-destructive credentials.

### QA/UAT / controlled testing
Purpose: realistic journey validation by internal/test users.

Characteristics:
- stable test endpoints/builds;
- dedicated test accounts/data;
- Android/iOS builds through Expo/EAS profiles where configured;
- sandbox payment provider;
- feedback/severity process;
- no Production-destructive testing.

### Production
Purpose: live user service.

Characteristics:
- secure environment variables;
- Production database/storage/integrations;
- `DEBUG=False` expected;
- internal review mode disabled/unavailable;
- HTTPS/secure cookies/HSTS applied according to validated infrastructure configuration;
- deployment must match intended Git revision before baseline advancement.

## 2. Environment source files

Use example files as names/documentation only:
- root `.env.example` — cross-project variable index;
- `Backend/.env.example` — backend configuration names/default guidance;
- `mobile/.env.example` — mobile client configuration;
- service-specific README/examples for Express/frontend/waitlist.

Real secrets must never be committed.

## 3. Backend configuration areas

Backend configuration includes categories such as:
- `SECRET_KEY`;
- `DEBUG`;
- `DATABASE_URL` / database SSL behaviour;
- CORS and CSRF origins;
- JWT access/refresh lifetimes;
- secure cookie/HTTPS/HSTS behaviour;
- Google OAuth values;
- Cloudinary/media values;
- email/Resend values;
- Paystack public/secret keys;
- SabiPay feature/policy values;
- verification key/retention/SLA values;
- realtime/internal broadcast token;
- request/upload bounds;
- API throttle rates;
- analytics/retention configuration;
- internal review mode.

Inspect `Backend/.env.example` and `Backend/sabiway/settings.py` before adding a new variable.

## 4. Web configuration

The web client should receive only values safe for client exposure when using `NEXT_PUBLIC_*` variables.

Never place backend/payment secret keys in client-exposed environment variables.

Typical web configuration includes:
- backend API base URL;
- realtime URL;
- client-safe public integration identifiers where appropriate;
- internal review UI flag for development/review environments.

## 5. Mobile configuration

Anything bundled into a mobile application should be treated as client-readable.

Do not embed:
- Paystack secret key;
- database credentials;
- internal broadcast secret;
- verification encryption/storage secret;
- backend `SECRET_KEY`.

Mobile should use public endpoints/identifiers only and delegate sensitive operations to the backend.

## 6. Internal review mode

Internal review mode is intentionally development-only.

Expected backend guards include:

```env
DEBUG=True
INTERNAL_REVIEW_MODE=True
```

Web may additionally require:

```env
NEXT_PUBLIC_INTERNAL_REVIEW_MODE=true
```

Safety invariants:
- backend refuses review access when Production-safe configuration is active;
- review identities are non-staff/non-superuser;
- review mode does not grant verification/moderation/finance/admin permissions;
- session is short-lived;
- review mode must not become a hidden Production support login.

## 7. CORS and CSRF

When web/mobile environments change endpoint/origin:
- update only approved origins;
- avoid wildcard Production origins without explicit security review;
- distinguish CORS from CSRF trusted origins;
- verify credential/cookie expectations;
- test actual browser behaviour.

Do not solve a local CORS problem by making Production globally permissive.

## 8. HTTPS and secure-cookie controls

Security settings must reflect real proxy/domain configuration.

Do not blindly enable settings that can lock out an incorrectly configured environment; equally, do not leave Production insecure because local development needs HTTP.

Production rollout of HTTPS redirect/HSTS/secure cookies should be verified against the actual reverse proxy/Vercel/backend deployment path.

## 9. Database environment safety

Before running commands that mutate data, verify which database URL is active.

Never run disposable test cleanup against Production.

Safe practice:
- print/confirm environment identity without logging secrets;
- use distinct database names/projects for local/test/Production;
- use read-only checks where possible for Production verification;
- do not use local SQLite assumptions to infer deployed PostgreSQL behaviour.

## 10. Payment environments

### Local/preview/UAT
Use Paystack test/sandbox keys.

### Production
Use Production provider credentials only in secure server-side environment configuration.

Never:
- expose secret key to frontend/mobile;
- replay live payment webhooks as disposable tests;
- mark local transaction success solely from client response;
- bypass provider verification/reconciliation.

## 11. Media and verification evidence

General user media and sensitive verification evidence may have different security expectations.

Do not assume a general public media URL is suitable for verification documents.

Review:
- storage configuration;
- access controls;
- retention;
- encryption/key handling where implemented;
- logging/analytics exposure.

## 12. Realtime environment

Realtime needs coordinated configuration between backend, Express and clients.

Typical concerns:
- socket URL;
- JWT signing/verification compatibility;
- allowed origins;
- internal broadcast token;
- user/session/payload limits.

The internal broadcast secret belongs only on trusted server-side components.

## 13. Vercel environments

For the SabiWay project, verify:
- correct Vercel project (`sabiway2026`);
- correct repository (`Sabiway-Ltd/Sabiway2026`);
- root directory `frontend`;
- framework Next.js;
- Production branch `main`;
- preview branch/deployment Git SHA;
- Production deployment Git SHA.

Do not mutate unrelated Vercel projects.

## 14. Expo/EAS environments

`mobile/eas.json` defines build profiles used for controlled mobile distribution.

When changing build configuration, document:
- profile purpose;
- API environment it targets;
- whether credentials/signing are required;
- whether build is internal/testing/store-ready;
- rollback/rebuild implications.

## 15. Adding a new environment variable

Before adding one:
1. decide which service owns it;
2. decide whether it is secret or client-safe;
3. choose clear name;
4. add it to the relevant `.env.example` with placeholder/comment, never real value;
5. provide safe default only if safe;
6. update this document or service README if operationally significant;
7. add tests/checks for required behaviour if absence/misconfiguration is dangerous.

## 16. Environment verification checklist before release

Confirm:
- correct target environment;
- correct Git SHA/deployment;
- Production `DEBUG` off;
- internal review off;
- correct API/realtime origins;
- correct database;
- correct payment mode;
- secrets present server-side only;
- CORS/CSRF allow intended clients;
- health/readiness succeeds;
- no test-only banner/feature path exposed unintentionally.

## 17. Secret handling

Never place secrets in:
- committed `.env`;
- README examples with real values;
- screenshots/issues/PR comments;
- frontend/mobile public variables;
- analytics events;
- application logs.

If a secret is exposed, treat it as compromised and rotate it; deleting the Git line is not sufficient.
