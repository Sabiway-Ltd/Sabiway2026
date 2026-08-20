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
6. `docs/USER-JOURNEYS.md`
7. `docs/DESIGN-SYSTEM.md`
8. `docs/OPEN-ISSUES.md`

Then inspect the current source directly.

## Current programme status at creation

- Rebuild programme created 2026-08-20.
- Programme began from `main@ed53bf74191ff2e0d7da3e86973624160a5e0c51`.
- Working branch: `plan/product-rebuild-phase-0`.
- Active phase: **Phase 0 — Product, UX, Code & Architecture Truth Audit**.
- Temporary demo PR #64 was closed unmerged because the wider audit showed route/auth/role architecture must be corrected first.

## Why the rebuild exists

Confirmed problems include:

- unnecessary/login-loop behaviour caused by confused route/shell access boundaries;
- browser `localStorage` presence being used as an auth presentation signal;
- Client and Professional experiences being too generic/identical;
- generic authenticated navigation contradicting the repository's own role-specific design rules;
- marketplace backend failure being silently presented as empty data;
- homepage carrying too much architecture explanation before immediate user value;
- internal Home being too shallow for a mature two-sided marketplace;
- no suitable complete frontend demo environment while the live backend is unavailable.

## Instruction to the next session

Copy/paste this:

> Act as the combined senior product, UX, UI, design-system, accessibility, software architecture, full-stack, QA, content, growth, analytics, security and privacy lead for SabiWay. Work from `Sabiway-Ltd/Sabiway2026`. Do not rely on chat memory. Read the mandatory repository files listed in `docs/PRODUCT-REBUILD-NEW-CHAT-HANDOFF.md`, verify current `main`, open PRs, CI and deployment state, then continue the active rebuild phase from the first incomplete item in `docs/PHASE-0-PRODUCT-AUDIT.md`. Follow the Preservation-First Rolling Green model. Do not begin a later phase until the active phase exit gate is satisfied.

## Immediate next work

Continue Phase 0 in this order:

1. frontend route/screen inventory;
2. CTA destination/link audit;
3. public/protected/Client/Professional/staff route matrix;
4. auth/session/redirect audit;
5. Client and Professional IA/navigation audit;
6. backend dependency/demo-fixture audit;
7. design-system/Figma/current implementation comparison;
8. responsive/accessibility/content audit;
9. QA/security/analytics gap audit;
10. final KEEP/IMPROVE/REWORK/REPLACE/REMOVE matrix and Phase 1 backlog.

Do not start Phase 1 implementation until Phase 0 is explicitly closed with evidence.
