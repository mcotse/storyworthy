import { Page } from '@playwright/test';

export async function clearAppData(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    return new Promise<void>((resolve) => {
      const deleteRequest = indexedDB.deleteDatabase('storyworthy');
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve();
      deleteRequest.onblocked = () => resolve();
    });
  });
}

export async function skipOnboarding(page: Page) {
  try {
    const skipButton = page.getByRole('button', { name: 'Skip' });
    await skipButton.waitFor({ state: 'visible', timeout: 3000 });
    await skipButton.click();
    await page.waitForTimeout(500);
  } catch {
    // Onboarding not visible, continue
  }
}

export async function setupFreshApp(page: Page) {
  await clearAppData(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await skipOnboarding(page);
}
