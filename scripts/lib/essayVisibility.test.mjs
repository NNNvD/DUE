import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isEssayHidden, isEssayPublic } = require("./essayVisibility.js");

describe("essayVisibility", () => {
  it("treats visibility:hidden essays as hidden", () => {
    expect(isEssayHidden({ visibility: "hidden" })).toBe(true);
  });

  it("treats listed:false essays as hidden", () => {
    expect(isEssayHidden({ listed: false })).toBe(true);
  });

  it("leaves normal essays public", () => {
    expect(isEssayPublic({ title: "Visible essay" })).toBe(true);
  });
});
