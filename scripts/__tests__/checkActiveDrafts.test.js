const { describe, it, expect } = require("vitest");
const { findOffenders } = require("../checkActiveDrafts");

describe("findOffenders", () => {
  it("flags authors with more than one active draft", () => {
    const offenders = findOffenders([
      { author: "alice", status: "draft" },
      { author: "alice", status: "draft" },
      { author: "bob", status: "draft" }
    ]);

    expect(offenders).toEqual([{ author: "alice", count: 2 }]);
  });

  it("ignores drafts without an author or with non-draft status", () => {
    const offenders = findOffenders([
      { author: "alice", status: "published" },
      { author: "", status: "draft" },
      { status: "draft" },
      { author: "carol", status: "draft" }
    ]);

    expect(offenders).toEqual([]);
  });
});
