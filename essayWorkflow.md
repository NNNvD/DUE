Here’s a concrete plan the Codex agent can implement to give you a Decap-CMS-powered `/admin` for DUE, plus what the end result should look like and what can go wrong.

I’ll assume:

* Your site code lives in a public GitHub repo (call it `<owner>/<repo>`).
* Essays are (or will be) stored as Markdown files with YAML front matter in a folder we choose, e.g. `content/essays/`.
* We’ll use **Decap CMS** (formerly Netlify CMS), a Git-based CMS that works with any static site generator and stores all content directly in Git. ([decapcms.org][1])

I’ll clearly mark which steps are for **Codex** (things that can be done inside the repo) and which are **manual** (Netlify / auth config).

---

## 1. Target experience (for DUE authors)

**Intended result**

An author with little/no GitHub knowledge should be able to:

1. Go to `https://<your-site-domain>/admin/`
2. Log in (either with:

   * GitHub, **or**
   * an email/password via Netlify Identity / Git Gateway).
3. See a list of “Essays” with:

   * Title
   * Status (draft / under review / published)
   * Version (0.1 / 1.0 / etc.)
   * Length category (100–500, 500–1000, 1000–1500)
4. Click **“New Essay”**, fill in a form:

   * Title
   * Author
   * Topic (max 5 words)
   * Keywords (max 5)
   * Length category (select)
   * Version
   * Status
   * Body (Markdown editor with preview)
5. Click **Save** → the CMS:

   * Creates/updates a `.md` file in `content/essays/` with correct YAML.
   * Commits and pushes to the GitHub repo.
   * Your static site build runs and the essay appears/updates on the site.

**Access control**

* Only users with access to the repo (GitHub backend) or with Identity accounts you approve (Git Gateway backend) can edit essays.
* This satisfies **“only members can start or edit essays”**.

---

## 2. Front matter schema for DUE essays (what we standardize on)

**Codex: use this as the canonical YAML schema.**

Every essay Markdown file should start like:

```yaml
---
title: "My Essay Title"
date: 2025-12-06
author: "Author Name"
topic: "Short topic phrase"
keywords:
  - keyword-one
  - keyword-two
length_category: "100-500" # options: "100-500", "500-1000", "1000-1500"
version: "0.1"             # semantic versioning, e.g. 0.1, 0.2, 1.0
status: "draft"            # "draft", "under_review", "published"
# optional, can be filled later or computed in build tooling
word_count: 0
---
Markdown body starts here…
```

This gives you everything you previously said you wanted per essay:

* Author name
* Exact number of words (field available; you can add an automated step later)
* Topic (max 5 words)
* Keywords (max 5)
* Version
* Length category (used to pick square/triangle/circle + magenta/orange/teal)
* Status (for editorial workflow)

---

## 3. Add Decap CMS to the repo

### 3.1. Create `/admin/index.html`

**Responsibility: Codex (repo changes only)**

Add a new file: `admin/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>DUE Admin</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <!-- Decap CMS mount point -->
    <div id="nc-root"></div>

    <!-- Load Decap CMS from CDN -->
    <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
  </body>
</html>
```

**Intended result**

* Visiting `/admin/` on the built site loads the Decap CMS UI shell.
* It will then look for `admin/config.yml` to know how to connect and what collections to show. ([decapcms.org][1])

---

### 3.2. Create `admin/config.yml`

**Responsibility: Codex**

Create `admin/config.yml` with this structure (I’ll include placeholders where you/humans need to fill in real values).

```yaml
backend:
  # Option A: GitHub backend (requires GitHub login + auth setup)
  name: github
  repo: "<owner>/<repo>"       # e.g. "nnnvd/DUE"
  branch: "main"               # or "master" or whatever default branch you use
  # optional but recommended for performance
  use_graphql: true

# If you later use Git Gateway (Netlify Identity or custom), replace the backend with:
# backend:
#   name: git-gateway
#   branch: "main"

media_folder: "static/uploads"     # where uploaded media files are stored in the repo
public_folder: "/uploads"          # how those files are referenced in the built site

publish_mode: editorial_workflow   # enables draft / review / publish workflow

collections:
  - name: "essays"
    label: "Essays"
    label_singular: "Essay"
    description: "Timed essays on DUE"
    folder: "content/essays"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    preview_path: "essays/{{slug}}"
    summary: "{{title}} ({{status}} · v{{version}} · {{length_category}})"

    fields:
      - label: "Title"
        name: "title"
        widget: "string"

      - label: "Date"
        name: "date"
        widget: "datetime"
        time_format: false

      - label: "Author"
        name: "author"
        widget: "string"

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

      - label: "Length category"
        name: "length_category"
        widget: "select"
        options:
          - { label: "Short (100–500 words)", value: "100-500" }
          - { label: "Medium (500–1000 words)", value: "500-1000" }
          - { label: "Long (1000–1500 words)", value: "1000-1500" }
        default: "100-500"

      - label: "Version"
        name: "version"
        widget: "string"
        default: "0.1"
        hint: "Semantic versioning, e.g. 0.1, 0.2, 1.0"

      - label: "Status"
        name: "status"
        widget: "select"
        options:
          - { label: "Draft", value: "draft" }
          - { label: "Under review", value: "under_review" }
          - { label: "Published", value: "published" }
        default: "draft"

      - label: "Word count (optional)"
        name: "word_count"
        widget: "number"
        required: false
        hint: "Can be filled later or computed automatically."

      - label: "Body"
        name: "body"
        widget: "markdown"
```

