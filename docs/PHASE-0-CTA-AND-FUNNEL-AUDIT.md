# Phase 0 — CTA, Conversion & Return-to-Intent Audit

Status: IN PROGRESS
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
Related: `docs/PHASE-0-PRODUCT-AUDIT.md`, `docs/PHASE-0-ROUTE-INVENTORY.md`
Baseline: `main@ed53bf74191ff2e0d7da3e86973624160a5e0c51`

## 1. Objective

Audit high-value public calls to action and conversion handoffs before redesign. For each CTA determine:

- user intent;
- destination;
- intended access class;
- actual current access;
- whether role intent is preserved;
- whether context/search state is preserved;
- whether login/signup returns the user to their intended task;
- whether the destination works without the currently unavailable backend;
- decision: KEEP / IMPROVE / REWORK / REPLACE / REMOVE.

## 2. Confirmed P1 findings

### C0-001 — Homepage search is blocked by middleware for signed-out users
Severity: P1
Decision: REWORK access architecture

Homepage search submits to `/marketplace?q=...&location=...`.

Product intent:
A visitor should be able to discover supply publicly, then authenticate only when performing an account-dependent action.

Actual behaviour:
`/marketplace` is not in middleware `PUBLIC_ROUTES`. A signed-out visitor is redirected to `/login` before marketplace public-shell logic can render.

Impact:
- the homepage primary product action does not fulfil its promise;
- search feels like a disguised login wall;
- acquisition users cannot sample marketplace value before account creation;
- search query/location context is lost because middleware redirect does not include `next`.

Required outcome:
`/marketplace` becomes GUEST_CAPABLE. Search results can render from demo/public data before backend readiness and from authoritative public APIs later. Protected actions such as message/post/book/pay may trigger authentication while preserving full return intent.

### C0-002 — Popular service-category links are blocked
Severity: P1
Decision: REWORK access architecture

Homepage popular categories link to `/services/[slug]`. Those pages are designed as public discovery but are not whitelisted by middleware.

Impact:
The homepage appears rich with discovery options but every category behaves like a login CTA.

Required outcome:
Service/category discovery must be PUBLIC or GUEST_CAPABLE.

### C0-003 — “I need a service” is blocked
Severity: P1
Decision: REWORK access architecture

Homepage Client CTA points to `/for-clients`, which middleware blocks for unauthenticated users.

This is especially problematic because `/for-clients` is explicitly a public acquisition page.

Required outcome:
Role education/acquisition pages remain PUBLIC.

### C0-004 — “I offer services” is blocked
Severity: P1
Decision: REWORK access architecture

Homepage Professional CTA points to `/for-professionals`, another public acquisition page blocked by middleware.

Required outcome:
`/for-professionals` remains PUBLIC.

### C0-005 — Public marketing copy contradicts actual product behaviour
Severity: P1 trust/content
Decision: FIX architecture; preserve useful principle

`PublicMarketing` explicitly states:
“Public information pages stay public; sign-in is reserved for actions that genuinely need an account.”

The Client acquisition page similarly uses the CTA label “Browse services publicly” and states that sign-in is reserved for messaging, posting, booking and payment.

Actual middleware behaviour blocks `/services`, `/locations`, `/for-clients`, `/for-professionals` and many other public surfaces.

Impact:
- product promise and behaviour disagree;
- damages trust during first use;
- creates misleading usability-test results.

Required outcome:
Make route policy consistent with this principle before rewriting the copy.

### C0-006 — Professional conversion loses role intent
Severity: P1 conversion/onboarding
Decision: REPLACE funnel handoff

`/for-professionals` primary CTA is:
`Become a SabiWay Professional` -> `/signup`.

Current `/signup` initialises the account role to `client`.

Impact:
- a user who explicitly chose the Professional journey lands in a generic form defaulted to Client;
- increases wrong-role account creation risk;
- weakens Professional activation and analytics attribution;
- creates avoidable friction and confusion.

Required outcome:
Professional CTA must enter a Professional-specific signup route/state. Role choice must be explicit and preserved across OAuth/email flows. Do not depend on a default radio field.

Target pattern options for Phase 4 decision:
- `/join/professional` and `/join/client`; or
- `/signup?role=professional` with server/client validation and immutable journey context until deliberate user change.

