# System operator tutorials

Eight lessons teach Staff Access, Staff Notification Preferences, Activity Log, Settings Overview, Emergency Order Halt, Cash on Delivery, System Health and Pricing Diagnostics. Each uses plain Hindi with English UI labels, captions, animated cursor, smooth camera moves and original click/typing sounds. Final delivery requires both 1920×1080 and native 3840×2160 H264/AAC exports at 30 fps, full-file decoding and a visual review of every scene.

## Current website limitations

`src/lib/api/settings.ts` still returns delayed static values. General business/contact/localisation, ordinary Operations fields, customer notification/global admin alert toggles and Razorpay/Paytm gateway fields do not persist. The overview states this clearly; the videos never claim these forms configure the live website. Implementing their backend persistence is outside this recording task.

The real saved settings are `GET/PUT /admin/settings/order-halt` and `/admin/settings/cod`. Order halt saves immediately through its confirmation dialog. COD uses its own Save COD settings button. Staff preferences also save immediately, per event and channel. A channel toggle does not prove delivery, and Push requires a registered device. Health monitoring/rechecking does not repair a service. Marking a pricing mismatch resolved does not alter prices, orders, payments or refunds.

Pricing diagnostics uses one explicitly labelled training example stored in the development database, with real list/filter/resolve/unresolve API calls. Its example amount comparison is illustrative; no customer incident or actual pricing repair is claimed. Health states are observed from the real development system, including Unknown/no traffic; no green service statuses, fake job completions or fake alert deliveries are substituted.

## Rebuild

Start admin on 3001 and storefront on 3000, then the isolated read API:

```bash
TUTORIAL_API_PORT=8000 ../urgent-printers-backend/.venv/bin/python qa-pipeline/tutorials/catalog-production/dev-api.py
node qa-pipeline/tutorials/system-production/build.mjs --gl=vulkan --concurrency=2
```

For an existing recording, after a narration or editorial change:

```bash
node qa-pipeline/tutorials/system-production/build.mjs --reuse-capture --feature=system-staff --gl=vulkan --concurrency=2
node qa-pipeline/tutorials/system-production/collection.mjs
```

The eight `system-*/content.json` files hold narration, callouts and chapters. Shared actions are in `qa-pipeline/playwright/specs/system-tutorial.flows.js`; recording/auth/verification helpers are in `system-tutorial.helpers.js`. Each lesson has a separate spec. Shared production/render/verify scripts are under `catalog-production`. Native source plates are 6400×3600.

ElevenLabs credentials stay in `~/.config/urgentprinters-tutorials/.env.local`, outside the repositories and archives. Brian is the same male Hindi-English voice used for previous tutorials. Narration caches are retained by line text hash so unchanged lines do not consume more credits. Do not substitute silent audio and call it a narrated final video when the API quota is exhausted.

## Development state and privacy

`prepare.py prepare` requires the existing owned order tutorial account/product, and creates two owned staff fixtures and one training mismatch. It privately backs up original COD/order-halt rows and the existing tutorial product status. The recording API uses fake outbound providers and a private memory task broker: no real invite/alert, charge, customer order, courier booking or worker execution is needed.

Every modified singleton is restored after its lesson with an `updated_at` guard against concurrent changes. After all recordings finish, `prepare.py restore all` verifies originals, removes only owned staff/preferences and the training mismatch, and restores the tutorial product status. Audit history remains intact. The CSV export is verified in the external private directory and is excluded from archives. Private traces, sessions, login credentials and original database snapshots are excluded too.

Each final export has a quality report, chapter file, subtitles, actual-render contact sheet and SHA256. The production archive retains editable source, raw plates, measured audio and both finished movies. Regenerable JPEG frames are pruned only after a verified archive, to conserve disk.

The in-progress work archive is created with `node qa-pipeline/tutorials/system-production/archive-work.mjs`. Its production-status file explicitly distinguishes recorded footage, measured narration and verified finished movies. Extract it into a separate directory for review; rebuilding fresh captures requires the existing admin, storefront and backend projects. The complete lesson player/archive is created only after all sixteen narrated exports pass verification.

For a paused narration run, `qa-pipeline/artifacts/video/renders/system-training/narration-pending.json` records the missing clips and exact resume commands. Its feature filter preserves the already finished Staff exports. `production-status.json` records the status of all eight lessons without treating captured screenshots as completed movies.
