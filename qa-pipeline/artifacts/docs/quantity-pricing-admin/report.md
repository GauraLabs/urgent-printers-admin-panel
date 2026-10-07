# Quantity Pricing (Admin)
**Project:** Urgent Printers — Admin Panel  
**Generated:** 2026-10-07T17:20:39.089Z  
**Run:** 2026-10-07T17:12:22.564Z — 31 steps, viewport 1280×720  
---
## Overview & objectives

Staff price a product **per piece, in a plain table**, and can optionally control which quantity the storefront advertises and the smallest and largest order accepted. The pack-based pricing model — pack size, pack price, pack-mode inputs and all of its vocabulary — has been removed entirely.

The objective is that quantity pricing becomes self-explanatory: a member of staff should be able to price a product correctly the first time, and should be able to see, **before saving**, exactly what the customer will see on the product card and the product page.


## Feature description & business logic

The Pricing Tiers section is now two things stacked: an **Order quantity** panel, and beneath it a simple per-piece tier table.

The tier table's columns are *Quantity from*, *Price per piece (₹)*, *MRP per piece (₹, optional)*, *Discount*, *Example*, and *Best value*. There is no pack column and no "Total" column. The **Example** cell is read-only and spells out the arithmetic for that row — "50 pcs = ₹300.00" — computed in integer paise so it cannot drift. The **Discount** cell shows an em dash when a row has no MRP; this corrects a defect where it previously rendered the bare selling price, which read as though a discount existed when none did.

The **Order quantity** panel holds three optional numbers — *Show on listing as*, *Min order*, *Max order* — plus a *Unit name*. Every one of them is optional. Left empty, each field shows an "Auto" chip and a placeholder naming the value that will be derived ("50 (auto: lowest quantity)", "50 (auto)", "No limit"); typing replaces the chip with a "Reset to auto" button, so staff can always tell *set* from *automatic* and can always get back. Nothing in this feature is a required field, and an existing product needs no edit at all to work correctly.

A **live preview** under the panel recomputes on every keystroke and states, in the customer's own words, what the card and the product page will say. Separately, non-blocking amber notes warn about configurations that are legal but worth knowing about: a minimum below the lowest tier, tiers that can never be reached because they sit above the maximum, and an MRP present on some tiers but not others.


## User flow

A member of staff signs in and opens a product. The Pricing Tiers section shows the per-piece table and, above it, the Order quantity panel.

For Custom Die-Cut Stickers, *Min order* and *Max order* are both empty and chipped "Auto"; *Show on listing as* holds 50, because the migration that introduced this feature carried the product's retired pack size across into the listing quantity. The preview reads **"Product card: 50 pcs for ₹300.00"** and **"Product page: opens at 50 pcs · ₹6.00/pc · total ₹300.00 · customers can order from 50 pcs"** — the no-maximum wording.

Typing a **minimum of 25**, below the lowest tier of 50, does not produce an error. An amber note appears: "Orders of 25 to 49 pcs will be charged the 50+ rate (₹6.00/pc)". Typing a **maximum of 200** likewise produces notes rather than errors, one per newly unreachable tier.

Real mistakes *are* blocked. A minimum above the maximum is refused inline with "Minimum order cannot be more than the maximum" and **no request is issued at all**. A listing quantity outside the allowed range names the real bounds. A maximum above 1,000,000, or a fractional quantity, are both refused.

Entering a **maximum of 1,000** updates only the range clause of the preview — "customers can order 50 to 1,000 pcs" — leaving the card line untouched, because a maximum changes no price. Saving sends exactly that one change. Reopening the product and saving again without touching anything sends the same values back: automatic stays automatic rather than being quietly materialised into its derived number.


## What the admin sees is what the customer gets

The live preview is the feature's main promise, so this run checked it against the storefront rather than against itself.

For Matte Finish Business Cards, whose listing quantity is set to 250, the admin preview reads **"₹2,500.00 · 250 pcs for ₹2,250.00 · 10% off"** and **"opens at 250 pcs · ₹9.00/pc · total ₹2,250.00 · customers can order from 100 pcs"**. The storefront card for that product reads "250 pcs for ₹2,250.00" with ₹2,500.00 struck and 10% off; its product page opens at 250 pieces, ₹9.00/pc, total ₹2,250.00, with a "Min 100 pcs" hint. The two agree figure for figure.

That agreement was not true when this run started. The admin's shared currency formatter omits decimals, so the Discount column rendered "₹14" and "₹12.6", the preview's struck MRP rendered "₹2,500" beside a sale price of "₹2,250.00", and the below-lowest-tier note read "(₹6/pc)" — against a storefront that always shows two decimals. This was fixed during the run with a scoped two-decimal helper applied at four call sites, leaving the shared formatter's behaviour elsewhere in the admin panel untouched, and the fix was then re-verified live.


