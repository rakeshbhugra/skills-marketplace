// Full-screen finale: the "One platform, four layers" slide, rebuilt as real HTML planes in a CSS 3D scene.
// It starts flat (front-on, like the deck), tilts back and explodes into four stacked slabs, lights the
// pieces on their words, then settles into a compact stack. Text lives on the planes, so perspective is true.
import { clamp, prog, lerp, ease, io, rnd, KF, S } from "../helpers.js";

// container (the slide's diagram panel) in screen px
const CW = 1495, CH = 715, CX = 212, CY = 222, MID = CH / 2;

// tiny line icons (24 grid)
const I = {
  bot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01"/>',
  head: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/>',
  spark: '<path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
  research: '<circle cx="10" cy="8" r="3.5"/><path d="M4 19c0-3.3 2.7-5.5 6-5.5"/><circle cx="16.5" cy="16.5" r="2.5"/><path d="M18.5 18.5L21 21"/>',
  farm: '<circle cx="12" cy="7" r="3"/><circle cx="7" cy="16" r="3"/><circle cx="17" cy="16" r="3"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 10h14l-5-10V3"/><path d="M7.5 14h9"/>',
  flow: '<rect x="3" y="4" width="7" height="6" rx="2"/><rect x="14" y="14" width="7" height="6" rx="2"/><path d="M10 7h4a3 3 0 0 1 3 3v4"/>',
  route: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  chart: '<path d="M4 20h16M7 16v-5M12 16V7M17 16v-8"/>',
  db: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
};
const icon = (k, cls = "") => `<span class="ic ${cls}"><svg viewBox="0 0 24 24">${I[k]}</svg></span>`;

// rows of the slide, in container coords. z = height in the exploded stack (top layer highest)
const ROWS = [
  { key: "buyers", label: "Users &amp; Teams", ly: 137, y: 22, h: 230, z: 3 },
  { key: "context", label: "Context Layer", ly: 312, y: 260, h: 105, z: 2 },
  { key: "agent", label: "Agent Engineering", ly: 429, y: 371, h: 119, z: 1 },
  { key: "platform", label: "Platform Services", ly: 593, y: 495, h: 198, z: 0 },
];
const BUYERS = [["bot", "AI Assistant", "Answers users in context"], ["head", "Live Support", "Real-time human handoff"], ["spark", "Team Copilot", "Helps your team act"]];
const AGENTS = [["farm", "Agents", "Built-in and custom"], ["flask", "Evaluations", "Pre-Launch &amp; Production Monitoring"], ["flow", "Workflows", "Visual builder"]];
const SERVICES = [["route", "Routing", "Assignment and load balancing"], ["bell", "Alerts", "Accounts, Contacts, Campaigns"], ["chart", "Analytics", "Usage and outcomes"],
  ["db", "Knowledge Management", "Knowledge &amp; Identity Graph, Vector Store"], ["plug", "Integration", "Connectors, APIs, Webhooks"], ["shield", "Trust &amp; Safety", "PII Masking, Injection Defense, Audits"]];

// a slab: top face (the element itself) + front / left / right faces hanging down by t px, + soft glow beneath
function slab(cls, x, y, w, h, t, inner) {
  return `<div class="slab ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
    <i class="glow" style="transform:translateZ(${-t - 2}px)"></i>
    <i class="f fr" style="height:calc(${t}px * var(--k))"></i><i class="f fl" style="width:calc(${t}px * var(--k))"></i><i class="f fri" style="width:calc(${t}px * var(--k))"></i>
    ${inner}</div>`;
}
const tileText = (ic, a, b, cls) => `<div class="tx">${icon(ic, cls)}<div><div class="tt">${a}</div><div class="ts">${b}</div></div></div>`;

let els;

