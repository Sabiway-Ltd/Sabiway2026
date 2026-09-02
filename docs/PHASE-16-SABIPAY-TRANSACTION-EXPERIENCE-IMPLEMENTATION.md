# Phase 16 — SabiPay & Transaction Experience

## Implemented

- `/sabipay` now runs inside `AppShell` and consumes the shared authenticated API client.
- Page-level bearer token/localStorage credential handling was removed.
- SabiPay is now focused on funding, payment verification, reconciliation, escrow, disputes, release and Professional payouts.
- `Start service` and `Mark delivered` were removed from SabiPay because Phase 15 established `/bookings` as the canonical service-management workspace.
- Transaction history now exposes an explicit payment → funded escrow → delivered → released progression rather than a mixed list of payment and service actions.
- Client funding preserves idempotency and Paystack callback verification.
- Pending gateway verification remains pending rather than being presented as a false failure.
- Active disputes remain a separate state and freeze release according to backend authority.
- Professional payout destination setup remains verification-gated and displays only masked account details returned by the backend.
- Client satisfaction confirmation remains a SabiPay release action because it authorises release/payout rather than changing booking workflow ownership.

## Preserved backend authority

- participant-scoped transactions;
- Client-only checkout and checkout verification;
- Professional verification prerequisite before funding/payout setup;
- idempotent checkout attempts;
- gateway amount/currency reconciliation;
- duplicate successful-charge detection;
- dispute/review/refund controls;
- payout destination verification and protected recipient references;
- webhook signature verification;
- server-owned release and payout transitions.

## Explicit ownership boundary

### `/bookings`
Owns service acceptance, scheduling, start-work and completion lifecycle actions.

### `/sabipay`
Owns funding, checkout verification, reconciliation, escrow visibility, dispute opening, satisfaction/release confirmation and Professional payout visibility/setup.

The frontend does not replace backend authorisation or transaction state machines.
