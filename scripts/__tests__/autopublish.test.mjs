import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { getDeadlineDate, resolveDeadline, runAutopublish } = require("../autopublish.js");

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

describe("runAutopublish", () => {
  it("publishes proposed drafts when deadline has passed", () => {
    const root = process.cwd();
    const draftPath = path.join(root, "site/essays/drafts/__autopublish-test-proposed__.md");
    const pubPath = path.join(root, "site/essays/published/__autopublish-test-proposed__.md");

    const source = `---
title: Test proposed draft
author: Test
status: proposed
initial_status: unfinished
started_at: 2026-02-01
deadline_at: 2026-03-01
word_range: 0-100
release_notes: []
---

Test.
`;

    fs.writeFileSync(draftPath, source, "utf8");

    try {
      const published = runAutopublish({
        quiet: true,
        referenceTime: "2026-03-31T00:00:00.000Z"
      });
      expect(published.some(entry => entry.slug === "__autopublish-test-proposed__")).toBe(true);
      expect(fs.existsSync(pubPath)).toBe(true);
      expect(fs.existsSync(draftPath)).toBe(false);
    } finally {
      if (fs.existsSync(draftPath)) fs.unlinkSync(draftPath);
      if (fs.existsSync(pubPath)) fs.unlinkSync(pubPath);
    }
  });
});
