# Phase 0 — Security, Privacy, Product Analytics & Growth Audit

Status: IN PROGRESS
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`

## 1. Objective

Identify the security/privacy boundaries that must constrain the rebuild and define the measurement model required to know whether the rebuilt product actually improves user outcomes.

This is a source-level architecture audit, not a penetration test or privacy certification.

## 2. Security/privacy findings

### S0-001 — Authentication state is duplicated across cookie, localStorage and Zustand
Severity: RED/P1 architecture
Decision: REPLACE authoritative session architecture

Current web auth can store access tokens in:
- an `access` cookie;
- `localStorage.access`;
- Zustand state;

with refresh/user data in localStorage.

Impact:
- multiple sources of truth;
- stale-state disagreement;
- browser-readable access/refresh tokens increase XSS blast radius;
- middleware and API clients can disagree about authentication.

Long-term required outcome:
- one explicit session architecture;
- server/backend-authoritative authentication;
- minimise browser-readable long-lived credentials;
- documented expiry/refresh/logout lifecycle.

### S0-002 — Axios token refresh does not update middleware cookie
Severity: RED/P1
Decision: REWORK

Axios refresh can replace `localStorage.access`, while Next.js middleware uses the `access` cookie.

Impact:
- API calls can succeed with a refreshed token while route guard still sees an expired cookie;
- unpredictable redirect/logout behaviour.

Required outcome:
- session renewal updates all authoritative server/browser state atomically, or preferably removes this dual-authority model.

### S0-003 — Active frontend logout does not use available backend logout/revocation helper
Severity: P1 security/session
Decision: REWORK

The codebase contains an auth service capable of posting the refresh token to `/auth/logout/`, while active Zustand logout currently clears browser state only.

Required outcome:
- revoke/expire server-side refresh/session state where architecture supports it;
- client clear is not the sole security boundary.

### S0-004 — Middleware checks authentication presence, not role/object authorisation
Severity: RED/P1
Decision: REWORK

A cookie indicates identity presence only. It does not establish:
- Client-only permission;
- Professional-only permission;
- staff/moderator access;
- transaction participation;
- ownership.

Required outcome:
- frontend route policy for UX;
- backend permission authority for security;
- explicit denied/not-found handling without leaking sensitive state.

### S0-005 — Demo mode must never become a production auth bypass
Severity: RED
Decision: BUILD isolated fixture mode

Required safeguards:
- environment/build flag;
- no production secret/session creation;
- demo adapters instead of privileged backend bypass where possible;
- visible demo indicator;
- deterministic synthetic data only;
- no real user PII;
- removal/disable path before production.

### S0-006 — Analytics property governance is required before richer instrumentation
Severity: P1 privacy
Decision: BUILD event schema + allowlist

Analytics currently accepts an arbitrary `properties` object.

Risk:
- developers could accidentally send email, message content, verification details, payment evidence or other sensitive data.

Required outcome:
- event catalogue;
- property allowlist/contracts;
- prohibit credentials, message bodies, verification documents, exact sensitive financial evidence and unnecessary PII;
- retention/access policy aligned to privacy notice.

### S0-007 — Anonymous measurement identifier uses sessionStorage
Severity: LOW/P2
Decision: KEEP concept + privacy review

Current anonymous ID is session-scoped, which reduces persistent cross-session tracking. This is a privacy-positive default for basic product measurement, but consent/legal basis and retention still need formal product/privacy decisions.

### S0-008 — Financial/verification/dispute domains require explicit privacy classification
Severity: RED
Decision: BUILD data classification matrix

Classify at minimum:
- public profile data;
- account contact data;
- private messages;
- verification identity/evidence;
- transaction/payment metadata;
- payout information;
- dispute evidence;
- support/internal notes;
- analytics identifiers/events.

For each define:
- purpose;
- visibility;
- storage owner;
- retention;
- audit access;
- deletion/export implications;
- logging restrictions.

## 3. Current analytics baseline

### P0A-001 — Global screen-view measurement exists
Decision: KEEP + enrich carefully

`ProductAnalytics` records `screen_viewed` on route changes.

### P0A-002 — Analytics transport is best-effort and journey-safe
Decision: KEEP

`trackProductEvent` swallows transport failure so measurement does not break the product. This is correct.

### P0A-003 — Authenticated analytics optionally attaches bearer token
Decision: REVIEW

This can allow backend association with a signed-in account. Ensure the backend stores only necessary identity linkage and that analytics permissions/retention are explicit.

## 4. Critical analytics/growth gaps

### P0A-004 — No measurable acquisition/activation funnel is defined
Severity: P1 product
Decision: BUILD

Required Client funnel events:
- homepage_viewed
- service_search_started
- service_search_completed
- search_no_results
- professional_profile_viewed
- client_signup_intent_selected
- signup_started
- signup_completed
- onboarding_completed
- contact_professional_started
- job_post_started/completed
- booking_started/completed
- payment_started/completed
- review_submitted

Required Professional funnel events:
- professional_landing_viewed
- professional_signup_intent_selected
- signup_started/completed
- professional_onboarding_completed
- service_listing_started/published
- verification_started/submitted/approved
- opportunity_viewed
- proposal_started/submitted
- conversation_started
- booking_accepted
- work_completed
- payout_viewed/requested/completed

### P0A-005 — Role attribution must be explicit
Severity: P1
Decision: BUILD

Every relevant authenticated product event should include a controlled role dimension derived from authoritative state, not free-text properties.

### P0A-006 — Search quality cannot currently be evaluated
Severity: P1 marketplace
Decision: BUILD

Need metrics for:
- query/category/location usage;
- results count bucket;
- no-results rate;
- result click-through;
- profile-to-contact conversion;
- job-post fallback after poor search;
- time to first meaningful action.

Do not collect raw sensitive free-text queries indefinitely without privacy review.

### P0A-007 — Home relevance cannot be measured
Severity: P1
Decision: BUILD

Role-specific home should measure exposure and action of modules such as:
- recommended professionals;
- active job updates;
- leads/opportunities;
- verification action;
- earnings/payout action;
- messages/bookings.

This allows ranking/removal of low-value modules instead of designing by opinion alone.

### P0A-008 — Reliability/failure analytics need structured events
Severity: P1
Decision: BUILD

Track controlled failure categories such as:
- API unavailable;
- auth expired;
- search failed;
- payment provider unavailable;
- realtime degraded;

Never send raw exception bodies containing sensitive data.

## 5. North-star and supporting metrics proposal

SabiWay should avoid vanity metrics such as page views or raw registrations as the primary success definition.

Candidate North Star:
**Successful trusted service connections that progress to completed work.**

Supporting marketplace metrics:
- search-to-profile rate;
- profile-to-contact rate;
- job-post-to-qualified-response rate;
- median time to first relevant response;
- booking conversion;
- completion rate;
- dispute/cancellation rate;
- repeat Client rate;
- active Professional supply rate;
- Professional response rate;
- verification completion;
- payout success.

SabiForum/community should be measured as a supporting ecosystem, not allowed to dominate marketplace success simply through engagement volume.

## 6. Growth principles for rebuild

1. Let guests experience value before forcing signup.
2. Ask for identity at the moment a protected action genuinely requires it.
3. Preserve user intent through authentication.
4. Keep Professional and Client value propositions distinct.
5. Use trust evidence before financial/booking commitment.
6. Reduce no-result dead ends with useful alternatives.
7. Do not use dark patterns, misleading scarcity or forced engagement.
8. Measure meaningful progression, not clicks for their own sake.

## 7. Analytics event governance

Every event must define:
- event name;
- trigger;
- user/role scope;
- allowed properties;
- prohibited sensitive properties;
- purpose/metric;
- retention category;
- test evidence.

Naming convention should be stable, lower_snake_case and outcome-oriented.

## 8. Phase 1 security gate

Routing/identity changes must preserve:
- backend permission authority;
- no open redirect via `next`;
- no role elevation from client-side state;
- no production demo bypass;
- clear session expiry handling;
- no sensitive tokens in analytics/logging.

## 9. Phase 0 remaining work

Consolidate all Phase 0 findings into:
- canonical P0/P1/P2 defect register;
- KEEP/IMPROVE/REWORK/REPLACE/REMOVE matrix;
- Phase 1 acceptance criteria;
- explicit Phase 0 exit decision.
