import { test, expect } from '@playwright/test';
import { setupFreshApp } from './helpers';

test.describe('Settings Page', () => {
  test('can navigate to settings and see settings content', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Navigate to settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForTimeout(300);

    // Settings page should be visible
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Should have key settings sections
    await expect(page.getByText(/notification|reminder/i).first()).toBeVisible();
    await expect(page.getByText(/export|data/i).first()).toBeVisible();
  });

  test('shows app version', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForTimeout(300);

    // Version should be displayed as "Version X.Y.Z"
    await expect(page.getByText(/Version \d+\.\d+/i)).toBeVisible();
  });
});
