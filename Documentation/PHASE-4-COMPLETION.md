# Phase 4 — Marketplace foundation, services, jobs and discovery

## Correction note

The original Phase 4 merge delivered only part of the approved scope. This correction aligns Phase 4 to the AI Development Playbook and V2 design direction rather than treating a generic marketplace page and early booking request as completion.

## Phase outcome

Create the shared marketplace data model and allow demand and supply to meet safely across web and mobile.

## Delivered in the corrected Phase 4

### Marketplace domain
- governed service categories and subcategories
- professional service listings
- starting price, pricing note, delivery mode and availability indicators
- country/state/city/area discovery fields
- listing moderation lifecycle: draft, pending, approved, rejected and suspended
- featured and active visibility controls
- client `JobPosting` flow with budget, delivery mode, location and needed-by date
- professional `JobResponse` flow with proposed price and response lifecycle
- existing pre-moderation listings preserved as approved during migration

### Discovery and permissions
- public discovery exposes only active, approved service listings
- public job discovery exposes only open, approved jobs
- search supports service/problem text, category/subcategory, delivery mode and city-level location filtering
- professional profiles can create and update only their own listings; edits return to review
- client profiles can create and update only their own jobs; jobs return to review after edits
- only professionals can respond to approved open jobs
- duplicate professional responses to the same job are rejected
- only the job owner can shortlist or decline responses
- public profile serialization retains existing privacy controls

### Web marketplace
- rebuilt `/marketplace` around the approved SabiWay visual language: Inter, Nigerian green `#008753`, amber `#FFB800`, warm white surfaces and trust-led cards
- service/problem search plus city/state/country filtering
- category-led browsing
- Find Services / Open Jobs modes
- service listing submission for professionals
- job posting for clients
- professional job response flow
- provider/service detail sheet
- clear Phase 5 boundary: messaging, negotiation and booking are not misrepresented as Phase 4 features

### Mobile marketplace
- service/problem and location discovery
- services/jobs switch inside the authenticated mobile application
- responsive service and job cards using the shared visual language
- provider detail state
- professional job response flow
- shared API contracts with web

### Administration
- category/subcategory management
- listing moderation, visibility and feature controls
- job moderation/status controls
- job-response inspection
- existing booking-request admin retained only for backward compatibility until Phase 5 replaces the early booking model

## Automated journey coverage

The corrected Phase 4 tests cover:
1. direct service/problem discovery by category and city
2. public privacy boundaries
3. pending listings excluded from public discovery
4. professional listing submission and re-review after edit
5. client job creation and moderation gate
6. approved job discovery
7. professional job response
8. duplicate-response prevention
9. client shortlist decision
10. client/professional role boundaries
11. job ownership boundaries

## Design authority

Implementation uses the SabiWay Website & Mobile App Design Report as the available visual evidence: green and amber brand colours, Inter typography, warm/trust-led cards, service discovery, provider visibility, reviews/verification direction and Nigerian visual identity.

The report states that only selected key screens are included and that the full client/provider/community flows live in the Figma file. The repository/library does not currently contain the actual Figma URL/file key, so exact frame-by-frame visual comparison remains an evidence gap rather than being falsely marked complete.

## Phase boundary

Phase 4 stops at safe discovery, listings, jobs and professional responses.

Phase 5 owns:
- private messaging
- negotiation
- booking agreement
- scheduling
- scope/price/currency agreement
- linked job-to-booking conversion

Phase 6 owns provider verification and the full shared verification admin workflow.

Phase 7 owns SabiPay escrow.

Phase 8 owns disputes, reviews, notifications and post-service operational controls.

## Release gate

The correction is ready to merge only when:
- Django check passes
- migration drift passes
- corrected marketplace journeys pass
- frontend TypeScript and lint pass
- mobile TypeScript passes
- realtime, repository hygiene and waitlist checks remain green

Full Phase 4 sign-off additionally requires the playbook's device evidence and the missing full Figma reference for exact UI comparison. Until those are available, code completion and CI can pass while visual-evidence status remains explicitly conditional.
