import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import snapshot from "../lib/snapshot.js";

const { writeSnapshot } = snapshot;
const slug = "__test-essay";
const sourcePath = path.join("site", "essays", "published", `${slug}.md`);
const snapshotDir = path.join("site", "essays", "snapshots", slug);
const expectedPath = path.join(snapshotDir, "v2.3.0.md");

beforeEach(() => {
  fs.removeSync(snapshotDir);
});

afterEach(() => {
  fs.removeSync(snapshotDir);
});

describe("writeSnapshot", () => {
  it("writes the snapshot to the expected path with updated front matter", () => {
    const frontMatter = {
      title: "Snapshot path check",
      version: "2.3"
    };
    const content = "# Test snapshot\n\nContent body.";

    const snapshotPath = writeSnapshot(sourcePath, frontMatter, content);
    const written = fs.readFileSync(expectedPath, "utf8");

    expect(snapshotPath).toBe(expectedPath);
    expect(fs.pathExistsSync(expectedPath)).toBe(true);
    expect(written).toContain("layout: snapshot.njk");
    expect(written).toContain("permalink: /essays/published/__test-essay/v2.3.0/");
  });
});
