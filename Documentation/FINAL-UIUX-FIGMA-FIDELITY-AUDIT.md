# SabiWay V2 — Final UI/UX & Figma Fidelity Audit

Status: active correction pass

## Design authority

This audit follows the founder instruction, approved V2 requirements, the Master Cross-Platform Playbook, the SabiWay design report, the current implementation and the available repository design assets.

The design report states that only selected key screens are shown in the PDF and that the complete client, provider and community flows live in the Figma file. The repository and connected Figma account currently do not expose the `Sabiway Project` file key or a node-specific Figma URL. Therefore this pass must not claim pixel-level or screen-level Figma parity until the actual frames are available.

## Product rule

- Preserve one SabiWay product identity across web, Android and iOS.
- Mobile Figma is the visual/product foundation.
- Web must translate the same identity and user logic into desktop/tablet patterns rather than stretching mobile layouts.
- Functional parity does not equal visual parity.
- Every user-facing surface is classified KEEP / IMPROVE / REWORK / REPLACE / REMOVE.

## Current design-system assessment

| Area | Current state | Decision | Required action |
|---|---|---|---|
| Brand green/orange | Matches documented SabiWay direction | KEEP | Continue semantic-token usage |
| Inter typography | Matches design report | KEEP | Keep typography hierarchy consistent |
| Shared spacing/radius/elevation | Present across web/mobile tokens | KEEP | Remove hard-coded values gradually |
| Public logo treatment | Temporary SW block was still visible | REWORK | Restore official SabiWay logo lockup |
| Mobile bottom navigation | Functional but text-led and visually prototype-like | IMPROVE | Add visual destination cues, clearer selected state, preserve 44px+ targets |
| Web responsive shell | Functional and accessible baseline exists | IMPROVE | Refine brand identity and desktop information density |
| Mobile home | Correct role logic, card-heavy presentation | REWORK | Make client discovery more marketplace-led; make professional next actions clearer |
| Empty/loading/error states | Implemented unevenly across feature screens | IMPROVE | Standardise visual treatment and copy |
| Figma exact parity | Not provable without actual Figma frames | BLOCKED | Obtain file key/node URLs and run screen-by-screen comparison |

## Screen-family audit

### 1. Public web / landing
Decision: IMPROVE

Strengths:
- clear value proposition
- responsive layout
- marketplace-first CTA
- SabiForum differentiation
- Nigerian positioning

Gaps:
- official brand lockup was not consistently used
- too many generic rounded-card patterns reduce brand distinctiveness
- several strings still described already-built V2 transaction capabilities as future work
- hard-coded visual values remain alongside semantic tokens

Correction in this pass:
- official SabiWay logo asset restored in public header/footer
- current V2 journey copy corrected
- focus treatment strengthened

### 2. Web marketplace
Decision: IMPROVE

Strengths:
- clear search/location/category entry
- service/job split
- direct create/listing actions
- strong responsive foundation

Gaps:
- high card density
- form and result hierarchy should be checked directly against Figma marketplace frames
- desktop layout can use more split-view/detail-panel behaviour where appropriate
- hard-coded colour usage should migrate to semantic tokens

Figma verification required: YES

### 3. Web community / SabiForum
Decision: IMPROVE

Strengths:
- full functional community exists
- same identity and backend as marketplace

Gaps:
- needs visual comparison against Figma feed, composer, post-detail and moderation states
- desktop information density and side-context should be reviewed

Figma verification required: YES

### 4. Web messaging
Decision: IMPROVE

Strengths:
- real transaction-linked conversations
- responsive workspace

Gaps:
- must verify list/thread proportions, unread hierarchy, attachment treatment, booking context and mobile-web collapse behaviour against Figma

Figma verification required: YES

### 5. Web profile / verification / SabiPay / notifications
Decision: IMPROVE

Strengths:
- complete product journeys exist
- trust and payment states are integrated

Gaps:
- visual state hierarchy is not yet certified against the design source
- status badges, progress states, empty states and action priority require Figma comparison

Figma verification required: YES

### 6. Mobile navigation shell
Decision: IMPROVE

Strengths:
- five primary destinations are correctly prioritised
- touch targets are safe
- secondary destinations are correctly nested under primary areas

