import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";

const require = createRequire(import.meta.url);
const {
  bump,
  applyCommentContribution,
  applyContribution,
  parseEnv,
  processFileWithComment,
  resolveIntent,
} = require("../bumpVersionAndCredit.js");
const { validatePayload } = require("../../api/commentIntakeCore.js");

describe("bump", () => {
  it("increments the patch version for the default update path", () => {
    expect(bump("1.2", false)).toBe("1.2.1");
  });

  it("resets invalid versions before bumping", () => {
    expect(bump("not-a-version", true)).toBe("1.0.0");
  });
});

describe("resolveIntent", () => {
  it("maps the minor PR label to a patch update", () => {
    const parsed = parseEnv({
      PR_LABELS: JSON.stringify([{ name: "minor" }]),
      CHANGED_FILES: "",
    });

    expect(parsed.labelIntent).toBe("minor_update");
  });

  it("prefers front matter update_intent", () => {
    expect(resolveIntent({ update_intent: "new_version" }, "major_update")).toBe("new_version");
  });

  it("falls back to label intent", () => {
    expect(resolveIntent({}, "minor_update")).toBe("minor_update");
  });

  it("defaults to minor update", () => {
    expect(resolveIntent({}, null)).toBe("minor_update");
  });
});

describe("applyContribution", () => {
  it("adds release notes and promotes coauthors for new version contributions", () => {
    const base = {
      version: "1.4",
      release_notes: ["Previous entry"],
      coauthors: ["alice"]
    };

    const { data } = applyContribution(base, { intent: "new_version", user: "bob" });

    expect(data.version).toBe("2.0.0");
    expect(data.release_notes[0]).toBe("Contribution by @bob (new_version).");
    expect(data.release_notes.slice(1)).toEqual(["Previous entry"]);
    expect(data.coauthors.sort()).toEqual(["alice", "bob"]);
    expect(base.coauthors).toEqual(["alice"]);
  });

  it("queues acknowledgments for patch contributions from the minor label path", () => {
    const base = {
      version: "0.3",
      acknowledgments: [{ user: "alice", note: "Thanks", since_version: "0.2" }]
    };

    const { data } = applyContribution(base, { intent: "minor_update", user: "carol" });

    expect(data.version).toBe("0.3.1");
    expect(data.release_notes[0]).toBe("Contribution by @carol (minor_update).");
    expect(data.acknowledgments).toHaveLength(2);
    expect(data.acknowledgments[1]).toEqual({
      user: "carol",
      note: "Minor contribution",
      since_version: "0.3.1"
    });
    expect(base.acknowledgments).toHaveLength(1);
  });

  it("increments the patch digit for minor updates", () => {
    const base = { version: "2.3.4" };
    const { data } = applyContribution(base, { intent: "minor_update", user: "dana" });
    expect(data.version).toBe("2.3.5");
  });
});

describe("comment credit workflow", () => {
  it("does not credit feedback that has not been accepted into the essay", () => {
    expect(() => applyCommentContribution(
      { version: "1.2.0" },
      { intent: "minor", commenter_id: "reader-minor", status: "pending" }
    )).toThrow(/implemented before applying essay credit/);
  });

  it("credits accepted minor feedback in essay acknowledgments", () => {
    const proposed = validatePayload({
      slug: "credit-workflow",
      intent: "minor",
      name: "Reader Minor",
      commenter_id: "reader-minor",
      comment: "This sentence would be clearer with a concrete example.",
    });

    expect(proposed.valid).toBe(true);
    expect(proposed.data.commenter_id).toBe("reader-minor");

    const acceptedComment = {
      ...proposed.data,
      status: "implemented",
    };
    const essay = {
      version: "1.2.0",
      coauthors: [],
      acknowledgments: [],
      release_notes: [],
    };

    const { data } = applyCommentContribution(essay, acceptedComment);

    expect(data.version).toBe("1.2.1");
    expect(data.coauthors).toEqual([]);
    expect(data.acknowledgments).toContainEqual({
      user: "reader-minor",
      note: "Minor contribution",
      since_version: "1.2.1",
    });
    expect(data.release_notes[0]).toBe("Contribution by @reader-minor (minor_update).");
  });

  it("writes accepted minor feedback credit into an essay file", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "due-comment-credit-"));
    const essayPath = path.join(tempDir, "credit-workflow.md");
    fs.writeFileSync(essayPath, `---
title: Credit Workflow
author: tester
status: published
version: 1.2.0
coauthors: []
acknowledgments: []
release_notes: []
---

Essay body.
`, "utf8");

    try {
      processFileWithComment(essayPath, {
        intent: "minor",
        commenter_id: "reader-minor",
        status: "implemented",
      }, fs, { writeSnapshot: false });

      const updated = matter.read(essayPath).data;
      expect(updated.version).toBe("1.2.1");
      expect(updated.acknowledgments).toContainEqual({
        user: "reader-minor",
        note: "Minor contribution",
        since_version: "1.2.1",
      });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("credits accepted major feedback as essay coauthorship", () => {
    const proposed = validatePayload({
      slug: "credit-workflow",
      intent: "major",
      name: "Reader Major",
      commenter_id: "reader-major",
      comment: "The argument needs a new section that distinguishes speed from carelessness.",
    });

    expect(proposed.valid).toBe(true);
    expect(proposed.data.commenter_id).toBe("reader-major");

    const acceptedComment = {
      ...proposed.data,
      status: "implemented",
    };
    const essay = {
      version: "1.2.1",
      coauthors: [],
      acknowledgments: [{ user: "reader-major", note: "Minor contribution", since_version: "1.2.1" }],
      release_notes: ["Earlier polish."],
    };

    const { data } = applyCommentContribution(essay, acceptedComment);

    expect(data.version).toBe("2.0.0");
    expect(data.coauthors).toEqual(["reader-major"]);
    expect(data.acknowledgments).toBeUndefined();
    expect(data.release_notes).toEqual([
      "Contribution by @reader-major (new_version).",
      "Earlier polish.",
    ]);
  });
});