## Annotated screenshots

Screenshots are captured at 1280x720 against the local development server, signed in as the seeded super administrator.

| Step | Screenshot | What it shows |
| --- | --- | --- |
| `hp-01` | ![hp-01](../../screenshots/quantity-pricing-admin/hp-01.png) | The pricing table, back to plain per-piece columns: Quantity from, Price per piece, MRP per piece, Discount, Example and Best value — no pack column, no Total column. |
| `hp-03` | ![hp-03](../../screenshots/quantity-pricing-admin/hp-03.png) | The Discount cell of a tier with no MRP now shows an em dash, correcting a defect where it rendered the bare selling price and implied a discount that did not exist. |
| `hp-04` | ![hp-04](../../screenshots/quantity-pricing-admin/hp-04.png) | The read-only Example column spells out each row's arithmetic — "50 pcs = ₹300.00" — computed in integer paise so it cannot drift. |
| `hp-05` | ![hp-05](../../screenshots/quantity-pricing-admin/hp-05.png) | The Order quantity panel in its automatic state: "Auto" chips on the minimum and maximum, with placeholders naming the values that will be derived. Nothing here is required. |
| `hp-06` | ![hp-06](../../screenshots/quantity-pricing-admin/hp-06.png) | The live preview states, in the customer's own words, what the card and the product page will say — including the "customers can order from 50 pcs" wording used when there is no maximum. |
| `alt-03` | ![alt-03](../../screenshots/quantity-pricing-admin/alt-03.png) | A minimum below the lowest tier is a note, not an error: "Orders of 25 to 49 pcs will be charged the 50+ rate (₹6.00/pc)", with the form still saveable. |
| `alt-04` | ![alt-04](../../screenshots/quantity-pricing-admin/alt-04.png) | Setting a maximum of 200 flags each newly unreachable tier — again as amber notes rather than validation errors, so no existing product is made unsavable. |
| `err-01` | ![err-01](../../screenshots/quantity-pricing-admin/err-01.png) | A genuine mistake is blocked: a minimum above the maximum is refused inline and no save request is issued at all. |
| `hp-07` | ![hp-07](../../screenshots/quantity-pricing-admin/hp-07.png) | Entering a maximum of 1,000 changes only the preview's range clause to "customers can order 50 to 1,000 pcs" — the card line is untouched, because a maximum changes no price. |
| `hp-08` | ![hp-08](../../screenshots/quantity-pricing-admin/hp-08.png) | The save, whose payload was asserted field by field: the changed maximum, automatic values still null, and neither the retired pack size nor the deprecated quantity steps. |
| `hp-12` | ![hp-12](../../screenshots/quantity-pricing-admin/hp-12.png) | The products list, checked for any surviving pack column or wording — the specification's "no pack UI anywhere" requirement covers the list as well as the form. |
| `hp-09` | ![hp-09](../../screenshots/quantity-pricing-admin-discount-and-guards/hp-09.png) | A tier that does have an MRP renders the full discount — struck ₹14.00, a 10% off badge, then ₹12.60 — confirming the em dash elsewhere is a no-MRP rule, not a broken component. |
| `hp-11` | ![hp-11](../../screenshots/quantity-pricing-admin-discount-and-guards/hp-11.png) | The live preview for a product with a stored listing quantity of 250, matching the storefront card and product page figure for figure after the currency-formatting fix. |
| `err-06` | ![err-06](../../screenshots/quantity-pricing-admin-discount-and-guards/err-06.png) | The highest-priority finding: a pricing-only edit on a product with one photo is blocked by the unrelated three-photo media guard, with no save request issued. |


## Test results & coverage

**31 of 31 steps passed; 0 failed** — 8 of those are sign-in infrastructure, leaving 23 steps of real coverage across two tests.

Verified: the exact column set of the per-piece table; the complete absence of pack controls and pack vocabulary from both the product form and the products list (including confirmation that the reported "Price per packis" typo is gone); the em-dash Discount cell on a tier with no MRP alongside a fully-rendered discount on a tier that has one; the Example column's arithmetic; the automatic-default chips, placeholders and "Reset to auto" round trip; hydration of a stored listing quantity as a set value rather than an automatic one; the live preview in both its no-maximum and bounded wordings; all three non-blocking note types; four validation failures each confirmed to block the save with no request issued; a save whose payload was asserted field by field to carry the changed maximum, to keep automatic values null, and to send neither the retired `pack_size` nor the deprecated `quantity_steps`; and an untouched product saving with nothing changed.

