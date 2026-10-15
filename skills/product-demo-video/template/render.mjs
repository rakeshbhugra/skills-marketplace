// Render the whole video: seek render(t) frame by frame in headless Chrome, pipe JPEGs to ffmpeg.
//   node render.mjs [out/video.mp4] [fps] [from] [to]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { executablePath } from "./chrome.mjs";
import { mkdirSync } from "node:fs";
mkdirSync("stills", { recursive: true }); mkdirSync("out", { recursive: true });
const [out = "out/video-silent.mp4", fps = 30, from = 0, to] = process.argv.slice(2);
const b = await chromium.launch({ executablePath, args: ["--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("pageerror", (e) => console.log("pageerror:", e.message));
await p.goto(`http://localhost:${process.env.PORT || 8780}/index.html?render`);
await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
await p.evaluate(() => document.fonts.ready);
const end = to ? +to : await p.evaluate(() => TOTAL);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "medium", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
const n0 = Math.round(from * fps), n1 = Math.round(end * fps), t0 = Date.now();
for (let i = n0; i < n1; i++) {
  await p.evaluate((t) => render(t), i / fps);
  const buf = await p.screenshot({ type: "jpeg", quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % 150 === 0) console.log(`frame ${i}/${n1}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await b.close();
console.log("wrote", out);
