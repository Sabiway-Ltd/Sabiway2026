# SabiWay Troubleshooting Guide

Use this guide to diagnose common development, integration, CI and deployment problems without introducing workaround code that hides the real cause.

## 1. General debugging principle

Before changing code, identify which layer is actually failing:

`UI` → `client state/config` → `network` → `backend route/permission` → `domain state/database` → `external provider` → `realtime delivery`.

Do not patch the UI around an authoritative backend/data problem.

## 2. Web loads but API calls fail

Check:
1. backend is running/reachable;
2. frontend API URL/environment is correct;
3. browser network request URL/status;
4. CORS/CSRF configuration;
5. authentication token/session;
6. backend logs;
7. backend permission/state.

Common symptoms:
- `401` — authentication/token issue;
- `403` — authenticated but not permitted / CSRF in relevant flows;
- `404` — wrong route/version/feature guard;
- `429` — rate limit;
- `5xx` — backend/integration failure.

Do not change a 403 to a client-side success state.

## 3. Login works locally but not preview/Production

Check:
- environment API base URL;
- CORS/CSRF trusted origins;
- HTTPS/cookie settings;
- OAuth callback URL/environment;
- JWT expiry/refresh behaviour;
- deployed frontend SHA vs expected branch;
- backend environment is actually the intended one.

Internal review mode should not be used to “fix” Production auth.

## 4. Internal review buttons do not appear

Verify frontend development flag, for example:

```env
NEXT_PUBLIC_INTERNAL_REVIEW_MODE=true
```

Then restart frontend.

If buttons appear but access fails, verify backend:

```env
DEBUG=True
INTERNAL_REVIEW_MODE=True
```

Restart backend.

If `DEBUG=False`, review access should remain unavailable by design.

## 5. Internal review unexpectedly works in Production-like setup

Treat as RED security issue.

Immediately verify:
- backend `DEBUG`;
- review-mode flag;
- deployment environment;
- endpoint guard tests;
- review account staff/superuser state.

Do not simply hide the frontend buttons; backend must deny access.

## 6. Django migration drift failure

If CI/local reports migrations needed:
1. inspect `git diff` for model changes;
2. run `python manage.py makemigrations --check --dry-run`;
3. if intentional model change, create and review migration;
4. if unintentional, revert model drift;
5. never disable migration-drift CI.

## 7. Migration succeeds locally but deployed DB fails

Possible causes:
- database-engine differences;
- existing Production data violates new constraint;
- migration order/dependency issue;
- non-null field lacks safe backfill/default;
- incompatible rename/drop;
- permissions/DB connection issue.

Do not repeatedly rerun destructive migrations. Stop and review data/migration plan.

## 8. Marketplace result differs between web and mobile

Check:
- both clients hit same backend/environment;
- same query/filter parameters;
- pagination defaults;
- stale local state/cache;
- role-specific filtering;
- backend serializer response.

Canonical result selection should be backend-driven, not separately implemented in each client.

## 9. Booking status looks wrong

Check:
- authoritative booking record;
- allowed marketplace status transitions;
- SabiPay transaction/funded/work state;
- whether UI is using stale cached data;
- audit/notification evidence.

Do not add a generic client endpoint/button that jumps directly into `in_progress`/`completed` if SabiPay owns the funded work transition.

## 10. Payment appears successful in UI but backend is pending/failed

Treat backend/provider reconciliation as authoritative.

Check:
- transaction reference;
- Paystack test/live environment;
- initialise response;
- verify/reconcile call;
- mismatch/failed/abandoned status;
- duplicate retry/idempotency behaviour.

Never mark success locally based only on frontend redirect/button state.

## 11. Duplicate payment concern

Stop repeated manual retries until you inspect:
- idempotency key/reference;
- existing transaction record;
- provider transaction status;
- retry code path;
- reconciliation logs/audit without exposing secrets.

Payment issues are RED.

## 12. Messages persist but realtime update is missing

This usually means authoritative backend state succeeded but delivery failed.

Check:
1. message exists via API;
2. recipient/participants correct;
3. Express service running;
4. socket authenticated;
5. user room/socket mapping;
6. internal broadcast response;
7. event name/payload;
8. client listener/reconnect state.

A page refresh/API fetch should still recover the message if architecture is working correctly.

## 13. Realtime event reaches wrong user

Treat as privacy/security incident.

Check:
- authenticated socket identity derivation;
- room/recipient mapping;
- internal broadcast recipient list;
- deduplication;
- event scoping;
- tests for participant isolation.

Do not use broad/global broadcast for private events.

## 14. Notifications duplicated

Check whether notification is emitted from more than one place:
- view/service;
- Django signal;
- transaction lifecycle hook;
- retry/reconciliation path.

