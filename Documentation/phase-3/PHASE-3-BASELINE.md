# Phase 3 — Profiles, Roles, Trust & Verification

Status: **STACKED WIP — depends on Phase 2**

This file only seeds the Phase 3 audit baseline on the Phase 2 branch. Phase 3 implementation will use a dedicated branch stacked from Phase 2 and must not merge to `main` before Phase 2 is integrated and green.

## Objective

Enable credible user identity and role-specific experiences across Web + Android + iOS with one shared backend/admin source of truth.

## Mandatory pre-check

Audit before build:
- existing profile models and role fields
- current verification models/workflows
- web profile screens
- mobile profile screens
- approved mobile Figma profile/verification designs
- admin verification capability
- privacy/public-field boundaries
- duplicate role/trust state
- loading/error/retry states
- accessibility and responsive gaps

## Decision rule

Every existing capability must be classified as **KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE** before new implementation is added.
