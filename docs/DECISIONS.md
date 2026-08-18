# Engineering Decision Log

Consequential decisions must record date, problem, root cause, fix, reasoning and author/session/source. Append; do not silently rewrite history.

## 2026-08-18 — Adopt Preservation-First Rolling Green Baseline
**Problem:** The repository has advanced quickly through many product phases, while merges, CI, previews and Production deployment evidence can occur independently. Historical branches/PRs and fragmented documentation make it possible for a future developer or AI session to start from stale assumptions.

**Root cause:** No repository-owned mandatory cold-start contract or formal definition separated “merged” from “fully verified and deployment-confirmed”.

**Fix:** Adopt the Preservation-First Rolling Green Baseline, root `AGENTS.md`, mandatory `docs/DEVELOPER-START-HERE.md`, success-criteria/preservation-boundary requirements, RED/AMBER/GREEN scope classification, focused PRs, same-PR tests/docs, exact-head merge verification and post-merge/deployment evidence before baseline advancement.

**Reasoning:** Existing working behaviour is valuable evidence. Extending from a verified baseline reduces accidental rewrites, regressions, unsafe data/auth changes and false-green releases.

**Author/session/source:** Repository governance setup, founder-directed operating model, 2026-08-18.

## 2026-08-18 — Do not treat current main as deployment-verified baseline yet
**Problem:** `main` at the governance bootstrap start was `f90b65d4422836c66e456b5989c5615ceffca61a`; Platform CI for its PR was green, but GitHub combined status showed Vercel failure/build-rate limiting and Vercel Production was still on an older Git revision.

**Root cause:** Direct Vercel Git integration is not gated by an aggregate repository Release Gate and current Production deployment lagged repository merges.

**Fix:** Record current main as merged/CI-tested but not automatically Rolling Green. Keep deployment/release gating as an open P1 until exact deployed revision verification succeeds.

**Reasoning:** A merge or PR CI success alone does not satisfy the new baseline definition.

**Author/session/source:** Repository readiness audit, 2026-08-18.
