import { test, expect } from '@playwright/test';

test.describe('Trading sub-pages (logged-out state)', () => {
  test('/orders shows login prompt for guests', async ({ page }) => {
    await page.goto('/orders');
    await expect(
      page.getByRole('heading', { level: 1, name: /订单管理/ })
    ).toBeVisible();
    await expect(page.getByText(/请先登录查看订单/)).toBeVisible();
  });

  test('/trades shows login prompt for guests', async ({ page }) => {
    await page.goto('/trades');
    // The CardTitle inside TradeHistory also says "成交记录"; lock to the h1.
    await expect(
      page.getByRole('heading', { level: 1, name: /成交记录/ })
    ).toBeVisible();
    await expect(page.getByText(/请先登录查看成交记录/)).toBeVisible();
  });

  test('/assets shows login prompt for guests', async ({ page }) => {
    await page.goto('/assets');
    await expect(
      page.getByRole('heading', { level: 1, name: /资产管理/ })
    ).toBeVisible();
    await expect(page.getByText(/请先登录查看资产/)).toBeVisible();
  });
});

test.describe('Layout chrome', () => {
  test('header brand link returns to home from login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'DataMoney' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toContainText('DataMoney');
  });

  test('footer renders copyright and external partners', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toContainText(/DataMoney/);
    await expect(footer).toContainText(/Supabase/);
    await expect(footer).toContainText(/Binance/);
  });
});

test.describe('Error pages', () => {
  test('unknown route renders Next.js 404 page', async ({ page }) => {
    const response = await page.goto('/__definitely_not_a_real_route__');
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).toContainText(/404|not found|This page could not be found/i);
  });
});

test.describe('Register form validation', () => {
  test('rejects invalid email format inline', async ({ page }) => {
    await page.goto('/register');
    // Use an address that passes the browser's HTML5 type=email check
    // but fails our stricter regex (no TLD), so the submit handler runs.
    await page.getByPlaceholder(/邮箱|email/i).fill('user@example');
    await page.getByPlaceholder(/至少 8 位/).fill('Password123');
    await page.getByPlaceholder(/再次输入密码/).fill('Password123');
    await page.getByRole('main').getByRole('button', { name: /注册/ }).click();
    await expect(page.getByText(/请输入有效的邮箱地址/)).toBeVisible();
  });

  test('rejects mismatched passwords inline', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder(/邮箱|email/i).fill('valid@example.com');
    await page.getByPlaceholder(/至少 8 位/).fill('Password123');
    await page.getByPlaceholder(/再次输入密码/).fill('Different123');
    await page.getByRole('main').getByRole('button', { name: /注册/ }).click();
    await expect(page.getByText(/两次输入的密码不一致/)).toBeVisible();
  });
});

test.describe('Trade page market data UI', () => {
  test('price card mounts (placeholder or live data)', async ({ page }) => {
    await page.goto('/trade');
    await expect(page.getByRole('heading', { name: /交易中心/ })).toBeVisible();
    // Either the connecting placeholder or the live BTC/USDT card title must be visible.
    const card = page.getByText(/BTC\/USDT|连接行情数据中/).first();
    await expect(card).toBeVisible();
  });
});
