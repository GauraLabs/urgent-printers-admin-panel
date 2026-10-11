# Subcategories and Category SEO (Admin)
**Project:** Urgent Printers — Admin Panel  
**Generated:** 2026-10-11T05:30:00Z  
**Run:** 2026-10-10T20:30:49.195Z — 54 steps, viewport 1280×720  
---
## Overview and objectives

This is the **admin half** of the Subcategories and Category SEO feature. The storefront half was documented separately on the same day; between them they cover one journey — a staff member nests a category and writes its SEO copy in the admin panel, and the storefront then rolls products up into it, marks it up for search engines, and redirects any product URL that moved.

The goal for the person using this screen: **organise the catalog into a two-level category tree and give every category the SEO content the storefront needs — meta title and description, answer-first intro copy, longer body copy, FAQs, a Google product category and a noindex switch — without breaking existing product URLs.**

Why it matters commercially: subcategories make a thin catalog navigable, and they give each level its own indexable, answer-first landing page. That is where organic search traffic and Google Shopping traffic actually arrive, so the quality of what an admin can type here is the ceiling on what those pages can rank for.

One thing to be clear about up front. The planning document behind this work (`plans/subcategories-seo-plan.md`) describes a **production** taxonomy — Wedding above Wedding Tags, Wedding Essentials, Shagun Envelope and Welcome Board, with 20 products moving. **Nothing in this run touches production or verifies that document.** This run exercised the development catalog, which is a different and smaller tree: *Marketing Prints* above *Flyers & Leaflets* and *Posters*, and *Stickers & Labels* above *Die-cut Stickers*. The rollout plan, the redirect map and the 20-product move remain unverified by this pipeline.


## Feature description and business logic

The hierarchy itself needed no database change — `categories.parent_id` has existed since the initial migration. What this feature built is the behaviour around it, and the admin panel is where almost all of that behaviour becomes visible.

**The tree is capped at two levels, and the UI enforces that before the server has to.** The category form's parent picker offers only top-level categories, excludes the category being edited, and goes **disabled entirely** — with the hint *"This category has subcategories, so it must stay top-level."* — when the category already has children of its own. That one rule, implemented in `eligibleParents`, is what makes a three-level tree unreachable by clicking. The server re-validates every parent change anyway and is the real authority: it rejects a cycle, a self-parent and an over-depth nest with three distinct, human-readable 422 messages.

**Counts are shown twice, because a parent needs both numbers.** A category row shows its own direct product count and, when it has children, the rolled-up total across its whole subtree — rendered as `0 · 2 total` for *Marketing Prints*, which holds no products itself but has two underneath it. Showing only the direct count would make a perfectly healthy parent look empty, which is the exact symptom the storefront half had to fix on its own category pages.

**A category is deleted child-first, by design.** Deleting a parent that still has subcategories is refused with a 409. The admin panel warns about this twice: the confirmation dialog says the category has *N* subcategories and that the delete will be rejected, and if the admin confirms anyway the server's refusal is surfaced as a specific message — *"Move or delete its subcategories first"* — rather than a generic failure.

**Everywhere a category is picked, the full path is shown.** The product form's category select groups children under their parent and labels them `Parent > Child`; it also shows a soft amber warning when a parent that has children is chosen, because a product belongs on a leaf unless there is a reason otherwise. The products list shows each product's full category path instead of its leaf name, and filtering by a parent includes everything underneath it. The navigation-link picker shows full paths too, so an admin linking the header menu to *Posters* can see which parent it sits under.

**The SEO section is the other half of the feature.** Meta title and description have live character counters against Google's 60/160 rendering guidelines, with a Google snippet preview underneath that shows the host, the URL path, the title in link blue and the description beneath it. Below that sit the fields the storefront renders on the page itself: an answer-first intro paragraph above the product grid, longer body copy below it, and a FAQ editor with add, remove and reorder controls capped at 20 entries. A `google_product_category` field feeds the shopping feed, and a noindex switch keeps a thin category out of the index without deleting it.

