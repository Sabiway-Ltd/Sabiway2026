# Phase 11 — Jobs, Leads & Proposals Audit

Status: IN PROGRESS
Branch: `feat/phase-11-jobs-leads-proposals`

## Goal

Build a coherent, role-authorised work lifecycle without collapsing distinct marketplace states:

Client job → moderation/open state → Professional discovery → proposal → Client decision → conversation → booking handoff.

Proposal, message, booking, payment and review remain separate domain states.

## Current evidence

### Client jobs
- `/jobs` loads the Client's own jobs but is list-only.
- “Post a job” still sends the Client to `/marketplace`, which Phase 10 deliberately re-focused on service discovery for Clients.
- job cards show response counts but do not link to a job-specific proposal-review surface.
- jobs page still contains a legacy direct `localStorage.access` fallback.
- backend JobPosting already owns the necessary fields: category/subcategory, title/description, budget, currency, delivery mode, geography, needed-by, status and moderation status.

### Professional proposals
- `/proposals` lists responses sent by the Professional.
- proposals are not linked to a dedicated detail/lead context.
- JobResponse already has authoritative status and proposed price/message.
- Client decision endpoint already restricts shortlist/decline to the owning Client.

### Backend lifecycle gaps
- JobPosting list supports `mine=1`, but detail retrieval of a Client's own non-public/draft/pending job is not explicitly modelled.
- JobResponse list is correctly participant-scoped, but lacks a `job=<id>` filter useful for a Client's job detail workspace.
- JobResponse serializer exposes `job_title` but not a read-only job identifier, making contextual frontend links harder.
- MessageThread already accepts `job_response_id` for Professional-originated thread creation and keeps conversation separate from proposal decision.

## Decisions

### D11-01 — Dedicated Client job routes
- `/jobs/new` = create a job.
- `/jobs/[id]` = Client-owned job detail + proposal review.
- `/jobs` remains the Client overview.
- do not use `/marketplace` as the job-authoring surface.

### D11-02 — Job detail must be owner-safe
Authenticated Clients may retrieve their own job regardless of moderation/status. Everyone else sees only public approved open jobs through the existing public discovery policy.

### D11-03 — Proposal review is job-contextual
Client job detail loads only proposals for that job and can shortlist/decline them through the existing decision endpoint.

### D11-04 — Proposal decision is not conversation acceptance
Shortlisting does not create a booking, payment or completed-work state. A separate explicit “Start conversation” action creates/reuses the existing job-response MessageThread.

### D11-05 — Professional proposals remain a portfolio of leads
`/proposals` continues to show all Professional proposals, but gains job IDs/context and links back to the relevant opportunity/conversation state where appropriate.

### D11-06 — Backend remains authoritative
No local-only proposal/job status changes. UI updates only after successful API response.

## Phase 11 implementation slices

1. Backend lifecycle contract
   - owner-safe job detail retrieval;
   - `job=<id>` response filtering within participant scope;
   - expose read-only `job_id` alongside write-side job input;
   - backend tests for owner/non-owner visibility and proposal decisions.

2. Client job authoring
   - `/jobs/new` role-protected form;
   - categories, delivery, location, budget and needed-by;
   - explicit pending moderation success state.

3. Client job detail/proposal review
   - job facts/status/moderation;
   - proposal list;
   - shortlist/decline;
   - explicit conversation handoff;
   - loading/empty/error/permission states.

4. Professional lead management
   - proposal cards link to contextual job/proposal information;
   - status and next-action copy remain distinct from messages/bookings.

5. Quality gate
   - Phase 11 static contract;
   - backend lifecycle tests;
   - browser protection for `/jobs/new` and `/jobs/[id]`;
   - preserve Phases 1–10 contracts;
   - exact-head Release Gate before merge.

## Out of scope
- messaging redesign (Phase 13);
- verification/reputation redesign (Phase 14);
- booking/scheduling redesign (Phase 15);
- payment redesign (Phase 16);
- reviews/reputation scoring not currently authoritative.
