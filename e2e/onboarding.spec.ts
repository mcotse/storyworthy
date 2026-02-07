import { test, expect } from '@playwright/test';
import { clearAppData } from './helpers';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppData(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('shows onboarding on first visit', async ({ page }) => {
    await expect(page.getByText('Welcome to Storyworthy')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  test('can navigate through onboarding pages', async ({ page }) => {
    // Page 1
    await expect(page.getByText('Welcome to Storyworthy')).toBeVisible();

    // Go to page 2
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(300);

    // Go to page 3 (notification step has two btn-primary buttons; the action button is last)
    await page.locator('button.btn-primary').last().click();
    await page.waitForTimeout(300);

    // Last page should have a completion button
    await expect(page.getByRole('button', { name: /Create|Get Started|Start/i })).toBeVisible();
  });

  test('skip button exits onboarding', async ({ page }) => {
    await page.getByRole('button', { name: 'Skip' }).click();
    // Should be on home page with Create Entry button visible (empty state)
    await expect(page.getByRole('button', { name: 'Create Entry' })).toBeVisible();
  });

  test('onboarding does not show on subsequent visits', async ({ page }) => {
    // Complete onboarding
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.getByRole('button', { name: 'Create Entry' })).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on home, not onboarding
    await expect(page.getByRole('button', { name: 'Create Entry' })).toBeVisible();
    await expect(page.getByText('Welcome to Storyworthy')).not.toBeVisible();
  });
});
