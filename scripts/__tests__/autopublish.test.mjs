import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getDeadlineDate, resolveDeadline } = require("../autopublish.js");

describe("getDeadlineDate", () => {
  it("parses deadline_at when front matter provides a Date object", () => {
    const deadline = getDeadlineDate({
      title: "Date object deadline",
      deadline_at: new Date("2024-01-31T00:00:00.000Z")
    });

    expect(deadline?.isValid()).toBe(true);
    expect(deadline?.toISOString()).toBe("2024-01-31T00:00:00.000Z");
  });

  it("returns null for unsupported deadline_at types", () => {
    const deadline = getDeadlineDate({
      deadline_at: 1706659200000
    });

    expect(deadline).toBeNull();
  });
});

describe("resolveDeadline", () => {
  it("falls back to started_at + 30 days when deadline_at is missing", () => {
    const deadline = resolveDeadline({
      started_at: "2024-01-01"
    });

    expect(deadline?.toISOString()).toBe("2024-01-31T00:00:00.000Z");
  });
});
