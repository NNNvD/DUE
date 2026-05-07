import { describe, it, expect, vi, afterEach } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const require = createRequire(import.meta.url);
const { getDeadlineDate, resolveDeadline, runAutopublish } = require("../autopublish.js");
const { createDraft } = require("../newDraft.js");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getDeadlineDate", () => {
  it("parses deadline_at when front matter provides a Date object", () => {
    const deadline = getDeadlineDate({
      title: "Date object deadline",
      deadline_at: new Date("2024-01-31T00:00:00.000Z")
    });

    expect(deadline?.isValid()).toBe(true);
    expect(deadline?.toISOString()).toBe("2024-01-31T00:00:00.000Z");
  });

  it("respects deadline_at_time when front matter has already parsed deadline_at into a Date object", () => {
    const deadline = getDeadlineDate({
      title: "Date object with time",
      deadline_at: new Date("2026-03-02T00:00:00.000Z"),
      deadline_at_time: "23:30"
    });

    expect(deadline?.isValid()).toBe(true);
    expect(deadline?.toISOString()).toBe("2026-03-02T23:30:00.000Z");
  });

  it("returns null for unsupported deadline_at types", () => {
    const deadline = getDeadlineDate({
      deadline_at: 1706659200000
    });

    expect(deadline).toBeNull();
  });

  it("combines deadline_at with deadline_at_time including timezone offsets", () => {
    const deadline = getDeadlineDate({
      deadline_at: "2026-03-01",
      deadline_at_time: "23:30-04:00"
    });

    expect(deadline?.isValid()).toBe(true);
    expect(deadline?.toISOString()).toBe("2026-03-02T03:30:00.000Z");
  });

  it("normalizes YAML-coerced numeric deadline_at_time values back into clock time", () => {
    const deadline = getDeadlineDate({
      deadline_at: "2026-03-01",
      deadline_at_time: 1410
    });

    expect(deadline?.isValid()).toBe(true);
    expect(deadline?.toISOString()).toBe("2026-03-01T23:30:00.000Z");
  });

  it("falls back to midnight UTC when deadline_at_time is invalid", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const deadline = getDeadlineDate({
      title: "Broken time",
      deadline_at: "2026-03-01",
      deadline_at_time: "soon-ish"
    });

    expect(deadline?.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('Invalid deadline_at_time "soon-ish"');
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
  it("runs the new-essay lifecycle from 30-day countdown start to autopublication", () => {
    const root = process.cwd();
    const draftsDir = path.join(root, "site/essays/drafts");
    const hadDraftsDir = fs.existsSync(draftsDir);
    const slug = `new-essay-lifecycle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const draftPath = path.join(root, `site/essays/drafts/${slug}.md`);
    const pubPath = path.join(root, `site/essays/published/${slug}.md`);

    try {
      const draft = createDraft({
        title: "New Essay Lifecycle",
        keywords: ["countdown", "publication"],
        author: "Test",
        slug,
        now: "2026-04-01T09:30:00.000Z",
      });

      expect(draft.filePath).toBe(draftPath);
      expect(fs.existsSync(draftPath)).toBe(true);

      const draftDoc = matter.read(draftPath);
      expect(draftDoc.data).toMatchObject({
        title: "New Essay Lifecycle",
        author: "Test",
        status: "proposed",
        started_at: "2026-04-01",
        proposed_at: "2026-04-01",
        deadline_at: "2026-05-01",
        initial_status: "unfinished",
        version: "0.1.0",
      });

      expect(resolveDeadline(draftDoc.data)?.toISOString()).toBe("2026-05-01T00:00:00.000Z");

      const beforeDeadline = runAutopublish({
        quiet: true,
        referenceTime: "2026-04-30T23:59:59.000Z",
      });
      expect(beforeDeadline.some(entry => entry.slug === slug)).toBe(false);
      expect(fs.existsSync(draftPath)).toBe(true);
      expect(fs.existsSync(pubPath)).toBe(false);

      const atDeadline = runAutopublish({
        quiet: true,
        referenceTime: "2026-05-01T00:00:00.000Z",
      });
      expect(atDeadline.some(entry => entry.slug === slug)).toBe(true);
      expect(fs.existsSync(draftPath)).toBe(false);
      expect(fs.existsSync(pubPath)).toBe(true);

      const publishedDoc = matter.read(pubPath);
      expect(publishedDoc.data).toMatchObject({
        status: "published",
        published_at: "2026-05-01",
        permalink: `/essays/published/${slug}/`,
        version: "0.1.0",
      });
      expect(String(publishedDoc.data.release_notes[0])).toContain("Auto-published at deadline");
    } finally {
      if (fs.existsSync(draftPath)) fs.unlinkSync(draftPath);
      if (fs.existsSync(pubPath)) fs.unlinkSync(pubPath);
      if (!hadDraftsDir && fs.existsSync(draftsDir)) {
        fs.rmSync(draftsDir, { recursive: true, force: true });
      }
    }
  });

  it("publishes proposed drafts when deadline has passed", () => {
    const root = process.cwd();
    const draftsDir = path.join(root, "site/essays/drafts");
    const draftPath = path.join(root, "site/essays/drafts/__autopublish-test-proposed__.md");
    const pubPath = path.join(root, "site/essays/published/__autopublish-test-proposed__.md");
    const hadDraftsDir = fs.existsSync(draftsDir);

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

    fs.mkdirSync(draftsDir, { recursive: true });
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
      if (!hadDraftsDir && fs.existsSync(draftsDir)) {
        fs.rmSync(draftsDir, { recursive: true, force: true });
      }
    }
  });

  it("does not publish before the explicit deadline_at_time has passed", () => {
    const root = process.cwd();
    const draftsDir = path.join(root, "site/essays/drafts");
    const draftPath = path.join(root, "site/essays/drafts/__autopublish-test-timed__.md");
    const pubPath = path.join(root, "site/essays/published/__autopublish-test-timed__.md");
    const hadDraftsDir = fs.existsSync(draftsDir);

    const source = `---
title: Test timed draft
author: Test
status: draft
initial_status: unfinished
started_at: 2026-03-01
deadline_at: 2026-03-02
deadline_at_time: 23:30
word_range: 250-500
release_notes: []
---

Timed test.
`;

    fs.mkdirSync(draftsDir, { recursive: true });
    fs.writeFileSync(draftPath, source, "utf8");

    try {
      const published = runAutopublish({
        quiet: true,
        referenceTime: "2026-03-02T23:29:00.000Z"
      });

      expect(published).toEqual([]);
      expect(fs.existsSync(draftPath)).toBe(true);
      expect(fs.existsSync(pubPath)).toBe(false);
    } finally {
      if (fs.existsSync(draftPath)) fs.unlinkSync(draftPath);
      if (fs.existsSync(pubPath)) fs.unlinkSync(pubPath);
      if (!hadDraftsDir && fs.existsSync(draftsDir)) {
        fs.rmSync(draftsDir, { recursive: true, force: true });
      }
    }
  });

  it("refuses to overwrite an existing published essay when nested draft basenames collide", () => {
    const root = process.cwd();
    const nestedDraftsDir = path.join(root, "site/essays/drafts/nested");
    const draftPath = path.join(nestedDraftsDir, "collision.md");
    const pubPath = path.join(root, "site/essays/published/collision.md");
    const hadNestedDir = fs.existsSync(nestedDraftsDir);
    const hadPublishedFile = fs.existsSync(pubPath);
    const originalPublished = hadPublishedFile ? fs.readFileSync(pubPath, "utf8") : null;

    const draftSource = `---
title: Collision draft
author: Test
status: draft
initial_status: unfinished
started_at: 2026-01-01
deadline_at: 2026-02-01
word_range: 250-500
release_notes: []
---

Collision.
`;

    const publishedSource = `---
title: Existing published essay
author: Test
status: published
initial_status: unfinished
started_at: 2025-01-01
deadline_at: 2025-02-01
published_at: 2025-02-01
version: 0.1.0
word_range: 250-500
release_notes: []
---

Already published.
`;

    fs.mkdirSync(nestedDraftsDir, { recursive: true });
    fs.writeFileSync(draftPath, draftSource, "utf8");
    fs.writeFileSync(pubPath, publishedSource, "utf8");

    try {
      expect(() => runAutopublish({
        quiet: true,
        referenceTime: "2026-03-01T00:00:00.000Z"
      })).toThrow(/Refusing to overwrite existing published essay/);
      expect(fs.existsSync(draftPath)).toBe(true);
    } finally {
      if (fs.existsSync(draftPath)) fs.unlinkSync(draftPath);
      if (!hadNestedDir) {
        const draftsRoot = path.join(root, "site/essays/drafts");
        if (fs.existsSync(nestedDraftsDir)) fs.rmSync(nestedDraftsDir, { recursive: true, force: true });
        if (fs.existsSync(draftsRoot) && fs.readdirSync(draftsRoot).length === 0) {
          fs.rmSync(draftsRoot, { recursive: true, force: true });
        }
      }
      if (hadPublishedFile && originalPublished !== null) {
        fs.writeFileSync(pubPath, originalPublished, "utf8");
      } else if (fs.existsSync(pubPath)) {
        fs.unlinkSync(pubPath);
      }
    }
  });
});
