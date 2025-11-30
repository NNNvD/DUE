Next steps for developing the DUE website

# Milestone

**Name:** `v1 — Comments-only public site`
**Goal:** Public can read & comment on **published** essays. All authoring/versioning happens in the backend.
**Exit criteria:** All issues below closed; site deployed.

Create the milestone (optional, via CLI):

```bash
gh milestone create "v1 — Comments-only public site"
```

---

## 1) Convert site to comments-only (remove public authoring hooks)

**Labels:** frontend, priority:high
**Milestone:** v1 — Comments-only public site
**Description:** Remove any UI paths that invite starting/editing essays. Keep drafts page read-only or hide it from nav.
**Acceptance criteria**

* No “Start a new essay”, “Suggest change”, or contribution CTAs on any page.
* Drafts page is either hidden from nav or clearly read-only (no comment or edit actions).
* About/Guidelines updated to state: comments only; editorial changes are backend-only.
  **Tasks**
* Update `site/index.njk`, `site/_includes/essay.njk`, `site/_includes/base.njk`.
* Remove contribution CTAs.
* Update About/Guidelines copy.

---

## 2) giscus comments on **published** essays only

**Labels:** frontend, comments, priority:high
**Milestone:** v1 — Comments-only public site
**Description:** Embed giscus under essay pages that live at `/essays/published/...`.
**Acceptance criteria**

* Comments render for published essays only.
* Posting a comment works with Discussions category.
* No comments on drafts.
  **Tasks**
* Enable Discussions; get repo/category IDs.
* Inject giscus block in `base.njk` behind a route guard.
* Add “Jump to comments” link in essay page.

---

## 3) Remove public contribution templates/workflows

**Labels:** infra, cleanup
**Milestone:** v1 — Comments-only public site
**Description:** Delete issue/PR templates and CI related to public content editing.
**Acceptance criteria**

* Deleted: `.github/ISSUE_TEMPLATE/new-essay.yml`, `suggest-change.yml`, `issue-to-draft.yml`, `require-change-label.yml`.
* Keep: deploy workflow; keep/adjust other CI per backend needs.
  **Tasks**
* Remove files.
* Update README/CONTRIBUTING to reflect comments-only model.

---

## 4) Essay card metadata & styling (length, color, version, word count)

**Labels:** frontend, UI
**Milestone:** v1 — Comments-only public site
**Description:** Show complete metadata consistently across cards and detail pages.
**Acceptance criteria**

* Card shows: **title (colored by length), shape icon, word range text, exact word count, version “X.Y.Z”, finished/unfinished, publication date, author, short topic (≤5 words), keywords (≤5).**
  **Tasks**
* Components for badges/icons (square/magenta, triangle/orange, circle/teal).
* Theming for length → title color.
* Render metadata fields from front-matter.

---

## 5) Build-time exact word count

**Labels:** frontend, build
**Milestone:** v1 — Comments-only public site
**Description:** Compute `word_count` at build; display everywhere needed.
**Acceptance criteria**

* Each essay front-matter populated with `word_count`.
* CI check ensures count aligns with declared `word_range` (with small grace).
  **Tasks**
* Extend existing `scripts/checkWordRange.js` to write/verify `word_count`.
* Render `word_count` in list/detail.

---

## 6) Essay browser: search & filters

**Labels:** frontend, search
**Milestone:** v1 — Comments-only public site
**Description:** Client-side search and filters for library.
**Acceptance criteria**

* Search over title/topic/keywords/author.
* Filters: length bin, finished/unfinished, author/coauthor, keyword; sortable by date.
  **Tasks**
* Build JSON index at build time.
* Implement Lunr/elasticlunr client search + UI controls.

---

## 7) Drafts page (read-only) with countdown

**Labels:** frontend
**Milestone:** v1 — Comments-only public site
**Description:** Keep drafts visible but non-interactive.
**Acceptance criteria**

* Card shows: title, author, topic (≤5 words), start date, **live countdown** to publication, length bin badge.
* No comment or edit buttons.
  **Tasks**
* Countdown component with text fallback and a11y.
* Hide page from nav if requested.

---

## 8) Length indicators: shape + color + text + a11y

**Labels:** a11y, frontend
**Milestone:** v1 — Comments-only public site
**Description:** Accessible badges for 3 bins.
**Acceptance criteria**

* Bins: 250–500 (square/magenta), 500–1000 (triangle/orange), 1000–1500 (circle/teal).
* Each badge includes visible text and `aria-label`.
  **Tasks**
* SVG icons, CSS, aria attributes.
* Legend on About page.

---

## 9) Comment form UI (minor/major intent)

