# Comment intake function

Use `api/submit-comment.js` for post-moderated feedback. The function accepts POSTed form data or JSON, writes a YAML file under `data/comments/<slug>/approved/` on your base branch for moderation follow-up.

## Deploying
- Deploy as a serverless handler (Netlify function, Vercel API route, or any Node server that supports `exports.handler`).
- Point `site/_data/site.json` → `comments.endpoint` (or set `COMMENTS_ENDPOINT`) at the deployed route (defaults to `/api/submit-comment`).
- Ensure the runtime provides **Node 18+** so `fetch` and `crypto.randomUUID` are available.

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

## Moderating visible comments
- New comments should use `status: pending` to render as **Unmoderated**.
- After review, update the YAML status:
  - `status: approved` → shows **Not yet implemented**.
  - `implemented: true` (or `status: implemented`) → shows **Implemented**.
  - `status: rejected` + `moderation_note: ...` → shows **Rejected** plus the note.
- Comments render under the essay immediately; the giscus thread remains below the form.
