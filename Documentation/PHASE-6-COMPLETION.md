# Phase 6 — Provider verification and shared admin operations

## Outcome

Phase 6 makes manual provider approval a marketplace launch gate. A professional is never represented as verified merely because a profile, service listing or document exists. The approved verification state is the shared backend source of truth for the badge, live service publication, job responses and booking eligibility.

## Source decisions

- Government-issued identity evidence is required.
- Skill/experience evidence is supported and should be supplied where applicable.
- Address evidence is supported but **not mandatory** because the playbook explicitly leaves mandatory address verification subject to owner confirmation.
- Only an authorised human reviewer can approve, reject or request more information.
- The five workflow states are `submitted`, `in_review`, `approved`, `rejected` and `more_info`.
- Exact SLA and retention durations were not fixed by the supplied product documents. `VERIFICATION_REVIEW_SLA_HOURS` (48 by default) and `VERIFICATION_RETENTION_DAYS` (365 by default) are configurable operational defaults, not immutable product policy.

## Security model

Verification files do not use the ordinary public media path. The API validates MIME type and a 10 MB maximum, encrypts document bytes with a dedicated Fernet key before database storage, records SHA-256 integrity metadata and returns only document metadata to clients. Document retrieval requires the professional who owns the submission or an authorised verification reviewer. Download responses are `private, no-store` and include `nosniff` protection.

`VERIFICATION_DOCUMENT_KEY` is required when the gate is enabled in a non-debug environment. The repository contains no production key. CI uses a CI-only test key.

Retention is implemented by `python manage.py purge_verification_documents`: expired encrypted payloads are erased while filename/type/checksum metadata and audit history remain available for accountability.

## Backend and admin journey

1. Professional submits a government ID plus applicable credential evidence; optional address evidence can be included.
2. Submission receives an SLA due time and an immutable audit entry.
3. Authorised reviewer opens the shared verification queue and starts review.
4. Reviewer approves, rejects or requests more information. Rejection/more-information decisions require a reason.
5. Professional can resubmit after rejection/more-information; the submission version increments and earlier document/audit history remains.
6. Approval exposes `is_verified=true` through the privacy-aware profile contract.
7. If approval is lost, any live service listing is returned to pending and unfeatured state.

## Marketplace launch gate

- An unverified provider cannot have an approved/public service listing.
- An unverified provider cannot respond to an open marketplace job.
- A booking cannot be created for an unverified provider.
- A pending booking cannot be accepted if the provider is no longer verified.
- Existing approved listings are demoted to pending when the Phase 6 migration is applied, preventing legacy data from bypassing the new gate.
- Draft/pending service preparation remains possible; publication is the restricted action.

## Web

`/verification` provides a responsive V2 submission/status/resubmission experience, supports government ID and credential file upload, clearly labels optional address evidence, exposes manual-review state and never claims verification before approval. Public professional profiles display the SabiWay Verified badge only when `is_verified` is true.

## Mobile

The authenticated mobile navigation adds **Verify** for professional accounts. The verification screen supports document picker and camera capture for identity evidence, optional credential/address files, status tracking and resubmission using the same Django contracts as web.

## Automated journeys

The Phase 6 backend suite verifies:

- encryption at rest and absence of encrypted payloads/public storage URLs from API responses;
- owner/reviewer-only document retrieval and private cache headers;
- reviewer permission boundaries and reason requirements;
- submitted → review → approved/rejected/more-information transitions;
- resubmission with versioned document and audit history;
- unverified listing/job-response/booking denial;
- approved-provider marketplace unlock;
- automatic listing demotion when approval is lost;
- invalid document MIME rejection;
- retention purge preserving audit evidence;
- Phase 4/5 marketplace and booking journeys continuing for approved providers.

## Responsive/device audit

Code-level matrix covered:

- mobile web: stacked upload form, long reason text, file inputs and touch targets;
- desktop web: two-column evidence/security layout;
- React Native phone: camera permission path, document picker, virtual keyboard and scrollable form;
- tablet: bounded content width and wrapping verification controls;
- admin: Django queue/table/detail views suitable for desktop and supported tablet widths.

Runtime device checks still required before production sign-off: real iOS and Android camera permission prompts, OS document providers, large/slow upload behaviour, virtual-keyboard layouts, screen-reader announcements and 200% browser scaling. These are recorded as release evidence obligations rather than silently claimed as physically tested.

## Release gate

Phase 6 is ready to merge only when Platform CI is green for repository hygiene, Django security/system checks, migration drift, Phase 6 backend journeys, frontend TypeScript/lint, mobile TypeScript, realtime and waitlist syntax. Production verification additionally requires setting a real `VERIFICATION_DOCUMENT_KEY` in the backend secret store and running the outstanding physical-device/security review before marketplace launch.