**Intended result**

* Decap knows:

  * How to connect to GitHub (`backend`).
  * Where essays live in the repo (`folder: content/essays`).
  * How to build filenames (`slug`).
  * What fields to show and how to validate them (`fields`).

Notes:

* GitHub backend specifics & GraphQL option are documented here. ([decapcms.org][2])
* `max` + `min` on the list widget enforce the 0–5 keywords constraint. ([decapcms.org][3])

---

### 3.3. Ensure essays folder exists

**Responsibility: Codex**

* If not present, create `content/essays/` in the repo.
* Add a sample essay file so the CMS has something to show, e.g. `content/essays/example-essay.md` with the YAML schema above and a few paragraphs of dummy body text.

**Intended result**

* When Decap loads, it lists at least one essay.
* The front-end/Elementy build can already render essays from this folder (Codex may need to align whatever Elementy currently uses to this structure).

---

## 4. Authentication & hosting (where the “hard part” is)

You cannot complete *all* of this purely from code in the repo — some pieces must be configured in the hosting environment because GitHub OAuth and/or Identity require a server component. GitHub itself explicitly requires a server for OAuth flows. ([decapcms.org][2])

### Option A (recommended eventually): host with Netlify + Git Gateway

**Manual (human, not Codex-only):**

1. Connect your GitHub repo to **Netlify** and enable automatic deploys.
2. Turn on **Netlify Identity** and **Git Gateway** as per Decap docs. ([decapcms.org][4])
3. In `admin/config.yml`, switch the backend to:

   ```yaml
   backend:
     name: git-gateway
     branch: "main"
   ```

**Result**

* Authors log in via an email/password (Identity) or magic link, no GitHub account required.
* You control who may edit essays in the Netlify dashboard.
* Decap commits to your GitHub repo via Git Gateway.

### Option B: stay on GitHub Pages with GitHub backend

**Concept**

* Keep hosting on GitHub Pages.
* Use Decap **GitHub backend** with a **separate OAuth client** (either Netlify-auth-based or a custom external OAuth service). ([Stack Overflow][5])

**Manual steps (human)**

1. Choose an OAuth provider for Decap:

   * E.g. deploy `decap-cms-github-backend` or a similar OAuth service on a platform like Render/Vercel. ([GitHub][6])
2. Configure that service with your GitHub OAuth app (client ID/secret, callback URL, etc.).
3. In `admin/config.yml`, add the `base_url` and `auth_endpoint` pointing to that OAuth service (as per the Decap “External OAuth Clients” docs).

**Result**

* Editors log in with GitHub accounts.
* They must have push access to your repo to edit content. ([decapcms.org][2])

---

## 5. How Codex should integrate this with the existing DUE site

These are repo-only tasks Codex can safely perform.

### 5.1. Align the site generator with `content/essays/`

* If DUE already has an essay list page and detail pages:

  * Update the templates / generator config to read essays from `content/essays/` and the fields in the new front matter.
