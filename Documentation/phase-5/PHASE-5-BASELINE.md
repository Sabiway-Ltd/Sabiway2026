# Master Phase 5 — Community, Content & Engagement Baseline

Status: IMPLEMENTATION / FINAL HARDENING
Branch: `feat/phase-5-community-content-engagement`
Base: certified Phase 4 `main` (`2f70ffa270297670385239b05cd5096520e4e905`)

## Objective

Deliver SabiForum as one coherent, safe, accessible and performant community experience across Web, Android and iOS without duplicating the substantial content and moderation capability that already exists in Django.

This phase follows the Master Playbook sequence: inspect first, understand second, decide third, design fourth, build fifth, test sixth.

## Architectural decisions

### Backend content domain — KEEP / IMPROVE

`Backend/posts/` remains the authoritative community domain. Existing models and APIs cover posts, images, hashtags, likes, comments, replies, nested replies, comment/reply likes, bookmarks, reposts, impressions, reports and moderation audit events.

No parallel community data model or search service has been introduced.

### Moderation — KEEP / HARDEN

Django remains authoritative for moderation state and permissions. Web moderation is a staff surface over the existing report/audit lifecycle. Client-side visibility is never treated as authorisation.

### Web SabiForum — REFACTOR / MERGE

The old SabiForum-specific global navigation has been removed from the community page. Phase 4 `AppShell` now owns authenticated product navigation. The community page keeps only local feed controls such as create, search/reset and retry.

### Mobile SabiForum — KEEP / REFACTOR

The existing mobile community screen is retained and expanded rather than replaced. It now uses the existing Django endpoints for replies, reporting, ownership mutations and media.

## Implemented backend hardening

- removed `phone_number` from public comment/reply user payloads;
- blocked comments and replies against hidden posts at serializer level;
- blocked nested replies whose parent belongs to a different comment;
- required meaningful text or image for posts/comments/replies;
- bounded SabiForum page-size requests to 50 while preserving the existing default page size;
- kept owner-only post/comment/reply mutation permissions server-side;
- added focused regression coverage for privacy, hidden-post interaction, reply integrity and pagination;
- added regression coverage for post-delete profile counters, comment-delete post counters and realtime delete broadcasts;
- existing tests already cover report -> remove -> restore audit events, staff-only moderation access and authenticated realtime broadcast transport.

## Implemented Web parity

- `/community` uses the shared authenticated `AppShell`;
- duplicate `CommunityNavbar` product navigation removed from the community page;
- local feed toolbar owns only SabiForum actions;
- loading, empty and persistent error/retry states are present;
- existing Web post cards retain create/edit/delete/media/comments/replies/bookmarks/reposts/reporting capability;
- existing `/community/moderation` staff route is retained for the moderation workflow.

## Implemented Android / iOS parity

Mobile SabiForum now supports:
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

Final manual user-testing certification must still verify device-level focus/VoiceOver/TalkBack behaviour and offline/connection failure handling.

## Performance

- SabiForum feed is paginated;
- maximum requested page size is now 50 rather than 400;
- Web retains incremental loading;
- mobile avoids unbounded feed downloads;
- optimistic mutations reconcile on failure;
- media reuses existing Cloudinary-backed fields rather than creating another upload system.

## Safety and moderation status

Verified existing capability:
- owner-only content mutation permissions;
- hidden content excluded from ordinary feed/retrieve paths;
- staff-only moderation queue/actions;
- report lifecycle and audit records;
- remove/restore realtime events;
- privacy-safe public profile/comment/reply payloads.

Final hardening item identified by Phase 5 audit:
- moderation action transitions are currently exposed too broadly in the Web staff UI and must be treated as a server-side lifecycle rule first. Do not rely on hiding buttons in the client as authorisation.

## Analytics by design

Required Phase 5 event catalogue remains:
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

Do not send private post/comment text as analytics properties.

## Vercel / deployment review

The previous programme hold was "until Phase 5". Phase 5 has now completed the initial Vercel audit.

Verified configuration:
- Vercel project: `sabiway2026`;
- framework: Next.js;
- project is not marked live/production;
- the build is correctly scoped to the `frontend` application: build logs identify `frontend@0.1.0` and Next.js 15.5.7;
- recent preview deployments are being created automatically from GitHub feature-branch commits;
- recent successful previews demonstrate the project is buildable;
- earlier cancellations/rate-limit pressure are consistent with the high volume of automatic preview builds rather than a persistent application build failure.

Decision:
- no monorepo root-directory change is required;
- do not create an additional manual deployment merely to duplicate GitHub-triggered previews;
- deployment frequency should be controlled before wider testing/production so every small implementation commit does not consume unnecessary build capacity;
- repository Platform CI remains the code-certification gate; Vercel preview readiness is supplementary evidence.

## CI evidence

- Platform CI #194 passed the first backend safety/privacy slice.
- Platform CI #199 passed Web AppShell + mobile replies/reporting/retry parity.
- Platform CI #202 passed backend, Web, realtime, design-system and repository checks but caught one React Native type compatibility issue (`StyleSheet.absoluteFillObject`).
- That compatibility issue was corrected without changing behaviour.
- Current final media-parity head: `a3e793baece081b55842d7a5fb02a993499f7dc6`; Platform CI #204 is running.

## Remaining Phase 5 certification gates

1. Platform CI green on the current final media-parity head.
2. Server-side moderation transition-rule hardening and matching staff UI state, or explicit documented deferral if the authoritative backend lifecycle already proves sufficient after deeper inspection.
3. Final changed-file / regression audit.
4. Update PR evidence and mark ready only after the above gates pass.

Phase 5 is not certified until Web + Android + iOS community journeys and moderation boundaries pass the final gate.
