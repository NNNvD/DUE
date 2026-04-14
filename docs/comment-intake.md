# Comment intake function

Use `api/submit-comment.js` for post-moderated feedback. The function accepts POSTed form data or JSON, writes a YAML file under `data/comments/<slug>/approved/` on your base branch for moderation follow-up.

## Deploying
- Deploy as a serverless handler (Netlify function, Vercel API route, or any Node server that supports `exports.handler`).
- Point `site/_data/site.json` → `comments.endpoint` (or set `COMMENTS_ENDPOINT`) at the deployed route (defaults to `/api/submit-comment`).
- Ensure the runtime provides **Node 18+** so `fetch` and `crypto.randomUUID` are available.

### Recommended for GitHub Pages: Cloudflare Worker
This repo now includes a Worker scaffold at `workers/comment-intake/` so the comment API can live off-Pages while the site itself stays on GitHub Pages.

Typical setup:
1. Copy `workers/comment-intake/.dev.vars.example` to `workers/comment-intake/.dev.vars` and fill in:
   - `COMMENTS_REPO`
   - `COMMENTS_SITE_BASE`
   - `COMMENTS_TOKEN`
   - optional `COMMENTS_BASE_BRANCH`
2. Deploy with Wrangler:

```bash
npx wrangler deploy --config workers/comment-intake/wrangler.toml
```

3. In GitHub, set the Pages build variable or secret `COMMENTS_ENDPOINT` to your deployed Worker URL plus `/api/submit-comment`, for example:

```text
https://due-comment-intake.<your-subdomain>.workers.dev/api/submit-comment
```

4. Optionally set `COMMENTS_ISSUE_FALLBACK` if you want a custom manual fallback instead of the default repository issue form.

If `COMMENTS_ENDPOINT` is missing during the Pages build, the deployed site now disables live submission and falls back to the issue path instead of shipping a broken `/api/submit-comment` form action.

### Required environment variables
- `COMMENTS_REPO` (or `GITHUB_REPOSITORY`): `owner/repo` where comment files should be committed.
- `COMMENTS_TOKEN` (or `GITHUB_TOKEN`): PAT with `repo` scope to create commits and files.

### Optional environment variables
- `COMMENTS_BASE_BRANCH`: Base branch for comment commits (defaults to the repo default branch).
- `COMMENTS_DIR`: Root folder for comment YAML (default `data/comments`).
- `COMMENTS_SITE_BASE`: Absolute site origin used to build full essay URLs when only paths are provided.
- `COMMENTS_MAX_LENGTH`: Override the max allowed comment length (default `4000`).

## Payload
- Required: `slug`, `intent` (`minor`|`major`), `name`, `comment` (≥10 chars).
- Optional: `contact`, `essayTitle`, `essayPath`, `essayUrl`, `website` (honeypot), plus any form fields included in the essay template.
- Submissions containing the honeypot field (`website`) are rejected.

## What it creates
- A YAML file at `data/comments/<slug>/approved/<timestamp>-<id>.yml` with the submission, referrer, and user agent.
- A direct commit on the configured base branch with the new comment file for moderators to update as needed.

## Local test (if your platform supports it)
1. Run your platform’s dev server so the function responds at `http://localhost:<port>/api/submit-comment`.
2. Submit a sample payload:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "lorem-over-500",
    "intent": "minor",
    "name": "Local Tester",
    "contact": "tester@example.com",
    "comment": "Great piece! One broken link in section two.",
    "essayPath": "/essays/published/lorem-over-500/"
  }' \
  http://localhost:8888/api/submit-comment
```

If configured correctly, the response returns `{ "success": true, "filePath": "..." }` and the comment YAML file is committed to the repository.

## One-command live verification
Use the repo helper when you want a real production-path check instead of a mocked local test:

```bash
COMMENTS_VERIFY_ENDPOINT="https://due-comment-intake.<your-subdomain>.workers.dev/api/submit-comment" \
COMMENTS_VERIFY_SITE_URL="https://nnnvd.github.io/DUE/" \
npm run verify:comments-live
```

What this does:
- submits a real verification comment against the configured endpoint;
- expects a successful API response with a committed `filePath`;
- tries to fetch the committed YAML back from GitHub and verify its core fields;
- prints the follow-up manual checks for comment visibility and moderation.

Defaults and safety notes:
- The helper targets `drafty-draft` by default so the live check lands on a clearly non-production essay slug unless you override `--slug`.
- Override the payload with `--slug`, `--essay-title`, `--comment`, or the matching `COMMENTS_VERIFY_*` env vars.
- Add `--skip-github-check` if the repo is private and you do not want the helper to fetch the file back for verification.
- Reject or delete the verification comment after the pipeline has been confirmed.

## Moderating visible comments
- New comments should use `status: pending` to render as **Unmoderated**.
- After review, update the YAML status:
  - `status: approved` → shows **Not yet implemented**.
  - `implemented: true` (or `status: implemented`) → shows **Implemented**.
  - `status: rejected` + `moderation_note: ...` → shows **Rejected** plus the note.
- Comments render under the essay immediately; the giscus thread remains below the form.
