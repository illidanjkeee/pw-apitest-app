import { test, expect } from "@playwright/test";

test.describe("API Testing Example", () => {
  test("GET request test", async ({ request }) => {
    // Make a GET request to a sample API endpoint
    const response = await request.get(
      "https://jsonplaceholder.typicode.com/posts/1",
    );

    // Assert the status code is 200
    expect(response.status()).toBe(200);

    // Parse the response body
    const responseBody = await response.json();

    // Assert the response contains expected data
    expect(responseBody).toHaveProperty("id", 1);
    expect(responseBody).toHaveProperty("title");
    expect(responseBody).toHaveProperty("body");
  });

  test("POST request test", async ({ request }) => {
    // Test data
    const postData = {
      title: "Test Post",
      body: "This is a test post",
      userId: 1,
    };

    // Make a POST request
    const response = await request.post(
      "https://jsonplaceholder.typicode.com/posts",
      {
        data: postData,
      },
    );

    // Assert the status code is 201 (Created)
    expect(response.status()).toBe(201);

    // Parse the response body
    const responseBody = await response.json();

    // Assert the response contains our posted data
    expect(responseBody).toHaveProperty("title", postData.title);
    expect(responseBody).toHaveProperty("body", postData.body);
    expect(responseBody).toHaveProperty("userId", postData.userId);
  });
});
