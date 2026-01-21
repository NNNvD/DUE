#!/usr/bin/env bash
# Usage: REPO=owner/name ./create_due_v1_qa_fixes.sh
set -euo pipefail

if [[ -z "${REPO:-}" ]]; then
  echo "Set REPO=owner/name before running."
  exit 1
fi

gh repo view "$REPO" >/dev/null 2>&1 || { echo "Repo $REPO not accessible via gh."; exit 1; }

MILESTONE="v1 QA fixes — Align with About & Contribute"
if ! gh milestone view "$MILESTONE" --repo "$REPO" >/dev/null 2>&1; then
  gh milestone create "$MILESTONE" --repo "$REPO"
fi

create_issue() {
  local title="$1"; shift
  local body="$1"; shift
  local labels="$1"; shift
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels" --milestone "$MILESTONE"
}

create_issue "Fix broken essay links (404s) from the Library" "$(cat <<'BODY'
Several Library/Latest items route to non-existent pages. Slugs/permalinks must match generated pages.

**Acceptance Criteria**
- All essays listed on Home/Library resolve to a valid detail page.
- No 404s from any essay card or “Latest releases”.

**Tasks**
- Audit slugs (`site/essays/published/*`) vs generated URLs.
- Normalize Eleventy permalinks (fileSlug or explicit `permalink`).
- Add an automated link check in CI (optional).
BODY
)" "bug,frontend,priority:high"
create_issue "Repair breadcrumb: “Published” segment 404s" "$(cat <<'BODY'
Breadcrumb link points to `/essays/published/` which isn’t routed.

**Acceptance Criteria**
- Breadcrumb links only to existing routes.
- If a “Published” index page is desired, implement it; otherwise remove the segment.

**Tasks**
- Either create `/essays/published/` index template or remove/replace breadcrumb segment.
- Test from multiple essay pages.
BODY
)" "bug,frontend"
create_issue "Enable comments on published essays (giscus)" "$(cat <<'BODY'
About/Contribute say “scroll to comments,” but giscus is not configured.

**Acceptance Criteria**
- Published essay pages render a working giscus thread.
- Drafts do not show comments.

**Tasks**
- Enable Discussions; create category (e.g., “Comments”).
- Configure `data-repo`, `data-repo-id`, `data-category`, `data-category-id` in the giscus script.
- Guard rendering to `/essays/published/*`.
BODY
)" "comments,frontend,priority:high"
create_issue "Make the Interactive Library browser load (search + filters)" "$(cat <<'BODY'
Library shows “Loading …” placeholders; client index is not hydrating.

**Acceptance Criteria**
- Search over title/topic/keywords/author works.
- Filters (length bin, finished/unfinished, author/coauthor, keyword) work.
- No “Loading …” messages after build/hydration.

**Tasks**
- Emit JSON index at build time.
- Ensure the client script loads and binds to UI controls.
- Add empty-state messages for no results.
BODY
)" "search,frontend"
create_issue "Unify Drafts visibility across pages" "$(cat <<'BODY'
A draft appears on Home/Library while Drafts page shows none.

**Acceptance Criteria**
- Home, Library, and Drafts page read from the same collection.
- Counts and items match across surfaces (modulo pagination).

**Tasks**
- Centralize draft query/collection logic.
- Add a single source of truth for “in progress” drafts (date-based).
BODY
)" "bug,frontend"
create_issue "Standardize version display to semantic X.Y.Z" "$(cat <<'BODY'
Mixed formats (`v0.1`, `v0.1.0`) are shown.

**Acceptance Criteria**
- All list/detail surfaces display `version X.Y.Z`.
- First publish rules: finished → `1.0.0`; unfinished → `0.1.0`.

**Tasks**
- Update templates to format version consistently.
- Adjust bump script if needed to ensure 3 segments.
BODY
)" "frontend,content"
create_issue "Render Version history snapshots" "$(cat <<'BODY'
“Version history” exists but shows “No snapshots yet.”

**Acceptance Criteria**
- On each version bump, a snapshot is written under `site/essays/snapshots/<slug>/vX.Y.Z.md`.
- Essay page lists links to snapshots; each snapshot page renders.

**Tasks**
- Verify bump workflow writes snapshots (major/minor).
- Ensure `snapshots` Eleventy collection and `snapshot.njk` are active.
- Add “Compare with previous” link stub (optional).
BODY
)" "frontend,infra"
create_issue "Reconcile word-range taxonomy across site" "$(cat <<'BODY'
About/Home vs essays conflict (e.g., 100–500 vs 250–500).

**Acceptance Criteria**
- A single scheme is used everywhere (recommended: 250–500 / 500–1000 / 1000–1500).
- Copy, badges, and front-matter all match the chosen scheme.

**Tasks**
- Decide scheme; update About/Contribute copy.
- Update badge logic and text labels.
- Add a build check that warns if an essay’s `word_range` is outside allowed bins.
BODY
)" "content,frontend"
create_issue "Fix topic truncation on essay pages" "$(cat <<'BODY'
At least one essay shows a truncated topic line.

**Acceptance Criteria**
- Topic renders the full string (up to guideline limits).
- Optional: enforce ≤5 words with a build-time warning; never truncate visually without tooltip.

**Tasks**
- Inspect the template where topic is injected.
- Remove accidental substring/ellipsis; add CSS wrap if needed.
BODY
)" "bug,frontend"
create_issue "Footer year and metadata consistency" "$(cat <<'BODY'
Footer year sometimes blank or inconsistent.

**Acceptance Criteria**
- A single footer partial renders a correct year across all pages.
- No empty placeholders.

**Tasks**
- Centralize footer in `base.njk`.
- Add a test page check (optional).
BODY
)" "frontend,polish"
create_issue "Verify feeds (Atom/JSON) and links" "$(cat <<'BODY'
Feeds are advertised but may not be generated/linked correctly.

**Acceptance Criteria**
- `/feed.xml` and `/feed.json` exist and validate.
- Footer or head links point to correct feed URLs.

**Tasks**
- Generate feeds via Eleventy plugin or custom template.
- Validate in a feed reader; fix content type and paths.
BODY
)" "seo,infra"
create_issue "Accessibility: length badges use color + shape + text" "$(cat <<'BODY'
Current UI relies heavily on color.

**Acceptance Criteria**
- Each length badge includes an icon (square/triangle/circle), color, and visible text; `aria-label` present.
- Contrast and focus styles meet WCAG 2.1 AA.

**Tasks**
- Add SVGs, aria labels, and visible text.
- Audit with axe/lighthouse and fix issues.
BODY
)" "a11y,frontend"
create_issue "Regression QA: site matches About/Contribute promises" "$(cat <<'BODY'
Validate that the site behavior now matches what About/Contribute promise.

**Acceptance Criteria**
- All essay links valid; comments live on published essays; Library search/filters work; consistent versioning; snapshots visible; consistent word ranges; footer/meta OK; feeds valid.

**Tasks**
- Execute a short manual QA plan.
- Capture before/after screenshots.
- Close out milestone.
BODY
)" "qa"