This codebase uses signals, so duplication can happen if new inline side effects replicate existing signal behaviour.

## 15. Professional verification status does not update

Check:
- backend verification record;
- submission validation;
- reviewer decision/permissions;
- retention/evidence access;
- product/profile representation;
- client cache/refetch;
- notification event.

Do not allow a client-side status override.

## 16. User cannot see/administer support case

Check whether they are:
- case owner;
- Support/Operations staff;
- trying to access internal notes;
- missing required operational group/permission.

Internal notes should not be returned to ordinary users.

## 17. Frontend Production build fails while dev works

Run:

```bash
cd frontend
npm ci
npm run type-check
npm run lint
npm run build
```

Common causes:
- server/client component boundary;
- TypeScript error hidden by dev hot reload;
- unavailable environment variable at build time;
- unsupported dynamic usage;
- import/path case sensitivity;
- browser-only API used during server render.

Fix the build issue; do not remove the Production build CI step.

## 18. Mobile works in simulator but not physical phone

Check:
- API/realtime URL not using computer `localhost`;
- phone and development machine network reachability;
- cleartext/HTTPS platform restrictions;
- environment values loaded;
- device permissions;
- screen-size/layout differences.

## 19. Mobile typecheck passes but screen is broken

Typecheck does not validate runtime UI.

Inspect:
- navigation route registration;
- undefined runtime API data;
- keyboard/scroll layout;
- platform-specific component behaviour;
- physical/emulator logs;
- small-screen overflow.

## 20. Figma/export and implementation disagree

Use this order:
1. supplied Figma/export evidence;
2. current screen matrix/audit;
3. current mobile implementation;
4. current web translation;
5. product requirements/current founder instruction.

Classify difference as KEEP/IMPROVE/REWORK/REPLACE/REMOVE.

Do not claim exact parity until rendered comparison is done.

## 21. Design-system CI fails

Run:

```bash
node scripts/sync-design-tokens.mjs --check
```

Check:
- canonical token source changed without generated/synced counterpart;
- manual hard-coded divergence;
- formatting/schema mismatch.

Do not bypass token sync for a visual shortcut.

## 22. UI/UX fidelity audit check fails

Read the checker output and the relevant docs:
- `Documentation/FIGMA-EXPORT-SCREEN-MATRIX.md`;
- `Documentation/FINAL-UIUX-FIGMA-FIDELITY-AUDIT.md`.

The check intentionally prevents overclaiming visual certification.

## 23. Journey/readiness evidence check fails

Inspect:
- Phase 12 journey evidence;
- Phase 13 controlled-testing evidence;
- verification scripts under `scripts/`.

If a product change intentionally changes a journey, update the authoritative evidence honestly rather than editing the checker to ignore it.

## 24. Release Gate pending

The aggregate Release Gate waits for all dependent quality jobs.

Find which job is still pending/failing. Do not merge simply because required branch-protection contexts currently allow it.

## 25. Release Gate fails

One or more dependent jobs failed/skipped unexpectedly.

Fix the failing job/root cause. The aggregate gate is doing its job.

## 26. Deployment Eligibility passes but Vercel does not deploy

Deployment Eligibility means repository checks passed, not that external deployment occurred.

Check:
- Vercel Git integration;
- build-rate limit/plan state;
- project/repository/root directory;
- Production branch;
- deployment list/logs.

Do not advance Rolling Green Baseline until deployed Git SHA is verified where deployment applies.

## 27. Vercel build-rate-limit failure

This is an external platform limitation.

Do not repeatedly trigger redeploys. Record the blocker and retain previous deployment-verified baseline until the limit clears or infrastructure plan changes.

## 28. Vercel shows old website

Verify:
- correct project (`sabiway2026`);
- correct repository;
- root directory `frontend`;
- Production branch `main`;
- deployment Git SHA;
- deployment environment/alias;
- browser cache only after revision mismatch is ruled out.

Historical issue: wrong root/stale process can render old/V1/Express behaviour.

## 29. Codespaces shows stale frontend

Before destructive cleanup:

```bash
git status
git branch --show-current
git log -1 --oneline
```

If clean/intended branch, refresh dependencies/build cache according to project Codespaces documentation. Never use `git reset --hard` casually on unknown local work.

## 30. CI passes but Production smoke fails

Stop additional improvement merges.

Record:
- exact `main` SHA;
- deployed SHA;
- failing route/journey;
- runtime errors/logs;
- previous known-good deployment SHA.

Fix or revert through normal PR/release workflow. Do not call the new revision Rolling Green.

## 31. Documentation disagrees with code

Use current code/runtime evidence for implementation reality, then:
- inspect recent decisions/open issues;
- inspect historical phase evidence;
- update stale operational docs in the same PR.

Do not silently preserve a known false README claim.
