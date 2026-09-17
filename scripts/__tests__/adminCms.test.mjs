import { describe, expect, it } from "vitest";
import fs from "node:fs";
import vm from "node:vm";

function loadAdminCmsHelpers(overrides = {}) {
  const source = fs.readFileSync("admin/cms.js", "utf8");
  const context = {
    window: {},
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    __helpers: null,
    ...overrides,
  };

  vm.createContext(context);
  vm.runInContext(
    `${source}\n__helpers = { resolveDraftDateDefaults, resolvePublicationDate, resolvePreSave, renameSaveButtons };`,
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

describe("admin CMS essay saves", () => {
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

  it("marks published CMS saves for version processing", () => {
    const { resolvePreSave } = loadAdminCmsHelpers();
    const entry = new Entry({
      status: "published",
      version: "1.0.0",
      update_pending: false,
    });

    const result = resolvePreSave(entry, new Date("2026-06-19T12:00:00Z"));

    expect(result.getIn(["data", "update_pending"])).toBe(true);
    expect(result.getIn(["data", "version"])).toBe("1.0.0");
  });

  it("does not mark draft saves as published updates", () => {
    const { resolvePreSave } = loadAdminCmsHelpers();
    const entry = new Entry({
      status: "draft",
      started_at: "2026-05-10",
      proposed_at: "2026-05-10",
      deadline_at: "2026-06-09",
      update_pending: false,
    });

    const result = resolvePreSave(entry, new Date("2026-06-19T12:00:00Z"));

    expect(result.getIn(["data", "update_pending"])).toBe(false);
  });

  it("renames a generic draft save button once", () => {
    let writes = 0;
    let value = "Save";
    const button = {};
    Object.defineProperty(button, "textContent", {
      get() {
        return value;
      },
      set(next) {
        writes += 1;
        value = next;
      },
    });

    const { renameSaveButtons } = loadAdminCmsHelpers({
      window: {
        location: {
          hash: "#/collections/drafts/entries/example",
          pathname: "/DUE/admin/",
        },
        addEventListener: () => {},
      },
      document: {
        querySelectorAll: (selector) => (selector === "button" ? [button] : []),
      },
    });

    renameSaveButtons();
    renameSaveButtons();

    expect(value).toBe("Save draft");
    expect(writes).toBe(1);
  });

  it("does not rewrite a save button when it already has the correct label", () => {
    let writes = 0;
    let value = "Save changes";
    const button = {};
    Object.defineProperty(button, "textContent", {
      get() {
        return value;
      },
      set(next) {
        writes += 1;
        value = next;
      },
    });

    const { renameSaveButtons } = loadAdminCmsHelpers({
      window: {
        location: {
          hash: "#/collections/published/entries/example",
          pathname: "/DUE/admin/",
        },
        addEventListener: () => {},
      },
      document: {
        querySelectorAll: (selector) => (selector === "button" ? [button] : []),
      },
    });

    renameSaveButtons();

    expect(value).toBe("Save changes");
    expect(writes).toBe(0);
  });
});
