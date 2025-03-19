import { test as setup, request } from "@playwright/test";
import user from "../.auth/user.json";
import fs from "fs";

// Path to the authentication file that stores user credentials
const authFile = ".auth/user.json";

// Setup test for authentication that runs before other tests
setup("Authentication Setup", async ({ page }) => {
  // Create a new API context for making HTTP requests
  const apiContext = await request.newContext();

  /**
   * Response from the login API endpoint
   * @type {APIResponse}
   * @property {Object} response.data - The response data
   * @property {Object} response.data.user - User information
   * @property {string} response.data.user.email - User's email
   * @property {string} response.data.user.token - JWT authentication token
   * @property {string} response.data.user.username - User's username
   * @property {string} response.data.user.bio - User's biography
   * @property {string} response.data.user.image - URL to user's profile image
   */
  // Make POST request to login endpoint with user credentials
  const loginResponse = await apiContext.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    {
      data: {
        user: { email: "pwtest155@test.com", password: "123456" },
      },
    },
  );

  // Extract the response data and get the authentication token
  const token = await loginResponse.json();

  // Update the user authentication file with the new token
  user.origins[0].localStorage[0].value = token.user.token;
  fs.writeFileSync(authFile, JSON.stringify(user));

  // Store the token in environment variables for later use
  process.env["ACCESS_TOKEN"] = token.user.token;
});
