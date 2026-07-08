import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildConfig,
  inferRepo,
  parseArgs,
  toAbsoluteEndpoint,
  withSiteBasePath,
} = require("../verifyCommentIntakeLive.js");

describe("verifyCommentIntakeLive", () => {
  it("parses long-form CLI flags", () => {
    expect(parseArgs([
      "--endpoint",
      "https://example.test/api/submit-comment",
      "--skip-github-check",
      "--slug=on-deadlines-and-honesty",
    ])).toEqual({
      endpoint: "https://example.test/api/submit-comment",
      "skip-github-check": true,
      slug: "on-deadlines-and-honesty",
    });
  });

  it("infers the owner/repo from a GitHub URL", () => {
    expect(inferRepo("https://github.com/NNNvD/DUE")).toBe("NNNvD/DUE");
  });

  it("resolves site-relative essay URLs without dropping the Pages path prefix", () => {
    expect(withSiteBasePath("https://nnnvd.github.io/DUE/", "/essays/published/on-deadlines-and-honesty/")).toBe(
      "https://nnnvd.github.io/DUE/essays/published/on-deadlines-and-honesty/"
    );
  });

  it("resolves endpoint paths against the deployment origin", () => {
    expect(toAbsoluteEndpoint("/api/submit-comment", "https://nnnvd.github.io/DUE/")).toBe(
      "https://nnnvd.github.io/api/submit-comment"
    );
  });

  it("builds a verification config from site defaults", () => {
    const config = buildConfig(
      {},
      {},
      {
        baseUrl: "/DUE/",
        siteUrl: "https://nnnvd.github.io/DUE/",
        repoUrl: "https://github.com/NNNvD/DUE",
        comments: {
          endpoint: "/api/submit-comment",
        },
      }
    );

    expect(config.endpoint).toBe("https://nnnvd.github.io/api/submit-comment");
    expect(config.repo).toBe("NNNvD/DUE");
    expect(config.slug).toBe("moratorium-on-box");
    expect(config.essayPath).toBe("/DUE/essays/published/moratorium-on-box/");
    expect(config.essayUrl).toBe("https://nnnvd.github.io/DUE/essays/published/moratorium-on-box/");
  });
});
