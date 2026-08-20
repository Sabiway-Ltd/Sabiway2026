# SabiWay Product Rebuild — New Chat Handoff

Use this file when continuing the SabiWay rebuild in a new AI/developer session.

## Repository

`Sabiway-Ltd/Sabiway2026`

## Mandatory first reads

1. `AGENTS.md`
2. `README.md`
3. `docs/DEVELOPER-START-HERE.md`
4. `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
5. `docs/PHASE-0-PRODUCT-AUDIT.md`
6. `docs/PHASE-0-CONSOLIDATED-DEFECT-REGISTER-AND-PHASE-1-GATE.md`
7. `docs/PHASE-0-ROLE-IA-AUDIT.md`
8. `docs/PHASE-0-AUTH-SESSION-AUDIT.md`
9. `docs/USER-JOURNEYS.md`
10. `docs/DESIGN-SYSTEM.md`
11. `docs/OPEN-ISSUES.md`

Then inspect the current source directly.

## Current programme status

- Rebuild programme created 2026-08-20.
- Programme began from `main@ed53bf74191ff2e0d7da3e86973624160a5e0c51`.
- Phase 0 evidence branch: `plan/product-rebuild-phase-0`.
- Phase 0 status: **COMPLETE**.
- Next phase: **Phase 1 — Information Architecture & Access Model**.
- Temporary demo PR #64 was closed unmerged because the wider audit showed route/auth/role architecture must be corrected first.
- Phase 0 audit PR #65 contains the canonical rebuild evidence and should remain separate from Phase 1 implementation work.

## Why the rebuild exists

Confirmed problems include:

- intended public discovery routes blocked by middleware and redirected to login;
- route/session decisions duplicated across middleware, AppShell, MarketplaceShell, localStorage, Zustand and API clients;
- Client and Professional navigation incorrectly identical;
- generic role-neutral authenticated Home hierarchy;
- Professional acquisition losing Professional intent at signup;
- return-to-intent inconsistencies;
- token refresh updating localStorage but not middleware cookie;
- marketplace backend failure being masked as empty data;
- design token system existing but being bypassed by hard-coded UI values;
- incomplete runtime accessibility evidence;
- no frontend browser E2E framework for routing/session journeys;
- product analytics too thin for marketplace funnel diagnosis;
- no suitable complete frontend demo environment while the live backend is unavailable.

## Instruction to the next session

Copy/paste this:

> Act as the combined Senior Product Manager, Senior Product Designer, Senior Design Thinking Lead, Senior UX Researcher, Senior UX Strategist, Senior UI/UX Designer, Senior Design Systems Designer, Senior Accessibility Designer, Senior Software Architect, Senior Solutions Architect, Senior Full-Stack Software Engineer, Senior Technical Lead, Senior QA Engineer, Senior Test Automation Engineer, Senior Content Designer, Senior UX Writer, Senior Growth Lead, Senior Product Analytics Lead, and Senior Security & Privacy Engineer for SabiWay. Work from `Sabiway-Ltd/Sabiway2026`. Do not rely on chat memory. Read the mandatory repository files listed in `docs/PRODUCT-REBUILD-NEW-CHAT-HANDOFF.md`, verify current `main`, open PRs, CI and deployment state, then start Phase 1 from `docs/PHASE-0-CONSOLIDATED-DEFECT-REGISTER-AND-PHASE-1-GATE.md`. Follow the Preservation-First Rolling Green model. Keep Phase 0 evidence separate from Phase 1 implementation. Do not begin Phase 2 until the Phase 1 acceptance gate is satisfied.

## Phase 1 scope

Phase 1 is **Information Architecture & Access Model**.

Deliver:

1. canonical route registry/access taxonomy;
2. PUBLIC / GUEST_CAPABLE / AUTHENTICATED_SHARED / CLIENT_ONLY / PROFESSIONAL_ONLY / STAFF_ONLY / PARTICIPANT_SCOPED classifications;
3. middleware aligned to that registry;
4. safe `next`/return-to-intent handling;
5. distinct Client navigation;
6. distinct Professional navigation;
7. shared vs role-specific destination policy;
8. consistent post-auth destination resolver;
9. session abstraction boundary for new routing code;
10. browser E2E routing/access tests;
11. preserved backend permission authority.

## Phase 1 acceptance gate

Do not close Phase 1 until:

- intended public pages stay public;
- guest marketplace discovery works where approved;
- protected actions request auth only when needed;
- Client and Professional navigation differ appropriately;
- role intent survives acquisition/login/signup;
- safe return-to-intent works;
- open redirects are blocked;
- route access policy is centralised;
- new routing code no longer depends on arbitrary direct localStorage checks as authority;
- browser tests cover the critical route/access journeys;
- backend permissions remain authoritative.

## Immediate next action

Create a focused Phase 1 implementation branch from the verified current baseline after checking whether `main` advanced since Phase 0 began. Do not implement Phase 1 directly on the Phase 0 evidence branch.
