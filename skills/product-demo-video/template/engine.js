// Product video engine. render(t) draws the whole frame for time t (seconds) with no hidden state,
// so frames can be rendered in any order. Everything comes from timeline.json (built by vo.py from script.json).
//
// Step kinds:  intro | overview | node | scene | outro
//   node  = a 1600x900 card placed on a world the camera flies over (your steps/<id>.js)
//   scene = a full-screen 1920x1080 layer (your steps/<id>.js), e.g. a three.js moment
// Layouts:     "canvas"   = cards on an infinite canvas joined by glowing paths, overview shot, fly between them
//              "sequence" = cards in a row with no paths or labels; reads as full-screen scenes with a camera slide
import * as THREE from "three";
import { clamp, prog, lerp, ease, vis, io, rnd, S } from "./helpers.js";

const $ = (id) => document.getElementById(id);
const qs = new URLSearchParams(location.search);
const TL = await (await fetch("timeline.json", { cache: "no-store" })).json();
const STEPS = TL.steps;
const byId = Object.fromEntries(STEPS.map((s) => [s.id, s]));
const byKind = (k) => STEPS.find((s) => s.kind === k);
const NW = 1600, NH = 900, FLY = TL.fly ?? 1.6;
const CANVAS = (TL.layout ?? "canvas") === "canvas";
const NODES = STEPS.filter((s) => s.kind === "node");
const SCENES = STEPS.filter((s) => s.kind === "scene");

/* ---------------- layout: where each card sits ---------------- */
const COLS = TL.columns ?? 4, GX = 2000, GY = 1500;
const LAYOUT = {};
NODES.forEach((s, i) => {
  if (s.pos) { LAYOUT[s.id] = s.pos; return; }
  if (!CANVAS) { LAYOUT[s.id] = [i * 2400, 0]; return; }
  const row = Math.floor(i / COLS), c = i % COLS;
  LAYOUT[s.id] = [(row % 2 ? COLS - 1 - c : c) * GX, row * GY]; // snake: left to right, then right to left
});
const xs = NODES.map((s) => LAYOUT[s.id][0]), ys = NODES.map((s) => LAYOUT[s.id][1]);
const bounds = NODES.length ? { x0: Math.min(...xs) - 300, x1: Math.max(...xs) + NW + 300, y0: Math.min(...ys) - 250, y1: Math.max(...ys) + NH + 100 } : { x0: 0, x1: NW, y0: 0, y1: NH };
const OVER = { cx: (bounds.x0 + bounds.x1) / 2, cy: (bounds.y0 + bounds.y1) / 2, z: Math.min(1920 / (bounds.x1 - bounds.x0), 1080 / (bounds.y1 - bounds.y0)) * .97 };

