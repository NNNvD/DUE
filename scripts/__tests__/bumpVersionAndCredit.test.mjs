import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { bump, applyContribution, parseEnv, resolveIntent } = require("../bumpVersionAndCredit.js");

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
