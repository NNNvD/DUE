
# DUE — Starter (Eleventy + GitHub Pages)

This is a minimal starter for **DUE — Deadline for Unfinished Essays**, designed to run entirely on **GitHub Pages** with **GitHub Actions** for automation.

## What you get
- Static site with **Eleventy (11ty)** rendering essays from Markdown.
- Repo-native content under `site/essays/`.
- **Auto-publish** overdue drafts (30‑day timer) via scheduled workflow.
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

## Content model (front matter)
```yaml
---
title: "Title here"
topic: "Proposed topic"
author: yourhandle
coauthors: []             # GitHub handles
acknowledgments: []       # list of { user, note, since_version }
status: draft             # draft|published
started_at: YYYY-MM-DD
deadline_at: YYYY-MM-DD
initial_status: unfinished   # complete|unfinished (for first publish)
version: 0.1                 # 1.0 if complete at first publish else 0.1
published_at: YYYY-MM-DD     # set automatically on publish
word_range: "500-1000"       # 250-500|500-1000|1000-1500
release_notes:
  - "Auto-published at deadline."
---
Markdown content here...
```

## Workflows
- **Deploy Pages**: Builds on push to `main` and deploys to GitHub Pages.
- **Auto-publish**: Runs hourly; moves overdue `site/essays/drafts/*.md` to `site/essays/published/` and sets version per `initial_status`.
- **Word range check**: Runs on PRs; fails if essay content is out of bounds.
- **Published essay label guard**: Ensures PRs editing `site/essays/published/` include either the `minor` or `major` label.
- **Version bump**: On merged PRs with `minor` or `major` label, bumps version and updates credits.

### Enable GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Build and deployment** to **GitHub Actions**. The provided workflow will deploy automatically on push to `main`.

## Contributing flow (recommended)
- **Start a new essay**: copy `site/essays/drafts/_template.md` (or any draft), set `started_at`, `deadline_at = started_at + 30d`, choose `word_range`, write.
- **Mark complete**: set `initial_status: complete` if you intend first publish to be 1.0.
- **Suggestions**: contributors open PRs against the essay file:
  - Add label **minor** for small fixes → Acknowledgments, patch bump.
  - Add label **major** for substantial changes → Coauthor, major bump.
- On merge, the workflow bumps version + credits automatically.

## Notes
- This starter stores history in front‑matter `release_notes`. For full version snapshots, keep tagged versions or store copies.
- The auto‑publish script uses system time in the Action runner; ensure `deadline_at` is ISO date (YYYY‑MM‑DD).

---

Happy writing!