Two things were confirmed outside the browser because they are not observable in it. The backend rejects invalid limit combinations with `quantity_limits_invalid` and the expected messages, and accepts-and-ignores a deprecated `pack_size` in a payload. And the requirement that a limits-only change must **not** bump `pricing_updated_at` was confirmed by reading that field directly before and after both an API-set listing quantity and the user-interface save of the maximum — null in every case.

**Not exercised:** role-based access control, since this run signed in only as the super administrator, so the view-only rendering of the Order quantity panel is unverified. And the legacy "N packs (M pcs)" order-line rendering that the specification deliberately preserves has **no live data** — no order line in the development database carries a pack size above 1.


## Accessibility

**automated scan only — manual/screen-reader review still needed.** Automated tooling typically catches only 30-40% of real accessibility issues, so a clean automated result is not evidence of compliance.

**Critical:** `label` (6 nodes across the two product edit pages) and `button-name` (4 nodes on the sign-in page and the products list). Attribution matters here, and the evidence points away from this feature: every control it adds is explicitly named in source — the listing, minimum, maximum and unit-name inputs each have a real `<label for>` bound to an id, and every tier-row input including the "% off" helper carries an `aria-label` naming both the field and its row. The same violations on the same routes were recorded as known residue on the two previous admin runs. The `button-name` nodes are on pages this feature does not touch at all. This remains an inference from source rather than a per-selector confirmation, because the sign-in rate limit was exhausted before a targeted scan could be run — the analysis carries that as an explicit follow-up.

**Serious:** `color-contrast`, 84 nodes, present on the dashboard too, which contains none of this feature's interface — a site-wide theme issue.

**Moderate:** `region`, `landmark-unique`, `heading-order`, `landmark-one-main` and `page-has-heading-one`, all on shared layout and the sign-in page.

**Minor:** `empty-table-header`, 3 nodes — this one *is* attributable to this feature: the pricing table's remove column has a genuinely empty header cell.


## Performance

**No performance numbers were captured, and on this application that is structural rather than a choice.** The admin access token lives only in memory, never in local storage, so the capture harness cannot restore a live session for an audit; a post-sign-in checkpoint is redirected to the sign-in page and the resulting figures would measure the wrong page entirely. Lighthouse is therefore disabled here by necessity, and no figure from this run should be quoted as a performance measurement.

From the run itself: the live preview, the Example column and the amber notes all recompute on every keystroke, entirely in the browser and in integer paise. No request is issued while typing — the only network calls in the whole capture were the two saves — and no input latency was observable across 31 steps.

One operational constraint is worth recording: sign-in is rate-limited to ten attempts per hour per address, and this run exhausted that limit twice, costing roughly thirty-five minutes of waiting. That is why this capture is deliberately two tests rather than one per path, and it is a real limit on how often this suite can be re-run.


## Recommendations & future improvements

**High — stop the three-photo guard blocking edits that touch no media.** A pricing-only change cannot be saved on any product with fewer than three photos: the guard runs before the request is built, so changing only the Order quantity panel on a one-photo product is refused with "At least 3 photos are required" and no request issued. Nine of the ten real products in this development database are in that state, so in practice only one product here can have its quantity limits edited through the interface at all. Scope the guard to creation and to saves that actually change the images. This is the second consecutive run to report it.

**Medium — warn when a tier's per-piece rate does not fall.** The existing typo warning only fires above a tenfold difference between neighbouring tiers, so real data pricing the 100 tier at ₹10.00 against ₹6.00 at the 50 tier passes silently — and the storefront then shows customers a rate card that appears to punish buying more. A non-blocking amber note, in the same style the panel already uses for unreachable tiers, would catch this at the only moment anyone can.

**Medium — confirm the critical `label` nodes by selector.** Source reading says every new control is named, but the previous run counted this residue at 2 nodes and this one counts 6, so the difference deserves one deliberate check rather than an inference.

**Low — qualify the preview when it is clamping.** Typing a listing quantity outside the allowed range shows a blocking error on the field while the preview confidently prices the *clamped* quantity. Both halves are individually correct, but staff can read the preview as approval; a short note such as "previewing the nearest allowed quantity" would close the gap.

**Low — apply the same two-decimal formatting to the bulk discount dialog**, which still shows the "₹12.6" style truncation for per-tier before-and-after prices and was deliberately left out of scope for this fix.

**Low — give the pricing table's remove column a screen-reader-only header**, clearing the one accessibility finding that is genuinely this feature's own.

