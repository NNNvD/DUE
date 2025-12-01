# QA: v1 acceptance checklist

Use this checklist before releasing the "v1 — Comments-only public site" milestone. Run the automated bundle first, then walk through the manual flows that require human verification.

## Automated bundle
- `npm run qa` (runs word/length validation, build + comment promotion, accessibility audit, and feed validation).
- Confirm CI `pages.yml` still deploys successfully on a fresh push to `main`.

## Manual end-to-end checks
- **Public surface**: verify no "start an essay" / "suggest change" CTAs remain. Drafts render read-only with countdowns and no interaction paths.
- **Comments intake**: on a published essay, submit both minor and major intents against the configured endpoint. Confirm the serverless handler opens a pending comment PR with expected metadata (slug, path, intent, contact details, moderation note placeholder).
- **Moderation + publication**: merge a pending comment PR; rebuild locally or via CI to ensure the comment moves to `approved/` and renders with the correct status chip and moderation note.
- **Search + filters**: load the essay browser, run a keyword search, toggle length/author/completeness filters, and confirm the countdown timers refresh on dynamically rendered draft cards.
- **Accessibility behaviors**: keyboard the nav, skip link, and controls (comment form, filters, share buttons). Spot-check headings, form labels, focus states, and color contrast for issues not caught by the automated audit.
- **SEO + share**: view source for a published essay and confirm canonical URL, meta description, and JSON-LD payload reflect the essay data. Exercise share buttons (copy-link, Mastodon, X/Twitter, LinkedIn) for correct prefilled text and links.
- **Feeds + sitemap**: open `/feeds/feed.xml`, `/feeds/feed.json`, and `/sitemap.xml` to ensure URLs and versions reflect the latest published essays.

## Rollback + ownership
- If the backend manages publication timing, keep the **Auto publish overdue drafts** workflow manual; enable its cron trigger only when this repo should drive publishing.
- If comment intake fails, disable the public endpoint env var and fall back to giscus-only discussions until the pipeline is healthy again.
