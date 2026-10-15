// Example shared UI kit: laptop frame, app shell, list rows, macOS cursor.
// Copy it to steps/kit.js, set the defaults below to the product, and tell every step agent to import it
// and not edit it. Then all scenes show the same product. Colours come from theme.css tokens.
// Everything is plain DOM; animate it from your own render(lt).
import { prog, lerp, ease, KF } from "../helpers.js";

// ---- set these per video ----
const PRODUCT = { name: "acme", mark: "assets/mark.png" };
const USER = { name: "Alex Rivera", initials: "AR", color: "var(--accent-2)" };
const NAV = [["inbox", "Inbox", 4], ["today", "Today", 6], ["upcoming", "Upcoming", ""], ["shared", "Shared", 2], ["review", "Review", ""]]; // [id, label, badge]

const CSS = `
.tk-laptop { position: absolute; }
.tk-lid { position: relative; border-radius: 26px 26px 10px 10px; background: linear-gradient(#2b3a40, #1d2a2f); padding: 18px 18px 22px; box-shadow: 0 40px 80px -30px rgba(20,40,50,.45); }
.tk-lid:before { content: ""; position: absolute; left: 50%; top: 7px; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: #3e5058; }
.tk-bezel { position: relative; overflow: hidden; border-radius: 8px; background: #fff; }
.tk-screen { position: absolute; left: 0; top: 0; width: 1280px; height: 800px; transform-origin: 0 0; overflow: hidden; background: #fff; font-family: var(--font); color: var(--ink); }
.tk-base { position: relative; height: 26px; margin: 0 -6%; border-radius: 2px 2px 22px 22px; background: linear-gradient(#dfe5e8, #b9c3c8); box-shadow: 0 30px 50px -20px rgba(20,40,50,.4); }
.tk-base:before { content: ""; position: absolute; left: 50%; top: 0; width: 18%; height: 9px; margin-left: -9%; border-radius: 0 0 12px 12px; background: #c6cfd3; }

.tk-app { position: absolute; inset: 0; display: flex; background: var(--paper); }
.tk-side { width: 230px; flex: none; background: var(--chrome); border-right: 1px solid var(--line); padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; }
.tk-brand { display: flex; align-items: center; gap: 10px; margin: 0 6px 22px; font-weight: 700; font-size: 24px; letter-spacing: -.6px; color: var(--ink); }
.tk-brand img { width: 32px; height: 32px; }
.tk-nav { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; font-size: 16px; font-weight: 550; color: var(--ink-2); }
.tk-nav svg { width: 19px; height: 19px; flex: none; }
.tk-nav .n { margin-left: auto; font-size: 13px; color: var(--muted); font-weight: 600; }
.tk-nav.on { background: var(--paper); color: var(--ink); box-shadow: 0 6px 16px -10px rgba(20,40,50,.45); }
.tk-nav.on svg { color: var(--accent); }
.tk-me { margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 8px 10px; font-size: 14px; color: var(--ink-2); }
.tk-av { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; flex: none; }
.tk-main { flex: 1; position: relative; padding: 30px 40px; overflow: hidden; background: var(--page); }
.tk-h1 { font-size: 32px; font-weight: 700; letter-spacing: -.8px; color: var(--ink); }
.tk-sub { font-size: 15px; color: var(--muted); margin-top: 4px; }

.tk-row { display: flex; align-items: center; gap: 14px; padding: 15px 18px; border-radius: 16px; background: var(--paper); border: 1px solid var(--line); box-shadow: 0 8px 22px -16px rgba(20,40,50,.35); font-size: 17px; color: var(--ink); }
.tk-box { width: 22px; height: 22px; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--muted) 60%, white); flex: none; position: relative; }
.tk-row.done .tk-box { background: var(--accent); border-color: var(--accent); }
.tk-row.done .tk-box:after { content: ""; position: absolute; left: 6px; top: 2px; width: 5px; height: 10px; border: solid #fff; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
.tk-row.done .tk-tt { color: var(--muted); text-decoration: line-through; }
.tk-tt { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tk-chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px; border-radius: 999px; font-size: 13.5px; font-weight: 600; white-space: nowrap; background: var(--accent-soft); color: var(--accent); }
.tk-chip.grey { background: color-mix(in srgb, var(--line) 70%, white); color: var(--ink-2); }
.tk-chip.warn { background: var(--warn-soft); color: var(--warn); }
.tk-chip.person { background: color-mix(in srgb, var(--line) 50%, white); color: var(--ink-2); padding-left: 4px; }
.tk-chip.person .tk-av { width: 22px; height: 22px; font-size: 10px; }

.tk-cur { position: absolute; left: 0; top: 0; width: 30px; height: 30px; z-index: 50; pointer-events: none; transform-origin: 3px 3px; filter: drop-shadow(0 3px 4px rgba(0,0,0,.25)); }
.tk-rip { position: absolute; z-index: 49; width: 54px; height: 54px; margin: -27px 0 0 -27px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 75%, transparent); background: color-mix(in srgb, var(--accent) 15%, transparent); pointer-events: none; opacity: 0; }
`;
let injected = false;
export function injectKit() {
  if (injected) return;
  injected = true;
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
}