**Changing a slug is a warning, not a block.** Editing the slug of an existing category shows an alert naming both the old and new URL and stating plainly that existing links and search rankings will break. It appears and disappears live as the field is edited; nothing needs to be saved to clear it.


## User flow

The run follows a single staff member through one continuous session, from signing in to leaving the tree exactly as they found it.

They sign in and open **Categories**. The list is a tree: *Die-cut Stickers* sits indented beneath *Stickers & Labels*, *Flyers & Leaflets* and *Posters* beneath *Marketing Prints*. The *Marketing Prints* row reads `0 · 2 total` — no products of its own, two in its subcategories. They collapse that row and its two children disappear; they expand it and the children come back, still indented.

They click **Add Category** and create a new top-level one. Typing the name derives the slug automatically. The parent picker is enabled, sits on *None (top-level)*, and offers only top-level categories — *Marketing Prints* and *Stickers & Labels* are there, but *Posters*, *Flyers & Leaflets* and *Die-cut Stickers* are not, because a subcategory cannot be a parent. They upload one image, which the form requires, and save. The new row appears at the top level.

They add a **second** category, this time choosing the one they just created as its parent, and fill the whole SEO section: a meta title and description (watching both counters), the Google snippet preview updating as they type, an answer-first intro, longer body copy, two FAQs, a reorder of those FAQs so the more important question comes first, a Google product category, and the noindex switch turned on. They save, and the new category appears **indented one level beneath its parent**, with the parent's count line now carrying a rolled-up total.

They re-open the subcategory to check their work: the parent picker is pre-set, every SEO field holds what they typed, both FAQs are present in the order they rearranged them, and noindex is still on. While they are there, they rename the slug and the URL warning appears; they put the original back and it goes away.

They then look at the surfaces that consume the tree. On the **new-product form**, the category select groups children under their parent and labels them `Marketing Prints > Posters`; picking the parent itself raises the soft "pick the most specific subcategory" warning, and picking a child clears it. On the **products list**, each product shows its full category path, and filtering by *Marketing Prints* — which has no products of its own — returns the two products from its subcategories. They select one product and open **Move to category…**, pick a target, read the confirmation that names both the count and the full destination path, and **back out without moving anything**. On **Content → Navigation**, the category picker lists subcategories by their full path.

Finally they try to delete the parent while it still has a child, and the system refuses: the dialog warns first, and confirming anyway produces *"still has subcategories. Move or delete its subcategories first."* with both rows still in place. So they delete the child, then the parent — and the tree is back to exactly the nine categories and the same counts it started with.


## Annotated screenshots

Captured at 1280×720 at 2× device scale against the local development server. The sequence below picks the entry state, each genuine state change and the end state, rather than every form field in turn — the full 54-step sequence is in the run log.

Screenshots are gitignored, so if you are reading this on a machine that did not produce the run, the renderer shows a filename note in place of each image. That is expected.

