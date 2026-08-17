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
| Role | Duplicated on `User.role` and `Profile.role` | **REFACTOR / MERGE** — `User.role` is authoritative; `Profile.role` is now a compatibility mirror/read-only API field and is automatically repaired from the account role |
| Profile identity | `full_name` duplicated between User/Profile | **IMPROVE** — prevent silent divergence as identity work is completed |
| Profile privacy | Serializer hides email/phone/DOB/street/address from non-owner/non-staff | **KEEP / HARDEN / TEST** |
| Verification model | Submission/document/audit lifecycle with status, SLA, reviewer and versioning | **KEEP / IMPROVE** |
| Verification documents | Encrypted payload, checksum, retention/purge metadata and protected download | **KEEP / VALIDATE** |
| Reviewer permissions | Dedicated review permission + staff/superuser paths | **KEEP / TEST** |
| Verification resubmission | Rejected/more-info retry path exists | **KEEP / TEST** |
| Mobile verification | Existing API/types/screen covers upload, camera, status tracking and resubmission | **KEEP / IMPROVE** against exported V2 app design and Phase 1 primitives |
| Web verification | Existing `/verification` route already covers manual-review status, secure upload, resubmission, evidence list and accessible status/error messaging | **KEEP / IMPROVE** — do not create a parallel implementation |
| Web profile | Existing profile surfaces are feature-rich but contain legacy editing/state patterns | **IMPROVE / REFACTOR** |
| Verification admin | Valid transition rules, reviewer permission, secure document access, timestamps, decision reasons and audit events already exist | **KEEP / HARDEN / TEST** |

## Trust model

1. `accounts.User` owns account identity and authoritative role.
2. `profiles.Profile` owns public/profile presentation data, not permission authority.
3. `Profile.role` remains only as a temporary compatibility mirror and is synchronised from `User.role`.
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
- [x] Test private/public profile boundary.
- [x] Test profile role update protection and mirror repair.
- [x] Audit existing Web verification journey and keep it as the canonical web implementation.
- [x] Validate existing admin transition/reviewer/audit architecture.
- [ ] Complete profile identity (`full_name`) authority/sync decision.
- [ ] Improve Web profile journey and remove remaining legacy role/edit assumptions.
- [ ] Audit and improve Android/iOS profile journey.
- [ ] Complete loading/error/empty/permission/accessibility states across profile surfaces.
- [ ] Final regression CI green on Phase 3 head.
- [ ] Phase 2 dependency certified/merged before Phase 3 merges to `main`.

## Deployment rule

No Vercel deployment changes in Phase 3. Deployment resumes at Master Phase 5 unless the Product Owner explicitly changes that programme constraint.