export default {
  build(root) {
    root.innerHTML = `<style>
      .s-platform .stage { position: absolute; inset: 0; perspective: 2300px; perspective-origin: 960px 380px; }
      .s-platform .world, .s-platform .layer, .s-platform .slab { transform-style: preserve-3d; }
      .s-platform .world { position: absolute; left: ${CX}px; top: ${CY}px; width: ${CW}px; height: ${CH}px; transform-origin: 50% 50%; }
      .s-platform .layer { position: absolute; left: 0; top: 0; width: ${CW}px; height: ${CH}px; }
      .s-platform .panel { position: absolute; inset: 0; border-radius: 26px; background: linear-gradient(160deg, #fdf9fc, #f6eef4); box-shadow: 0 40px 120px rgba(0,0,0,.5); transform: translateZ(-30px); }
      .s-platform .rl { position: absolute; right: ${CW - 260}px; transform: translateY(-50%); white-space: nowrap; font-size: 19px; font-weight: 750; letter-spacing: 2.6px; text-transform: uppercase; color: #b8337c; }
      .s-platform .slab { position: absolute; border-radius: 14px; }
      .s-platform .slab .f { position: absolute; display: block; }
      .s-platform .slab .fr { left: 10px; right: 10px; top: 100%; transform-origin: 50% 0; transform: rotateX(-90deg); border-radius: 0 0 6px 6px; }
      .s-platform .slab .fl { left: 0; top: 10px; bottom: 10px; transform-origin: 0 50%; transform: rotateY(90deg); }
      .s-platform .slab .fri { left: 100%; top: 10px; bottom: 10px; transform-origin: 0 50%; transform: rotateY(90deg); }
      .s-platform .slab .glow { position: absolute; inset: -60px; display: block; border-radius: 50%; opacity: 0;
        background: radial-gradient(closest-side, rgba(255,90,170,.75), rgba(211,58,143,.25) 55%, transparent); }
      .s-platform .dark { background: linear-gradient(180deg, #4a2147 0%, #2f1530 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.06); }
      .s-platform .dark .f { background: #1d0c1c; }
      .s-platform .band-m { background: #7c1854; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); border-radius: 16px; }
      .s-platform .band-m > .f { background: #4a0d32; }
      .s-platform .mt { background: linear-gradient(180deg, #b52f7d, #a0226c); border-radius: 10px; box-shadow: inset 0 1px 0 rgba(255,255,255,.18); }
      .s-platform .mt .f { background: #6b1347; }
      .s-platform .band-p { background: #f1e6ee; border-radius: 16px; box-shadow: inset 0 0 0 1px rgba(160,60,120,.12); }
      .s-platform .band-p > .f { background: #c9b2c2; }
      .s-platform .wt { background: #fff; border-radius: 10px; box-shadow: 0 1px 2px rgba(80,20,60,.12); }
      .s-platform .wt .f { background: #ddc9d6; }
      .s-platform .tx { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; color: #fff; }
      .s-platform .tx > div { display: contents; }
      .s-platform .tt { font-weight: 750; letter-spacing: -.2px; }
      .s-platform .ic { display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; flex: none;
        background: linear-gradient(135deg, #e04d9e, #b4277a); box-shadow: inset 0 1px 0 rgba(255,255,255,.3); }
      .s-platform .ic svg { fill: none; stroke: #fff; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
      .s-platform .ic.ghost { background: rgba(255,255,255,.2); box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); }
      /* big tiles: icon + title on one line, sub-label under */
      .s-platform .lg .tx { flex-wrap: wrap; align-content: center; column-gap: 12px; row-gap: 10px; padding-bottom: 14px; }
      .s-platform .lg .tx .tt { font-size: 25px; } .s-platform .lg .tx .ts { flex-basis: 100%; font-size: 18px; color: rgba(255,255,255,.88); }
      .s-platform .lg .ic { width: 38px; height: 38px; } .s-platform .lg .ic svg { width: 23px; height: 23px; }
      .s-platform .small .tx { flex-wrap: wrap; align-content: center; column-gap: 9px; row-gap: 6px; }
      .s-platform .small .tx .tt { font-size: 21px; } .s-platform .small .tx .ts { flex-basis: 100%; font-size: 17px; }
      .s-platform .small .ic { width: 27px; height: 27px; border-radius: 7px; } .s-platform .small .ic svg { width: 17px; height: 17px; }
      .s-platform .mt .ts { color: rgba(255,255,255,.86); }
      .s-platform .wt .tx { color: #2a1a2a; } .s-platform .wt .ts { color: #5e5160; }
      .s-platform .beam { position: absolute; width: 110px; transform-origin: 50% 0; overflow: hidden; opacity: 0;
        background: radial-gradient(ellipse 50% 60% at 50% 50%, rgba(255,120,190,.0), transparent),
          linear-gradient(90deg, transparent, rgba(255,111,181,.35) 30%, rgba(255,220,240,.95) 50%, rgba(255,111,181,.35) 70%, transparent);
        -webkit-mask: linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent); }
      .s-platform .beam b { position: absolute; left: 50%; top: 0; width: 9px; height: 9px; margin-left: -4.5px; border-radius: 50%; background: #fff; box-shadow: 0 0 12px 4px rgba(255,111,181,.9); }
      .s-platform .head { position: absolute; left: 212px; top: 62px; color: #fff; }
      .s-platform .head .k { font-size: 20px; font-weight: 750; letter-spacing: 6px; text-transform: uppercase; color: #e2559f; }
      .s-platform .head .h { font-size: 54px; font-weight: 800; letter-spacing: -1.6px; margin-top: 8px; }
      .s-platform .floor { position: absolute; left: 260px; right: 260px; top: 560px; height: 420px; border-radius: 50%; opacity: 0;
        background: radial-gradient(closest-side, rgba(172,36,110,.45), rgba(106,35,112,.18) 60%, transparent); }
    </style>
    <div class="floor"></div>
    <div class="head"><div class="k">The System</div><div class="h">One platform, four layers</div></div>
    <div class="stage"><div class="world">
      <div class="panel"></div>
      ${ROWS.map((r) => `<div class="layer L-${r.key}"><div class="rl" style="top:${r.ly}px">${r.label}</div>${{
        buyers: BUYERS.map((b, i) => slab("dark lg bt", 290 + i * 396, 22, 387, 230, 26, tileText(...b))).join(""),
        context: slab("dark lg ctx", 292, 260, 1172, 105, 22, tileText("research", "Unified Records", "Every record, enriched and linked")),
        agent: slab("band-m", 291, 371, 1175, 119, 18, AGENTS.map((a, i) => slab("mt small at", 16 + i * 385, 15, 374, 87, 8, tileText(a[0], a[1], a[2], "ghost"))).join("")),
        platform: slab("band-p", 291, 495, 1175, 198, 18, SERVICES.map((s, i) => slab("wt small st", 15 + (i % 3) * 385, 13 + Math.floor(i / 3) * 92, 374, 80, 6, tileText(...s))).join("")),
      }[r.key]}</div>`).join("")}
      ${BUYERS.map((_, i) => `<div class="beam" style="left:${290 + i * 396 + 193.5 - 55}px;top:${MID}px">${Array.from({ length: 7 }, () => "<b></b>").join("")}</div>`).join("")}
    </div></div>`;
    const q = (s) => [...root.querySelectorAll(s)];
    els = {
      world: root.querySelector(".world"), panel: root.querySelector(".panel"), head: root.querySelector(".head"), floor: root.querySelector(".floor"),
      layers: q(".layer"), labels: q(".rl"), bt: q(".bt"), ctx: root.querySelector(".ctx"), bandM: root.querySelector(".band-m"), bandP: root.querySelector(".band-p"),
      at: q(".at"), st: q(".st"), beams: q(".beam"),
    };
  },

  render(root, lt, ctx) {
    const at = (w) => ctx.at(ctx.line.indexOf(w) / ctx.line.length);
    const tX = at("four layers") + .2;                       // tilt + explode starts
    const lifts = [Math.max(at("AI chat"), tX + 1.2), Math.max(at("live agents"), tX + 1.8), at("seller co-pilot")];
    const tC = at("one shared"), tA = at("agent engineering"), tP = at("platform services");
    const tS = ctx.vo + ctx.voDur + .2;                       // settle into a compact stack

    const ex = io(lt, tX, tX + 1.9, ease.inOut);              // 0 flat -> 1 exploded
    const settle = io(lt, tS, tS + 1.5, ease.inOut);
    const gap = lerp(0, 290, ex) - 262 * settle;              // vertical spacing between layers
    const sep = ex * (1 - settle);                                           // rows slide over each other as they lift

    // camera: tilt back and orbit (turntable) with real perspective
    const [tilt, sc, ty] = KF(lt, [[tX, 0, 1, 0], [tX + 1.9, 56, .74, 15], [tS, 54, .78, 5], [tS + 1.5, 44, .88, -5]]);
    const rz = lerp(0, -15, ex) + 9 * ease.inOut(prog(lt, tX + .6, ctx.dur)) - 2 * settle;
    els.world.style.setProperty("--k", ex);
    S(els.world, { transform: `translateY(${ty}px) scale(${sc}) rotateX(${tilt}deg) rotateZ(${rz}deg)` });
    S(els.panel, { opacity: 1 - prog(lt, tX, tX + .8) });
    S(els.head, { opacity: 1 });
    S(els.floor, { opacity: .9 * io(lt, tX + .4, tX + 2) });

    ROWS.forEach((r, i) => {
      const cy = r.y + r.h / 2, z = (r.z - 1.5) * gap;
      S(els.layers[i], { transform: `translate3d(0, ${(MID - cy) * sep}px, ${z}px)` });
    });

    // buyers tiles lift and glow in turn; all stay a little up and lit, then settle
    const lit = lifts.map((t) => io(lt, t, t + .5));
    els.bt.forEach((e, i) => {
      const pulse = Math.exp(-Math.max(0, lt - lifts[i]) * 1.6) * (lt > lifts[i] ? 1 : 0);
      const feed = io(lt, tC + .9 + i * .15, tC + 1.5 + i * .15) * (1 - prog(lt, tA - .3, tA + .5));
      const g = clamp(.55 * lit[i] + .6 * pulse + .5 * feed) * (1 - .6 * settle);
      const up = (34 * pulse + 22 * lit[i]) * (1 - settle);
      e.style.transform = `translateZ(${up}px)`;
      e.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 ${1 + 2 * g}px rgba(255,140,200,${.06 + .8 * g}), 0 0 ${50 * g}px rgba(255,90,170,${.7 * g})`;
      e.firstElementChild.style.opacity = g;
    });

    // context bar glows, beams + particles rise into the three tiles above
    const cg = io(lt, tC - .1, tC + .5) * (1 - .55 * prog(lt, tA - .3, tA + .6)) * (1 - .5 * settle);
    els.ctx.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 ${1 + 2 * cg}px rgba(255,140,200,${.06 + .8 * cg}), 0 0 ${60 * cg}px rgba(255,90,170,${.75 * cg})`;
    els.ctx.style.background = `linear-gradient(180deg, ${cg > 0 ? `rgb(${lerp(74, 128, cg)},${lerp(33, 30, cg)},${lerp(71, 92, cg)})` : "#4a2147"} 0%, #2f1530 100%)`;
    els.ctx.firstElementChild.style.opacity = cg;
    const zC = (2 - 1.5) * gap, zB = (3 - 1.5) * gap;
    els.beams.forEach((b, i) => {
      const s0 = tC + .25 + i * .15, grow = io(lt, s0, s0 + .7, ease.inOut);
      const on = grow * (1 - prog(lt, tA - .2, tA + .6));
      const L = Math.max(1, zB - zC - 26 + 22 * lit[i]);
      b.style.height = L + "px";
      b.style.opacity = on;
      b.style.transform = `translateZ(${zC}px) rotateX(90deg) scaleY(${Math.max(.001, grow)})`;
      [...b.children].forEach((d, k) => {
        const f = (lt * .7 + k / 7 + rnd(k + i * 9) * .08) % 1;
        d.style.transform = `translate(${(rnd(k * 3 + i) - .5) * 50 * (1 - f)}px, ${f * L}px)`;
        d.style.opacity = Math.sin(Math.PI * f);
      });
    });

    // agent engineering, then platform services, highlight in turn (layer lifts, tiles pulse)
    const hA = io(lt, tA, tA + .5) * (1 - io(lt, tP - .2, tP + .5)), hP = io(lt, tP, tP + .5) * (1 - settle);
    els.bandM.style.transform = `translateZ(${24 * hA}px)`;
    els.bandM.style.boxShadow = `inset 0 0 0 ${1 + 2 * hA}px rgba(255,150,205,${.08 + .7 * hA}), 0 0 ${70 * hA}px rgba(255,80,165,${.7 * hA})`;
    els.bandM.firstElementChild.style.opacity = hA;
    els.at.forEach((e, i) => {
      const p = Math.exp(-Math.max(0, lt - tA - i * .2) * 2) * (lt > tA + i * .2 ? 1 : 0);
      e.style.transform = `translateZ(${8 + 14 * p}px)`;
    });
    els.bandP.style.transform = `translateZ(${24 * hP}px)`;
    els.bandP.style.boxShadow = `inset 0 0 0 ${1 + 2 * hP}px rgba(225,85,160,${.12 + .7 * hP}), 0 0 ${70 * hP}px rgba(255,170,215,${.55 * hP})`;
    els.bandP.firstElementChild.style.opacity = .8 * hP;
    els.st.forEach((e, i) => {
      const d = tP + (i % 3) * .12 + Math.floor(i / 3) * .2, p = Math.exp(-Math.max(0, lt - d) * 2) * (lt > d ? 1 : 0);
      e.style.transform = `translateZ(${6 + 12 * p}px)`;
      e.style.boxShadow = `0 1px 2px rgba(80,20,60,.12), inset 0 0 0 ${2 * p}px rgba(211,58,143,${p})`;
    });

    // row labels brighten with their layer
    const hl = [Math.max(...lit) * (1 - prog(lt, tC - .3, tC + .3)), cg, hA, hP];
    const pf = prog(lt, tX, tX + .8); // labels lighten once the pale panel is gone
    els.labels.forEach((l, i) => { const k = clamp(.45 * pf + .55 * hl[i]); l.style.color = `rgb(${lerp(184, 255, k)},${lerp(51, 140, k)},${lerp(124, 200, k)})`; l.style.textShadow = `0 0 ${20 * hl[i]}px rgba(255,90,170,${hl[i]})`; });
  },
};