| Step | Screenshot | What it shows |
| --- | --- | --- |
| `hp-01` | ![hp-01](../../screenshots/subcategories-and-category-seo-admin/hp-01.png) | The categories list as a tree: Die-cut Stickers indented under Stickers & Labels, Flyers & Leaflets and Posters indented under Marketing Prints. |
| `hp-02` | ![hp-02](../../screenshots/subcategories-and-category-seo-admin/hp-02.png) | Marketing Prints reads "0 · 2 total" — no products directly in it, two rolled up from its subcategories. |
| `hp-03` | ![hp-03](../../screenshots/subcategories-and-category-seo-admin/hp-03.png) | The same row collapsed: both child categories are hidden and the control flips to "Expand Marketing Prints". |
| `hp-08` | ![hp-08](../../screenshots/subcategories-and-category-seo-admin/hp-08.png) | The create form's parent picker, offering only top-level categories, with the hint "Only top-level categories can be parents (two levels maximum)." |
| `hp-12` | ![hp-12](../../screenshots/subcategories-and-category-seo-admin/hp-12.png) | The second category's parent set to the one just created — the step that actually makes it a subcategory. |
| `hp-15` | ![hp-15](../../screenshots/subcategories-and-category-seo-admin/hp-15.png) | The Google snippet preview: host and URL path, the meta title in link blue, the meta description beneath — what the search result will look like. |
| `hp-18` | ![hp-18](../../screenshots/subcategories-and-category-seo-admin/hp-18.png) | Two FAQs filled in, with the add button counting "(2/20)" against the 20-entry cap. |
| `hp-19` | ![hp-19](../../screenshots/subcategories-and-category-seo-admin/hp-19.png) | After moving the second FAQ up: the questions have swapped places and "Move FAQ 1 up" is now disabled. |
| `hp-21` | ![hp-21](../../screenshots/subcategories-and-category-seo-admin/hp-21.png) | The noindex switch turned on — keeps a thin category out of search results without deleting it. |
| `hp-22` | ![hp-22](../../screenshots/subcategories-and-category-seo-admin/hp-22.png) | Saved: the new subcategory appears indented one level under its parent, and the parent's count line now carries a rolled-up total. |
| `hp-23` | ![hp-23](../../screenshots/subcategories-and-category-seo-admin/hp-23.png) | Re-opened for editing: parent pre-set, every SEO field populated, both FAQs in their reordered order, noindex still on. |
| `alt-14` | ![alt-14](../../screenshots/subcategories-and-category-seo-admin/alt-14.png) | Editing the slug raises the URL warning, naming both the old and new address and stating that existing links and rankings will break. |
| `alt-16` | ![alt-16](../../screenshots/subcategories-and-category-seo-admin/alt-16.png) | A category that has subcategories: the parent picker is disabled with "This category has subcategories, so it must stay top-level." — the two-level cap enforced before any request is made. |
| `edge-01` | ![edge-01](../../screenshots/subcategories-and-category-seo-admin/edge-01.png) | The FAQ editor at its cap: the add button reads "(20/20)" and is disabled. |
| `edge-03` | ![edge-03](../../screenshots/subcategories-and-category-seo-admin/edge-03.png) | Intro copy past 2000 characters: a hard limit, blocking the save with "Max 2000 characters" — unlike the advisory meta-title counter. |
| `err-02` | ![err-02](../../screenshots/subcategories-and-category-seo-admin/err-02.png) | A blank FAQ row blocks the save with "Question is required" and "Answer is required"; nothing is sent to the server. |
| `alt-02` | ![alt-02](../../screenshots/subcategories-and-category-seo-admin/alt-02.png) | The product form's grouped category select, with the soft amber warning shown when a parent that has children is chosen. |
| `alt-05` | ![alt-05](../../screenshots/subcategories-and-category-seo-admin/alt-05.png) | Filtering products by Marketing Prints — which holds no products itself — returns the two products from its subcategories, in one request. |
| `alt-10` | ![alt-10](../../screenshots/subcategories-and-category-seo-admin/alt-10.png) | The bulk move dialog's confirmation step, naming both the count and the full destination path. The confirm button was deliberately never clicked. |
| `alt-13` | ![alt-13](../../screenshots/subcategories-and-category-seo-admin/alt-13.png) | The navigation-link picker listing subcategories by their full "Parent > Child" path, in tree order. |
| `err-01` | ![err-01](../../screenshots/subcategories-and-category-seo-admin/err-01.png) | Deleting a parent that still has a subcategory is refused: "still has subcategories. Move or delete its subcategories first." Both rows remain. |
| `edge-05` | ![edge-05](../../screenshots/subcategories-and-category-seo-admin/edge-05.png) | After deleting the child and then the parent: the tree is back to exactly the nine categories and the same counts it started with. |


## Test results and coverage

