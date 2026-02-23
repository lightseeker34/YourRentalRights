# YourRentalRights QA Task List (Incremental + Push Each Fix)

Status key: [ ] todo, [~] in progress, [x] done

## Completed Tonight
- [x] Railway deploy stabilized (DB/env/session startup issues resolved)
- [x] R2 upload pipeline integrated
- [x] R2 image rendering fixed (route + Cloudflare hotlink rule)
- [x] Timeline thumbnails rendered side-by-side with tight spacing
- [x] Timeline icon parity fix for Service Request (wrench icon)

## QA Backlog (from earlier review + live testing)
- [ ] Export unlock clarity: make requirements explicit in UI (checklist + counter)
- [ ] Incident vs Log terminology consistency pass (microcopy + labels)
- [ ] Save confirmation/state refresh confidence pass (toasts + optimistic state)
- [ ] Missing `/api/content/*` keys: seed defaults or return graceful fallbacks
- [ ] Accessibility warnings in dialogs (`DialogTitle`/`Description`) cleanup
- [ ] Image loading fallback polish (prevent transient placeholder swap)
- [ ] Incident timeline visual density tune for mobile + desktop parity
- [ ] Incident page: remove "Add Log" label and move action buttons closer to incident card
- [ ] Add smoke-test checklist and run after each deploy

## Process Rules
1. Pick one item.
2. Implement smallest safe fix.
3. Build locally.
4. Commit + push.
5. Verify in production.
6. Record result in `QA_PROGRESS.md`.
