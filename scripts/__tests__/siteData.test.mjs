import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const ORIGINAL_COMMENTS_ENDPOINT = process.env.COMMENTS_ENDPOINT;
const ORIGINAL_COMMENTS_ISSUE_FALLBACK = process.env.COMMENTS_ISSUE_FALLBACK;
const ORIGINAL_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS;

function loadSiteData() {
  const modulePath = require.resolve("../../site/_data/site.js");
  delete require.cache[modulePath];
  return require("../../site/_data/site.js");
}

beforeEach(() => {
  delete process.env.COMMENTS_ENDPOINT;
  delete process.env.COMMENTS_ISSUE_FALLBACK;
  delete process.env.GITHUB_ACTIONS;
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
