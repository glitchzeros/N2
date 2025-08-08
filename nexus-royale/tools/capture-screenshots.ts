import { chromium, Browser, Page } from 'playwright';

async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function ensureReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('#app', { timeout: 15000 });
  // Wait a short moment to allow bootstrap to render UI
  await delay(1500);
}

async function clickIfVisible(page: Page, text: string) {
  const btn = page.locator(`button:has-text("${text}")`).first();
  if (await btn.count()) {
    try {
      await btn.click({ trial: false, timeout: 1000 });
    } catch { /* ignore */ }
  }
}

async function main() {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await ensureReady(page);

  // Hide HUD if supported (as per README flag), to capture clean visuals
  // but keep default for now; we can pass flags via BASE_URL if needed.

  // Try firing a weapon, show stats, etc. to get different states
  await page.screenshot({ path: 'screenshots/01_boot.png', fullPage: true });

  await clickIfVisible(page, 'Fire Weapon');
  await delay(500);
  await page.screenshot({ path: 'screenshots/02_fire.png', fullPage: true });

  await clickIfVisible(page, 'Show Stats');
  await delay(300);
  await page.screenshot({ path: 'screenshots/03_stats.png', fullPage: true });

  await clickIfVisible(page, 'Spawn AI');
  await delay(500);
  await page.screenshot({ path: 'screenshots/04_spawn_ai.png', fullPage: true });

  await clickIfVisible(page, 'Fire Projectile');
  await delay(500);
  await page.screenshot({ path: 'screenshots/05_projectile.png', fullPage: true });

  await clickIfVisible(page, 'Show Renderer');
  await delay(300);
  await page.screenshot({ path: 'screenshots/06_renderer.png', fullPage: true });

  await browser.close();
  console.log('Screenshots saved to ./screenshots');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});