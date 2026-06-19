import { describe, expect, it } from "vitest";
import fs from "node:fs";
import vm from "node:vm";

function loadAdminCmsHelpers() {
  const source = fs.readFileSync("admin/cms.js", "utf8");
  const context = {
    window: {},
    setInterval: () => 1,
    clearInterval: () => {},
    __helpers: null,
  };

  vm.createContext(context);
  vm.runInContext(
    `${source}\n__helpers = { resolveDraftDateDefaults, resolvePublicationDate };`,
    context
  );
  return context.__helpers;
}

class Entry {
  constructor(data) {
    this.data = data;
  }

  getIn(path) {
    return this.data[path[1]];
  }

  setIn(path, value) {
    return new Entry({
      ...this.data,
      [path[1]]: value,
    });
  }
}

describe("admin CMS draft dates", () => {
  it("fills blank draft dates before saving", () => {
    const { resolveDraftDateDefaults } = loadAdminCmsHelpers();
    const entry = new Entry({
      status: "proposed",
      started_at: "",
      proposed_at: "",
      deadline_at: "",
    });

    const result = resolveDraftDateDefaults(entry, new Date("2026-06-19T12:00:00Z"));

    expect(result.getIn(["data", "started_at"])).toBe("2026-06-19");
    expect(result.getIn(["data", "proposed_at"])).toBe("2026-06-19");
    expect(result.getIn(["data", "deadline_at"])).toBe("2026-07-19");
    expect(result.getIn(["data", "word_count"])).toBe(0);
  });

  it("keeps an existing started date and derives the missing deadline from it", () => {
    const { resolveDraftDateDefaults } = loadAdminCmsHelpers();
    const entry = new Entry({
      status: "draft",
      started_at: "2026-05-10",
      deadline_at: "",
    });

    const result = resolveDraftDateDefaults(entry, new Date("2026-06-19T12:00:00Z"));

    expect(result.getIn(["data", "started_at"])).toBe("2026-05-10");
    expect(result.getIn(["data", "proposed_at"])).toBe("2026-05-10");
    expect(result.getIn(["data", "deadline_at"])).toBe("2026-06-09");
  });

  it("does not alter published entries", () => {
    const { resolveDraftDateDefaults } = loadAdminCmsHelpers();
    const entry = new Entry({
      status: "published",
      started_at: "",
      deadline_at: "",
    });

    const result = resolveDraftDateDefaults(entry, new Date("2026-06-19T12:00:00Z"));

    expect(result).toBe(entry);
  });
});
