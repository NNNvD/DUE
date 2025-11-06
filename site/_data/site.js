const baseConfig = require("./site.json");

const currentYear = new Date().getFullYear();

function ensureTrailingSlash(value) {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function computePathPrefix() {
  const explicit = process.env.BASE_URL;
  if (explicit) {
    return ensureTrailingSlash(explicit);
  }

  const isProduction = process.env.ELEVENTY_ENV === "production";
  return ensureTrailingSlash(isProduction ? DEFAULT_PATH_PREFIX : "/");
}

function computeSiteUrl(pathPrefix) {
  const explicit = process.env.SITE_URL;
  if (explicit) return ensureTrailingSlash(explicit);

function ensureTrailingSlash(url) {
  if (!url) return "/";
  return url.endsWith("/") ? url : `${url}/`;
}

function ensureTrailingSlash(value) {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function computeCanonicalBase() {
  const canonical = process.env.CANONICAL_BASE || process.env.CANONICAL_URL || "";
  if (!canonical) return "";
  return canonical.endsWith("/") ? canonical.slice(0, -1) : canonical;
}

function computeBaseUrl() {
  const repo = process.env.GITHUB_REPOSITORY || ""; // owner/repo
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    return ensureTrailingSlash(`http://localhost:8080${pathPrefix}`);
  }

  const isUserSite = /\.github\.io$/i.test(name);
  const host = `${owner}.github.io`;
  if (isUserSite) {
    return ensureTrailingSlash(`https://${name}`);
  }

  return ensureTrailingSlash(`https://${host}${pathPrefix}`);
}

function computeRepoUrl() {
  const repo = process.env.GITHUB_REPOSITORY; // owner/repo
  const server = process.env.GITHUB_SERVER_URL || "https://github.com";
  if (repo) return `${server}/${repo}`;
  return baseConfig.repoUrl || "https://github.com/your-username/your-repo";
}

function computeSiteUrl(baseUrl) {
  const envSite = process.env.SITE_URL || process.env.URL;
  if (envSite) return ensureTrailingSlash(envSite);
  const base = ensureTrailingSlash(baseUrl || "/");
  const origin = process.env.SITE_ORIGIN || "http://localhost:8080";
  const normalizedOrigin = origin.replace(/\/$/, "");
  return `${normalizedOrigin}${base}`;
}

function computeSiteUrl() {
  const envSite = process.env.SITE_URL || "";
  if (envSite) return ensureTrailingSlash(envSite);
  const base = computeBaseUrl();
  if (/^https?:\/\//i.test(base)) return ensureTrailingSlash(base);
  return "https://example.com/";
}

module.exports = {
  ...DEFAULTS,
  baseUrl: computeBaseUrl(),
  canonicalBase: computeCanonicalBase(),
  repoUrl: computeRepoUrl(),
  get siteUrl() {
    // Lazy compute to ensure baseUrl is initialized first
    if (!this._siteUrl) {
      this._siteUrl = computeSiteUrl(this.baseUrl);
    }
    return this._siteUrl;
  },
  giscus: {
    // Optional. Set these via repository secrets/env to enable.
    repo: process.env.GISCUS_REPO || "",
    repoId: process.env.GISCUS_REPO_ID || "",
    category: process.env.GISCUS_CATEGORY || "",
    categoryId: process.env.GISCUS_CATEGORY_ID || "",
    mapping: process.env.GISCUS_MAPPING || "pathname",
    theme: process.env.GISCUS_THEME || "light",
  },
};
