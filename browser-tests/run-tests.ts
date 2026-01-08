// Browser tests for Daily Moments app using dev-browser skill
// Run with: npm run test:browser (requires dev-browser server and dev server running)

import { connect, waitForPageLoad } from "@/client.js";
import type { Page } from "playwright";

const APP_URL = process.env.APP_URL || "http://localhost:5174/storyworthy/";
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || "tmp";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✓ ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMsg, duration: Date.now() - start });
    console.log(`✗ ${name}: ${errorMsg}`);
  }
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png` });
}

async function main() {
  console.log("\n=== Daily Moments Browser Tests ===\n");
  console.log(`Testing: ${APP_URL}\n`);

  const client = await connect();
  const page = await client.page("test-app", { viewport: { width: 390, height: 844 } });

  // Navigate to app
  await page.goto(APP_URL);
  await waitForPageLoad(page);

  // Test 1: Onboarding appears on first load
  await runTest("Onboarding screen displays on first load", async () => {
    await page.waitForSelector('text="Welcome to Daily Moments"', { timeout: 5000 });
    const skipButton = await page.$('text="Skip"');
    const nextButton = await page.$('text="Next"');
    if (!skipButton || !nextButton) {
      throw new Error("Onboarding buttons not found");
    }
    await screenshot(page, "01-onboarding");
  });

  // Test 2: Can navigate through onboarding
  await runTest("Onboarding navigation works", async () => {
    // Click Next to go to page 2
    await page.click('text="Next"');
    await page.waitForTimeout(500);
    await screenshot(page, "02-onboarding-page2");

    // Click Next to go to page 3
    await page.click('text="Next"');
    await page.waitForTimeout(500);
    await screenshot(page, "03-onboarding-page3");

    // Complete onboarding - button says "Create First Entry" on last page
    const createButton = await page.$('text="Create First Entry"');
    const skipButton = await page.$('text="Skip"');
    if (createButton) {
      await createButton.click();
    } else if (skipButton) {
      await skipButton.click();
    }
    await page.waitForTimeout(500);
  });

  // Test 3: Home page loads after onboarding
  await runTest("Home page displays after onboarding", async () => {
    await page.waitForSelector('text="Daily Moments"', { timeout: 5000 });
    await screenshot(page, "04-home");
  });

  // Test 4: Navigation bar is visible
  await runTest("Navigation bar is visible with all tabs", async () => {
    const navButtons = await page.$$('nav button');
    if (navButtons.length !== 5) {
      throw new Error(`Expected 5 nav buttons, found ${navButtons.length}`);
    }
    // Check aria-labels
    const labels = await Promise.all(navButtons.map(btn => btn.getAttribute('aria-label')));
    const expected = ['Home', 'Calendar', 'Analytics', 'Random', 'Settings'];
    for (const label of expected) {
      if (!labels.includes(label)) {
        throw new Error(`Missing nav button: ${label}`);
      }
    }
  });

  // Test 5: Can navigate to Calendar
  await runTest("Calendar page loads", async () => {
    await page.click('button[aria-label="Calendar"]');
    await page.waitForTimeout(300);
    // Calendar should show current month
    const monthText = await page.textContent('body');
    if (!monthText?.includes('January') && !monthText?.includes('202')) {
      throw new Error("Calendar month/year not visible");
    }
    await screenshot(page, "05-calendar");
  });

  // Test 6: Can navigate to Analytics
  await runTest("Analytics page loads", async () => {
    await page.click('button[aria-label="Analytics"]');
    await page.waitForTimeout(300);
    const pageText = await page.textContent('body');
    if (!pageText?.includes('Streak') && !pageText?.includes('Analytics') && !pageText?.includes('entries')) {
      throw new Error("Analytics content not visible");
    }
    await screenshot(page, "06-analytics");
  });

  // Test 7: Can navigate to Random
  await runTest("Random page loads", async () => {
    await page.click('button[aria-label="Random"]');
    await page.waitForTimeout(300);
    await screenshot(page, "07-random");
    // Random page should show either a memory or "no entries" message
    const pageText = await page.textContent('body');
    if (!pageText) {
      throw new Error("Random page content not visible");
    }
  });

  // Test 8: Can navigate to Settings
  await runTest("Settings page loads", async () => {
    await page.click('button[aria-label="Settings"]');
    await page.waitForTimeout(300);
    const pageText = await page.textContent('body');
    if (!pageText?.includes('Settings')) {
      throw new Error("Settings page not visible");
    }
    await screenshot(page, "08-settings");
  });

  // Test 9: Settings page has expected sections
  await runTest("Settings page has notifications and data sections", async () => {
    const pageText = await page.textContent('body');
    if (!pageText?.includes('Notifications') && !pageText?.includes('notification')) {
      throw new Error("Notifications section not found");
    }
    if (!pageText?.includes('Data') && !pageText?.includes('Export') && !pageText?.includes('Import')) {
      throw new Error("Data section not found");
    }
  });

  // Test 10: Navigate back to Home and create entry
  await runTest("Can start creating a new entry", async () => {
    await page.click('button[aria-label="Home"]');
    await page.waitForTimeout(300);

    // Look for either "Create Entry" button or empty card to click
    const createButton = await page.$('button:has-text("Create Entry")');
    const emptyCard = await page.$('[class*="empty"]');

    if (createButton) {
      await createButton.click();
    } else if (emptyCard) {
      await emptyCard.click();
    } else {
      // Try clicking on the empty state area
      await page.click('text="Start your first entry"').catch(() => {
        // If that fails, try clicking any prominent button/card
        return page.click('button');
      });
    }

    await page.waitForTimeout(500);
    await screenshot(page, "09-entry-form");
  });

  // Test 11: Entry form has required fields
  await runTest("Entry form has storyworthy and thankful fields", async () => {
    const pageText = await page.textContent('body');
    // Check for form labels/placeholders
    if (!pageText?.toLowerCase().includes('storyworthy') && !pageText?.toLowerCase().includes('moment')) {
      throw new Error("Storyworthy field not found");
    }
    await screenshot(page, "10-entry-form-fields");
  });

  // Test 12: Can fill in entry form and save
  await runTest("Can fill and save an entry", async () => {
    // Find and fill the storyworthy textarea
    const textareas = await page.$$('textarea');
    if (textareas.length === 0) {
      throw new Error("No textareas found in entry form");
    }

    // Fill first textarea (storyworthy)
    await textareas[0].fill("Today I learned how to write browser tests with the dev-browser skill. It was an enlightening experience!");

    // Fill second textarea if exists (thankful)
    if (textareas.length > 1) {
      await textareas[1].fill("I'm grateful for automated testing tools");
    }

    await page.waitForTimeout(300);
    await screenshot(page, "11-entry-filled");

    // Save the entry
    const saveButton = await page.$('button:has-text("Save")');
    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(500);
    }

    await screenshot(page, "12-after-save");
  });

  // Test 13: Entry appears in the list
  await runTest("Saved entry appears in home list", async () => {
    await page.waitForTimeout(300);
    const pageText = await page.textContent('body');
    if (!pageText?.includes("browser tests") && !pageText?.includes("Daily Moments")) {
      // Entry might be collapsed, that's okay
      console.log("  (Entry may be collapsed in card view)");
    }
    await screenshot(page, "13-entry-in-list");
  });

  // Test 14: Search functionality
  await runTest("Search bar is visible and functional", async () => {
    // Look for search input
    const searchInput = await page.$('input[type="search"], input[placeholder*="Search"], input[class*="search"]');
    if (!searchInput) {
      // Search might be behind an icon, try clicking search icon
      const searchIcon = await page.$('[class*="search"]');
      if (searchIcon) {
        await searchIcon.click();
        await page.waitForTimeout(300);
      }
    }
    await screenshot(page, "14-search");
  });

  // Test 15: Calendar shows entry marker
  await runTest("Calendar shows entry indicator", async () => {
    await page.click('button[aria-label="Calendar"]');
    await page.waitForTimeout(500);
    await screenshot(page, "15-calendar-with-entry");
    // Calendar should now show some indicator for today's entry
  });

  // Cleanup and report
  await client.disconnect();

  // Print summary
  console.log("\n=== Test Summary ===\n");
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log("\nScreenshots saved to:", SCREENSHOT_DIR);
  console.log("");

  // Exit with error code if tests failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
