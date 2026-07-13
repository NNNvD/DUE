import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const ORIGINAL_COMMENTS_ENDPOINT = process.env.COMMENTS_ENDPOINT;
const ORIGINAL_COMMENTS_ISSUE_FALLBACK = process.env.COMMENTS_ISSUE_FALLBACK;
const ORIGINAL_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS;
const ORIGINAL_SITE_ORIGIN = process.env.SITE_ORIGIN;
const ORIGINAL_SITE_URL = process.env.SITE_URL;
const ORIGINAL_URL = process.env.URL;
const ORIGINAL_PATH_PREFIX = process.env.PATH_PREFIX;
const ORIGINAL_BASE_URL = process.env.BASE_URL;

function loadSiteData() {
  const modulePath = require.resolve("../../site/_data/site.js");
  delete require.cache[modulePath];
  return require("../../site/_data/site.js");
}

beforeEach(() => {
  delete process.env.COMMENTS_ENDPOINT;
  delete process.env.COMMENTS_ISSUE_FALLBACK;
  delete process.env.GITHUB_ACTIONS;
  delete process.env.SITE_ORIGIN;
  delete process.env.SITE_URL;
  delete process.env.URL;
  delete process.env.PATH_PREFIX;
  delete process.env.BASE_URL;
});

afterEach(() => {
  if (typeof ORIGINAL_COMMENTS_ENDPOINT === "undefined") {
    delete process.env.COMMENTS_ENDPOINT;
  } else {
    process.env.COMMENTS_ENDPOINT = ORIGINAL_COMMENTS_ENDPOINT;
  }

  if (typeof ORIGINAL_COMMENTS_ISSUE_FALLBACK === "undefined") {
    delete process.env.COMMENTS_ISSUE_FALLBACK;
  } else {
    process.env.COMMENTS_ISSUE_FALLBACK = ORIGINAL_COMMENTS_ISSUE_FALLBACK;
  }

  if (typeof ORIGINAL_GITHUB_ACTIONS === "undefined") {
    delete process.env.GITHUB_ACTIONS;
  } else {
    process.env.GITHUB_ACTIONS = ORIGINAL_GITHUB_ACTIONS;
  }

  if (typeof ORIGINAL_SITE_ORIGIN === "undefined") {
    delete process.env.SITE_ORIGIN;
  } else {
    process.env.SITE_ORIGIN = ORIGINAL_SITE_ORIGIN;
  }

  if (typeof ORIGINAL_SITE_URL === "undefined") {
    delete process.env.SITE_URL;
  } else {
    process.env.SITE_URL = ORIGINAL_SITE_URL;
  }

  if (typeof ORIGINAL_URL === "undefined") {
    delete process.env.URL;
  } else {
    process.env.URL = ORIGINAL_URL;
  }

  if (typeof ORIGINAL_PATH_PREFIX === "undefined") {
    delete process.env.PATH_PREFIX;
  } else {
    process.env.PATH_PREFIX = ORIGINAL_PATH_PREFIX;
  }

  if (typeof ORIGINAL_BASE_URL === "undefined") {
    delete process.env.BASE_URL;
  } else {
    process.env.BASE_URL = ORIGINAL_BASE_URL;
  }
});

describe("site comments config", () => {
  it("defaults comment endpoint to /api/submit-comment", () => {
    const siteData = loadSiteData();
    expect(siteData.comments.endpoint).toBe("/api/submit-comment");
    expect(siteData.comments.endpoints).toContain("/api/submit-comment");
  });

  it("defaults issue fallback to the repository issue form", () => {
    const siteData = loadSiteData();
    expect(siteData.comments.issueFallback).toBe("https://github.com/NNNvD/DUE/issues/new");
  });

  it("prefers COMMENTS_ENDPOINT from environment", () => {
    process.env.COMMENTS_ENDPOINT = "https://example.test/comments";
    const siteData = loadSiteData();
    expect(siteData.comments.endpoint).toBe("https://example.test/comments");
    expect(siteData.comments.endpoints[0]).toBe("https://example.test/comments");
  });

  it("disables the default local endpoint in GitHub Actions builds when no production endpoint is configured", () => {
    process.env.GITHUB_ACTIONS = "true";
    const siteData = loadSiteData();
    expect(siteData.comments.endpoint).toBe("");
    expect(siteData.comments.endpoints).toEqual([]);
  });

  it("supports explicit issue fallback override", () => {
    process.env.COMMENTS_ISSUE_FALLBACK = "https://example.test/issues/new";
    const siteData = loadSiteData();
    expect(siteData.comments.issueFallback).toBe("https://example.test/issues/new");
  });
});

describe("site URL config", () => {
  it("uses the configured GitHub Pages origin by default", () => {
    const siteData = loadSiteData();
    expect(siteData.siteUrl).toBe("https://nnnvd.github.io/DUE/");
  });

  it("lets local and preview builds override the origin", () => {
    process.env.SITE_ORIGIN = "http://localhost:8080";
    const siteData = loadSiteData();
    expect(siteData.siteUrl).toBe("http://localhost:8080/DUE/");
  });
});
