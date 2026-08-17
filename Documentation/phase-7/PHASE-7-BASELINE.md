# Master Phase 7 — Marketplace / Services / Core SabiWay Transactions Baseline

Status: AUDIT / IN PROGRESS
Branch: `feat/phase-7-marketplace-services-transactions`
Base: certified Phase 6 `main` (`77e4952e58ae601c563676775a055fee953f46da`)

## Objective

Deliver the complete non-payment marketplace transaction journey across Web, Android and iOS:

service discovery / job discovery -> conversation -> scoped agreement -> professional acceptance -> scheduled work -> hand-off into the authoritative SabiPay transaction lifecycle.

Phase 7 does not create a second transaction or payment system. Phase 8 remains responsible for payment, escrow, payout and dispute hardening.

## Required build sequence

Inspect first -> Understand second -> Decide third -> Design fourth -> Build fifth -> Test sixth.

Every existing marketplace/service/job/booking component is classified before modification as KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE.

## Marketplace catalogue — KEEP / IMPROVE

Existing Django authority:
- `ServiceCategory`
- `ServiceSubcategory`
- `ServiceListing`

Existing listing state includes:
- professional/provider ownership;
- category/subcategory;
- price-from + currency + pricing note;
- delivery mode;
- country/state/city/area;
- availability;
- moderation status;
- active/featured state;
- discovery indexes.

Decision:
- KEEP the existing listing domain.
- IMPROVE creation/editing/ownership/state-transition UX and validation where audit identifies gaps.
- DO NOT create a second service catalogue.

## Client jobs — KEEP / IMPROVE

Existing Django authority:
- `JobPosting`
- `JobResponse`

Existing job state includes:
- client ownership;
- category/location/delivery mode;
- budget range/currency;
- needed-by date;
- draft/open/paused/closed/cancelled status;
- moderation state;
- professional response with proposed price and response lifecycle.

Decision:
- KEEP this domain.
- Audit lifecycle permissions, response management, shortlist/decline/withdraw, thread initiation and closure before changing it.

## Conversation-to-transaction bridge — KEEP

Existing `MessageThread` can originate from:
- a service listing;
- a job;
- a job response.

Phase 6 certified thread participant, safety, realtime and messaging behaviour.

Decision:
- KEEP `MessageThread` as the bridge between discovery and transaction agreement.
- Phase 7 must not duplicate messaging or bypass Phase 6 safety controls.

## Core agreement / booking — KEEP / HARDEN

`BookingRequest` is the existing authoritative pre-payment transaction agreement.

Current authoritative fields include:
- one-to-one message thread linkage;
- listing/job/job-response provenance;
- client and professional;
- agreed scope;
- agreed price + currency;
- requested time + timezone;
- schedule status;
- lifecycle: pending -> accepted / declined / cancelled -> in_progress -> completed;
- accepted timestamp;
- indexed client/professional/status queries.

Decision:
- KEEP `BookingRequest` as the core Phase 7 agreement object.
- HARDEN lifecycle transitions and role permissions server-side before relying on UI visibility.
- Ensure Web/Android/iOS surface one consistent lifecycle.
- Do not create a parallel order model unless the audit proves `BookingRequest` cannot satisfy a Master Playbook requirement.

## Scheduling — KEEP / IMPROVE

`ScheduleProposal` already provides:
- proposer identity;
- proposed datetime;
- timezone;
- note;
- proposed / accepted / declined / superseded lifecycle;
- response timestamp.

Decision:
- KEEP.
- Audit conflicting proposals, supersession, accepted schedule synchronisation, timezone display, rescheduling and completed-state behaviour.

## SabiPay boundary — KEEP SEPARATE / AUDIT HAND-OFF ONLY IN PHASE 7

The existing `sabipay` domain already contains a substantial payment/escrow state machine:
- `Transaction` linked one-to-one to `BookingRequest`;
- payment attempts + idempotency keys;
- funded/in-progress/delivered/released/disputed/refunded/cancelled transaction states;
- commission/provider split;
- reconciliation status;
- payout destinations and payout records;
- disputes;
- transaction audit events;
- gateway webhook event idempotency.

Existing service logic already enforces important boundaries including:
- only the booking client funds;
- professional acceptance before funding;
- NGN Nigeria-pilot restriction;
- positive agreed price;
- verified professional requirement;
- immutable-price check after SabiPay transaction creation;
- gateway amount/currency/status reconciliation;
- row locking for transaction transitions;
- professional-only funded-service start;
- booking state synchronisation when funded service starts/completes.

Decision:
- KEEP SabiPay as the single payment transaction authority.
- Phase 7 audits only the booking -> SabiPay hand-off and UI gating.
- Payment initialization, escrow, payout, release, refund and dispute hardening remain Master Phase 8 work.
- Do not duplicate transaction state inside marketplace or clients.

## Cross-platform audit targets

### Backend
1. marketplace serializers and role validation;
2. listing/job/job-response ownership and lifecycle endpoints;
3. booking status transition matrix;
4. schedule proposal transition matrix;
5. provenance integrity: listing/job/job-response/thread/booking relationships;
6. accepted-booking mutation rules for scope/price/currency;
7. SabiPay creation boundary and immutable agreement expectations;
8. admin moderation/transaction support surfaces;
9. pagination/query/index behaviour;
10. regression coverage.

### Web
1. marketplace discovery vs authenticated transaction actions;
2. create/edit/manage listing journey for professionals;
3. create/edit/manage job journey for clients;
4. job response management;
5. listing/job -> thread initiation;
6. agreement creation/acceptance/decline/cancel;
7. schedule negotiation;
8. accepted agreement -> SabiPay hand-off;
9. loading/empty/error/success/permission states;
10. responsive Web-native UX under shared `AppShell`.

### Android / iOS
1. same lifecycle parity as Web;
2. no client-only or professional-only action exposed incorrectly;
3. low-data/retry-safe transaction submissions;
4. duplicate submission prevention;
5. preserved form state on recoverable failure;
6. clear booking/payment boundary;
7. accessible controls and status descriptions.

### Admin
1. listing moderation;
2. job moderation;
3. conversation/report support linkage;
4. booking agreement visibility;
5. schedule evidence;
6. SabiPay hand-off visibility without bypassing Phase 8 permissions/audit.

## Initial architecture decisions

- Service catalogue: KEEP / IMPROVE.
- Job marketplace: KEEP / IMPROVE.
- Job responses: KEEP / IMPROVE.
- Messaging bridge: KEEP.
- `BookingRequest`: KEEP / HARDEN as Phase 7 transaction agreement.
- `ScheduleProposal`: KEEP / IMPROVE.
- SabiPay `Transaction`: KEEP SEPARATE; Phase 8 authority.
- No new generic Order/Transaction model at this stage.
- No duplicated payment state in Web/mobile.

## First implementation audit order

1. Inspect marketplace serializers and views for listings/jobs/job responses/bookings/schedules.
2. Map server-side transition and role matrices.
3. Inspect marketplace admin.
4. Inspect Web listing/job/manage/transaction surfaces.
5. Inspect Android/iOS marketplace + messaging booking surfaces.
6. Inspect booking-to-SabiPay serializers/views and immutable-agreement assumptions.
7. Compare current journeys to BRD + V2 app design evidence.
8. Document concrete gaps before first code slice.

## Certification rule

Phase 7 cannot be certified until Web, Android and iOS can complete the same authoritative non-payment transaction journey with valid role permissions, lifecycle transitions, failure/retry states, provenance integrity and a safe SabiPay hand-off, with Platform CI green on the final exact PR head.
