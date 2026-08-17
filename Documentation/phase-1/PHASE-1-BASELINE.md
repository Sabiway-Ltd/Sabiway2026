# Phase 1 — Shared Technical Foundation & Design System

Status: **CERTIFIED**

Controlling objective: create the stable technical and visual foundations required for all later SabiWay V2 phases across Web + Android + iOS + shared backend, while improving the existing system rather than creating duplicate foundations.

## Pre-check decisions

| Surface | Existing state | V2 gap | Decision | Phase 1 action |
|---|---|---|---|---|
| Django backend | Shared DRF/JWT backend and health endpoint already exist | APIs were unversioned; response/error/pagination conventions were not centralised | **IMPROVE** | Added backwards-compatible `/api/v1/*` aliases and shared V2 API helpers without breaking legacy clients |
| Web styling | Tailwind 4 semantic variables, Inter and dark mode already existed | Web/mobile token definitions drifted; hard-coded component colours existed | **REFACTOR / MERGE** | One canonical token source with generated web/mobile adapters; existing components migrate incrementally |
| Web components | Existing `app/_components/common`, `feed`, `profile` and `v2` systems exist | Accessibility and token consistency varied; some core primitives were missing | **IMPROVE / MERGE** | Reused existing system, improved Button/dialog/shell, and added missing primitives inside the same common system |
| Web loading/toasts | Root loading state and react-hot-toast already existed | Loading lacked status text; toast colours were hard-coded | **IMPROVE** | Accessible loading state and semantic-token toast styling |
| Web errors | No root `app/error.tsx` | Missing route-level recovery state | **ADD** | Added route error boundary with safe retry language |
| Mobile navigation | Authenticated shell switched sections with local state | Navigation was temporary, top-positioned and not deep-link aware | **REFACTOR** | Preserved capability modules; added accessible bottom shell and `sabiway://` deep-link mapping |
| Mobile safe areas | Root `SafeAreaView` existed | Shared keyboard/screen behaviour was inconsistent | **IMPROVE** | Kept outer safe area and added reusable keyboard-aware screen scaffold |
| Mobile errors | No app-level render error boundary | No shared recovery UI | **ADD** | Added app error boundary |
| Mobile deep links | Expo `scheme: sabiway` already existed | No in-app section resolver | **IMPROVE** | Added community/marketplace/messages/SabiPay/verification link resolution with role guard |
| Android/iOS config | Package/bundle identifiers and iOS tablet support already existed | Real-device certification belongs to later release gates | **KEEP / VALIDATE** | Retained current platform configuration; both mobile TypeScript checks pass |
| Design system | Separate web/mobile token files existed | Duplicate source and UI accent drift | **MERGE / REFACTOR** | Canonical `design-system/tokens.json`, generator and CI drift check |

## Canonical design-system decisions

### Source hierarchy
1. Master Playbook
2. Product Owner clarification
3. SabiWay V2 BRD
4. Approved `Ui Mobile App Design` / supplied app export
5. SabiWay branding package
6. Current implementation as reuse evidence

### Brand primitives
- Primary green: `#008753`
- Strong green: `#006B42`
- Approved UI accent: `#FFB800`
- White: `#FFFFFF`
- Neutral dark foundation: `#333333`
- Inter is the product typeface

Orange is an accent/warning colour and uses a dark foreground. It must not be paired with white normal-size text.

### Canonical source of truth
`design-system/tokens.json` is authoritative for implementation tokens. `scripts/sync-design-tokens.mjs` generates/checks:
- `frontend/app/design/tokens.ts`
- `frontend/app/design/tokens.css`
- `mobile/src/design/tokens.ts`

CI rejects token drift. Existing mobile aliases (`brand`, `brandStrong`, `muted`) are temporarily retained so current screens can migrate safely instead of being broken by a big-bang rename.

## Shared component foundation

The existing component system was audited rather than replaced. The following foundation now exists:

### Web
- existing shared `Button` improved for semantic variants, disabled state, visible focus, reduced motion and ref-safe dialog focus;
- existing destructive confirmation dialog improved with alert-dialog semantics, initial focus, Escape handling and semantic tokens;
- existing V2 public shell migrated to semantic tokens and minimum interaction targets;
- missing shared `Field`, `Surface`, `StatusBadge`, `StatePanel`, `Avatar` and `Skeleton` primitives added under the existing common component location;
- component behaviour/accessibility standards documented for buttons, inputs, cards, avatars, badges, tabs, modals, bottom sheets, toasts, alerts, skeletons and empty/error states.

