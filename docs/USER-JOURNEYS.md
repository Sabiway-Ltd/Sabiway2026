# SabiWay Critical User Journeys

This document describes the main end-to-end journeys that future changes must preserve unless the PR explicitly changes them. It helps developers review a feature as part of a complete workflow rather than as an isolated page or API.

## 1. Identity and account access

### Registration
Typical path:
`open signup` → `select/confirm product role` → `submit account details` → `backend validates/creates account` → `confirmation/activation where configured` → `authenticated entry/onboarding`.

Preserve:
- server-side validation;
- unique account identity rules;
- role value integrity;
- no accidental staff/superuser elevation;
- safe error messages;
- analytics without sensitive credential capture.

### Login
`submit credentials` → `backend authenticates` → `JWT/session issued` → `profile/role resolved` → `role-appropriate product entry`.

Preserve:
- invalid credentials fail safely;
- access/refresh token rules;
- both web/mobile compatibility;
- server-side permissions after login.

### Password recovery
`request reset` → `backend generates controlled reset flow` → `user receives/uses reset token` → `new password validation` → `old invalid state handled safely`.

Do not expose whether arbitrary accounts exist more than intended by current security behaviour.

### Logout
Clear client auth state and invalidate/revoke/expire relevant server/token state according to current architecture. Do not leave stale privileged UI/session state.

### Internal review mode
Development-only:
`login page` → `Review as Client/Professional` → `guarded backend review endpoint` → `short-lived real review session` → `protected product review`.

Invariants:
- requires development-safe flags;
- never active under Production-safe backend settings;
- review users are not staff/superuser;
- not a replacement for real auth testing.

## 2. Onboarding and profile

`authenticated user` → `profile created/read` → `complete/edit profile` → `role-specific profile fields` → `profile completion/trust presentation`.

Preserve:
- user can edit only permitted profile data;
- Client/Professional role semantics;
- existing signal-driven side effects;
- no leakage of sensitive verification/operations fields.

## 3. Professional verification

`Professional opens verification` → `sees current status` → `submits required evidence` → `backend stores/protects evidence` → `review queue` → `authorised reviewer decision` → `status reflected in product` → `gated features/trust badges update where applicable`.

States may include concepts such as not started, submitted/in review, needs action, approved, rejected/failed.

Invariants:
- Clients cannot act as verification reviewers;
- ordinary Professionals cannot inspect other Professionals’ private evidence;
- evidence is retained/handled according to policy;
- reviewer actions are auditable;
- verification status cannot be self-approved from client UI.

## 4. Client marketplace discovery

`Client home/search` → `category/search/filter` → `results` → `professional/service detail` → `trust/review information` → `start conversation or job/booking path`.

Preserve:
- bounded/paginated search behaviour;
- filters do not mutate authoritative data;
- unavailable/empty results have useful states;
- provider trust/status information is accurate;
- desktop and mobile retain equivalent task hierarchy.

## 5. Professional service listing

`Professional opens listing management` → `create/edit service` → `backend validates ownership/category/price/scope` → `listing becomes discoverable according to status` → `Professional can update/manage own listing`.

Invariants:
- Professional cannot edit another user’s listing;
- Client cannot create Professional listing unless explicitly supported;
- accepted booking/payment state must not be mutated indirectly by editing a listing.

## 6. Client posts a job

`Client chooses category` → `enters job details/budget/location/timing` → `backend validates` → `job becomes available to eligible Professionals` → `responses arrive` → `Client reviews responses` → `conversation/booking hand-off`.

Preserve:
- Client owns their job;
- Professional response cannot silently modify job terms;
- expired/closed jobs are not treated as open;
- response lifecycle is auditable.

## 7. Professional responds to a job

`Professional discovers job` → `views scope` → `submits response/proposal` → `Client receives response` → `response accepted/declined/withdrawn according to lifecycle` → `conversation/booking context established`.

Invariants:
- only eligible/authenticated Professional can respond;
- one user cannot act on another Professional’s response;
- response decision state is explicit;
- accepted response does not bypass booking/payment safeguards.

## 8. Conversation → agreement → booking

`Client/Professional communicate` → `scope/price clarified` → `booking agreement created` → `Professional accepts/declines` → `schedule proposed/confirmed` → `transaction hand-off`.

Key invariants:
- thread participants only;
- agreed price must be valid/positive;
- booking status transitions are constrained;
- generic booking endpoints must not bypass SabiPay-funded work-state rules;
- accepted agreement changes are controlled/auditable.

