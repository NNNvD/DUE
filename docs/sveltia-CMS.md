# Instructions: Migrate DUE CMS from Decap to Sveltia + Cloudflare Auth

## Scope

* Replace the CMS UI served at `/admin/` with Sveltia CMS.
* Update `admin/config.yml` to use a Cloudflare Worker OAuth proxy via `backend.base_url` (required for GitHub Pages). ([GitHub][2])
* Deprecate the current `/api/auth` proxy and the `DECAP_OAUTH_BASE` mechanism (leave in place only if needed for rollback).

## Constraints / Inputs

* Repo: `NNNvD/DUE`
* Site URL: `https://nnnvd.github.io/DUE/`
* Admin URL: `https://nnnvd.github.io/DUE/admin/`
* Planned Worker name: `due-cms-auth`
* Worker URL is unknown until the user creates a Cloudflare account and deploys it; use a placeholder in config for now.

---

## 1) Update `/admin/index.html` to load Sveltia CMS

### Goal

Replace the Decap script include with Sveltia’s JS bundle. A common working embed is:
`https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js` ([0DeepResearch Insights][3])

### Change

In `admin/index.html`:

1. Keep the existing basic HTML structure.
2. Ensure `<meta name="robots" content="noindex">` is present (recommended by Sveltia). ([GitHub][4])
3. Replace the Decap script tag with:

```html
<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
```

Notes:

* Do **not** include Decap’s `netlify-cms.js` / `decap-cms.js` anymore.
* Keep `admin/config.yml` in the same folder; Sveltia reads it similarly to Decap. ([Decap CMS][5])

---

## 2) Update `admin/config.yml` backend to use a Cloudflare Worker `base_url`

### Goal

Point CMS authentication to a Cloudflare Worker OAuth proxy using `backend.base_url`. This is explicitly required/recommended for Sveltia CMS Authenticator on GitHub Pages. ([GitHub][2])

### Change

In `admin/config.yml`, locate:

```yml
backend:
  name: github
  repo: NNNvD/DUE
  branch: main
```

Add:

```yml
  base_url: https://due-cms-auth.<YOUR_SUBDOMAIN>.workers.dev
```

This `base_url` is the Worker URL the user will get after deploying the authenticator. The authenticator project documentation shows `base_url` as the required integration point. ([GitHub][2])

### Remove / stop using Decap-specific auth proxy settings

If `auth_endpoint: /api/auth` exists, remove it (or comment it out). The new flow should not depend on your GitHub Pages `/api/auth` forwarding page.

---

## 3) Deprecate the current `/api/auth` proxy implementation in the DUE repo

### Goal

Prevent confusion and eliminate unused moving parts.

### Change

* If the DUE repo contains any of these, mark them as deprecated (or remove them):

  * `/api/auth` proxy HTML page
  * Any JS that reads `DECAP_OAUTH_BASE`
  * GitHub Actions secret requirements for `DECAP_OAUTH_BASE`

Add a short note to the repo docs (see step 4) that these are no longer used after migration.

---

## 4) Add a repo doc: `docs/cms-auth-cloudflare.md`

Create a short internal README that explains:

* Sveltia CMS is now used at `/admin/`. ([GitHub][1])
* Authentication is via Cloudflare Worker (`base_url` in `admin/config.yml`). ([GitHub][2])
* The Worker is deployed from `sveltia/sveltia-cms-auth` (the authenticator). ([GitHub][2])
* `DECAP_OAUTH_BASE` is no longer needed.

Include a placeholder section:

```md
## After deploying the Worker
Update admin/config.yml:

backend:
  base_url: https://due-cms-auth.<your-subdomain>.workers.dev
```

---

## 5) Provide the user with “outside-repo” steps (Codex should document, not execute)

Codex cannot create accounts, but should add a checklist in `docs/cms-auth-cloudflare.md`:

1. Create a Cloudflare account (free tier).
2. Deploy the Sveltia Authenticator worker (from `sveltia/sveltia-cms-auth`). ([GitHub][2])
3. Create a GitHub OAuth App and set its callback to the Worker’s callback endpoint (per authenticator instructions).
4. Set Worker secrets (GitHub client ID/secret; allow-list domains if supported, e.g., `nnnvd.github.io`). ([0DeepResearch Insights][3])
5. Copy the Worker URL into `admin/config.yml` as `backend.base_url`. ([GitHub][2])

---

## 6) Validation checklist (Codex should include in PR description)

After merging and deploying:

* `https://nnnvd.github.io/DUE/admin/` loads Sveltia CMS UI.
* Config loads successfully (no 404 for `/admin/config.yml`). ([Decap CMS][5])
* Clicking “Login” uses the Worker `base_url` route (not Netlify/Decap and not `/api/auth`). ([Chris's Tech ADHD][6])
* Editing and saving creates commits in `NNNvD/DUE` (write access required).

---

# Notes for you (non-Codex)

Once Codex has made these repo changes, you’ll still need to do the Cloudflare setup. The key integration point is `backend.base_url` in `admin/config.yml`. ([GitHub][2])

If you want, paste your current `admin/index.html` and `admin/config.yml` here, and I will provide an exact “before/after” patch (diff) tailored to your repo so Codex can apply it with minimal judgment calls.

[1]: https://github.com/sveltia/sveltia-cms?utm_source=chatgpt.com "Sveltia CMS: Netlify/Decap CMS successor. Git-based CMS."
[2]: https://github.com/sveltia/sveltia-cms-auth?utm_source=chatgpt.com "sveltia/sveltia-cms-auth: Cloudflare Workers script that ..."
[3]: https://0deepresearch.com/posts/2025-05-08-hugo-cms-setup-journey-decap-cms-sveltia-cms-on-github-pages/?utm_source=chatgpt.com "Hugo CMS Setup Journey: Decap CMS & Sveltia CMS on ..."
[4]: https://github.com/sveltia/sveltia-cms "GitHub - sveltia/sveltia-cms: Netlify/Decap CMS successor. Fast, lightweight, Git-based headless CMS. Modern UX, first-class i18n support, mobile support + 100s of improvements. Framework-agnostic, open source & free."
[5]: https://decapcms.org/docs/configuration-options/?utm_source=chatgpt.com "Configuration Options"
[6]: https://chris-ayers.com/2025/06/26/mobile-cms-on-github-pages/?utm_source=chatgpt.com "Headless CMS Without a PC on GitHub Pages - Chris Ayers"
