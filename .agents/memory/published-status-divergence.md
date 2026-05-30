---
name: Published status differs by table
description: Which status value counts as "public/published" for projects vs companies.
---

# Published / public status is NOT uniform across tables

- **Projects** are public when `status = "open"`.
- **Companies / providers** are public when `status = "approved"`.

**Why:** The two entities evolved separate status vocabularies. Any endpoint or query that must return only publicly-visible records has to use the right value per table. The public projects listing in the frontend filters on `status === "open"`, confirming "open" is the published state for projects.

**How to apply:** When adding a query that should return only published/public data, gate projects on `"open"` and companies on `"approved"`. Do not assume a shared constant. Note: at least one older route used `"approved"` for projects, which silently returns nothing because no project rows use that value — double-check against actual data when filtering.