Dedicated role-oriented routes are preferred for clarity and analytics.

### C0-007 — Generic “Join SabiWay” hides the two-sided marketplace decision
Severity: P1 growth/UX
Decision: REWORK

Public header uses a single `/signup` CTA labelled `Join SabiWay`.

For a two-sided marketplace, this forces the user to defer the key question “I need a service” vs “I offer services” until inside signup.

Required outcome:
Primary public navigation should expose role-aware conversion without overwhelming the header. Candidate patterns:
- Join dropdown/sheet with Client and Professional choices;
- Client-first `Get started` plus visible `Become a Professional` secondary action;
- contextual CTA based on current public journey.

Exact pattern will be validated in Phase 3/4 research.

### C0-008 — Middleware destroys return-to-intent
Severity: P1 UX/architecture
Decision: REPLACE redirect contract

Current middleware redirects signed-out protected requests to plain `/login`.

Current login code already reads a `next` query parameter after successful login, but middleware does not supply one.

Impact:
- visitor loses target page/action;
- search/filter/post/profile context can be abandoned;
- extra navigation after login;
- lower conversion for messaging, booking and other protected actions.

Required outcome:
Central auth-gate helper must preserve a safe same-origin return path, e.g. `/login?next=<encoded-path-query>`, while protecting against open redirects. The role-specific login journey must also preserve this intent.

### C0-009 — Authenticated users visiting login/signup are redirected to `/community`, not role home or original intent
Severity: P1 UX/IA
Decision: REWORK

Middleware sends users with an access cookie away from `/login` or `/signup` to `/community`.

This conflicts with:
- role-specific Client/Professional home requirements;
- login page's own `/home` destination logic;
- future return-to-intent handling.

Required outcome:
Resolved authenticated destination order should be:
1. valid safe pending intent if permitted;
2. required onboarding step if incomplete;
3. Client or Professional role home;
4. never a hard-coded generic community page unless community was the intended destination.

### C0-010 — Multiple public CTAs lead to routes whose usefulness depends on missing backend state
Severity: P1 testing/product truth
Decision: BUILD demo/public fixture adapter before UX certification

Even after route access is corrected, `/marketplace` fetches listings/jobs/categories from Django and collapses failures to empty arrays.

Impact:
- routing fix alone will reveal empty/non-representative product;
- user testing cannot evaluate discovery quality;
- designers cannot inspect realistic states.

Required outcome:
Phase 7 demo/public data adapter must supply deterministic realistic datasets for Client and Professional review until backend integration, with clear separation between demo and authoritative data.

## 3. Homepage CTA matrix

| Surface | CTA/action | Destination | Intended access | Current result signed out | Decision |
|---|---|---|---|---|---|
| Hero | Search | `/marketplace?q=&location=` | GUEST_CAPABLE | Redirect login | REWORK |
| Hero popular category | category chip | `/services/[slug]` | PUBLIC/GUEST | Redirect login | REWORK |
| Hero | I need a service | `/for-clients` | PUBLIC | Redirect login | REWORK |
| Hero | I offer services | `/for-professionals` | PUBLIC | Redirect login | REWORK |
| Hero side card | See how location works | `/how-it-works` | PUBLIC | Redirect login | REWORK |
| Situation card | Browse services | `/services` | PUBLIC/GUEST | Redirect login | REWORK |
| Situation card | Explore locations | `/locations` | PUBLIC | Redirect login | REWORK |
| Situation card | Professional journey | `/for-professionals` | PUBLIC | Redirect login | REWORK |
| Market section | Explore locations | `/locations` | PUBLIC | Redirect login | REWORK |
| Trust | Location explanation | `/how-it-works` | PUBLIC | Redirect login | REWORK |
| Trust | Trust before commitment | `/trust-and-safety` | PUBLIC | Redirect login | REWORK |
| Trust | Money journey | `/sabipay-explained` | PUBLIC | Redirect login | REWORK |

## 4. Public header/footer matrix

### Header

