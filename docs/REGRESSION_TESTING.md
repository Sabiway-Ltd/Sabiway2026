# Regression Testing

## Baseline Contract
Future changes must preserve these current behaviours unless the PR explicitly changes them:
- role-aware web/mobile navigation;
- signup, confirmation, login, password recovery, logout and guarded internal-review access;
- server-side authorisation and staff least privilege;
- profiles/onboarding/verification and verification evidence privacy;
- marketplace search, listings, jobs, responses, booking and scheduling lifecycle;
- messaging/realtime participant isolation;
- SabiForum posting, comments, engagement and moderation;
- notification history/preferences/delivery evidence;
- SabiPay idempotent payment, reconciliation, escrow/work states, payout/refund/dispute controls;
- support/admin/audit evidence;
- responsive and accessible critical layouts;
- persistence/migrations and cross-device continuity.

## Current automated commands
From repository root/CI equivalents:

```bash
# Backend
cd Backend
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
python manage.py test health accounts search posts notifications marketplace verification sabipay operations

# Web
cd frontend
npm ci
npm run type-check
npm run lint
npm run build

# Mobile
cd mobile
npm ci --ignore-scripts
npm run typecheck

# Realtime
cd ExpressJs
npm ci
npm run check

# Repository evidence gates
node scripts/sync-design-tokens.mjs --check
node scripts/verify-uiux-fidelity-audit.mjs
node scripts/verify-phase12-journeys.mjs
node scripts/verify-phase13-readiness.mjs
```

## Characterisation tests
Before modifying a critical flow, add or identify a test that proves the existing behaviour. Then add the new expected behaviour. RED changes should include negative/permission/failure-path coverage, not only success paths.

## Browser/E2E strategy
The repository currently has journey contracts and production-build checks but does not enforce a real browser runner in Platform CI. Chrome/Edge/Safari/Firefox and representative Android/iPhone runtime certification remain external/manual evidence until an approved automated browser/device strategy is added.

## Test environments and data
Use local, preview, QA/UAT or sandbox data. Payment testing must use sandbox/test provider credentials. Internal-review accounts must never receive staff/superuser privileges.

Do not point destructive tests at Production. Do not delete or mutate Production records to reset a test. Clean up disposable local/UAT data through explicit fixtures/scripts/processes scoped to that environment.

## Database testing
Django migrations are authoritative. CI migration-drift must stay green. Material schema changes require migration tests/compatibility reasoning and a rollback/data-safety plan.

## Release regression gate
A PR is not merge-ready because one targeted test passes. Run every check required by the change scope. After merge, rerun/verify required evidence on the exact resulting `main` revision before baseline advancement.
