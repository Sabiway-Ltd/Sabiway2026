# Phase 12 — SabiForum Social/Community Experience Audit

Status: ACTIVE
Baseline: Phase 11 merged at `971ee7a67194b24b17e2dc4135ea4ec8e984d378`

## Objective

Make SabiForum one coherent social/community product domain across public discovery and authenticated participation without duplicating the existing posts, comments, replies, follows, bookmarks, hashtags, moderation or realtime implementation.

## Current truth

### Route identity is split

- `/sabiforum` is guest-capable but currently only renders a marketing explainer.
- `/community` is authenticated-shared and contains the actual feed/product experience.
- AppShell labels `/community` as `SabiForum`.

This creates two product identities for the same domain.

### Existing social implementation is substantial and should be preserved

Existing stores/components already cover posts, comments, replies, likes, bookmarks, reposts, hashtags, following, people discovery and realtime post events. Phase 12 must improve the product shell and state architecture rather than replace those domain capabilities.

### Auth/session debt remains in the community implementation

`community/page.tsx` and the legacy post store read `localStorage.access` directly. Phase 12 should migrate rendered SabiForum paths toward the shared auth/session boundary instead of introducing more direct credential reads.

### Visual execution diverges from the canonical design system

The current authenticated community page contains extensive hard-coded green, grey, white, red, radius and shadow values despite the canonical SabiWay tokens already existing. Phase 12 should consume shared primitives/tokens and responsive AppShell patterns.

## Canonical Phase 12 direction

1. `/sabiforum` becomes the canonical SabiForum route.
2. Guests can discover a useful read-first SabiForum experience where backend policy permits.
3. Authenticated members see the participatory feed experience on the same canonical route.
4. `/community` remains a compatibility route during migration and should redirect or delegate rather than maintain a second feed implementation.
5. Client and Professional identities share SabiForum as a domain; role-specific marketplace state must not distort community identity.
6. Social engagement is supporting ecosystem value, not the marketplace North Star.

## Required experience states

- guest discovery
- authenticated feed
- loading / refreshing / loading-more
- genuine empty feed
- search results / no search results
- backend unavailable / retry
- create-post success/error
- realtime connected/degraded
- moderation/reporting context
- bookmarks/saved state

## Preserve

- existing posts/comments/replies/follows/bookmarks/repost/hashtag models and APIs where sound
- participant identity and moderation authority
- realtime event transport where sound
- existing post and profile components where they meet accessibility/design requirements
- guest-capable post/profile/hashtag routes already classified by access policy

## Rework

- canonical route identity
- SabiForum page shell and hierarchy
- auth/session token access in rendered community path
- visual token usage
- feed/search/create state clarity
- responsive layout
- accessibility semantics and live regions
- realtime degraded-state handling

## Remove / retire only with evidence

- duplicate `/community` product implementation after canonical `/sabiforum` migration
- direct auth token reads from rendered SabiForum surface
- hard-coded brand styling that duplicates canonical tokens
- ambiguous `Community` product naming where the user-facing feature is SabiForum

## Phase 12 acceptance gate

### Route/product identity
- AppShell SabiForum navigation points to `/sabiforum`.
- `/sabiforum` is the canonical product route.
- `/community` does not maintain a competing feed implementation.

### Guest/member journey
- guest access is not forced to login merely to discover permitted SabiForum content.
- protected create/engagement actions require identity at the moment needed.
- authenticated members can access create/search/feed/realtime functionality.

### Architecture
- rendered SabiForum surface uses shared auth/session state rather than direct `localStorage.access` reads.
- existing social domain APIs/stores are reused rather than duplicated.
- backend moderation/permission authority remains unchanged.

### UX/accessibility
- loading, empty, search-empty, error and retry states are distinguishable.
- focus, labels and interactive controls follow WCAG 2.2 AA primitives.
- layout translates across mobile/tablet/desktop.

### QA
- static Phase 12 contract added to Platform CI.
- protected compatibility route and canonical guest-capable route are browser-tested.
- Phases 1–11 preservation gates remain green.
