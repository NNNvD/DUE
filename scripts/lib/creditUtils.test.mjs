import { describe, it, expect } from "vitest";
import creditUtils from "./creditUtils.js";

const { normalizeCoauthors, normalizeAcknowledgments, _internal } = creditUtils;

const sampleAcknowledgments = [
  { user: "carol", note: "Original", since_version: "1.2" },
  { user: "carol", note: "Minor contribution", since_version: "1.3" }
];

describe("normalizeCoauthors", () => {
  it("removes duplicates and trims names", () => {
    const coauthors = normalizeCoauthors(["alice", "bob", " alice ", "bob", 42, ""]);
    expect(coauthors).toEqual(["alice", "bob"]);
  });
});

describe("normalizeAcknowledgments", () => {
  it("preserves the earliest since_version for duplicates", () => {
    const acknowledgments = normalizeAcknowledgments(sampleAcknowledgments);
    expect(acknowledgments).toHaveLength(1);
    expect(acknowledgments[0]).toMatchObject({
      user: "carol",
      note: "Original",
      since_version: "1.2"
    });
  });

  it("fills in missing notes with the default message", () => {
    const filled = normalizeAcknowledgments([
      { user: "erin", note: "", since_version: "1.0" },
      { user: "erin", note: "Minor contribution", since_version: "1.1" }
    ]);

    expect(filled).toHaveLength(1);
    expect(filled[0]).toMatchObject({
      user: "erin",
      note: "Minor contribution",
      since_version: "1.0"
    });
  });
});

describe("_internal.selectEarliestVersion", () => {
  const { selectEarliestVersion } = _internal;

  it("prefers the lower semantic version", () => {
    expect(selectEarliestVersion("1.2", "1.3")).toBe("1.2");
    expect(selectEarliestVersion("2.0", "1.5")).toBe("1.5");
    expect(selectEarliestVersion("1.2.1", "1.2.3")).toBe("1.2.1");
  });
});
