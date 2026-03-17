import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const ORIGINAL_COMMENTS_ENDPOINT = process.env.COMMENTS_ENDPOINT;

function loadSiteData() {
  const modulePath = require.resolve("../../site/_data/site.js");
  delete require.cache[modulePath];
  return require("../../site/_data/site.js");
}

beforeEach(() => {
  delete process.env.COMMENTS_ENDPOINT;
});

afterEach(() => {
  if (typeof ORIGINAL_COMMENTS_ENDPOINT === "undefined") {
    delete process.env.COMMENTS_ENDPOINT;
  } else {
    process.env.COMMENTS_ENDPOINT = ORIGINAL_COMMENTS_ENDPOINT;
  }
});

describe("site comments config", () => {
  it("defaults comment endpoint to /api/submit-comment", () => {
    const siteData = loadSiteData();
    expect(siteData.comments.endpoint).toBe("/api/submit-comment");
  });

  it("prefers COMMENTS_ENDPOINT from environment", () => {
    process.env.COMMENTS_ENDPOINT = "https://example.test/comments";
    const siteData = loadSiteData();
    expect(siteData.comments.endpoint).toBe("https://example.test/comments");
  });
});
