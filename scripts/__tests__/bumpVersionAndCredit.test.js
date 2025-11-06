const { describe, it, expect } = require("vitest");
const {
  bump,
  applyContribution
} = require("../bumpVersionAndCredit");

describe("bump", () => {
  it("increments the minor version for minor contributions", () => {
    expect(bump("1.2", false)).toBe("1.3");
  });

  it("resets invalid versions before bumping", () => {
    expect(bump("not-a-version", true)).toBe("1.0");
  });
});

describe("applyContribution", () => {
  it("adds release notes and promotes coauthors for major contributions", () => {
    const base = {
      version: "1.4",
      release_notes: ["Previous entry"],
      coauthors: ["alice"]
    };

    const { data } = applyContribution(base, { intent: "major", user: "bob" });

    expect(data.version).toBe("2.0");
    expect(data.release_notes[0]).toBe("Contribution by @bob (major).");
    expect(data.release_notes.slice(1)).toEqual(["Previous entry"]);
    expect(data.coauthors.sort()).toEqual(["alice", "bob"]);
    expect(base.coauthors).toEqual(["alice"]);
  });

  it("queues acknowledgments for minor contributions", () => {
    const base = {
      version: "0.3",
      acknowledgments: [{ user: "alice", note: "Thanks", since_version: "0.2" }]
    };

    const { data } = applyContribution(base, { intent: "minor", user: "carol" });

    expect(data.version).toBe("0.4");
    expect(data.release_notes[0]).toBe("Contribution by @carol (minor).");
    expect(data.acknowledgments).toHaveLength(2);
    expect(data.acknowledgments[1]).toEqual({
      user: "carol",
      note: "Minor contribution",
      since_version: "0.4"
    });
    expect(base.acknowledgments).toHaveLength(1);
  });
});
