# Master Phase 8 — Payments, Transaction Safety & Disputes

## Objective

Make money-related activity safe and understandable across web, Android and iOS while keeping Django/DRF as the transaction source of truth.

The Master Playbook requires the journey:

`Transaction → Amount → Payment option → Confirmation → Provider → Success / pending / failure → Backend reconciliation → Receipt/status`

and specifically requires support for interrupted connections, slow callbacks, app closure, repeated Pay clicks, pending bank confirmation and return from an external payment provider.

## Existing-system pre-check

Phase 8 audited and deliberately reused the Phase 7 SabiPay foundation instead of rebuilding it. Existing strengths retained:

- accepted-booking funding contract;
- Paystack hosted checkout and server-side verification;
- payment-attempt references and idempotency keys;
- webhook signature validation and replay protection;
- transaction audit ledger;
- reconciliation command and transaction reconciliation service;
- payout destinations and payout records;
- controlled refunds;
- seven-day post-delivery release freeze;
- web and mobile SabiPay surfaces.

Decision: **IMPROVE / EXTEND**, not replace.

## Delivered scope

### Payment-state clarity and recovery

- Added explicit `payment_status`: `not_started`, `pending`, `succeeded`, `failed`, `abandoned`, `mismatch`.
- Added `last_payment_error` and `last_payment_checked_at` so user-facing clients can explain what is known without inventing a final state.
- Checkout initialisation marks the payment pending before redirecting externally.
- Gateway initialisation failures are recorded as recoverable payment failures while the booking remains unfunded.
- Verification distinguishes success, failure, abandonment and pending confirmation.
- Slow/unreachable gateway verification is treated as **pending**, not as a false ledger mismatch.
- Both web and mobile expose a safe **Check payment status** action.
- The client can retry checkout after a failed/abandoned attempt because the transaction remains in `pending_payment` until genuine funding is confirmed.

### Duplicate-payment safety

- Existing `Idempotency-Key` behaviour is preserved and certified.
- A repeated request with the same key returns the same payment attempt rather than creating another gateway charge.
- A successful gateway payment for a transaction that is already funded with another reference is flagged as a reconciliation mismatch and audited as a possible duplicate successful charge.

### Backend reconciliation

- Backend remains authoritative for transaction state.
- Reconciliation now separates **provider temporarily unavailable** from **actual mismatch**.
- Pending/failed/abandoned gateway states are reflected without falsely moving the escrow to funded.
- Exact successful amount and NGN currency remain required before funding.
- Transaction filters now support both lifecycle state and payment status for authorised operators.

### Dispute lifecycle

Participants can open a dispute only for funded, in-progress or delivered transactions before release/refund.

Opening a dispute:

- records who opened it and why;
- captures the transaction state at the time of opening;
- moves the transaction to `disputed`;
- freezes automatic/client release;
- prevents a second simultaneous active dispute;
- persists an audit event and user notification.

Participants can add evidence notes and a supporting reference URL while the dispute is active.

Authorised SabiPay operators can:

- start review;
- record assignment/review metadata;
- resolve with one controlled outcome:
  - resume the captured transaction state;
  - approve a client refund;
  - release provider payment after a delivered-state dispute;
  - close with no financial action;
- record resolution reason, resolver and timestamps.

Financial outcomes continue through the existing controlled refund/release services rather than bypassing the ledger.

### Notifications

SabiPay audit events now persist relevant payment/dispute notifications for participants, including:

- payment verification pending;
- funding mismatch;
- possible duplicate successful charge;
- escrow funded;
- refund initiated/processed;
- payout failure/release;
- dispute opened;
- evidence added;
- review started;
- dispute resolution.

Realtime delivery remains best-effort while the persisted notification is the durable user record.

### Web

`/sabipay` now shows:

- payment status separately from transaction state;
- reconciliation status;
- recoverable payment errors;
- safe status refresh;
- retry/continue checkout where appropriate;
- active dispute freeze state;
- in-context dispute creation;
- existing funding, service, delivery, release, receipt and payout journeys.

Layouts remain responsive card-based V2 surfaces with no desktop-only transaction dependency.

### Mobile

The Expo SabiPay surface now supports:

- external Paystack checkout and deep-link return;
- explicit payment/reconciliation state;
- safe status refresh after interrupted callbacks/app closure;
- continued checkout after an unfinished attempt;
- participant dispute creation and visible freeze state;
- existing client/provider service and payout actions.

The same Django endpoints and transaction rules are shared by web, Android and iOS.

## Automated evidence

Focused Phase 8 tests certify:

1. repeated Pay clicks with the same idempotency key create one payment attempt and one gateway initialisation;
2. failed gateway payments remain unfunded and recoverable;
3. temporary gateway timeouts remain reconciliation `pending` instead of false `mismatch`;
4. participants can open a dispute and add evidence;
5. opening a dispute freezes the transaction;
6. only one active dispute can exist for a transaction;
7. outsiders cannot open or read disputes for another transaction;
8. authorised operator review and resume resolution restore the captured transaction state;
9. persisted dispute notifications are created.

Platform CI must additionally pass:

- Django deployment checks;
- migration drift;
- all backend regression journeys;
- frontend TypeScript and lint;
- mobile TypeScript;
- realtime checks;
- canonical design-token check;
- repository hygiene;
- WaitList syntax.

## Phase boundary

Master Phase 8 completes payment-state clarity, recovery, reconciliation safety and the transaction-level dispute workflow.

It does **not** prematurely claim:

- the consolidated multi-role operational dashboard — Master Phase 9;
- final security/performance/reliability hardening — Master Phase 10;
- complete analytics/monitoring instrumentation — Master Phase 11;
- physical cross-device/end-to-end certification — Master Phase 12;
- controlled real-user testing readiness — Master Phase 13.

## Production payment gate

Passing application CI is not, by itself, approval to handle live customer money. Before real-money public use, the existing payment production gate still requires the appropriate Paystack commercial/compliance arrangement, independent payment/security review, real sandbox callback/reconciliation exercises, controlled real-money testing where approved, operational ownership and no unresolved critical financial defect.

## Manual device/runtime evidence still required

Before Master Phase 12 certification, physically verify:

- 320–430px mobile web, tablet and desktop web layouts;
- Android low/mid-range devices and supported iPhones;
- interrupted/slow network during checkout and return;
- browser/app closure before callback completion;
- repeated tap behaviour;
- external Paystack return/deep-link recovery;
- dispute creation and freeze explanation;
- large text/screen-reader labels;
- long service descriptions and long dispute details;
- no normal horizontal scrolling.

Exact frame-by-frame Figma parity is not claimed because the complete Figma payment/dispute frame set has not been available through the current build connection.
