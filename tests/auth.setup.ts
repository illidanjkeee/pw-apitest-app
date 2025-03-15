import { test as setup } from '@playwright/test';

const authFile = '.auth/user.json';

setup('Authentication Setup', async ({ page }) => {
    await page.goto('https://conduit.bondaracademy.com/');
    await page.waitForTimeout(500);
    await page.getByText('Sign in').click();
    await page.getByRole('textbox', { name: 'Email' }).fill('pwtest155@test.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123456');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForResponse('**/api/tags', { timeout: 2000 });

    await page.context().storageState({ path: authFile });
    console.log('Authentication state saved to', authFile);
})