# Phase 0 — Client vs Professional Information Architecture Audit

Status: IN PROGRESS
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
Related: `docs/PHASE-0-PRODUCT-AUDIT.md`, `docs/PHASE-0-ROUTE-INVENTORY.md`, `docs/DESIGN-SYSTEM.md`
Baseline implementation reviewed: `main@ed53bf74191ff2e0d7da3e86973624160a5e0c51`
Working branch: `plan/product-rebuild-phase-0`

## 1. Objective

Define the intended information architecture (IA) for SabiWay's two core product roles and compare it with the current implementation. The purpose is not to redesign screens yet; it is to establish what each role needs to find, understand and act on, what can remain shared, and what must diverge.

## 2. Core product principle

Client and Professional are not merely values on the same user record. They represent different jobs-to-be-done, activation milestones, navigation priorities, dashboard priorities, trust needs, transaction states and success metrics.

The account/identity model may remain shared at backend level. The product experience must be role-aware.

## 3. Current implementation truth

### Current AppShell
The authenticated shell currently gives every user the same five destinations:

1. Home
2. Market
3. Messages
4. SabiForum
5. Profile

The only role-specific behaviour visible in the shell is a small role label near sign out. Desktop and mobile both reuse the same navigation array.

Decision: **REPLACE IA while preserving reusable shell/layout primitives where useful.**

### Current Home
`/home` does inspect `user.role`, but role differentiation is limited to three quick-action cards and one sentence in the welcome hero.

Professional quick actions:
- Find open jobs -> `/marketplace`
- Strengthen your profile -> `/profile`
- Open messages -> `/messages`

Client quick actions:
- Find a professional -> `/marketplace`
- Post a job -> `/marketplace`
- Open messages -> `/messages`

Both roles then see the same SabiForum and Trust cards.

Decision: **REPLACE role hierarchy, retain only reusable visual/technical primitives after design-system review.**

### Conflict with existing design rules
The repository's own `docs/DESIGN-SYSTEM.md` already requires:
- role-specific Client and Professional home hierarchy;
- Client priority around service discovery, trusted professionals, current jobs/conversations and history;
- Professional priority around available work, enquiries, bookings, verification, earnings and reputation;
- different role-oriented mobile navigation concepts;
- desktop translation that takes advantage of wider space rather than simply stretching the mobile model.

The current AppShell implementation contradicts those rules.

## 4. Target Client information architecture

### Primary Client job-to-be-done
> I need trusted help, I need to understand who can do the work, and I need to manage the work safely from discovery through completion.

### Client primary navigation — mobile candidate
Keep primary navigation to five high-frequency areas.

1. **My Jobs**
   - posted jobs
   - drafts
   - responses/proposals
   - active work
   - completed/cancelled

2. **SabiForum**
   - community feed
   - followed/relevant discussions
   - saved posts where supported

3. **Home** — visually prioritised centre action
   - search entry
   - recommended Professionals/services
   - active job/booking status
   - unread conversation/activity summary
   - next best actions

4. **History**
   - bookings
   - completed services
   - transactions/payment states where supported
   - reviews to leave / historical reviews

5. **Profile**
   - identity/profile
   - addresses/service locations/preferences where applicable
   - trust/account settings
   - support/settings

### Client desktop candidate
Desktop should not be a literal five-item bottom-nav translation. Candidate hierarchy:

Primary:
- Home
- Find Services
- My Jobs
- Messages
- SabiForum

Account/utility:
- Bookings / History
- Payments / SabiPay
- Notifications
- Saved items
- Profile
- Help & Support
- Settings

### Client Home requirements
Client Home should answer within seconds:
- What can I search for now?
- Do I have active jobs/bookings?
- Did anyone respond or message me?
- What needs my action?
- Which Professionals/services are relevant to me?
- Can I trust what I am seeing?

