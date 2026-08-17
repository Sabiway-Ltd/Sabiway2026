# Master Phase 9 — Shared Admin, Moderation & Support

## Objective
Operate the full SabiWay product from one central administrative environment, with least-privilege operational roles, support context and auditable sensitive actions.

## Existing-system pre-check and decisions

SabiWay already had a useful Django admin foundation across accounts, profiles, community moderation, marketplace, verification and SabiPay. Replacing it with a second bespoke admin would duplicate permissions and operational logic.

Decision:

- **KEEP + IMPROVE** Django admin as the one shared operational environment.
- **MERGE** existing domain audit trails into one shared operations audit view while retaining domain-specific evidence.
- **IMPROVE** user/role administration so non-superusers cannot grant super-admin access or arbitrary direct permissions.
- **IMPROVE** content and conversation report handling so admin state changes are recorded.
- **ADD** a support case workflow and privacy-safe support API shared by web, Android and iOS clients.
- **ADD** non-secret operational configuration with explicit secret-storage rejection.
- **ADD** a shared operational dashboard using the same production data used by all clients.

## Admin modules delivered

The central `/admin/` environment now covers:

- Dashboard / operational overview
- Users
- Operational role assignment through Django groups
- Profiles
- Verification queue and documents
- Content moderation
- Post reports
- Conversation reports
- Marketplace listings, jobs and bookings
- SabiPay transactions and payment attempts
- SabiPay disputes and payouts
- Support cases
- Notifications
- Non-secret platform configuration
- Shared operations audit logs plus domain audit evidence
- Operational analytics/queue counts

No Android-specific or iOS-specific admin is introduced. This is intentional: the same SabiWay account, profile, content, transaction, payment and support data is administered once regardless of which client produced it.

## Operational roles

`operations.roles.sync_operational_roles()` maintains the following least-privilege groups:

- Operations Admin
- Verification Reviewer
- Moderator
- Support Agent
- Finance Admin
- Read-only Analyst

Super Admin remains Django `is_superuser`; it is deliberately not a normal assignable operational group.

The management command `python manage.py sync_operational_roles` can re-apply the canonical permission map. The operations app also synchronises the role groups after migrations.

## User and role safety

- Operations administrators may manage normal operational role/group membership without being able to grant `is_superuser` or arbitrary direct user permissions.
- Only a super admin may grant super-admin access or delete users.
- Sensitive user changes write `OperationsAudit` events with actor, target, previous state and new state.
- Existing verification, moderation, booking and SabiPay audit records are mirrored into the shared operations audit stream, while the original domain audit records remain intact.

## Moderation and reports

- Post report decisions through Django admin update content visibility consistently and create moderation/audit evidence.
- Direct non-superuser editing of post hidden-state fields is blocked; moderators use the report workflow.
- Conversation reports record reviewer/time and shared operations audit evidence when their status changes.
- Existing marketplace admin continues to avoid exposing private message bodies; support/moderation sees report/thread metadata rather than a blanket private-message reader.

## Support

`SupportCase` provides:

- category
- subject and user description
- open / in-progress / waiting-user / resolved / closed lifecycle
- low / normal / high / urgent priority
- staff assignment
- optional related-object reference type/id
- internal support notes
- timestamps and resolution time

Authenticated users can create and view only their own support cases through both legacy and V2 API routes. Authorised support staff can manage the queue. Internal notes and staff handling data are not returned in the public support-case serializer.

When support changes a case status, the user receives an in-app support notification. Support changes are also written to the shared operations audit log.

## Configuration

`PlatformConfiguration` is for operational, non-secret values only. Keys containing credential/secret patterns are rejected. API keys, tokens, passwords and private keys remain in environment/secret management.

## Shared dashboard

The Django admin index now surfaces operational counts for:

- active/total users
- open and urgent support cases
- open post and conversation reports
- verification queue
- pending listing/job moderation
- active bookings
- pending payments
- active disputes
- notifications in the last 24 hours
- administrative/audit actions in the last 24 hours

Dashboard visibility requires the dedicated operations-dashboard permission or super-admin access.

## Cross-platform position

Phase 9 is a **shared-platform capability**, not three separate admin clients. Web, Android and iOS continue to use the same Django/DRF backend and therefore create records operated by this one admin environment. The support API is available at both:

- `/api/operations/support-cases/`
- `/api/v1/operations/support-cases/`

This satisfies the one-admin principle without creating duplicated mobile administration surfaces.

## Security / privacy controls

- Server-side permissions determine admin capability; hidden UI is not treated as authorisation.
- Super-admin grant is restricted to existing super admins.
- Support internal notes are not exposed to ordinary users.
- Private message bodies are not exposed through the conversation-report admin.
- Secret-like configuration keys are rejected.
- Audit records are read-only in admin.
- Support cases cannot be deleted from admin.

## Automated certification

Platform CI now includes the `operations` app in backend journeys. Focused Phase 9 tests cover:

- operational role group creation
- least-privilege role separation
- support case ownership/privacy
- non-support users blocked from handling updates
- authorised support queue updates
- operations audit creation
- secret-like platform configuration rejection

The normal platform gate continues to include Django checks, migration drift, backend regression, frontend TypeScript/lint, mobile TypeScript, realtime checks, design-system sync, repository hygiene and waitlist syntax.

## Phase boundary

Phase 10 owns final security, privacy, performance and reliability hardening across the full product. Phase 11 owns full product/technical analytics and monitoring instrumentation beyond the operational queue counts used here. Phase 12 owns final end-to-end cross-device journey certification.

Exact Figma parity is not claimed for Django's internal admin because the playbook requires one shared operational system rather than a consumer-facing Figma screen. User-facing web/mobile design remains governed by the SabiWay V2 design system.
