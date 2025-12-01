# Milestone log — v1 "Comments-only public site"

This log captures how each planned task for the milestone was delivered. See `Net steps for developing the DUE we.md` for the original scope.

## Task outcomes
1. **Convert site to comments-only:** Removed public authoring CTAs across the site, kept drafts read-only, and clarified About/Guidelines language to reflect backend-owned authoring.
2. **giscus comments on published essays only:** Gated the giscus embed to published essays, added jump-to-comments links, and provided a configuration fallback prompt for missing IDs.
3. **Remove public contribution templates/workflows:** Deleted public issue templates and associated automation, and refreshed contributor docs to emphasize the moderated comments-only model.
4. **Essay card metadata & styling:** Added length-aware title colors, shape icons, word-range badges, exact word counts, versions, author/topic/keyword chips, and status indicators across listings and detail pages.
5. **Build-time exact word count:** Extended the word-range check to populate and validate `word_count`, with CI support and a helper to rewrite front matter when needed.
6. **Essay browser: search & filters:** Built a JSON index plus Elasticlunr-powered search with filters for length, completeness, author, and keywords, including dynamic countdown refresh for draft cards.
7. **Drafts page (read-only) with countdown:** Enhanced draft cards with status headers, author/topic/start details, length bins, and accessible live countdowns while keeping the page non-interactive.
8. **Length indicators (shape + color + text + a11y):** Implemented accessible length badges with iconography, color cues, and aria labels; documented the legend for readers.
9. **Comment form UI (minor/major intent):** Added moderated feedback forms with intent pickers, validation, spam honeypot, privacy notice, and essay metadata handoff to the intake endpoint.
10. **Comment pre-moderation: serverless → PR:** Added a serverless handler that validates input, writes pending comment YAML, and opens moderation pull requests targeting the configured branch.
11. **Comment publishing & status display:** Added a build-time promotion step from `pending/` to `approved/`, rendered published feedback with status chips/moderation notes, and refreshed anchors/styles.
12. **Social share buttons + OG/Twitter meta:** Added canonical-aware share metadata and share buttons (Mastodon, X/Twitter, LinkedIn, copy link) with clipboard helpers and status messaging.
13. **Feeds & sitemap:** Updated RSS/Atom/JSON feeds to include canonical URLs, release-note summaries, and version metadata, and surfaced subscription links sitewide.
14. **Accessibility pass (WCAG 2.1 AA):** Introduced an automated accessibility audit script, wired it into CI, documented its usage, and tuned styles (contrast, focus, skip link) to clear common blockers.
15. **SEO + JSON-LD Article:** Generated per-essay meta descriptions and JSON-LD Article payloads with normalized authors, keywords, dates, versions, and publisher details.
16. **Topic & keywords constraints:** Added build-time helpers that enforce topic ≤5 words and keyword slices ≤5 entries across computed data, JSON-LD, and search metadata.
17. **Align CI/workflows with backend ownership:** Shifted autopublish to manual dispatch, retained the deploy pipeline, folded acceptance-critical checks (build, words, a11y, feeds) into CI, and documented backend-controlled publication timing.
18. **QA: end-to-end acceptance tests:** Added a consolidated `npm run qa` script, feed validation, and a published QA checklist covering public behavior, comments pipeline, search/filters, accessibility, SEO/share, and feeds/sitemap.

## Milestone status
All tasks for the "v1 — Comments-only public site" milestone are complete. Continue to use the QA checklist before each release and keep autopublish manual unless backend ownership changes.