/* ---------------- step modules ---------------- */
const placeholder = (id) => ({
  build(root) { root.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:64px;font-weight:800;background:#1d1220">${id}</div>`; },
  render() {},
});
const mods = {};
await Promise.all([...NODES, ...SCENES].map(async (s) => {
  try { mods[s.id] = (await import(`./steps/${s.id}.js?v=${Date.now()}`)).default; }
  catch (e) { console.warn("step missing or broken:", s.id, e.message); mods[s.id] = placeholder(s.id); }
}));
const makeCtx = (s, full) => {
  const vo = s.voStart - s.start;
  return { id: s.id, dur: s.dur, vo, voDur: s.voDur, line: s.line, at: (f) => vo + f * s.voDur, W: full ? 1920 : NW, H: full ? 1080 : NH, THREE, fly: s.kind === "node" ? FLY : 0 };
};

/* ---------------- the world (cards) ---------------- */
const world = $("world");
const nodes = {};
for (const [i, s] of NODES.entries()) {
  const [x, y] = LAYOUT[s.id];
  const el = document.createElement("div");
  el.className = "node"; el.style.left = x + "px"; el.style.top = y + "px";
  el.innerHTML = `${CANVAS && s.title ? `<div class="label"><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="t">${s.title}</span></div>` : ""}
    <div class="frame"><div class="root ui s-${s.id}" style="position:absolute;inset:0"></div></div><div class="glow"></div>`;
  world.appendChild(el);
  const ctx = makeCtx(s), root = el.querySelector(".root");
  try { await mods[s.id].build?.(root, ctx); } catch (e) { console.error("build", s.id, e); }
  nodes[s.id] = { el, root, ctx, s, x, y, i, glow: el.querySelector(".glow"), title: s.title ?? s.id };
}
const scenesEl = $("scenes");
const scenes = {};
for (const s of SCENES) {
  const root = document.createElement("div");
  root.className = `scene ui s-${s.id}`; scenesEl.appendChild(root);
  const ctx = makeCtx(s, true);
  try { await mods[s.id].build?.(root, ctx); } catch (e) { console.error("build", s.id, e); }
  scenes[s.id] = { root, ctx, s };
}

/* ---------------- connecting paths (canvas layout) ---------------- */
const OFF = 4000, NS = "http://www.w3.org/2000/svg";
const svg = $("paths");
svg.style.left = svg.style.top = -OFF + "px";
svg.setAttribute("width", bounds.x1 + OFF * 2); svg.setAttribute("height", bounds.y1 + OFF * 2);
svg.innerHTML = `<defs>
  <linearGradient id="g" x1="0" x2="1"><stop offset="0" style="stop-color:var(--glow-a, #8b8bff)"/><stop offset="1" style="stop-color:var(--glow-b, #c084fc)"/></linearGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
const P = (x, y) => `${x + OFF},${y + OFF}`;
function pathBetween(a, b) {
  const [ax, ay] = LAYOUT[a], [bx, by] = LAYOUT[b], my = NH / 2;
  if (ay === by && bx > ax) return `M${P(ax + NW, ay + my)} C${P(ax + NW + 240, ay + my)} ${P(bx - 240, by + my)} ${P(bx, by + my)}`;
  if (ay === by) return `M${P(ax, ay + my)} C${P(ax - 240, ay + my)} ${P(bx + NW + 240, by + my)} ${P(bx + NW, by + my)}`;
  const right = ax + NW / 2 > OVER.cx, side = right ? NW + 380 : -380, edge = right ? NW : 0; // loop round the outside
  return `M${P(ax + edge, ay + my)} C${P(ax + side, ay + my)} ${P(bx + side, by + my)} ${P(bx + edge, by + my)}`;
}
const links = [];
if (CANVAS) {
  const ids = NODES.map((s) => s.id);
  const pairs = ids.slice(0, -1).map((id, i) => [id, ids[i + 1]]);
  if (TL.loop && ids.length > 2) pairs.push([ids[ids.length - 1], ids[0]]);
  for (const [a, b] of pairs) {
    const d = pathBetween(a, b);
    const mk = (attrs) => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("fill", "none"); for (const k in attrs) p.setAttribute(k, attrs[k]); svg.appendChild(p); return p; };
    const base = mk({ "stroke-width": 8, "stroke-linecap": "round" });
    base.style.stroke = "var(--path-base, rgba(255,255,255,.14))";
    const flow = mk({ stroke: "url(#g)", "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": "36 64", filter: "url(#glow)" });
    const len = base.getTotalLength();
    base.setAttribute("stroke-dasharray", len);
    links.push({ a, b, base, flow, len });
  }
}
const comet = [];
for (let i = 0; i < 10 && CANVAS; i++) {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("r", 22 - i * 1.6); c.style.fill = i ? "var(--glow-a, #8b8bff)" : "#fff"; c.setAttribute("filter", "url(#glow)");
  svg.appendChild(c); comet.push(c);
}

/* ---------------- camera ---------------- */
function nodeCam(id, lt) {
  const n = nodes[id];
  let c = null;
  try { c = mods[id].cam?.(lt, n.ctx); } catch (e) { /* fall back to default */ }
  if (!c) {
    const w = lerp(1960, 1880, ease.inOut(prog(lt, FLY, n.s.dur)));
    c = { x: NW / 2 - w / 2, y: NH / 2 - (w * 9) / 32 + 60, w };
  }
  return { cx: n.x + c.x + c.w / 2, cy: n.y + c.y + (c.w * 9) / 32, z: 1920 / c.w };
}
function fly(a, b, x, dip, curve = ease.inOut) {
  const e = curve(clamp(x));
  return { cx: lerp(a.cx, b.cx, e), cy: lerp(a.cy, b.cy, e), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), e)) * (1 - dip * Math.sin(Math.PI * clamp(x))) };
}
const stepAt = (t) => STEPS.find((s) => t < s.start + s.dur) ?? STEPS[STEPS.length - 1];
const lastNodeBefore = (i) => { for (let k = i - 1; k >= 0; k--) if (STEPS[k].kind === "node") return STEPS[k]; return null; };
const firstCam = () => (CANVAS ? OVER : NODES.length ? nodeCam(NODES[0].id, 0) : OVER);
function camAt(t) {
  const s = stepAt(t), lt = t - s.start, i = STEPS.indexOf(s), prev = STEPS[i - 1];
  if (s.kind === "intro") return { ...firstCam(), z: firstCam().z * .3 };
  if (s.kind === "overview") return { ...OVER, z: Math.exp(lerp(Math.log(OVER.z * .3), Math.log(OVER.z), ease.inOut(prog(lt, 0.3, 3.0)))) };
  if (s.kind === "node") {
    const to = nodeCam(s.id, lt);
    if (lt >= FLY) return to;
    if (prev?.kind === "node" && s.transition === "zoom") {
      // zoom-through: dive into a point on the previous card, cut under a flash, pull out of the new card
      const pn = nodes[prev.id], nn = nodes[s.id], deep = 1920 / 240, half = FLY / 2;
      const [zx, zy] = s.zoomFrom ?? [NW / 2, NH / 2], [ix, iy] = s.zoomInto ?? [NW / 2, NH / 2];
      if (lt < half) return fly(nodeCam(prev.id, prev.dur), { cx: pn.x + zx, cy: pn.y + zy, z: deep }, lt / half, 0, (x) => x * x * x);
      return fly({ cx: nn.x + ix, cy: nn.y + iy, z: deep }, to, (lt - half) / half, 0, ease.out);
    }
    if (prev?.kind === "node") return fly(nodeCam(prev.id, prev.dur), to, lt / FLY, CANVAS ? .42 : .12);
    const ln = lastNodeBefore(i);
    const from = ln ? nodeCam(ln.id, ln.dur) : { ...to, z: to.z * (CANVAS ? 1 : .55) };
    return fly(CANVAS && !ln ? OVER : from, to, lt / FLY, 0);
  }
  // scenes and the outro: pull back to the overview and keep drifting away
  const ln = lastNodeBefore(i), from = ln ? nodeCam(ln.id, ln.dur) : OVER;
  const sceneStart = ln ? STEPS[STEPS.indexOf(ln) + 1] : s; // first step of this run of non-card steps
  const slt = t - sceneStart.start;
  return slt < FLY ? fly(from, OVER, slt / FLY, 0) : fly(OVER, { ...OVER, z: OVER.z * .5 }, (slt - FLY) / 3, 0);
}

/* ---------------- three.js: background particles + logo particles ---------------- */
const css = getComputedStyle(document.documentElement);
const PAL = (css.getPropertyValue("--particles").trim() || "#8b8bff,#c084fc,#5b5bd6,#ffffff").split(",").map((c) => new THREE.Color(c.trim()));
const BG = new THREE.Color(css.getPropertyValue("--night").trim() || "#0b0710");
const renderer = new THREE.WebGLRenderer({ canvas: $("bg"), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(1920, 1080, false); renderer.setClearColor(BG, 1); renderer.autoClear = false;
const dotTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.35, "rgba(255,255,255,.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const BGMODE = TL.background ?? "particles"; // particles | grid | plain | paper | gradient
const bgfx = document.createElement("div");
bgfx.id = "bgfx"; bgfx.className = `bg-${BGMODE}`;
document.body.insertBefore(bgfx, world);
const flash = document.createElement("div"); flash.id = "flash"; document.body.appendChild(flash);
const pbar = document.createElement("div"); pbar.id = "pbar"; pbar.innerHTML = "<b></b>"; document.body.appendChild(pbar);
const bug = document.createElement("img"); bug.id = "logobug";
if (TL.logoBug) { bug.src = TL.logoBug === true ? TL.logo : TL.logoBug; document.body.appendChild(bug); }
const bgScene = new THREE.Scene();
bgScene.fog = new THREE.Fog(BG, 2000, 16000);
const cam3 = new THREE.PerspectiveCamera(50, 1920 / 1080, 10, 60000);
const DIST = 540 / Math.tan((25 * Math.PI) / 180); // camera distance where 1 unit = 1 world px at zoom 1
{
  const N = 7000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const X0 = bounds.x0 - 6000, X1 = bounds.x1 + 6000, Y0 = bounds.y0 - 4000, Y1 = bounds.y1 + 4000;
  for (let i = 0; i < N; i++) {
    pos[i * 3] = lerp(X0, X1, rnd(i)); pos[i * 3 + 1] = -lerp(Y0, Y1, rnd(i + 9e3)); pos[i * 3 + 2] = -lerp(300, 9000, Math.pow(rnd(i + 2e4), .7));
    const c = PAL[Math.floor(rnd(i + 3e4) * PAL.length)], k = .35 + .65 * rnd(i + 4e4);
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  bgScene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 34, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .75 })));
  for (let i = 0; i < 9; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: PAL[i % PAL.length], transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.position.set(lerp(X0 + 3000, X1 - 3000, rnd(i + 77)), -lerp(Y0 + 1500, Y1 - 1500, rnd(i + 99)), -lerp(4000, 9000, rnd(i + 55)));
    sp.scale.setScalar(lerp(6000, 11000, rnd(i + 33))); bgScene.add(sp);
  }
}

// logo particles in screen space (centre = 0,0, y up). The logo image should be light-on-transparent.
const fgScene = new THREE.Scene();
const ortho = new THREE.OrthographicCamera(-960, 960, 540, -540, -1000, 1000);
const LOGO = TL.logo, LOGO_H = TL.logoHeight ?? 300;
async function sample(src, n, height, cy) {
  const img = new Image(); img.src = src; await img.decode();
  const sw = 300, sh = Math.round((300 * img.height) / img.width), c = document.createElement("canvas");
  c.width = sw; c.height = sh; const g = c.getContext("2d"); g.drawImage(img, 0, 0, sw, sh);
  const d = g.getImageData(0, 0, sw, sh).data, pts = [];
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const k = (y * sw + x) * 4; if (d[k + 3] > 140) pts.push([x, y, d[k] / 255, d[k + 1] / 255, d[k + 2] / 255]); }
  const sc = height / sh, out = [];
  for (let i = 0; i < n; i++) { const p = pts[Math.floor(rnd(i + 0.5) * pts.length)]; out.push([(p[0] - sw / 2) * sc + (rnd(i + 7) - .5) * sc, -(p[1] - sh / 2) * sc + cy + (rnd(i + 8) - .5) * sc, p[2], p[3], p[4]]); }
  return { pts: out, w: height * img.width / img.height };
}
const LN = 5200;
const T_MARK = LOGO ? await sample(LOGO, LN, LOGO_H, 30) : null;
const lpos = new Float32Array(LN * 3), lcol = new Float32Array(LN * 3);
const lgeo = new THREE.BufferGeometry();
lgeo.setAttribute("position", new THREE.BufferAttribute(lpos, 3)); lgeo.setAttribute("color", new THREE.BufferAttribute(lcol, 3));
const lmat = new THREE.PointsMaterial({ size: 7, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: false });
fgScene.add(new THREE.Points(lgeo, lmat));

// intro: particles stream in from the edges towards the centre, then gather into the logo and burst when the video starts
function streamPos(i, t) {
  const a0 = rnd(i) * Math.PI * 2, a1 = a0 + Math.PI + (rnd(i + 1) - .5) * 1.6, st = rnd(i + 2) * 3.4, r0 = 1300;
  const inP = ease.inOut(prog(t, st, st + 1.0)), outP = ease.inOut(prog(t, st + 1.25, st + 2.3));
  const jr = Math.sqrt(rnd(i + 3)) * 300, ja = rnd(i + 4) * Math.PI * 2, jx = Math.cos(ja) * jr, jy = Math.sin(ja) * jr * .55; // soft round cloud
  let x = lerp(Math.cos(a0) * r0, jx, inP), y = lerp(Math.sin(a0) * r0 * .6, -130 + jy, inP);
  x = lerp(x, Math.cos(a1) * r0, outP); y = lerp(y, Math.sin(a1) * r0 * .6, outP);
  const on = prog(t, st, st + .25) * (1 - prog(t, st + 2.0, st + 2.3)); // hidden before arriving and after leaving
  return [x, y, outP, on];
}
const INTRO = byKind("intro"), OUTRO = byKind("outro"), OVERVIEW = byKind("overview");
const afterIntro = INTRO ? STEPS[STEPS.indexOf(INTRO) + 1] : null;
function logoParticles(t) {
  if (!T_MARK) return 0;
  let alpha = 0;
  const gS = INTRO ? Math.max(.5, INTRO.dur - 2.7) : 0, gE = INTRO ? INTRO.dur - .7 : 0; // gather window in intro-local time
  for (let i = 0; i < LN; i++) {
    const [tx, ty, r, g, b] = T_MARK.pts[i];
    let x = 0, y = 0, cr = r, cg = g, cb = b;
    if (INTRO && afterIntro && t < afterIntro.start + 2.2) {
      const lt = t - INTRO.start, gather = ease.inOut(prog(lt, gS, gE));
      const [vx, vy, outP, on] = streamPos(i, Math.min(lt, gS));
      const sw = Math.sin(Math.PI * gather) * 1.3, ca = Math.cos(sw), sa = Math.sin(sw); // swirl only while gathering
      x = lerp(vx * ca - vy * sa, tx, gather); y = lerp(vx * sa + vy * ca, ty, gather);
      const grey = outP * (1 - gather), k = lerp(on, 1, gather);
      cr = lerp(lerp(PAL[0].r, .55, grey), r, gather) * k; cg = lerp(lerp(PAL[0].g, .5, grey), g, gather) * k; cb = lerp(lerp(PAL[0].b, .55, grey), b, gather) * k;
      const boom = ease.expo(prog(t, afterIntro.start + .35, afterIntro.start + 2.2));
      if (boom > 0) { const ang = Math.atan2(ty - 30, tx) + (rnd(i + 5) - .5), d = boom * (900 + rnd(i + 6) * 1400); x += Math.cos(ang) * d; y += Math.sin(ang) * d; }
      alpha = Math.min(prog(t, .1, .8), 1 - prog(t, afterIntro.start + 1.2, afterIntro.start + 2.2));
    } else if (OUTRO && t >= OUTRO.start - .2) {
      const lt = t - OUTRO.start, p = ease.inOut(prog(lt, 0, 1.9));
      const ang = rnd(i + 11) * Math.PI * 2, d = 900 + rnd(i + 12) * 900, sw = (1 - p) * -2.4;
      const sx = Math.cos(ang) * d, sy = Math.sin(ang) * d * .7;
      x = lerp(sx * Math.cos(sw) - sy * Math.sin(sw), tx, p); y = lerp(sx * Math.sin(sw) + sy * Math.cos(sw), ty + 60, p);
      alpha = prog(lt, -.2, .6) * (1 - prog(lt, 2.4, 3.0) * .85); // hands over to the crisp logo image
    }
    lpos[i * 3] = x; lpos[i * 3 + 1] = y; lpos[i * 3 + 2] = 0;
    lcol[i * 3] = cr; lcol[i * 3 + 1] = cg; lcol[i * 3 + 2] = cb;
  }
  lmat.opacity = alpha;
  lgeo.attributes.position.needsUpdate = true; lgeo.attributes.color.needsUpdate = true;
  return alpha;
}

/* ---------------- intro / outro text ---------------- */
const ov = document.createElement("div");
ov.className = "scene";
const logoW = T_MARK ? T_MARK.w : 0;
ov.innerHTML = `
  <div id="i-h" class="big" style="position:absolute;left:0;right:0;top:150px;text-align:center">${TL.intro?.headline ?? ""}</div>
  <div id="i-s" style="position:absolute;left:0;right:0;top:290px;text-align:center;font-size:46px;font-weight:700;color:rgba(255,255,255,.6)">${TL.intro?.sub ?? ""}</div>
  <div id="o-tag" style="position:absolute;left:0;right:0;top:${540 - 90 + LOGO_H / 2 + 90}px;text-align:center;font-size:54px;font-weight:800;letter-spacing:-1.5px;color:#fff">${TL.outro?.tagline ?? ""}</div>
  ${LOGO ? `<img id="o-logo" src="${LOGO}" style="position:absolute;left:50%;top:${540 - 90 - LOGO_H / 2}px;width:${logoW}px;margin-left:${-logoW / 2}px;opacity:0">` : ""}`;
scenesEl.prepend(ov);

/* ---------------- scene entrances ---------------- */
// a scene enters by fading (default) or by a circular wipe from `wipeFrom` ([x, y] px); `fadeIn` = local start time
function sceneEnter(sc) {
  const fin = sc.fadeIn ?? (STEPS.indexOf(sc) === 0 ? 0 : .9), wd = sc.wipeDur ?? 1.1;
  return { fin, wd, wipe: sc.enter === "wipe" };
}
function sceneState(sc, t) {
  const slt = t - sc.start, { fin, wd, wipe } = sceneEnter(sc);
  const next = STEPS[STEPS.indexOf(sc) + 1];
  let out;
  if (next?.kind === "scene" && next.enter === "wipe") { const n = sceneEnter(next); out = t < next.start + n.fin + n.wd ? 1 : 0; }
  else out = 1 - prog(slt, sc.dur - .5, sc.dur + .1);
  if (slt < (wipe ? fin : fin - .001) && fin > 0 || slt > sc.dur + 1.5) return { opacity: 0, clip: "none", cover: 0 };
  if (wipe) {
    const p = ease.inOut(prog(slt, fin, fin + wd)), [wx, wy] = sc.wipeFrom ?? [960, 540];
    return { opacity: out, clip: p >= 1 ? "none" : `circle(${p * 2300}px at ${wx}px ${wy}px)`, cover: p >= 1 ? out : 0 };
  }
  const a = fin === 0 ? 1 : prog(slt, fin, fin + .8);
  return { opacity: Math.min(a, out), clip: "none", cover: Math.min(a, out) };
}

/* ---------------- render ---------------- */
function render(t) {
  const s = stepAt(t), lt = t - s.start;
  const cam = camAt(t), prevCam = camAt(Math.max(0, t - 1 / 30));

  // world transform, with motion blur from camera speed
  const speed = Math.hypot((cam.cx - prevCam.cx) * cam.z, (cam.cy - prevCam.cy) * cam.z) + Math.abs(Math.log(cam.z / prevCam.z)) * 1400;
  const blur = clamp((speed - 18) / 14, 0, 7);
  world.style.transform = `translate(${960 - cam.cx * cam.z}px, ${540 - cam.cy * cam.z}px) scale(${cam.z})`;
  world.style.filter = blur > .3 ? `blur(${blur.toFixed(2)}px)` : "none";

  // world is visible from the overview (or first card) until a full-screen scene/outro takes over
  const firstWorld = OVERVIEW ?? NODES[0], lastNode = NODES[NODES.length - 1];
  const inWorld = firstWorld ? prog(t, firstWorld.start + .2, firstWorld.start + 1.2) : 0;
  const afterLast = lastNode ? STEPS[STEPS.indexOf(lastNode) + 1] : null;
  const leaving = lastNode && afterLast?.enter !== "wipe" ? prog(t, lastNode.start + lastNode.dur + 1.2, lastNode.start + lastNode.dur + 2.6) : 0;
  const sceneCover = SCENES.reduce((m, x) => Math.max(m, sceneState(x, t).cover), 0);
  world.style.opacity = inWorld * (1 - leaving) * (1 - sceneCover);

  const inNodes = s.kind === "node";
  for (const s2 of NODES) {
    const n = nodes[s2.id], nlt = t - s2.start;
    const appear = OVERVIEW ? io(t, OVERVIEW.start + 1.0 + n.i * .28, OVERVIEW.start + 1.6 + n.i * .28, ease.back) : 1;
    const act = vis(t, s2.start, s2.start + s2.dur, .9);
    n.el.style.opacity = clamp(appear * 1.4) * (inNodes ? .38 + .62 * act : 1);
    n.el.style.transform = `scale(${lerp(.86, 1, clamp(appear))})`;
    n.glow.style.opacity = CANVAS ? act : 0;
    try { mods[s2.id].render(n.root, nlt, n.ctx); } catch (e) { if (!n.err) console.error("render", s2.id, e); n.err = true; }
  }
  // paths draw in during the overview, then keep flowing
  links.forEach((L, k) => {
    const d = OVERVIEW ? prog(t, OVERVIEW.start + 1.4 + k * .3, OVERVIEW.start + 2.2 + k * .3) : 1;
    L.base.setAttribute("stroke-dashoffset", L.len * (1 - d));
    L.flow.setAttribute("stroke-dashoffset", -t * 160);
    L.flow.style.opacity = OVERVIEW ? prog(t, OVERVIEW.start + 2.0 + k * .3, OVERVIEW.start + 2.6 + k * .3) : 1;
  });
  // comet runs along the link while flying between cards
  const link = inNodes && lt < FLY ? links.find((L) => L.b === s.id && STEPS[STEPS.indexOf(s) - 1]?.id === L.a) : null;
  comet.forEach((c, i) => {
    if (!link) { c.style.opacity = 0; return; }
    const pt = link.base.getPointAtLength(clamp(ease.inOut(lt / FLY) - i * .018) * link.len);
    c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y);
    c.style.opacity = (1 - i / 10) * Math.sin(Math.PI * clamp(lt / FLY));
  });

  // full-screen scenes
  for (const x of Object.values(scenes)) {
    const slt = t - x.s.start, st = sceneState(x.s, t);
    x.root.style.opacity = st.opacity;
    x.root.style.clipPath = st.clip;
    if ((slt > -1 && slt < x.s.dur + 1) || st.opacity > 0) { /* keep drawing while still on screen under the next wipe */ try { mods[x.s.id].render(x.root, slt, x.ctx); } catch (e) { if (!x.err) console.error("render", x.s.id, e); x.err = true; } }
  }

  // intro / outro text
  if (INTRO) {
    const ilt = t - INTRO.start, gS = Math.max(.5, INTRO.dur - 2.7);
    S($("i-h"), { opacity: Math.min(prog(ilt, .3, .9), 1 - prog(ilt, gS - .3, gS + .3)), transform: `translateY(${(1 - io(ilt, .3, 1)) * 30}px)` });
    S($("i-s"), { opacity: Math.min(prog(ilt, 1.6, 2.2), 1 - prog(ilt, gS - .3, gS + .3)), transform: `translateY(${(1 - io(ilt, 1.6, 2.3)) * 24}px)` });
  } else { S($("i-h"), { opacity: 0 }); S($("i-s"), { opacity: 0 }); }
  if (OUTRO) {
    const olt = t - OUTRO.start;
    S($("o-logo"), { opacity: Math.min(prog(olt, 1.9, 2.6), 1 - prog(olt, OUTRO.dur - .6, OUTRO.dur)) });
    S($("o-tag"), { opacity: Math.min(prog(olt, 2.3, 3.0), 1 - prog(olt, OUTRO.dur - .6, OUTRO.dur)), transform: `translateY(${(1 - io(olt, 2.3, 3.1)) * 30}px)` });
  }

  // progress HUD + captions
  const ni = NODES.indexOf(s), PMODE = TL.progress ?? (TL.hud === false ? "none" : "pill");
  S($("hud"), { opacity: PMODE !== "pill" || ni < 0 ? 0 : 1 });
  if (NODES.length) {
    const a = NODES[0].start, b = lastNode.start + lastNode.dur;
    S(pbar, { opacity: PMODE === "bar" ? Math.min(prog(t, a - .6, a), 1 - prog(t, b, b + .6)) : 0 });
    pbar.firstChild.style.width = clamp((t - a) / (b - a)) * 100 + "%";
  }
  if (TL.logoBug) {
    const lastStep = STEPS[STEPS.length - 1], from = (OVERVIEW ?? NODES[0] ?? STEPS[0]).start + 1;
    S(bug, { opacity: .55 * Math.min(prog(t, from, from + .6), 1 - prog(t, lastStep.start, lastStep.start + .5)) });
  }
  { // white flash at the cut of a zoom-through
    const half = FLY / 2;
    S(flash, { opacity: inNodes && s.transition === "zoom" && STEPS[STEPS.indexOf(s) - 1]?.kind === "node" ? clamp(1 - Math.abs(lt - half) / .22) * .9 : 0 });
  }
  if (ni >= 0) {
    $("hud").querySelector(".num").textContent = `${String(ni + 1).padStart(2, "0")} / ${String(NODES.length).padStart(2, "0")}`;
    $("hud").querySelector(".name").textContent = nodes[s.id].title;
    $("hud").querySelector("b").style.width = ((ni + clamp(lt / s.dur)) / NODES.length) * 100 + "%";
  }
  const cs = TL.captions === false ? null : STEPS.find((x) => x.kind !== "outro" && x.line && t >= x.voStart - .15 && t < x.voStart + x.voDur + .35);
  $("cap").textContent = cs ? cs.line : "";
  S($("cap"), { opacity: cs ? Math.min(prog(t, cs.voStart - .15, cs.voStart + .1), 1 - prog(t, cs.voStart + cs.voDur + .1, cs.voStart + cs.voDur + .35)) : 0 });

  // three.js
  cam3.position.set(cam.cx + Math.sin(t * .1) * 60, -cam.cy + Math.cos(t * .13) * 40, DIST / cam.z);
  cam3.lookAt(cam.cx, -cam.cy, 0);
  renderer.clear();
  if (BGMODE === "particles") renderer.render(bgScene, cam3);
  else moveBg(cam, t);
  if (logoParticles(t) > 0) { renderer.clearDepth(); renderer.render(fgScene, ortho); }

  document.body.style.opacity = 1 - prog(t, TL.total - .5, TL.total); // fade to black at the end
}

// CSS backgrounds drift with the camera at half speed, which reads as depth
function moveBg(cam, t) {
  if (BGMODE === "grid") {
    const size = 64 * Math.max(.45, Math.pow(cam.z, .6));
    bgfx.style.backgroundSize = `${size}px ${size}px`;
    bgfx.style.backgroundPosition = `${960 - cam.cx * cam.z * .55}px ${540 - cam.cy * cam.z * .55}px`;
  } else if (BGMODE === "gradient") {
    bgfx.style.backgroundPosition = `${50 + Math.sin(t * .07) * 20 - cam.cx * cam.z * .01}% ${50 + Math.cos(t * .05) * 20}%`;
  }
}

// solo: one step on its own for checking (?solo=<id>), driven by renderSolo(localTime)
function renderSolo(lt) {
  const id = qs.get("solo");
  ov.style.display = "none"; S($("hud"), { display: "none" }); S($("cap"), { display: "none" });
  for (const x of Object.values(scenes)) x.root.style.opacity = 0;
  if (scenes[id]) {
    world.style.opacity = 0;
    scenes[id].root.style.opacity = 1; mods[id].render(scenes[id].root, lt, scenes[id].ctx);
  } else {
    const c = nodeCam(id, Math.max(lt, FLY));
    world.style.opacity = 1; world.style.filter = "none";
    world.style.transform = `translate(${960 - c.cx * c.z}px, ${540 - c.cy * c.z}px) scale(${c.z})`;
    for (const s2 of NODES) {
      const o = s2.id;
      nodes[o].el.style.opacity = o === id ? 1 : .35; nodes[o].el.style.transform = "none"; nodes[o].glow.style.opacity = o === id && CANVAS ? 1 : 0;
      try { mods[o].render(nodes[o].root, o === id ? lt : -1, nodes[o].ctx); } catch (e) { console.error(e); }
    }
    links.forEach((L) => { L.base.setAttribute("stroke-dashoffset", 0); L.flow.style.opacity = 1; });
  }
  const c = scenes[id] ? OVER : nodeCam(id, Math.max(lt, FLY));
  cam3.position.set(c.cx, -c.cy, DIST / c.z); cam3.lookAt(c.cx, -c.cy, 0);
  renderer.clear();
  if (BGMODE === "particles") renderer.render(bgScene, cam3); else moveBg(c, 0);
  for (const x of Object.values(scenes)) x.root.style.clipPath = "none";
}

window.render = render;
window.renderSolo = renderSolo;
window.TOTAL = TL.total;
window.READY = true;

// preview: open http://localhost:8780/ to watch in real time (?t=40 to start later, ?solo=<id> for one step)
if (!qs.has("render")) {
  const t0 = performance.now(), start = +(qs.get("t") || 0);
  const loop = () => {
    const t = start + (performance.now() - t0) / 1000;
    if (qs.has("solo")) renderSolo(t % (byId[qs.get("solo")].dur + 1)); else render(t % TL.total);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
