import { describe, expect, it } from "vitest";

import {
  authorIdentity,
  collectUniqueAuthorIdentities,
  entryTaxonomyTerms,
  formatAuthorName,
} from "../../site/assets/search-utils.mjs";

describe("search utils", () => {
  it("normalizes equivalent author identities into one filter option", () => {
    const identities = collectUniqueAuthorIdentities([
      "noahvandongen",
      "Noah van Dongen",
      "@noahvandongen",
    ]);

    expect(identities).toHaveLength(1);
    expect(identities[0]).toEqual({
      key: "noahvandongen",
      label: "Noah van Dongen",
      raw: "noahvandongen",
    });
  });

  it("formats handle-style author names for display", () => {
    expect(formatAuthorName("lorem-boundary-tester")).toBe("Lorem Boundary Tester");
    expect(formatAuthorName("Noah van Dongen")).toBe("Noah van Dongen");
  });

  it("returns keywords when no themes are present", () => {
    expect(entryTaxonomyTerms({
      themes: [],
      keywords: ["deadlines", "revision"],
    })).toEqual(["deadlines", "revision"]);
  });

  it("combines keywords and explicit themes without duplicates", () => {
    expect(entryTaxonomyTerms({
      themes: ["publishing", "revision"],
      keywords: ["deadlines", "revision"],
    })).toEqual(["deadlines", "revision", "publishing"]);
  });

  it("falls back to the legacy topic when no keywords exist yet", () => {
    expect(entryTaxonomyTerms({
      topic: "Why deadlines matter",
      themes: [],
      keywords: [],
    })).toEqual(["Why deadlines matter"]);
  });

  it("returns a stable key for author matching", () => {
    expect(authorIdentity("Noah van Dongen")).toMatchObject({
      key: "noahvandongen",
      label: "Noah van Dongen",
    });
  });
});
