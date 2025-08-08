import { chromium, Page } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'docs/screenshots';

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function capture() {
  await ensureDir(SCREENSHOT_DIR);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // 1. Main Menu / Lobby
  await page.goto(BASE_URL);
  await page.waitForSelector('h3'); // Wait for main UI
  await page.screenshot({ path: `${SCREENSHOT_DIR}/screenshot1.png` });

  // 2. In-Game Action (simulate start)
  // Click "Fire Weapon" to show in-game UI
  const fireButton = await page.$('button:text("Fire Weapon")');
  if (fireButton) {
    await fireButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/screenshot2.png` });
  }

  // 3. AI Bots (spawn AI)
  const aiButton = await page.$('button:text("Spawn AI")');
  if (aiButton) {
    await aiButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/screenshot3.png` });
  }

  // 4. Weapon Fire (fire projectile)
  const projectileButton = await page.$('button:text("Fire Projectile")');
  if (projectileButton) {
    await projectileButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/screenshot4.png` });
  }

  // 5. End Game (simulate by clicking "Show Stats" or similar)
  const statsButton = await page.$('button:text("Show Stats")');
  if (statsButton) {
    await statsButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/screenshot5.png` });
  }

  await browser.close();
  console.log('Screenshots saved to', SCREENSHOT_DIR);
}

capture();