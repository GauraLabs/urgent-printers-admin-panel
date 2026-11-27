# Coupon lifecycle: admin → storefront → redemption → deactivation

This is the complete Hindi-English tutorial, exported at 1080p and native 4K, 30 fps. It preserves the original creation-only tutorial under `../coupon-creation/` and adds customer use, checkout, order snapshots, analytics and offer closure.

## What the video demonstrates

1. Create a manual 10% coupon, capped at ₹200, with a ₹1,000 eligible minimum, 100 total uses, one use per customer and discounted products excluded.
2. Activate it in the admin panel.
3. Add 50 Custom Die-Cut Stickers to a storefront cart. A ₹300 subtotal fails the minimum and requests another ₹700.
4. Increase to 1,000 stickers. At the current quantity tier, ₹2,500 receives the capped ₹200 discount, leaving ₹2,300. Show coupon removal and reapplication.
5. Use a saved development address, choose COD, verify server-confirmed totals, and place an actual development order.
6. Verify the coupon discount on confirmation, customer order history and the admin order.
7. Inspect redemption analytics; show the same customer cannot redeem it twice.
8. Deactivate the coupon, confirm the storefront rejects it, and show that the historical order keeps its saved discount.
9. Cancel the development order through the admin UI. Verify that its reserved coupon usage is released and explain that historical analytics count the cancelled order while the available usage quota returns to zero.

This is the coupon lifecycle; physical printing, shipment and online payment capture are outside this tutorial. No card or UPI payment is charged. Only the recording’s own development COD order is cancelled in the final chapter so it cannot enter fulfilment. The coupon stays inactive, and its redemption history remains available.

## Development isolation and credentials

Existing storefront (`localhost:3000`) and admin (`localhost:3001`) interfaces are used unchanged. Playwright forwards their local backend requests to the real development API on port 8020. That process uses the existing development database, real auth/cart/coupon/order services, fake outbound providers and a private in-memory task broker. No shared Celery worker consumes its tasks, so the recording cannot send customer/staff messages or create external payments or shipments. Server-rendered product reads use the existing storefront API; both processes read the same development products.

`prepare-customer.py` provisions a dedicated verified development customer and fictional saved address. Random account credentials and owned-record identifiers are stored only in `~/.config/urgentprinters-tutorials/coupon-lifecycle-session.json` (0600), outside the repositories and archives. Each capture creates a new coupon edition such as `PRINT10-DEMO-04` and a fresh customer. Previously recorded coupons/orders are preserved; cleanup touches only records owned by this tutorial.

ElevenLabs credentials and the selected Brian voice remain in `~/.config/urgentprinters-tutorials/.env.local`. Existing unchanged narration clips are reused. Login and passwords are excluded from the footage. Playwright traces and external session files are excluded from archives.

## Rebuild

From the admin repository, with the existing storefront/admin servers running:

```bash
# Start an isolated recording API as needed, provision a fresh customer, capture and render:
node qa-pipeline/tutorials/coupon-lifecycle/build.mjs --gl=vulkan

# Reuse captured footage and cached narration for editorial changes:
node qa-pipeline/tutorials/coupon-lifecycle/build.mjs --reuse-capture --gl=vulkan

# Check framing before a full encode:
node qa-pipeline/tutorials/coupon-lifecycle/build.mjs --reuse-capture --contact-sheet --resolutions=1080p30 --gl=vulkan
```

Vulkan was verified on this workstation’s RTX 3080. Omit `--gl=vulkan` for software rendering. The build uses the backend’s existing `.venv`; it refuses a non-development environment. A recording API started by the build is stopped after capture. On capture failures, the spec attempts to deactivate/cancel its own records before exiting.

## Where small changes go

- Selectors, actions, assertions: `qa-pipeline/playwright/specs/coupon-lifecycle.video.spec.js`.
- Hindi-English explanations: `qa-pipeline/artifacts/narration/coupon-lifecycle-narration.json`.
- Focus, callouts and shot durations: `qa-pipeline/artifacts/shot-lists/coupon-lifecycle-shotlist.json`.
- Capture expectations: `qa-pipeline/artifacts/plans/coupon-lifecycle-plan.json`.
- Development API/account setup and production build: this directory.

If UI behavior changes, run the full capture. If only narration/animation changes, use `--reuse-capture`. Changed narration text alone is resynthesized; changing the voice/model regenerates all lines consistently.

## Exports and archives

Latest files: `qa-pipeline/artifacts/video/renders/coupon-lifecycle/1080p30.mp4` and `4K30.mp4`, plus a Hindi-English SRT and media quality report. The 1080p output is downsampled from the 4K master so timing and framing match. Audio finishing targets -16 LUFS and -1.5 dBTP while copying video unchanged.

Each completed build saves a complete compressed production snapshot in `qa-pipeline/artifacts/video/archives/coupon-lifecycle/<timestamp>.tar.gz`. It contains the scripts, source, locked dependency versions, before/after screenshots, measured narration audio/alignment, Foley, subtitles, exports and verification report. API keys, customer passwords and login traces are excluded. Large media and archives are gitignored; copy the tarball to backed-up storage for off-machine preservation.

The final capture passes all 53 functional steps; it is not a full accessibility/performance audit. Six steps logged existing thumbnail/static-asset 404s. Their exact messages remain in the run log and have explicit nonblocking review entries in the shot list, bound to this capture. Failed actions and new or changed console errors still block the build. Previously reviewed messages can carry forward only on a passing action at the same route. Quantities/prices above describe current development fixtures; update the assertions and affected narration if those fixtures change.

A blocking admin bug found during capture was fixed in `next.config.ts`: existing catalog thumbnails use `cdn.urgentprinters.com`, which now has a default remote image allowlist entry when no CDN environment variable is configured. Without it, opening the real order crashed the admin page. The full browser capture verifies the fix.

## Resume an interrupted render

```bash
node qa-pipeline/tutorials/coupon-lifecycle/resume-render.mjs --gl=vulkan --concurrency=2
```

The standard 1080p30/4K30 build now uses persistent frame checkpoints in `~/.cache/urgentprinters-tutorials/coupon-lifecycle/`. A fingerprint of the capture, screenshots, narration/audio, composition source and resolution prevents frames from a different version being reused. Completed JPEG frames are checked for incomplete writes and only missing frames are rendered. The final audio is assembled at the composition’s exact frame positions with the same click/typing gains, then normalized and verified. No new customer/order capture or ElevenLabs synthesis is needed to resume.

The initial interrupted render was recovered from its temporary frame directory with a one-time `--adopt-frames` operation. A recovered frame and a freshly rendered frame compared pixel-for-pixel identically before the rest of the render resumed. Checkpoint images are caches, not required to restore a production archive; the archive preserves the original source plates, audio, scripts and completed videos.
