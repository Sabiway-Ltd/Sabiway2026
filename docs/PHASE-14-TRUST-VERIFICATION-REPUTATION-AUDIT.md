# Phase 14 — Trust, Verification, Reputation & Reviews Audit

## Baseline

Phase 14 starts from merged Phase 13 revision `fd612e235ed6af0c8acc110b3a934623b8ae0fd7`.

## Product rule

Trust signals must remain specific and explainable. SabiWay must not manufacture an opaque composite trust score.

The product exposes separate evidence:

1. **Professional verification** — approved only when the backend verification workflow is in `approved` state.
2. **Completed-work reputation** — reviews written by the Client attached to a SabiWay booking after that booking reaches `completed`.
3. **Marketplace history** — counts derived from authoritative marketplace records where useful.

Social followers, profile completion and self-authored biography are not marketplace reputation.

## Preserve

### Verification backend

Preserve the existing `Backend/verification` domain:

- explicit submission states (`submitted`, `in_review`, `approved`, `rejected`, `more_info`);
- reviewer permission boundary;
- encrypted verification documents;
- private/no-store document downloads;
- audit history and submission versions;
- retention/purge controls;
- professional-only submission authority;
- backend marketplace verification gate.

### Booking authority

Preserve `BookingRequest.status` as the source of truth for whether work is complete. Review eligibility must never be inferred from messages, schedule proposals or payment UI state.

## Rework

### Verification web experience

The current verification screen has mature state coverage but stale architecture:

- it renders under `PublicShell` despite being Professional-only;
- it reads the access token directly from `localStorage`;
- it manually constructs bearer headers;
- it bypasses the shared authenticated API/session layer;
- it uses hard-coded visual values rather than the canonical semantic design system.

Phase 14 moves this experience into `AppShell`, shared authenticated API/session behavior and semantic design tokens while preserving the backend workflow.

### Public Professional trust presentation

The public Professional profile currently returns safe profile data plus approved services only. Phase 14 adds a public, privacy-safe trust read model containing only:

- whether Professional verification is approved;
- completed-work review count;
- completed-work average rating;
- completed-work reviews safe for public display.

Never expose verification documents, reviewer identity, decision reasons, more-information requests, internal SLA timestamps or audit events publicly.

## Add: completed-work reputation domain

A review is valid only when all conditions hold:

- the referenced booking exists;
- booking status is `completed`;
- the author is the booking Client;
- the reviewed Professional is the Professional attached to that booking;
- one review exists per booking;
- rating is within 1–5;
- review text is optional and length-limited;
- no arbitrary testimonials or self-reviews are accepted.

The backend computes aggregates. The frontend never calculates or invents reputation authority.

## UX states

### Verification

- not submitted;
- submitted;
- in review;
- approved;
- rejected;
- more information required;
- submission error;
- document unavailable/purged;
- resubmission.

### Reputation

- no completed-work reviews yet;
- rating + review count;
- review list;
- completed booking eligible to review;
- already reviewed;
- review submission error/success.

A zero-review Professional must not be visually represented as a zero-star or low-quality Professional.

## Security/privacy boundaries

- frontend route role checks are UX only; backend remains authority;
- verification badge derives only from approved backend verification state;
- review creation derives only from completed booking authority;
- public reputation contains no private booking scope, price, message, payment, verification evidence or contact details;
- review links do not grant booking access.

## Phase 14 exit evidence

Required before merge:

- backend tests for review eligibility, uniqueness, rating bounds and public trust privacy;
- verification route uses shared app/session architecture;
- public Professional profile consumes backend-derived trust/reputation;
- production frontend contains no fake/static review fixture;
- `/verification` remains Professional-only and unauthenticated access preserves return intent;
- TypeScript, lint, build, Chromium and backend journeys pass on exact head;
- full Platform CI Release Gate succeeds.
