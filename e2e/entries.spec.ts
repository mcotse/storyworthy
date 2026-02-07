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
    await expect(page.getByText('This is my storyworthy moment').first()).toBeVisible();
  });

  test('entry form displays with textarea', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Create Entry' }).click();
    // Entry form should be visible with a textarea
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('shows entry card with edit button after creation', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Create an entry first
    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('Expandable entry content');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Entry should be visible as a card
    const card = page.locator('article').first();
    await expect(card).toBeVisible();

    // Edit button should be visible on the card
    await expect(page.getByRole('button', { name: /edit/i }).first()).toBeVisible();
  });

  test('can expand and collapse entry card on History page', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Create an entry first
    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('Entry for expand collapse test');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Navigate to History page where EntryCard has expand/collapse
    await page.getByRole('button', { name: 'History' }).click();
    await page.waitForTimeout(300);

    // Entry card should be visible but collapsed (no edit button visible)
    const card = page.locator('article').first();
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: 'Edit entry' })).not.toBeVisible();

    // Click to expand the card
    await card.click();
    await page.waitForTimeout(300);

    // Edit button should now be visible (expanded state)
    await expect(card.getByRole('button', { name: 'Edit entry' })).toBeVisible();

    // Click again to collapse
    await card.click();
    await page.waitForTimeout(300);

    // Edit button should be hidden again (collapsed state)
    await expect(card.getByRole('button', { name: 'Edit entry' })).not.toBeVisible();
  });

  test('can edit an existing entry', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    // Create an entry
    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('Original content here');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(800);

    // Click the edit button on the first card
    const card = page.locator('article').first();
    const editButton = card.getByRole('button', { name: 'Edit entry' });
    await editButton.waitFor({ state: 'visible' });
    await editButton.evaluate((el) => (el as HTMLButtonElement).click());
    await page.waitForTimeout(800);

    // Wait for the form to appear
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.clear();
    await textarea.fill('Updated content now');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(800);

    // Verify update
    await expect(page.getByText('Updated content now').first()).toBeVisible();
  });

  test('entry shows Today date', async ({ page }) => {
    await page.goto('/');
    await setupFreshApp(page);

    await page.getByRole('button', { name: 'Create Entry' }).click();
    await page.locator('textarea').first().fill('Entry with date');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    // Should show "Today" for today's entry in the entry card
    await expect(page.locator('article').first().getByText('Today')).toBeVisible();
  });
});
