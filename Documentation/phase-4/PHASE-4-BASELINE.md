# Master Phase 4 — Home, Navigation, Discovery & Search Baseline

Status: FINAL CI GATE
Branch: `feat/phase-4-home-navigation-discovery-search`
Base: certified Master Phase 3 `main` (`cc61577a676882412a5cb5209b8b586850680d8e`)

## Scope

Master Phase 4 covers the signed-in home experience, primary navigation, service/job discovery, category browsing, location/search behaviour and the existing community/profile search capability across Web, Android and iOS.

This phase follows the Master Playbook rule: inspect existing implementation first, choose KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE, then build only what is required.

## Current-state decisions and implementation

### Web public home — KEEP / IMPROVE

`frontend/app/page.tsx` remains the unauthenticated marketing/discovery entry point. It is intentionally separate from the signed-in product Home.

### Signed-in Home — COMPLETE

Implemented:
- role-aware Android/iOS Home;
- role-aware Web `/home`;
- signed-in default changed from SabiForum to Home;
- password and Google sign-in now land on `/home`;
- public `/` remains public/marketing.

### Navigation — MERGE / REFACTOR — COMPLETE

Primary product navigation is now consistent across Web, Android and iOS:
1. Home
2. Market
3. Messages
4. SabiForum
5. Profile

Implemented:
- mobile bottom navigation reduced to five persistent destinations;
- SabiPay and Verification remain contextual rather than permanent tabs;
- authenticated Web uses shared `AppShell`;
- Web marketplace bespoke top-level header has been removed;
- unauthenticated marketplace uses the shared public shell;
- deep-link support remains preserved.

### Marketplace discovery — KEEP / REFACTOR — COMPLETE

Django marketplace endpoints remain authoritative for marketplace discovery.

Supported server filters:
- `q` text query;
- category;
- listing subcategory;
- delivery mode;
- listing available-now;
- generic `location` across country/state/city/area;
- structured country/state/city/area filters for precise clients.

Generic and structured location filters can be combined. The generic location parameter is an OR across the four location fields; any supplied structured fields are then applied as additional constraints.

Web, Android and iOS now send marketplace text/location discovery to Django instead of independently reimplementing those rules over an ever-growing downloaded collection.

### Marketplace pagination — COMPLETE AT API BOUNDARY

Global DRF pagination remains intentionally unchanged because enabling it globally would alter unrelated APIs.

A dedicated `MarketplacePagination` is applied only to service listings and open jobs:
- default page size: 24;
- caller-selectable `page_size`;
- maximum page size: 60;
- standard DRF count/next/previous/results response shape.

This closes the unbounded marketplace-discovery risk without introducing a cross-product API regression. Current clients consume the bounded first result page and rely on explicit search/filter narrowing. A richer load-more/infinite-scroll interaction may be added from controlled-user-testing evidence without changing the API contract.

### Community/profile search — KEEP / IMPROVE — COMPLETE

`/api/search/` remains scoped to SabiForum posts, profiles and hashtags.

Implemented hardening:
- empty/one-character broad scans rejected;
- marketplace scope rejected;
- bounded result limits;
- public profile fields only;
- authoritative account role returned;
- regression tests cover domain boundaries.

## Role-authority cleanup

While touching marketplace authorisation, remaining role checks in marketplace listing/job/thread creation were changed from the legacy `Profile.role` mirror to authoritative `User.role`, preserving the Master Playbook single-source-of-truth rule.

## Accessibility and complete states

Web:
- keyboard-operable search form;
- labelled query/location/category controls;
- accessible selected tab state;
- visible searching state;
- error + Retry state;
- empty state;
- dialog semantics for listing/job overlays;
- shared responsive navigation shell.

Android/iOS:
- explicit Search action and keyboard submit;
- labelled text/location controls;
- selected tab semantics;
- pull-to-refresh preserving current query/location;
- persistent error + retry card;
- loading/searching state;
- empty-state guidance;
- Phase 1 touch-target/design-token foundation retained.

## Nigerian-context implementation

- free-text location supports city, state, area or country without requiring perfect structured formatting;
- structured location filters remain available for precision;
- NGN remains the marketplace default where applicable;
- remote/diaspora use remains possible through country/delivery-mode filtering;
- explicit-submit search avoids request storms on unstable/mobile connections.

## Regression evidence

Added Phase 4 marketplace discovery tests covering:
- generic location matches country/state/city/area;
- generic + structured location intersection;
- scoped marketplace pagination;
- page-size bounding.

Existing marketplace journey tests continue to cover moderated discovery, role boundaries, messaging, negotiation, booking and scheduling regression paths.

## CI evidence

- Platform CI #172 passed for the initial mobile Home/navigation slice.
- Platform CI #181 passed after mobile server-driven discovery and Web Home/search-boundary work.
- Platform CI #184 passed after Web marketplace server-driven search and navigation consolidation.
- Final head must pass its own Platform CI before Phase 4 is certified and merged.

## Final gate

Functional Phase 4 implementation is complete.

Certification now requires only:
1. final Platform CI green on the current head;
2. PR ready-for-review transition;
3. merge into `main`.

Vercel deployment remains deferred until Master Phase 5 as the programme constraint; this is not a Phase 4 quality waiver.