Gaps:
- previous navigation was text-only
- active destination lacked enough visual identity
- visual design read as engineering shell rather than finished consumer product

Correction in this pass:
- added icon-like visual destination cues without introducing a new dependency
- reduced selected-state visual weight from a full green block to a more compact indicator
- retained accessible tab semantics

Figma verification required: YES — exact icon set must come from the real Figma file.

### 7. Mobile client home
Decision: REWORK

Strengths:
- role-aware content
- direct marketplace and job actions
- clear SabiWay-wide shortcuts

Gaps:
- discovery was too card-led
- no fast service-category entry on home
- too much vertical repetition

Correction in this pass:
- introduced quick popular-needs entry points
- improved hierarchy between discovery, primary action and secondary product areas
- changed secondary destinations to a denser two-column pattern

Figma verification required: YES

### 8. Mobile professional home
Decision: IMPROVE

Strengths:
- open jobs, messages and verification are prioritised

Next visual priorities after Figma access:
- active bookings
- earnings / payment state
- new enquiries
- review/reputation signal
- service performance
- verification status prominence

Figma verification required: YES

### 9. Mobile marketplace
Decision: IMPROVE

Required Figma comparison:
- discovery/search
- service cards
- job cards
- detail views
- filters
- post-job flow
- offer-service flow
- transaction entry
- empty/loading/error states

### 10. Mobile messaging
Decision: IMPROVE

Required Figma comparison:
- thread list
- conversation header
- attachment actions
- booking summary
- schedule proposal/decision
- blocked/reported states
- offline/reconnect states

### 11. Mobile SabiForum
Decision: IMPROVE

Required Figma comparison:
- feed
- composer
- post detail
- comments/replies
- report flow
- deleted/moderated state
- empty/loading/error state

### 12. Mobile profile / verification
Decision: IMPROVE

Required Figma comparison:
- own profile
- public professional profile
- edit profile
- verified badge/status
- evidence upload
- submitted/in-review/more-info/rejected/approved states

### 13. Mobile SabiPay / disputes
Decision: IMPROVE

Required Figma comparison:
- amount/fee explanation
- payment initiation
- pending/failed/retry
- escrow status
- release/refund/dispute
- receipts/history

## Accessibility review rules

All final screens must maintain:
- minimum 44px touch targets
- visible keyboard focus on web
- sufficient text/background contrast
- readable hierarchy without colour alone
- usable large-font wrapping
- no normal horizontal scrolling
- explicit loading, empty and error states
- understandable recovery copy

## Responsive web translation rules

The final web design must support the documented widths: 320, 360, 375, 390, 430, 768, 1024, 1280, 1366 and 1440+.

Desktop should deliberately use:
- persistent top/secondary navigation
- wider search/filter controls
- split panes where a list/detail workflow benefits
- multi-column cards only where scanability improves
- tables for operational/transaction history where appropriate

Mobile-web should deliberately use:
- single-column content
- stacked actions
- collapsible/filter drawers
- full-width forms
- bottom-safe action spacing

## Figma fidelity gate

Exact visual certification remains BLOCKED until the actual SabiWay Figma file is accessible. Once a file key or node-specific URL is supplied, complete this matrix for every frame:

| Figma frame | Current mobile | Current web | Decision | Fidelity issue | Accessibility issue | Fix |
|---|---|---|---|---|---|---|
| Pending | Pending | Pending | Pending | Pending | Pending | Pending |

Do not label a screen "Figma matched" from the design-report thumbnail alone.

## Current outcome of this pass

Confirmed corrections completed:
1. Public web brand lockup restored using the repository SabiWay logo asset.
2. Homepage product copy updated to reflect messaging, booking, protected payments and support already built in V2.
3. Mobile bottom navigation given stronger visual hierarchy while preserving accessibility.
4. Client mobile home made more discovery-led with popular-needs shortcuts.
5. Secondary mobile home actions compressed into a more useful two-column pattern.

Remaining UI/UX work is not blocked technically, but exact Figma fidelity requires the `Sabiway Project` file key or node URLs. That evidence gap must remain visible rather than being silently guessed.
