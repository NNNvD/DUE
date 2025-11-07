import { describe, it, expect } from "vitest";
import checkWordRange from "../checkWordRange.js";

const { wordCount, bounds, validateWordRange } = checkWordRange;

describe("wordCount", () => {
  it("counts words while ignoring markdown syntax", () => {
    const md = "# Title\n\nHello, brave new world.";
    expect(wordCount(md)).toBe(5);
  });
});

describe("bounds", () => {
  it("adds a 2% grace range to the upper bound", () => {
    expect(bounds("250-500")).toEqual([250, 510]);
  });
});

describe("validateWordRange", () => {
  it("passes when the content is within range", () => {
    const result = validateWordRange("One two three", "2-3");
    expect(result.ok).toBe(true);
    expect(result.range).toEqual([2, 4]);
    expect(result.wordCount).toBe(3);
  });

  it("fails when the content exceeds the range", () => {
    const result = validateWordRange("one two three four five six", "2-3");
    expect(result.ok).toBe(false);
    expect(result.range).toEqual([2, 4]);
    expect(result.wordCount).toBe(6);
  });
});
