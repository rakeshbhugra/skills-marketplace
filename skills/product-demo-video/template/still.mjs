// Stills for checking.  node still.mjs <stepId|full> <t1,t2,...>
//   stepId: renders that step alone at local times (seconds from the step's start)
//   full:   renders the whole video at global times
import { chromium } from "playwright";
import { executablePath } from "./chrome.mjs";
import { mkdirSync } from "node:fs";
mkdirSync("stills", { recursive: true }); mkdirSync("out", { recursive: true });
const [what, times] = process.argv.slice(2);
const b = await chromium.launch({ executablePath, args: ["--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = [];
p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.text().slice(0, 300)));
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
const url = `http://localhost:${process.env.PORT || 8780}/index.html?render${what === "full" ? "" : "&solo=" + what}`;
await p.goto(url);
await p.waitForFunction(() => window.READY, null, { timeout: 60000 }).catch(() => {});
await p.evaluate(() => document.fonts.ready);
for (const t of times.split(",")) {
  await p.evaluate(([w, t]) => (w === "full" ? render(+t) : renderSolo(+t)), [what, t]);
  await p.waitForTimeout(50);
  const f = `stills/${what}_${t}.png`;
  await p.screenshot({ path: f });
  console.log(f);
}
if (errs.length) console.log("CONSOLE:\n" + [...new Set(errs)].join("\n"));
await b.close();
