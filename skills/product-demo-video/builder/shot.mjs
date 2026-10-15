// Screenshot one builder category with every preview frozen at the given times.
//   node shot.mjs <category> 1,3,5     -> shots/<category>_<t>.png
// categories: format look pace opener blocks transitions captions background device cursor progress frame ending
import { chromium } from "playwright";
import { executablePath } from "./chrome.mjs";
import { mkdirSync } from "node:fs";
const [sec, times = "1,3,5"] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });
const b = await chromium.launch({ executablePath });
const p = await b.newPage({ viewport: { width: 1480, height: 1000 }, deviceScaleFactor: 1 });
const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 300)));
await p.goto("file://" + process.cwd() + "/index.html?static");
await p.waitForFunction(() => window.GALLERY_READY);
await p.addStyleTag({ content: "nav, aside, header { display: none !important; } .layout { grid-template-columns: 1fr !important; }" }); // keep the sticky bars out of the shots
for (const t of times.split(",")) {
  await p.evaluate((t) => renderAllAt(+t), t);
  await p.waitForTimeout(80);
  const el = await p.$(`section#cat-${sec}`);
  if (!el) { console.log("no section", sec); break; }
  await el.screenshot({ path: `shots/${sec}_${t}.png` });
  console.log(`shots/${sec}_${t}.png`);
}
if (errs.length) console.log("ERRORS:\n" + [...new Set(errs)].join("\n"));
await b.close();
