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

The previous mobile shell defaulted signed-in users to SabiForum, exposed six top-level destinations and had no signed-in Home destination.

Implemented Phase 4 decision:
- role-aware Home added as signed-in default;
- primary navigation is Home / Market / Messages / SabiForum / Profile;
- verification is nested under Profile;
- SabiPay and Verification remain contextual destinations;
- deep-link routing remains supported.

### Marketplace discovery — KEEP / REFACTOR

The Django marketplace already supports authoritative server-side filtering:
- text query (`q`)
- category
- subcategory for listings
- delivery mode
- available-now for listings
- country/state/city/area filters

Decision:
- KEEP Django marketplace endpoints as the authoritative marketplace discovery API.
- REFACTOR clients to send filter parameters to the server instead of independently reimplementing business search rules.
- retain local state only for UI controls and already-returned results.
- add explicit loading, empty, error and retry behaviour.
- preserve role boundaries and moderation filters on the server.

Current implementation:
- mobile marketplace API now accepts authoritative `q`, category, subcategory, delivery mode, availability and explicit location query parameters;
- Android/iOS marketplace text search and pull-to-refresh now query Django rather than re-filtering the full downloaded collection;
- the current single free-text location box remains a local refinement until a generic backend location parameter is introduced; this limitation is explicit rather than hidden;
- web marketplace server-driven search remains open.

### Community/profile search — KEEP / IMPROVE

`Backend/search/views.py` supports scoped search for posts, profiles and hashtags.

Implemented hardening:
- empty/one-character broad scans are rejected;
- marketplace scope is not accepted by `/api/search/`;
- result limits remain bounded;
- public profile search returns discovery-safe fields and authoritative account role;
- regression tests cover these domain boundaries.

## Duplication findings

1. Web still has shared navigation plus a separate marketplace header — OPEN.
2. Web marketplace still duplicates Django search/location/category logic locally — OPEN.
3. Mobile marketplace text discovery duplication — CLOSED; Django now owns text search.
4. Mobile Profile -> Verification plus Verify top-level duplication — CLOSED.
5. SabiPay permanent mobile primary-tab duplication — CLOSED.

## V2 product decisions

### Home

Signed-in Home is distinct from the public marketing homepage.

Implemented:
- role-aware mobile Home;
- `/home` signed-in web Home;
- password and Google sign-in default to `/home` rather than SabiForum;
- authenticated web `AppShell` uses Home / Market / Messages / SabiForum / Profile.

Client home prioritises service discovery, job posting, messages and community support context.
Professional home prioritises open opportunities, service visibility, messages, trust/verification and contextual transaction entry.

### Navigation

Navigation hierarchy reflects frequency and user intent, not every implemented module equally.

Web:
- public shell remains for unauthenticated/public pages;
- signed-in `AppShell` now exists for product journeys;
- marketplace bespoke header consolidation remains open.

Mobile:
- maximum five persistent primary destinations;
- secondary capabilities opened contextually;
- role-sensitive actions are inside screens rather than permanent tabs.

### Discovery

Discovery uses one authoritative server-side rule set per domain.

Marketplace discovery:
- listings endpoint for services;
- jobs endpoint for open jobs;
- category endpoint for taxonomy;
- server-side filters for query/category/delivery/availability and explicit structured location fields.

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

Implemented on mobile discovery:
- explicit Search button and keyboard submit;
- labelled search/location controls;
- selected-state semantics on tabs;
- visible searching state;
- pull-to-refresh reuses the current query;
- clearer empty-result guidance.

## Nigerian-context requirements

- location input must support Nigerian city/state/area usage without requiring perfect formatting;
- NGN remains default marketplace currency where applicable;
- remote/diaspora discovery must remain possible through country + delivery mode rather than assuming physical proximity;
- minimise unnecessary requests/data transfer;
- explicit-submit server queries prevent request storms on unstable/mobile connections.

## Performance requirements

- move filtering to the backend rather than downloading ever-growing collections for client-side search;
- introduce pagination/incremental loading before user-testing certification if endpoints are still effectively unbounded;
- debounce free-text search or query on explicit submission;
- deduplicate in-flight requests where practical;
- preserve cached/category data where safe;
- add backend indexes only where query evidence supports them.

## Phase 4 build order and status

1. Signed-in Home and corrected navigation hierarchy — SUBSTANTIALLY COMPLETE.
2. Shared web application navigation — COMPLETE; marketplace bespoke header removal OPEN.
3. Server-driven marketplace search/filter contract for Web — OPEN.
4. Server-driven marketplace search/filter contract for Android/iOS — TEXT SEARCH COMPLETE; structured filter UI refinement OPEN.
5. Category and location UX refinement — OPEN.
6. Community/profile/hashtag search hardening — COMPLETE.
7. Loading/empty/error/retry/accessibility states — PARTIAL.
8. Cross-platform regression tests and Platform CI — IN PROGRESS.
9. Final audit against V2 design evidence and Master Playbook Definition of Done — OPEN.

## CI evidence

- Platform CI #172 passed on the initial mobile Home/navigation slice.
- Later Phase 4 heads require their own green Platform CI before certification.

## Remaining certification blockers

1. Remove the duplicate web marketplace top-level header and align public/authenticated navigation behaviour.
2. Move web marketplace text/category discovery onto Django query parameters rather than local-only `useMemo` rules.
3. Decide and implement the generic location-query contract without weakening structured location filtering.
4. Complete web/mobile error/retry/loading states and structured filter UI.
5. Validate pagination/incremental loading requirements.
6. Final Platform CI and cross-platform journey gate.

Phase 4 is not certified until all relevant Web + Android + iOS journeys and server-side discovery behaviour have passed the final gate.