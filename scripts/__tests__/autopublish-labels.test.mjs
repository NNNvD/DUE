import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const require = createRequire(import.meta.url);
const { runAutopublish } = require("../autopublish.js");
const essayIndex = require("../../site/_data/essayIndex.js");
const { resolveTimeStatus } = require("../lib/essayLifecycle.js");

function uniqueSlug(name) {
  return `test-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function writeEssay(relativePath, source) {
  const absolutePath = path.join(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, source, "utf8");
  return absolutePath;
}

function removePath(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

describe("autopublish and label assignment", () => {
  it("autopublishes overdue drafts and assigns draft/published labels correctly in the essay index", () => {
    const overdueSlug = uniqueSlug("autopublish-overdue");
    const futureSlug = uniqueSlug("autopublish-future");
    const completePublishedSlug = uniqueSlug("published-complete");
    const unfinishedPublishedSlug = uniqueSlug("published-unfinished");

    const createdPaths = [
      writeEssay(`site/essays/drafts/${overdueSlug}.md`, `---
title: Overdue Draft
topic: Overdue topic
author: tester
status: draft
initial_status: unfinished
started_at: 2026-02-01
deadline_at: 2026-03-01
word_range: 250-500
release_notes: []
---

This overdue draft should autopublish.
`),
      writeEssay(`site/essays/drafts/${futureSlug}.md`, `---
title: Future Draft
topic: Future topic
author: tester
status: proposed
initial_status: unfinished
started_at: 2026-04-01
deadline_at: 2026-05-01
word_range: 250-500
release_notes: []
---

This future draft should remain a draft.
`),
      writeEssay(`site/essays/published/${completePublishedSlug}.md`, `---
title: Complete Published
topic: Complete topic
author: tester
status: published
initial_status: complete
started_at: 2026-01-01
deadline_at: 2026-01-10
published_at: 2026-01-20
version: 1.0.0
word_range: 250-500
release_notes: []
---

This published essay was complete at release.
`),
      writeEssay(`site/essays/published/${unfinishedPublishedSlug}.md`, `---
title: Unfinished Published
topic: Unfinished topic
author: tester
status: published
initial_status: unfinished
started_at: 2026-01-01
deadline_at: 2026-01-10
published_at: 2026-01-05
version: 0.1.0
word_range: 250-500
release_notes: []
---

This published essay was unfinished at release.
`),
    ];

    const overduePublishedPath = path.join(process.cwd(), `site/essays/published/${overdueSlug}.md`);
    const overdueDraftPath = path.join(process.cwd(), `site/essays/drafts/${overdueSlug}.md`);

    try {
      const results = runAutopublish({
        quiet: true,
        referenceTime: "2026-03-31T00:00:00.000Z",
      });

      expect(results.some((entry) => entry.slug === overdueSlug)).toBe(true);
      expect(fs.existsSync(overdueDraftPath)).toBe(false);
      expect(fs.existsSync(overduePublishedPath)).toBe(true);

      const publishedDoc = matter.read(overduePublishedPath);
      expect(publishedDoc.data.status).toBe("published");
      expect(publishedDoc.data.version).toBe("0.1.0");
      expect(publishedDoc.data.published_at).toBe("2026-03-31");
      expect(publishedDoc.data.permalink).toBe(`/essays/published/${overdueSlug}/`);
      expect(Array.isArray(publishedDoc.data.release_notes)).toBe(true);
      expect(String(publishedDoc.data.release_notes[0])).toContain("Auto-published at deadline");

      const entries = essayIndex();
      const overdueEntry = entries.find((entry) => entry.slug === overdueSlug);
      const futureEntry = entries.find((entry) => entry.slug === futureSlug);
      const completePublishedEntry = entries.find((entry) => entry.slug === completePublishedSlug);
      const unfinishedPublishedEntry = entries.find((entry) => entry.slug === unfinishedPublishedSlug);

      expect(overdueEntry).toMatchObject({
        status: "published",
        initial_status: "unfinished",
        time_status: "unfinished-on-time",
        version: "0.1.0",
      });

      expect(futureEntry).toMatchObject({
        status: "proposed",
        time_status: "draft",
      });

      expect(completePublishedEntry).toMatchObject({
        status: "published",
        initial_status: "complete",
        time_status: "finished-on-time",
      });

      expect(unfinishedPublishedEntry).toMatchObject({
        status: "published",
        initial_status: "unfinished",
        time_status: "unfinished-on-time",
      });
    } finally {
      for (const createdPath of createdPaths) {
        removePath(createdPath);
      }
      removePath(overduePublishedPath);
      removePath(overdueDraftPath);
    }
  });

  it("derives published labels from initial_status before falling back to date comparisons", () => {
    expect(resolveTimeStatus({
      status: "published",
      initialStatus: "complete",
      publishedAt: "2026-02-01",
      deadlineAt: "2026-01-01",
      startedAt: "2025-12-01",
    })).toBe("finished-on-time");

    expect(resolveTimeStatus({
      status: "published",
      initialStatus: "unfinished",
      publishedAt: "2025-12-25",
      deadlineAt: "2026-01-01",
      startedAt: "2025-12-01",
    })).toBe("unfinished-on-time");

    expect(resolveTimeStatus({
      status: "draft",
      initialStatus: "complete",
      publishedAt: "2026-01-01",
      deadlineAt: "2026-01-01",
      startedAt: "2025-12-01",
    })).toBe("draft");
  });
});
