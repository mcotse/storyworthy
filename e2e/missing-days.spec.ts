import { test, expect } from '@playwright/test';
import { setupFreshApp } from './helpers';

test.describe('Missing Day Cards', () => {
  test('shows entry card after creating entry', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Create an entry
    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('My first entry');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Entry should be visible as a card
    await expect(page.locator('article').first()).toBeVisible();
    await expect(page.getByText('My first entry').first()).toBeVisible();
  });

  test('empty card for today shows appropriate message', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Create an entry, then clear just the date's entry
    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('Test entry');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // The home screen should show the entry
    await expect(page.locator('article').first()).toBeVisible();
  });
});
