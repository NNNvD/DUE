const DEFAULTS = {
  title: "DUE — Deadline for Unfinished Essays",
  tagline: "Write. Publish. Evolve.",
};

function computeCanonicalBase() {
  const canonical = process.env.CANONICAL_BASE || process.env.CANONICAL_URL || "";
  if (!canonical) return "";
  return canonical.endsWith("/") ? canonical.slice(0, -1) : canonical;
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

module.exports = {
  ...DEFAULTS,
  baseUrl: computeBaseUrl(),
  canonicalBase: computeCanonicalBase(),
  repoUrl: computeRepoUrl(),
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
