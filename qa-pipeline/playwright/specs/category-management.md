# Category Management (admin-panel)

## Category Management — happy path
### Create, edit, reorder, and delete a category
**Seed:** qa-pipeline/playwright/specs/seed.spec.ts
**Steps:**
1. Navigate to /login (step_id: auth-01)
2. Fill the email field with "admin@urgentprinters.com" — target: email input on the login form (step_id: auth-02)
3. Fill the password field with "SuperAdmin@123" — target: password input on the login form (step_id: auth-03)
4. Submit the login form (step_id: auth-04)
5. Navigate to the categories list — target: /categories (step_id: hp-01)
6. Click "Add Category" — target: link text "Add Category" (step_id: hp-02)
7. Type a unique name into the Name field, e.g. "QA Pipeline Test Category <timestamp>" — target: input for label "Name *" (step_id: hp-03)
8. Observe the Slug field auto-populated from the Name — target: input for label "Slug *" (step_id: hp-04)
9. Upload one image via the media dropzone — target: dropzone with text "Drag & drop or click to upload images" (step_id: hp-05)
10. Submit the form — target: button text "Create Category" (step_id: hp-06)
11. Return to /categories and locate the newly created row by its name (step_id: hp-07)
12. Click the new row's Up arrow to move it earlier in the order — target: icon-only Up arrow button in that row's Order column (step_id: hp-08)
13. Open the new row's actions menu and click "Edit" — target: row action menu (MoreHorizontal icon) then "Edit" menu item (step_id: hp-09a)
14. Change the Name field to a new value, e.g. append " (edited)" — target: input for label "Name *" (step_id: hp-09b)
15. Submit the edit — target: button text "Save Changes" (step_id: hp-09c)
16. Open the row's actions menu and click "Delete" — target: row action menu then "Delete" menu item (step_id: hp-10a)
17. Confirm the deletion in the dialog — target: button text "Delete Category" inside the confirm dialog (step_id: hp-10b)

**Expect:** After step 4, the admin is authenticated and lands on an admin page (not redirected back to /login). After step 6, the URL is /categories/new and a form titled "New Category" is visible. After step 8, the Slug field contains a slugified version of the typed name (lowercase, hyphens). After step 10, a success toast reading "Category created" appears and the category exists. After step 11, the new category's row is visible in the table with an "Active" status badge. After step 12, a PATCH request to /admin/categories/reorder fires and the row's position changes. After step 15, a success toast reading "Category updated" appears and the row shows the new name (its slug must NOT have changed, since auto-slug only runs in create mode). After step 17, a toast matching the pattern "\"<name>\" deleted" appears and the row is no longer present in the table.

## Not generated — unvalidated edge cases
(covered separately once the happy path is confirmed working — see qa-pipeline/artifacts/plans/category-management-plan.json's edge_cases array for the full list: view-only RBAC gap, delete-with-products behavior, malformed slug, meta-title/description over character limits, reorder boundary arrows, oversized video upload, low-resolution image upload.)
