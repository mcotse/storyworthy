import { test, expect } from '@playwright/test';
import { setupFreshApp } from './helpers';

test.describe('Navigation', () => {
  test('navigation bar has all tabs', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    const nav = page.locator('nav');
    await expect(nav.getByRole('button', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Calendar' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Analytics' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Random' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('can navigate to Calendar page', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Calendar' }).click();
    // Calendar should show month navigation
    await expect(page.locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/')).toBeVisible();
  });

  test('can navigate to Analytics page', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Analytics' }).click();
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  });

  test('can navigate to Random page', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Random' }).click();
    // Random page shows either a memory or empty state
    await expect(page.locator('main')).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Storyworthy' })).toBeVisible();
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
