import { test, expect } from '@playwright/test';
import { setupFreshApp } from './helpers';

test.describe('Search Functionality', () => {
  test('search button exists and can be opened', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Create an entry so we're past the empty state
    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('Test entry about hiking');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Search button should exist
    const searchButton = page.getByRole('button', { name: 'Search entries' });
    await expect(searchButton).toBeVisible();

    // Click to open search
    await searchButton.click();
    await page.waitForTimeout(300);

    // Search input should now be visible
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill('hiking');
    await page.waitForTimeout(500);

    // Results count should appear
    await expect(page.getByText(/\d+ entr/)).toBeVisible();
  });
});
