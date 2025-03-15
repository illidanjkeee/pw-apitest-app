import { test as setup, request } from '@playwright/test';
import user from '../.auth/user.json';
import fs from 'fs';

const authFile = '.auth/user.json';

setup('Authentication Setup', async ({ page }) => {
    const apiContext = await request.newContext();
    const loginResponse = await apiContext.post('https://conduit-api.bondaracademy.com/api/users/login', {
        data: {
          user: {email: "pwtest155@test.com", password: "123456"}
        }
      });
    const token = await loginResponse.json();
    user.origins[0].localStorage[0].value = token.user.token;
    fs.writeFileSync(authFile, JSON.stringify(user));

    process.env['ACCESS_TOKEN'] = token.user.token;
})