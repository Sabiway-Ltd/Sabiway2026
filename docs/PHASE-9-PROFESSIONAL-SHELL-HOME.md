# Phase 9 — Professional Application Shell & Home

Status: IN PROGRESS

## Purpose
Rebuild the authenticated Professional workspace around the Professional jobs-to-be-done without changing the completed Client Phase 8 experience.

## Target Professional information architecture

### Desktop
1. Home
2. Opportunities
3. My Services
4. Proposals
5. Messages
6. Bookings
7. Earnings
8. Verification
9. SabiForum
10. Profile

### Mobile primary navigation
1. Home
2. Opportunities
3. Proposals
4. Messages
5. Profile

Bookings, Earnings, My Services and Verification remain directly reachable from Professional Home and desktop navigation rather than compressing ten desktop destinations into the mobile bottom bar.

## Authoritative existing resources
- Service listings: `/api/marketplace/listings/`
- Job responses / proposals: `/api/marketplace/job-responses/`
- Participant bookings: `/api/marketplace/bookings/`
- Message threads: `/api/marketplace/threads/`
- SabiPay transactions and payout destinations: `/api/sabipay/transactions/` and `/api/sabipay/payout-destinations/`
- Professional verification: existing `/verification` experience and verification backend

## New Professional route surfaces
- `/professional/services` — Professional service/listing workspace
- `/proposals` — Professional responses/proposals workspace
- `/earnings` — Professional earnings and payout summary workspace

Existing shared/participant routes remain authoritative:
- `/marketplace` — Opportunities
- `/messages`
- `/bookings`
- `/sabipay`
- `/verification`
- `/community`
- `/profile`

## Preservation boundaries
- Do not change Client Phase 8 IA or Client Home behavior.
- Do not create duplicate marketplace, booking, payment or verification backend models.
- Do not weaken authentication, onboarding or controlled-demo isolation.
- Do not represent failed resource loads as zero activity.
- Keep booking status, payment state, proposal state and verification state conceptually separate.
- Use existing design-system tokens and WCAG 2.2 AA interaction rules.

## Exit gate
- Professional-specific desktop and mobile IA in AppShell.
- Professional Home driven by real service/proposal/booking/message/payment/verification resources where available.
- My Services, Proposals and Earnings routes have loading, empty, error and retry states.
- Client Phase 8 contract remains green.
- Phase 9 static contract and browser protection checks added to Platform CI.
- Exact-head Platform CI Release Gate passes before merge.
