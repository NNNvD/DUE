import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  enforceTopicAndKeywords,
  keywordPreview,
  normalizeKeywords,
  normalizeThemes,
} = require("../topicKeywordConstraints.js");

describe("topicKeywordConstraints", () => {
  it("keeps every keyword instead of truncating the list", () => {
    expect(normalizeKeywords([
      "deadlines",
      "revision",
      "publishing",
      "process",
      "scope",
      "quality",
    ])).toEqual([
      "deadlines",
      "revision",
      "publishing",
      "process",
      "scope",
      "quality",
    ]);
  });

  it("uses the legacy topic as a fallback keyword", () => {
    expect(enforceTopicAndKeywords({
      topic: "Why deadlines matter",
      keywords: [],
    }).keywords).toEqual(["Why deadlines matter"]);
  });

  it("keeps only allowed themes without imposing a count limit", () => {
    expect(normalizeThemes([
      "Publishing",
      "revision",
      "not-allowed",
      "feedback",
      "scope",
      "quality",
    ])).toEqual([
      "publishing",
      "revision",
      "feedback",
      "scope",
      "quality",
    ]);
  });

  it("builds a three-keyword browser preview", () => {
    expect(keywordPreview([
      "deadlines",
      "revision",
      "publishing",
      "process",
    ], 3)).toEqual([
      "deadlines",
      "revision",
      "publishing",
    ]);
  });
});
