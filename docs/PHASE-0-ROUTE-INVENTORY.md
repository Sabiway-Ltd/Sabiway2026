# Phase 0 — Frontend Route & Access Inventory

Status: IN PROGRESS
Source tree audited: `frontend/app` at `main@ed53bf74191ff2e0d7da3e86973624160a5e0c51`
Related audit: `docs/PHASE-0-PRODUCT-AUDIT.md`

## Critical route-access finding

`frontend/middleware.ts` currently uses a small explicit `PUBLIC_ROUTES` whitelist. Any matched route not in that whitelist and without an `access` cookie is redirected to `/login`.

Current explicitly public paths are effectively limited to:

- `/`
- `/login`
- `/signup`
- `/check-email`
- `/confirm-signup`
- `/forgot-password`
- `/terms-of-use`
- `/helpcenter`
- `/privacy-policy`
- `/about-us`
- callback/change-password/confirm-signup route families

This means many routes that are clearly designed as public marketing/discovery surfaces are currently blocked by middleware before their public shell can render.

### Confirmed contradiction examples

The codebase contains public-facing pages/shells for:

- `/services`
- `/services/[slug]`
- `/locations`
- `/locations/[slug]`
- `/for-clients`
- `/for-professionals`
- `/how-it-works`
- `/fees`
- `/sabipay-explained`
- `/trust-and-safety`
- `/verification-info`
- `/partners`
- `/careers`
- `/contact`
- `/download`
- `/sabiforum`
- `/marketplace`

but the current middleware does not whitelist them. For unauthenticated users, these paths are therefore redirected to `/login`.

This is currently the strongest root-cause evidence for the reported “every button takes me to login” problem.

## Provisional route classification

This table records the intended product classification to validate in Phase 1. `Current access` reflects middleware behaviour, not necessarily page-local behaviour.

| Route | Intended experience | Current access without cookie | Phase 0 decision |
|---|---|---:|---|
| `/` | Public homepage | Public | REWORK UX |
| `/login` | Identity entry | Public | REPLACE role experience |
| `/signup` | Identity creation | Public | REWORK/REPLACE role experience |
| `/forgot-password` | Public auth support | Public | IMPROVE |
| `/check-email` | Public auth support | Public | IMPROVE |
| `/confirm-signup*` | Public auth support | Public | IMPROVE |
| `/change-password/[token]` | Public token flow | Public | IMPROVE |
| `/about-us` | Public company | Public | AUDIT |
| `/helpcenter` | Public support | Public | AUDIT |
| `/privacy-policy` | Public legal | Public | KEEP/AUDIT |
| `/terms-of-use` | Public legal | Public | KEEP/AUDIT |
| `/services` | Public discovery | Redirected to login | FIX IA/access |
| `/services/[slug]` | Public category/service discovery | Redirected to login | FIX IA/access |
| `/locations` | Public discovery | Redirected to login | FIX IA/access |
| `/locations/[slug]` | Public location discovery | Redirected to login | FIX IA/access |
| `/marketplace` | Guest-capable discovery + authenticated enhancement | Redirected to login despite PublicShell fallback code | REWORK architecture |
| `/for-clients` | Public acquisition | Redirected to login | FIX IA/access |
| `/for-professionals` | Public acquisition | Redirected to login | FIX IA/access |
| `/how-it-works` | Public education | Redirected to login | FIX IA/access |
| `/fees` | Public trust/commercial info | Redirected to login | FIX IA/access |
| `/sabipay-explained` | Public trust/payment education | Redirected to login | FIX IA/access |
| `/trust-and-safety` | Public trust | Redirected to login | FIX IA/access |
| `/verification-info` | Public trust/verification info | Redirected to login | FIX IA/access |
| `/partners` | Public company/growth | Redirected to login | FIX IA/access |
| `/careers` | Public company | Redirected to login | FIX IA/access |
| `/contact` | Public support/company | Redirected to login | FIX IA/access |
| `/download` | Public acquisition | Redirected to login | FIX IA/access |
| `/sabiforum` | Likely public/guest discovery | Redirected to login | REWORK access policy |
| `/community` | Authenticated social product | Redirected to login | PROTECTED — role policy audit |
| `/community/moderation` | Staff/moderator only | Redirected to login, but deeper role enforcement must be audited | RED access audit |
| `/hashtag/[tag]` | Candidate guest-capable/public discovery | Redirected to login | PRODUCT POLICY DECISION |
| `/posts/[id]` | Candidate guest-capable/public post detail | Redirected to login | PRODUCT POLICY DECISION |
| `/home` | Authenticated role home | Redirected to login | REPLACE role hierarchy |
| `/messages` | Authenticated participants | Redirected to login | KEEP protected; audit role/data |
| `/notifications` | Authenticated user | Redirected to login | KEEP protected; audit state |
| `/profile` | Authenticated own profile | Redirected to login | KEEP protected; rework UX |
| `/profile/[username]` | Candidate public/guest profile vs protected social profile | Redirected to login | PRODUCT POLICY DECISION |
| `/verification` | Professional/authenticated | Redirected to login | KEEP protected; add role enforcement evidence |
| `/sabipay` | Authenticated transaction experience | Redirected to login | KEEP protected; RED audit |

