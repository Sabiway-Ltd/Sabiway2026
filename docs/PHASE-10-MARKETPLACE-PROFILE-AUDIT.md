# Phase 10 — Marketplace Discovery & Professional Profiles Audit

Status: IN PROGRESS
Branch: `feat/phase-10-marketplace-discovery-profiles`

## Purpose

Rebuild SabiWay discovery around two distinct jobs-to-be-done while preserving public browsing, backend authority, Client/Professional role boundaries, controlled demo isolation and Phase 1–9 behavior.

1. Client discovery: find, compare and evaluate suitable Professional services.
2. Professional opportunity discovery: find relevant Client jobs and submit a proposal through authenticated Professional context.

The public Professional profile must function as marketplace trust evidence, not merely a community/social profile.

## Current evidence

### Marketplace

- `/marketplace` is correctly guest-capable.
- server rendering fetches listings, jobs and categories, but failed requests are converted to empty arrays; unavailable backend and genuine zero results are therefore indistinguishable.
- `MarketplaceClient.tsx` currently owns search, category browsing, service creation, job creation, listing details, conversation creation, opportunity browsing and proposal submission in one large client surface.
- protected actions read `localStorage.access` directly instead of using the Phase 1 session/auth boundary.
- Client service discovery and Professional opportunity discovery are presented as tabs in one generic marketplace rather than role-aware journeys.
- many hard-coded color/radius/input recipes bypass Phase 2 semantic primitives.
- listing cards already have sufficient backend fields for a strong first-pass discovery experience: provider identity, category, title/description, price/currency, delivery mode, location, availability and moderation-approved public visibility.

### Public Professional profile

- `/profile/[username]` is guest-capable and correctly avoids private contact exposure.
- the current page is framed as “Professional and community identity” and is primarily a SabiForum/community profile.
- current public UI shows name, job, bio, verification badge, follow action and posts.
- it does not show approved services, service pricing, delivery mode, service geography, availability or service-context CTAs.
- backend `ProfileSerializer` already exposes privacy-preserving `is_verified`/public `verification_status` while removing private contact/onboarding fields from non-owner responses.
- approved public service listings can be queried from the existing marketplace listing resource without adding a duplicate Professional storefront model.

## Phase 10 decisions

### D10-01 — Public marketplace default = Client/service discovery

Guest `/marketplace` prioritises services/Professionals. Job opportunities remain discoverable to Professionals through the authenticated role-aware experience, not as an equal generic public tab competing with Client discovery.

### D10-02 — Preserve Professional opportunity access

Professional users retain `/marketplace` as “Opportunities” from the Phase 9 shell. The marketplace may initialise to jobs/opportunities when the authenticated role is Professional, while guests and Clients initialise to services.

### D10-03 — Backend failure is not empty state

Marketplace SSR and client searches must retain an availability/error signal. “No services match these filters” is shown only after a successful empty response.

### D10-04 — Public Professional profile becomes marketplace storefront + community evidence

The profile hierarchy becomes:
1. identity + profession + safe location;
2. verification/trust state;
3. approved service offerings;
4. price/scope/delivery/location/availability;
5. contextual protected contact CTA;
6. community activity as supporting evidence, not the primary profile content.

### D10-05 — Service context survives authentication

If a guest chooses “Message about this service”, the return intent must preserve the exact Professional/service context through login. Production authentication remains authoritative; no demo/localStorage bypass.

### D10-06 — Do not invent reputation evidence

Phase 10 may show only currently authoritative trust evidence. Do not fabricate star ratings, review counts, completed-job counts or badges. Reviews/reputation depth belongs to Phase 14 unless an existing backend resource is verified.

### D10-07 — No new Professional storefront model

Use `Profile` + approved `ServiceListing` resources. Phase 10 is a presentation/discovery rebuild, not duplicated marketplace schema.

## Implementation slices

### Slice A — discovery data truth
- return explicit availability/error state from marketplace SSR;
- client search distinguishes error vs genuine empty;
- preserve query/category/location context.

### Slice B — role-aware discovery
- guest/Client default to services;
- authenticated Professional default to opportunities;
- reduce generic tab ambiguity;
- keep job/proposal actions Professional-authorized.

### Slice C — service result hierarchy
Each result should expose:
- Professional name/job;
- verification state when authoritative;
- service title/category;
- delivery mode;
- service geography;
- price-from + currency;
- availability;
- public Professional profile link;
- contextual protected message action.

### Slice D — Professional storefront
- fetch public profile safely;
- fetch approved service listings for that Professional;
- surface verification and service evidence;
- show explicit unavailable/empty states;
- retain SabiForum activity below marketplace evidence.

### Slice E — quality gates
- Phase 10 static contract;
- preserve Phase 8 Client and Phase 9 Professional IA;
- browser proves `/marketplace` and public profile remain guest-capable;
- browser proves protected service contact returns through safe login intent;
- TypeScript/lint/build/backend/mobile/realtime/design checks remain green.

## Out of scope for Phase 10

- full reviews/reputation system (Phase 14);
- booking redesign (Phase 15);
- SabiPay redesign (Phase 16);
- messaging/notifications redesign (Phase 13);
- real backend/session security replacement beyond existing Phase 1 compatibility boundary (Phase 20);
- marketplace recommendation/personalisation algorithms that require unsupported data.

## Exit criteria

Phase 10 is complete only when:
- guest service discovery is useful without authentication;
- backend unavailable and genuine empty states are visibly distinct;
- Client and Professional marketplace intent is role-aware;
- approved services link to marketplace-ready public Professional profiles;
- public Professional profiles surface safe trust/service evidence and no private contact data;
- protected actions preserve context through auth;
- Phase 1–9 contracts remain green;
- exact-head Platform CI Release Gate passes.