Candidate modules:
1. dominant search by service + service location;
2. current activity / action-needed strip;
3. active jobs/bookings;
4. responses/messages needing action;
5. recommended services/Professionals;
6. recently viewed/saved where evidence supports it;
7. SabiForum/community relevance;
8. trust/safety support only when contextually relevant.

Do not make generic educational cards the primary returning-user experience.

## 5. Target Professional information architecture

### Primary Professional job-to-be-done
> I need to attract relevant demand, respond quickly, manage my service business, complete work, get paid and build trust/reputation.

### Professional primary navigation — mobile candidate
1. **My Jobs** / **Work**
   - opportunities
   - proposals/responses
   - accepted/active work
   - completed/cancelled

2. **SabiForum**
   - community feed
   - professional/community discussions
   - content/visibility participation

3. **Home** — visually prioritised centre action
   - enquiries/leads needing action
   - relevant opportunities
   - upcoming work
   - profile/verification health
   - earnings/payment summary

4. **Earnings**
   - available/pending earnings
   - transaction history
   - payout status where enabled
   - fees/context

5. **Profile**
   - public Professional profile
   - service listings
   - portfolio/evidence
   - verification
   - reviews/reputation
   - availability/service area
   - account/settings/support

### Professional desktop candidate
Primary:
- Home
- Opportunities
- My Services
- Work / Bookings
- Messages
- SabiForum

Business/utility:
- Leads / Proposals
- Earnings
- Verification
- Reviews / Reputation
- Notifications
- Profile
- Help & Support
- Settings

### Professional Home requirements
Professional Home should answer within seconds:
- What requires my attention now?
- Are there relevant new opportunities?
- Do I have enquiries or unread messages?
- What work is upcoming/active?
- Is my profile/service listing complete and discoverable?
- What is my verification state?
- What have I earned / what is pending?
- How is my reputation changing?

Candidate modules:
1. action-needed summary;
2. new/relevant opportunities;
3. leads/enquiries;
4. upcoming/active bookings;
5. profile/service visibility health;
6. verification state;
7. earnings/payment summary;
8. reputation/reviews;
9. community/relevant SabiForum content.

## 6. Shared product areas

These concepts can be shared technically but must remain context-aware:

### Messages
Shared infrastructure, participant-scoped content.
Client context may show Professional/service/job/booking details.
Professional context may show Client/job/proposal/booking details.

Decision: **KEEP concept, REWORK layout/context.**

### SabiForum
Shared community product.
Feed ranking/recommendation may differ by interests/role, but role must not create unnecessary social segregation.

Decision: **KEEP concept, AUDIT guest vs authenticated visibility and role-aware relevance.**

### Notifications
Shared event infrastructure, different event priorities and destinations by role.

Decision: **KEEP concept, REWORK information architecture and event handling.**

### Identity/account
One identity system may be retained. Role-aware product entry and onboarding must sit on top of it.

Decision: **KEEP shared identity principle, REPLACE generic entry UX.**

### Support/settings
Shared framework; content/actions depend on role, transactions and permissions.

Decision: **KEEP shared primitives, role/context-aware contents.**

## 7. Route/surface decision matrix

