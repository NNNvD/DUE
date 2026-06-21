import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { findOverdueDrafts } = require("../checkOverdueDrafts");

function fakeFs(files) {
  return {
    readFileSync(file) {
      return files[file];
    },
  };
}

describe("checkOverdueDrafts", () => {
  it("flags proposed drafts whose deadline has passed", () => {
    const files = {
      "site/essays/drafts/late.md": `---
title: Late
status: proposed
started_at: 2026-04-21
deadline_at: 2026-05-21
---

Body
`,
    };

    const overdue = findOverdueDrafts({
      files: Object.keys(files),
      fsModule: fakeFs(files),
      now: new Date("2026-06-19T00:00:00Z"),
    });

    expect(overdue).toHaveLength(1);
    expect(overdue[0].file).toBe("site/essays/drafts/late.md");
  });

  it("allows future drafts", () => {
    const files = {
      "site/essays/drafts/future.md": `---
title: Future
status: proposed
started_at: 2026-06-19
deadline_at: 2026-07-19
---

Body
`,
    };

    const overdue = findOverdueDrafts({
      files: Object.keys(files),
      fsModule: fakeFs(files),
      now: new Date("2026-06-19T00:00:00Z"),
    });

    expect(overdue).toEqual([]);
  });
});
