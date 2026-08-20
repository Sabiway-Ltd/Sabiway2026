# Phase 0 — Design System, Figma & Implementation Divergence Audit

Status: IN PROGRESS
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
Related audits:
- `docs/PHASE-0-PRODUCT-AUDIT.md`
- `docs/PHASE-0-ROLE-IA-AUDIT.md`
- `docs/PHASE-0-ROUTE-INVENTORY.md`

## 1. Objective

Establish where current SabiWay web implementation aligns with or diverges from:

1. the canonical shared design tokens;
2. `docs/DESIGN-SYSTEM.md`;
3. exported Figma/mobile evidence under `Documentation/`;
4. current responsive/accessibility guidance;
5. role-specific Client and Professional product hierarchy.

This audit does not assume the Figma export is automatically correct. Figma is evidence and intent. Product, UX, accessibility and engineering requirements determine the final implementation.

## 2. Strong foundations to preserve

### D0-001 — Canonical design tokens exist
Decision: KEEP + enforce

`frontend/app/design/tokens.css` is generated from the shared design system and already defines:
- background/surface/text/border colours;
- primary/accent/status colours;
- spacing scale;
- radius scale;
- shadow scale;
- 44px touch target;
- focus ring width;
- dark-mode equivalents.

This is a strong foundation and should become the default source for new UI instead of ad-hoc values.

### D0-002 — Global accessibility primitives already exist
Decision: KEEP + extend

`globals.css` already includes:
- visible `:focus-visible` outline;
- 44px-class minimum control height through the token;
- reduced-motion handling;
- semantic Tailwind theme mapping;
- minimum 320px body width.

These should be retained while Phase 18 adds runtime accessibility certification.

### D0-003 — Existing design documentation correctly requires role-specific product hierarchy
Decision: KEEP

Current design rules explicitly state Client and Professional should not be forced into identical home/navigation hierarchy.

The Figma export matrix reinforces this with:
- Client: My Jobs / Community / Home / History / Profile;
- Professional: My Jobs / Community / Home / Earning / Profile;
- messages/notifications as contextual destinations rather than permanent bottom tabs.

The implementation currently diverges from this.

## 3. Confirmed divergences

### D0-004 — Shared `AppShell` ignores role-specific navigation
Severity: P1
Decision: REPLACE IA implementation

Current web/mobile navigation is hard-coded to:
- Home
- Market
- Messages
- SabiForum
- Profile

for both roles.

This conflicts with both the design-system document and Figma evidence.

Required outcome:
- role-aware application navigation;
- distinct Client and Professional primary tasks;
- messages/notifications remain easy to reach without consuming the same permanent navigation slots where not appropriate;
- desktop translation can use side/top navigation while preserving task hierarchy.

### D0-005 — Temporary `SW` brand mark violates current design rules
Severity: P2 visual/brand
Decision: REPLACE

`AppShell` displays a generated `SW` square mark while current design rules explicitly require official SabiWay logo assets when available.

Required outcome:
- official brand asset in final application shells;
- compact logo variant if needed for constrained navigation;
- no improvised initials in production surfaces.

### D0-006 — Hard-coded visual values bypass the token system
Severity: P1 design-system maintainability
Decision: REWORK

Recent public/auth/marketing surfaces repeatedly use values such as:
- `#008753`
- `#173126`
- `#f4f5f4`
- `#f6faf8`
- `#073522`
- custom borders/shadows/radii

directly in component classes even though semantic tokens exist.

Impact:
- visual drift;
- dark mode inconsistency;
- slower global redesign;
- difficult accessibility contrast maintenance;
- duplicated values and styling logic.

Required Phase 2 outcome:
- semantic token usage for standard brand/surface/status values;
- hard-coded values permitted only where a deliberate exceptional token/illustrative treatment is documented;
- lint/audit approach for common raw brand values where practical.

### D0-007 — Figma matrix claims implementation completion beyond verified runtime evidence
Severity: P2 governance
Decision: REWORD/REFRESH

`Documentation/FIGMA-EXPORT-SCREEN-MATRIX.md` says exported screen families and web translation were implemented, while also correctly withholding runtime certification.

Current source inspection shows important role/navigation/public-route divergences still exist.

Required outcome:
- distinguish `implemented in source`, `aligned to intended hierarchy`, `runtime verified`, and `production accepted`;
- Phase 0 should not treat historical “completed” labels as current truth.

### D0-008 — Auth implementation does not fully match role-selection intent
Severity: P1 UX
Decision: REPLACE experience

Figma evidence includes role selection and low-chrome authentication. Current signup technically presents large role cards, but Professional acquisition still lands in a generic signup state that defaults to Client.

The design intent therefore exists visually but is not preserved through funnel state.

Required outcome:
- role intent begins before form completion;
- role-specific content and onboarding;
- deep link/query state preserved;
- shared identity system remains technically possible.

### D0-009 — Current Home visually reuses generic cards instead of role-specific product objects/status
Severity: P1 product/design
Decision: REPLACE hierarchy

Current authenticated Home uses a hero, three quick-action cards and two generic informational cards.

The design rules explicitly warn against using endless `icon + heading + paragraph` cards when a more product-specific composition is available.

Required outcome:
Client Home should expose real objects/status such as:
- search/recommendation;
- active job cards;
- active conversations;
- upcoming bookings;
- payment/status/history;
- trusted/recommended Professionals.

