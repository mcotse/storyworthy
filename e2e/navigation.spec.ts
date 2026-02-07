import { test, expect } from '@playwright/test';
import { setupFreshApp } from './helpers';

test.describe('Navigation', () => {
  test('navigation bar has all tabs', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    const nav = page.locator('nav');
    await expect(nav.getByRole('button', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Calendar' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'History' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Trends' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('can navigate to Calendar page', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Calendar' }).click();
    // Calendar should show month navigation
    await expect(page.locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/')).toBeVisible();
  });

  test('can navigate to Trends page', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Trends' }).click();
    await expect(page.getByRole('heading', { name: 'Not enough data yet' })).toBeVisible();
  });

  test('can navigate to History page', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'History' }).click();
    // History page shows either entries or empty state
    await expect(page.getByText(/No memories yet|entr/i).first()).toBeVisible();
  });

  test('can navigate to Settings page', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('can navigate back to Home from Settings', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Go to Settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Go back to Home
    await page.getByRole('button', { name: 'Home' }).click();
    // Home page should show empty state with Create Entry button
    await expect(page.getByRole('button', { name: 'Create Entry' })).toBeVisible();
  });

  test('active tab is highlighted', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Wait for nav to be visible
    await expect(page.locator('nav')).toBeVisible();

    // Home should be active by default - check for active class
    const homeButton = page.getByRole('button', { name: 'Home' });
    await expect(homeButton).toHaveClass(/active/);

    // Navigate to Calendar
    await page.getByRole('button', { name: 'Calendar' }).click();
    const calendarButton = page.getByRole('button', { name: 'Calendar' });
    await expect(calendarButton).toHaveClass(/active/);
  });
});