**54 steps, 54 passing, 0 failing.** The run artifact validates against the pipeline's run-log schema.

The suite is a single Playwright test — one browser context, one login — covering the happy path (23 steps), six alternate paths (17 steps), five error paths and five edge cases, plus four authentication steps that are infrastructure rather than feature behaviour. It was hand-authored against the real component source rather than generated by Playwright's MCP-driven Generator agent; `pipeline/README.md` documents that fallback, and the two reasons it was the right trade here were the 10-per-hour admin login rate limit and this run's strict, user-approved data rules.

**What passed, specifically.** The indented tree with its `data-depth` levels and working collapse/expand. The `direct · N total` count on both existing parents. The create-form parent picker offering top-level categories only and excluding the category itself. The disabled picker, with its hint, on a category that has children. Automatic slug derivation. The whole SEO section round-tripping through a save and re-open — meta fields, snippet preview, intro, body, both FAQs in their reordered order, Google product category and the noindex switch. The slug-change URL warning appearing and clearing live. The grouped `Parent > Child` product select and its soft parent warning. Full category paths in the products list, and a parent filter that rolls up descendants in a single request. The bulk move dialog through to its confirmation step, naming the count and the destination path. Full paths in the navigation-link picker. The 409 refusal when deleting a parent with children, with nothing deleted. FAQ blank-row validation, the 20-row cap, the advisory meta-title counter and the hard 2000-character intro limit. The server's cycle, self-parent and over-depth rejections, each with its own specific message. And a clean child-then-parent delete that left the tree byte-for-byte as found.

**What this run did not exercise — read this before treating the feature as fully covered.**

- **No bulk move was ever committed.** The dialog is driven to its confirmation step and then cancelled, because this run was forbidden from moving any existing product (a cached 308 on the storefront cannot be withdrawn). The dialog's own contract is verified; the `PATCH /admin/products/bulk-category` round-trip, its success toast and its cache invalidation are not. They were confirmed manually beforehand, which is evidence — but not evidence this suite will catch a regression in.
- **The `products.edit` permission gate was not tested.** Only a super-admin account is seeded here, and creating a restricted staff user would have been an unapproved database change. A regression that showed the bulk toolbar to a view-only role would not have been caught.
- **The 500-product bulk-move cap was not reached** — the development catalog holds 12 products. Both the client and server guards were confirmed by reading the code.
- **The three server-side tree guards were asserted over the authenticated API, not through the browser**, because the UI deliberately makes those requests unreachable. The client-side prevention is covered separately.
- **Cross-parent sibling reordering is only lightly covered**: every development category sits at sort order 0, so the arrows mostly exercise a name tie-break.

**Fixes dispatched and verified during this run.** Three accessibility defects on this feature's own screens were found, fixed by the admin-panel developer agent and re-verified by a fresh capture: the categories list's per-row actions menu had no accessible name (one unnamed button per row); the category form's Slug field and the media uploader's two file inputs had no programmatic label; and the navigation manager's 21 icon-only reorder/edit/delete buttons had no names at all. A fourth was traced during the same loop and also fixed — see the accessibility section, because it had been misdiagnosed for three previous runs.

**Data created and removed.** Three capture passes each created one disposable parent and one child category (`QA Parent <runid>` / `QA Child <runid>`, with a generated placeholder image), and each deleted both at the end, child first. A read-only check after the final pass confirms the catalog is back to exactly its original nine categories with their original parents and counts, and no QA records remain. No existing category was renamed, re-parented or deleted; no existing product changed category; product 16 was not moved.


## Accessibility

**automated scan only — manual/screen-reader review still needed.** Automated scanning typically catches only 30–40% of real accessibility issues, so a clean critical/serious result on this feature's routes does not mean these screens are accessible.

**Four critical-impact findings were fixed during this run, and this feature's own screens now report zero.**