Professional Home should expose:
- opportunity/job cards;
- leads requiring action;
- service health/profile completion;
- upcoming work;
- earnings/payout state;
- verification/reputation signals.

### D0-010 — Desktop translation needs product-specific layouts, not generic responsive stacking
Severity: P1 UX
Decision: REWORK by domain

The design rules already permit and encourage:
- persistent marketplace filters;
- multi-column results;
- split-pane/three-pane messaging;
- contextual side rails;
- wider reputation/payment workspaces.

Every rebuilt domain must explicitly define mobile/tablet/desktop task hierarchy rather than only adding Tailwind breakpoints to one generic layout.

### D0-011 — Visual language overuses large rounded cards/containers
Severity: P2 UI
Decision: IMPROVE

The current public/auth/Home family frequently places most concepts in rounded cards or rounded hero boxes.

Rounded surfaces are part of SabiWay's visual language, but excessive use weakens hierarchy and makes unrelated information look equally important.

Required outcome:
- cards represent objects, decisions or grouped state;
- editorial/marketing copy can use open layouts;
- tables/lists/rows/rails/panes used when structurally more appropriate;
- stronger density variation between consumer discovery and professional workspace surfaces.

## 4. Target design-system architecture for Phase 2

### Foundation tokens
Keep canonical:
- colour
- type
- spacing
- radius
- elevation
- focus
- motion
- breakpoints/touch targets

Add/confirm semantic layers:
- interactive primary/secondary/tertiary/destructive;
- surface canvas/elevated/subtle/selected;
- content primary/secondary/inverse/link;
- status success/warning/error/info/pending;
- trust/verification/payment semantics where needed.

### Shared primitives
Build/standardise:
- Button
- LinkButton
- IconButton
- Input
- Select/Combobox
- Textarea
- Checkbox/Radio
- FormField + inline validation
- SearchField
- Tabs
- Badge/Status
- Avatar
- Dialog/Sheet
- Toast/InlineAlert
- EmptyState
- ErrorState
- Skeleton
- Pagination/Infinite state

### Marketplace/product objects
Do not reduce domain UI to generic Card.
Create product-level patterns for:
- ProfessionalSummary
- ServiceListing
- JobCard
- ProposalCard
- BookingStatus
- TransactionStatus
- VerificationStatus
- ConversationRow
- NotificationRow
- ReviewSummary
- OpportunityListItem

### Layout systems
Define:
- PublicShell
- AuthShell
- ClientAppShell
- ProfessionalAppShell
- shared contextual/detail workspace layout
- mobile bottom-nav patterns
- desktop side/top navigation patterns

## 5. Figma decision framework

For every screen family:

`Figma/export -> current mobile -> current web -> user need -> accessibility -> technical constraint -> decision`

Allowed decisions:
- KEEP
- IMPROVE
- REWORK
- REPLACE
- REMOVE

Do not implement a Figma pattern solely because it exists.

## 6. Initial divergence matrix

| Surface | Figma/design intent | Current web state | Decision |
|---|---|---|---|
| Public homepage | marketplace-first, role-aware | strong branding but over-explains product architecture | REWORK |
| Client home | discovery/status/action oriented | shared generic Home | REPLACE hierarchy |
| Professional home | opportunity/earnings/trust oriented | shared generic Home | REPLACE hierarchy |
| Mobile Client nav | jobs/community/home/history/profile | home/market/messages/community/profile | REPLACE |
| Mobile Professional nav | jobs/community/home/earnings/profile | same generic nav as Client | REPLACE |
| Desktop application nav | role-specific translation | same shared sidebar | REPLACE IA |
| Auth | low chrome + role selection | visually close in places; funnel intent lost | REWORK/REPLACE journey |
| Marketplace | strong search/category/filter hierarchy | substantial implementation exists; route/backend state blocks review | KEEP structure + REWORK states/access |
| Messaging | list/detail/context workspace | substantial implementation exists | AUDIT/IMPROVE |
| Community | feed/composer/social context | substantial legacy implementation exists | AUDIT/REWORK integration |
| Verification | status/evidence/trust | substantial implementation exists | KEEP domain + audit role/states |
| SabiPay | status/amount/fee-first | substantial implementation exists | KEEP domain + RED UX/security audit |
| Tokens | shared semantic foundation | available but bypassed by many components | KEEP + ENFORCE |
| Logo | official asset | AppShell uses `SW` placeholder | REPLACE |

## 7. Phase 2 acceptance inputs generated by this audit

Phase 2 must not be considered complete until:

1. semantic tokens are the normal implementation path;
2. Client and Professional navigation primitives are distinct;
3. official brand assets replace temporary application marks;
4. core controls have one accessible shared implementation where practical;
5. product-object patterns exist for marketplace/job/booking/payment/trust states;
6. mobile, tablet and desktop layout patterns are documented;
7. default/loading/empty/error/success/permission states are included;
8. reduced motion, keyboard focus and 44px-class target rules remain intact;
9. hard-coded brand values are materially reduced and deliberate exceptions documented;
10. historical Figma “implemented” claims are revalidated against runtime evidence.

## 8. Next Phase 0 audit block

Proceed to:
- responsive behaviour audit;
- accessibility source audit;
- content/UX writing audit;
- QA/test automation gap audit;
- security/privacy gap audit;
- analytics/growth audit;
- consolidated defect register and Phase 1 gate.
