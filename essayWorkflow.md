````markdown
# DUE Essay Proposal & Writing Workflow (Decap CMS + Netlify Identity)

This document describes how to implement a Git-based, non-technical essay workflow for the DUE project using:

- Decap CMS (`/admin` UI)
- Netlify hosting
- Netlify Identity (invite-only)
- Netlify Git Gateway

It is written as an implementation plan for a coding agent (Codex) plus some manual steps for a human operator.

---

## 0. Goals and Constraints

- Multiple people can propose and update essays.
- Some users are **not** GitHub-savvy.
- Only **pre-approved** people can propose/write/edit essays.
- All content remains in the GitHub repo as Markdown + YAML.
- Solution is **free-tier friendly** (GitHub + Netlify + Decap CMS).

High-level architecture:

1. **GitHub repo** remains the single source of truth for essays.
2. **Decap CMS** provides a web-based editor at `/admin`.
3. **Netlify Identity** controls who can log in (invite-only).
4. **Git Gateway** allows only Identity users with certain roles (e.g. `due-author`) to commit to the repo.

---

## 1. Confirm and Document Current Essay Structure

**Responsibility: Codex (read-only)**

1. Inspect the repository to determine:
   - Where essay files currently live (likely something like `site/essays/drafts/` and `site/essays/published/`).
   - How essay metadata is stored (YAML front matter fields).
   - How the site generator (Eleventy/Elementy) discovers and renders essay files.
2. Create a short internal note (e.g. `docs/ESSAY_SCHEMA.md`) describing:
   - Essay directories (drafts vs published).
   - Front matter fields and their purpose (e.g. `title`, `author`, `coauthors`, `topic`, `keywords`, `word_range`, `status`, `version`, `started_at`, `deadline_at`, `release_notes`, etc.).
   - Any constraints (e.g. allowed status values, word range buckets, semantic version format).

This step is only for clarity and to avoid breaking existing behavior.

---

## 2. Define the Canonical Essay Front-Matter Schema

**Responsibility: Codex**

Based on current usage, standardize a front-matter schema. Example (adjust names/types to match actual repo):

```yaml
---
title: "Example Essay Title"
author: "Primary Author"
coauthors:
  - "Coauthor One"
  - "Coauthor Two"
topic: "Short topic phrase"
keywords:
  - keyword-one
  - keyword-two
word_range: "100-500"          # e.g. "100-500", "500-1000", "1000-1500"
status: "draft"                # e.g. "proposed", "draft", "under_review", "published"
version: "0.1.0"               # semantic version (e.g. 0.1.0, 1.0.0)
started_at: "2025-12-06"
deadline_at: "2025-12-31"
initial_status: "proposed"     # if used by automation scripts
release_notes: ""              # free-text description of changes
word_count: 0                  # optional, can be computed
---
Body in Markdown…
````

Tasks:

1. Align this schema with:

   * Existing scripts (`npm run new`, CI checks, autopublish).
   * Existing templates.
2. If fields like `topic`, `keywords`, `word_range`, `status`, `version` already exist, reuse their names.
3. Only introduce new fields if they are backwards-compatible and documented.

---

## 3. Add Decap CMS Admin Frontend

### 3.1 Add `/admin/index.html`

**Responsibility: Codex**

Create `admin/index.html` in the repo with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>DUE Admin</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="nc-root"></div>
    <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
  </body>
</html>
```

This serves the Decap CMS UI at `/admin/` once the site is built and hosted.

---

### 3.2 Add `admin/config.yml` (Initial Version)

**Responsibility: Codex**

Create `admin/config.yml` describing:

* The backend (temporarily placeholder, finalized after Netlify is set up).
* Where essays are stored.
* The fields corresponding to the essay schema.

Initial version (backend configured for later Netlify Git Gateway):

