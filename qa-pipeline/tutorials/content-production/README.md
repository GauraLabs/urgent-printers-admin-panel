# Content tutorials for website operators

Six separate lessons cover Banners, Testimonials, Announcements, FAQs, Navigation and Theme. Narration uses everyday Hindi with the English labels the operator sees in the UI. It explains what to enter, when to save, how to verify the customer view and how to undo or retire content. Developer commands, fake-provider details and automation internals belong in this guide, not in the spoken lessons.

Each lesson uses actual admin controls and actual public storefront responses. Customer reviews and images are fictional examples recorded only in development. Operators are told to use customer-approved quotes and permitted photographs. Schedule dates and the announcement countdown are demonstrated, alongside hiding and deleting. Navigation includes category targets, custom page links, header/footer placement and ordering. Theme covers choosing, saving, verifying and restoring existing presets.

## Rebuild

Run the admin on port 3001 and storefront on port 3000. Start the isolated read API in a separate terminal from the admin repository:

```bash
TUTORIAL_API_PORT=8000 ../urgent-printers-backend/.venv/bin/python qa-pipeline/tutorials/catalog-production/dev-api.py
node qa-pipeline/tutorials/content-production/build.mjs --gl=vulkan --concurrency=2
```

Reuse the saved captures, or build one lesson:

```bash
node qa-pipeline/tutorials/content-production/build.mjs --reuse-capture --gl=vulkan --concurrency=2
node qa-pipeline/tutorials/content-production/build.mjs --reuse-capture --feature=content-faqs --gl=vulkan --concurrency=2
```

Each lesson's `content.json` holds narration and chapter markers. Shared browser actions are in `qa-pipeline/playwright/specs/content-tutorial.flows.js`; capture utilities are in `content-tutorial.helpers.js`. The six small spec files select the lesson and configure 6400×3600 plates. The shared production pipeline renders a native 4K master and a 1080p copy at 30 fps, with measured ElevenLabs narration, captions, smooth camera moves, animated cursor and original click/typing Foley.

## Preservation and development data

`snapshot.py` backs up original content outside the repository, to `~/.config/urgentprinters-tutorials/content-originals.json`. Capture cleanup removes only tracked tutorial-created records, restores original ordering and restores the original announcement/theme. A concurrent change to a singleton stops automatic restoration. Generated sessions and ElevenLabs credentials remain in that external directory; no login screens or private browser traces go into production archives.

The capture sends business requests to the real isolated development API. Outbound providers are fake, its task broker is private, and no production publishing is involved. Cookie/analytics setup happens outside the taught steps. A normal no-cache page reload verifies current server data rather than replacing public content responses.

The announcement editor uses the existing IST conversion utilities so a deadline remains unchanged after saving and reopening, even across browser timezone settings. The recording asserts that round trip.

The navigation lesson also exposed duplicate React keys when two links target the same category. The storefront now retains each navigation record's ID for desktop, mobile and footer rendering. The collection includes those frontend fixes and a regression check for identical labels/destinations, renaming and reordering.

Per-lesson finished movies, subtitles, chapters, review sheet and quality report are under `qa-pipeline/artifacts/video/renders/content-<lesson>/`. Complete source/video archives are under `qa-pipeline/artifacts/video/archives/content-<lesson>/`. Archives retain raw plates, measured audio, editable sources and locked dependencies. Every completed movie is decoded in full and checked for dimensions, frame rate, duration, audio loudness and SHA256. After successful export/archive, the series build removes only regenerable JPEG frame intermediates to conserve disk space.

Once all six lessons are verified, `node qa-pipeline/tutorials/content-production/collection.mjs` creates an offline lesson player at `qa-pipeline/artifacts/video/renders/content-training/index.html` and a complete collection archive under `video/archives/content-training/`. Extracting that archive preserves the player's relative links to all twelve movie files and every lesson's editable inputs.

Missing ephemeral catalogue image variants were recovered from image resources in earlier successful local traces. Their public images and provenance are under `assets/recovered/` and `assets/recovered-manifest.json`; private traces are excluded. `assets.mjs` restores those actual historical media files into local FakeStorage for reproducible development screenshots.