## Architecture defects identified from route inventory

### R0-001 — Middleware access policy conflicts with public IA
Severity: P1

A large set of pages designed as public are blocked globally by middleware.

### R0-002 — Page shell fallback cannot override middleware
Severity: P1

`MarketplaceShell` contains logic to show `PublicShell` when there is no local `access` value, but middleware redirects unauthenticated requests before that client logic can become useful. This creates duplicated and contradictory access logic.

### R0-003 — Route policy is distributed across middleware, shells and local storage
Severity: P1

Access/presentation decisions currently exist in at least:
- Next.js middleware cookie check;
- `AppShell` hydration/localStorage redirect;
- `MarketplaceShell` localStorage shell selection;
- role-specific component conditions.

Phase 1 must centralise the contract and clearly distinguish authentication authority from UI presentation.

### R0-004 — Protected does not yet mean role-authorised
Severity: RED/P1

Middleware only tests existence of an `access` cookie. It does not establish whether a route is Client-only, Professional-only, staff-only or transaction-participant-only. Real server-side/backend permission checks may protect APIs, but the web IA must still provide correct route-level experience and denial states.

### R0-005 — Public social/profile strategy is undefined
Severity: P2 product policy

Routes such as `/sabiforum`, `/posts/[id]`, `/hashtag/[tag]` and `/profile/[username]` need an explicit decision on what guests can see versus what requires login. This affects growth, SEO, privacy, moderation and conversion.

## Route families discovered in current frontend tree

### Authentication/account support
- `/login`
- `/signup`
- `/forgot-password`
- `/check-email`
- `/confirm-signup`
- `/confirm-signup/[token]`
- `/callback`
- `/change-password/[token]`

### Public marketing/information
- `/`
- `/about-us`
- `/accessibility`
- `/careers`
- `/contact`
- `/download`
- `/fees`
- `/for-clients`
- `/for-professionals`
- `/helpcenter`
- `/how-it-works`
- `/locations`
- `/locations/[slug]`
- `/partners`
- `/privacy-policy`
- `/sabipay-explained`
- `/services`
- `/services/[slug]`
- `/terms-of-use`
- `/trust-and-safety`
- `/verification-info`

### Marketplace/product
- `/marketplace`
- `/home`
- `/messages`
- `/notifications`
- `/profile`
- `/profile/[username]`
- `/verification`
- `/sabipay`

### Community/social
- `/community`
- `/community/moderation`
- `/sabiforum`
- `/hashtag/[tag]`
- `/posts/[id]`

## Phase 1 required route taxonomy

Every route must be assigned exactly one top-level access class:

1. **PUBLIC** — no identity required.
2. **GUEST_CAPABLE** — useful public view; authentication required only for protected actions.
3. **AUTHENTICATED_SHARED** — any valid Client/Professional account, subject to object permissions.
4. **CLIENT_ONLY** — Client role required.
5. **PROFESSIONAL_ONLY** — Professional role required.
6. **STAFF_ONLY** — operational backend-authorised role required.
7. **TRANSACTION/PARTICIPANT_SCOPED** — authenticated plus object-level participant permission.

The visual shell must not determine access class.

## Next route-audit tasks

- inspect every high-value CTA on `/`, `PublicShell`, `/for-clients`, `/for-professionals`, `/services`, `/locations`;
- inspect route-level loading/error/not-found behaviour;
- inspect `community/layout.tsx` and public social decisions;
- inspect profile visibility logic;
- inspect middleware return-to-intent behaviour (currently redirect loses original `next` intent);
- inspect cookie/localStorage mismatch and logout/session expiry;
- build Client and Professional target route maps.