* Map your **length symbols** (square/triangle/circle and colors) directly to `length_category`:

  * `100-500` → square + magenta (#bb47f5)
  * `500-1000` → triangle + orange (#f7ad45)
  * `1000-1500` → circle + teal (#0d9488)
* Use `topic`, `keywords`, `status`, and `version` wherever relevant in the UI (card lists, filters, essay header, etc.).

### 5.2. Add a simple README section for maintainers

**Responsibility: Codex**

In `README.md`, add a “DUE Admin / Decap CMS” section, e.g.:

```markdown
## DUE Admin (Decap CMS)

We use [Decap CMS](https://decapcms.org/) as a Git-based CMS for essays.

- Admin UI: `/admin/`
- Config: `admin/config.yml`
- Essays folder: `content/essays/`

Each essay is a Markdown file with YAML front matter using the schema described in `admin/config.yml`.

Authentication backend:
- For Netlify + Git Gateway, set `backend.name: git-gateway`.
- For GitHub backend with custom OAuth, set `backend.name: github` and configure the OAuth service as described in the Decap docs.
```

**Intended result**

* Any future human or agent immediately understands where to look and how things hang together.

---

## 6. Risks, pitfalls, and how to avoid them

### 6.1. Authentication won’t work “by magic”

**Risk**

* Adding `admin/index.html` + `config.yml` is not enough for login to work. Decap **requires** a working backend with auth:

  * Netlify Git Gateway, or
  * GitHub backend with a configured OAuth server. ([decapcms.org][1])

**Mitigation**

* Treat the hosting/auth setup as a small separate task:

  * Decide early: “We will use Netlify+Git Gateway” **or** “We will host a GitHub OAuth backend.”
  * Document which backend is chosen in `README.md` and `config.yml`.

---

### 6.2. Editors must have proper permissions

**Risk**

* With GitHub backend, only users with **push access to the repo** can edit. ([decapcms.org][2])
* If you meant “members” in a looser sense (e.g. email addresses not in your GitHub org), this might be too strict.

**Mitigation**

* If you want non-GitHub-savvy authors who *don’t* need repo access:

  * Prefer **Netlify Identity + Git Gateway**.
* If “members” = “people with repo write access,” GitHub backend is fine.

---

### 6.3. Directory / path mismatch

**Risk**

* If the SSG or Elementy currently expects essays somewhere else (e.g. `_posts/` or a different folder), just dropping files in `content/essays/` may not show anything.

**Mitigation**

* Codex should:

  * Find where essays are currently stored and rendered.
  * Either:

    * Point Decap’s `folder:` to that existing location, or
    * Move templates to use `content/essays/` and migrate any existing essays into that folder.

---

### 6.4. Merge conflicts & parallel editing

**Risk**

* If someone edits an essay directly in Git (CLI or GitHub web) while another edits in the CMS, you may get merge conflicts.

**Mitigation**

* For now, keep a simple habit:

  * Encourage members to use `/admin/` as the primary editing mechanism.
  * If conflicts occur, resolve them manually in Git and then reload CMS.

---

### 6.5. YAML schema drift

**Risk**

* If you later change field names or types in `config.yml` but don’t update:

  * Existing files’ front matter, or
  * The site templates,

  then things can break or disappear from lists.

**Mitigation**

* Treat `admin/config.yml` as the **source of truth** for essay metadata.
* When changing schema:

  1. Update templates.
  2. Run a scripted migration (Codex can write a small script) to adjust old front matter.
  3. Only then update `config.yml`.

---

### 6.6. GitHub API rate limits (rare for you, but good to know)

**Risk**

* Very large sites (10k+ entries) can hit GitHub API rate limits for Decap operations. ([decapcms.org][7])

**Mitigation**

* For DUE’s scale this is unlikely to matter.
* If it ever does, options include:

  * Caching, GraphQL mode (`use_graphql: true`), or moving to Git Gateway.

---

### 6.7. Media paths and your bundler

**Risk**

* If the SSG doesn’t know about `static/uploads` / `/uploads`, images uploaded in Decap may not show up correctly.

**Mitigation**

* Codex should:

  * Ensure that `static/uploads` (or whatever `media_folder` you choose) is served as `/uploads`.
  * Adjust the SSG config so those paths survive the build.

---

## 7. What Codex should concretely do next

If you want this to be “prompt-ready” for the coding agent, the high-level todo is:

1. **Add Decap files**

   * Create `admin/index.html` as above.
   * Create `admin/config.yml` with the essay collection and backend stub.
   * Create `content/essays/` and a sample essay.

2. **Wire the generator**

   * Make sure DUE’s front-end reads essays from `content/essays/` and uses:

     * `topic`, `keywords`, `length_category`, `version`, `status`, `author`.
   * Map `length_category` → length symbols/colors.

3. **Document it**

   * Add a “DUE Admin” section to `README.md` with:

     * Where admin lives.
     * Which backend is intended (GitHub or Git Gateway).
     * A short note on how to add/edit essays.

4. **Coordinate with you on hosting/auth**

   * You (or whoever handles infrastructure) then:

     * Either move hosting to Netlify and enable Identity + Git Gateway,
     * Or set up GitHub OAuth / external backend for GitHub Pages.

Once those are in place, authors can just go to `/admin/` and start writing essays with a form instead of touching Git at all.

[1]: https://decapcms.org/docs/intro/ "Overview | Decap CMS | Open-Source Content Management System"
[2]: https://decapcms.org/docs/github-backend/ "GitHub | Decap CMS | Open-Source Content Management System"
[3]: https://decapcms.org/docs/widgets/list/ "List | Decap CMS | Open-Source Content Management System"
[4]: https://decapcms.org/docs/git-gateway-backend/ "Git Gateway | Decap CMS | Open-Source Content Management System"
[5]: https://stackoverflow.com/questions/79009410/can-i-use-decap-cms-on-github-pages-without-hosting-the-site-on-netlify?utm_source=chatgpt.com "Can I use decap CMS on Github pages without hosting ..."
[6]: https://github.com/njfamirm/decap-cms-github-backend?utm_source=chatgpt.com "njfamirm/decap-cms-github-backend"
[7]: https://decapcms.org/blog/git-based-cms-definition-features-best-practices/?utm_source=chatgpt.com "Git-Based CMS: Definition, Features, Best Practices"
