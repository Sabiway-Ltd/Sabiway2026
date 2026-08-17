# Phase 1 — Shared Technical Foundation & Design System

Status: **IN PROGRESS**

Controlling objective: create the stable technical and visual foundations required for all later SabiWay V2 phases across Web + Android + iOS + shared backend, while improving the existing system rather than creating duplicate foundations.

## Pre-check decisions

| Surface | Existing state | V2 gap | Decision | Phase 1 action |
|---|---|---|---|---|
| Django backend | Shared DRF/JWT backend and health endpoint already exist | APIs are unversioned; response/error/pagination conventions are not centralised | **IMPROVE** | Add backwards-compatible `/api/v1/*` aliases and shared V2 API helpers without breaking legacy clients |
| Web styling | Tailwind 4 semantic variables, Inter and dark mode already exist | Web/mobile token definitions drift; hard-coded component colours remain | **REFACTOR / MERGE** | One canonical token source with generated web/mobile adapters; migrate existing components incrementally |
| Web components | Existing `app/_components/common`, `feed`, `profile` and `v2` systems exist | Accessibility and token consistency vary | **IMPROVE / MERGE** | Reuse existing component system; do not create a second UI library |
| Web loading/toasts | Root loading state and react-hot-toast already exist | Loading state lacks status text; toast colours are hard-coded | **IMPROVE** | Accessible loading state and semantic-token toast styling |
| Web errors | No root `app/error.tsx` | Missing route-level recovery state | **ADD** | Add route error boundary with safe retry language |
| Mobile navigation | Current authenticated shell switches sections with local state | Navigation is temporary, top-positioned and not deep-link aware | **REFACTOR** | Preserve current capability modules; add accessible bottom shell and `sabiway://` deep-link mapping |
| Mobile safe areas | Root `SafeAreaView` exists | Shared keyboard/screen behaviour is inconsistent | **IMPROVE** | Keep outer safe area and add reusable keyboard-aware screen scaffold |
| Mobile errors | No app-level render error boundary | No shared recovery UI | **ADD** | Add app error boundary |
| Mobile deep links | Expo `scheme: sabiway` already exists | No in-app section resolver | **IMPROVE** | Resolve community/marketplace/messages/SabiPay/verification links in the existing shell |
| Android/iOS config | Package/bundle identifiers and iOS tablet support already exist | Real-device validation remains later work | **KEEP / VALIDATE** | Retain config; validate through Phase 1 CI and later device testing |
| Design system | Separate web/mobile token files exist | Duplicate source and Figma accent mismatch (`#00A896` used where approved design uses orange) | **MERGE / REFACTOR** | Canonical `design-system/tokens.json`, generator and CI drift check |

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
- Strong green: `#006B42` for stronger/interactive semantic use
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

## Backend API convention

Existing `/api/*` routes remain operational during migration. New V2-capability work should target `/api/v1/*`. Both currently resolve to the same business implementations so there is no duplicate backend.

`Backend/sabiway/api.py` establishes the V2 convention:
- success envelope: `{ "data": ..., "meta": ...? }`
- error envelope: `{ "error": { "code": ..., "message": ..., "details": ...? } }`
- canonical page-number pagination with page/page-size/count/pages/next/previous metadata
- opt-in DRF exception envelope during migration

The exception handler and pagination class are deliberately **not enabled globally yet** because silently changing every legacy response would risk breaking existing web/mobile consumers. Each capability will migrate and test the standard as it is touched.

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

## Mobile foundation rules

- Keep the existing Expo/React Native application and capability modules.
- Outer app safe area remains authoritative; nested screens should not stack competing safe-area padding.
- Use the shared keyboard-aware screen scaffold for new/refactored form screens.
- Bottom navigation controls must expose tab semantics and a minimum 44px target.
- Deep links use the existing `sabiway` scheme and resolve only authorised destinations.
- Verification remains professional-only at the shell as well as server-side.
- App-level errors must provide a recoverable state without implying a failed submission was safely retried.

## Phase 1 remaining work

- [x] Audit current backend/web/mobile/design foundations.
- [x] Establish canonical cross-platform token source.
- [x] Add token generator and CI drift protection.
- [x] Align web semantic CSS to tokens and improve focus/reduced-motion baseline.
- [x] Improve the existing shared web Button instead of creating a duplicate component library.
- [x] Improve root web loading/toast/error states.
- [x] Add backwards-compatible `/api/v1/*` routes and shared API convention utilities.
- [x] Add mobile app error boundary and keyboard-aware screen primitive.
- [x] Improve mobile authenticated shell with accessible bottom navigation and deep links.
- [ ] Run CI and fix all regressions.
- [ ] Audit remaining high-use existing common components for Phase 1 token/accessibility blockers.
- [ ] Document responsive web-translation patterns for the exported core mobile patterns.
- [ ] Complete Phase 1 success gate and Product Owner acceptance.

## Phase 1 exit criteria

Phase 1 can be certified only when:
- shared design system is coherent and CI-enforced;
- accessibility baseline passes for shared primitives;
- responsive behaviour is documented;
- web shell/loading/error/toast foundations work;
- Android/iOS shell compiles with navigation/safe-area/keyboard/error/deep-link foundations;
- shared API conventions are established without breaking legacy consumers;
- no unnecessary duplicate component system has been introduced;
- regression CI is green.
