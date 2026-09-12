import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  defaultReleaseNote,
  normalizeReleaseNote,
  processPublishedFile,
} = require("../processCmsSave.js");

describe("process CMS save", () => {
  it("provides readable generic release notes", () => {
    expect(defaultReleaseNote("minor_update")).toBe("Small correction.");
    expect(defaultReleaseNote("major_update")).toBe("Substantive revision.");
    expect(defaultReleaseNote("new_version")).toBe("New edition.");
    expect(normalizeReleaseNote("  Clarified the conclusion.  ", "minor_update")).toBe("Clarified the conclusion.");
  });

  it("bumps an author revision without changing authorship or acknowledgments", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "due-cms-save-"));
    const fp = path.join(dir, "essay.md");
    const raw = matter.stringify("Updated essay body.\n", {
      title: "Essay",
      author: "noahvandongen",
      coauthors: [],
      acknowledgments: [],
      status: "published",
      started_at: "2026-09-01",
      deadline_at: "2026-10-01",
      initial_status: "complete",
      published_at: "2026-09-10",
      version: "1.0.0",
      update_intent: "minor_update",
      update_note: "",
      update_pending: true,
      release_notes: ["Initial publication."],
    });
    fs.writeFileSync(fp, raw, "utf8");

    const result = processPublishedFile(fp, {
      now: new Date("2026-09-12T12:00:00Z"),
      snapshot: false,
    });
    const updated = matter.read(fp).data;

    expect(result.version).toBe("1.0.1");
    expect(updated.version).toBe("1.0.1");
    expect(updated.release_notes[0]).toBe("Small correction.");
    expect(updated.release_notes[1]).toBe("Initial publication.");
    expect(updated.coauthors).toEqual([]);
    expect(updated.acknowledgments).toEqual([]);
    expect(updated.update_pending).toBeUndefined();
    expect(updated.update_note).toBeUndefined();
    expect(updated.last_modified_at).toBe("2026-09-12");
  });

  it("applies substantive and new-edition version semantics", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "due-cms-save-"));
    const fp = path.join(dir, "essay.md");

    fs.writeFileSync(fp, matter.stringify("Body.\n", {
      title: "Essay",
      author: "noahvandongen",
      status: "published",
      started_at: "2026-09-01",
      deadline_at: "2026-10-01",
      initial_status: "complete",
      published_at: "2026-09-10",
      version: "1.2.3",
      update_intent: "major_update",
      update_note: "Reworked the central argument.",
      update_pending: true,
      release_notes: [],
    }), "utf8");

    processPublishedFile(fp, { snapshot: false });
    let updated = matter.read(fp).data;
    expect(updated.version).toBe("1.3.0");
    expect(updated.release_notes[0]).toBe("Reworked the central argument.");

    updated.update_intent = "new_version";
    updated.update_note = "Reconceived the essay.";
    updated.update_pending = true;
    fs.writeFileSync(fp, matter.stringify("Body again.\n", updated), "utf8");

    processPublishedFile(fp, { snapshot: false });
    updated = matter.read(fp).data;
    expect(updated.version).toBe("2.0.0");
    expect(updated.release_notes[0]).toBe("Reconceived the essay.");
  });
});
