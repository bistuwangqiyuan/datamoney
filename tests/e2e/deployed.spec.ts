import { test, expect } from '@playwright/test';

test.describe('Deployed Netlify site', () => {
  test('home page loads and shows DataMoney', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('DataMoney');
    await expect(page.getByRole('link', { name: /立即注册/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /开始交易/ })).toBeVisible();
  });

  test('login page loads with form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /登录/ })).toBeVisible();
    await expect(page.getByPlaceholder(/邮箱|email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/密码/)).toBeVisible();
    await expect(page.getByRole('main').getByRole('button', { name: /登录/ })).toBeVisible();
  });

  test('register page loads with form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /注册/ })).toBeVisible();
    await expect(page.getByPlaceholder(/邮箱|email/i)).toBeVisible();
    await expect(page.getByRole('main').getByRole('button', { name: /注册/ })).toBeVisible();
  });

  test('trade page loads (may show login prompt or trade UI)', async ({ page }) => {
    await page.goto('/trade');
    await page.waitForLoadState('networkidle');
    const tradeOrLogin = page.getByText(/下单交易|请先登录|我的资产/).first();
    await expect(tradeOrLogin).toBeVisible();
  });

  test('navigation from home to login and register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /立即注册/ }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /注册/ })).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: /开始交易/ }).click();
    await expect(page).toHaveURL(/\/trade/);
  });
});
