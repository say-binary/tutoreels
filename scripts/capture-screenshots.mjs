// One-off screenshot capture script for README.
// Usage:
//   1. npm run dev   (in another terminal)
//   2. npm install --no-save puppeteer
//   3. node scripts/capture-screenshots.mjs
import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("docs/images");
await mkdir(OUT, { recursive: true });

const BASE = "http://localhost:3000";
const VIEWPORT = { width: 1600, height: 900, deviceScaleFactor: 2 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--disable-gpu", "--hide-scrollbars", "--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport(VIEWPORT);

async function waitBoot() {
  await page.waitForFunction(() => !!document.querySelector("button"), { timeout: 15_000 });
  await sleep(800);
}

async function clickText(text) {
  await page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent && b.textContent.trim() === t
    );
    if (btn) btn.click();
  }, text);
}

async function clickTitle(title) {
  await page.evaluate((t) => {
    const btn = document.querySelector(`button[title="${t}"]`);
    if (btn) btn.click();
  }, title);
}

async function loadDemoAndWait(name, waitMs) {
  await clickText(name);
  await sleep(waitMs);
}

// 1. Login screen
await page.goto(BASE, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.removeItem("tutoreels_user"));
await page.reload({ waitUntil: "networkidle0" });
await waitBoot();
await page.screenshot({ path: path.join(OUT, "01-login.png") });
console.log("✓ login");

// 2. Logged-in empty home
await page.type('input[type="tel"]', "9876543210");
await clickText("Continue");
await sleep(900);
await page.screenshot({ path: path.join(OUT, "02-home.png") });
console.log("✓ home");

// 3. Multi-Agent mid-animation (24s in — late enough for all shapes to appear)
await loadDemoAndWait("Multi-Agent", 24_000);
await clickTitle("Pause");
await sleep(400);
await page.screenshot({ path: path.join(OUT, "03-multi-agent.png") });
console.log("✓ multi-agent");

// 4. Tokenization mid-animation
await loadDemoAndWait("Tokenization", 16_000);
await clickTitle("Pause");
await sleep(400);
await page.screenshot({ path: path.join(OUT, "04-tokenization.png") });
console.log("✓ tokenization");

// 5. Embedding demo — great visual with matrix
await loadDemoAndWait("Embedding", 18_000);
await clickTitle("Pause");
await sleep(400);
await page.screenshot({ path: path.join(OUT, "05-embedding.png") });
console.log("✓ embedding");

// 6. Edit mode on Multi-Agent (rich canvas)
await loadDemoAndWait("Multi-Agent", 20_000);
await clickTitle("Pause");
await sleep(400);
await clickText("Edit");
await sleep(700);
await page.screenshot({ path: path.join(OUT, "06-edit-mode.png") });
console.log("✓ edit-mode");

// 7. Account menu open over a rich canvas
await clickText("Exit");
await sleep(500);
await page.evaluate(() => {
  const btn = document.querySelector('button[title="Account menu"]');
  if (btn) btn.click();
});
await sleep(350);
await page.screenshot({ path: path.join(OUT, "07-account-menu.png") });
console.log("✓ account-menu");

await browser.close();
console.log("\nAll screenshots saved to", OUT);
