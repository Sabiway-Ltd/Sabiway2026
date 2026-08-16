# Phase 0 — System, API & Domain Inventory

This inventory is the starting point for every later KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE decision.

## Repository surfaces

| Area | Current implementation | Phase 0 decision |
|---|---|---|
| Web client | `frontend/` — Next.js, React, TypeScript | KEEP; audit by capability |
| Mobile client | `mobile/` — Expo, React Native, TypeScript | KEEP; audit by capability |
| Core API | `Backend/` — Django, DRF, JWT | KEEP as business authority |
| Realtime | `ExpressJs/` — Express, Socket.IO | KEEP provisionally; transport only |
| Waitlist | `WaitList/` | KEEP isolated unless explicit integration is approved |
| Documentation | `Documentation/` | KEEP and make phase-gated |
| CI/governance | `.github/` | KEEP/IMPROVE |

## Backend domain/API map

The shared Django URL configuration currently exposes:

- `/api/health/` — service health
- `/api/auth/` — identity/authentication
- `/api/profiles/` — profile domain
- `/api/posts/` — community/content
- `/api/search/` — shared search
- `/api/notifications/` — persisted notifications
- `/api/marketplace/` — marketplace/services
- `/api/verification/` — trust/verification
- `/api/sabipay/` — payments/transaction safety
- `/admin/` — administrative control
- `/docs/` — API/documentation surface

Known Django domain applications on current `main` include accounts, profiles, posts, search, notifications, marketplace, verification, SabiPay and health/supporting configuration.

## Domain ownership decisions

| Capability | Existing owner | Phase 0 classification |
|---|---|---|
| Account/auth | Django `accounts` | KEEP |
| Profile | Django `profiles` | KEEP; role-authority duplication must be eliminated if still present |
| Community | Django `posts` + web/mobile clients | KEEP |
| Search | Django `search` | KEEP; do not create separate client search engines |
| Notifications | Django persistence + Socket.IO delivery | KEEP/IMPROVE |
| Marketplace | Django `marketplace` | KEEP/IMPROVE |
| Verification | Django `verification` | KEEP/IMPROVE |
| Payments | Django `sabipay` | KEEP/IMPROVE |
| Realtime transport | Express/Socket.IO | KEEP provisionally; re-evaluate in Phase 6 |
| Admin | Django/staff | KEEP as shared authority |

## Duplication warnings carried into later phases

1. Role information must have one authoritative source.
2. Realtime events must not become a second persistence/business-state layer.
3. Web and mobile must consume shared backend contracts rather than re-implement business rules locally.
4. Search must remain one backend capability even when clients present different UX.
5. Marketplace transaction/payment status must not be recomputed independently in clients.
6. Moderation/support decisions must converge on the shared admin/audit model.

## Database/domain audit boundary

Phase 0 establishes the domain ownership map and identifies likely duplication risks. Detailed model-by-model field/state-machine validation is performed in the phase that owns the domain, but no new model/table may be introduced before searching the current domain for an equivalent capability.
