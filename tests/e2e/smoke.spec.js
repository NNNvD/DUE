const { test, expect } = require("@playwright/test");

const homePath = "/DUE/";
const essaysPath = "/DUE/essays/";
const publishedEssayPath = "/DUE/essays/published/a-short-defense-of-imperfect-publishing/";
const publishedEssayUrl = "http://localhost:8080/DUE/essays/published/a-short-defense-of-imperfect-publishing/";

test.describe("frontend smoke", () => {
  test("home page renders primary content and navigation", async ({ page }) => {
    await page.goto(homePath);

    await expect(page).toHaveTitle(/DUE/);
    await expect(page.getByRole("heading", { name: "Propose. Panic. Publish." })).toBeVisible();
    await expect(page.locator('link[rel="stylesheet"][href="/DUE/assets/style.css"]')).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Essays", exact: true })).toHaveAttribute("href", "/DUE/essays/");
  });

  test("essay library search narrows results client-side", async ({ page }) => {
    await page.goto(essaysPath);

    await expect(page.getByRole("heading", { name: "Filter and search every essay" })).toBeVisible();

    const results = page.locator("[data-search-results] article");
    await expect(results.first()).toBeVisible();

    await page.locator("[data-filter-search]").fill("imperfect publishing");

    await expect(results).toHaveCount(1);
    await expect(page.getByRole("link", { name: "A Short Defense of Imperfect Publishing" })).toBeVisible();
  });

  test("essay library cards show the correct published timing labels", async ({ page }) => {
    await page.goto(essaysPath);

    const searchInput = page.locator("[data-filter-search]");
    const results = page.locator("[data-search-results] article");

    await searchInput.fill("A Short Defense of Imperfect Publishing");
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText("Finished on time");

    await searchInput.fill("On Deadlines and Honesty");
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText("Unfinished on time");
  });

  test("essay library author filters deduplicate equivalent identities", async ({ page }) => {
    await page.goto(essaysPath);

    const noahOption = page
      .locator("[data-filter-author-group] .filter-option")
      .filter({ hasText: "Noah van Dongen" });

    await expect(noahOption).toHaveCount(1);
  });

  test("published essay share button copies the generated link", async ({ page }) => {
    await page.addInitScript(() => {
      window.__copiedText = null;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value) => {
            window.__copiedText = value;
          },
        },
      });
    });

    await page.goto(publishedEssayPath);
    await page.getByRole("button", { name: "Copy link" }).click();

    await expect(page.locator("[data-share-status]")).toHaveText("Link copied.");
    await expect.poll(() => page.evaluate(() => window.__copiedText)).toBe(publishedEssayUrl);
  });

  test("published essay comment form validates required fields", async ({ page }) => {
    await page.goto(publishedEssayPath);
    await page.getByRole("button", { name: "Send feedback" }).click();

    await expect(page.locator("[data-comment-status]")).toHaveText("Please fix the highlighted fields.");
    await expect(page.locator('[data-error-for="intent"]')).toHaveText("Choose Minor or Major so we can route your note.");
    await expect(page.locator('[data-error-for="name"]')).toHaveText("Add your name or handle so we can attribute credit.");
    await expect(page.locator('[data-error-for="comment"]')).toHaveText("Share a short note so we know what to change.");
  });

  test("published essay comment form can submit through the configured endpoint", async ({ page }) => {
    await page.route("**/api/submit-comment", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Thanks for sharing feedback. We will review it soon.",
        }),
      });
    });

    await page.goto(publishedEssayPath);
    await page.locator("#intent-minor").check();
    await page.locator("#comment-name").fill("Frontend smoke test");
    await page.locator("#comment-body").fill("This is a longer smoke-test comment to verify the frontend submission flow.");
    await page.getByRole("button", { name: "Send feedback" }).click();

    await expect(page.locator("[data-comment-status]")).toHaveText(
      "Thanks for sharing feedback. We will review it soon."
    );
    await expect(page.locator("#comment-name")).toHaveValue("");
    await expect(page.locator("#comment-body")).toHaveValue("");
  });
});
