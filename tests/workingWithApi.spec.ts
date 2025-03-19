import { test, expect, request } from "@playwright/test";
import tags from "../test-data/tags.json";

// Define types for better code understanding
interface Article {
  title: string;
  description: string;
  [key: string]: any;
}

interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

test.describe("API Mocking Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Enable verbose API logging
    page.on("request", (request) =>
      console.log(`>> ${request.method()} ${request.url()}`),
    );
    page.on("response", (response) =>
      console.log(`<< ${response.status()} ${response.url()}`),
    );

    await page.goto("https://conduit.bondaracademy.com/");
    await page.waitForTimeout(500);
  });

  test("should display mocked API data correctly", async ({ page }) => {
    console.log("Starting mock API test");
    await setupApiMocks(page);

    await expect(
      page.locator(".navbar-brand"),
      "Page header should display the application name",
    ).toContainText("conduit");

    console.log("Checking mocked article data");
    await expect(
      page.locator("app-article-list h1").first(),
      "Article title should match our mocked data",
    ).toContainText("Mocked Title");
    await expect(
      page.locator("app-article-list p").first(),
      "Article description should match our mocked data",
    ).toContainText("Mocked Description");
  });

  test("delete article", async ({ page }) => {
    console.log("Starting delete article test");
    const apiContext = await request.newContext();
    const articleResponse = await apiContext.post(
      "https://conduit-api.bondaracademy.com/api/articles/",
      {
        data: {
          article: {
            title: "This is a test title",
            description: "This is a test description",
            body: "This is a test body",
            tagList: [],
          },
        },
      },
    );
    console.log("Article creation response:", articleResponse.status());
    expect(articleResponse.ok());

    await page.getByText("Global Feed").click();

    // Debug snapshot
    await page.screenshot({ path: "debug-delete-article.png" });

    await expect(
      page.locator(".navbar-brand"),
      "Page header should display the application name",
    ).toContainText("conduit");
    await expect(page.locator("app-article-list h1").first()).toContainText(
      "This is a test title",
    );
    await expect(page.locator("app-article-list p").first()).toContainText(
      "This is a test description",
    );
    await page.getByText("This is a test title").click();
    await page.getByRole("button", { name: "Delete Article" }).first().click();
    await page.getByText("Global Feed").click();
    await expect(page.locator("app-article-list h1").first()).not.toContainText(
      "This is a test title",
    );
  });

  test("create and cleanup article", async ({ page }) => {
    console.log("Starting create and cleanup test");
    await page.getByText("New Article").click();

    // Add debug points for form filling
    console.log("Filling article form");
    await page
      .getByRole("textbox", { name: "Article Title" })
      .fill("This is a test title");
    await page
      .getByRole("textbox", { name: "What's this article about?" })
      .fill("This is a test description");
    await page
      .getByRole("textbox", { name: "Write your article (in markdown)" })
      .fill("This is a test body");

    // Take a screenshot before submitting
    await page.screenshot({ path: "debug-before-publish.png" });

    await page.getByRole("button", { name: "Publish Article" }).click();

    const articleResponse = await page.waitForResponse(
      "https://conduit-api.bondaracademy.com/api/articles/",
    );
    const articleResponseBody = await articleResponse.json();
    console.log("Article creation response:", articleResponseBody);
    expect(articleResponse.ok()).toBeTruthy();
    const slugId = articleResponseBody.article.slug;

    await expect(page.locator(".navbar-brand")).toContainText("conduit");
    await expect(page.locator("h1").first()).toContainText(
      "This is a test title",
    );
    await expect(page.locator("p").first()).toContainText(
      "This is a test body",
    );

    const apiContext = await request.newContext();
    const deleteResponse = await apiContext.delete(
      `https://conduit-api.bondaracademy.com/api/articles/${slugId}`,
    );
    console.log("Article deletion response:", deleteResponse.status());
    expect(deleteResponse.ok()).toBeTruthy();
  });
});

/**
 * Set up all API mocks needed for the test
 */
async function setupApiMocks(page) {
  await mockTagsApi(page);
  await mockArticlesApi(page);
}

/**
 * Mock the tags API response
 */
async function mockTagsApi(page) {
  await page.route("**/api/tags", async (route) => {
    try {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(tags),
      });
    } catch (error) {
      console.error("Error mocking tags API:", error);
      await route.continue();
    }
  });
}

/**
 * Mock the articles API response
 */
async function mockArticlesApi(page) {
  await page.route("**/api/articles**", async (route) => {
    try {
      const response = await route.fetch();
      const responseBody = (await response.json()) as ArticlesResponse;

      // Modify the response data
      responseBody.articles[0].title = "Mocked Title";
      responseBody.articles[0].description = "Mocked Description";

      await route.fulfill({
        status: 200,
        body: JSON.stringify(responseBody),
      });
    } catch (error) {
      console.error("Error mocking articles API:", error);
      await route.continue();
    }
  });
}
