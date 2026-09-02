# Phase 16 — SabiPay & Transaction Experience Audit

## Status
IN PROGRESS — implementation branch created from the exact Phase 15 merged revision `3a16f56b9d1dacc6772e478f8df48791677b81f0`.

## Phase objective
Turn SabiPay into a clear, trustworthy transaction workspace for Clients and Professionals without weakening the existing payment, reconciliation, dispute, payout or verification authority.

Phase 15 established `/bookings` as the canonical owner of service acceptance, scheduling, start-work and completion actions. Phase 16 therefore owns the money journey around that service state: funding, gateway confirmation, reconciliation, escrow visibility, client satisfaction/release, disputes, refunds and Professional payout configuration/status.

## Existing backend — preserve
The SabiPay backend is already substantial and must be preserved unless a defect is proven.

### Transaction authority
- Client-only booking funding.
- Booking must be accepted before funding.
- Nigeria pilot is NGN-only.
- Positive agreed price required.
- Professional verification approval required before funding.
- One transaction per booking.
- Booking-price mismatch after transaction creation is rejected.
- Commission/provider split is backend-derived.

### Payment safety
- Idempotency-key support for checkout initialization.
- Gateway amount/currency verification.
- Successful payment moves escrow to `funded` only after verification.
- Pending/unknown gateway results stay pending rather than becoming false failures.
- Duplicate successful charges are detected and marked reconciliation mismatch.
- Reconciliation state is explicit.
- Webhook signature verification is backend-owned.

### Service/fund coupling
- Funded transaction is required before service can start.
- In-progress funded transaction is required before delivery completion.
- Booking and SabiPay state are mirrored by backend signals/services.
- Phase 15 now exposes those service transitions through `/bookings`; Phase 16 must not create a second service-state owner in SabiPay UI.

### Release/payout
- Delivery starts a configured freeze period.
- Client confirmation can trigger controlled release.
- Provider payout destination is Professional-only and verification-gated.
- Full bank account numbers are not persisted in the SabiWay payout model.
- Payout status/failure state is explicit.

### Disputes/refunds
- Disputes are participant-scoped.
- Active disputes freeze normal release.
- Evidence has a dedicated model/path.
- Operator-only review/resolution/refund/reconciliation boundaries exist.
- Transaction audit events exist.

## Current frontend problems

### P16-01 — SabiPay duplicates browser credential handling
`frontend/app/sabipay/SabiPayClient.tsx` directly reads `localStorage.access`, constructs bearer headers and uses raw `fetch`. This diverges from the shared authenticated API/session architecture already adopted in prior phases.

**Decision:** rework SabiPay to use the shared `api` client and authenticated AppShell; do not introduce new credential storage.

### P16-02 — SabiPay duplicates service lifecycle actions
The current page exposes `start-service` and `mark-delivered`. Phase 15 established `/bookings` as the canonical service-management workspace and its server-derived capabilities already enforce SabiPay-funded service progression.

**Decision:** remove Start service / Mark delivered from SabiPay UI. Keep transaction state visible and provide a contextual link to `/bookings` for service progression.

Backend endpoints remain preserved for compatibility and mobile/domain use unless a separate migration proves they are dead.

### P16-03 — Money states are dense rather than decision-oriented
The current page exposes many backend statuses but does not consistently tell the user:
1. what happened,
2. whether money is safe,
3. what they can do now,
4. what happens next.

**Decision:** use a transaction-stage presentation model while keeping raw authoritative status visible where useful.

### P16-04 — Payment, reconciliation and release can be mistaken for one state
Gateway payment status, escrow transaction state, reconciliation status, dispute state and payout state are distinct.

**Decision:** never compress them into one ambiguous success badge. Display them as separate evidence with a clear primary next action.

### P16-05 — Funding discovery is disconnected from booking management
Accepted NGN bookings can be funded in SabiPay, while `/bookings` shows payment state. The handoff needs to be deliberate in both directions.

**Decision:** SabiPay keeps funding checkout ownership. `/bookings` continues to show payment state and links to SabiPay. SabiPay links back to the exact booking/service workspace.

### P16-06 — Payout setup requires stronger state explanation
Payout destination creation is already verification-gated, but UI must distinguish:
- no payout destination,
- verified destination,
- payout pending/processing,
- paid,
- failed/manual review.

### P16-07 — Dispute UX needs explicit safety boundaries
Opening a dispute is not equivalent to receiving a refund. A dispute freezes/controls transaction progression while operator review determines outcome.

**Decision:** copy and state presentation must make that distinction explicit.

## Target transaction UX

### Client
Accepted booking → Fund securely → Checkout pending/confirmed → Escrow funded → Service managed in `/bookings` → Delivery recorded → Freeze/review window → Confirm satisfaction OR dispute → Release/refund outcome → Receipt/history.

### Professional
Accepted/funded booking → Payment evidence visible → Service managed in `/bookings` → Delivery recorded → Freeze/review window → Release status → Payout destination/status → Paid or actionable failure/manual review.

## Presentation rules
Every transaction card should expose:
- booking/service identity,
- amount and fee split,
- escrow transaction state,
- gateway payment status,
- reconciliation status,
- dispute state if applicable,
- release/freeze state,
- payout state for Professionals,
- one primary next action derived from current authority,
- secondary links to booking and conversation context.

## Preserve / improve / rework

### KEEP
- transaction/payment/dispute/payout models;
- gateway verification and webhook signature authority;
- idempotency and duplicate-charge detection;
- reconciliation model;
- operator permissions;
- payout verification rules;
- transaction audit trail;
- release freeze/dispute guards.

### IMPROVE
- transaction serializer/read model where a UI-safe capability field reduces frontend guessing;
- user-facing state labels and next-action copy;
- links between `/bookings`, `/sabipay`, Messages and receipts/history;
- loading/empty/error/retry states;
- accessibility and responsive hierarchy.

### REWORK
- SabiPay page shell/session handling;
- raw-fetch duplication;
- dense transaction cards;
- payment/reconciliation/dispute/payout state hierarchy;
- payout setup presentation;
- dispute explanation.

### REMOVE FROM WEB SabiPay UI
- Start service action;
- Mark delivered action.

These remain backend domain endpoints until separately proven safe to retire.

## Phase 16 exit gate
Phase 16 is complete only when:
- SabiPay uses shared authenticated session/API architecture;
- SabiPay is inside the shared application shell;
- web SabiPay no longer owns Start service / Mark delivered;
- accepted NGN Client bookings can initialize/retry/verify payment safely;
- payment pending/failure/mismatch/reconciliation states are visibly distinct;
- escrow funded/delivered/release states are visibly distinct;
- Client satisfaction/release behavior remains backend-authoritative;
- dispute creation/evidence/state remains participant-scoped;
- payout setup/status remains Professional-only and verification-gated;
- no private bank/payment/verification internals leak into public surfaces;
- Phase 15 booking/service ownership is preserved;
- TypeScript, lint, production build, browser regression, migration drift and backend journeys pass on the exact PR head;
- the aggregate Platform CI Release Gate is green.
