import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import fs from "node:fs";

function createValidator() {
  const schema = JSON.parse(fs.readFileSync("scripts/schema/essay-frontmatter.json", "utf8"));
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
  });
  return ajv.compile(schema);
}

function validDraft(overrides = {}) {
  return {
    title: "A draft",
    keywords: ["deadline"],
    topic: "",
    author: "Noah van Dongen",
    coauthors: [],
    acknowledgments: [],
    status: "proposed",
    initial_status: "unfinished",
    started_at: "2026-06-19",
    proposed_at: "2026-06-19",
    deadline_at: "2026-07-19",
    version: "0.1.0",
    word_range: "500-1000",
    word_count: 0,
    release_notes: [],
    ...overrides,
  };
}

describe("essay front matter schema", () => {
  it("accepts CMS drafts with an empty legacy topic", () => {
    const validate = createValidator();

    expect(validate(validDraft())).toBe(true);
  });

  it("rejects blank required lifecycle dates", () => {
    const validate = createValidator();

    expect(validate(validDraft({ started_at: "", deadline_at: "" }))).toBe(false);
    expect(validate.errors?.map((error) => error.instancePath)).toEqual(
      expect.arrayContaining(["/started_at", "/deadline_at"])
    );
  });
});
