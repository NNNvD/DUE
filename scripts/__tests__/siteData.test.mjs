import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const ORIGINAL_COMMENTS_ENDPOINT = process.env.COMMENTS_ENDPOINT;
const ORIGINAL_COMMENTS_ISSUE_FALLBACK = process.env.COMMENTS_ISSUE_FALLBACK;

function loadSiteData() {
  const modulePath = require.resolve("../../site/_data/site.js");
  delete require.cache[modulePath];
  return require("../../site/_data/site.js");
}

beforeEach(() => {
  delete process.env.COMMENTS_ENDPOINT;
  delete process.env.COMMENTS_ISSUE_FALLBACK;
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
});

describe("site comments config", () => {
  it("defaults comment endpoint to /api/submit-comment", () => {
    const siteData = loadSiteData();
    expect(siteData.comments.endpoint).toBe("/api/submit-comment");
    expect(siteData.comments.endpoints).toContain("/api/submit-comment");
  });

  it("prefers COMMENTS_ENDPOINT from environment", () => {
    process.env.COMMENTS_ENDPOINT = "https://example.test/comments";
    const siteData = loadSiteData();
    expect(siteData.comments.endpoint).toBe("https://example.test/comments");
    expect(siteData.comments.endpoints[0]).toBe("https://example.test/comments");
  });

  it("supports explicit issue fallback override", () => {
    process.env.COMMENTS_ISSUE_FALLBACK = "https://example.test/issues/new";
    const siteData = loadSiteData();
    expect(siteData.comments.issueFallback).toBe("https://example.test/issues/new");
  });
});
