# Phase 3 — Profiles, Roles, Trust & Verification

Status: **IN PROGRESS — STACKED ON PHASE 2**

## Programme constraint

Vercel deployment remains deferred until Master Phase 5. Phase 3 validation uses GitHub Platform CI plus Codespaces/manual checks.

## Objective

Deliver credible, role-aware profiles and a safe professional-verification lifecycle across Web + Android + iOS, with one backend source of truth and one admin review layer.

## Audit decisions

| Capability | Existing state | Decision |
|---|---|---|
| Profile model/API | Mature Django profile model, serializers, views and follow relationships | **KEEP / IMPROVE** |
| Role | Duplicated on `User.role` and `Profile.role` | **REFACTOR / MERGE** — `User.role` is authoritative; `Profile.role` is a temporary compatibility mirror/read-only API field and is automatically repaired from the account role |
| Profile identity | `full_name` duplicated between User/Profile | **REFACTOR / MERGE** — `User.full_name` is authoritative; profile editing updates the account and `Profile.full_name` remains a repaired compatibility mirror |
| Profile privacy | Serializer hides email/phone/DOB/street/address from non-owner/non-staff | **KEEP / HARDEN / TEST** |
| Verification model | Submission/document/audit lifecycle with status, SLA, reviewer and versioning | **KEEP / IMPROVE** |
| Verification documents | Encrypted payload, checksum, retention/purge metadata and protected download | **KEEP / VALIDATE** |
| Reviewer permissions | Dedicated review permission + staff/superuser paths | **KEEP / TEST** |
| Verification resubmission | Rejected/more-info retry path exists | **KEEP / TEST** |
| Mobile verification | Existing API/types/screen covers upload, camera, status tracking and resubmission | **KEEP / IMPROVE** against exported V2 app design and Phase 1 primitives |
| Mobile profile | Missing from current Master branch; reusable implementation existed on the earlier out-of-sequence Phase 3 branch | **MERGE / IMPROVE** — selectively restored into current mobile shell with current tokens/API rules, profile deep-linking and verification entry |
| Web verification | Existing `/verification` route already covers manual-review status, secure upload, resubmission, evidence list and accessible status/error messaging | **KEEP / IMPROVE** — do not create a parallel implementation |
| Web profile | Existing profile surfaces are feature-rich but contain legacy editing/state patterns | **IMPROVE / REFACTOR** |
| Verification admin | Valid transition rules, reviewer permission, secure document access, timestamps, decision reasons and audit events already exist | **KEEP / HARDEN / TEST** |

## Trust model

1. `accounts.User` owns authoritative account identity (`full_name`) and role.
2. `profiles.Profile` owns public/profile presentation data, not permission authority.
3. `Profile.role` and `Profile.full_name` remain temporary compatibility mirrors and are synchronised from `User`.
4. Verification is available only when authoritative `User.role == professional`.
5. Public consumers see only safe profile fields and a coarse trust state (`approved` or `unverified`).
6. Owners/reviewers may see detailed verification state required to complete/review the journey.
7. Verification documents are never public profile assets.
8. Admin/reviewer decisions remain auditable and destructive admin actions are disabled.

## Required lifecycle

Profile:
Home → Profile → Edit → Save → View public profile

Verification:
Professional profile → Start verification → Requirements → Submit → Pending/In review → Approved / Rejected / More information → User notified → Resubmit where allowed

## Phase 3 gates

- [x] Audit existing profile backend.
- [x] Audit existing verification backend/admin.
- [x] Confirm mobile verification implementation exists.
- [x] Make account role authoritative across profile + verification.
- [x] Add compatibility role-mirror repair from account → profile.
- [x] Make account full name authoritative and repair the profile mirror.
- [x] Test private/public profile boundary.
- [x] Test role and full-name update protection/synchronisation.
- [x] Audit existing Web verification journey and keep it as the canonical web implementation.
- [x] Validate existing admin transition/reviewer/audit architecture.
- [x] Restore and integrate Android/iOS profile journey from audited reusable work.
- [x] Add mobile profile loading/error/success/disabled states and professional verification entry.
- [ ] Improve remaining Web profile legacy state/edit assumptions.
- [ ] Complete final accessibility/permission-state pass across profile surfaces.
- [ ] Final regression CI green on Phase 3 head.
- [ ] Phase 2 dependency certified/merged before Phase 3 merges to `main`.

## Regression note

Phase 3 makes `accounts.User.role` authoritative. Legacy marketplace, verification and SabiPay tests that previously mutated `Profile.role` have been updated to create the intended account role explicitly. This preserves production authorisation rules instead of weakening them to satisfy stale fixtures.

## Deployment rule

No Vercel deployment changes in Phase 3. Deployment resumes at Master Phase 5 unless the Product Owner explicitly changes that programme constraint.
