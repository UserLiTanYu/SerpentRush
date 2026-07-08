import { chromium } from "playwright-core";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const SCREENSHOT_DIR = path.join(projectRoot, "assets");
const GAME_URL = process.env.SCREENSHOT_URL || "http://localhost:5173";
const CHROME_PATH = process.env.CHROME_PATH || "C:/Users/litan/AppData/Local/Google/Chrome/Application/chrome.exe";
const VIEWPORT = {
  width: Number(process.env.SCREENSHOT_WIDTH || 1868),
  height: Number(process.env.SCREENSHOT_HEIGHT || 843),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Vite is still starting.
    }

    await sleep(300);
  }

  throw new Error(`Timed out waiting for dev server at ${url}`);
}

async function saveScreenshot(page, fileName) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, fileName),
    fullPage: false,
  });
}

async function takeScreenshots() {
  let viteProcess = null;
  let browser = null;

  try {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    console.log("Starting dev server...");
    viteProcess = exec("npm run dev", { cwd: projectRoot });
    await waitForServer(GAME_URL);

    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    };

    if (CHROME_PATH && fs.existsSync(CHROME_PATH)) {
      launchOptions.executablePath = CHROME_PATH;
    }

    browser = await chromium.launch(launchOptions);

    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: Number(process.env.SCREENSHOT_DPR || 1),
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    console.log(`Opening game at ${GAME_URL} (${VIEWPORT.width}x${VIEWPORT.height})...`);
    await page.goto(GAME_URL, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await sleep(500);

    console.log("Capturing start screen...");
    await saveScreenshot(page, "start-screen.png");

    console.log("Capturing gameplay screen...");
    await page.click("#startButton");
    await sleep(1500);
    await page.keyboard.press("ArrowDown");
    await sleep(400);
    await page.keyboard.press("ArrowRight");
    await sleep(800);
    await saveScreenshot(page, "gameplay-screen.png");

    console.log("Capturing result screen...");
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("ArrowRight");
      await sleep(80);
    }
    await sleep(800);
    await saveScreenshot(page, "result-screen.png");

    console.log("Capturing achievements screen...");
    const startBtn = await page.$("#startButton");
    if (startBtn) {
      await startBtn.click();
      await sleep(1000);
    }

    const achieveBtn = await page.$("#achieveBtn");
    if (achieveBtn) {
      await achieveBtn.click();
      await sleep(600);
    }
    await saveScreenshot(page, "achievements-screen.png");

    const closeAchieveBtn = await page.$("#closeAchieveButton");
    if (closeAchieveBtn) {
      await closeAchieveBtn.click();
      await sleep(400);
    }

    console.log("Capturing help screen...");
    const helpBtn = await page.$("#helpButton");
    if (helpBtn) {
      await helpBtn.click();
      await sleep(600);
    }
    await saveScreenshot(page, "help-screen.png");

    console.log("All screenshots saved.");
  } catch (error) {
    console.error("Screenshot capture failed:", error);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }

    if (viteProcess) {
      viteProcess.kill();
    }
  }
}

takeScreenshots();
