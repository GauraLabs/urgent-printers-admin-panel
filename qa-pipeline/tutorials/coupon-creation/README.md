# Coupon creation tutorial

The expanded [complete coupon lifecycle tutorial](../coupon-lifecycle/README.md) also covers storefront use, checkout, redemption analytics and deactivation.

Reusable production source for the real Urgent Printers admin coupon form. Spoken script: Hindi in Devanagari with English UI labels. Output: H.264 MP4 at 1920×1080 and 3840×2160, 30 fps; use `--resolutions=1080p60,4K60` for 60 fps.

## Credentials outside the repositories

File: `/home/others/.config/urgentprinters-tutorials/.env.local` (permissions 0600).

```dotenv
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

Choose a Hindi-capable ElevenLabs voice. Brian is currently selected and works with this account’s free API tier; the native Hindi library voice was rejected by ElevenLabs as requiring a paid plan. The existing multilingual v2 model handles the mixed Hindi/English script. No credentials are included in production archives. Use `--env-file=/absolute/path/.env.local` to override the default location.

## Build

From the admin-panel repository:

```bash
# Full capture, cached ElevenLabs narration, both exports, production archive:
node qa-pipeline/tutorials/coupon-creation/build.mjs --gl=vulkan

# Reuse screenshots when only narration, timing, or animation changes:
node qa-pipeline/tutorials/coupon-creation/build.mjs --reuse-capture --gl=vulkan

# Visual draft with click/keyboard audio, explicitly marked as narration pending:
node qa-pipeline/tutorials/coupon-creation/build.mjs --draft --reuse-capture

# Inspect each shot before encoding:
node qa-pipeline/tutorials/coupon-creation/build.mjs --draft --reuse-capture --contact-sheet --resolutions=1080p30
```

The `--gl=vulkan` option was verified to use this workstation’s RTX 3080 for rendering. Omit it for portable software rendering on machines without a compatible GPU.

The admin at localhost:3001 and backend must be running. Existing QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD environment overrides are supported. Login is excluded from the video. The capture creates `PRINT10-TUTORIAL`, inactive, with no expiry, 10% discount capped at ₹200, ₹1,000 eligible minimum, 100 total uses, one per customer, all products but excluding discounted items. It leaves this record visible for review. On replay, only the exact inactive, unused example with its expected description can be replaced; other coupon records are untouched.

## Small changes and regeneration

- UI or selectors changed: edit `qa-pipeline/playwright/specs/coupon-creation.video.spec.js`, then run the full build.
- Explanation changed: edit `qa-pipeline/artifacts/narration/coupon-creation-narration.json`, then build with `--reuse-capture`. Only changed narration lines are billed again; existing clips are cached by text, voice, model, and voice settings.
- Titles, focus, shot timings changed: edit `qa-pipeline/artifacts/shot-lists/coupon-creation-shotlist.json`, then build with `--reuse-capture`.
- Animation and sound mix: `qa-pipeline/remotion/FeatureDemo.jsx`; deterministic camera/timing math is in `timeline.js`. The build generates original click and typing Foley WAV files.
- Expectations: `qa-pipeline/artifacts/plans/coupon-creation-plan.json`.

## Outputs and preservation

A native 4K master is rendered first; the 1080p export uses Lanczos downsampling from that master. The final narration/Foley mix is normalized to -16 LUFS with a -1.5 dB true-peak ceiling; video pixels are copied unchanged during audio finishing. Both output files are checked with ffprobe and a `quality-report.json` is saved alongside them. Hindi-English captions are embedded in the video and also exported as `coupon-creation.hi-en.srt`.

Latest exports: `qa-pipeline/artifacts/video/renders/coupon-creation/1080p30.mp4` and `4K30.mp4`. Drafts have a `draft-` filename prefix and a visible watermark. Final narration is never silently omitted: final builds stop if credentials, measured audio, or any required narration clip are missing.

Every completed build creates `qa-pipeline/artifacts/video/archives/coupon-creation/<timestamp>.tar.gz`, preserving source, scripts, renderer, package lock, screenshots before and after every action, run log, shot list, narration audio/metadata, sounds and exports. These large assets are gitignored; copy the archive to backed-up storage if it must survive loss of this workstation. JSON/scripts remain reviewable in git. Playwright traces contain login activity and are deliberately excluded from the portable archive.

## Current validation

The real browser flow completes all 18 recorded steps, verifies the POST succeeded and confirms the saved discount, minimum and inactive status. No JavaScript console errors were recorded. Existing page accessibility findings are retained in the shot list; this tutorial does not alter application UI or claim a full accessibility audit. Inspect contact-sheet frames and listen to the Hindi-English voice before distributing the final tutorial.

The full repository typecheck also reports pre-existing TypeScript fixture errors in other QA specs; the new tutorial is a JavaScript spec and its Playwright execution passes. ESLint on the changed tutorial/render scripts passes; the existing capture fixture requires disabling the React use-hook rule because Playwright’s fixture callback is named `use`.

Voice maintenance: ElevenLabs currently lists legacy default voices, including Brian, for retirement on 31 December 2026 ([provider notice](https://elevenlabs.io/docs/help-center/product/voices/my-voices/what-are-default-voices)). The archived MP3s keep existing cuts reproducible without API calls. If new narration is needed after retirement, update the external voice ID to an available replacement; the audio cache then regenerates all lines consistently in the new voice.
