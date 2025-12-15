# Sveltia CMS + Cloudflare Auth (DUE)

## Overview
- The `/admin` route uses [Sveltia CMS](https://github.com/sveltia/sveltia-cms) on GitHub Pages.
- Authentication runs through a Cloudflare Worker proxy from [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) via `backend.base_url` in `admin/config.yml`.
- The legacy Decap `/api/auth` proxy and `DECAP_OAUTH_BASE` workflow are no longer required (kept only for rollback).

## Outside-the-repo setup checklist
1. Create a Cloudflare account (free tier works).
2. Deploy the Sveltia authenticator Worker (`sveltia/sveltia-cms-auth`).
3. Create a GitHub OAuth App and set its callback to the Worker’s callback endpoint (see authenticator docs).
4. Add Worker secrets for the GitHub client ID/secret and, if supported, restrict allowed origins to `nnnvd.github.io`.
5. Copy the deployed Worker URL and paste it into `admin/config.yml` as `backend.base_url`.

## After deploying the Worker
Update `admin/config.yml`:

```yml
backend:
  base_url: https://due-cms-auth.<your-subdomain>.workers.dev
```
