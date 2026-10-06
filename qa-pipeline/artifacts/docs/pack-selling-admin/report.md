# Pack Selling Admin
**Project:** Urgent Printers — Admin Panel  
**Generated:** 2026-10-06T21:11:16.415Z  
**Run:** 2026-10-06T20:58:50.291Z — 16 steps, viewport 1280×720  
---
## Overview & objectives

Staff pricing a product that sells in packs should be able to type the number they actually quote: the price of one pack. Before this feature they had to divide in their head — a pack of 50 stickers at ₹300 meant typing ₹6.00 per piece — and any arithmetic slip landed silently in a live price.

The constraint that shaped the whole design is that the per-unit format could not change. The pricing engine, bulk discounts, the search index, price-mismatch telemetry and every API client all read per-unit prices. So the admin form divides client-side and the wire contract stays exactly as it was. Staff enter packs; the backend receives pieces and per-unit prices.

The second objective is discoverability for the shopping feed: one URL, shown on the products list, to hand to Google Merchant Center, Microsoft Merchant Center and the Meta catalog.


## Feature description & business logic

**Pack mode is a presentation layer over unchanged stored data.** The Pricing Tiers section gained a "Sold in packs of [N] [label]" control. While N is 1 there is no pack behaviour at all: the table reads Quantity / Price per unit / MRP per unit, exactly as before. The moment N exceeds 1 the same three columns relabel to Packs / Price per pack / MRP per pack, and each row gains two read-only readouts — the piece count ("= 50 pcs") and the derived per-piece price ("₹6.00/pc").

The conversion is done entirely in integer paise (`src/lib/utils/pack.ts`). Going out: `quantity = packs × pack_size` and `price_per_unit = packPaise / pack_size / 100`. Coming in: `packs = quantity / pack_size` and `packPaise = unitPaise × pack_size`. Float division is never used, which is what makes the round trip lossless — switching the pack size from 50 to 1 and back re-expresses the same stored tiers with no drift.

**The exactness rule is the interesting constraint.** Because the wire stays per-unit with two decimal places, a pack price is only acceptable if it divides into whole paise per piece. ₹300 over 50 pieces is 600 paise exactly and is accepted. ₹100 over 30 pieces is not, and is rejected inline with a message naming the amount and the pack size. This is a deliberate trade-off recorded in the specification: staff must pick ₹99 or ₹102 rather than ₹100. The same rule applies to the MRP per pack.

Two validation layers guard the tier/pack relationship. Client-side, a Zod refinement requires every tier quantity to be a multiple of the pack size. Server-side, the route validates the *merged* state — the fields sent plus the product's existing values — because a PATCH may carry a pack size without tiers, or tiers without a pack size; validating only the payload would let a mismatch through. A pack-size or unit-label-only change deliberately does **not** bump `pricing_updated_at`, since no price actually changed, which keeps mismatch telemetry classification untouched.

Two smaller changes ride along. The deprecated "Quantity steps" editor was removed from the form and is no longer sent, so a PATCH leaves any stored value alone. And duplicate option labels within a group are now rejected, with the backend's error routed to the correct group by an anchored prefix match — deliberately anchored, so a label that happens to contain another group's name cannot misdirect the error to the wrong section.


## User flow

A member of staff signs in and opens the Products list. Above the table sits a read-only **Shopping feed** card showing the feed URL with a copy button, and a note explaining that one feed serves all three channels and that only active, categorised products with at least one image are listed.

Opening Custom Die-Cut Stickers and scrolling to Pricing Tiers, the pack controls show the stored configuration: packs of 50, unit label "pcs", and the tier table already in pack mode. The first row reads 1 pack at ₹300.00, annotated "= 50 pcs" and "₹6.00/pc".

