import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = path.resolve(import.meta.dirname, "..");
const requireFromRoot = createRequire(path.join(ROOT, "package.json"));
const puppeteer = requireFromRoot("puppeteer-core");

const ORIGIN = process.env.SHOT_ORIGIN || "http://localhost:3000";
const OUT = path.join(ROOT, "public", "demo");
const SCENES = ["import", "review", "edit", "preview", "export"];

function findLocalBrowserExecutable() {
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    process.env.PROGRAMFILES && `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.PROGRAMFILES || ""}\\Microsoft\\Edge\\Application\\msedge.exe`,
    process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

fs.mkdirSync(OUT, { recursive: true });

const executablePath = findLocalBrowserExecutable();
if (!executablePath) {
  throw new Error("No local Chrome or Edge executable found.");
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--hide-scrollbars", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  for (const scene of SCENES) {
    await page.goto(`${ORIGIN}/dev/product-demo?scene=${scene}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.body && document.body.innerText.length > 0, { timeout: 15000 });
    if (scene === "import") {
      await page.waitForSelector('[role="dialog"]', { timeout: 20000 });
      await new Promise((resolve) => setTimeout(resolve, 600));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    const dest = path.join(OUT, `walkthrough-${scene}.jpg`);
    await page.screenshot({ path: dest, type: "jpeg", quality: 82 });
    console.log(`wrote ${dest}`);
  }
} finally {
  await browser.close();
}
