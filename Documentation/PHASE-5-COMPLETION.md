# Phase 5 — Private messaging, negotiation, booking and scheduling

## Outcome

Convert marketplace discovery into a clear, private and auditable service agreement across web and mobile.

## Delivered scope

### Private messaging
- `MessageThread` links the client and professional and can preserve the originating service listing, job and professional job response.
- `Message` persists sender, body, safe attachment metadata, read state and timestamp.
- authenticated Socket.IO delivery targets only the recipient user room.
- database persistence is authoritative; realtime broadcast failure does not roll back a successful message or booking mutation.
- unread messages can be marked read per thread.
- open-thread creation is idempotent for a listing or job response so repeated taps do not create duplicate conversations.

### Safety and privacy
- participants only can list a thread or its messages.
- block/unblock prevents further messaging while a block is active.
- conversation/message reporting creates reviewable support metadata.
- reports cannot reference a message from another conversation.
- safe attachments are limited to JPEG, PNG, WebP, PDF and plain text, maximum 10 MB.
- mobile provides system document selection and camera capture using Expo SDK 57 pickers.
- when `PREBOOKING_CONTACT_BLOCK_ENABLED=True`, phone numbers and email addresses are rejected until the booking has been accepted.
- Django admin exposes conversation support metadata, reports, blocks, bookings and immutable booking audit events without registering private message bodies for routine admin browsing.

### Negotiation and booking
- clients can create a booking summary only from a conversation they own.
- booking captures agreed scope, price, three-letter currency and timezone.
- the originating listing/job/job response remains linked to the booking for auditability.
- only the professional can accept or decline the initial booking agreement.
- controlled transitions cover pending, accepted, declined, cancelled, in-progress and completed states.
- booking status changes are audit logged with actor and before/after state.

### Scheduling
- scheduling is available only after booking acceptance.
- either participant can propose a future date/time plus timezone and note.
- a new proposal supersedes the previous outstanding proposal.
- only the other participant can accept or decline/request change.
- an accepted proposal becomes the booking schedule and timezone.
- schedule proposals and decisions create audit events and targeted realtime updates.

### Web
- `/messages` provides responsive inbox, private conversation, safe attachment picker, reporting/blocking, booking summary and scheduling.
- Marketplace service detail now starts or resumes the correct private conversation.
- professional job response now converts directly into the linked conversation.
- marketplace navigation exposes Messages.
- desktop uses a three-pane inbox/conversation/agreement layout; narrower screens stack the workflow while keeping the same state and controls.

### Mobile
- authenticated app navigation now includes Messages.
- inbox, unread state, realtime refresh, private conversation and booking/schedule panels are implemented.
- compact devices switch between Conversation and Booking panels; wider devices keep split-pane behaviour.
- document picker and camera photo attachment flows enforce the same 10 MB client-side limit before upload and the backend repeats MIME/size validation.
- keyboard avoiding behaviour is enabled for iOS message composition.
- date/time presentation uses the device locale while the timezone identifier is preserved in the API.

## Automated journey coverage

The marketplace test suite now covers:
1. Phase 4 discovery and client/professional role boundaries remain intact.
2. Client listing discovery → private conversation → persisted message.
3. Pre-booking contact details rejected.
4. Client creates booking summary with scope, price and currency.
5. Professional accepts the booking.
6. Contact details are allowed after acceptance.
7. Professional proposes a future schedule with timezone.
8. Client accepts the schedule and the booking is updated.
9. Unread messages are marked read.
10. Professional job response → linked conversation → linked booking.
11. Conversation report creation.
12. Blocking prevents either side from continuing the conversation.
13. A non-participant cannot read thread messages or create its booking.
14. Unsafe attachment MIME types are rejected.
15. Booking and scheduling actions create auditable events.

## Responsive/device audit matrix

| Surface | Compact phone | Large phone | Tablet | Desktop/web |
|---|---|---|---|---|
| Inbox navigation | stacked | stacked | split | three-pane |
| Conversation composer | keyboard-aware | keyboard-aware | split | dedicated pane |
| Booking agreement | tab/panel | tab/panel | split | dedicated pane |
| Unread state | supported | supported | supported | supported |
| Reconnect/realtime | Socket.IO reconnect | Socket.IO reconnect | Socket.IO reconnect | Socket.IO reconnect |
| Document attachment | system picker | system picker | system picker | browser picker |
| Camera attachment | native camera | native camera | native camera where available | not presented as native camera |
| Timezone display | device locale + timezone | device locale + timezone | device locale + timezone | browser locale + timezone |

## Accessibility and resilience implementation audit
- buttons and controls use text labels rather than colour-only meaning.
- mobile actions use minimum touch-friendly heights in the primary interaction paths.
- destructive block actions require confirmation on mobile.
- empty inbox/conversation states are explicit.
- API permissions are enforced server-side and do not rely on hidden UI controls.
- persisted state remains authoritative during realtime disconnect/reconnect.
- attachment validation is enforced on both the client interaction and backend upload path.
- long message bodies are rendered as wrapping text rather than fixed-height content.

## Operational configuration

Backend:
- `PREBOOKING_CONTACT_BLOCK_ENABLED=True` enables the contact-detail policy.
- `EXPRESS_URL` points Django at the realtime service.
- `INTERNAL_BROADCAST_TOKEN` authenticates Django → realtime broadcasts.

Realtime:
- `JWT_SIGNING_KEY` verifies Socket.IO access tokens.
- `INTERNAL_BROADCAST_TOKEN` must match the backend value.
- `/broadcast-marketplace` permits only `new-message`, `booking-updated` and `schedule-updated` targeted events.

Mobile:
- Expo SDK 57 lockfile includes `expo-document-picker`, `expo-image-picker` and `socket.io-client`.

## Release evidence

Repository release gate must pass:
- repository hygiene
- Django system check
- migration drift
- accounts/posts/notifications/marketplace automated journeys
- realtime syntax/check
- frontend TypeScript
- frontend lint
- mobile `npm ci`
- mobile TypeScript
- waitlist syntax

Physical camera permission prompts, OS document-provider behaviour and soft-keyboard layouts still require runtime confirmation on the actual target iOS/Android devices before production release. That runtime verification is a deployment/device evidence item, not a missing Phase 5 application contract.

## Phase boundary

Phase 5 stops at the agreed booking and schedule lifecycle.

Phase 6 owns provider verification and the shared verification admin workflow.
Phase 7 owns SabiPay escrow/payment state.
Phase 8 owns dispute resolution, reviews and post-service operational trust controls.
