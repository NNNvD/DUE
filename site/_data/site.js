const baseConfig = require("./site.json");

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

module.exports = {
  ...baseConfig,
  baseUrl: computeBaseUrl(),
  repoUrl: computeRepoUrl(),
  giscus: resolveGiscusConfig(),
};
