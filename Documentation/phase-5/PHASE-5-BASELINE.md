# Master Phase 5 — Community, Content & Engagement Baseline

Status: CERTIFIED
Branch: `feat/phase-5-community-content-engagement`
Base: certified Phase 4 `main` (`2f70ffa270297670385239b05cd5096520e4e905`)

## Objective

Deliver SabiForum as one coherent, safe, accessible and performant community experience across Web, Android and iOS without duplicating the substantial content and moderation capability that already exists in Django.

This phase followed the Master Playbook sequence: inspect first, understand second, decide third, design fourth, build fifth, test sixth.

## Architectural decisions

### Backend content domain — KEEP / IMPROVE

`Backend/posts/` remains the authoritative community domain. Existing models and APIs cover posts, images, hashtags, likes, comments, replies, nested replies, comment/reply likes, bookmarks, reposts, impressions, reports and moderation audit events.

No parallel community data model or search service was introduced.

### Moderation — KEEP / HARDEN

Django remains authoritative for moderation state and permissions. Web moderation is a staff surface over the existing report/audit lifecycle. Client-side visibility is never treated as authorisation.

The final Phase 5 lifecycle is enforced server-side:
- `OPEN -> DISMISSED`;
- `OPEN -> REMOVED`;
- `REMOVED -> RESTORED`;
- `DISMISSED` and `RESTORED` are terminal for that report.

Every moderation decision requires a moderator note. Invalid transitions return a conflict response and do not mutate moderation state.

### Web SabiForum — REFACTOR / MERGE

The old SabiForum-specific global navigation has been removed from the community page. Phase 4 `AppShell` owns authenticated product navigation. The community page keeps only local feed controls such as create, search/reset and retry.

### Mobile SabiForum — KEEP / REFACTOR

The existing mobile community screen was retained and expanded rather than replaced. It now uses the existing Django endpoints for replies, reporting, ownership mutations and media.

## Implemented backend hardening

- removed `phone_number` from public comment/reply user payloads;
- blocked comments and replies against hidden posts at serializer level;
- blocked nested replies whose parent belongs to a different comment;
- required meaningful text or image for posts/comments/replies;
- bounded SabiForum page-size requests to 50 while preserving the existing default page size;
- kept owner-only post/comment/reply mutation permissions server-side;
- added regression coverage for privacy, hidden-post interaction, reply integrity and pagination;
- added regression coverage for post-delete profile counters, comment-delete post counters and realtime delete broadcasts;
- retained report/remove/restore audit, staff-only moderation access and authenticated realtime broadcast transport;
- added moderation transition regression coverage for invalid restore-before-remove, invalid dismiss-after-remove, terminal restored reports and mandatory moderator notes.

## Implemented Web parity

- `/community` uses the shared authenticated `AppShell`;
- duplicate `CommunityNavbar` product navigation removed from the community page;
- local feed toolbar owns only SabiForum actions;
- loading, empty and persistent error/retry states are present;
- existing Web post cards retain create/edit/delete/media/comments/replies/bookmarks/reposts/reporting capability;
- `/community/moderation` now exposes only actions valid for each report status;
- moderation actions require a note before submission;
- closed moderation reports show their recorded decision state rather than impossible action buttons.

## Implemented Android / iOS parity

Mobile SabiForum supports:
- feed loading and pull-to-refresh;
- persistent feed error + retry;
- create text or image post;
- render post/comment/reply images;
- owner-only Edit/Delete affordances backed by Django authorisation;
- edit text and replace/add post image;
- delete confirmation + deleting state;
- optimistic like/unlike with reconciliation;
- bookmark/unbookmark;
- repost;
- comments with persistent load error + retry;
- replies with persistent load error + retry;
- image attachments for comments and replies using the existing Expo ImagePicker dependency and Django image fields;
- in-app reporting sheet with reason, cancel, submit and submitting states rather than platform-dependent `Alert.prompt`.

## Discovery boundary

Phase 4 established `/api/search/` as the authoritative SabiForum discovery API for posts, profiles and hashtags. Phase 5 reuses that boundary. Existing posts-domain hashtag/trending endpoints remain specialised content endpoints and are not a second general search service.

## Accessibility / complete states

Target remains WCAG 2.2 AA on Web and equivalent accessible mobile interactions.

Implemented or retained states include loading, empty, error/retry, disabled/submitting, success feedback, permission-controlled ownership actions, long content and media previews.

Device-level VoiceOver/TalkBack/focus and offline behaviour remain part of later controlled user-testing certification rather than a reason to duplicate Phase 5 implementation.

## Performance

- SabiForum feed is paginated;
- maximum requested page size is 50 rather than 400;
- Web retains incremental loading;
- mobile avoids unbounded feed downloads;
- optimistic mutations reconcile on failure;
- media reuses existing Cloudinary-backed fields rather than creating another upload system.

## Safety and moderation

Certified boundaries include:
- owner-only content mutation permissions;
- hidden content excluded from ordinary feed/retrieve paths;
- staff-only moderation queue/actions;
- authoritative moderation transition lifecycle;
- mandatory decision notes;
- moderation audit records;
- remove/restore realtime events;
- privacy-safe public comment/reply payloads.

## Analytics by design

Phase 5 event catalogue remains defined for later analytics implementation:
- feed viewed;
- post composer opened;
- post published/failed;
- reaction toggled;
- comment/reply published/failed;
- bookmark toggled;
- repost completed;
- hashtag/profile discovery opened;
- content reported;
- moderation decision completed.

Private post/comment text must not be sent as analytics properties.

## Vercel / deployment review

Phase 5 completed the initial Vercel audit.

Verified configuration:
- Vercel project: `sabiway2026`;
- framework: Next.js;
- project is not marked live/production;
- builds are correctly scoped to the `frontend` application (`frontend@0.1.0`, Next.js 15.5.7);
- GitHub feature-branch commits automatically create preview deployments;
- recent successful previews show the frontend is buildable;
- earlier cancellations/rate-limit pressure are consistent with high preview-build volume rather than a persistent application failure.

Decision:
- no monorepo root-directory change is required;
- no duplicate manual deployment was created;
- preview frequency should be controlled before wider testing/production;
- Platform CI remains the code-certification gate, with Vercel preview readiness as supplementary evidence.

## CI evidence

- Platform CI #194 passed the backend safety/privacy slice.
- Platform CI #199 passed the shared Web shell + mobile replies/reporting/retry slice.
- Platform CI #202 caught one React Native type compatibility typo while all other jobs passed; it was corrected without changing behaviour.
- Platform CI #204 passed the full ownership + post/comment/reply media code head `a3e793baece081b55842d7a5fb02a993499f7dc6`.
- Platform CI #205 passed the documentation-aligned head `ef9c3c0b051eeb1ca74d90773abea979681f4b05`.
- Final changed-file audit confirmed Phase 5 is scoped to the posts backend, Phase 5 documentation, Web community/moderation and mobile community surfaces.
- Platform CI #208 passed the final moderation lifecycle head `262910e9c39feccb83673466a409cec8dab95166` across backend journeys, frontend TypeScript/lint, mobile typecheck, realtime, design-system, repository hygiene and waitlist syntax.

## Certification

Phase 5 is certified for merge under the Master Playbook Phase 5 scope.

The next master phase is Phase 6 — Messaging, Realtime & Notifications. Production rollout and controlled user-testing readiness remain governed by later phases and the programme-wide security/reliability gates.
