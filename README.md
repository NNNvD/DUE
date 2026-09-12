
# DUE — Starter (Eleventy + GitHub Pages)

This is the minimal starter for **DUE — Deadline for Unfinished Essays**, designed to run entirely on **GitHub Pages** with **GitHub Actions** for automation. Public participation is **comments-only**; drafting and edits happen in the backend.

## What you get
- Static site with **Eleventy (11ty)** rendering essays from Markdown.
- Repo-native content under `site/essays/`.
- **Auto-publish** overdue drafts (30‑day timer) on a scheduled GitHub Actions workflow (every 15 minutes).
- **Direct CMS saves** for authoring: saving a draft immediately updates the public draft; saving a published essay immediately updates the live essay and queues version metadata processing.
- **Word-range enforcement** on PRs (250–500, 500–1000, 1000–1500 with small grace).
- **Published essay label guard** for PR-based contribution workflows that touch `site/essays/published/`.
- **Version bump + credits** on merged contribution PRs using `minor` / `major` labels. Author edits made through the CMS are versioned without automatically adding the author to acknowledgments or coauthors.
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
- The `/admin` route loads **Sveltia CMS** for GitHub Pages. Content stays under `site/essays/drafts/` and `site/essays/published/`.
- Backend: GitHub with a Cloudflare Worker OAuth proxy from [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth).
- Access: Only GitHub users with write access to the repo can log in. There are no public sign-ups.
- Media: CMS uploads save to `site/assets/uploads` and publish at `/DUE/assets/uploads`.
- The CMS intentionally does **not** use Sveltia's editorial workflow. DUE has its own lifecycle: **Draft essay → Published essay**. A normal Save writes directly to `main` so the website reflects the change immediately.
- Contextual guidance is collapsed behind `?` controls for keywords, themes, coauthors, acknowledgments, update level, release-note text, and the publication action.

> Legacy: The Decap `/api/auth` helper page remains for rollback but is no longer used when Sveltia is configured with the Cloudflare Worker.

### Start and save a draft
1. Visit `/admin/` and sign in with a GitHub account that has write access.
2. Open **Draft essays** and click **New Draft essay**.
3. Fill in the visible fields. `started_at`, `deadline_at`, status, initial version metadata, and other lifecycle fields are generated automatically.
4. Click **Save draft**. The Markdown file is committed directly to `main`, and the public draft listing updates through the normal Pages deployment.
5. Continue editing the draft and click **Save draft** whenever you want the public draft updated.

### Publish a draft
- Use the **Publish essay** action in the draft editor when the essay is ready.
- Manual publication means the author is declaring the essay finished. DUE therefore moves the file to `site/essays/published/`, records the publication date, sets `initial_status: complete`, starts the published essay at `v1.0.0`, and records `Initial publication.` in the release notes.
- Deadline auto-publication remains separate. If the deadline arrives while the essay is still unfinished, the scheduled lifecycle continues to publish it under the unfinished-at-deadline semantics.

### Edit a published essay
1. Open the essay under **Published essays**.
2. Choose an **Update level**:
   - **Small correction** → patch bump, e.g. `1.0.0 → 1.0.1`.
   - **Substantive revision** → minor bump, e.g. `1.0.x → 1.1.0`.
   - **New edition** → major bump, e.g. `1.x.x → 2.0.0`.
3. Optionally fill **What changed?**. For a small correction this can be left blank; DUE will use a generic release note. For substantive revisions and new editions, authors are encouraged to describe the change for readers.
4. Click **Save changes**. The content is committed directly to `main`; a follow-up workflow updates version metadata, refreshes the calculated word count/range, appends the release note, and creates the version snapshot.

Authorship and revision history are separate concerns. Editing your own essay does not automatically add you to acknowledgments or coauthors. Visitor-originated contributions can still be credited explicitly through the contribution workflow.

