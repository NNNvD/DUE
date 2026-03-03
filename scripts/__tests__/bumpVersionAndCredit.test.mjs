import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { bump, applyContribution, resolveIntent } = require("../bumpVersionAndCredit.js");

describe("bump", () => {
  it("increments the middle version for default update path", () => {
    expect(bump("1.2", false)).toBe("1.3.0");
  });

  it("resets invalid versions before bumping", () => {
    expect(bump("not-a-version", true)).toBe("1.0.0");
  });
});

describe("resolveIntent", () => {
  it("prefers front matter update_intent", () => {
    expect(resolveIntent({ update_intent: "new_version" }, "major_update")).toBe("new_version");
  });

  it("falls back to label intent", () => {
    expect(resolveIntent({}, "major_update")).toBe("major_update");
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

  it("queues acknowledgments for major update contributions", () => {
    const base = {
      version: "0.3",
      acknowledgments: [{ user: "alice", note: "Thanks", since_version: "0.2" }]
    };

    const { data } = applyContribution(base, { intent: "major_update", user: "carol" });

    expect(data.version).toBe("0.4.0");
    expect(data.release_notes[0]).toBe("Contribution by @carol (major_update).");
    expect(data.acknowledgments).toHaveLength(2);
    expect(data.acknowledgments[1]).toEqual({
      user: "carol",
      note: "Major contribution",
      since_version: "0.4.0"
    });
    expect(base.acknowledgments).toHaveLength(1);
  });

  it("increments the patch digit for minor updates", () => {
    const base = { version: "2.3.4" };
    const { data } = applyContribution(base, { intent: "minor_update", user: "dana" });
    expect(data.version).toBe("2.3.5");
  });
});
