import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json';

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

test.describe('API Mocking Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://conduit.bondaracademy.com/');
    await page.waitForTimeout(500);

    await page.getByText('Sign in').click();
    await page.getByRole('textbox', { name: 'Email' }).fill('pwtest155@test.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123456');
    await page.getByRole('button', { name: 'Sign in' }).click();
  });

  test('should display mocked API data correctly', async ({ page }) => {
    // Set up API mocks before interaction
    await setupApiMocks(page);

    // Verify the page header is correct
    await expect(page.locator('.navbar-brand'), 
      'Page header should display the application name').toContainText('conduit');
    
    // Verify that our mocked article data appears correctly
    await expect(page.locator('app-article-list h1').first(), 
      'Article title should match our mocked data').toContainText('Mocked Title');
    await expect(page.locator('app-article-list p').first(), 
      'Article description should match our mocked data').toContainText('Mocked Description');
  });

test('delete article', async ({ page }) => {
  const apiContext = await request.newContext();
  await apiContext.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      user: {email: "pwtest155@test.com", password: "123456"}
    }
  }).then(async (response) => {
    const token = await response.json();
    await page.addInitScript(token => {
      window.localStorage.setItem('jwt', token.user.token);
    }, token);
    const articleResponse = await apiContext.post('https://conduit-api.bondaracademy.com/api/articles/', {
      data:{
        "article":{"title":"This is a test title","description":"This is a test description","body":"This is a test body","tagList":[]}
      },
      headers: {
        'Authorization': `Token ${token.user.token}`
      }
    })
    expect(articleResponse.ok());

    await page.getByText('Global Feed').click();
    await expect(page.locator('.navbar-brand'), 'Page header should display the application name').toContainText('conduit');
    await expect(page.locator('app-article-list h1').first()).toContainText('This is a test title');
    await expect(page.locator('app-article-list p').first()).toContainText('This is a test description');
    await page.getByText('This is a test title').click();
    await page.getByRole('button', { name: 'Delete Article' }).first().click();
    await page.getByText('Global Feed').click();
    await expect(page.locator('app-article-list h1').first()).not.toContainText('This is a test title');
  });
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
  await page.route('**/api/tags', async (route) => {
    try {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(tags),
      });
    } catch (error) {
      console.error('Error mocking tags API:', error);
      await route.continue();
    }
  });
}

/**
 * Mock the articles API response
 */
async function mockArticlesApi(page) {
  await page.route('**/api/articles**', async (route) => {
    try {
      const response = await route.fetch();
      const responseBody = await response.json() as ArticlesResponse;
      
      // Modify the response data
      responseBody.articles[0].title = 'Mocked Title';
      responseBody.articles[0].description = 'Mocked Description';
      
      await route.fulfill({
        status: 200,
        body: JSON.stringify(responseBody),
      });
    } catch (error) {
      console.error('Error mocking articles API:', error);
      await route.continue();
    }
  });
}