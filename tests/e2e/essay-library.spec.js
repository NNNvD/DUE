const { test, expect } = require("@playwright/test");

test.describe("essay library", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/DUE/essays/");
    await expect(page.locator("[data-search-interactive]")).toBeVisible();
  });

  test("uses the revised library language", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Essay library" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Filter and search essays and drafts" })).toBeVisible();
  });

  test("lists published essays before drafts", async ({ page }) => {
    const cards = page.locator("[data-search-results] > .list-card");
    await expect(cards.first()).toBeVisible();

    const statuses = await cards.evaluateAll((nodes) => nodes.map((node) => node.dataset.status));
    const firstDraft = statuses.findIndex((status) => status === "draft" || status === "proposed");
    if (firstDraft !== -1) {
      expect(statuses.slice(firstDraft).every((status) => status === "draft" || status === "proposed")).toBeTruthy();
    }
  });

  test("switches between compact and preview views", async ({ page }) => {
    const results = page.locator("[data-search-results]");
    const previewButton = page.getByRole("button", { name: "Preview" });
    const compactButton = page.getByRole("button", { name: "Compact" });

    await expect(results).toHaveAttribute("data-view", "compact");
    await previewButton.click();
    await expect(results).toHaveAttribute("data-view", "preview");
    await expect(page.locator(".list-card__preview").first()).toBeVisible();

    await compactButton.click();
    await expect(results).toHaveAttribute("data-view", "compact");
    await expect(page.locator(".list-card__preview").first()).toBeHidden();
  });

  test("shows the draft countdown only as a pill", async ({ page }) => {
    const draftCard = page.locator("[data-search-results] > .list-card[data-status='draft'], [data-search-results] > .list-card[data-status='proposed']").first();
    await expect(draftCard).toBeVisible();
    await expect(draftCard.locator(".deadline-badge")).toBeVisible();
    await expect(draftCard.locator(".countdown")).toHaveCount(0);
  });

  test("filters by language and labels Dutch essays as Nederlands", async ({ page }) => {
    const languageGroup = page.locator("[data-filter-language-group]");
    await expect(languageGroup.getByText("English", { exact: true })).toBeVisible();
    await expect(languageGroup.getByText("Nederlands", { exact: true })).toBeVisible();

    const dutchCard = page.locator('[data-search-results] > .list-card[data-language="nl"]');
    await expect(dutchCard).toHaveCount(1);
    await expect(dutchCard.getByText("Nederlands", { exact: true })).toBeVisible();

    await languageGroup.locator('input[value="nl"]').check();
    await expect(dutchCard).toBeVisible();
    await expect(page.locator('[data-search-results] > .list-card[data-language="en"]:visible')).toHaveCount(0);
    await expect(page.locator("[data-result-count]")).toContainText("1 essay found");
  });
});

test.describe("essay language details", () => {
  test("shows language in an essay details sidebar", async ({ page }) => {
    await page.goto("/DUE/essays/published/why-we-academics-should-stop-writing-papers/");
    await expect(page.locator(".essay-sidebar .essay-property-list")).toContainText("Language");
    await expect(page.locator(".essay-sidebar .essay-property-list")).toContainText("English");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
