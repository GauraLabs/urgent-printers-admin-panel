# Product lifecycle: draft to storefront order and retirement

Professional Hindi-English tutorial with the same Brian male narration, animated cursor, click/typing sound effects, smooth camera motion, captions and native 4K source plates as the coupon tutorial. Both exports are 30 fps; 1080p is downsampled from the 4K master.

## Rebuild

Run the existing admin at localhost:3001, storefront at localhost:3000 and development backend at localhost:8000. If the servers are stopped, use `npm run dev -- --port 3001` in the admin and `npm run dev -- --port 3000` in the storefront. Use the installed Next.js default bundler. Build caches are disposable; complete source archives and exports are preserved separately.

From the admin repository:

```bash
node qa-pipeline/tutorials/product-lifecycle/build.mjs --gl=vulkan --concurrency=2
# Keep existing capture, regenerate only changed narration and render:
node qa-pipeline/tutorials/product-lifecycle/build.mjs --reuse-capture --gl=vulkan --concurrency=2
# Resume frames after an interruption:
node qa-pipeline/tutorials/catalog-production/resume-render.mjs --feature=product-lifecycle --gl=vulkan --concurrency=2
```

Record category-creation before product-lifecycle: the product uses the category/subcategory created by that capture. Owned development record IDs are saved outside the repositories in `~/.config/urgentprinters-tutorials/catalog-session.json`. A fresh dedicated customer is created for each full product capture; its random credentials are saved separately in `product-lifecycle-session.json` with mode 0600. Login screens are excluded from the recording.

## Small changes

- `content.json`: ordered chapter names, callouts and Hindi-English narration. The author script preserves measured audio for unchanged lines.
- `qa-pipeline/playwright/specs/product-lifecycle.video.spec.js`: selectors, actions and real assertions.
- `qa-pipeline/tutorials/catalog-production/`: shared build, audio finishing, subtitles, verification, frame resumption and sample artwork generator.
- `qa-pipeline/artifacts/shot-lists/product-lifecycle-shotlist.json`: camera/callout direction. Change the shared author script if these should survive a full re-author.

A full build recaptures UI behavior. `--reuse-capture` reuses source plates for wording/editing changes. The voice key and selected Brian voice remain in `~/.config/urgentprinters-tutorials/.env.local`; they are never archived. Unchanged audio is cached. Persistent JPEG frames live in `~/.cache/urgentprinters-tutorials/product-lifecycle/`; deleting that disposable cache does not delete source material or final exports.

## Real development data and media

Browser API writes use the real development backend, forwarded to a separate local API process at port 8020. Its outbound providers are fake and its private in-memory Celery broker has no worker. No real messages, payment capture or shipments are created. Only owned tutorial records are changed. Product checkout creates a real COD order, then cancels it and retires the sample product.

The development FakeStorage provider writes actual uploaded/processed images in `/tmp/fake_uploads`. The capture adapter serves those exact bytes for local CDN/image-optimizer requests so uploaded artwork is visible without an external CDN. Product/category/pricing/auth/order API responses are not mocked. Original SVG and PNG artwork sources are included in every archive. Existing unrelated missing development assets remain visible in the run's console findings; new errors block final builds unless explicitly reviewed for the exact successful capture.

## Saved output

`qa-pipeline/artifacts/video/renders/product-lifecycle/` contains 1080p30.mp4, 4K30.mp4, synchronized Hindi-English SRT, chapter timestamps and quality-report.json. Verification checks resolution/frame rate/codecs/duration, all planned browser steps, SHA256 and a complete decode of both video and audio streams.

Each completed build saves `qa-pipeline/artifacts/video/archives/product-lifecycle/<timestamp>.tar.gz` with source, screenshots, narration/audio/alignment, Foley, fixtures, exact dependencies, exports and verification. Credentials, environment files and login traces are excluded. Copy this archive to backed-up storage for off-machine preservation.

The product capture discovered and fixed a public draft/archived-detail visibility bug. See `../catalog-production/BACKEND-FIX.md`; archives include the backend fix and tests. Category capture uses CSS caret hiding plus Playwright `caret: initial` to avoid inline screenshot styling changing server-rendered form attributes during hydration.

Each completed capture saves every step atomically to `qa-pipeline/artifacts/runs/product-lifecycle-partial-run.json` while recording; the final run is written only after teardown. Before a fresh product capture, the build cancels its own interrupted demo order and retires its own previous product after checking exact IDs/names. Rendered scene contact sheets and subtitle/chapter exports are saved next to the final videos.
