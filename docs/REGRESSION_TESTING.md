# SabiWay Regression Testing Strategy

This document defines what existing behaviour must be protected, which tests/checks are expected for different change types, and what evidence is still external/manual.

## 1. Baseline Contract

Future changes must preserve these behaviours unless the PR explicitly changes them:
- role-aware Client/Professional navigation on web and mobile;
- signup, confirmation, login, password recovery, logout and guarded internal-review access;
- server-side authorisation and operational least privilege;
- onboarding/profile/verification and verification-evidence privacy;
- marketplace search, categories, listings, jobs, responses, booking and scheduling lifecycle;
- messaging participant isolation and realtime delivery boundaries;
- SabiForum posting, comments, engagement, reporting/moderation;
- persisted notification history/preferences/delivery evidence;
- SabiPay idempotent payment, reconciliation, work-state, refund/release/dispute controls;
- support/admin/audit evidence;
- responsive/accessibility behaviour for critical web/mobile screens;
- database persistence/migrations;
- cross-device continuity between web and mobile.

A PR that intentionally changes one of these must say so explicitly in success criteria and preservation boundaries.

## 2. Test philosophy

Regression testing is not only “run the whole suite”. For each change:
1. identify the behaviour being preserved;
2. identify the new behaviour;
3. add/locate a characterisation test for current behaviour;
4. add success-path evidence;
5. add failure/permission/state-boundary evidence where relevant;
6. run broader checks required by risk classification.

## 3. Risk-to-test matrix

### GREEN
Examples: isolated copy, docs, contained styling.

Expected:
- targeted lint/type/build/docs check;
- relevant visual/manual check for UI changes;
- no unnecessary full backend mutation tests if the backend is untouched.

### AMBER
Examples: shared navigation, forms, components, design system, shared utilities.

Expected:
- targeted tests;
- frontend/mobile type checks as relevant;
- Production web build for web changes;
- design-system/UIUX checks for shared presentation;
- responsive/accessibility review;
- affected journey contract verification.

### RED
Examples: auth, permissions, schema/security, canonical APIs, SabiPay, verification, deployment controls.

Expected:
- targeted unit/integration tests;
- negative permission tests;
- state-transition/failure-path tests;
- migration drift and compatibility review for schema work;
- backend journey suite;
- cross-client compatibility review;
- release-gate evidence;
- provider sandbox/reconciliation evidence for payment changes;
- rollback/data-effect plan.

## 4. Backend commands

From `Backend/`:

```bash
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
python manage.py test health accounts search posts notifications marketplace verification sabipay operations
```

### What backend tests should protect
- auth/session/OAuth behaviour;
- permissions and participant isolation;
- serializer validation;
- lifecycle transitions;
- idempotency;
- database integrity;
- health/readiness behaviour;
- no sensitive exception leakage;
- operational role restrictions.

For a RED change, add focused tests even if the broad suite already passes.

## 5. Web commands

From `frontend/`:

```bash
npm ci
npm run type-check
npm run lint
npm run build
```

### Web regression areas
- route availability/guards;
- auth-store/session handling;
- Client vs Professional navigation;
- loading/empty/error states;
- marketplace filters/search/result rendering;
- messaging panes and booking context;
- community feed/composer/detail;
- profile/verification/SabiPay states;
- responsive layout;
- keyboard focus/accessibility.

A successful `npm run dev` is not equivalent to a successful Production build.

## 6. Mobile commands

From `mobile/`:

```bash
npm ci --ignore-scripts
npm run typecheck
```

### Mobile regression areas
- Client/Professional role-specific navigation;
- bottom-navigation state;
- marketplace/jobs;
- messaging/community/profile;
- verification/SabiPay;
- API compatibility;
- loading/error/empty states;
- smaller-screen overflow;
- Android/iOS differences.

Typecheck does not prove runtime behaviour on physical devices.

## 7. Realtime commands

From `ExpressJs/`:

```bash
npm ci
npm run check
```

### Realtime regression areas
- JWT authentication;
- room/recipient isolation;
- event allow-listing;
- payload size limits;
- socket session limits;
- internal broadcast-token protection;
- recovery/reconnect behaviour;
- graceful failure without corrupting backend state.

## 8. Repository evidence gates

From repository root:

```bash
node scripts/sync-design-tokens.mjs --check
node scripts/verify-uiux-fidelity-audit.mjs
node scripts/verify-phase12-journeys.mjs
node scripts/verify-phase13-readiness.mjs
```

