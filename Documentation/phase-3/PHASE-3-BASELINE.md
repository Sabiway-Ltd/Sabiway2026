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
| Role | Duplicated on `User.role` and `Profile.role` | **REFACTOR / MERGE** — `User.role` is authoritative; profile role becomes compatibility mirror/read-only |
| Profile identity | `full_name` duplicated between User/Profile | **IMPROVE** — prevent silent divergence as identity work is completed |
| Profile privacy | Serializer already hides email/phone/DOB/street/address from non-owner/non-staff | **KEEP / HARDEN / TEST** |
| Verification model | Existing submission/document/audit lifecycle with status, SLA, reviewer and versioning | **KEEP / IMPROVE** |
| Verification documents | Encrypted payload, checksum, retention/purge metadata and protected download | **KEEP / VALIDATE** |
| Reviewer permissions | Dedicated review permission + staff/superuser paths exist | **KEEP / TEST** |
| Verification resubmission | Rejected/more-info retry path exists | **KEEP / TEST** |
| Mobile verification | Existing verification API/types/screen exists | **KEEP / IMPROVE** against exported V2 app design and Phase 1 primitives |
| Web profile/verification | Existing profile surfaces exist but parity/accessibility need audit | **IMPROVE / REFACTOR** |
| Admin | Existing profile admin and detailed verification admin exist | **KEEP / IMPROVE** |

## Trust model

1. `accounts.User` owns account identity and authoritative role.
2. `profiles.Profile` owns public/profile presentation data, not permission authority.
3. Verification is available only when authoritative `User.role == professional`.
4. Public consumers see only safe profile fields and a coarse trust state (`approved` or `unverified`).
5. Owners/reviewers may see detailed verification state required to complete/review the journey.
6. Verification documents are never public profile assets.
7. Admin/reviewer decisions must remain auditable.

## Required lifecycle

Profile:
Home → Profile → Edit → Save → View public profile

Verification:
Professional profile → Start verification → Requirements → Submit → Pending/In review → Approved / Rejected / More information → User notified → Resubmit where allowed

## Phase 3 gates

- [x] Audit existing profile backend.
- [x] Audit existing verification backend/admin.
- [x] Confirm mobile verification implementation exists.
- [ ] Make account role authoritative across profile + verification.
- [ ] Test private/public profile boundary.
- [ ] Test profile ownership/update permissions.
- [ ] Audit and improve Web profile/verification journey.
- [ ] Audit and improve Android/iOS profile/verification journey.
- [ ] Validate admin review/retry/audit lifecycle.
- [ ] Complete loading/error/empty/permission states.
- [ ] Regression CI green.
- [ ] Phase 2 dependency certified/merged before Phase 3 merges to `main`.

## Deployment rule

No Vercel deployment changes in Phase 3. Deployment resumes at Master Phase 5 unless the Product Owner explicitly changes that programme constraint.
