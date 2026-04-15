const { test, expect } = require("@playwright/test");

const homePath = "/DUE/";
const publishedEssayPath = "/DUE/essays/published/a-short-defense-of-imperfect-publishing/";
const historyPath = "/DUE/essays/published/a-short-defense-of-imperfect-publishing/history/";

test.describe("metadata and normalization", () => {
  test("home page canonical should include the GitHub Pages path prefix", async ({ page }) => {
    await page.goto(homePath);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:8080/DUE/");
  });

  test("published essay document title should use the essay title", async ({ page }) => {
    await page.goto(publishedEssayPath);

    await expect(page).toHaveTitle("A Short Defense of Imperfect Publishing");
  });

  test("published essay JSON-LD should point at the essay URL", async ({ page }) => {
    await page.goto(publishedEssayPath);

    const payload = await page.locator('script[type="application/ld+json"]').textContent();
    const parsed = JSON.parse(payload || "{}");

    expect(parsed.headline).toBe("A Short Defense of Imperfect Publishing");
    expect(parsed.url).toBe("http://localhost:8080/DUE/essays/published/a-short-defense-of-imperfect-publishing/");
    expect(parsed.mainEntityOfPage).toBe("http://localhost:8080/DUE/essays/published/a-short-defense-of-imperfect-publishing/");
  });

  test("comment form essayUrl should be normalized", async ({ page }) => {
    await page.goto(publishedEssayPath);

    const essayUrl = await page.locator('input[name="essayUrl"]').inputValue();

    expect(essayUrl).toBe("http://localhost:8080/DUE/essays/published/a-short-defense-of-imperfect-publishing/");
  });

  test("version history page should use plain metadata without broken article schema", async ({ page }) => {
    await page.goto(historyPath);

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Browse every published snapshot and release note for A Short Defense of Imperfect Publishing."
    );
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });
});
