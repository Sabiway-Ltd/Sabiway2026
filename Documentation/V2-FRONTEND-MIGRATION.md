# SabiWay V1 → V2 frontend migration

## Objective

Remove the visible V1 shell from the routed SabiWay web experience and make V2 the default product language across public, authenticated and marketplace surfaces without pretending later-phase product capabilities already exist.

## V2 design baseline

The routed experience now uses:
- Inter typography globally
- SabiWay green `#008753`
- SabiWay amber `#FFB800`
- warm white / soft green surfaces
- trust-led rounded cards, responsive navigation and clear client/professional actions
- one public navigation language across marketplace, SabiForum, About, Help and account entry
- one authenticated navigation language across SabiForum, marketplace, notifications, posts and profiles

The available SabiWay Website & Mobile App Design Report is the current visual evidence. Exact frame-by-frame Figma sign-off remains conditional until the actual Figma file URL/key is available.

## Routed web inventory

| Route / surface | V2 migration status | Notes |
| --- | --- | --- |
| `/` | V2 | V1 landing component assembly replaced with marketplace/community-first V2 homepage |
| `/marketplace` | V2 Phase 4 | Services, jobs, location/problem discovery, professional responses and role-aware creation |
| `/community` | V2 | SabiForum modernisation retained with new shared product navigation |
| `/community/moderation` | V2 functional | Phase 3 staff moderation surface retained inside the modernised community system |
| `/login` | V2 | Phase 2 responsive identity journey retained |
| `/signup` | V2 | Phase 2 role-aware registration retained |
| `/forgot-password` | V2 | Phase 2 recovery journey retained |
| `/change-password/[token]` | V2 | Phase 2 recovery completion retained |
| signup confirmation / OAuth callback | V2 functional | Existing modernised identity flow retained |
| `/about-us` | V2 | V1 Navbar/Footer page replaced |
| `/helpcenter` | V2 | V1 support page replaced with product-area help hub |
| `/profile` | V2 shell + existing profile functions | V1 three-column outer layout removed; profile editing/posts/bookmarks/follows preserved |
| `/profile/[username]` | V2 shell + existing public profile functions | V1 sidebars removed; privacy-aware profile behaviour preserved |
| `/notifications` | V2 shell + existing notification functions | V1 three-column outer layout removed |
| `/posts/[id]` | V2 shell + SabiForum discussion | Legacy sidebars removed; post/comment behaviour preserved |
| `/hashtag/[tag]` | V2 shell + SabiForum discovery | Legacy sidebars removed |
| `/privacy-policy` | V2 shell | Legal text preserved unchanged |
| `/terms-of-use` | V2 shell | Legal text preserved unchanged |

## Retired V1 dependency

The old `frontend/app/_components/landing_page/` files may remain in source control temporarily for historical rollback/reference, but routed public pages no longer depend on that V1 assembly. They are not the active product shell.

## Product phases not represented as completed pages

The following are not V1 migration debt; they are approved future V2 delivery phases:
- Phase 5: messaging, negotiation, booking and scheduling
- Phase 6: provider verification
- Phase 7: SabiPay / escrow
- Phase 8: disputes, reviews and post-service operational controls

No placeholder page should be presented as a completed feature for those capabilities.

## Mobile

The React Native/Expo application is a V2 implementation rather than a V1 port. Current mobile surfaces cover:
- identity and recovery
- SabiForum
- marketplace service/job discovery
- client job creation
- professional service creation
- professional job responses

Later mobile transaction surfaces follow the same Phase 5–8 boundaries as web.

## Release evidence

This migration is code-complete only when Platform CI passes frontend TypeScript/lint, mobile TypeScript and the existing backend/realtime gates. Visual sign-off remains conditional on full Figma access and manual device-matrix evidence.
