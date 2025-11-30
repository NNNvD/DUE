
# DUE — Starter (Eleventy + GitHub Pages)

This is a minimal starter for **DUE — Deadline for Unfinished Essays**, designed to run entirely on **GitHub Pages** with **GitHub Actions** for automation. Public participation is **comments-only**; drafting and edits happen in the backend.

## What you get
- Static site with **Eleventy (11ty)** rendering essays from Markdown.
- Repo-native content under `site/essays/`.
- **Auto-publish** overdue drafts (30‑day timer) via scheduled workflow (for maintainers).
- **Word-range enforcement** on PRs (250–500, 500–1000, 1000–1500 with small grace).
- **Published essay label guard** fails PRs that touch `site/essays/published/` without a `minor` or `major` label.
- **Version bump + credits** on merged PRs using `minor` / `major` labels:
  - `minor` → patch bump (adds to Acknowledgments)
  - `major` → major bump (adds to Coauthors)
- GitHub Pages deployment workflow.

## Quick start (local)
```bash
npm install
npm run start        # dev server at http://localhost:8080
```
Your site content is in `site/`. Published essays render at `/essays/published/...`

## Project board
- **Live board**: [https://github.com/your-username/your-repo/projects/1](https://github.com/your-username/your-repo/projects/1)
- **Column + issue breakdown**: see [`docs/project-board.md`](docs/project-board.md) for the current priority assignments (`P0`, `P1`, `P2`, `Done`).
## Authoring (maintainers)

Drafting and edits happen in the backend. Maintainers can scaffold a draft locally:

```bash
npm run new
```

The script prompts for title, topic, author, key dates, word range, and slug, then writes a new Markdown file to `site/essays/drafts/`.

## Content model (front matter)
```yaml
---
title: "Title here"
topic: "Proposed topic"
author: yourhandle
coauthors: []             # GitHub handles or { user, since_version }
acknowledgments: []       # list of { user, note, since_version }
status: draft             # draft|published
started_at: YYYY-MM-DD
deadline_at: YYYY-MM-DD
deadline_at_time: HH:MM      # optional. Defaults to 00:00 UTC if omitted.
initial_status: unfinished   # complete|unfinished (for first publish)
version: 0.1                 # 1.0 if complete at first publish else 0.1
canonical_url: https://example.com/essays/title   # optional absolute canonical link
published_at: YYYY-MM-DD     # set automatically on publish
word_range: "500-1000"       # 250-500|500-1000|1000-1500
word_count: 0                 # set via `npm run check:words -- --write`
release_notes:
  - "Auto-published at deadline."
---
Markdown content here...
```

## Workflows
- **Deploy Pages**: Builds on push to `main` and deploys to GitHub Pages.
- **Auto-publish**: Runs hourly; moves overdue `site/essays/drafts/*.md` to `site/essays/published/` and sets version per `initial_status`.
- **Word range + count check**: Runs on PRs; fails if essay content is out of bounds or `word_count` is missing/outdated. Use `npm run check:words -- --write` before opening a PR to sync counts.
- **Published essay label guard**: Ensures PRs editing `site/essays/published/` include either the `minor` or `major` label.
- **Version bump**: On merged PRs with `minor` or `major` label, bumps version and updates credits.

### Enable GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Build and deployment** to **GitHub Actions**. The provided workflow will deploy automatically on push to `main`.

## Public participation
- Drafting and edits now happen in the backend. Public interaction is limited to comments on published essays.
- Read the [Comments page](./site/contribute.njk) (rendered at <code>/contribute/</code>) for how to leave feedback once essays publish. Issues and PR templates for public content edits have been removed.
- Moderators pre-review comments before publishing them; accepted feedback is credited in acknowledgments or release notes as appropriate.

### Configure giscus for comments
- Enable **Discussions** on your GitHub repository and create a category (e.g., "General").
- In `site/_data/site.json`, set `giscus.repo`, `giscus.repoId`, `giscus.category`, and `giscus.categoryId` to match the repository and category you want to host discussions in.
- Keep `giscus.mapping` as `pathname` so threads align with essay URLs. Once set, published essays will render the discussion widget along with a "Jump to comments" link.

## Notes
- This starter stores history in front‑matter `release_notes`. For full version snapshots, keep tagged versions or store copies.
- GitHub-hosted runners [execute on UTC time](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#scheduled-events).
- `deadline_at` is interpreted at midnight (00:00) UTC by default. Supply `deadline_at_time` to set a different publish time or timezone (e.g. `23:30`, `23:30:00`, or `23:30-04:00`).

---

Happy writing!
