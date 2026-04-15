
# DUE — Starter (Eleventy + GitHub Pages)

This is the minimal starter for **DUE — Deadline for Unfinished Essays**, designed to run entirely on **GitHub Pages** with **GitHub Actions** for automation. Public participation is **comments-only**; drafting and edits happen in the backend.

## What you get
- Static site with **Eleventy (11ty)** rendering essays from Markdown.
- Repo-native content under `site/essays/`.
- **Auto-publish** overdue drafts (30‑day timer) on a scheduled GitHub Actions workflow (every 15 minutes).
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

The script prompts for title, keywords, author, key dates, word range, and slug, then writes a new Markdown file to `site/essays/drafts/`.

## CMS (/admin)
- The `/admin` route now loads **Sveltia CMS** for GitHub Pages. Content stays under `site/essays/drafts/` and `site/essays/published/`. The Eleventy build passthroughs `/admin` so the CMS is available at `https://your-username.github.io/DUE/admin/` after a deploy.
- Backend: GitHub with a Cloudflare Worker OAuth proxy from [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth). Configure `admin/config.yml` with the Worker URL via `backend.base_url` (placeholder included in-repo).
- Setup checklist (outside this repo):
  1. Create a Cloudflare account (free tier is fine).
  2. Deploy the Sveltia authenticator worker (`sveltia/sveltia-cms-auth`).
  3. Create a GitHub OAuth App and point the callback to the Worker’s callback endpoint (per authenticator docs).
  4. Set Worker secrets for the GitHub client ID/secret (and optionally restrict allowed origins to `nnnvd.github.io`).
  5. Paste the deployed Worker URL into `admin/config.yml` as `backend.base_url`.
- Access: Only GitHub users with write access to the repo can log in. There are no public sign-ups.
- Media: CMS uploads save to `site/assets/uploads` and publish at `/DUE/assets/uploads`. If you rename the repo or change the Pages base path, update `public_folder` accordingly.
- Editorial workflow: Drafts and published essays stay in place; autopublish and CI still enforce status/word-range rules. Refresh `word_count` with `npm run check:words -- --write` after edits.

> Legacy: The Decap `/api/auth` helper page remains for rollback but is no longer used when Sveltia is configured with a Cloudflare Worker.

### Start a new essay from the frontend
1. Visit `/admin/` on the deployed site and sign in with your GitHub account through the configured OAuth backend (only repo collaborators are allowed).
2. In the **Draft essays** collection, click **New Draft essay**.
3. Fill in the required fields to match the front matter schema (title, keywords, author, status, dates, word range, etc.).
4. Save the entry; Sveltia commits the new Markdown file to `site/essays/drafts/` using the slug you choose.
5. Run `npm run check:words -- --write` locally (or in CI) to populate `word_count` before publishing.

## Content model (front matter)
```yaml
---
title: "Title here"
author: yourhandle
coauthors: []             # GitHub handles or { user, since_version }
acknowledgments: []       # list of { user, note, since_version }
keywords: []              # any number of searchable keywords
status: draft             # proposed|draft|published
started_at: YYYY-MM-DD
deadline_at: YYYY-MM-DD
proposed_at: YYYY-MM-DD      # optional. Set automatically when created via CLI
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

`topic` remains supported as an optional legacy fallback while older essays are backfilled with keywords.
The essay browser previews the first three keywords on each card while keeping the full keyword list on the essay itself.

## Workflows
- **Deploy Pages**: Builds on push to `main`, and also after the autopublish workflow completes, then deploys to GitHub Pages.
- **Auto-publish**: Scheduled workflow (every 15 minutes) that moves overdue `site/essays/drafts/*.md` to `site/essays/published/` and sets version per `initial_status`. You can still run it manually via workflow dispatch when needed.
- **Word range + count check**: Runs on PRs; fails if essay content is out of bounds or `word_count` is missing/outdated. Use `npm run check:words -- --write` before opening a PR to sync counts.
- **Accessibility report**: Ensures pages expose alt text, labels, landmarks, and WCAG-friendly palette contrast. Run `npm run build` then `npm run check:a11y` locally to reproduce CI results.
- **Feed validation**: Confirms `/feeds/feed.xml` and `/feeds/feed.json` are present and well formed after a build.
- **Published essay label guard**: Ensures PRs editing `site/essays/published/` include either the `minor` or `major` label.
- **Version bump**: On merged PRs with `minor` or `major` label, bumps version and updates credits for backend-authored changes.

### QA + acceptance
- Run `npm run qa` to execute the automated acceptance bundle (word/length checks, build, accessibility audit, and feed validation).
- Follow [`docs/qa-acceptance.md`](./docs/qa-acceptance.md) for manual end-to-end verification of the comments pipeline, search/filters, share/meta, and accessibility behaviors.

### Enable GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Build and deployment** to **GitHub Actions**. The provided workflow will deploy automatically on push to `main`.

## Public participation
- Drafting and edits now happen in the backend. Public interaction is limited to comments on published essays.
- Read the [Comments page](./site/contribute.njk) (rendered at <code>/contribute/</code>) for how to leave feedback once essays publish. Issues and PR templates for public content edits have been removed.
- Comments are visible immediately and then reviewed by moderators; accepted feedback is credited in acknowledgments or release notes as appropriate.

### Configure giscus for comments
- Enable **Discussions** on your GitHub repository and create a category (e.g., "General").
- In `site/_data/site.json`, set `giscus.repo`, `giscus.repoId`, `giscus.category`, and `giscus.categoryId` to match the repository and category you want to host discussions in.
- Keep `giscus.mapping` as `pathname` so threads align with essay URLs. Once set, published essays will render the discussion widget along with a "Jump to comments" link.

### Configure post-moderated comment intake
- The feedback form posts to `comments.endpoint` (default empty). Point this at the deployed serverless handler in `api/submit-comment.js`.
- Set `COMMENTS_REPO`/`COMMENTS_TOKEN` (or `GITHUB_REPOSITORY`/`GITHUB_TOKEN`) so the handler can commit comment YAML under `data/comments/<slug>/approved/` directly on the configured base branch so it is visible after deployment.
- Optional: tune `COMMENTS_BASE_BRANCH`, `COMMENTS_DIR`, `COMMENTS_SITE_BASE`, and `COMMENTS_MAX_LENGTH` to fit your repo layout. See [`docs/comment-intake.md`](./docs/comment-intake.md) for setup and a sample `curl` request.
- For GitHub Pages, the recommended production path is the included Cloudflare Worker scaffold under `workers/comment-intake/`. After deploying it, set the Pages build variable or secret `COMMENTS_ENDPOINT` to the Worker URL plus `/api/submit-comment`.
- For a real deployment check, run `npm run verify:comments-live` with `COMMENTS_VERIFY_ENDPOINT` and `COMMENTS_VERIFY_SITE_URL` set. The helper posts a test comment, validates the response, and tries to fetch the committed YAML back from GitHub.

## Notes
- This starter stores history in front‑matter `release_notes`. For full version snapshots, keep tagged versions or store copies.
- GitHub-hosted runners [execute on UTC time](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#scheduled-events).
- `deadline_at` is interpreted at midnight (00:00) UTC by default. Supply `deadline_at_time` to set a different publish time or timezone (e.g. `23:30`, `23:30:00`, or `23:30-04:00`).

---

Happy writing!
