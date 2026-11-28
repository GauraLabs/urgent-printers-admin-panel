# Customers operator tutorials

Two separate Hindi-English lessons teach Customer Management and the Customer Reviews Lifecycle. The saved recipes use the same deep male Brian voice, subtitles, smooth camera, animated cursor and original typing/click Foley as the earlier tutorials. Final exports must be native 3840×2160 and 1920×1080, H264/AAC at 30 fps, fully decoded, with every rendered scene visually reviewed. Captured screenshots are not labelled finished videos.

## Operator coverage and current limits

Customer Management covers list columns, search by email, status filters, profile/verification, order history and a linked order, saved addresses, available activity history, the mail-app shortcut, ban confirmation, actual denied sign-in, reinstatement and actual restored sign-in. The admin profile/address views have no create/edit forms. Customer totals sum order amounts; they must not be described as settled collections. The activity feed currently includes orders/reviews rather than every login/profile event. Customer ban confirmation mentions email, but the status endpoint does not dispatch ban emails. The lesson states this limitation and never sends mail.

Reviews covers a genuinely delivered, previously recorded tutorial order, customer Write a Review, rating/title/body entry, Pending moderation, linked order verification, approved-only storefront visibility, approval, saved admin reply, corrected reply, rejection/hiding and republication. The storefront currently drops admin replies from its rendering, despite the API returning them; replies are verified in the admin dialog and are never falsely presented as visible on the public page. Customer edit/delete buttons do not exist in the current UI, so no developer API calls are taught as operator actions. The low-rating rejection caveat and the fact that rejection is not deletion are explicit.

## Rebuild and preservation

Use the existing admin (3001), storefront (3000) and isolated development read API (8000):

```bash
TUTORIAL_API_PORT=8000 ../urgent-printers-backend/.venv/bin/python qa-pipeline/tutorials/catalog-production/dev-api.py
node qa-pipeline/tutorials/customer-production/build.mjs --gl=vulkan --concurrency=2
```

Reuse saved captures, rebuilding only the affected lesson when needed:

```bash
node qa-pipeline/tutorials/customer-production/narrate.mjs
node qa-pipeline/tutorials/customer-production/build.mjs --reuse-capture --feature=customer-management --gl=vulkan --concurrency=2
node qa-pipeline/tutorials/customer-production/collection.mjs
```

Narration/callouts/chapters are in each `customer-*/content.json`. Browser workflows are in `qa-pipeline/playwright/specs/customer-tutorial.flows.js`; shared capture utilities are in `customer-tutorial.helpers.js`. Each lesson has its own spec, plan, run evidence, shotlist, native 6400×3600 before/after plates and measured narration cache. Shared rendering/normalization/verification remains in `catalog-production`.

ElevenLabs credentials stay outside the projects at `~/.config/urgentprinters-tutorials/.env.local`. A matching previously measured outro is reused without an API call. Unchanged narration clips are retained by text/voice hash. If quota is exhausted, `video/renders/customer-training/production-status.json` and `narration-pending.json` identify the incomplete work and exact resume commands. No silent final movies are substituted for missing narration.

`prepare.py` requires the previously owned order tutorial buyer/product/delivered order. Its private snapshot/session is `~/.config/urgentprinters-tutorials/customer-tutorial-session.json` (0600), excluded from archives. Only this known fictional buyer is banned/reinstated. The owned product/category are temporarily activated; original customer fields, catalogue visibility, rating/count and timestamps are restored with guards against unrelated changes. Only the newly tracked tutorial review is removed; original reviews are never deleted or overwritten. Existing orders and audit history remain intact. Cache invalidation/revalidation restores public visibility too.

Outbound providers are fake, and the recording API uses a private memory task broker. No real email, payment, refund, courier booking or customer order is needed. The expected denied login is performed outside a capture step with passwords filled privately; the lesson captures the real resulting generic error state and records HTTP 403 evidence. Private traces, original snapshots, tokens and passwords never enter production archives.

The original training artwork thumbnail can be absent from FakeStorage. The capture serves the exact previously uploaded `order-lifecycle/assets/customer-artwork.png` bytes only for this owned buyer and filename; it does not invent media or replace API data.

`review-captures.mjs` creates a local Before/After step inspector at `video/renders/customer-training/review.html`. It is explicitly labelled captured footage with narration pending, not a finished video. Keep its relative screenshot folders together when extracting a source archive.

The `frontend-reference/` and `backend-reference/` folders preserve the relevant UI/API sources used for this recording. They are references, not replacements for the live sibling projects. Full source/capture work archives are produced by `archive-work.mjs`; the final four-video collection is produced by `collection.mjs` only after both narrated lessons pass full verification.