Setting the pack size back to 1 demonstrates the round trip: the columns revert to Quantity and Price per unit, and the same stored tiers reappear as 50 pieces at ₹6.00 and 250 pieces at ₹6.00 — the same numbers, re-expressed, with nothing lost. Setting it back to 50 returns to pack mode, where the 250-piece tier now reads 5 packs at ₹300.00 each. That row makes the distinction the pack table exists for: the input holds the price of *one* pack, while the Total column carries 5 × ₹300 = ₹1,500.00.

Typing ₹300 into the one-pack row's price is accepted, and the per-piece readout settles on ₹6.00/pc. Saving sends a PATCH that stores `pack_size` 50, `unit_label` "pcs", tier quantities unchanged in pieces, and ₹6.00 as the per-unit price — the division happened in the browser and never reached the wire.

Back on the Products list, the product's "Lowest tier price" cell now reads a per-pack figure. Attempting invalid input shows the guards working: a pack price that will not divide into whole paise is refused inline on the field, a pack size that no tier quantity divides by blocks the save before any request is issued, and giving two finishes the same normalised name flags the later of the two rows — and only that row.


## Annotated screenshots

The captures below follow the configuration journey, then each of the three validation guards. Login steps are infrastructure and are not captioned individually.

| Step | Screenshot | What it shows |
| --- | --- | --- |
| `hp-02` | ![hp-02](../../screenshots/pack-selling-admin/hp-02.png) | The Products list with the read-only Shopping feed card: the feed URL including its /api/v1 prefix, a copy button, and the note that one feed serves all three channels and lists only active, categorised, imaged products. |
| `hp-03` | ![hp-03](../../screenshots/pack-selling-admin/hp-03.png) | The product's Pricing Tiers section hydrated from stored per-unit data: packs of 50 "pcs", with the first row showing one pack at ₹300.00 and a derived ₹6.00/pc. |
| `alt-01` | ![alt-01](../../screenshots/pack-selling-admin/alt-01.png) | Pack size set back to 1: the columns revert to Quantity and Price per unit, and the same stored tiers reappear as 50 pieces at ₹6.00 — the round trip is lossless. |
| `hp-04` | ![hp-04](../../screenshots/pack-selling-admin/hp-04.png) | Back in pack mode at 50: the 250-piece tier shows as 5 packs at ₹300.00 each, with the ₹1,500.00 row total in a separate column — the pack input is the price of one pack, not the line total. |
| `hp-05` | ![hp-05](../../screenshots/pack-selling-admin/hp-05.png) | Entering ₹300 as the price of one pack of 50 is accepted, and the per-piece readout settles on ₹6.00/pc because 30,000 paise divides evenly by 50. |
| `hp-06` | ![hp-06](../../screenshots/pack-selling-admin/hp-06.png) | The save, asserted on the PATCH response itself: pack size 50, unit label "pcs", ₹6.00 stored per unit, and tier quantities still in pieces — the division happened in the browser and never reached the wire. |
| `hp-07` | ![hp-07](../../screenshots/pack-selling-admin/hp-07.png) | The Products list showing the configured product's per-pack figure in the "Lowest tier price" column — the value flagged as the run's one open product question. |
| `err-01` | ![err-01](../../screenshots/pack-selling-admin/err-01.png) | The whole-paise guard: a pack price that will not divide evenly into paise per piece is refused inline on the field, naming both the amount and the pack size. |
| `err-02` | ![err-02](../../screenshots/pack-selling-admin/err-02.png) | A pack size that no tier quantity divides by blocks the save entirely — the test confirmed zero PATCH requests were issued and the stored pack size stayed at 50. |
| `err-03` | ![err-03](../../screenshots/pack-selling-admin/err-03.png) | Two finishes given the same normalised name: only the later duplicate row is flagged, and only within the Finishes group. |


## Test results & coverage

**16 of 16 steps passed, with no failures.** The run log validates against the pipeline's run schema and the trace is attached.

What was genuinely exercised in a real browser, against the real backend and database:

