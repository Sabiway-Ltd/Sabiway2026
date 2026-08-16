# Phase 7 — SabiPay escrow — Nigeria pilot

## Source authority

Phase 7 follows the approved AI Development Playbook: a Paystack-based Nigeria-to-Nigeria transaction lifecycle before cross-border expansion. The confirmed business rules are a 7-day post-delivery freeze and a 10% SabiWay commission. Stripe/cross-border settlement remains Phase 9.

## Delivered scope

### Financial domain
- `Transaction` is one-to-one with an accepted booking and records the immutable financial snapshot: gross service amount, 10% SabiWay fee and provider net amount.
- Transaction states cover `pending_payment`, `funded`, `in_progress`, `delivered`, `released`, `disputed`, `refunded` and `cancelled`.
- `PaymentAttempt` preserves each Paystack checkout reference and supports request idempotency without overwriting failed/abandoned attempts.
- `PayoutDestination` stores the Paystack recipient token and masked account information only; full bank account numbers are not persisted by SabiWay.
- `PayoutRecord` is one-to-one with a released transaction so automatic/manual retry cannot create duplicate ledger payouts.
- `Dispute` exists as the financial freeze contract for Phase 8; Phase 7 does not prematurely invent the full Phase 8 evidence/triage/partial-outcome workflow.
- `TransactionAudit` and `GatewayWebhookEvent` preserve attributable state transitions and gateway delivery processing.

### Paystack integration
- Hosted checkout is initialised by the Django backend only; no secret key is exposed to web/mobile clients.
- Payment funding is accepted only after server-side verification of gateway success, exact amount and NGN currency.
- Paystack webhook signatures are verified using HMAC-SHA512 against the raw body.
- Webhook deliveries are idempotent by raw-body digest and state-transition event key.
- Transient gateway verification failures remain retryable instead of being falsely marked processed.
- Nigerian bank accounts are resolved with Paystack before a transfer recipient is stored.
- Payouts use a unique SabiPay transfer reference and the provider net amount after commission.
- Controlled pre-service refunds are initiated by authorised SabiPay operators only.

### Escrow rules
- Only the booking client can initialise funding.
- Only accepted, positive-price, NGN bookings with an approved professional can enter SabiPay in Phase 7.
- Service cannot move to `in_progress` until escrow funding is confirmed.
- Provider delivery starts the confirmed seven-day freeze.
- Client satisfaction can release earlier than seven days.
- Otherwise `release_due_escrow` releases due delivered escrow after seven days and is repeat-safe.
- Active disputes block release.
- Direct cancellation after funding is blocked; funded cancellations use the controlled refund/dispute path.
- Booking status mutations are guarded even when called through the existing marketplace endpoint.

### Web
- `/sabipay` provides accepted-booking funding, Paystack redirect/return verification, receipts/history, reconciliation state, delivery/freeze/release controls and provider payout setup.
- `Messages & bookings` shows the confirmed 10% fee and provider net payout before the professional accepts an NGN booking.
- V2 green/amber trust-led visual language and responsive card layouts are retained.

### Mobile
- SabiPay is available as an authenticated app section.
- Hosted checkout opens externally and returns using the `sabiway://sabipay` deep-link scheme.
- Return handling verifies the Paystack reference through the backend and recovers after app background/foreground transitions.
- Client funding/release, provider start/delivery, transaction history and payout-destination setup share the same backend contracts as web.

### Operations
- Django admin provides transaction, payout, webhook, reconciliation and audit visibility under `manage_sabipay` least privilege.
- `release_due_escrow` supports scheduled release with safe retries.
- `reconcile_sabipay` compares SabiPay funding state against Paystack verification.
- `PAYSTACK_SECRET_KEY`, public key, 10% commission and 7-day freeze configuration are documented in `.env.example`.

## Automated journey evidence

Backend tests cover:
- accepted booking → idempotent checkout → verified funding → provider start → delivery → client confirmation → single 90% payout record;
- no service commencement before funding;
- checkout failure/abandonment remains recoverable without false funding;
- HMAC webhook validation and replay idempotency;
- seven-day automatic release exactly once;
- authorised pre-service refund and refund state;
- transaction-history participant privacy;
- invalid redirect rejection and unsigned webhook rejection.

Platform CI additionally executes migration drift, Django checks, existing accounts/posts/notifications/marketplace/verification journeys, frontend TypeScript/lint, mobile TypeScript, realtime checks, repository hygiene and waitlist syntax.

## Responsive/device audit checklist

Automated type/lint coverage validates implementation contracts, while the following physical/runtime evidence remains required before payment production sign-off:
- desktop web and mobile web: hosted checkout redirect, browser back, duplicate taps, slow/intermittent network, session expiry, long content and 200% text scaling;
- iOS/Android: external checkout, app backgrounding, `sabiway://sabipay` return/deep link, virtual keyboard, large text and screen-reader labels;
- admin laptop/tablet: transaction filtering, audit/reconciliation visibility and payout/refund permission boundaries;
- currency formatting and very large/small allowed NGN amounts;
- webhook replay/out-of-order deliveries in the Paystack sandbox;
- scheduler retry/reconciliation drills.

## Release boundary and production gate

This phase establishes the application-side SabiPay transaction lifecycle. It does **not** claim production financial/escrow readiness merely because code and mocked automated tests pass.

The Playbook Phase 7 exit gate still requires, before real customer money is enabled:
1. independent payment/security review;
2. Paystack sandbox end-to-end reconciliation with real sandbox callbacks/webhooks/transfers/refunds;
3. a controlled real-money test after commercial/compliance approval;
4. confirmation that SabiWay's intended hold/release/payout operating model is permitted under the chosen Paystack account/commercial arrangement;
5. no unresolved critical financial defect.

Phase 8 owns the complete dispute, evidence, reviews, notifications and operational trust workflow. Phase 9 owns Stripe and cross-border settlement/FX/jurisdiction mechanics.
