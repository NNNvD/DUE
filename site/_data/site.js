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

function resolveGiscusConfig() {
  const defaults = baseConfig.giscus || {};
  return {
    ...defaults,
    repo: process.env.GISCUS_REPO || defaults.repo,
    repoId: process.env.GISCUS_REPO_ID || defaults.repoId,
    category: process.env.GISCUS_CATEGORY || defaults.category,
    categoryId: process.env.GISCUS_CATEGORY_ID || defaults.categoryId,
    mapping: process.env.GISCUS_MAPPING || defaults.mapping,
    theme: process.env.GISCUS_THEME || defaults.theme,
  };
}

const pathPrefix = computePathPrefix();

module.exports = {
  ...DEFAULTS,
  baseUrl: pathPrefix,
  pathPrefix,
  siteUrl: computeSiteUrl(pathPrefix),
  repoUrl: computeRepoUrl(),
  currentYear,
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
