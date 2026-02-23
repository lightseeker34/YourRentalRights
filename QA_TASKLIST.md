# YourRentalRights QA Task List (Incremental + Push Each Fix)

Status key: [ ] todo, [~] in progress, [x] done

## Completed Tonight
- [x] Railway deploy stabilized (DB/env/session startup issues resolved)
- [x] R2 upload pipeline integrated
- [x] R2 image rendering fixed (route + Cloudflare hotlink rule)
- [x] Timeline thumbnails rendered side-by-side with tight spacing
- [x] Timeline icon parity fix for Service Request (wrench icon)

## QA Backlog (from earlier review + live testing)
- [x] Export unlock clarity: make requirements explicit in UI (checklist + counter)
- [x] Incident vs Log terminology consistency pass (microcopy + labels)
- [x] Save confirmation/state refresh confidence pass (toasts + optimistic state)
- [x] Missing `/api/content/*` keys: seed defaults or return graceful fallbacks
- [x] Accessibility warnings in dialogs (`DialogTitle`/`Description`) cleanup
- [x] Image loading fallback polish (prevent transient placeholder swap)
- [x] Incident timeline visual density tune for mobile + desktop parity
- [x] Incident page: remove "Add Log" label and move action buttons closer to incident card
- [x] Add smoke-test checklist and run after each deploy

## Process Rules
1. Pick one item.
2. Implement smallest safe fix.
3. Build locally.
4. Commit + push.
5. Verify in production.
6. Record result in `QA_PROGRESS.md`.
