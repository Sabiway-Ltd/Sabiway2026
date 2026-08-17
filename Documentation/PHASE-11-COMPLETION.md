# Master Phase 11 — Analytics, Monitoring & Product Measurement

## Objective
Make SabiWay behaviour and failures observable before controlled user testing while minimising personal data.

## Existing-system audit
The audit found `PostImpression`, the shared Operations dashboard, domain audit trails, SabiPay reconciliation/release jobs, a central Paystack gateway, and persisted notifications with Socket.IO delivery. No separate mobile push-provider implementation was found.

Decision: **KEEP** existing authoritative audit/domain data; **IMPROVE** it with one privacy-safe measurement layer; **MERGE** product and technical evidence into shared Operations admin.

## Measurement architecture
`ProductEvent` stores event name, authenticated actor where appropriate, web/Android/iOS/backend source, server-hashed anonymous ID, allow-listed properties and timestamp.

`TechnicalMetric` stores API latency/status, database readiness, realtime delivery, Paystack health, background-job health, normalized route/source and timestamp. Domain audit trails remain the investigation source of truth.

## Privacy controls
- No email, phone, message body, support text or payment payload in event properties.
- Search query text is never stored; only search type, query length and result count.
- Anonymous browser IDs are hashed server-side.
- API routes are normalized and query strings/record IDs are not stored.
- Properties are allow-listed and bounded.
- Clients may declare only web/Android/iOS, not backend.
- Detailed measurement is read-only and least-privilege controlled.
- Retention defaults: ProductEvent 180 days, TechnicalMetric 30 days; configurable and enforced by `python manage.py purge_measurement`.

## Product metrics
Registration conversion (`registration_started` → `registration_completed`), onboarding completion, profile completion, verification funnel, active users, search, content creation, engagement (follow/like/comment/reply), messaging, transaction funnel, failures, 7-day retention and cross-client screen usage are measurable.

## Technical monitoring
API latency/error/5xx, login failures, database readiness, SabiPay background jobs, realtime delivery and Paystack failures are measured. The current repository has no separate push provider, so `push_delivery` is a reserved metric with no current producer; persisted/in-app notifications and realtime delivery are monitored instead.

## Web, Android and iOS
Web pathname changes and mobile authenticated section changes emit `screen_viewed` using the shared ingestion endpoint. Query parameters and sensitive content are not captured. Measurement is best-effort and never blocks user journeys.

## Operations
The Django shared admin shows 24-hour product/technical signals and read-only ProductEvent/TechnicalMetric records.

Protected snapshot: `GET /api/operations/measurement/?hours=24` (bounded 1 hour–90 days).

## Failure investigation
Operators can answer: what failed, who was affected where appropriate, where it failed, how often, and what supporting event/metric/domain-audit evidence exists.

## Boundary
No external paging/SaaS monitoring provider is claimed. Production alerting should consume these signals once the hosting/monitoring destination is final. Physical browser/device/adverse-network certification remains Phase 12; controlled user-testing readiness remains Phase 13.

## Gate
Phase 11 completes only when analytics/privacy tests plus the existing backend, frontend, mobile, realtime, migration, design-system, repository-hygiene and waitlist checks pass on the exact PR head and the PR is merged.
