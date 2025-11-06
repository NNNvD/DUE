const baseConfig = require("./site.json");

const DEFAULT_ORIGIN = "http://localhost:8080";
const DEFAULT_REPO_URL = "https://github.com/your-username/your-repo";

function ensureLeadingSlash(value) {
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

function ensureTrailingSlash(value) {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function stripTrailingSlash(value) {
  if (!value) return "";
  return value.replace(/\/+$/u, "");
}

function normalizePathPrefix(value) {
  if (!value) return "/";

  const trimmed = value.trim();
  if (!trimmed) return "/";

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname || "/";
    return normalizePathPrefix(pathname);
  } catch (error) {
    // Ignore parse failures and treat the value as a path fragment.
  }

  const withLeading = ensureLeadingSlash(trimmed);
  const withoutTrailing = withLeading.replace(/\/+$/u, "");
  return withoutTrailing ? `${withoutTrailing}/` : "/";
}

function computePathPrefix() {
  const explicit = process.env.PATH_PREFIX || process.env.BASE_URL;
  if (explicit) {
    return normalizePathPrefix(explicit);
  }

  if (baseConfig.baseUrl) {
    return normalizePathPrefix(baseConfig.baseUrl);
  }

  const repo = process.env.GITHUB_REPOSITORY || "";
  const [, name = ""] = repo.split("/");
  if (name && !/\.github\.io$/iu.test(name)) {
    return normalizePathPrefix(name);
  }

  return "/";
}

function computeCanonicalBase() {
  const candidate =
    process.env.CANONICAL_BASE ||
    process.env.CANONICAL_URL ||
    baseConfig.canonicalBase ||
    "";

  if (!candidate) return "";

  const trimmed = candidate.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    const pathname = stripTrailingSlash(parsed.pathname || "/");
    const suffix = pathname && pathname !== "/" ? pathname : "";
    return `${parsed.origin}${suffix}`;
  } catch (error) {
    return stripTrailingSlash(trimmed);
  }
}

function computeRepoUrl() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (repo) {
    const server = (process.env.GITHUB_SERVER_URL || "https://github.com").replace(/\/+$/u, "");
    return `${server}/${repo}`;
  }

  if (baseConfig.repoUrl) {
    return baseConfig.repoUrl;
  }

  return DEFAULT_REPO_URL;
}

function computeSiteUrl(pathPrefix) {
  const explicit = process.env.SITE_URL || process.env.URL || baseConfig.siteUrl;
  const suffix = pathPrefix === "/" ? "/" : pathPrefix;

  if (explicit) {
    const trimmed = explicit.trim();
    if (!trimmed) {
      return ensureTrailingSlash(`${DEFAULT_ORIGIN}${suffix}`);
    }

    try {
      const parsed = new URL(trimmed);
      const pathname = stripTrailingSlash(parsed.pathname || "/");
      const basePath = pathname && pathname !== "/" ? `${pathname}` : "";
      return ensureTrailingSlash(`${parsed.origin}${basePath}${suffix === "/" ? "" : suffix}`);
    } catch (error) {
      const withoutTrailing = stripTrailingSlash(trimmed);
      return ensureTrailingSlash(`${withoutTrailing}${suffix === "/" ? "" : suffix}`);
    }
  }

  const origin = (process.env.SITE_ORIGIN || baseConfig.siteOrigin || DEFAULT_ORIGIN).trim();
  const normalizedOrigin = stripTrailingSlash(origin) || DEFAULT_ORIGIN;
  return ensureTrailingSlash(`${normalizedOrigin}${suffix === "/" ? "" : suffix}`);
}

function resolveGiscusConfig() {
  const defaults = baseConfig.giscus || {};
  return {
    repo: process.env.GISCUS_REPO || defaults.repo || "",
    repoId: process.env.GISCUS_REPO_ID || defaults.repoId || "",
    category: process.env.GISCUS_CATEGORY || defaults.category || "",
    categoryId: process.env.GISCUS_CATEGORY_ID || defaults.categoryId || "",
    mapping: process.env.GISCUS_MAPPING || defaults.mapping || "pathname",
    theme: process.env.GISCUS_THEME || defaults.theme || "light",
  };
}

const pathPrefix = computePathPrefix();

const siteData = {
  ...baseConfig,
  baseUrl: pathPrefix,
  canonicalBase: computeCanonicalBase(),
  repoUrl: computeRepoUrl(),
  get siteUrl() {
    if (!this._siteUrl) {
      this._siteUrl = computeSiteUrl(pathPrefix);
    }
    return this._siteUrl;
  },
  giscus: resolveGiscusConfig(),
};

module.exports = siteData;
