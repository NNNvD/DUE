# Review of `essayWorkflow.md`

## What works well in the updated plan
- **Clear author experience and gating**: The `/admin` flow is laid out end to end, with role-gated login options and a predictable editorial list/detail form for essays.【F:essayWorkflow.md†L13-L233】
- **Explicit schema with guardrails**: The proposed front matter includes validation-friendly widgets (keyword caps, topic regex) and keeps a lightweight set of fields that fit Decap’s editorial workflow.【F:essayWorkflow.md†L55-L239】
- **Separation of agent vs. human tasks**: The document clearly splits Codex-owned repo changes from the manual hosting/auth steps, reducing the risk of half-configured auth.【F:essayWorkflow.md†L89-L299】
- **Risk register and mitigations**: Common pitfalls—auth setup, schema drift, media paths, merge conflicts—are acknowledged with concrete mitigations and hosting choices.【F:essayWorkflow.md†L346-L498】

## Concerns and mismatches with the current architecture
1. **Content root divergence**: The plan centers essays in `content/essays/`, but the Eleventy site renders from `site/essays/drafts/` and `site/essays/published/`. Moving paths without adapting data files, templates, and workflows (autopublish, QA) would break the build and publishing scripts.【F:essayWorkflow.md†L147-L253】【F:README.md†L6-L72】
2. **Schema gaps vs. required metadata**: The Decap schema omits DUE-required fields such as `coauthors`, `acknowledgments`, `started_at`, `deadline_at`, `deadline_at_time`, `initial_status`, `canonical_url`, `release_notes`, and `word_range`, and uses different status/version semantics (`under_review`, `0.1`). Existing scripts and templates rely on the richer schema for deadlines, crediting, and version guards.【F:essayWorkflow.md†L55-L239】【F:README.md†L35-L69】
3. **Workflow drift**: The document leans on Decap’s editorial workflow and new status values but doesn’t integrate with the repo’s `npm run new`, autopublish, or word-range enforcement (250–500, 500–1000, 1000–1500). Adopting Decap as written would bypass those controls or cause CI failures.【F:essayWorkflow.md†L145-L253】【F:README.md†L29-L72】
4. **Hosting assumptions**: The recommended path favors Netlify Identity/Git Gateway or an external OAuth backend for GitHub, whereas the repo is optimized for GitHub Pages + Actions today. Choosing a different host/auth stack affects deployment workflows and needs explicit coordination.【F:essayWorkflow.md†L256-L299】【F:README.md†L2-L23】
5. **Media pipeline mismatch**: Uploads are slated for `static/uploads` served at `/uploads`, but the existing asset pipeline lives under `site/assets/`. Without copying that folder into the Eleventy build, uploaded media would not appear on the site.【F:essayWorkflow.md†L128-L199】【F:README.md†L6-L23】

## Suggested adjustments before implementation
- Point Decap’s `folder` (or collection paths) to `site/essays/drafts/` and `site/essays/published/`, or migrate Eleventy templates and scripts if you truly want `content/essays/` as the source of truth, to avoid breaking the build/publish pipeline.【F:essayWorkflow.md†L147-L253】【F:README.md†L6-L72】
- Expand the Decap schema to match the current front matter (deadlines, word_range buckets, credits/release notes, version rules, canonical URL) so automation and templating remain valid.【F:essayWorkflow.md†L55-L239】【F:README.md†L35-L69】
- Align status/version semantics with existing workflows (`proposed/draft/published`, `0.1` vs. `1.0` rules) and ensure `npm run new`, autopublish, and word checks use the same fields as the CMS to avoid CI regressions.【F:essayWorkflow.md†L145-L253】【F:README.md†L29-L72】
- Decide on hosting/auth (GitHub Pages + external OAuth vs. Netlify + Git Gateway) and document the choice in `README.md` alongside the admin paths so onboarding stays clear.【F:essayWorkflow.md†L256-L299】【F:README.md†L2-L23】
- Wire the asset pipeline to serve Decap uploads (or reuse `site/assets/`) before enabling media uploads, ensuring URLs resolve in the built site.【F:essayWorkflow.md†L128-L199】【F:README.md†L6-L23】

## Take on the proposed “delta” plan
- The suggested collection roots (`site/essays/drafts/` and `site/essays/published/`) align with the Eleventy build and autopublish scripts, avoiding the breakage risk noted above.【F:essayWorkflow.md†L147-L253】【F:README.md†L6-L72】
- Mirroring the full front matter (deadlines, credits, canonical URL, word_range buckets) in `admin/config.yml` would close the schema gap and keep CI checks intact.【F:essayWorkflow.md†L55-L239】【F:README.md†L35-L69】
- Syncing Decap status/version options with `npm run new`, autopublish, and word-range enforcement resolves the workflow drift; also adjust `npm run new` to emit the same YAML Decap writes so both paths stay compatible.【F:essayWorkflow.md†L145-L253】【F:README.md†L29-L72】
- Locking a hosting/auth choice (Netlify Identity/Git Gateway vs. GitHub Pages with external OAuth) and documenting `/admin` + roles in `README.md` will prevent surprises for maintainers and authors onboarding later.【F:essayWorkflow.md†L256-L299】【F:README.md†L2-L23】
- Pointing media to the existing asset pipeline (or updating the build to copy Decap uploads) addresses the current upload-path mismatch before turning on media widgets.【F:essayWorkflow.md†L128-L199】【F:README.md†L6-L23】
