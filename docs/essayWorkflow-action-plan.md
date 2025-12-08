# Decap CMS integration action plan for DUE essays

This plan consolidates the original Decap proposal and the review feedback into a single, repo-aligned action plan. It assumes the current Eleventy structure (`site/essays/drafts/` and `site/essays/published/`) remains the source of truth unless a migration is explicitly chosen.

## Objectives
- Provide a Decap-powered `/admin` that works with the existing Eleventy pipelines and front matter.
- Keep CLI/CI workflows (`npm run new`, `autopublish`, word-range checks) and Decap-generated content in sync.
- Clarify hosting/authentication and media-handling choices before rollout.

## Decisions to lock in
1. **Content roots**: Keep essays under `site/essays/drafts/` and `site/essays/published/`. Only migrate to a new root if Eleventy templates, data files, and scripts are updated in the same PR.
2. **Schema parity**: Decap fields must mirror the repo’s front matter keys and allowed values (e.g., `title`, `topic`, `author`, `status`, `started_at`, `deadline_at`, `initial_status`, `version`, `published_at`, `word_range`, `release_notes`, credits). Use identical option sets (word-range buckets, status values, version semantics).
3. **Workflow alignment**: Decap’s status/version options should match `npm run new`, `autopublish`, and the CI word-range rules. Adjust `npm run new` to emit the same YAML Decap writes.
4. **Hosting/auth**: Choose either Netlify Identity + Git Gateway **or** GitHub Pages + external GitHub OAuth backend. Document `/admin`, required roles, and auth flow in `README.md`.
5. **Media handling**: Point Decap `media_folder`/`public_folder` to where Eleventy already serves assets (or update the build to copy uploads). Avoid enabling media widgets until URLs are confirmed to render in the built site.

## Implementation steps (Codex)
1. **Configure collections**
   - Set Decap collections to point to `site/essays/drafts/` and `site/essays/published/`.
   - If drafts-only editing is desired, limit the collection to `site/essays/drafts/` and ensure publishing is handled by scripts.

2. **Mirror the front matter schema**
   - Update `admin/config.yml` to include every required key with matching names and options. Include validation for word-range buckets and status/version enums used by the scripts.
   - Align default values and date formats (ISO) with existing scripts/templates.

3. **Sync workflows**
   - Update `npm run new` to emit the identical YAML structure that Decap saves (field names, enums, defaults).
   - Ensure `autopublish` and CI checks continue to respect the same status/version/word-range semantics when editing via Decap.

4. **Finalize hosting/auth and document it**
   - Add `/admin` setup details and auth roles to `README.md` once Netlify vs. GitHub Pages + OAuth is decided.
   - Commit the backend config (Netlify Identity/Git Gateway or external OAuth settings) required for Decap to log in.

5. **Fix media paths**
   - Configure `media_folder`/`public_folder` to match the existing asset pipeline (e.g., `site/assets/uploads` → `/assets/uploads`).
   - If a new uploads directory is used, adjust the Eleventy build to copy/serve it so Decap-generated links resolve.

6. **Validate end-to-end**
   - Create a test essay through Decap and through `npm run new`; confirm diffs are limited to content, not schema.
   - Run `npm run build` and `npm run check:words` to ensure the integrated workflow passes CI.

## Decommissioned references
- Supersedes `essayWorkflow.md` and `docs/essayWorkflow-review.md`.
