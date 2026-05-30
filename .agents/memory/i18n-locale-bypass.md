---
name: i18n locale-bypass traps
description: Recurring spots where ImmoVia UI text silently stays English despite the t.admin/t.* translation system being wired.
---

When translating a surface to the `useLanguage()` + `t.<ns>.*` system, wiring visible JSX labels is not enough. Three classes of text bypass the locale and must be handled explicitly:

1. **Hardcoded language args to category helpers.** `getCategoryLabel(cat, "en")` / `resolveCategoryLabel(s, "en")` force English. Pass `language as Lang` instead. Note `language` must be destructured from `useLanguage()` in that component — some components only pull `t`.
2. **Raw enum values rendered directly.** e.g. `{company.workerType}` (individual/company) or backend status strings. Map them through `t.*` (e.g. `workerType === "individual" ? t.admin.individual : t.admin.company`).
3. **API-provided status labels in charts/lists.** `projectsByStatus[].label` is a raw English status from the server; map via a status→`t.admin.st*` lookup, don't render `item.label` directly.

**Why:** typecheck passes and the page "looks translated" because chrome is wired, but data-driven cells leak English. A code review caught all three after the chrome looked done.

**How to apply:** after wiring a surface, grep the render paths for `"en")`, raw `{x.workerType}` / `{x.label}` / `{x.status}` enum outputs, and confirm each routes through a translation key.