| CTA | Destination | Intended | Current signed-out result | Decision |
|---|---|---|---|---|
| Find services | `/services` | PUBLIC/GUEST | Redirect login | FIX access |
| Locations | `/locations` | PUBLIC | Redirect login | FIX access |
| For clients | `/for-clients` | PUBLIC | Redirect login | FIX access |
| For professionals | `/for-professionals` | PUBLIC | Redirect login | FIX access |
| How it works | `/how-it-works` | PUBLIC | Redirect login | FIX access |
| Sign in | `/login` | PUBLIC auth | Works | REWORK role entry |
| Join SabiWay | `/signup` | PUBLIC auth | Works | REWORK role conversion |
| Mobile SabiForum | `/sabiforum` | GUEST_CAPABLE candidate | Redirect login | POLICY + REWORK |

### Footer

Most footer destinations are designed as public content, yet middleware currently blocks the majority. Particularly high-trust routes affected include:

- `/fees`;
- `/sabipay-explained`;
- `/trust-and-safety`;
- `/verification-info`;
- `/contact`;
- `/accessibility`;
- `/partners`;
- `/careers`;
- `/download`.

This means legal/help pages may be reachable while adjacent trust/commercial pages are not, creating an inconsistent information architecture.

## 5. Client acquisition funnel — current vs target

### Current
`Homepage -> I need a service -> middleware login wall`

or

`Homepage search -> middleware login wall`

The intended `/for-clients` page itself says public browsing should happen before authentication, but the route cannot currently deliver that experience.

### Target
`Public homepage/search/category/location -> public results/profile evidence -> protected action -> Client-oriented identity entry -> onboarding if needed -> return to exact action/context -> Client application`

Rules:
- browsing never requires login unless privacy/trust policy specifically requires it;
- messaging/posting/booking/payment require identity;
- authentication does not erase search/profile/job context;
- Client identity entry never defaults into Professional context;
- returning Clients bypass unnecessary onboarding.

## 6. Professional acquisition funnel — current vs target

### Current
`Homepage -> I offer services -> middleware login wall`

If `/for-professionals` is reached while authenticated/cookie-present:
`Become a SabiWay Professional -> /signup -> role defaults Client`.

### Target
`Public Professional proposition -> Professional join -> Professional-specific account entry -> professional onboarding -> service/profile setup -> verification context -> Professional home/opportunities`

Rules:
- Professional intent survives every handoff;
- Google/OAuth flow must preserve role context safely;
- no silent role default;
- user can understand why Professional information is required;
- activation analytics distinguish account creation from usable Professional supply.

## 7. Return-to-intent contract required for Phase 1

When a guest performs a protected action:

1. capture path + query + safe action context;
2. route to role-appropriate login/signup;
3. validate `next` as internal/safe;
4. authenticate;
5. complete required onboarding if necessary;
6. return to intended destination/action;
7. if intent is no longer valid, explain why and provide nearest valid action.

Examples:
- `/marketplace?q=plumber&location=Manchester` -> profile -> Message -> login -> return to same Professional/message context;
- public job page -> Respond -> Professional login -> return to proposal composer;
- public SabiForum post -> Comment -> login -> return to same post/comment anchor.

## 8. Analytics events required for these funnels

Minimum future events:

- `public_search_submitted`
- `service_category_selected`
- `client_intent_selected`
- `professional_intent_selected`
- `protected_action_attempted`
- `auth_gate_viewed`
- `login_started`
- `login_completed`
- `signup_started`
- `signup_role`
- `signup_completed`
- `return_to_intent_success`
- `return_to_intent_failure`
- `marketplace_no_results`
- `marketplace_data_unavailable`

Do not send credentials, sensitive verification content or payment details to analytics.

## 9. Phase 1 inputs from this audit

Phase 1 must define and approve:

- canonical route taxonomy;
- guest-capable discovery boundary;
- Client and Professional route maps;
- role-specific auth-entry routes;
- central auth-gate/return-to-intent contract;
- shell-selection contract independent of auth authority;
- public social/profile visibility policy;
- authenticated default destination rules;
- route denial/permission UX.

No implementation should simply add every public page to middleware without this taxonomy. The fix must remove duplicated decision-making rather than grow the whitelist indefinitely.

## 10. Audit status

Completed in this pass:
- homepage high-value CTA audit;
- public header/footer CTA audit;
- Client acquisition handoff audit;
- Professional acquisition handoff audit;
- middleware return-to-intent audit.

Next:
- authentication/session lifecycle deep audit;
- Client vs Professional target information architecture;
- social/profile public visibility policy;
- backend/data dependency map.
