import { test, expect } from '@playwright/test';
import { setupFreshApp } from './helpers';

test.describe('Entry Management', () => {
  test('shows empty state when no entries exist', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await expect(page.getByText('Start your first entry')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Entry' })).toBeVisible();
  });

  test('can create a new entry', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Click create entry
    await page.getByRole('button', { name: 'Create Entry' }).click();

    // Fill in the entry form
    const storyTextarea = page.locator('textarea').first();
    await storyTextarea.fill('This is my storyworthy moment for today');

    // Save the entry
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Should return to home with entry visible
    await expect(page.getByText('This is my storyworthy moment')).toBeVisible();
  });

  test('entry form displays with textarea', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Create Entry' }).click();
    // Entry form should be visible with a textarea
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('can expand and collapse entry card', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Create an entry first
    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('Expandable entry content');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Entry should be in collapsed state
    const card = page.locator('article').first();
    await card.click();

    // Should now show edit button (expanded state)
    await expect(page.getByRole('button', { name: /edit/i })).toBeVisible();

    // Click again to collapse
    await card.click();
  });

  test('can edit an existing entry', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Create an entry
    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('Original content');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Expand the card and click edit
    await page.locator('article').first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /edit/i }).click();
    await page.waitForTimeout(300);

    // Update the content
    const textarea = page.locator('textarea').first();
    await textarea.clear();
    await textarea.fill('Updated content');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Verify update
    await expect(page.getByText('Updated content')).toBeVisible();
  });

  test('entry shows Today date', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('Entry with date');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Should show "Today" for today's entry in the entry card
    await expect(page.locator('article').getByText('Today')).toBeVisible();
  });
});
