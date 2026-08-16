# Phase 0 — Open Decisions & Owners

Only decisions that still affect the Phase 0 exit gate remain here.

| Decision | Recommended decision | Owner | Status |
|---|---|---|---|
| Mobile framework | KEEP existing React Native + Expo implementation; do not re-platform without evidence | Technical/Product owner | CLOSED |
| Web framework | KEEP existing Next.js implementation; improve in place | Technical/Product owner | CLOSED |
| Shared API | KEEP Django/DRF as authoritative business/API layer | Technical owner | CLOSED |
| Realtime | KEEP Express/Socket.IO provisionally as delivery transport; Django remains business-state authority | Technical owner | CLOSED for Phase 0; re-evaluate Phase 6 |
| Shared admin | KEEP one Django/staff administrative authority; no separate mobile admin | Product/Technical owner | CLOSED |
| Repository model | KEEP current monorepo | Technical owner | CLOSED |
| Credential rotation | Confirm all credentials exposed historically have been rotated/revoked | Organization owner | OPEN — manual evidence required |
| Main branch protection | Confirm public-repository protection is enforced: PR required, checks required, conversations resolved, suitable review control | Organization owner | OPEN — connector cannot verify |
| Backup ownership/access | Ensure at least one trusted backup organization owner/admin and least-privilege developer access | Organization owner | OPEN — manual org governance action |
| Staging ownership | Name staging owner/release approver and confirm isolated staging credentials/data | Product/Technical owner | OPEN |
| Figma source | Provide/record the canonical SabiWay mobile Figma file URL/key so screen-by-screen audit can be completed | Product/Design owner | OPEN |
| Role authority | Use the account identity model as the single role/permission authority; remove independent role mutation elsewhere | Technical owner | DECISION CLOSED; implementation audit continues in Phase 3 |
| Analytics ownership | Define canonical product-event naming and collection point before measurement implementation | Product/Technical owner | DEFERRED to Phase 11 design, but event hooks required per phase |

## Rule

A manual governance item may remain operationally pending after the documentation PR, but Phase 0 cannot be marked fully certified until all items labelled OPEN above either have evidence or an explicitly accepted risk owner/date.