const svg = (d, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const ICON = {
  inbox: svg('<path d="M4 13h4l2 3h4l2-3h4"/><path d="M5 5h14l1 8v6H4v-6z"/>'),
  today: svg('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  upcoming: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'),
  shared: svg('<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 19c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5M15 15.5c2.2 0 4.2 1.2 5 3.5"/>'),
  review: svg('<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>'),
  bell: svg('<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  check: svg('<path d="M5 12.5l4.2 4.2L19 7"/>', 2.6),
};

/** A laptop at (left, top) in the parent, `width` px wide. Returns the 1280×800 screen element to draw into. */
export function laptop(parent, { left = 180, top = 60, width = 1240 } = {}) {
  injectKit();
  const el = document.createElement("div");
  el.className = "tk-laptop";
  Object.assign(el.style, { left: left + "px", top: top + "px", width: width + "px" });
  const k = (width - 36) / 1280;
  el.innerHTML = `<div class="tk-lid"><div class="tk-bezel" style="height:${800 * k}px"><div class="tk-screen" style="transform:scale(${k})"></div></div></div><div class="tk-base"></div>`;
  parent.appendChild(el);
  const screen = el.querySelector(".tk-screen");
  screen.laptop = el;
  screen.scale = k;
  return screen;
}

/** The product's app shell inside a screen. `active` = a NAV id. Returns { app, side, main }. */
export function app(screen, { active = "today", title = "Today", sub = "", product = PRODUCT, user = USER, nav = NAV } = {}) {
  injectKit();
  screen.innerHTML = `<div class="tk-app"><div class="tk-side"><div class="tk-brand">${product.mark ? `<img src="${product.mark}">` : ""}${product.name}</div>
      ${nav.map(([id, name, n]) => `<div class="tk-nav${id === active ? " on" : ""}" data-nav="${id}">${ICON[id] || ""}${name}<span class="n">${n}</span></div>`).join("")}
      <div class="tk-me"><span class="tk-av" style="background:${user.color}">${user.initials}</span>${user.name}</div></div>
    <div class="tk-main"><div class="tk-h1">${title}</div><div class="tk-sub">${sub}</div></div></div>`;
  return { app: screen.firstChild, side: screen.querySelector(".tk-side"), main: screen.querySelector(".tk-main") };
}

/** HTML for one list row. chips: [{ text, cls?: "grey"|"warn" }] or [{ type: "person", text, initials, color }] */
export function row(title, chips = [], { done = false, cls = "" } = {}) {
  const c = chips.map((x) => x.type === "person"
    ? `<span class="tk-chip person"><span class="tk-av" style="background:${x.color || "var(--accent)"}">${x.initials || "?"}</span>${x.text}</span>`
    : `<span class="tk-chip ${x.cls || ""}">${x.text}</span>`).join("");
  return `<div class="tk-row${done ? " done" : ""} ${cls}"><span class="tk-box"></span><span class="tk-tt">${title}</span>${c}</div>`;
}

/** A macOS-style pointer with a click ripple, placed in `parent`'s pixel space. Call it in build(). */
export function cursor(parent) {
  injectKit();
  const rip = document.createElement("div"); rip.className = "tk-rip";
  const cur = document.createElement("div"); cur.className = "tk-cur";
  cur.innerHTML = '<svg width="30" height="30" viewBox="0 0 30 30"><path d="M4 3 L4 24 L9.5 18.8 L13.2 27 L16.8 25.4 L13.2 17.4 L20.5 17.4 Z" fill="#111" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>';
  parent.appendChild(rip); parent.appendChild(cur);
  /** In render(): keyframes [[t, x, y], ...] and click times [t, ...] at local time lt. `show` fades it. */
  return function track(lt, frames, clicks = [], show = 1) {
    const [x, y] = KF(lt, frames);
    const c = clicks.find((ct) => lt >= ct - .12 && lt <= ct + .6);
    const down = c !== undefined && lt >= c - .08 && lt <= c + .1;
    const rp = c !== undefined ? prog(lt, c, c + .55) : 0;
    cur.style.transform = `translate(${x}px, ${y}px) scale(${down ? .86 : 1})`;
    cur.style.opacity = show;
    rip.style.left = x + 3 + "px"; rip.style.top = y + 3 + "px";
    rip.style.opacity = c !== undefined && lt >= c ? (1 - rp) * show : 0;
    rip.style.transform = `scale(${lerp(.3, 1.5, ease.out(rp))})`;
    return { x, y, down };
  };
}
