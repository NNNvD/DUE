const DEFAULTS = {
  title: "DUE — Deadline for Unfinished Essays",
  tagline: "Write. Publish. Evolve.",
};

function ensureTrailingSlash(url) {
  if (!url) return "/";
  return url.endsWith("/") ? url : `${url}/`;
}

function computeBaseUrl() {
  const repo = process.env.GITHUB_REPOSITORY || ""; // owner/repo
  const name = (repo.split("/")[1] || "").trim();
  const isUserSite = /\.github\.io$/i.test(name);
  const envBase = process.env.BASE_URL; // allow manual override
  if (envBase) return envBase.endsWith("/") ? envBase : envBase + "/";
  if (!name) return "/";
  return isUserSite ? "/" : `/${name}/`;
}

function computeRepoUrl() {
  const repo = process.env.GITHUB_REPOSITORY; // owner/repo
  const server = process.env.GITHUB_SERVER_URL || "https://github.com";
  if (repo) return `${server}/${repo}`;
  return "https://github.com/your-username/your-repo";
}

function computeSiteUrl(baseUrl) {
  const envSite = process.env.SITE_URL || process.env.URL;
  if (envSite) return ensureTrailingSlash(envSite);
  const base = ensureTrailingSlash(baseUrl || "/");
  const origin = process.env.SITE_ORIGIN || "http://localhost:8080";
  const normalizedOrigin = origin.replace(/\/$/, "");
  return `${normalizedOrigin}${base}`;
}

module.exports = {
  ...DEFAULTS,
  baseUrl: computeBaseUrl(),
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
