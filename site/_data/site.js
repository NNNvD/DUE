const DEFAULTS = {
  title: "DUE — Deadline for Unfinished Essays",
  tagline: "Write. Publish. Evolve.",
};

function ensureTrailingSlash(value) {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function computeBaseUrl() {
  const repo = process.env.GITHUB_REPOSITORY || ""; // owner/repo
  const name = (repo.split("/")[1] || "").trim();
  const isUserSite = /\.github\.io$/i.test(name);
  const envBase = process.env.BASE_URL; // allow manual override
  if (envBase) return ensureTrailingSlash(envBase);
  if (!name) return "/";
  return isUserSite ? "/" : `/${name}/`;
}

function computeRepoUrl() {
  const repo = process.env.GITHUB_REPOSITORY; // owner/repo
  const server = process.env.GITHUB_SERVER_URL || "https://github.com";
  if (repo) return `${server}/${repo}`;
  return "https://github.com/your-username/your-repo";
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
  repoUrl: computeRepoUrl(),
  siteUrl: computeSiteUrl(),
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