1. **The categories list's row actions menu had no accessible name** — one unnamed button per row (9 rows, rising to 11 as the test's own categories were added). The reorder arrows and the collapse chevron were already labelled; the `…` menu, the only route to Edit and Delete, was not. First reported by the Category Management run as "up to 27–30 nodes" and still partly open: the arrows were fixed then, the menu was not.
2. **The category form had three unlabelled controls.** The Slug field was the real one — a bare visual label with no programmatic pairing *and* no placeholder. The other SEO fields were only passing because a placeholder was serving as their name of last resort, so the fix gave every text control in the form a real label association rather than leaving the names dependent on placeholder copy surviving a rewrite. The media uploader's two file inputs were the other two, and naming them also cleared two long-standing findings on the product form.
3. **The navigation manager had 21 unnamed buttons** — four per link row (move up, move down, edit, delete). Reordering, editing and deleting a navigation link were all unnameable.
4. **The three dropdown filters were unnamed buttons, and had been misdiagnosed for three runs.** Two findings on the products list had been carried forward by three previous analyses as "residual, outside this feature's components." A read-only scan that recorded the offending elements proved they were the status and category filter controls, plus the navigation picker. They *look* named — they visibly read "All statuses", "All categories" — but the component library marks them with a role for which visible content never contributes an accessible name; for that kind of control the content is the *value*, not the name. They were given names describing their purpose ("Filter by status", "Filter by category", "Target category") rather than their current value, which would have created a new conformance problem of its own. Two of the three are controls this feature changed.

**One critical finding remains, deliberately out of scope:** the login page's password show/hide toggle has no accessible name. It is not part of this feature — the login screen is only crossed to reach an authenticated page — and it has now been deferred by four consecutive admin runs. It is cheap and should be picked up by whichever run next owns that page.

**One serious finding remains, deliberately out of scope: colour contrast**, 6–26 nodes on every route the run touched, worst on the new-product form. It is unchanged in volume from previous runs and appears on the dashboard, which contains none of this feature's interface, so it is an admin-theme design-token decision spanning the whole application rather than anything these components introduced. It needs one deliberate decision about the theme's muted foreground colours, not a per-component patch — which is why no fix was dispatched. It is worth flagging that this is now its fourth consecutive appearance: correct to defer in any single run, and the wrong outcome across four of them.

**Moderate findings**, all pre-existing and none on this feature's own screens except as a shared-layout issue: two landmarks resolve to the same role and name on every authenticated route (almost certainly the shell's sidebar and header navigation, since it is perfectly uniform even on pages with none of this feature's interface); a heading level is skipped on the dashboard, the new-product form and the navigation page; and the login page has no main landmark, no top-level heading, and content outside any landmark.

**The gap automated scanning structurally cannot catch, and the most important item in this section.** The categories list conveys its hierarchy *only* visually — indentation plus a data attribute. There is no tree or grid-level semantics, no level or position information on the rows. A screen-reader user hears nine flat rows with nothing to indicate that three of them are children of others. The feature's entire concept is invisible to assistive technology even though every button on the row is now correctly named. A plain table with padding is valid HTML, so no scanner will ever flag this; it needs a deliberate decision. Also unverified by automation and worth a manual pass: whether the collapse/expand state change is announced, whether a FAQ reorder announces the item's new position, and whether the slug-change alert is actually spoken when it appears.

**Console output was clean.** The run's only console error is the expected 409 from the server correctly refusing to delete a parent that still has a subcategory — the finding under test. A hydration-mismatch warning that appeared on the login page during an intermediate pass did not recur in the final one and is a known test-tooling artefact of programmatic form filling, not an application defect.


## Performance

**No performance numbers were measured in this run, and none should be inferred from it.** Lighthouse was deliberately turned off for this suite, so both checkpoints are empty in the run log.

The reason is specific to this application and is recorded in its own configuration notes: the admin panel keeps its access token in memory only, never in browser storage. The capture harness can restore the persisted `user`/`isAuthenticated` flags into the context Lighthouse audits, but not a live token — so a checkpoint taken after login gets redirected to the login screen and reports numbers for the *wrong page*. A score that measures the login form while claiming to measure the categories list is worse than no score, so none was taken.

