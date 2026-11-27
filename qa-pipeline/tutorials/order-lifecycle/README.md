# Full order lifecycle tutorial

Hindi-English narration in the same clear Brian male voice, animated cursor, smooth zooms, typing/click sounds and captions. Exports: 1080p and native 4K at 30 fps, with synchronized SRT, chapter timestamps and a visual scene review sheet.

## Workflow

Storefront configuration and customer artwork → cart → COD checkout → customer order → admin note and confirmation → real PDF invoice → proof v1 → customer revision request → revised proof v2 → customer approval → Ready to Print → Printing → Ready to Dispatch → packaging review → manual courier record → pickup → transit → out for delivery → delivered. The final chapter distinguishes COD delivery from payment collection and demonstrates cancellation plus a fake-provider refund on an explicitly simulated prepaid fixture.

The main order is actually created through the storefront, and business API responses are not mocked. Proof approval uses the authenticated customer's real controls, rather than the existing queue's placeholder staff Approve/Reupload actions. All production and tracking changes are actual development database updates. Physical printing/delivery are demonstrated state changes, not claims that a parcel was physically produced or shipped.

## Rebuild

Start the admin on localhost:3001, storefront on localhost:3000 and normal development read API on localhost:8000. From the admin repository:

```bash
# In a separate terminal, if the read API is stopped:
TUTORIAL_API_PORT=8000 ../urgent-printers-backend/.venv/bin/python qa-pipeline/tutorials/catalog-production/dev-api.py
# In the recording terminal:
node qa-pipeline/tutorials/order-lifecycle/build.mjs --gl=vulkan --concurrency=2
# Reuse the capture; unchanged measured narration is cached:
node qa-pipeline/tutorials/order-lifecycle/build.mjs --reuse-capture --gl=vulkan --concurrency=2
# Resume an interrupted render without another checkout or API synthesis:
node qa-pipeline/tutorials/catalog-production/resume-render.mjs --feature=order-lifecycle --gl=vulkan --concurrency=2
# Preserve verified captures and editable inputs before narration is complete:
node qa-pipeline/tutorials/order-lifecycle/review-capture.mjs
node qa-pipeline/tutorials/order-lifecycle/archive-source.mjs
```

Source checkpoint archives end in `-source.tar.gz` and explicitly identify missing narration. They are separate from completed, verified video archives. If ElevenLabs runs out of credits, add credits or update the external API key, then use `--reuse-capture`; already synthesized lines are retained.

`review-capture.mjs` renders one composition frame for every scene, including the intro and outro, under `video/renders/order-lifecycle/visual-review/`. These frames carry a visible “Narration pending” watermark. Their timing is provisional until measured speech is available.

If a capture stops specifically at the refund dialog after step 55, preserve its run as `qa-pipeline/artifacts/runs/order-lifecycle-capture-segments/checkout-through-cancellation.json`. Start this directory's `dev-api.py` on port 8020, then run `TUTORIAL_RESUME_REFUND=1 npx playwright test --config=qa-pipeline/playwright/playwright.config.js order-lifecycle.video.spec.js` and `node qa-pipeline/tutorials/order-lifecycle/merge-refund-capture.mjs`. The pickup requires the same main order to be delivered and the same cancelled prepaid fixture to be refund-pending. Merging requires all 61 actual steps to pass and preserves both original segment logs. It does not create another order or replay production.

The build launches an isolated real API at port 8020 with fake outbound providers and a private in-memory Celery broker. No external worker consumes its notifications; no real payment, email/SMS/WhatsApp, courier booking or pickup is created. The manual courier reference is explicitly a demonstration value. A loopback storage adapter writes actual presigned artwork/proof upload bytes via FakeStorage; the capture serves those exact files for development CDN requests.

`prepare.py` creates an owned artwork-enabled product/category and a dedicated verified customer with a fictional address outside the captured sequence. `refund-fixture.py` creates the separate simulated paid order from the main order's item snapshots; it does not charge a card or emit notifications. The captured refund uses the real refund service with its fake provider.

Secrets and generated customer passwords remain in `~/.config/urgentprinters-tutorials/`, outside repositories and production archives. Login screens and traces are excluded. The selected voice/API key remain in `.env.local` there. The main delivered order and refunded fixture are retained for audit history; the owned catalogue product is retired after recording. Interrupted nonterminal owned orders are cancelled by capture cleanup.

## Where changes go

- Narration, labels and chapters: `content.json`.
- Browser actions/selectors/assertions: `qa-pipeline/playwright/specs/order-lifecycle.video.spec.js`.
- Customer/catalogue preparation, storage bridge and refund fixture: this directory.
- Shared authoring/rendering/audio finishing/verification: `../catalog-production/`.

Captured before/after plates are 6400×3600, retaining detail during 4K zooms. Step metadata is checkpointed atomically to `qa-pipeline/artifacts/runs/order-lifecycle-partial-run.json`. Render frames have content fingerprints and persistent checkpoints in `~/.cache/urgentprinters-tutorials/order-lifecycle/`; only missing frames are rendered after interruption. Hardware H.264 encoding is used when verified available, with software fallback.

Final movies, invoice PDF, subtitles, chapters, scene contact sheet and quality report are saved in `qa-pipeline/artifacts/video/renders/order-lifecycle/`. Every completed build preserves the production source, raw plates, measured narration/alignment, Foley, locked JS dependencies and finished videos in `qa-pipeline/artifacts/video/archives/order-lifecycle/<timestamp>.tar.gz`. Video checks include every audio/video frame, dimensions, frame rate, duration, codecs, loudness and SHA256.