## 9. Scheduling

`accepted booking` → `schedule proposal` → `other participant accepts/rejects/counters where supported` → `current schedule becomes authoritative` → `superseded proposals remain consistent`.

Preserve:
- participant permissions;
- no conflicting current schedule state;
- rescheduling does not silently reset payment/work state.

## 10. Messaging and realtime

`participant sends message` → `backend validates participant` → `message persisted` → `notification/event evidence created` → `realtime service broadcasts to intended recipient/room` → `other client updates`.

If realtime is unavailable:
- persisted message remains correct;
- history can be refreshed from backend;
- failed realtime delivery must not create duplicate authoritative messages.

Security invariants:
- no unauthorised thread access;
- JWT/authenticated socket access;
- recipient/room isolation;
- bounded event/payload behaviour.

## 11. Notifications

`business event` → `persisted notification/history` → `preference/delivery logic` → `realtime/push/email attempt where configured` → `delivery evidence`.

Examples include booking, message, verification, payment, dispute, review and support events.

Preserve persisted history independently of transient delivery providers.

## 12. SabiForum community

### Create post
`authenticated user` → `compose` → `backend validation` → `post persisted` → `feed/event update` → `engagement/moderation available`.

### Engagement
`like/comment/repost/follow interaction` → `backend validates` → `state persisted` → `notification side effect where applicable`.

### Moderation/reporting
`user reports` → `report persisted` → `authorised moderator reviews` → `action/audit evidence`.

Invariants:
- ownership permissions;
- moderator/staff permissions;
- signal-driven notification behaviour remains intact;
- removed/moderated content handling is consistent.

## 13. SabiPay transaction journey

Typical lifecycle:

`accepted booking/agreement` → `transaction created` → `payment initialised` → `provider/payment verified/reconciled` → `funded` → `work authorised to start` → `Professional delivers/completes` → `Client confirms OR dispute path` → `release/refund/resolution`.

### Important states
The backend explicitly distinguishes payment conditions such as not started, pending, succeeded, failed, abandoned and mismatch where implemented.

### Safety invariants
- payment retries are idempotent/safe;
- provider reference/state is reconciled;
- duplicate charge path is prevented;
- work cannot be started through a generic marketplace shortcut that bypasses required funded state;
- release/refund/dispute actions are permissioned;
- transaction evidence remains auditable;
- failure/retry does not fabricate success.

## 14. Dispute journey

`eligible participant opens dispute` → `reason/evidence submitted` → `transaction progression frozen as required` → `authorised operations/finance review` → `resolution decision` → `release/refund/resume outcome` → `audit + notifications`.

Preserve:
- evidence privacy;
- participant visibility rules;
- staff least privilege;
- no silent financial mutation;
- audit trail.

## 15. Reviews/reputation

`eligible completed/released transaction` → `Client submits review` → `backend validates eligibility/one-review rules` → `provider reputation aggregates update` → `reported review can enter moderation`.

Preserve eligibility and anti-duplication rules.

## 16. Support journey

`authenticated user opens support case` → `case persisted` → `user sees permitted case information` → `Support Agent/Operations sees internal fields` → `notes/escalation/action` → `audit evidence` → `user-facing resolution/status`.

Internal notes must not leak to end users.

## 17. Operations/admin journey

`staff signs in through authorised admin path` → `group/permission determines visibility/actions` → `review/support/moderation/finance/config work` → `material action audited`.

Invariants:
- product role is not enough for staff access;
- superuser is distinct;
- least privilege;
- configuration must not become a secret-storage shortcut;
- audit evidence retained.

## 18. Cross-device continuity

A user may begin a journey on one client and continue on another.

Examples:
- create job on web → receive/respond to messages on mobile;
- start verification on mobile → check status on web;
- fund transaction on web → check status on mobile;
- community post on one client → notifications on another.

Therefore canonical state belongs in backend, not device-local-only state.

## 19. Failure states that must remain safe

Critical journeys should tolerate:
- network interruption;
- realtime interruption;
- payment provider failure;
- duplicate user action/retry;
- expired token;
- stale UI state;
- invalid role/permission;
- database readiness failure;
- empty search/results.

The expected behaviour is clear error/retry/fallback, never silent corruption or fabricated success.

## 20. Using this document during a change

Before changing a page/API/component:
1. identify which journey section applies;
2. state which invariants must be preserved;
3. inspect backend + both clients if the journey is cross-platform;
4. add targeted regression for the new/old behaviour;
5. update this document if the intended journey itself changes.