These prove repository evidence/contracts remain intact. They do not replace runtime/browser/device tests.

## 9. Journey regression matrix

### Identity
Test:
- register;
- confirm/activate where applicable;
- login;
- password recovery;
- logout;
- invalid credentials;
- expired/invalid tokens;
- internal review mode enabled only under development-safe settings.

### Profile/verification
Test:
- profile read/update;
- role-appropriate fields;
- verification submission/status;
- reviewer permissions;
- evidence privacy;
- rejected/needs-action states.

### Marketplace
Test:
- search/categories;
- listing/job visibility;
- ownership permissions;
- response lifecycle;
- conversation hand-off;
- booking agreement;
- scheduling;
- invalid/forbidden transitions.

### Messaging/realtime
Test:
- participant-only access;
- send/read history;
- realtime update;
- reconnect/fallback;
- unauthorised room/user access denied.

### SabiForum
Test:
- create/read/update/delete where permitted;
- comments/engagement;
- moderation/reporting;
- notification side effects;
- ownership/staff restrictions.

### SabiPay
Test:
- initialise;
- idempotent retry;
- provider verification/reconciliation;
- failed/mismatch states;
- funded → work start transition;
- delivery/confirmation;
- release/refund;
- dispute freeze/resolution;
- participant/staff permissions;
- no duplicate charge path.

### Support/admin
Test:
- user can access only own support information;
- internal notes remain private;
- operational groups have intended access only;
- audit records are created for material actions.

## 10. Browser/runtime strategy

Automated Platform CI currently includes contract/build checks but does not fully certify runtime execution across:
- Chrome;
- Edge;
- Safari;
- Firefox;
- physical Android devices;
- physical iPhones.

Until an approved browser/device automation strategy is implemented, maintain this as explicit manual/external evidence.

Do not mark browser/device certification complete because CI is green.

## 11. Responsive/UI review widths

For web visual regression, review at representative widths such as:
- 320;
- 360;
- 375;
- 390;
- 430;
- 768;
- 1024;
- 1280;
- 1366;
- 1440+.

Check:
- overflow;
- hidden actions;
- collapsed navigation;
- form usability;
- text wrapping;
- keyboard focus;
- modal/drawer size;
- payment/trust context visibility.

## 12. Database testing

For schema changes:
- generate/review migration;
- run migration drift;
- migrate forward in non-Production environment;
- verify existing data compatibility;
- verify API/web/mobile expectations;
- assess rollback/reversibility;
- test uniqueness/constraints and null/default behaviour.

Do not reset Production data to make a migration easier.

## 13. Payment testing

Use Paystack test/sandbox credentials only for automated/non-Production testing.

Verify:
- provider responses are validated;
- duplicate/retry paths are safe;
- transaction reference reconciliation works;
- failed/mismatch provider state cannot become success locally;
- dispute/refund/release actions are authorised;
- sensitive keys/payment details are not logged.

## 14. Test data policy

Use:
- local fixtures;
- dedicated test database;
- preview/UAT disposable accounts;
- guarded internal-review accounts for UI inspection;
- sandbox payment credentials.

Never:
- use Production payment credentials in local tests;
- delete Production records to reset a test;
- make review accounts staff/superuser for convenience;
- embed secrets in test fixtures committed to Git.

## 15. Failure-path expectations

RED/AMBER tests should consider:
- unauthenticated user;
- authenticated wrong user;
- wrong role;
- missing/invalid input;
- duplicate request;
- stale state;
- provider/network failure;
- database/readiness failure;
- realtime unavailable;
- empty result;
- slow loading/retry.

## 16. PR regression evidence

A material PR description should list:
- targeted tests added/updated;
- commands run;
- CI run/status;
- runtime screenshots/device evidence if applicable;
- migration evidence if applicable;
- provider sandbox evidence if applicable;
- known untested areas.

Do not write “all tests pass” if only one local command was executed.

## 17. Release regression gate

Before merge:
- exact PR head known;
- targeted tests green;
- Platform CI green;
- aggregate Release Gate green;
- no required check bypassed.

After merge:
- exact resulting `main` SHA verified;
- deployment revision matched when applicable;
- safe smoke checks completed;
- previous rollback SHA retained.

Only then advance the Rolling Green Baseline.
