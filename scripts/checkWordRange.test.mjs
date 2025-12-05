import { describe, it, expect } from "vitest";
import { bounds, validateWordRange, wordCount } from "./checkWordRange.js";

describe("bounds", () => {
  it("expands a simple range with grace buffer", () => {
    const [lo, hi] = bounds("250-500");
    expect(lo).toBe(250);
    expect(hi).toBeGreaterThanOrEqual(500);
  });

  it("handles stringifiable numbers", () => {
    const [lo, hi] = bounds(750);
    expect(lo).toBe(750);
    expect(hi).toBeGreaterThanOrEqual(750);
  });
});

describe("validateWordRange", () => {
  it("accepts content within the declared bounds", () => {
    const result = validateWordRange("one two three four five", "1-5");
    expect(result.ok).toBe(true);
  });

  it("rejects content shorter than the minimum", () => {
    const result = validateWordRange("tiny", "3-10");
    expect(result.ok).toBe(false);
  });
});

describe("wordCount", () => {
  it("ignores fenced code and footnotes for counts", () => {
    const text = "```\ncode only\n```\nContent with a footnote[^1].\n\n[^1]: note";
    expect(wordCount(text)).toBe(4);
  });
});
