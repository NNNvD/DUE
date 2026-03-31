import { describe, it, expect } from "vitest";
import checkWordRange from "../checkWordRange.js";

const { wordCount, bounds, validateWordRange, wordRangeFromCount, checkFiles } = checkWordRange;

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

describe("wordRangeFromCount", () => {
  it("maps counts into Tiny/Minute/Short bands", () => {
    expect(wordRangeFromCount(250)).toBe("250-500");
    expect(wordRangeFromCount(700)).toBe("500-1000");
    expect(wordRangeFromCount(1200)).toBe("1000-1500");
  });

  it("returns null for out-of-band counts", () => {
    expect(wordRangeFromCount(35)).toBeNull();
    expect(wordRangeFromCount(2000)).toBeNull();
  });
});

describe("published range validation", () => {
  it("fails when out-of-band published essays still carry a stale word_range", () => {
    const fsMock = {
      readFileSync: () => "---\nstatus: published\nword_range: 500-1000\n---\none two three",
      writeFileSync: () => {},
    };

    const { errors } = checkFiles(["site/essays/published/example.md"], { fsModule: fsMock, write: false });
    expect(errors.some((entry) => entry.includes("expected unset"))).toBe(true);
  });
});
