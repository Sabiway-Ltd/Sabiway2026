# Master Phase 4 — Home, Navigation, Discovery & Search Baseline

Status: IN PROGRESS
Branch: `feat/phase-4-home-navigation-discovery-search`
Base: certified Master Phase 3 `main` (`cc61577a676882412a5cb5209b8b586850680d8e`)

## Scope

Master Phase 4 covers the signed-in home experience, primary navigation, service/job discovery, category browsing, location/search behaviour and the existing community/profile search capability across Web, Android and iOS.

This phase follows the Master Playbook rule: inspect existing implementation first, choose KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE, then build only what is required.

## Current-state audit

### Web public home — KEEP / IMPROVE

`frontend/app/page.tsx` is a V2 public/marketing landing page with marketplace entry, category discovery, SabiForum context and responsive layouts. It is not a signed-in role-aware home.

Decision:
- KEEP as the public entry point.
- IMPROVE links/search entry during this phase where needed.
- Do not turn it into the signed-in dashboard.

### Web navigation — MERGE / REFACTOR

`frontend/app/_components/v2/PublicShell.tsx` provides a responsive public header/footer and accessible mobile navigation.

`frontend/app/marketplace/MarketplaceClient.tsx` independently renders another header/navigation system.

Decision:
- KEEP the shared V2 shell primitives.
- MERGE duplicated navigation patterns into shared app/public navigation responsibilities.
- REFACTOR marketplace away from a bespoke top-level navigation implementation.
- Preserve route-specific actions without creating parallel navigation systems.

### Mobile primary navigation — REFACTOR

`mobile/App.tsx` currently:
- defaults signed-in users to `community`;
- exposes SabiForum, Market, Messages, SabiPay, Profile and optionally Verify at the same bottom-navigation level;
- has no signed-in Home destination;
- exposes verification as a top-level destination even though Profile already links into verification.

Decision:
- add a role-aware Home as the signed-in default;
- keep a maximum of five primary mobile destinations;
- nest verification under Profile;
- avoid using primary navigation for secondary/conditional workflows;
- keep deep-link routing but map secondary destinations into the appropriate journey.

Target primary mobile navigation:
1. Home
2. Market
3. Messages
4. SabiForum
5. Profile

SabiPay and Verification remain accessible contextually from relevant journeys rather than consuming permanent bottom-navigation slots.

### Marketplace discovery — KEEP / REFACTOR

The Django marketplace already supports authoritative server-side filtering:
- text query (`q`)
- category
- subcategory for listings
- delivery mode
- available-now for listings
- country/state/city/area filters

Both Web and mobile currently fetch collections and then repeat search/location filtering locally.

Decision:
- KEEP Django marketplace endpoints as the authoritative marketplace discovery API.
- REFACTOR clients to send filter parameters to the server instead of independently reimplementing business search rules.
- retain local state only for UI controls and already-returned results.
- add explicit loading, empty, error and retry behaviour.
- preserve role boundaries and moderation filters on the server.

### Community/profile search — KEEP / IMPROVE

`Backend/search/views.py` currently supports scoped search for posts, profiles and hashtags.

Decision:
- KEEP this API for SabiForum/community discovery.
- IMPROVE query validation, result limits/pagination and client states as needed.
- Do NOT create a second marketplace search implementation inside `/api/search/`.
- Product search surfaces may present multiple scopes, but each scope must call its authoritative domain API.

## Duplication findings

1. Web has shared public navigation plus a separate marketplace header.
2. Web marketplace duplicates Django search/location/category logic in `useMemo` filtering.
3. Mobile marketplace duplicates Django search/location logic in `useMemo` filtering.
4. Mobile exposes Profile -> Verification while also keeping Verify as a separate primary tab.
5. SabiPay is currently a permanent mobile primary tab even though it is transaction-context functionality.

## V2 product decisions

### Home

Signed-in Home must be distinct from the public marketing homepage.

Client home should prioritise:
- find a service;
- browse categories;
- post a job;
- continue active conversations/jobs;
- trust/verification signals where relevant;
- SabiForum entry as a supporting community surface.

Professional home should prioritise:
- open jobs/opportunities;
- service visibility/listings;
- messages/responding;
- verification/trust status;
- transaction/SabiPay entry when context exists;
- SabiForum as a supporting community surface.

### Navigation

Navigation hierarchy must reflect frequency and user intent, not expose every implemented module equally.

Web:
- public shell for unauthenticated/public pages;
- signed-in application navigation for product journeys;
- responsive desktop/tablet/mobile-web behaviour.

Mobile:
- maximum five persistent primary destinations;
- secondary capabilities opened contextually;
- role-sensitive actions are inside screens, not additional permanent tabs.

### Discovery

Discovery must use one authoritative server-side rule set per domain.

Marketplace discovery:
- listings endpoint for services;
- jobs endpoint for open jobs;
- category endpoint for taxonomy;
- server-side filters for query/location/category/delivery/availability.

Community discovery:
- existing search endpoint for posts/profiles/hashtags.

## Accessibility and usability requirements

- WCAG 2.2 AA target on web.
- minimum 44x44 CSS-pixel equivalent interaction targets where practical; mobile uses design-system touch-target token.
- keyboard-operable navigation and search controls on web.
- visible focus states.
- semantic labels for search/filter controls.
- no colour-only selected state.
- explicit loading, empty, error and retry states.
- preserve user query/filter state during retries and navigation where practical.

## Nigerian-context requirements

- location input must support Nigerian city/state/area usage without requiring perfect formatting;
- NGN remains default marketplace currency where applicable;
- remote/diaspora discovery must remain possible through country + delivery mode rather than assuming physical proximity;
- minimise unnecessary requests/data transfer;
- debounced or explicit-submit server queries must prevent request storms on unstable/mobile connections.

## Performance requirements

- move filtering to the backend rather than downloading ever-growing collections for client-side search;
- introduce pagination/incremental loading before user-testing certification if endpoints are still effectively unbounded;
- debounce free-text search or query on explicit submission;
- deduplicate in-flight requests;
- preserve cached/category data where safe;
- add backend indexes only where query evidence supports them.

## Phase 4 build order

1. Signed-in Home and corrected navigation hierarchy.
2. Shared web application navigation; remove marketplace header duplication.
3. Server-driven marketplace search/filter contract for Web.
4. Server-driven marketplace search/filter contract for Android/iOS.
5. Category and location UX refinement.
6. Community/profile/hashtag search hardening.
7. Loading/empty/error/retry/accessibility states.
8. Cross-platform regression tests and Platform CI.
9. Final audit against V2 design evidence and Master Playbook Definition of Done.

## Initial gate

Phase 4 may proceed to implementation because:
- current Web, mobile and backend search/discovery paths have been inspected;
- duplication has been identified;
- authoritative domain boundaries are known;
- initial KEEP / IMPROVE / REFACTOR / MERGE decisions are documented.

Phase 4 is not certified until all relevant Web + Android + iOS journeys and server-side discovery behaviour have passed the final gate.