## Content model (front matter)
```yaml
---
title: "Title here"
author: yourhandle
coauthors: []             # optional list of author names/handles
acknowledgments: []       # optional list of { user, note, since_version }
keywords: []              # searchable keywords
status: proposed          # proposed|draft|published
started_at: YYYY-MM-DD
deadline_at: YYYY-MM-DD
proposed_at: YYYY-MM-DD
initial_status: unfinished
version: 0.1.0
published_at: YYYY-MM-DD  # set automatically on publication
word_range: "500-1000"   # refreshed automatically for published essays
word_count: 0             # generated metadata; authors do not maintain this manually
release_notes: []         # maintained automatically from publication/revision actions
---
Markdown content here...
```

`topic` remains supported as an optional legacy fallback while older essays are backfilled with keywords.
The essay browser previews the first three keywords on each card while keeping the full keyword list on the essay itself.

## Workflows
- **Deploy Pages**: Builds on push to `main`, and also after the autopublish workflow completes, then deploys to GitHub Pages.
- **Process CMS save**: Runs after essay files are saved directly to `main`. It converts requested draft publications, processes published-essay version bumps, appends release notes, creates snapshots, and refreshes generated word metadata.
- **Auto-publish**: Scheduled workflow (every 15 minutes) that moves overdue drafts to `site/essays/published/` according to deadline semantics.
- **Manual publish**: The CMS **Publish essay** action is the normal route. The GitHub Actions **Publish selected draft now** workflow remains available as an administrative fallback and uses the same finished `v1.0.0` semantics.
- **Word range + count check**: PRs still validate stored generated metadata. Direct CMS saves refresh the generated values automatically; authors do not need to edit `word_count` manually.
- **Accessibility report**: Ensures pages expose alt text, labels, landmarks, and WCAG-friendly palette contrast.
- **Feed validation**: Confirms `/feeds/feed.xml` and `/feeds/feed.json` are present and well formed after a build.
- **Published essay label guard / version bump**: These remain for PR-based contribution workflows. They are not used for ordinary author edits in the CMS.

### QA + acceptance
- Run `npm run qa` to execute the automated acceptance bundle (word/length checks, build, accessibility audit, and feed validation).
- Follow [`docs/qa-acceptance.md`](./docs/qa-acceptance.md) for manual end-to-end verification of the comments pipeline, search/filters, share/meta, and accessibility behaviors.

### Enable GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Build and deployment** to **GitHub Actions**. The provided workflow will deploy automatically on push to `main`.

## Public participation
- Drafting and edits happen in the backend. Public interaction is limited to comments on published essays.
- Read the [Comments page](./site/contribute.njk) (rendered at <code>/contribute/</code>) for how to leave feedback once essays publish.
- Comment forms open prefilled GitHub issues. Maintainers may later promote reviewed feedback onto essay pages; accepted feedback is credited in acknowledgments or release notes as appropriate.

### Configure giscus for comments
- Enable **Discussions** on your GitHub repository and create a category (e.g., "General").
- In `site/_data/site.json`, set `giscus.repo`, `giscus.repoId`, `giscus.category`, and `giscus.categoryId` to match the repository and category you want to host discussions in.
- Keep `giscus.mapping` as `pathname` so threads align with essay URLs. Once set, published essays will render the discussion widget along with a "Jump to comments" link.

### Configure comment intake
- The public essay form opens `comments.issueFallback` as a prefilled GitHub issue. By default this is derived from the repository URL as `/issues/new`.
- Set `COMMENTS_ISSUE_FALLBACK` only if the site should open a different issue route.
- The older serverless handler in `api/submit-comment.js` remains available for private or future deployments that want direct YAML commits. See [`docs/comment-intake.md`](./docs/comment-intake.md) before using it.

## Notes
- Release notes and version snapshots are generated from publication/revision actions. Authors edit only the current-change description, not the historical release-note list.
- GitHub-hosted runners execute on UTC time.
- Drafts created in `/admin/` store date-only values. The publication deadline is 30 calendar days after `started_at`, interpreted at `00:00` UTC unless `deadline_at_time` is supplied by a maintainer script.
- Started essays should not be deleted in ordinary PRs. Keep the record and use visibility metadata for exceptional removals; CI blocks deletion of Markdown files under `site/essays/drafts/` or `site/essays/published/` once they have `started_at`.

---

Happy writing!