```yaml
backend:
  name: git-gateway
  branch: "main"        # adjust if default branch differs

media_folder: "site/assets/uploads"   # adjust to match actual asset path
public_folder: "/assets/uploads"

publish_mode: editorial_workflow

collections:
  - name: "essays_drafts"
    label: "Draft Essays"
    label_singular: "Draft Essay"
    description: "Draft and proposed essays"
    folder: "site/essays/drafts"      # adjust to actual path
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    summary: "{{title}} ({{status}} · v{{version}} · {{word_range}})"
    editor:
      preview: true

    fields:
      - label: "Title"
        name: "title"
        widget: "string"

      - label: "Author"
        name: "author"
        widget: "string"

      - label: "Coauthors"
        name: "coauthors"
        widget: "list"
        field:
          label: "Coauthor"
          name: "coauthor"
          widget: "string"
        required: false

      - label: "Topic (max 5 words)"
        name: "topic"
        widget: "string"
        hint: "Very short topic/label, max 5 words."
        pattern:
          - "^\\S+(\\s+\\S+){0,4}$"
          - "Please use at most 5 words."

      - label: "Keywords (max 5)"
        name: "keywords"
        widget: "list"
        field:
          label: "Keyword"
          name: "keyword"
          widget: "string"
        min: 0
        max: 5
        label_singular: "Keyword"

      - label: "Word range"
        name: "word_range"
        widget: "select"
        options:
          - { label: "100–500 words", value: "100-500" }
          - { label: "500–1000 words", value: "500-1000" }
          - { label: "1000–1500 words", value: "1000-1500" }

      - label: "Status"
        name: "status"
        widget: "select"
        options:
          - { label: "Proposed", value: "proposed" }
          - { label: "Draft", value: "draft" }
          - { label: "Under Review", value: "under_review" }
          - { label: "Published", value: "published" }
        default: "proposed"

      - label: "Version"
        name: "version"
        widget: "string"
        default: "0.1.0"
        hint: "Semantic versioning, e.g. 0.1.0, 1.0.0"

      - label: "Started at"
        name: "started_at"
        widget: "datetime"
        time_format: false
        required: false

      - label: "Deadline at"
        name: "deadline_at"
        widget: "datetime"
        time_format: false
        required: false

      - label: "Initial status"
        name: "initial_status"
        widget: "string"
        required: false

      - label: "Release notes"
        name: "release_notes"
        widget: "text"
        required: false

      - label: "Word count (optional)"
        name: "word_count"
        widget: "number"
        required: false

      - label: "Body"
        name: "body"
        widget: "markdown"
```

If there is also a published folder (e.g. `site/essays/published`), optionally add another collection (`essays_published`) pointing there, with the same fields.

---

## 4. Ensure Site Generator Uses the Same Essay Schema

**Responsibility: Codex**

1. Verify that existing templates/components that list and render essays:

   * Read front matter fields defined above.
   * Map `word_range` to the visual length symbol (square/triangle/circle + magenta/orange/teal).
   * Display `topic`, `keywords`, `version`, `status`, `author`, `coauthors` as needed.
2. Update logic if necessary to:

   * Treat `status` consistently across the system (Decap, scripts, templates).
   * Distinguish between drafts and published essays using either:

     * The folder location (draft vs published), and/or
     * The `status` value.

---

## 5. Integrate with Existing CLI and CI Workflows

**Responsibility: Codex**

1. Inspect scripts such as `npm run new` and any CI checks related to essays.
2. Adjust them so that:

   * `npm run new` creates a new essay file with front matter matching the schema used by Decap.
   * CI checks (word ranges, version increments, release notes) operate on the same fields Decap manages.
3. Ensure that both:

   * Essays created via CLI, and
   * Essays created via `/admin`
     are fully compatible and indistinguishable to the site build and CI.

---

## 6. Deploy the Site to Netlify

**Responsibility: Human operator (not Codex-only)**

1. Create a Netlify account (if not already).
2. In Netlify:

   * **Add new site from Git**.
   * Connect to the DUE GitHub repo.
   * Set build command and publish directory according to the existing setup (e.g. `npm run build` and `dist/` or similar).
3. Confirm that:

   * The main site builds and serves correctly.
   * `/admin/` loads the Decap UI shell (though login will not work yet).

Once Netlify is the primary hosting, GitHub Pages can be disabled or left as backup, depending on preference.

---

## 7. Enable Netlify Identity (Invite-Only)

**Responsibility: Human operator**

1. In Netlify site settings:

   * Go to **Identity**.
   * Click **Enable Identity**.
2. Under Identity settings:

   * Set **Registration preferences** to **Invite only**.
3. Optionally configure:

   * Allowed external providers (Google, GitHub) if desired.