| Current route/surface | Client target | Professional target | Decision |
|---|---|---|---|
| `/home` | Dedicated Client Home | Dedicated Professional Home | REPLACE hierarchy; route strategy to decide Phase 1 |
| `/marketplace` | Service/professional discovery + job pathway | Opportunity/job discovery where relevant | REWORK; current single page is overloaded across both sides |
| `/messages` | Client conversations | Professional conversations | KEEP shared concept; REWORK contextual IA |
| `/community` | Authenticated SabiForum | Authenticated SabiForum | KEEP/IMPROVE |
| `/sabiforum` | Guest/public community entry candidate | Same | REWORK access strategy |
| `/profile` | Own Client profile/account | Professional business/public profile management | REWORK heavily; role content diverges |
| `/profile/[username]` | Public/guest Professional/social profile candidate | Public Professional/social profile | PRODUCT POLICY + REWORK |
| `/notifications` | Client activity | Professional business/activity | KEEP shared engine; REWORK prioritisation |
| `/verification` | Usually not Client primary nav | Critical Professional trust journey | PROFESSIONAL_ONLY experience; KEEP security authority |
| `/sabipay` | Payment/work transaction management | Earnings/work transaction management | SHARED transaction domain; role-specific views/actions |
| `/services` | High-priority public discovery | Public category context | KEEP concept; restore public access; improve |
| `/services/[slug]` | High-priority discovery | Supply/category context | KEEP concept; improve |
| `/locations*` | Service-location discovery | Service-area context | KEEP concept; improve |
| `/for-clients` | Acquisition/education | Cross-role info only | KEEP public, rework growth later |
| `/for-professionals` | Cross-role info only | Acquisition/education | KEEP public, rework growth later |
| generic `/login` | Client entry selector/path | Professional entry selector/path | REPLACE UX architecture |
| generic `/signup` | Client signup path | Professional signup path | REPLACE/rework role-intent architecture |

## 8. Missing first-class destinations in current web IA

The current frontend tree does not expose several concepts as clear top-level web destinations even though the product model/documentation expects them.

### Client gaps
- My Jobs as a dedicated destination
- job draft/status/response management
- Bookings/History as a dedicated destination
- saved/favourites where supported
- clear payments/transaction history context

### Professional gaps
- Opportunities as a dedicated destination
- My Services/listing management as a dedicated destination
- Leads/Proposals as a dedicated destination
- Work/Bookings as a dedicated destination
- Earnings as a dedicated destination
- Reviews/Reputation management/context
- verification surfaced as an important business-health state

These gaps explain why `/marketplace` and `/profile` are currently being asked to carry too many unrelated jobs-to-be-done.

## 9. IA defects

### IA0-001 — One navigation array for both roles
Severity: P1
Decision: REPLACE

The same hard-coded navigation is used on desktop and mobile for both Client and Professional.

### IA0-002 — `/marketplace` is overloaded
Severity: P1
Decision: REWORK

It is used as:
- Client professional discovery;
- Client job-posting entry;
- Professional open-job discovery;
- generic 'Market' navigation destination.

These are related marketplace concepts but different user tasks and should not be collapsed into one ambiguous primary destination.

### IA0-003 — `/profile` is overloaded
Severity: P1
Decision: REWORK

For Clients, Profile is mostly identity/account/trust preferences.
For Professionals, Profile is part identity but also a commercial storefront, service portfolio, verification/reputation surface and discoverability asset.

### IA0-004 — Home role differentiation is cosmetic rather than operational
Severity: P1
Decision: REPLACE hierarchy

Current Home changes three quick actions but lacks role-specific status, activity, recommendations, business health and transaction context.

### IA0-005 — Missing role-specific business/work destinations
Severity: P1
Decision: BUILD/REWORK in later phases

Professional services, earnings, opportunities and Client jobs/history are not first-class in the current shared shell.

### IA0-006 — Generic 'Market' label is ambiguous
Severity: P2 UX writing
Decision: REPLACE label/context

A Client wants to 'Find services' or 'Find a Professional'. A Professional wants 'Opportunities' or work. 'Market' does not clearly state the task for either role.

### IA0-007 — Temporary `SW` logo mark contradicts design-system rule
Severity: P2 design consistency
Decision: REPLACE with official brand asset during shell rebuild

### IA0-008 — Desktop is currently a widened copy of mobile destinations
Severity: P2/P1 depending workflow
Decision: REWORK

The desktop sidebar repeats the same five mobile destinations instead of using extra space for role-specific task navigation and contextual utilities.

## 10. Role-specific activation milestones

Information architecture must support measurable activation, not only navigation.

### Client activation candidate
A Client becomes meaningfully activated when they complete a valuable progression such as:
- successful relevant search;
- view a Professional/service detail;
- post a valid job or initiate a conversation;
- receive a relevant response;
- reach booking/payment progression.

