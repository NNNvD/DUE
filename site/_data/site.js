const DEFAULTS = {
  title: "DUE — Deadline for Unfinished Essays",
  tagline: "Write. Publish. Evolve.",
};

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
  repoUrl: computeRepoUrl(),
};