### Mobile
- shared `SabiButton`, `SabiField`, `SabiCard`, `StatusBadge`, `StatePanel`, `Avatar`, `SkeletonBlock` and `SegmentedTabs` primitives;
- shared accessible `BottomSheet`;
- shared keyboard-aware `ScreenScaffold`;
- app-level error boundary.

No second UI library or parallel component system was introduced.

## Backend API convention

Existing `/api/*` routes remain operational during migration. New V2-capability work should target `/api/v1/*`. Both currently resolve to the same business implementations so there is no duplicate backend.

`Backend/sabiway/api.py` establishes the V2 convention:
- success envelope: `{ "data": ..., "meta": ...? }`
- error envelope: `{ "error": { "code": ..., "message": ..., "details": ...? } }`
- canonical page-number pagination with page/page-size/count/pages/next/previous metadata
- opt-in DRF exception envelope during migration

The exception handler and pagination class are deliberately **not enabled globally yet** because silently changing every legacy response would risk breaking existing web/mobile consumers. Each capability will migrate and test the standard as it is touched.

Regression coverage verifies both legacy `/api/health/` and additive `/api/v1/health/` routes and the standard success/error envelopes.

## Web foundation rules

- Reuse existing Next.js App Router structure.
- Reuse existing common/v2 components; improve rather than duplicate.
- Semantic CSS tokens are the only approved source for new colours.
- Visible keyboard focus is mandatory; global removal of focus outlines is prohibited.
- Interactive controls target at least 44px height where applicable.
- Reduced-motion preference disables non-essential shared animations.
- Root loading, error and toast systems must remain accessible.
- V2 web layouts must be native responsive web layouts, not stretched mobile frames.

Responsive certification widths remain: 320, 360, 375, 390, 430, 768, 1024, 1280, 1366, 1440+.

`WEB-TRANSLATION-RESPONSIVE-RULES.md` defines platform-specific translation for discovery, professional opportunities/profile, job posting/status, messaging, SabiForum, SabiPay, payment history/receipts, reviews and auth/onboarding.

## Mobile foundation rules

- Keep the existing Expo/React Native application and capability modules.
- Outer app safe area remains authoritative; nested screens should not stack competing safe-area padding.
- Use the shared keyboard-aware screen scaffold for new/refactored form screens.
- Bottom navigation controls expose tab semantics and a minimum 44px target.
- Deep links use the existing `sabiway` scheme and resolve only authorised destinations.
- Verification remains professional-only at the shell as well as server-side.
- App-level errors provide a recoverable state without implying a failed submission was safely retried.

## Phase 1 completion evidence

- [x] Current backend/web/mobile/design foundations audited before implementation.
- [x] Canonical cross-platform token source established.
- [x] Token generator and CI drift protection added.
- [x] Web semantic CSS aligned and focus/reduced-motion baseline improved.
- [x] Existing shared web Button improved rather than duplicated.
- [x] Existing high-use shared shell/destructive-dialog components audited and improved for Phase 1 blockers.
- [x] Missing design primitives added within the existing shared component system.
- [x] Root web loading/toast/error states improved.
- [x] Backwards-compatible `/api/v1/*` routes and shared API convention utilities added.
- [x] Versioned/legacy API foundation regression tests added.
- [x] Mobile app error boundary and keyboard-aware screen primitive added.
- [x] Mobile authenticated shell improved with accessible bottom navigation and deep links.
- [x] Shared mobile design primitives and bottom sheet added.
- [x] Responsive web-translation patterns documented for exported core mobile patterns.
- [x] Shared component behaviour and accessibility rules documented.
- [x] Platform CI run #135 passed on the implementation head, including design-token drift, backend, frontend, realtime, mobile, hygiene and waitlist checks.
- [x] Product Owner authorised autonomous continuation to the next master-playbook phase.

## Phase 1 success gate

- [x] Shared design system established and CI-enforced.
- [x] Accessibility baseline established for shared primitives and shells.
- [x] Responsive behaviour documented.
- [x] Web shell/loading/error/toast foundations work and compile.
- [x] Android/iOS Expo shell compiles with navigation, safe-area, keyboard, error and deep-link foundations.
- [x] Shared API conventions established without breaking legacy consumers.
- [x] No unnecessary duplicate component system introduced.
- [x] Regression CI green.

## Certification decision

**Phase 1 is CERTIFIED.**

This certification establishes the shared technical/design foundation required for later phases. It does not claim final real-device, full WCAG, security, staging or controlled-user-testing certification; those remain governed by the later Master Playbook gates. Phase 0 governance risks remain tracked in issue #38 and must still be closed before production/user-testing readiness certification.
