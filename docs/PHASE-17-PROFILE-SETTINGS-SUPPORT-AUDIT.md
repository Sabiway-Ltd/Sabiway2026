# Phase 17 — Profile, Settings, Support & Account Management Audit

## Objective
Create a clear account-management architecture without duplicating public Professional storefronts, SabiForum social surfaces, authentication security or backend account authority.

## Current findings

### Authenticated profile
`/profile` is still a legacy community-era surface. It uses `CommunityNavbar`, hard-coded brand colours and a large `MyProfile` component that mixes:
- public identity fields;
- private phone/location fields;
- profile image editing;
- posts and bookmarks;
- followers/following;
- logout;
- social recommendations.

That is too many product responsibilities for one account screen.

### Public profile
Public Professional storefronts were rebuilt in Phase 10 and must remain the marketplace-facing trust/service surface. Phase 17 must not duplicate that storefront.

### Social identity
SabiForum owns posts, bookmarks and following relationships after Phase 12. Phase 17 should link to those surfaces rather than retain a second social dashboard inside account management.

### Settings
There is no canonical `/settings` account workspace. Private account controls are scattered across profile/auth surfaces.

### Support
Public help/contact/accessibility/trust pages exist, but authenticated users do not have a coherent support entry from account management.

## Target ownership

### `/profile`
Authenticated identity summary and public-profile readiness:
- avatar/name/bio/professional headline;
- public location summary where appropriate;
- trust/reputation summary from backend evidence;
- links to public profile and role-specific service management;
- profile editing for fields that legitimately belong to Profile.

### `/settings`
Private account configuration:
- account identity/contact summary;
- security/password entry;
- privacy/legal/support links;
- sign out;
- future notification/localisation preferences when backend authority exists.

Do not invent unsupported preference persistence.

### Support
Use existing public `/helpcenter`, `/contact`, `/accessibility`, `/privacy-policy`, `/terms-of-use`, and `/trust-and-safety` destinations. Account UI should provide coherent entry points rather than duplicate static content.

### SabiForum
Posts, bookmarks, following/followers and community discovery remain SabiForum/social concerns.

## Preservation rules
- preserve Phase 10 public Professional storefronts;
- preserve backend privacy filtering and profile ownership;
- preserve Phase 14 verification/reputation authority;
- preserve shared AppShell/session/API architecture;
- do not expose private phone/street data publicly;
- do not add destructive account deletion until a governed backend deletion/deactivation contract exists;
- do not present UI-only toggles as persisted settings.

## Phase 17 implementation sequence
1. Move authenticated `/profile` onto AppShell and semantic design primitives.
2. Replace the community-era profile composition with a focused account identity workspace.
3. Add canonical `/settings` for private account/security/support navigation using existing backend/auth capabilities only.
4. Add Settings to desktop account navigation while keeping mobile primary navigation focused.
5. Preserve role-aware Professional service/verification links and Client discovery/job links.
6. Add required Phase 17 repository/browser contracts.
7. Exact-head Platform CI → PR → merge only after Release Gate is green.
