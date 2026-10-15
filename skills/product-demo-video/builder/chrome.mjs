// Which Chromium to drive. Playwright's own browser if it is installed for this Playwright version;
// otherwise the newest Chromium already in the Playwright cache (saves a download).
import { existsSync, readdirSync } from "node:fs";
import { chromium } from "playwright";
import { homedir } from "node:os";

function pick() {
  try { if (existsSync(chromium.executablePath())) return undefined; } catch {}
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || `${homedir()}/Library/Caches/ms-playwright`;
  const dirs = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split("-")[1] - +a.split("-")[1]) : [];
  for (const d of dirs) {
    for (const rel of [
      "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      "chrome-linux/chrome",
    ]) if (existsSync(`${cache}/${d}/${rel}`)) return `${cache}/${d}/${rel}`;
  }
  return undefined; // let Playwright complain with its install hint
}
export const executablePath = pick();