4. This ensures that only invited users can register and log in.

---

## 8. Enable Git Gateway and Restrict by Role

**Responsibility: Human operator**

1. In the same Netlify site:

   * Under **Identity → Services**, enable **Git Gateway**.
2. In Git Gateway settings:

   * Set the **Git provider** to GitHub and authorize Netlify.
   * Configure **Roles** so that only specific Identity roles can access Git Gateway, e.g.:

     * `due-author,due-editor`
3. This enforces:

   * Only Identity users with at least one of these roles can commit via Git Gateway.

---

## 9. Assign Roles to Pre-Approved Users

**Responsibility: Human operator**

For each person who should be able to propose/write essays:

1. Go to **Identity → Users** in Netlify.
2. Click **Invite users**:

   * Enter their email address.
3. After they accept the invite and appear as a user:

   * Open their user details.
   * Assign the role(s) needed:

     * `due-author` for regular essayists.
     * `due-editor` for people who can also do editorial review.

Users without these roles:

* Can be invited for other purposes (e.g. reading restricted content if ever needed), but
* Cannot commit any content via Decap CMS.

---

## 10. Finalize Decap Backend Configuration

**Responsibility: Codex**

Update `admin/config.yml` `backend` block to match the Netlify setup:

```yaml
backend:
  name: git-gateway
  branch: "main"    # adjust if necessary
```

No `repo:` field is required for Git Gateway; Netlify knows the repo linked to the site.

Confirm that:

* `publish_mode: editorial_workflow` is set (if you want the draft/review/publish flow).
* `media_folder` and `public_folder` paths match the asset structure used by the site.

---

## 11. Editorial Workflow Behavior

With `publish_mode: editorial_workflow`:

* When an author clicks **Save**:

  * Decap creates/updates a draft (backed by a branch/PR in Git).
* When an editor clicks **Publish**:

  * Decap merges the change into the main branch.

**Additional safeguard (optional, GitHub side):**

* Enable branch protection on `main`:

  * Require at least one approving review for PRs.
  * Limit who can push directly.
* This ensures:

  * Even if an Identity user has the correct role, final merging behavior can still be controlled at the GitHub level if desired.

Codex does not configure branch protection; this is done in the GitHub repo settings by a repo admin.

---

## 12. Testing the End-to-End Flow

**Responsibility: Codex + Human**

1. As site owner (with `due-editor` role):

   * Log in to `/admin/`.
   * Create a new test essay in the drafts collection.
   * Ensure that:

     * A new Markdown file appears in the correct drafts folder.
     * Front matter fields are correct.
     * The site build passes CI and the essay appears (if intended to be visible).
2. Invite a second user (test account) as `due-author`:

   * Verify they can log in, create/edit essays.
   * Verify they cannot modify anything outside the allowed collections.
3. Invite a user with **no** roles:

   * Verify they can log in (if invited) but **cannot** use the CMS to commit changes.

---

## 13. Documentation for Future Contributors

**Responsibility: Codex**

Add a section to `README.md`, for example:

```markdown
## Essay workflow (Decap CMS + Netlify Identity)

- Admin UI is available at `/admin/`.
- We use [Decap CMS] as a Git-based CMS for essay editing.
- Authentication is handled via Netlify Identity (invite-only).
- Write access to the repo via CMS is restricted to Identity users with roles:
  - `due-author` (can propose and edit essays).
  - `due-editor` (edit + review/publish).

Essays are stored as Markdown files with YAML front matter in:

- Drafts: `site/essays/drafts/`
- Published: `site/essays/published/` (if used)

Front-matter schema and field meanings are documented in `docs/ESSAY_SCHEMA.md`.

For CLI-based creation, use:

- `npm run new` (creates a new draft essay file matching the same schema as Decap).
```

This ensures that both humans and future agents can understand and extend the system.

---

## 14. Summary

After completing the above steps:

* Only **invited** Identity users with roles (`due-author`, `due-editor`) can propose or update essays.
* They interact solely with a user-friendly `/admin` interface (Decap CMS).
* All essay content and metadata remain in the GitHub repo as Markdown + YAML.
* The existing DUE site build and CI logic continue to work, with Decap acting as a thin UI on top of the current architecture.

```

::contentReference[oaicite:0]{index=0}
```
