# QA Smoke Test Checklist

Run after every deploy to `main`.

## Quick run (automated)

```bash
npm run qa:smoke
```

For non-production environments:

```bash
npm run qa:smoke -- https://<your-env-url>
```

## What this validates

1. **App shell is live**
   - `GET /` returns HTTP `200`
   - HTML contains `YourRentalRights.com`
2. **Content API fallback behavior**
   - `GET /api/content/qa-smoke-test-key` returns HTTP `200`
   - Body includes `"fallback":true`
3. **Auth boundary is intact**
   - `GET /api/user` returns HTTP `401` for anonymous clients

## Manual spot-checks (2 minutes)

1. Open production site and sign in with QA account.
2. Open an incident page and confirm:
   - Incident card loads.
   - Timeline entries render with icons and thumbnails.
   - Save/edit action shows expected toast feedback.
3. Open AI Analysis area and confirm unlock checklist/counter is visible.

## Record keeping

After each run, append results to `QA_PROGRESS.md` with:
- Date/time
- Environment URL
- Pass/fail summary
- Any blocker and next step