- The Shopping feed card: its heading, its copy button, both explanatory sentences, and — importantly — that the URL it shows is the real route including the `/api/v1` prefix, rather than a prefix-less URL that would 404 for a merchant-centre fetch.
- Hydration of pack mode from stored per-unit tiers, including the derived piece count and per-piece price.
- The full 50 → 1 → 50 round trip, confirming the same stored tiers re-express in both directions with no numeric drift.
- Per-row correctness on a multi-pack tier, including the distinction between the price of one pack and the row total.
- Entering ₹300 per pack of 50 and confirming it is accepted with a ₹6.00/pc readout.
- A real save, asserted on the PATCH response itself: `pack_size` 50, `unit_label` "pcs", the edited tier stored at ₹6.00 per unit, and all five tier quantities still in pieces (50/100/250/500/1000) — proving pack mode does not rewrite quantities.
- The products list showing the per-pack figure.
- The inline whole-paise rejection, with the exact message text.
- A mismatched pack size blocking the save, verified by observing that **zero** PATCH requests were issued and that the stored pack size remained 50.
- A duplicate option label flagging the later duplicate row in the correct group, and no other row or group.
- The absence of the deprecated quantity-steps editor.

The backend's own rejection was confirmed separately, directly against the admin API: `PATCH /admin/products/16` with `{"pack_size": 30}` returns 422 `pack_size_tier_mismatch` with the message "Tier quantities must be multiples of pack_size 30; offending: 50, 100, 250, 500, 1000". An invalid unit label is likewise rejected with the documented character rule.

**What was not exercised, and must not be read as passing.**

- **Order detail's "N packs (M pcs)" rendering has no live data to verify against.** A direct database query confirmed that no order line anywhere has a pack size above 1, because producing one requires an authenticated customer checkout — and customer login is OTP-only, with the code written to a stream this run could not read. The rendering is covered by `OrderItems.test.tsx` and the backend's order-snapshot tests, but not against a real order. The same gap means the specification's "history is unaffected when a product's pack size later changes" requirement also has no live demonstration, even though this product is now exactly the one that would provide it.
- **The specification's headline validation example, ₹100 per pack of 30, is unreachable through this form.** At pack size 30 every stored tier rehydrates to a fractional pack count, so the derived quantity stops being a whole number, fails the schema's integer check, and the refinement that owns the whole-paise rule is skipped. Staff therefore see quantity errors instead of the clearer paise explanation. The rule itself is correct and fires as soon as quantities are integral — verified live at ₹300.01 per pack of 50 — and is unit-tested at the specification's exact vector. This is an error-precedence problem, not a correctness one.
- **MRP per pack was not exercised in the browser.** The chosen test product has no MRP on any tier. A second product was configured to pack size 50 through the API to confirm the data path, and its public response returns a per-pack price of ₹450.00 against a per-pack MRP of ₹600.00 — exactly `price_per_unit × 50` and `mrp_per_unit × 50` — but the admin form's MRP-per-pack column was not driven by hand.
- Role-based access control, bulk discounts on a pack product, and creating a brand-new pack product from scratch were all out of scope for this run.


## Accessibility

automated scan only — manual/screen-reader review still needed

**Critical.** Up to three buttons have no discernible text (`button-name`) — one on the login page, two on the products list, rising to three once the search box has been used. This matches the known residual from the earlier Product Catalog run, which reduced this rule from 27 nodes to 2 on these screens; the third node appears only after typing, so the search field's clear affordance is the likely addition. Up to two form controls on the login page have no programmatic label (`label`). Both findings pre-date this feature. The new pack interface is not implicated: the pack-size input is paired with its "Sold in packs of" label by `htmlFor`/`id` *and* carries an explicit accessible name, every per-row pack input is individually named by row index, and the feed card's only button has visible "Copy" text.

**Serious.** Colour contrast is the dominant finding by volume, peaking at 18 nodes on the product edit page. Pack selling does contribute nodes here: the piece-count and per-piece readouts, the pack explainer paragraph and the option-rounding hint all use the same muted token already failing elsewhere on the form — 17 nodes before any pack interaction, 18 after. So the feature adds to an existing failure rather than creating a new one.

