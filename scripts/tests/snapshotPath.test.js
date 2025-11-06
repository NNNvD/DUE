const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");

const { writeSnapshot } = require("../lib/snapshot");

(function run() {
  const slug = "__test-essay";
  const sourcePath = path.join("site", "essays", "published", `${slug}.md`);
  const snapshotDir = path.join("site", "essays", "snapshots", slug);
  const frontMatter = {
    title: "Snapshot path check",
    version: "2.3"
  };
  const content = "# Test snapshot\n\nContent body.";

  fs.removeSync(snapshotDir);

  try {
    const snapshotPath = writeSnapshot(sourcePath, frontMatter, content);
    const expectedPath = path.join(snapshotDir, "v2.3.md");

    assert.strictEqual(
      snapshotPath,
      expectedPath,
      "Snapshot path should follow site/essays/snapshots/<slug>/vX.Y.md"
    );

    assert.ok(fs.pathExistsSync(expectedPath), "Snapshot file should be written to disk");

    const written = fs.readFileSync(expectedPath, "utf8");
    assert.ok(
      written.includes("layout: snapshot.njk"),
      "Snapshot should override layout to snapshot.njk"
    );

    console.log("Snapshot path test passed");
  } finally {
    fs.removeSync(snapshotDir);
  }
})();
