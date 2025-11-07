import { describe, it, expect } from "vitest";
import checkActiveDrafts from "../checkActiveDrafts.js";

const { findOffenders, loadDrafts } = checkActiveDrafts;

describe("findOffenders", () => {
  it("flags authors with multiple active drafts", () => {
    const offenders = findOffenders([
      { author: "alice", status: "draft" },
      { author: "bob", status: "draft" },
      { author: "alice", status: "draft" }
    ]);

    expect(offenders).toEqual([{ author: "alice", count: 2 }]);
  });

  it("ignores drafts without authors or with published status", () => {
    const offenders = findOffenders([
      { author: "", status: "draft" },
      { author: "bob", status: "published" },
      { author: "carol", status: "draft" }
    ]);

    expect(offenders).toEqual([]);
  });
});

describe("loadDrafts", () => {
  it("returns an empty array when the directory is missing", () => {
    const fsMock = {
      existsSync: () => false
    };

    expect(loadDrafts("missing", fsMock)).toEqual([]);
  });

  it("parses front matter for markdown files", () => {
    const fsMock = {
      existsSync: () => true,
      readdirSync: () => ["draft.md", "ignore.txt"],
      readFileSync: () => "---\nauthor: alice\nstatus: draft\n---\ncontent"
    };

    const drafts = loadDrafts("dir", fsMock);

    expect(drafts).toEqual([{ author: "alice", status: "draft" }]);
  });
});
