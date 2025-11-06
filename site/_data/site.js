const baseConfig = require("./site.json");

const DEFAULT_ORIGIN = "http://localhost:8080";
const DEFAULT_REPO_URL = "https://github.com/your-username/your-repo";

function ensureTrailingSlash(value) {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function ensureLeadingSlash(value) {
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

function normalizePathPrefix(value) {
  if (!value || !value.trim()) {
    return "/";
  }

  const withLeading = ensureLeadingSlash(value.trim());
  const withoutTrailing = withLeading.replace(/\/+$/u, "");

  if (!withoutTrailing || withoutTrailing === "/") {
    return "/";
  }

  return ensureTrailingSlash(withoutTrailing);
}

function parseUrl(value) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch (error) {
    return null;
  }
}

function computePathPrefix() {
  const explicit = process.env.PATH_PREFIX || process.env.BASE_URL;
  const fromConfig = baseConfig.baseUrl;

  const candidate = explicit || fromConfig;
  if (candidate) {
    const parsed = parseUrl(candidate);
    if (parsed) {
      return normalizePathPrefix(parsed.pathname);
    }
    return normalizePathPrefix(candidate);
  }

  const repo = process.env.GITHUB_REPOSITORY || ""; // owner/repo
  const [, name] = repo.split("/");

  if (name && !name.endsWith(".github.io")) {
    return normalizePathPrefix(name);
  }

  return "/";
}

function computeCanonicalBase() {
  const canonical =
    process.env.CANONICAL_BASE || process.env.CANONICAL_URL || baseConfig.canonicalBase || "";

  if (!canonical) return "";

  const parsed = parseUrl(canonical);
  const value = parsed ? `${parsed.origin}${parsed.pathname}` : canonical;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function computeRepoUrl() {
  const repo = process.env.GITHUB_REPOSITORY;
  const server = (process.env.GITHUB_SERVER_URL || "https://github.com").replace(/\/$/u, "");

  if (repo) {
    return `${server}/${repo}`;
  }

  return baseConfig.repoUrl || DEFAULT_REPO_URL;
}

function buildAbsoluteUrl(pathPrefix) {
  const explicit = process.env.SITE_URL || process.env.URL;
  const parsedExplicit = parseUrl(explicit);

  if (parsedExplicit) {
    parsedExplicit.pathname = ensureLeadingSlash(parsedExplicit.pathname || "/");
    return ensureTrailingSlash(parsedExplicit.href);
  }

  if (explicit) {
    return ensureTrailingSlash(explicit);
  }

  const originEnv = process.env.SITE_ORIGIN;
  const parsedOrigin = parseUrl(originEnv);

  const suffix = pathPrefix === "/" ? "" : pathPrefix;

  if (parsedOrigin) {
    const origin = parsedOrigin.origin + parsedOrigin.pathname.replace(/\/$/u, "");
    return ensureTrailingSlash(`${origin}${suffix}`);
  }

  if (originEnv) {
    const origin = originEnv.replace(/\/$/u, "");
    return ensureTrailingSlash(`${origin}${suffix}`);
  }

  const repo = process.env.GITHUB_REPOSITORY || "";
  const [owner, name] = repo.split("/");

  if (owner && name) {
    const isUserSite = name.endsWith(".github.io");
    const host = isUserSite ? name : `${owner}.github.io`;
    return ensureTrailingSlash(`https://${host}${suffix}`);
  }

  const origin = DEFAULT_ORIGIN.replace(/\/$/u, "");
  return ensureTrailingSlash(`${origin}${suffix}`);
}

const pathPrefix = computePathPrefix();
const baseUrl = pathPrefix === "/" ? "/" : ensureTrailingSlash(ensureLeadingSlash(pathPrefix));

const siteData = {
  ...baseConfig,
  baseUrl,
  canonicalBase: computeCanonicalBase(),
  repoUrl: computeRepoUrl(),
  get siteUrl() {
    if (!this._siteUrl) {
      this._siteUrl = buildAbsoluteUrl(this.baseUrl);
    }
    return this._siteUrl;
  },
  giscus: {
    repo: process.env.GISCUS_REPO || baseConfig.giscus?.repo || "",
    repoId: process.env.GISCUS_REPO_ID || baseConfig.giscus?.repoId || "",
    category: process.env.GISCUS_CATEGORY || baseConfig.giscus?.category || "",
    categoryId: process.env.GISCUS_CATEGORY_ID || baseConfig.giscus?.categoryId || "",
    mapping: process.env.GISCUS_MAPPING || baseConfig.giscus?.mapping || "pathname",
    theme: process.env.GISCUS_THEME || baseConfig.giscus?.theme || "light",
  },
};

module.exports = siteData;
