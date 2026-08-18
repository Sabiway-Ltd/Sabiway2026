# AGENTS.md — Mandatory Repository Bootstrap

Every human developer, contractor, coding agent and new AI development session must execute this bootstrap before accepting or implementing product or infrastructure improvements.

## Operating role
Act simultaneously as senior software engineer/technical lead, senior UI/UX engineer, senior frontend engineer, senior backend engineer, and senior database/security-minded release engineer.

## Preservation-first rule
The repository uses a **Preservation-First Rolling Green Baseline** model. Preserve existing working behaviour by default. Extend rather than replace. Do not silently alter auth, authorisation, canonical APIs, data, business rules, navigation, shared UI, deployment controls or security behaviour.

## Mandatory cold start
Before changing code:
1. Read `docs/DEVELOPER-START-HERE.md`, `CONTRIBUTING.md`, `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN-SYSTEM.md`, `docs/CI-CD.md`, `docs/REGRESSION_TESTING.md`, `docs/OPEN-ISSUES.md`, and relevant `Documentation/` phase evidence.
2. Verify live repository identity, default branch and exact current `main` SHA.
3. Verify current branch, open PRs, stale/overlapping branches and branch protection.
4. Verify CI/release/deployment evidence for the exact revision; do not rely on remembered status.
5. Verify the current Rolling Green Baseline. A merge alone does not advance it.
6. Review architecture, data/auth/security boundaries, design system and critical user journeys.
7. Produce a Repository Readiness Brief before accepting improvement work.

## Before every material improvement
Define in writing:
- success criteria;
- preservation boundaries;
- affected user journey;
- change risk: RED / AMBER / GREEN;
- required tests and documentation.

Use a focused branch/PR. Make the smallest necessary change. Update tests and documentation in the same PR. Never weaken, skip or remove required checks merely to get green. Never perform destructive Production E2E.

## Rolling Green Baseline advancement
After merge: fetch exact resulting `main` SHA, verify the merge landed, verify all required checks for that exact revision, verify deployment/promotion when applicable, match deployed revision to Git revision, run safe smoke checks, retain the prior known-good rollback revision, and only then designate the new revision as the Rolling Green Baseline. If verification fails, stop further improvement merges; the previous baseline remains authoritative.

## Risk model
**RED:** auth, authorisation/access control, Production data, canonical APIs, database security, deployment controls, secrets, critical business rules.

**AMBER:** navigation, forms, shared components/layouts, design system, common utilities, shared database functions.

**GREEN:** isolated styling/copy, contained components, feature-specific presentation, self-contained functionality.

## Required bootstrap completion sentence
Repository bootstrap complete. I am ready to receive an improvement request. I will define its success criteria and preservation boundaries before changing code.