**Labels:** frontend, comments
**Milestone:** v1 — Comments-only public site
**Description:** Comment UI on published essays with **Minor**/**Major** intent.
**Acceptance criteria**

* Two entry buttons preset intent (`minor` or `major`).
* Form captures name, optional contact, content, intent; shows privacy notice.
  **Tasks**
* Add form to essay template (below content, above comments list).
* Client validation + spam honeypot.

---

## 10) Comment pre-moderation: serverless → PR

**Labels:** backend, comments, infra
**Milestone:** v1 — Comments-only public site
**Description:** Submissions create a PR adding a comment YAML under `data/comments/<slug>/pending/`.
**Acceptance criteria**

* On submit, a PR is opened with the comment file (`status: pending`).
* Nothing is published until merged.
  **Tasks**
* Implement serverless function (Cloudflare/Netlify/Vercel) that:

  * Validates payload and intent.
  * Creates PR via GitHub API with comment file.
* Secrets and rate limiting.

---

## 11) Comment publishing & status display

**Labels:** frontend, comments
**Milestone:** v1 — Comments-only public site
**Description:** After PR merge, render approved comments under essay with status chips.
**Acceptance criteria**

* Approved comments appear with **Not yet implemented** by default.
* Status can be flipped to **Implemented** via a boolean in the YAML (admin edit).
* (Optional) If transparency chosen: support **Rejected** with reason.
  **Tasks**
* Build step to move from `pending/` to `approved/` on merge (or commit to `approved/` directly).
* Render comment list; chips and moderation note (if present).

---

## 12) Social share buttons + OG/Twitter meta

**Labels:** frontend, seo
**Milestone:** v1 — Comments-only public site
**Description:** Add share links for Mastodon, X/Twitter, LinkedIn, Copy Link; add meta tags.
**Acceptance criteria**

* Buttons present on essay detail; prefilled text includes title + URL.
* OG/Twitter cards render on link preview.
  **Tasks**
* Add meta tags in `base.njk` per essay.
* Implement share buttons.

---

## 13) Feeds & sitemap

**Labels:** frontend, infra
**Milestone:** v1 — Comments-only public site
**Description:** Provide `/feed.xml`, `/feed.json`, and `/sitemap.xml`.
**Acceptance criteria**

* Feeds list published essays with title, URL, version, release note, date.
* Sitemap lists all public routes.
  **Tasks**
* Eleventy feed plugin or custom templates.
* Add to footer/head.

---

## 14) Accessibility pass (WCAG 2.1 AA)

**Labels:** a11y
**Milestone:** v1 — Comments-only public site
**Description:** Global audit and fixes.
**Acceptance criteria**

* Contrast ≥ 4.5:1; keyboard traversal; visible focus; landmarks; alt text; aria labels.
* Countdown polite `aria-live`.
  **Tasks**
* Audit with axe/lighthouse.
* Fix issues and add CI report.

---

## 15) SEO + JSON-LD Article

**Labels:** seo
**Milestone:** v1 — Comments-only public site
**Description:** Add JSON-LD for each published essay.
**Acceptance criteria**

* `Article` schema includes headline, author(s), datePublished, dateModified, version.
* Unique meta descriptions per essay.
  **Tasks**
* Generate JSON-LD in essay template.
* Verify with Rich Results Test.

---

## 16) Topic & keywords constraints

**Labels:** frontend, build
**Milestone:** v1 — Comments-only public site
**Description:** Enforce topic ≤ 5 words; keywords ≤ 5.
**Acceptance criteria**

* Build warns when limits exceeded.
* UI displays up to 5 keywords; excess ignored or flagged in CI.
  **Tasks**
* Add build check; render chips.

---

## 17) Align CI/workflows with backend ownership

**Labels:** infra
**Milestone:** v1 — Comments-only public site
**Description:** Ensure CI reflects backend authoring workflow.
**Acceptance criteria**

* Keep deploy workflow.
* Remove/disable autopublish if backend handles deadlines; or keep if repo still drives it.
* Keep version bump/snapshots if backend merges here; otherwise disable.
  **Tasks**
* Review `.github/workflows/*`.
* Update README to document current flow.

---

## 18) QA: end-to-end acceptance tests

**Labels:** qa
**Milestone:** v1 — Comments-only public site
**Description:** Validate all v1 criteria.
**Acceptance criteria**

* No public authoring CTAs.
* Comments submit → PR → merge → visible with status.
* Search/filters work.
* A11y checks pass.
* Share/meta/feeds/sitemap present.

---

## (Optional) One-liners with `gh` CLI

> Run after creating the milestone; adjust labels as needed.

```bash
mk() { gh issue create --title "$1" --body "$2" --label "$3" --milestone "v1 — Comments-only public site"; }

mk "Convert site to comments-only (remove public authoring hooks)" "Remove CTAs and public authoring paths; drafts read-only." "frontend,priority:high"
mk "giscus comments on published essays only" "Embed giscus under /essays/published/* pages." "frontend,comments,priority:high"
mk "Remove public contribution templates/workflows" "Delete issue/PR templates and CI for public edits." "infra,cleanup"
mk "Essay card metadata & styling" "Title color by length; shape icon; word range; exact word count; version X.Y.Z; finished/unfinished; date; author; topic; keywords." "frontend,UI"
mk "Build-time exact word count" "Compute and render word_count; keep CI word-range check." "frontend,build"
mk "Essay browser: search & filters" "Client-side search and filters; lunr index." "frontend,search"
mk "Drafts page (read-only) with countdown" "Non-interactive draft list with live countdown." "frontend"
mk "Length indicators: shape + color + text + a11y" "Accessible badges for 3 bins with legend." "a11y,frontend"
mk "Comment form UI (minor/major intent)" "Two buttons preset intent; form collects comment." "frontend,comments"
mk "Comment pre-moderation: serverless → PR" "Function creates PR with pending comment file." "backend,comments,infra"
mk "Comment publishing & status display" "Render approved comments; chips for status; admin flip to implemented." "frontend,comments"
mk "Social share buttons + OG/Twitter meta" "Add share links and per-essay meta tags." "frontend,seo"
mk "Feeds & sitemap" "Provide /feed.xml, /feed.json, /sitemap.xml." "frontend,infra"
mk "Accessibility pass (WCAG 2.1 AA)" "Global audit; fix blockers." "a11y"
mk "SEO + JSON-LD Article" "Add per-essay JSON-LD and meta descriptions." "seo"
mk "Topic & keywords constraints" "Limit topic ≤5 words; keywords ≤5; build warnings." "frontend,build"
mk "Align CI/workflows with backend ownership" "Keep deploy; disable/retain other workflows as needed." "infra"
mk "QA: end-to-end acceptance tests" "Full v1 verification." "qa"
```

If you want these split into **GitHub Project** items with dependencies, I can output a CSV or a GitHub Projects (v2) `gql` script as well.

---

## Recommendations to cover gaps & risks

- **Spam and abuse controls:** Expand the comment workstream to require a honeypot plus at least one bot-mitigation (e.g., hCaptcha/Turnstile, IP/user-agent throttling, or short-term submission quotas). Log rejected submissions and surface an admin-visible queue for false positives.
- **Privacy and data handling:** Define retention and access rules for commenter contact info (e.g., store minimal fields, encrypt at rest, redact after publication or `N` days). Add a short privacy notice near the form clarifying use and retention.
- **Observability:** Add minimal telemetry for the comment pipeline (function errors, validation failures, PR creation latency) and client errors (comment widget load/submit failures). Alert on sustained failures so moderators know when to switch to a fallback intake.
- **Search and comments performance budgets:** Set bundle-size and latency targets for search and comments (e.g., search index ≤ `X` KB gzipped; giscus/scripts lazy-loaded; countdown updates throttled). Prefer pagination or top-N results when the index grows to keep time-to-interact fast on low-end devices.
- **CI minimums:** In the CI alignment item, explicitly retain the checks that guard quality: build, word-range/word-count verification, a11y/SEO linters (axe/lighthouse), and any schema/meta validators. Only remove flows tied to public authoring.
- **Countdown reliability:** Specify a consistent time source (UTC) and refresh cadence; handle deadline edits by reading from data on each render and scheduling client updates. Provide an accessible text fallback when JavaScript is disabled or when time drift is detected.
- **Versioning policy:** Document how essay versions increment (e.g., patch for typo/a11y fixes, minor for content additions, major for structural rewrites) and tie it to release notes. Enforce via a small checklist in PR templates or a lint that blocks inconsistent version bumps.

## Additional considerations before implementation

- **Data classification and secrets handling:** Define who can access stored comment submissions (including logs), where secrets live (CI, serverless, local dev), and how rotations are handled. Add a quick RACI so moderation and ops owners are explicit.
- **Staging + fixtures:** Ensure a staging environment (or preview deploys) exists for testing the full comment flow end-to-end with sample essays and mock submissions before enabling on production.
- **Rollback and failure modes:** Document how to disable new flows quickly (feature flags/env toggles) and how to manually ingest comments if the function or PR creation fails. Keep a runbook for moderators and maintainers.
- **Content governance:** Decide who approves comment publication, how often queues are reviewed, and what thresholds trigger escalation (e.g., abuse reports, security concerns).
- **Browser coverage:** List supported browsers/devices for the comment UI, countdown, and search, plus how degradations are handled for unsupported cases.

## Phased implementation approach (start here)

To keep risk low, start with a thin slice that exercises the new flows end-to-end before broadening the surface area.

1) **Lock down public authoring + nav clarity**: Remove contribution CTAs, hide or mark drafts as read-only, and update About/Guidelines copy. Ship this first so public behavior matches the new policy even before comments land.
2) **Comment plumbing (happy path)**: Wire the serverless function to create PRs with pending comments, render giscus on published essays, and add the minor/major comment form with spam controls and privacy notice. Validate on staging with sample essays.
3) **Moderation + publication**: Implement the build step that moves approved comments out of `pending/`, render status chips, and document the review cadence/runbook. Add observability/alerts on submission failures.
4) **Metadata polish and distribution**: Layer in word counts, search/filter, feeds, sitemap, OG/Twitter/JSON-LD tags, and share buttons. Ensure performance budgets and bundle-size checks are in place.
5) **Quality gates and rollback levers**: Finalize CI minimums (build, word-range/count, a11y/SEO), add feature flags/env toggles to disable comments quickly, and capture rollback steps in docs. Finish with an a11y/SEO audit and a short E2E test script.

---

## Recommendations to cover gaps & risks

- **Spam and abuse controls:** Expand the comment workstream to require a honeypot plus at least one bot-mitigation (e.g., hCaptcha/Turnstile, IP/user-agent throttling, or short-term submission quotas). Log rejected submissions and surface an admin-visible queue for false positives.
- **Privacy and data handling:** Define retention and access rules for commenter contact info (e.g., store minimal fields, encrypt at rest, redact after publication or `N` days). Add a short privacy notice near the form clarifying use and retention.
- **Observability:** Add minimal telemetry for the comment pipeline (function errors, validation failures, PR creation latency) and client errors (comment widget load/submit failures). Alert on sustained failures so moderators know when to switch to a fallback intake.
- **Search and comments performance budgets:** Set bundle-size and latency targets for search and comments (e.g., search index ≤ `X` KB gzipped; giscus/scripts lazy-loaded; countdown updates throttled). Prefer pagination or top-N results when the index grows to keep time-to-interact fast on low-end devices.
- **CI minimums:** In the CI alignment item, explicitly retain the checks that guard quality: build, word-range/word-count verification, a11y/SEO linters (axe/lighthouse), and any schema/meta validators. Only remove flows tied to public authoring.
- **Countdown reliability:** Specify a consistent time source (UTC) and refresh cadence; handle deadline edits by reading from data on each render and scheduling client updates. Provide an accessible text fallback when JavaScript is disabled or when time drift is detected.
- **Versioning policy:** Document how essay versions increment (e.g., patch for typo/a11y fixes, minor for content additions, major for structural rewrites) and tie it to release notes. Enforce via a small checklist in PR templates or a lint that blocks inconsistent version bumps.

## Additional considerations before implementation

- **Data classification and secrets handling:** Define who can access stored comment submissions (including logs), where secrets live (CI, serverless, local dev), and how rotations are handled. Add a quick RACI so moderation and ops owners are explicit.
- **Staging + fixtures:** Ensure a staging environment (or preview deploys) exists for testing the full comment flow end-to-end with sample essays and mock submissions before enabling on production.
- **Rollback and failure modes:** Document how to disable new flows quickly (feature flags/env toggles) and how to manually ingest comments if the function or PR creation fails. Keep a runbook for moderators and maintainers.
- **Content governance:** Decide who approves comment publication, how often queues are reviewed, and what thresholds trigger escalation (e.g., abuse reports, security concerns).
- **Browser coverage:** List supported browsers/devices for the comment UI, countdown, and search, plus how degradations are handled for unsupported cases.

## Phased implementation approach (start here)

To keep risk low, start with a thin slice that exercises the new flows end-to-end before broadening the surface area.

1) **Lock down public authoring + nav clarity**: Remove contribution CTAs, hide or mark drafts as read-only, and update About/Guidelines copy. Ship this first so public behavior matches the new policy even before comments land.
2) **Comment plumbing (happy path)**: Wire the serverless function to create PRs with pending comments, render giscus on published essays, and add the minor/major comment form with spam controls and privacy notice. Validate on staging with sample essays.
3) **Moderation + publication**: Implement the build step that moves approved comments out of `pending/`, render status chips, and document the review cadence/runbook. Add observability/alerts on submission failures.
4) **Metadata polish and distribution**: Layer in word counts, search/filter, feeds, sitemap, OG/Twitter/JSON-LD tags, and share buttons. Ensure performance budgets and bundle-size checks are in place.
5) **Quality gates and rollback levers**: Finalize CI minimums (build, word-range/count, a11y/SEO), add feature flags/env toggles to disable comments quickly, and capture rollback steps in docs. Finish with an a11y/SEO audit and a short E2E test script.