### Professional activation candidate
A Professional becomes meaningfully activated when they:
- complete a discoverable profile;
- create at least one valid service/listing;
- define service area/delivery mode;
- complete/advance trust verification where required;
- receive/respond to a relevant lead/opportunity;
- reach first accepted booking/transaction.

Phase 14 analytics work must instrument these stages.

## 11. Navigation behaviour requirements for Phase 1

Whatever exact route naming is selected, Phase 1 must guarantee:

- role-aware navigation resolved from authoritative user role;
- primary tasks visible without burying them in Profile or Market;
- deep links work independently of navigation rendering;
- access policy is separate from visual shell;
- active-route states work for nested routes;
- return-to-intent after auth;
- notifications/messages preserve object context;
- mobile bottom navigation has at most five primary items;
- desktop can expose a richer hierarchy without overwhelming users;
- keyboard/focus/landmark semantics meet WCAG 2.2 AA requirements;
- navigation does not rely only on icons;
- labels are task-oriented and role-appropriate;
- no dead or placeholder primary destinations in release candidates.

## 12. Proposed Phase 1 route-domain model

This is a candidate domain model, not final implementation naming.

### Shared/public
- `/`
- `/services`
- `/services/[slug]`
- `/locations`
- `/locations/[slug]`
- `/professionals/[username-or-id]` candidate public commercial profile
- `/sabiforum` guest-capable candidate
- trust/help/company/legal pages

### Auth/shared
- `/messages`
- `/notifications`
- `/community` / authenticated SabiForum layer
- `/settings`
- `/support`

### Client domain candidate
- `/client/home`
- `/client/jobs`
- `/client/jobs/[id]`
- `/client/bookings`
- `/client/history`
- `/client/profile`

### Professional domain candidate
- `/professional/home`
- `/professional/opportunities`
- `/professional/services`
- `/professional/services/[id]`
- `/professional/proposals`
- `/professional/work`
- `/professional/earnings`
- `/professional/verification`
- `/professional/profile`

Important: Phase 1 must decide whether explicit role-prefixed URLs are worth the clarity/migration cost or whether role-specific route groups can provide the same product separation with cleaner public URLs. Do not implement these candidate paths solely because they are written here.

## 13. KEEP / IMPROVE / REWORK / REPLACE / REMOVE summary

### KEEP
- shared account identity principle
- SabiForum as a cross-role community
- messaging as shared participant-scoped infrastructure
- notification concept
- public service/location discovery concept
- backend-authoritative verification/transaction permissions
- design-system role-specific principles

### IMPROVE
- public acquisition pages
- shared support/settings primitives
- service/location discovery UX
- community relevance/personalisation

### REWORK
- marketplace task separation
- profile domain separation
- messaging contextual panels
- notification hierarchy
- responsive desktop IA
- authenticated/public transition

### REPLACE
- generic AppShell navigation array
- current shared Home hierarchy
- generic 'Market' primary label
- generic role entry experience
- temporary `SW` brand mark

### REMOVE
No major domain should be removed yet. Phase 0 has not proven that a core capability is unnecessary. Remove only duplicate/dead components after dependency evidence.

## 14. Phase 1 inputs now established

Phase 1 must produce:
1. approved route taxonomy;
2. approved Client sitemap;
3. approved Professional sitemap;
4. guest/public sitemap;
5. desktop navigation model;
6. mobile navigation model;
7. auth-to-role transition map;
8. role-specific home content hierarchy;
9. deep-link/return-to-intent rules;
10. migration mapping from current routes;
11. accessibility acceptance criteria;
12. analytics events for navigation/activation.

## 15. Status

Client vs Professional IA audit: **FIRST PASS COMPLETE**.

Further Phase 0 evidence may refine labels/routes, especially after backend dependency, Figma/mobile, analytics and user-research audits. No Phase 1 route implementation should begin until the remaining Phase 0 workstreams are complete.
