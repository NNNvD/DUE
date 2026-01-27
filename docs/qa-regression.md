# Regression QA checklist

Use this list to confirm the site behavior matches the About/Contribute promises before closing the QA milestone.

## Navigation & links
- Home, Library, and Draft schedule links resolve without 404s.
- Essay cards in Home/Library/Latest open valid detail pages.
- Breadcrumbs avoid non-routed segments (no `/essays/published/` 404s).

## Essays & comments
- Published essays render the discussion section with giscus when fully configured.
- Drafts do not show giscus or comment forms.
- Comment jump link scrolls to the discussion section.

## Library search & filters
- Search matches title, topic, keywords, author, and coauthors.
- Filters apply for length, timing (finished/unfinished/draft), author, and keyword.
- Empty-state message appears when no matches exist.

## Versions & snapshots
- Version badges display semantic `x.y.z` format everywhere.
- Snapshot history lists prior versions and links to snapshot pages.
- Snapshot links resolve with `/essays/published/<slug>/vX.Y.Z/`.

## Word ranges & badges
- Tiny/Minute/Short copy matches 250–500 / 500–1000 / 1000–1500.
- Length badges show shape, color, and visible text labels.

## Feeds
- `/feed.xml` and `/feed.json` validate and contain recent entries.
- Optional `/feeds/feed.xml` (Atom) and `/feeds/feed.json` (JSON) validate when generated.

## Footer & metadata
- Footer year/metadata renders across pages.
- Feed links in the footer point to `/feed.xml` and `/feed.json`.
