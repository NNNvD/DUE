# Comment intake function

Use `api/submit-comment.js` to pre-moderate feedback. The function accepts POSTed form data or JSON, writes a YAML file under `data/comments/<slug>/pending/`, and opens a PR against your main branch for review.

## Deploying
- Deploy as a serverless handler (Netlify function, Vercel API route, or any Node server that supports `exports.handler`).
- Point `site/_data/site.json` → `comments.endpoint` (or set `COMMENTS_ENDPOINT`) at the deployed route (defaults to `/api/submit-comment`).
- Ensure the runtime provides **Node 18+** so `fetch` and `crypto.randomUUID` are available.

### Required environment variables
- `COMMENTS_REPO` (or `GITHUB_REPOSITORY`): `owner/repo` where comment PRs should open.
- `COMMENTS_TOKEN` (or `GITHUB_TOKEN`): PAT with `repo` scope to create branches, files, and PRs.

### Optional environment variables
- `COMMENTS_BASE_BRANCH`: Base branch for PRs (defaults to the repo default branch).
- `COMMENTS_DIR`: Root folder for pending comment YAML (default `data/comments`).
- `COMMENTS_BRANCH_PREFIX`: Prefix for intake branches (default `comments/`).
- `COMMENTS_SITE_BASE`: Absolute site origin used to build full essay URLs when only paths are provided.
- `COMMENTS_MAX_LENGTH`: Override the max allowed comment length (default `4000`).

## Payload
- Required: `slug`, `intent` (`minor`|`major`), `name`, `comment` (≥10 chars).
- Optional: `contact`, `essayTitle`, `essayPath`, `essayUrl`, `website` (honeypot), plus any form fields included in the essay template.
- Submissions containing the honeypot field (`website`) are rejected.

## What it creates
- A branch named `comments/<slug>-<id>` (prefix configurable).
- A YAML file at `data/comments/<slug>/pending/<timestamp>-<id>.yml` with the submission, referrer, and user agent.
- A PR pointing at the configured base branch with a short summary and file path for moderators.

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

If configured correctly, the response returns `{ "success": true, "prUrl": "..." }` and the PR contains the pending YAML file.

## Publishing comments after moderation
- When a PR merges, move files from `pending/` to `approved/` (or commit directly to `approved/`).
- `npm run build` now runs `scripts/promoteComments.js`, which automatically promotes any `pending/*.yml` files to `approved/*.yml` and stamps `moderated_at` if missing. Set `COMMENTS_SKIP_PROMOTE=1` to opt out.
- Update the YAML before/after promotion to reflect status:
  - `implemented: true` (or `status: implemented`) → shows the **Implemented** chip.
  - `status: rejected` + `moderation_note: ...` → shows the **Rejected** chip and the note.
  - Omit both to keep the default **Not yet implemented** status.
- Approved comments render under the essay in a "Published comments" section; the original discussion thread (giscus) remains below the form.