**Consequence:** there is no performance baseline for either of the two screens this feature changed most — the categories list with its tree, and the category form with its SEO section. Establishing one needs a different approach than a post-login checkpoint: either auditing a page reachable before the redirect, or restoring a live token into the audit context.

**What the run does tell us about performance, structurally — and it matters more here than a score would.** The feature adds no per-row database queries. The category tree, each category's ancestors, the rolled-up counts and the eligible-parent list are all computed in memory over a single already-cached category list on the server, rather than with recursive SQL per request; the admin panel likewise builds its own tree client-side from one request for all categories. Steps `alt-05` and `alt-07` confirm that filtering the products list by a parent category rolls up descendants in a **single** request rather than fanning out over children. The whole 54-step run, including creating and deleting a two-level category pair with image uploads, completed in roughly 50 seconds of wall-clock time, which is consistent with that design.

That single-request rollup is the thing to re-check if the catalog ever grows well past a handful of categories, since the in-memory approach is explicitly a bet on the category set staying small.


## Recommendations and future improvements

Ordered by severity, highest first.

**High — decide whether the categories table should expose its hierarchy to assistive technology.** The tree is currently visual only, so the feature's core concept does not reach a screen reader even though every control on the row is now correctly named. Cheapest option: add level and position information to the row's name cell and keep the plain table. Fuller option: move to proper grid-tree semantics with expansion state on the rows. No scanner will catch this, which is exactly why it needs a human decision.

**High — give the admin theme's colour tokens a deliberate contrast pass, or write down that the debt is accepted.** Colour contrast is the only serious finding left, it is on its fourth consecutive admin analysis unchanged, and the new-product form alone carries 26 instances. Deferring it is defensible in any one run and is producing the wrong outcome across four. One decision about the muted and secondary foreground tokens would likely clear most of the volume across all eight routes at once.

**Medium — audit the rest of the application's dropdown controls for the same unnamed-control defect this run uncovered.** The mechanism is general: the component library's trigger takes a role for which visible value text never contributes an accessible name, and it only wires a name automatically when a form-field label exists. Every such control in the admin panel without one is an unnamed control, not just the three fixed here. The stronger version, raised by the implementing agent and worth considering: make the shared wrapper *require* a label so a new unnamed dropdown cannot ship. That widens the shared component's interface, so it is a human call rather than something this run should have done unilaterally.

**Medium — cover the bulk-move commit path and the permission gate in a follow-up run** that has permission to change product categories and a second, lower-privileged seeded staff account. These are the two genuine coverage holes left, both for environment reasons rather than product ones. A reversible target — move a product to a sibling category and move it straight back within the same test — would cover the commit path without touching the one product whose URL must not change.

**Low — name the login page's password toggle and the list screens' search-clear button.** The login toggle is the last critical finding anywhere in this run and has been deferred four times. The search-clear button was found by source reading during this run's fix loop; it only renders once the search box has text, which is why it is absent from this run's counts — but it is a genuine unnamed button on every admin list screen, and it explains an earlier run's puzzling observation that the products list's count rose by one after the search box was used.

**Low — distinguish advisory from hard character limits in the category SEO section.** Meta title and description recolour past their limits but still save; intro and body copy block the save. Identical counters, identical red, no way to tell which number is a guideline and which is a wall until you try. One clarifying word per counter would fix it.

**Low, and a pipeline improvement rather than a product one — record *which element* each accessibility violation was found on, not just how many.** This run spent an entire fix dispatch on a misattribution that the element data settled in one read-only scan, and three previous runs carried the same two findings as "unattributed residual" for want of it. The capture harness already has that data in hand when it writes the count. This is a change to the pipeline's own tooling, so it belongs with the pipeline's documentation owner rather than a product developer.