**Moderate.** Up to five content areas sit outside any landmark (`region`); the feed card is itself a correctly labelled section, so it improves rather than worsens this. One node each for `landmark-one-main`, `landmark-unique`, `page-has-heading-one` and `heading-order`. The last is worth a specific look: the feed card introduces an `h2` on the products list, so that page should be confirmed to have an `h1` above it rather than starting at `h2`.

A hydration-mismatch console error appeared on the login step. It was investigated rather than assumed: the diff consists entirely of `caret-color: transparent` on the email and password inputs, and `caret-color` appears **zero** times across both applications' source trees. This is Chromium's own programmatic-input handling under Playwright — test tooling, not an application defect — consistent with the standing finding in the pipeline's documentation, re-verified here rather than carried over.


## Performance

**No performance figures were collected, and none should be quoted.** Both Lighthouse checkpoints are null in the run log. This is deliberate and structural for the admin panel rather than a choice made for this feature: the access token lives only in memory, never in local storage, so a checkpoint taken after login is redirected back to the login page by the route guards and would measure the wrong page. Running the audit anyway would produce a `url_mismatch` and a figure that describes the login screen.

One thing worth watching that the run could not measure: the pricing section now runs an effect on every keystroke that re-derives every tier's wire values from the pack inputs, keyed on a serialisation of all three pack fields across all rows. With five tiers this is invisible. On a product with a long tier list it is per-character work proportional to the number of rows, and would be worth re-checking there.


## Recommendations & future improvements

**High priority**

1. **Decide and act on the "Lowest tier price" per-pack figure.** For the test product the admin list reads **₹125 per pack of 50** while the storefront card for the same product reads **₹300 per 50 pcs**. Both are internally correct — the admin shows the lowest per-unit price (₹2.50, on the 1,000-piece tier) multiplied by the pack size, i.e. the best achievable per-pack *rate*, whereas the storefront shows the best-value tier. But ₹125 is not a price any customer can pay for one pack; reaching that rate requires buying twenty packs, and the "per pack of 50" caption reads as an entry price. The underlying divergence pre-dates pack selling; multiplying by the pack size is what makes a unit rate look like a concrete pack price. Either keep the rate semantics and relabel so it cannot be misread, or switch the column to the same best-value basis the storefront and feed use so all three surfaces agree. This was flagged rather than fixed because it is a product-copy decision, not a defect.

**Medium priority**

2. **Reorder the pack validations so the whole-paise message survives a mismatched pack size.** Running the paise check independently of the integer-quantity check — or suppressing the derived-quantity error while pack inputs are mid-edit — would let staff see the message that actually tells them what to do.
3. **Exempt a pack-size or unit-label-only edit from the three-photo save guard,** or scope that guard to publishing rather than every save. As it stands, opting an existing low-media product into pack selling forces an unrelated image upload; this blocked the save path on the chosen test product, which shipped with no images, and had to be worked around inside the test.
4. **Have the feed card reflect reality.** It shows the URL unconditionally and makes no backend call, so it cannot tell staff that the route is currently returning 503 `feed_not_configured` — which it does anywhere `FRONTEND_URL` is a localhost origin. Someone could copy that URL into Merchant Center from a staging box and only discover the failure on the channel's side. The specification deferred a feed-health summary; a simple serving/not-configured indicator is the minimum version of it.

**Low priority**

5. **Confirm the products list has an `h1` above the feed card's new `h2`,** given `heading-order` is flagged on that screen.
6. **Close out the residual `button-name` criticals** (two to three nodes on the login page and products list). They pre-date this feature and are tracked from the Product Catalog run, but they remain genuine critical findings on a screen this feature now owns a card on.
7. **Exercise MRP per pack through the form by hand,** and cover the hydration case where a stored tier quantity does not divide by the pack size, which the specification says should show the row in an error state rather than crash.

