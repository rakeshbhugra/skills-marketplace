/* Video formats: how the story is told from start to end. */
(() => {
  const { prog, io, vis, lerp, clamp, ease, KF, S, rnd, typed } = G;

  /* ---------- shared bits (CSS gets each item's own prefix) ---------- */
  const BASE = `
  & { position:absolute; inset:0; overflow:hidden; background:#f6f5f2; color:#18181b; font-family:Inter,-apple-system,system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
  & * { box-sizing:border-box; }
  & .a { position:absolute; }
  & .b { position:absolute; height:6px; border-radius:3px; background:#e7e5e0; }
  & .b.w { background:#c8c5be; }
  & .b.p { background:#2563eb; }
  & .b.q { background:#0d9488; }
  & .cd { position:absolute; background:#fff; border:1px solid #e5e3de; border-radius:9px; box-shadow:0 1px 3px rgba(24,24,27,.05); }
  & .av { position:absolute; border-radius:50%; background:linear-gradient(135deg,#2563eb,#0d9488); }
  & .scr { position:absolute; left:0; top:0; width:320px; height:200px; transform-origin:0 0; background:#f6f5f2; overflow:hidden; }
  `;
  const mount = (el, cls, css, html) => {
    el.innerHTML = `<style>${(BASE + css).replaceAll("&", "." + cls)}</style><div class="${cls}">${html}</div>`;
    return el.firstElementChild.nextElementSibling;
  };
  const q = (el, s) => el.querySelector(s);
  const qa = (el, s) => [...el.querySelectorAll(s)];
  const bx = (x, y, w, h, c = "", st = "", inner = "") =>
    `<div class="a ${c}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${st}">${inner}</div>`;
  const bar = (x, y, w, c = "", h = 6) => `<div class="b ${c}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`;
  const barsSvg = (w, h, vals, col = "#2563eb", cls = "") => {
    const g = w / vals.length;
    return `<svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;overflow:visible">${vals
      .map((v, i) => `<rect x="${(i * g + g * 0.2).toFixed(1)}" y="${(h - v * h).toFixed(1)}" width="${(g * 0.6).toFixed(1)}" height="${(v * h).toFixed(1)}" rx="2" fill="${col}" opacity="${(0.45 + 0.55 * v).toFixed(2)}"/>`)
      .join("")}</svg>`;
  };
  const linePath = (w, h, vals) => vals.map((v, i) => `${i ? "L" : "M"}${((i / (vals.length - 1)) * w).toFixed(1)} ${(h - v * h).toFixed(1)}`).join(" ");
  const lineSvg = (w, h, vals, col = "#0d9488", area = true) =>
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;overflow:visible">${
      area ? `<path d="${linePath(w, h, vals)} L${w} ${h} L0 ${h} Z" fill="${col}" opacity=".14"/>` : ""
    }<path d="${linePath(w, h, vals)}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  /* mock app screens, drawn at 320x200 and scaled to width w */
  const SCR = {
    dash: () =>
      bx(0, 0, 58, 200, "", "background:#f6f5f2;border-right:1px solid #e5e3de") +
      bx(14, 14, 16, 16, "av", "border-radius:5px") +
      [0, 1, 2, 3, 4].map((i) => bar(14, 46 + i * 17, 30 - rnd(i) * 10, i ? "" : "p")).join("") +
      bar(72, 18, 80, "w", 8) + bx(288, 13, 18, 18, "av") +
      [0, 1, 2].map((i) => bx(72 + i * 80, 40, 72, 44, "cd", "", bar(8, 9, 30) + bar(8, 22, 42, i ? "w" : "p", 10))).join("") +
      bx(72, 94, 150, 94, "cd", "", bar(10, 10, 50) + `<div class="a" style="left:10px;top:28px;width:130px;height:56px">${barsSvg(130, 56, [0.4, 0.55, 0.45, 0.7, 0.6, 0.85, 0.75, 0.95])}</div>`) +
      bx(230, 94, 78, 94, "cd", "", [0, 1, 2, 3].map((i) => bx(8, 10 + i * 20, 10, 10, "av") + bar(24, 12 + i * 20, 40 - i * 5)).join("")),
    list: () =>
      bar(16, 16, 90, "w", 8) + bx(232, 11, 72, 18, "", "border-radius:6px;background:#2563eb") +
      bx(16, 40, 288, 20, "", "border-radius:6px;background:#fff;border:1px solid #e5e3de") +
      [0, 1, 2, 3, 4].map((i) =>
        bx(16, 70 + i * 25, 288, 21, "", `border-bottom:1px solid #efeee9`,
          bx(2, 3, 14, 14, "av", `filter:hue-rotate(-${i * 40}deg)`) + bar(24, 4, 70 + rnd(i) * 40, "w", 5) + bar(24, 12, 50, "", 4) +
          bx(236, 4, 48, 12, "", `border-radius:6px;background:${["#d5f0ec", "#fde6d8", "#dde7fb"][i % 3]}`, bar(8, 3, 32, "", 6))
        )).join(""),
    kanban: () =>
      bar(16, 16, 80, "w", 8) + [0, 1, 2].map((c) =>
        bx(14 + c * 100, 38, 92, 152, "", "border-radius:8px;background:#efeee9",
          bar(8, 9, 36, c === 1 ? "p" : "") +
          [0, 1, 2].slice(0, 3 - (c === 2 ? 1 : 0)).map((k) =>
            bx(6, 24 + k * 42, 80, 36, "cd", "border-radius:6px", bar(7, 8, 50 - k * 8, "w", 5) + bar(7, 18, 36) + bx(62, 22, 10, 10, "av"))
          ).join(""))
      ).join(""),
    chart: () =>
      bar(16, 16, 100, "w", 8) + bar(16, 30, 60) +
      bx(16, 46, 288, 140, "cd", "", `<div class="a" style="left:14px;top:16px;width:260px;height:104px">${lineSvg(260, 104, [0.2, 0.35, 0.3, 0.5, 0.45, 0.68, 0.62, 0.9])}${lineSvg(260, 104, [0.1, 0.18, 0.22, 0.2, 0.3, 0.34, 0.4, 0.46], "#2563eb", false)}</div>`),
    form: () =>
      bar(24, 46, 80, "w", 10) + bar(24, 64, 110) + bar(24, 76, 90) +
      bx(168, 24, 132, 152, "cd", "",
        [0, 1, 2].map((i) => bar(12, 14 + i * 36, 40, "", 5) + bx(12, 24 + i * 36, 108, 18, "", "border-radius:5px;border:1px solid #e5e3de;background:#f6f5f2")).join("") +
        bx(12, 122, 108, 20, "", "border-radius:6px;background:#2563eb")),
  };
  const screen = (kind, w) => `<div class="scr" style="transform:scale(${w / 320})">${SCR[kind]()}</div>`;

  /* phone screens, drawn at 100x200 */
  const PH = [
    () => bar(10, 14, 40, "w", 6) + bx(10, 30, 80, 54, "", "border-radius:10px;background:linear-gradient(135deg,#2563eb,#0d9488)", bar(8, 10, 30, "w", 5) + bar(8, 28, 50, "w", 10)) +
      [0, 1, 2, 3].map((i) => bx(10, 96 + i * 24, 80, 18, "", "", bx(0, 2, 14, 14, "av") + bar(20, 4, 44, "w", 4) + bar(20, 11, 30, "", 4))).join(""),
    () => bar(10, 14, 50, "w", 6) + bx(10, 34, 56, 22, "", "border-radius:9px;background:#efeee9") + bx(34, 64, 56, 30, "", "border-radius:9px;background:#2563eb") +
      bx(10, 102, 62, 22, "", "border-radius:9px;background:#efeee9") + bx(10, 168, 80, 18, "", "border-radius:9px;border:1px solid #e5e3de"),
    () => bar(10, 14, 36, "w", 6) + bx(10, 32, 80, 80, "cd", "", `<div class="a" style="left:8px;top:10px;width:64px;height:60px">${barsSvg(64, 60, [0.4, 0.6, 0.5, 0.8, 0.95], "#0d9488")}</div>`) +
      bar(10, 124, 70, "w", 5) + bar(10, 134, 50) + bx(10, 166, 80, 20, "", "border-radius:8px;background:#2563eb"),
  ];

  /* camera keyframes [t, cx, cy, scale]: zoom is geometric and the target point slides in steadily */
  const cam = (t, f) => {
    if (t <= f[0][0]) return f[0].slice(1);
    for (let i = 0; i < f.length - 1; i++) {
      const [t0, ax, ay, as] = f[i], [t1, bx, by, bs] = f[i + 1];
      if (t > t1) continue;
      const x = ease.inOut((t - t0) / (t1 - t0)), sc = as * Math.pow(bs / as, x), k = ((1 - x) * as) / sc;
      return [bx - k * (bx - ax), by - k * (by - ay), sc];
    }
    return f[f.length - 1].slice(1);
  };
  const add = (o) => GALLERY.add({ section: "formats", ...o });

  /* 1 ---------- Infinite canvas flow ---------- */
  add({
    id: "canvas-flow",
    title: "Infinite canvas flow",
    desc: "All the steps sit on one big canvas, joined by glowing paths. The camera starts on the whole flow, then flies into one step at a time.",
    bestFor: ["How it works", "End-to-end flows"],
    loop: 7,
    build(el) {
      const P = [[40, 80], [360, 80], [680, 80], [1000, 80], [1000, 440], [680, 440], [360, 440]];
      const kinds = ["form", "dash", "list", "kanban", "chart", "dash", "list"];
      const names = ["Sign up", "Connect", "Import", "Plan", "Track", "Report", "Share"];
      let paths = "";
      for (let i = 0; i < 6; i++) {
        const [x, y] = P[i], [nx, ny] = P[i + 1];
        const d = i < 3 ? `M${x + 240} ${y + 90} C${x + 280} ${y + 90} ${nx - 40} ${ny + 90} ${nx} ${ny + 90}`
          : i === 3 ? `M${x + 120} ${y + 180} C${x + 120} ${y + 250} ${nx + 120} ${ny - 70} ${nx + 120} ${ny}`
          : `M${x} ${y + 90} C${x - 40} ${y + 90} ${nx + 280} ${ny + 90} ${nx + 240} ${ny + 90}`;
        paths += `<path d="${d}" class="pb"/><path d="${d}" class="pf"/>`;
      }
      const cards = P.map(([x, y], i) => `<div class="a fc" style="left:${x}px;top:${y}px"><div class="fh"><span class="n">${i + 1}</span>${names[i]}</div><div class="a fs">${screen(kinds[i], 224)}</div></div>`).join("");
      mount(el, "fm-cf", `
        & .w { position:absolute; left:0; top:0; width:1280px; height:700px; transform-origin:0 0; background-image:radial-gradient(rgba(24,24,27,.08) 1.6px, transparent 1.6px); background-size:32px 32px; }
        & svg.ln { position:absolute; left:0; top:0; overflow:visible; }
        & .pb { fill:none; stroke:#2563eb; stroke-width:6; opacity:.16; }
        & .pf { fill:none; stroke:#2563eb; stroke-width:3; stroke-dasharray:10 30; stroke-linecap:round; }
        & .fc { width:240px; height:180px; border-radius:14px; background:#fff; border:2px solid #e5e3de; overflow:hidden; box-shadow:0 20px 40px rgba(24,24,27,.10); }
        & .fh { height:30px; display:flex; align-items:center; gap:8px; padding:0 10px; font-size:13px; font-weight:650; color:#18181b; }
        & .n { width:18px; height:18px; border-radius:50%; background:#2563eb; color:#fff; font-size:11px; font-weight:700; display:grid; place-items:center; }
        & .fs { left:8px; top:30px; width:224px; height:140px; border-radius:8px; overflow:hidden; }
        & .vg { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse at center, transparent 60%, rgba(24,24,27,.08)); }
      `, `<div class="w"><svg class="ln" width="1280" height="700">${paths}</svg>${cards}</div><div class="vg"></div>`);
    },
    render(el, t) {
      const [cx, cy, s] = cam(t, [[0, 640, 350, 0.36], [1.0, 640, 350, 0.36], [2.0, 480, 170, 1.4], [2.9, 480, 170, 1.4], [3.6, 640, 350, 0.62], [4.3, 800, 530, 1.4], [5.2, 800, 530, 1.4], [6.2, 640, 350, 0.36], [7, 640, 350, 0.36]]);
      S(q(el, ".w"), { transform: `translate(${240 - cx * s}px,${135 - cy * s}px) scale(${s})` });
      qa(el, ".pf").forEach((p) => (p.style.strokeDashoffset = -t * 80));
      const hl = [0, vis(t, 1.6, 3.2, 0.4), 0, 0, 0, vis(t, 3.9, 5.6, 0.4), 0];
      qa(el, ".fc").forEach((c, i) => S(c, { borderColor: `rgba(37,99,235,${0.12 + hl[i] * 0.88})`, boxShadow: `0 20px 40px rgba(24,24,27,.10), 0 0 ${hl[i] * 30}px rgba(37,99,235,${hl[i] * 0.22})` }));
    },
  });

  /* 2 ---------- Feature tour ---------- */
  const TOUR = [["Plan your week", "kanban"], ["Track every task", "list"], ["See what matters", "dash"], ["Share the results", "chart"]];
  add({
    id: "feature-tour",
    title: "Feature tour",
    desc: "One feature per scene, full screen, one after another. A slide moves you on and a counter shows how far along you are.",
    bestFor: ["Product overview", "Onboarding", "Sales demos"],
    loop: 8,
    build(el) {
      const sc = [...TOUR, TOUR[0]].map(([title, kind], i) => `<div class="a sc" style="left:${i * 480}px">
          <div class="a tx"><div class="eb">Feature ${String((i % 4) + 1).padStart(2, "0")}</div><div class="tt">${title}</div>${bar(0, 78, 130)}${bar(0, 90, 100)}</div>
          <div class="a br"><div class="tb"><i></i><i></i><i></i></div><div class="a bs">${screen(kind, 240)}</div></div></div>`).join("");
      mount(el, "fm-ft", `
        & { background:radial-gradient(ellipse at 75% 40%, #e8effc, #f6f5f2 70%); }
        & .st { position:absolute; left:0; top:0; height:270px; width:2400px; }
        & .sc { top:0; width:480px; height:270px; }
        & .tx { left:30px; top:86px; width:170px; }
        & .eb { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#2563eb; }
        & .tt { font-size:23px; font-weight:800; letter-spacing:-.6px; line-height:1.1; margin-top:8px; width:160px; }
        & .tx .b { position:absolute; }
        & .br { left:206px; top:52px; width:250px; height:170px; border-radius:10px; background:#fff; border:1px solid #e5e3de; overflow:hidden; box-shadow:0 24px 50px rgba(24,24,27,.12), 0 0 40px rgba(37,99,235,.08); }
        & .tb { height:18px; display:flex; gap:4px; align-items:center; padding-left:8px; }
        & .tb i { width:6px; height:6px; border-radius:50%; background:#d6d3cc; }
        & .bs { left:5px; top:18px; width:240px; height:150px; border-radius:5px; overflow:hidden; }
        & .seg { position:absolute; top:20px; height:3px; width:76px; border-radius:2px; background:#e7e5e0; overflow:hidden; }
        & .seg i { position:absolute; inset:0; background:#2563eb; transform-origin:0 0; }
        & .ct { position:absolute; right:24px; top:12px; font-size:12px; font-weight:700; color:#18181b; background:#fff; border:1px solid #e5e3de; padding:4px 9px; border-radius:999px; font-variant-numeric:tabular-nums; }
      `, `<div class="st">${sc}</div>${[0, 1, 2, 3].map((i) => `<div class="seg" style="left:${30 + i * 82}px"><i></i></div>`).join("")}<div class="ct">1 / 4</div>`);
    },
    render(el, t) {
      const i = Math.floor(t / 2), lt = t - i * 2;
      const pos = i + io(lt, 1.45, 2, ease.inOut);
      S(q(el, ".st"), { transform: `translateX(${-pos * 480}px)` });
      qa(el, ".sc").forEach((sc, k) => {
        const d = k - pos;
        S(q(sc, ".br"), { transform: `translateX(${d * 90}px) perspective(800px) rotateY(${-8 + d * 10}deg)` });
        S(q(sc, ".tx"), { transform: `translateX(${d * 30}px)`, opacity: 1 - Math.min(1, Math.abs(d) * 1.4) });
      });
      const cur = Math.round(pos) % 4;
      q(el, ".ct").textContent = `${cur + 1} / 4`;
      qa(el, ".seg i").forEach((s, k) => (s.style.transform = `scaleX(${k < i % 4 ? 1 : k === i % 4 ? prog(lt, 0, 1.9) : 0})`));
    },
  });

  /* 3 ---------- Kinetic type promo ---------- */
  const KIN = [
    [0, 0.95, "w", "Faster.", "d"], [0.95, 1.5, "u", "dash"], [1.5, 2.45, "w", "Smarter.", "p"],
    [2.45, 3.0, "u", "list"], [3.0, 3.95, "w", "Yours.", "g"], [3.95, 4.5, "u", "kanban"], [4.5, 6.01, "l"],
  ];
  add({
    id: "kinetic-promo",
    title: "Kinetic type promo",
    desc: "Big bold words slam onto the screen one at a time, with quick cuts to flashes of the product in between.",
    bestFor: ["Launches", "Social clips", "Teasers"],
    loop: 6,
    build(el) {
      const segs = KIN.map(([, , k, v, st]) =>
        k === "w" ? `<div class="sg wd ${st}"><span>${v}</span></div>`
          : k === "u" ? `<div class="sg ui"><div class="a sh">${screen(v, 360)}</div><div class="fl"></div></div>`
          : `<div class="sg lk"><div class="ln">Faster.</div><div class="ln">Smarter.</div><div class="ln g">Yours.</div></div>`).join("");
      mount(el, "fm-kp", `
        & .sg { position:absolute; inset:0; display:none; align-items:center; justify-content:center; overflow:hidden; }
        & .wd span { font-size:84px; font-weight:900; letter-spacing:-4px; line-height:1; display:block; }
        & .wd.p { background:#2563eb; }
        & .wd.p span { color:#fff; }
        & .wd.g span, & .ln.g { background:linear-gradient(90deg,#2563eb,#0d9488); -webkit-background-clip:text; background-clip:text; color:transparent; }
        & .ui { background:#f6f5f2; perspective:700px; }
        & .sh { left:60px; top:22px; width:360px; height:225px; border-radius:12px; overflow:hidden; border:1px solid #e5e3de; box-shadow:0 30px 60px rgba(24,24,27,.18); }
        & .fl { position:absolute; inset:0; background:#fff; }
        & .lk { flex-direction:column; gap:0; }
        & .ln { font-size:44px; font-weight:900; letter-spacing:-2px; line-height:1.05; }
      `, segs);
    },
    render(el, t) {
      const segs = qa(el, ".sg");
      KIN.forEach(([a, b, k], i) => {
        const on = t >= a && t < b, s = segs[i];
        s.style.display = on ? "flex" : "none";
        if (!on) return;
        const u = t - a;
        if (k === "w") {
          const land = io(u, 0, 0.2, ease.out), shake = u > 0.2 ? Math.sin(u * 90) * 5 * (1 - prog(u, 0.2, 0.42)) : 0;
          S(s.firstChild, { transform: `translateX(${shake}px) scale(${lerp(2.4, 1, land) + u * 0.07})`, opacity: prog(u, 0, 0.08), filter: `blur(${(1 - land) * 10}px)` });
        } else if (k === "u") {
          S(q(s, ".sh"), { transform: `translateZ(${lerp(120, 0, io(u, 0, 0.55))}px) rotateX(${lerp(14, 4, u / 0.55)}deg) rotateY(${lerp(-16, -6, u / 0.55)}deg)` });
          S(q(s, ".fl"), { opacity: 0.55 * (1 - prog(u, 0, 0.14)) });
        } else {
          qa(s, ".ln").forEach((l, j) => {
            const p = io(u, j * 0.14, j * 0.14 + 0.2);
            S(l, { opacity: prog(u, j * 0.14, j * 0.14 + 0.06), transform: `scale(${lerp(1.8, 1, p)})`, filter: `blur(${(1 - p) * 6}px)` });
          });
          S(s, { opacity: 1 - prog(t, 5.55, 6) });
        }
      });
    },
  });

  /* 4 ---------- Device showcase ---------- */
  add({
    id: "device-showcase",
    title: "Device showcase",
    desc: "The product runs on a laptop and a phone that turn slowly in 3D. The screens change as the story moves on.",
    bestFor: ["Landing page hero", "Multi-platform apps", "Launches"],
    loop: 8,
    build(el) {
      const lap = ["dash", "chart", "kanban"].map((k) => `<div class="a ls">${screen(k, 264)}</div>`).join("");
      const ph = PH.map((f) => `<div class="a ps"><div class="a" style="width:100px;height:200px;transform:scale(.74);transform-origin:0 0;background:#f6f5f2">${f()}</div></div>`).join("");
      mount(el, "fm-ds", `
        & { background:radial-gradient(ellipse at 50% 45%, #e8effc, #f6f5f2 68%); perspective:900px; }
        & .rig { position:absolute; left:0; top:0; width:480px; height:270px; transform-style:preserve-3d; }
        & .lid { left:78px; top:30px; width:280px; height:176px; border-radius:12px; background:#dcdad5; border:1px solid #c8c5be; padding:6px; overflow:hidden; }
        & .scrn { position:absolute; left:8px; top:6px; width:264px; height:165px; border-radius:4px; overflow:hidden; background:#f6f5f2; }
        & .ls, & .ps { left:0; top:0; width:100%; height:100%; overflow:hidden; }
        & .base { left:56px; top:205px; width:324px; height:12px; background:linear-gradient(#e2e0db,#b8b5ae); clip-path:polygon(0 0,100% 0,96% 100%,4% 100%); border-radius:0 0 8px 8px; }
        & .notch { left:198px; top:205px; width:40px; height:4px; border-radius:0 0 4px 4px; background:#a8a59e; }
        & .phone { left:328px; top:72px; width:82px; height:160px; border-radius:16px; background:#dcdad5; border:2px solid #c8c5be; padding:4px; transform:translateZ(60px); box-shadow:-20px 30px 50px rgba(24,24,27,.18); }
        & .pscr { position:absolute; left:4px; top:4px; width:74px; height:148px; border-radius:12px; overflow:hidden; background:#f6f5f2; }
        & .shadow { left:60px; top:222px; width:380px; height:26px; border-radius:50%; background:radial-gradient(rgba(24,24,27,.18), transparent 70%); }
        & .shine { position:absolute; inset:0; background:linear-gradient(115deg, transparent 35%, rgba(255,255,255,.45) 50%, transparent 65%); pointer-events:none; }
      `, `<div class="a shadow"></div><div class="rig"><div class="a lid"><div class="scrn">${lap}<div class="shine"></div></div></div><div class="a base"></div><div class="a notch"></div>
         <div class="a phone"><div class="pscr">${ph}<div class="shine"></div></div></div></div>`);
    },
    render(el, t) {
      const a = Math.sin((t / 8) * Math.PI * 2);
      S(q(el, ".rig"), { transform: `translateZ(-40px) rotateX(${8 + Math.cos((t / 8) * Math.PI * 2) * 3}deg) rotateY(${a * 16}deg)` });
      const P = 8 / 3, swap = (els, off) => {
        const f = (t + off) / P, i = Math.floor(f) % 3, lt = (f - Math.floor(f)) * P, x = io(lt, P - 0.45, P, ease.inOut);
        els.forEach((e, k) => {
          const on = k === i ? 1 - x : k === (i + 1) % 3 ? x : 0;
          S(e, { opacity: on > 0 ? 1 : 0, transform: `translateY(${k === i ? -x * 30 : (1 - x) * 100}%)`, zIndex: k === i ? 1 : 2 });
        });
      };
      swap(qa(el, ".ls"), 0);
      swap(qa(el, ".ps"), 0.0);
      S(q(el, ".lid .shine"), { transform: `translateX(${a * 40}%)` });
      S(q(el, ".phone .shine"), { transform: `translateX(${a * 50}%)` });
    },
  });

  /* 5 ---------- Before / after ---------- */
  add({
    id: "before-after",
    title: "Before / after",
    desc: "The messy old way and the clean new way sit side by side. A divider sweeps across to show the change.",
    bestFor: ["Problem and solution", "Replacing a tool", "Ads"],
    loop: 7,
    build(el) {
      const wins = [[20, 30, 170, 110, -6, 3], [130, 70, 190, 120, 4, 12], [40, 140, 150, 100, 3, 0], [250, 24, 180, 110, -3, 7], [290, 130, 160, 115, 5, 0], [180, 160, 130, 90, -5, 2]];
      const chaos = wins.map(([x, y, w, h, r, n], i) => bx(x, y, w, h, "win", `transform:rotate(${r}deg)`,
        `<div class="wt"><i></i><i></i><i></i></div>` + [0, 1, 2, 3].map((k) => bar(10, 24 + k * 13, w * (0.35 + rnd(i * 7 + k) * 0.45))).join("") +
        (n ? `<div class="bd">${n === 12 ? "12" : n}</div>` : ""))).join("");
      mount(el, "fm-ba", `
        & .bf { position:absolute; inset:0; background:#e7e5e0; filter:grayscale(1); }
        & .win { background:#fafaf9; border:1px solid #d6d3cc; border-radius:8px; box-shadow:0 10px 24px rgba(24,24,27,.12); }
        & .wt { height:16px; display:flex; gap:3px; align-items:center; padding-left:7px; border-bottom:1px solid #e5e3de; }
        & .wt i { width:5px; height:5px; border-radius:50%; background:#c8c5be; }
        & .bd { position:absolute; right:-8px; top:-8px; min-width:20px; height:20px; padding:0 5px; border-radius:10px; background:#ef4444; color:#fff; font-size:11px; font-weight:800; display:grid; place-items:center; box-shadow:0 0 0 2px #e7e5e0; }
        & .bdw { position:absolute; inset:0; }
        & .af { position:absolute; inset:0; background:radial-gradient(ellipse at 60% 40%, #e8effc, #f6f5f2 70%); }
        & .aw { left:40px; top:22px; width:400px; height:250px; border-radius:12px; overflow:hidden; border:1px solid #e5e3de; box-shadow:0 20px 60px rgba(37,99,235,.14); }
        & .lb { position:absolute; top:12px; font-size:12px; font-weight:800; letter-spacing:.5px; padding:5px 11px; border-radius:999px; }
        & .lb.l { left:12px; background:#fff; color:#3f3f46; border:1px solid #d6d3cc; }
        & .lb.r { right:12px; background:#2563eb; color:#fff; }
        & .dv { position:absolute; top:0; bottom:0; width:2px; margin-left:-1px; background:#18181b; box-shadow:0 0 10px rgba(24,24,27,.2); }
        & .hd { position:absolute; top:121px; left:-14px; width:28px; height:28px; border-radius:50%; background:#fff; color:#18181b; border:1px solid #e5e3de; font-size:13px; font-weight:900; display:grid; place-items:center; box-shadow:0 4px 14px rgba(24,24,27,.2); }
      `, `<div class="bf"><div class="bdw">${chaos}</div></div>
         <div class="af"><div class="a aw">${screen("dash", 400)}</div></div>
         <div class="lb l">Before</div><div class="lb r">After</div><div class="dv"><div class="hd">‹›</div></div>`);
    },
    render(el, t) {
      const [x] = KF(t, [[0, 410], [0.7, 410], [1.9, 240], [3.0, 240], [4.0, 70], [5.0, 70], [6.3, 410], [7, 410]]);
      S(q(el, ".af"), { clipPath: `inset(0 0 0 ${x}px)` });
      S(q(el, ".dv"), { left: `${x}px` });
      S(q(el, ".lb.l"), { opacity: clamp((x - 80) / 40) });
      S(q(el, ".lb.r"), { opacity: clamp((400 - x) / 40) });
      qa(el, ".win").forEach((w, i) => (w.style.translate = `${Math.sin(t * 9 + i * 2) * 1.2}px ${Math.cos(t * 7 + i) * 1.2}px`));
      qa(el, ".bd").forEach((b, i) => (b.style.transform = `scale(${1 + 0.12 * Math.max(0, Math.sin(t * 6 + i * 1.7))})`));
    },
  });

  /* 6 ---------- One screen, deep zoom ---------- */
  const DZ = [[96, 48, 116, 52, 2.5, "Live totals"], [96, 112, 234, 146, 1.55, "Trend at a glance"], [388, 9, 76, 24, 2.8, "One-click export"]];
  add({
    id: "deep-zoom",
    title: "One screen, deep zoom",
    desc: "One detailed screen stays on view. The camera zooms into one part at a time, rings it and names it.",
    bestFor: ["Dashboards", "Single-page tools", "Feature detail"],
    loop: 8,
    build(el) {
      const stats = [["$84.2k", "#2563eb"], ["1,284", "#0d9488"], ["98.6%", "#ea580c"]].map(([v, c], i) =>
        bx(96 + i * 128, 48, 116, 52, "cd", "", bar(10, 9, 44, "", 5) + `<div class="a num" style="left:10px;top:20px">${v}</div>` +
          `<div class="a" style="left:76px;top:24px;width:30px;height:18px">${lineSvg(30, 18, [0.2, 0.5, 0.35, 0.7, 0.9].map((v) => v * (0.8 + i * 0.1)), c, false)}</div>`)).join("");
      const world =
        bx(0, 0, 80, 270, "", "background:#f6f5f2;border-right:1px solid #e5e3de") + bx(16, 14, 20, 20, "av", "border-radius:6px") +
        [0, 1, 2, 3, 4, 5].map((i) => bar(16, 52 + i * 22, 44 - rnd(i + 3) * 16, i === 1 ? "p" : "")).join("") +
        bar(96, 16, 110, "w", 9) + bx(388, 9, 76, 24, "", "border-radius:7px;background:#2563eb;color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center", "Export") +
        stats +
        bx(96, 112, 234, 146, "cd", "", bar(12, 12, 70, "w", 6) + bar(12, 23, 40, "", 4) + `<div class="a" style="left:12px;top:40px;width:208px;height:92px">${lineSvg(208, 92, [0.15, 0.3, 0.25, 0.45, 0.4, 0.6, 0.55, 0.78, 0.9])}</div>`) +
        bx(342, 112, 122, 146, "cd", "", bar(10, 12, 50, "w", 6) + [0, 1, 2, 3, 4].map((i) => bx(10, 30 + i * 22, 12, 12, "av", `filter:hue-rotate(-${i * 35}deg)`) + bar(28, 32 + i * 22, 56 - rnd(i) * 20, "", 5) + bar(92, 32 + i * 22, 18, i % 2 ? "q" : "p", 5)).join(""));
      mount(el, "fm-dz", `
        & .w { position:absolute; left:0; top:0; width:480px; height:270px; transform-origin:0 0; background:#f6f5f2; }
        & .num { font-size:17px; font-weight:800; letter-spacing:-.5px; }
        & .rg { position:absolute; border:2px solid #2563eb; border-radius:10px; box-shadow:0 0 0 9999px rgba(24,24,27,.28), 0 0 0 4px rgba(37,99,235,.18); }
        & .co { position:absolute; left:0; top:0; white-space:nowrap; font-size:13px; font-weight:750; color:#18181b; background:#fff; padding:6px 11px 6px 9px; border-radius:999px; box-shadow:0 8px 24px rgba(24,24,27,.2); display:flex; align-items:center; gap:7px; }
        & .co i { width:8px; height:8px; border-radius:50%; background:#2563eb; }
      `, `<div class="w">${world}${DZ.map(() => `<div class="rg"></div>`).join("")}</div>${DZ.map(([, , , , , l]) => `<div class="co"><i></i>${l}</div>`).join("")}`);
    },
    render(el, t) {
      const zc = DZ.map(([x, y, w, h, s]) => {
        const cx = clamp(x + w / 2, 240 / s, 480 - 240 / s), cy = clamp(y + h / 2, 135 / s, 270 - 135 / s);
        return [cx, cy, s];
      });
      const [cx, cy, s] = cam(t, [[0, 240, 135, 1], [0.7, 240, 135, 1], [1.5, ...zc[0]], [2.7, ...zc[0]], [3.5, ...zc[1]], [4.7, ...zc[1]], [5.5, ...zc[2]], [6.7, ...zc[2]], [7.5, 240, 135, 1], [8, 240, 135, 1]]);
      S(q(el, ".w"), { transform: `translate(${240 - cx * s}px,${135 - cy * s}px) scale(${s})` });
      const rings = qa(el, ".rg"), cos = qa(el, ".co");
      DZ.forEach(([x, y, w, h], i) => {
        const a = 1.4 + i * 2, o = vis(t, a, a + 1.4, 0.3), p = 4 / s;
        S(rings[i], { left: `${x - p}px`, top: `${y - p}px`, width: `${w + 2 * p}px`, height: `${h + 2 * p}px`, borderWidth: `${2 / s}px`, borderRadius: `${10 / s + 6}px`, opacity: o });
        const sx = (x + w / 2 - cx) * s + 240, by = (y + h + p - cy) * s + 135, ty = (y - p - cy) * s + 135;
        const yy = by + 10 < 236 ? by + 10 : ty - 40 > 0 ? ty - 40 : 222;
        S(cos[i], { opacity: o, transform: `translate(${clamp(sx, 80, 400)}px,${yy + (1 - io(t, a + 0.1, a + 0.5)) * 8}px) translateX(-50%)` });
      });
    },
  });

  /* 7 ---------- Cursor walkthrough ---------- */
  add({
    id: "cursor-walkthrough",
    title: "Cursor walkthrough",
    desc: "Looks like a polished screen recording. A cursor clicks through a task and the view zooms in on each click, then eases back out.",
    bestFor: ["Tutorials", "Help docs", "Show a workflow"],
    loop: 7,
    build(el) {
      const rows = [0, 1, 2, 3].map((i) => `<div class="rw">${bx(10, 6, 14, 14, "av", `filter:hue-rotate(-${i * 35}deg)`)}${bar(32, 7, 90 + rnd(i) * 50, "w", 5)}${bar(32, 15, 60, "", 4)}${bar(240, 10, 34, "", 6)}</div>`).join("");
      const win = bx(30, 15, 420, 240, "wn", "",
        `<div class="tb"><i></i><i></i><i></i></div>` + bx(0, 22, 92, 218, "", "background:#f6f5f2;border-right:1px solid #e5e3de") +
        bx(10, 36, 70, 22, "nb", "", "+ New") + [0, 1, 2, 3].map((i) => bar(12, 76 + i * 18, 44 - rnd(i) * 14)).join("") +
        bar(104, 34, 90, "w", 8) +
        `<div class="a ls" style="left:104px;top:54px;width:300px"><div class="nr"><div class="rw hi">${bx(10, 6, 14, 14, "av")}${bar(32, 7, 110, "w", 5)}${bar(32, 15, 70, "p", 4)}<div class="a tg">New</div></div></div>${rows}</div>` +
        bx(330, 202, 78, 24, "sv", "", "Save") +
        bx(10, 62, 124, 78, "mn", "", ["Project", "Task", "Doc"].map((s, i) => `<div class="mi">${bx(8, 8, 10, 10, "", `border-radius:3px;background:${["#2563eb", "#0d9488", "#ea580c"][i]}`)}<span>${s}</span></div>`).join("")));
      mount(el, "fm-cw", `
        & { background:#f6f5f2; }
        & .w { position:absolute; left:0; top:0; width:480px; height:270px; transform-origin:0 0; background:linear-gradient(135deg,#dbe7fb,#eef3fd 45%,#d5f0ec); }
        & .wn { border-radius:10px; background:#fff; overflow:hidden; box-shadow:0 24px 50px rgba(24,24,27,.16); border:1px solid #e5e3de; }
        & .tb { position:absolute; left:0; top:0; right:0; height:22px; display:flex; gap:5px; align-items:center; padding-left:9px; background:#f6f5f2; border-bottom:1px solid #e5e3de; }
        & .tb i { width:7px; height:7px; border-radius:50%; background:#d6d3cc; }
        & .nb { border-radius:6px; background:#2563eb; color:#fff; font-size:11px; font-weight:700; display:grid; place-items:center; }
        & .rw { position:relative; height:26px; border-bottom:1px solid #efeee9; }
        & .nr { overflow:hidden; height:0; }
        & .rw.hi { background:rgba(37,99,235,.07); }
        & .tg { left:240px; top:7px; font-size:10px; font-weight:700; color:#2563eb; background:rgba(37,99,235,.12); padding:1px 6px; border-radius:5px; }
        & .sv { border-radius:7px; background:#ebe9e4; font-size:11px; font-weight:700; display:grid; place-items:center; }
        & .mn { border-radius:8px; background:#fff; border:1px solid #e5e3de; box-shadow:0 12px 30px rgba(24,24,27,.14); padding:4px; transform-origin:30px 0; }
        & .mi { position:relative; height:23px; border-radius:5px; font-size:11px; font-weight:600; color:#18181b; }
        & .mi span { position:absolute; left:26px; top:5px; }
        & .cur { position:absolute; left:0; top:0; width:18px; height:22px; filter:drop-shadow(0 2px 3px rgba(0,0,0,.3)); }
        & .rp { position:absolute; width:40px; height:40px; margin:-20px 0 0 -20px; border-radius:50%; border:2px solid #2563eb; background:rgba(37,99,235,.15); }
      `, `<div class="w">${win}<div class="rp"></div><svg class="cur" viewBox="0 0 18 22"><path d="M1 1 L1 17 L5.5 13 L8.5 20 L11.5 18.6 L8.6 12 L14.5 12 Z" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`);
    },
    render(el, t) {
      const path = [[0, 330, 210], [0.3, 330, 210], [1.15, 75, 66], [1.6, 75, 66], [2.25, 104, 128], [2.6, 104, 128], [3.4, 389, 229], [3.95, 389, 229], [5.2, 330, 210], [7, 330, 210]];
      const [x, y] = KF(t, path), [lx, ly] = KF(t - 0.25, path);
      const [s] = KF(t, [[0, 1], [0.8, 1], [1.5, 1.9], [3.9, 1.9], [4.9, 1], [7, 1]]);
      const cx = clamp(lx, 240 / s, 480 - 240 / s), cy = clamp(ly, 135 / s, 270 - 135 / s);
      S(q(el, ".w"), { transform: `translate(${240 - cx * s}px,${135 - cy * s}px) scale(${s})` });
      const clicks = [1.3, 2.4, 3.7], cl = clicks.find((c) => t >= c && t < c + 0.5);
      const press = clicks.some((c) => t >= c - 0.06 && t < c + 0.1);
      S(q(el, ".cur"), { transform: `translate(${x - 1}px,${y - 1}px) scale(${press ? 0.82 : 1})` });
      if (cl !== undefined) {
        const p = (t - cl) / 0.5, [rx, ry] = KF(cl, path);
        S(q(el, ".rp"), { display: "block", left: `${rx}px`, top: `${ry}px`, transform: `scale(${0.3 + ease.out(p) * 0.9})`, opacity: 1 - p });
      } else S(q(el, ".rp"), { display: "none" });
      const mo = vis(t, 1.32, 2.5, 0.18), mp = io(t, 1.32, 1.55, ease.back);
      S(q(el, ".mn"), { opacity: mo, transform: `scale(${lerp(0.9, 1, mp)})` });
      qa(el, ".mi").forEach((m, i) => (m.style.background = i === 1 && t > 2.05 ? "rgba(37,99,235,.10)" : "transparent"));
      const nr = io(t, 2.5, 2.9) * (1 - prog(t, 6.3, 6.8));
      S(q(el, ".nr"), { height: `${nr * 26}px`, opacity: nr });
      const ok = t > 3.72 && t < 6.6 ? 1 - prog(t, 6.2, 6.6) : 0;
      const sv = q(el, ".sv");
      S(sv, { background: ok ? `rgba(13,148,136,${0.4 + ok * 0.6})` : "#ebe9e4", color: ok > 0.5 ? "#fff" : "#18181b", transform: `scale(${t > 3.7 && t < 3.85 ? 0.94 : 1})` });
      sv.textContent = ok > 0.5 ? "✓ Saved" : "Save";
    },
  });

  /* 8 ---------- Bento feature reel ---------- */
  const BENTO = [["Analytics", "1/3", "1/3"], ["Automations", "3/5", "1/2"], ["Team", "3/4", "2/3"], ["Alerts", "4/5", "2/3"], ["Secure", "1/2", "3/4"], ["Integrations", "2/5", "3/4"]];
  add({
    id: "bento-reel",
    title: "Bento feature reel",
    desc: "Many features shown at once in a grid of tiles. Each tile lights up and plays its own tiny animation in turn.",
    bestFor: ["Feature overview", "Landing pages", "Launches"],
    loop: 7,
    build(el) {
      const g = [
        `<div class="a gA">${barsSvg(190, 90, [0.35, 0.5, 0.42, 0.62, 0.55, 0.78, 0.7, 0.95], "#2563eb", "bs")}<svg class="a" width="190" height="90" style="left:0;top:0;overflow:visible"><path class="ln" d="${linePath(190, 90, [0.25, 0.35, 0.3, 0.5, 0.45, 0.65, 0.6, 0.85])}" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/></svg></div>`,
        `<div class="a gB"><div class="a tr"></div>${[0, 1, 2].map((i) => `<div class="a nd" style="left:${i * 70}px"></div>`).join("")}<div class="a pk"></div></div>`,
        `<div class="a gC">${[0, 1, 2].map((i) => `<div class="av ca" style="filter:hue-rotate(-${i * 60}deg)"></div>`).join("")}</div>`,
        `<div class="a gD"><svg width="30" height="32" viewBox="0 0 30 32"><path d="M15 3 C9 3 6 8 6 13 L6 20 L3 24 L27 24 L24 20 L24 13 C24 8 21 3 15 3 Z M11 26 C11 29 13 30 15 30 C17 30 19 29 19 26 Z" fill="#6b6b74"/></svg><div class="a bg">3</div></div>`,
        `<div class="a gE"><svg width="34" height="38" viewBox="0 0 34 38"><path d="M17 2 L31 7 L31 18 C31 27 24 33 17 36 C10 33 3 27 3 18 L3 7 Z" fill="rgba(37,99,235,.12)" stroke="#2563eb" stroke-width="2"/><path class="ck" d="M10 19 L15 24 L24 13" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1"/></svg></div>`,
        `<div class="a gF"><div class="a tr2"></div>${[0, 1, 2, 3].map((i) => `<div class="a ap" style="left:${i * 52}px"></div>`).join("")}</div>`,
      ];
      mount(el, "fm-bn", `
        & .grid { position:absolute; inset:14px; display:grid; grid-template-columns:repeat(4,1fr); grid-template-rows:repeat(3,1fr); gap:8px; }
        & .tl { position:relative; border-radius:12px; background:#fff; border:1px solid #e5e3de; overflow:hidden; box-shadow:0 1px 3px rgba(24,24,27,.05); }
        & .lbl { position:absolute; left:12px; bottom:9px; font-size:12px; font-weight:700; color:#18181b; }
        & .glow { position:absolute; inset:0; background:radial-gradient(circle at 70% 20%, rgba(37,99,235,.10), transparent 65%); }
        & .gA { left:16px; top:20px; width:190px; height:90px; }
        & .gB { left:22px; top:16px; width:180px; height:24px; }
        & .tr { left:12px; top:11px; width:140px; height:2px; background:#e7e5e0; }
        & .nd { top:0; width:24px; height:24px; border-radius:7px; background:#f6f5f2; border:2px solid #d6d3cc; }
        & .pk { left:0; top:6px; width:12px; height:12px; border-radius:50%; background:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,.18); }
        & .gC { left:14px; top:12px; width:80px; height:30px; }
        & .ca { top:0; width:28px; height:28px; border:2px solid #fff; }
        & .gD { left:16px; top:10px; width:40px; height:36px; }
        & .bg { left:20px; top:-3px; min-width:18px; height:18px; border-radius:9px; background:#ef4444; font-size:11px; font-weight:800; color:#fff; display:grid; place-items:center; box-shadow:0 0 0 2px #fff; }
        & .gE { left:16px; top:8px; width:34px; height:38px; }
        & .gF { left:130px; top:20px; width:180px; height:30px; }
        & .tr2 { left:12px; top:14px; width:160px; height:2px; background:#e7e5e0; }
        & .ap { top:0; width:30px; height:30px; border-radius:9px; background:#f6f5f2; border:1px solid #e5e3de; }
      `, `<div class="grid">${BENTO.map(([l, c, r], i) => `<div class="tl" style="grid-column:${c};grid-row:${r}"><div class="glow"></div>${g[i]}<div class="lbl">${l}</div></div>`).join("")}</div>`);
    },
    render(el, t) {
      const tiles = qa(el, ".tl"), dim = prog(t, 0.6, 0.95) * (1 - prog(t, 6.1, 6.5)), out = prog(t, 6.45, 7);
      const act = tiles.map((_, i) => vis(t, 0.85 + i * 0.88, 0.85 + (i + 1) * 0.88, 0.25));
      const g = tiles.map((_, i) => prog(t, 0.9 + i * 0.88, 1.6 + i * 0.88));
      tiles.forEach((tl, i) => {
        const e = io(t, i * 0.07, 0.45 + i * 0.07);
        S(tl, { opacity: e * (1 - out) * (1 - dim * 0.6 * (1 - act[i])), transform: `translateY(${(1 - e) * 14 + out * 6}px) scale(${1 + act[i] * 0.02})`, borderColor: `rgba(37,99,235,${0.1 + act[i] * 0.7})` });
        S(q(tl, ".glow"), { opacity: act[i] });
      });
      const gA = ease.out(g[0]);
      qa(el, ".bs rect").forEach((r, i) => (r.style.transform = `scaleY(${0.25 + 0.75 * ease.out(prog(g[0], i * 0.06, 0.5 + i * 0.06))})`, r.style.transformOrigin = "0 90px"));
      S(q(el, ".gA .ln"), { strokeDashoffset: 1 - gA });
      S(q(el, ".pk"), { left: `${6 + ease.inOut(g[1]) * 140}px` });
      qa(el, ".nd").forEach((n, i) => S(n, { borderColor: g[1] * 2 >= i * 0.98 && g[1] > 0 ? "#0d9488" : "#d6d3cc" }));
      qa(el, ".ca").forEach((c, i) => S(c, { left: `${i * lerp(10, 24, ease.back(g[2]))}px` }));
      S(q(el, ".bg"), { transform: `scale(${ease.back(prog(g[3], 0.1, 0.6))})` });
      S(q(el, ".gD svg"), { transform: `rotate(${Math.sin(g[3] * 18) * 14 * (1 - g[3])}deg)`, transformOrigin: "50% 10%" });
      S(q(el, ".ck"), { strokeDashoffset: 1 - ease.out(g[4]) });
      qa(el, ".ap").forEach((a, i) => { const p = prog(g[5], i * 0.18, i * 0.18 + 0.3); S(a, { background: `rgba(37,99,235,${0.15 + p * 0.65})`, transform: `translateY(${-Math.sin(p * Math.PI) * 5}px)` }); });
    },
  });

  /* 9 ---------- Stats and impact ---------- */
  const STATS = [[3.2, 1, "x", "faster onboarding"], [48, 0, "%", "fewer support tickets"], [12, 0, " min", "to first value"]];
  add({
    id: "stats-impact",
    title: "Stats and impact",
    desc: "Big numbers count up to show the results, with short labels and a chart that grows underneath.",
    bestFor: ["ROI story", "Case studies", "Investor updates"],
    loop: 7,
    build(el) {
      const vals = [0.18, 0.24, 0.22, 0.32, 0.36, 0.42, 0.5, 0.55, 0.62, 0.72, 0.82, 0.95];
      mount(el, "fm-si", `
        & { background:radial-gradient(ellipse at 50% 0%, #e8effc, #f6f5f2 70%); }
        & .all { position:absolute; inset:0; }
        & .st { position:absolute; top:28px; width:140px; text-align:center; }
        & .v { font-size:42px; font-weight:900; letter-spacing:-1.5px; line-height:1; font-variant-numeric:tabular-nums; }
        & .st:first-child .v { background:linear-gradient(90deg,#2563eb,#0d9488); -webkit-background-clip:text; background-clip:text; color:transparent; }
        & .l { font-size:11px; color:#6b6b74; margin-top:6px; font-weight:600; }
        & .ch { left:30px; top:132px; width:420px; height:116px; }
        & .bs rect { transform-origin:0 100px; }
      `, `<div class="all">${STATS.map(([, , , l], i) => `<div class="st" style="left:${30 + i * 140}px"><div class="v">0</div><div class="l">${l}</div></div>`).join("")}
        <div class="cd ch"><div class="a" style="left:16px;top:10px;width:388px;height:96px">${barsSvg(388, 96, vals, "#2563eb", "bs")}<svg class="a" width="388" height="96" style="left:0;top:0;overflow:visible"><path class="ln" d="${linePath(388, 96, vals.map((v) => v * 0.9 + 0.08))}" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/><circle class="dt" cx="388" cy="${96 - (0.95 * 0.9 + 0.08) * 96}" r="5" fill="#0d9488"/></svg></div></div></div>`);
    },
    render(el, t) {
      const out = prog(t, 6.4, 7);
      S(q(el, ".all"), { opacity: 1 - out, transform: `scale(${1 - out * 0.03})` });
      qa(el, ".st").forEach((s, i) => {
        const a = 0.2 + i * 0.3, p = io(t, a, a + 1.3);
        const [v, d, u] = STATS[i];
        q(s, ".v").textContent = (v * p).toFixed(d) + u;
        S(s, { opacity: prog(t, a, a + 0.3), transform: `translateY(${(1 - io(t, a, a + 0.5)) * 12}px)` });
      });
      S(q(el, ".ch"), { opacity: prog(t, 0.9, 1.3) });
      qa(el, ".bs rect").forEach((r, i) => (r.style.transform = `scaleY(${io(t, 1.1 + i * 0.07, 1.7 + i * 0.07)})`));
      S(q(el, ".ln"), { strokeDashoffset: 1 - io(t, 2.0, 3.2, ease.inOut) });
      const d = q(el, ".dt"), dp = prog(t, 3.1, 3.4);
      S(d, { opacity: dp, transform: `scale(${dp * (1 + 0.25 * Math.sin(t * 6))})`, transformOrigin: "388px 13px", transformBox: "view-box" });
    },
  });

  /* 10 ---------- Day in the life ---------- */
  const DAY = [["9:00", "Morning brief", 90], ["11:30", "Team sync", 240], ["15:00", "Ship the report", 390]];
  add({
    id: "day-in-life",
    title: "Day in the life",
    desc: "Follows one person through a working day. A timeline marks the hour and the screen above shows what they do with the product at that moment.",
    bestFor: ["Personas", "Daily workflows", "Brand stories"],
    loop: 8,
    build(el) {
      const sc = [
        bar(16, 40, 80, "w", 7) + [0, 1, 2, 3].map((i) => bx(16, 58 + i * 24, 268, 20, "", "border-bottom:1px solid #e5e3de", bx(0, 3, 6, 6, "", `border-radius:50%;background:${i < 2 ? "#2563eb" : "transparent"};top:7px`) + bx(14, 2, 14, 14, "av", `filter:hue-rotate(-${i * 40}deg)`) + bar(36, 4, 90 + rnd(i) * 60, i < 2 ? "w" : "", 5) + bar(36, 12, 60, "", 4))).join(""),
        [0, 1, 2, 3].map((i) => bx(16 + (i % 2) * 136, 36 + Math.floor(i / 2) * 68, 130, 62, "tile", "", bx(50, 14, 30, 30, "av", `filter:hue-rotate(-${i * 35}deg)`) + bar(8, 50, 34, "", 4))).join(""),
        bar(16, 40, 90, "w", 7) + bx(16, 56, 180, 100, "cd", "", `<div class="a" style="left:10px;top:12px;width:160px;height:74px">${barsSvg(160, 74, [0.3, 0.45, 0.4, 0.6, 0.72, 0.9], "#0d9488")}</div>`) +
          bx(206, 56, 78, 100, "", "", bar(0, 4, 60) + bar(0, 16, 46) + bar(0, 28, 54) + bx(0, 70, 78, 24, "snd", "", "Send")),
      ];
      mount(el, "fm-dl", `
        & .sky { position:absolute; inset:0; }
        & .sun { position:absolute; width:40px; height:40px; margin:-20px; border-radius:50%; background:radial-gradient(#ffe7b0, #f6b26b 60%, transparent 72%); filter:blur(.5px); opacity:.85; }
        & .sc { position:absolute; left:90px; top:16px; width:300px; height:172px; border-radius:12px; background:#fff; border:1px solid #e5e3de; overflow:hidden; box-shadow:0 20px 40px rgba(24,24,27,.12); }
        & .chip { position:absolute; left:16px; top:12px; font-size:11px; font-weight:700; color:#6b6b74; display:flex; gap:6px; align-items:center; }
        & .chip b { color:#fff; background:#2563eb; padding:2px 6px; border-radius:5px; font-size:11px; }
        & .tile { border-radius:8px; background:#f6f5f2; border:1px solid #e5e3de; }
        & .snd { border-radius:7px; background:#2563eb; color:#fff; font-size:11px; font-weight:700; display:grid; place-items:center; }
        & .trk { position:absolute; left:40px; top:226px; width:400px; height:3px; border-radius:2px; background:#e7e5e0; }
        & .fill { position:absolute; left:40px; top:226px; height:3px; border-radius:2px; background:linear-gradient(90deg,#2563eb,#0d9488); }
        & .tk { position:absolute; top:222px; width:11px; height:11px; margin-left:-5.5px; border-radius:50%; background:#fff; border:2px solid #d6d3cc; }
        & .tm { position:absolute; top:240px; width:60px; margin-left:-30px; text-align:center; font-size:12px; font-weight:700; color:#6b6b74; font-variant-numeric:tabular-nums; }
        & .mk { position:absolute; top:219px; width:17px; height:17px; margin-left:-8.5px; border-radius:50%; background:#fff; border:2px solid #2563eb; box-shadow:0 0 0 4px rgba(37,99,235,.18), 0 2px 8px rgba(24,24,27,.2); }
      `, `<div class="sky"></div><div class="sun"></div>${DAY.map(([tm, lb], i) => `<div class="sc"><div class="chip"><b>${tm}</b>${lb}</div>${sc[i]}</div>`).join("")}
        <div class="trk"></div><div class="fill"></div>${DAY.map(([tm, , x]) => `<div class="tk" style="left:${x}px"></div><div class="tm" style="left:${x}px">${tm}</div>`).join("")}<div class="mk"></div>`);
    },
    render(el, t) {
      const [x] = KF(t, [[0, 40], [0.6, 90], [2.4, 90], [3.0, 240], [4.8, 240], [5.4, 390], [7.2, 390], [7.9, 440]]);
      const fade = prog(t, 0, 0.3) * (1 - prog(t, 7.5, 7.95));
      S(q(el, ".mk"), { left: `${x}px`, opacity: fade });
      S(q(el, ".fill"), { width: `${x - 40}px`, opacity: fade });
      qa(el, ".tk").forEach((k, i) => S(k, { borderColor: x >= DAY[i][2] - 1 ? "#0d9488" : "#d6d3cc" }));
      qa(el, ".tm").forEach((k, i) => S(k, { color: Math.abs(x - DAY[i][2]) < 30 ? "#18181b" : "#6b6b74" }));
      const win = [[0.1, 2.9], [2.7, 5.3], [5.1, 7.8]];
      qa(el, ".sc").forEach((s, i) => {
        const [a, b] = win[i], o = vis(t, a, b, 0.35), d = t < (a + b) / 2 ? 1 - io(t, a, a + 0.5) : -io(t, b - 0.4, b, ease.inOut);
        S(s, { opacity: o, transform: `translateX(${d * 30}px) scale(${1 - Math.abs(d) * 0.03})` });
      });
      qa(el, ".tile .av").forEach((a, i) => S(a, { boxShadow: i === Math.floor(t * 1.5) % 4 ? "0 0 0 3px #2563eb" : "none" }));
      const day = clamp((x - 40) / 400), sx = lerp(30, 450, day), sy = 110 - Math.sin(day * Math.PI) * 85;
      S(q(el, ".sun"), { left: `${sx}px`, top: `${sy}px`, opacity: 0.8 * fade });
      S(q(el, ".sky"), { background: `linear-gradient(180deg, rgba(${Math.round(lerp(255, 219, Math.sin(day * Math.PI)))},${Math.round(lerp(232, 234, Math.sin(day * Math.PI)))},${Math.round(lerp(210, 254, Math.sin(day * Math.PI)))},.95), #f6f5f2 75%)` });
    },
  });

  /* 11 ---------- Chat-led demo ---------- */
  const ASK = "Show me signups this week", REPLY = "Signups are up 18% this week. Here is the trend:";
  add({
    id: "chat-first",
    title: "Chat-led demo",
    desc: "The story is told as a conversation. The user asks, the AI answers, and rich results like charts appear right inside the chat.",
    bestFor: ["AI products", "Assistants", "Support tools"],
    loop: 8,
    build(el) {
      mount(el, "fm-cf2", `
        & { background:radial-gradient(ellipse at 50% 30%, #e8effc, #f6f5f2 70%); }
        & .all { position:absolute; inset:0; }
        & .cw { left:80px; top:12px; width:320px; height:246px; border-radius:14px; background:#fff; border:1px solid #e5e3de; overflow:hidden; box-shadow:0 24px 50px rgba(24,24,27,.12); }
        & .hd { position:absolute; left:0; right:0; top:0; height:34px; border-bottom:1px solid #e5e3de; }
        & .th { position:absolute; left:12px; right:12px; top:34px; bottom:40px; display:flex; flex-direction:column; justify-content:flex-end; overflow:hidden; }
        & .it { overflow:hidden; flex:none; }
        & .bb { font-size:12px; line-height:1.35; padding:7px 10px; border-radius:12px; max-width:230px; }
        & .u { background:#2563eb; color:#fff; margin-left:auto; border-bottom-right-radius:4px; width:fit-content; }
        & .ai { display:flex; gap:7px; }
        & .ai .av { position:relative; width:20px; height:20px; flex:none; margin-top:2px; }
        & .ai .bb { background:#f3f2ef; color:#18181b; border-bottom-left-radius:4px; }
        & .dots { display:flex; gap:3px; padding:10px; background:#f3f2ef; border-radius:12px; }
        & .dots i { width:6px; height:6px; border-radius:50%; background:#a8a59e; }
        & .rc { position:relative; margin-left:27px; width:200px; height:86px; border-radius:10px; background:#fff; border:1px solid #e5e3de; }
        & .chg { position:absolute; right:10px; top:9px; font-size:11px; font-weight:800; color:#0d9488; background:rgba(13,148,136,.12); padding:2px 6px; border-radius:5px; }
        & .bs rect { transform-origin:0 50px; }
        & .chips { display:flex; gap:6px; margin-left:27px; }
        & .chips span { font-size:11px; font-weight:600; color:#2563eb; border:1px solid rgba(37,99,235,.3); border-radius:999px; padding:3px 9px; }
        & .in { position:absolute; left:10px; right:10px; bottom:8px; height:26px; border-radius:13px; background:#f6f5f2; border:1px solid #e5e3de; font-size:12px; color:#18181b; padding:5px 12px; white-space:nowrap; }
        & .caret { display:inline-block; width:1.5px; height:13px; background:#0d9488; vertical-align:-2px; margin-left:1px; }
        & .send { position:absolute; right:3px; top:3px; width:18px; height:18px; border-radius:50%; background:#2563eb; }
      `, `<div class="all"><div class="a cw"><div class="hd">${bx(12, 8, 18, 18, "av")}${bar(38, 11, 70, "w", 5)}${bar(38, 20, 40, "", 4)}</div>
        <div class="th">
          <div class="it i0"><div class="bb u">${ASK}</div></div>
          <div class="it i1"><div class="ai"><div class="av"></div><div class="dots"><i></i><i></i><i></i></div></div></div>
          <div class="it i2"><div class="ai"><div class="av"></div><div class="bb rp"></div></div></div>
          <div class="it i3"><div class="rc">${bar(10, 11, 60, "w", 5)}<div class="chg">+18%</div><div class="a" style="left:12px;top:28px;width:176px;height:50px">${barsSvg(176, 50, [0.35, 0.42, 0.4, 0.55, 0.6, 0.78, 0.95], "#2563eb", "bs")}</div></div></div>
          <div class="it i4"><div class="chips"><span>By source</span><span>Export</span></div></div>
        </div>
        <div class="in"><span class="tx"></span><span class="caret"></span><div class="send"></div></div></div></div>`);
    },
    render(el, t) {
      S(q(el, ".all"), { opacity: 1 - prog(t, 7.4, 8) });
      const sent = t >= 1.6;
      q(el, ".in .tx").textContent = sent ? "" : typed(ASK, t, 0.3, 21);
      S(q(el, ".caret"), { opacity: Math.floor(t * 3) % 2 || (t > 0.3 && t < 1.6) ? 1 : 0 });
      const H = [30, 34, 0, 94, 28], gap = 8;
      const show = (i, a, b = 99) => { const p = io(t, a, a + 0.35) * (1 - io(t, b, b + 0.25)); return p; };
      const p = [show(0, 1.6), show(1, 1.9, 2.35), show(2, 2.4), show(3, 3.75), show(4, 4.9)];
      const items = qa(el, ".it");
      const rp = q(el, ".rp");
      rp.textContent = typed(REPLY, t, 2.45, 42) || " ";
      H[2] = REPLY.length * Math.min(1, Math.max(0, (t - 2.45) * 42) / REPLY.length) > 33 ? 52 : 36;
      items.forEach((it, i) => S(it, { height: `${(H[i] + (i ? gap : 0)) * p[i]}px`, paddingTop: i ? `${gap * p[i]}px` : "0", opacity: p[i], transform: `translateY(${(1 - p[i]) * 8}px)` }));
      qa(el, ".dots i").forEach((d, i) => S(d, { transform: `translateY(${-Math.max(0, Math.sin(t * 12 - i * 1.2)) * 3}px)` }));
      qa(el, ".bs rect").forEach((r, i) => (r.style.transform = `scaleY(${io(t, 3.9 + i * 0.07, 4.4 + i * 0.07)})`));
    },
  });

  /* 12 ---------- 3D stack explainer ---------- */
  const LAYERS = [["Data", "#0f766e", "#14b8a6"], ["Engine", "#0d9488", "#2dd4bf"], ["API", "#1d4ed8", "#3b82f6"], ["Interface", "#2563eb", "#60a5fa"]];
  add({
    id: "stack-explainer",
    title: "3D stack explainer",
    desc: "The product is shown as layers stacked in 3D. They pull apart so each layer can be named, then click back together.",
    bestFor: ["Architecture", "Platform story", "Technical buyers"],
    loop: 7,
    build(el) {
      const slabs = LAYERS.map(([n, c1, c2], i) => `<div class="sl" style="--c1:${c1};--c2:${c2}">
          <div class="top">${[0, 1, 2].map((k) => `<div class="b" style="left:${18 + k * 56}px;top:${22 + (k % 2) * 8}px;width:${40}px;height:${i === 3 ? 30 : 8}px;border-radius:${i === 3 ? 5 : 4}px;background:rgba(255,255,255,${i === 3 ? 0.18 : 0.28})"></div>`).join("")}${bar(18, 92, 120, "", 6)}</div>
          <div class="fr"></div><div class="rt"></div><div class="lb">${n}</div></div>`).join("");
      mount(el, "fm-se", `
        & { background:radial-gradient(ellipse at 50% 60%, #e8effc, #f6f5f2 70%); perspective:1000px; }
        & .all { position:absolute; inset:0; transform-style:preserve-3d; }
        & .rig { position:absolute; left:210px; top:182px; width:0; height:0; transform-style:preserve-3d; }
        & .sl { position:absolute; left:-100px; top:-65px; width:200px; height:130px; transform-style:preserve-3d; }
        & .top { position:absolute; inset:0; border-radius:6px; background:linear-gradient(135deg,var(--c2),var(--c1)); border:1.5px solid rgba(255,255,255,.35); }
        & .fr { position:absolute; left:0; top:130px; width:200px; height:12px; background:var(--c1); filter:brightness(.6); transform-origin:0 0; transform:rotateX(-90deg); }
        & .rt { position:absolute; left:200px; top:0; width:12px; height:130px; background:var(--c1); filter:brightness(.8); transform-origin:0 0; transform:rotateY(90deg); }
        & .lb { position:absolute; left:206px; top:110px; white-space:nowrap; font-size:13px; font-weight:750; color:#18181b; padding:4px 10px; border-radius:7px; background:#fff; border:1px solid #e5e3de; box-shadow:0 4px 12px rgba(24,24,27,.12); }
      `, `<div class="all"><div class="rig">${slabs}</div></div>`);
    },
    render(el, t) {
      const rx = 58, rz = -38 + Math.sin((t / 7) * Math.PI * 2) * 6;
      const out = prog(t, 6.3, 6.9);
      S(q(el, ".rig"), { transform: `rotateX(${rx}deg) rotateZ(${rz}deg)` });
      S(q(el, ".all"), { opacity: 1 - out });
      const sep = io(t, 1.2, 2.1, ease.inOut) * (1 - io(t, 4.9, 5.7, ease.inOut));
      qa(el, ".sl").forEach((s, i) => {
        const d = io(t, 0.05 + i * 0.16, 0.6 + i * 0.16), z = i * lerp(14, 50, sep) + (1 - d) * 140 + out * 60;
        const hl = vis(t, 2.4 + (3 - i) * 0.6, 3.0 + (3 - i) * 0.6, 0.2);
        S(s, { transform: `translateZ(${z}px)`, opacity: prog(t, 0.05 + i * 0.16, 0.35 + i * 0.16) });
        S(q(s, ".top"), { boxShadow: `0 0 ${hl * 30}px rgba(37,99,235,${hl * 0.35}), inset 0 0 0 ${hl * 2}px #fff` });
        const lp = io(t, 1.7 + i * 0.08, 2.1 + i * 0.08) * (1 - prog(t, 4.75, 5.0));
        S(q(s, ".lb"), { opacity: lp, transform: `rotateZ(${-rz}deg) rotateX(${-rx}deg) translateX(${(1 - lp) * -8 + 8}px) scale(${1 + hl * 0.08})` });
      });
    },
  });

  /* 13 ---------- What's new release ---------- */
  const NEW = [["Dark mode"], ["Smart charts"], ["Shared spaces"]];
  add({
    id: "whats-new",
    title: "What's new release",
    desc: "A short release video. A title, then each new feature arrives as a numbered card with a tiny demo, ending on the version number.",
    bestFor: ["Release notes", "Changelog", "Customer updates"],
    loop: 8,
    build(el) {
      const vig = [
        `<div class="a v0"><div class="a tg"><i></i></div>${bar(10, 34, 60, "w", 5)}${bar(10, 44, 40, "", 5)}</div>`,
        `<div class="a v1">${barsSvg(96, 44, [0.35, 0.55, 0.45, 0.75, 0.95], "#0d9488", "bs")}</div>`,
        `<div class="a v2">${[0, 1, 2].map((i) => `<div class="av sa" style="filter:hue-rotate(-${i * 60}deg)"></div>`).join("")}<div class="a plus">+</div></div>`,
      ];
      mount(el, "fm-wn", `
        & { background:radial-gradient(ellipse at 20% 0%, #e8effc, #f6f5f2 65%); }
        & .all { position:absolute; inset:0; }
        & .ti { position:absolute; left:24px; top:18px; font-size:26px; font-weight:900; letter-spacing:-1px; }
        & .rn { position:absolute; left:174px; top:27px; font-size:11px; font-weight:700; color:#2563eb; background:rgba(37,99,235,.08); border:1px solid rgba(37,99,235,.25); padding:3px 8px; border-radius:999px; }
        & .nc { position:absolute; top:70px; width:136px; height:150px; border-radius:12px; background:#fff; border:1px solid #e5e3de; box-shadow:0 8px 20px rgba(24,24,27,.06); }
        & .no { position:absolute; left:12px; top:12px; width:22px; height:22px; border-radius:50%; background:#2563eb; color:#fff; font-size:12px; font-weight:800; display:grid; place-items:center; }
        & .vg { position:absolute; left:12px; top:44px; width:112px; height:62px; border-radius:8px; background:#f6f5f2; border:1px solid #e5e3de; overflow:hidden; }
        & .nt { position:absolute; left:12px; top:116px; font-size:13px; font-weight:750; }
        & .v0 { inset:0; }
        & .tg { left:10px; top:10px; width:30px; height:16px; border-radius:8px; background:#d6d3cc; }
        & .tg i { position:absolute; left:2px; top:2px; width:12px; height:12px; border-radius:50%; background:#fff; }
        & .v1 { left:8px; top:10px; width:96px; height:44px; }
        & .bs rect { transform-origin:0 44px; }
        & .v2 { left:14px; top:16px; width:90px; height:30px; }
        & .sa { top:0; width:28px; height:28px; border:2px solid #f6f5f2; }
        & .plus { top:4px; width:22px; height:22px; border-radius:50%; border:1.5px dashed #a8a59e; color:#6b6b74; font-size:14px; display:grid; place-items:center; }
        & .ver { position:absolute; left:50%; top:232px; margin-left:-34px; width:68px; height:26px; border-radius:999px; background:linear-gradient(90deg,#2563eb,#0d9488); color:#fff; font-size:13px; font-weight:900; display:grid; place-items:center; overflow:hidden; }
        & .sh { position:absolute; top:0; bottom:0; width:24px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent); }
      `, `<div class="all"><div class="ti">What's new</div><div class="rn">Release notes</div>
        ${NEW.map(([n], i) => `<div class="nc" style="left:${24 + i * 148}px"><div class="no">${i + 1}</div><div class="vg">${vig[i]}</div><div class="nt">${n}</div>${bar(12, 136, 80, "", 5)}</div>`).join("")}
        <div class="ver"><div class="sh"></div>v2.4</div></div>`);
    },
    render(el, t) {
      S(q(el, ".all"), { opacity: 1 - prog(t, 7.4, 8) });
      const tp = io(t, 0.1, 0.6);
      S(q(el, ".ti"), { opacity: tp, transform: `translateY(${(1 - tp) * 10}px)` });
      S(q(el, ".rn"), { opacity: io(t, 0.4, 0.8) });
      const cards = qa(el, ".nc");
      cards.forEach((c, i) => {
        const a = 0.8 + i * 0.9, p = io(t, a, a + 0.5, ease.back), o = prog(t, a, a + 0.25);
        S(c, { opacity: o, transform: `translateY(${(1 - p) * 26}px) scale(${lerp(0.94, 1, p)})`, borderColor: `rgba(37,99,235,${0.2 + vis(t, a, a + 1.2, 0.3) * 0.6})` });
      });
      const l0 = prog(t, 1.4, 1.65);
      S(q(el, ".tg"), { background: l0 > 0.5 ? "#2563eb" : "#d6d3cc" });
      S(q(el, ".tg i"), { left: `${2 + ease.inOut(l0) * 14}px` });
      S(q(el, ".v0"), { background: `rgba(${Math.round(lerp(246, 24, l0))},${Math.round(lerp(245, 24, l0))},${Math.round(lerp(242, 27, l0))},1)` });
      qa(el, ".v1 rect").forEach((r, i) => (r.style.transform = `scaleY(${io(t, 1.9 + i * 0.08, 2.4 + i * 0.08)})`));
      qa(el, ".sa").forEach((s, i) => S(s, { left: `${i * 18 * io(t, 2.8 + i * 0.1, 3.2 + i * 0.1, ease.back)}px`, opacity: prog(t, 2.75 + i * 0.1, 2.95 + i * 0.1) }));
      S(q(el, ".plus"), { left: `${54 * io(t, 3.1, 3.5)}px`, opacity: prog(t, 3.1, 3.4) });
      const vp = io(t, 3.9, 4.4, ease.back);
      S(q(el, ".ver"), { opacity: prog(t, 3.9, 4.1), transform: `scale(${lerp(0.6, 1, vp)})` });
      S(q(el, ".sh"), { left: `${lerp(-30, 90, prog(t, 4.5, 5.2))}px` });
    },
  });

  /* 14 ---------- Vertical teaser ---------- */
  const VT = [
    ["Still copying data by hand?", "hand?", (h) => `<div class="a sg">${[...Array(15)].map((_, i) => `<i style="opacity:${0.3 + rnd(i) * 0.5}"></i>`).join("")}</div>`],
    ["Just ask.", "ask.", () => `<div class="a cb"><div class="q1">Make my report</div><div class="q2">${bar(8, 9, 70, "w", 5)}${bar(8, 19, 50, "w", 5)}</div></div>`],
    ["Done in one tap", "tap", () => `<div class="a btn">Generate</div><div class="a tap"></div>`],
  ];
  add({
    id: "vertical-teaser",
    title: "Vertical teaser (9:16)",
    desc: "A tall video made for phones. Big captions, close-ups of the product and quick swipes from one shot to the next.",
    bestFor: ["Reels and TikTok", "Stories", "Ads"],
    loop: 7,
    build(el) {
      const clip = (i) => {
        const [cap, hl, ui] = VT[i % 3];
        return `<div class="a cl c${i % 3}" style="top:${i * 250}px">${ui()}<div class="cap">${cap.split(" ").map((w) => `<span class="${w === hl ? "hl" : ""}">${w}</span>`).join(" ")}</div></div>`;
      };
      const strip = [0, 1, 2, 3].map(clip).join("");
      mount(el, "fm-vt", `
        & { background:#f6f5f2; }
        & .bgc { position:absolute; left:0; top:-120px; width:480px; height:510px; filter:blur(22px); opacity:.7; }
        & .bgs { position:absolute; left:120px; top:0; width:140px; height:1000px; transform-origin:70px 0; }
        & .ph { position:absolute; left:169px; top:8px; width:142px; height:254px; border-radius:20px; border:3px solid #d6d3cc; background:#fff; overflow:hidden; box-shadow:0 20px 50px rgba(24,24,27,.18); }
        & .stp { position:absolute; left:0; top:0; width:136px; height:1000px; }
        & .cl { left:0; width:136px; height:250px; overflow:hidden; }
        & .c0 { background:linear-gradient(180deg,#ffffff,#f3f2ef); }
        & .c1 { background:linear-gradient(180deg,#eef3fd,#dbe7fb); }
        & .c2 { background:linear-gradient(180deg,#e6f6f4,#ccefe9); }
        & .cap { position:absolute; left:10px; right:10px; top:150px; font-size:19px; font-weight:900; line-height:1.1; letter-spacing:-.5px; text-align:center; }
        & .cap span { display:inline-block; }
        & .cap .hl { background:#2563eb; color:#fff; padding:0 4px; border-radius:4px; }
        & .sg { left:14px; top:36px; width:108px; height:90px; display:grid; grid-template-columns:repeat(3,1fr); gap:4px; }
        & .sg i { background:#c8c5be; border-radius:2px; }
        & .cb { left:10px; top:40px; width:116px; }
        & .q1 { margin-left:auto; width:fit-content; font-size:11px; font-weight:600; background:#2563eb; color:#fff; padding:6px 9px; border-radius:11px; border-bottom-right-radius:3px; }
        & .q2 { position:relative; margin-top:8px; width:96px; height:30px; background:#fff; border:1px solid #e5e3de; border-radius:11px; border-bottom-left-radius:3px; }
        & .btn { left:18px; top:62px; width:100px; height:36px; border-radius:18px; background:linear-gradient(90deg,#2563eb,#0d9488); color:#fff; font-size:13px; font-weight:800; display:grid; place-items:center; box-shadow:0 8px 24px rgba(37,99,235,.25); }
        & .tap { left:58px; top:70px; width:22px; height:22px; border-radius:50%; background:rgba(255,255,255,.55); border:2px solid #fff; }
        & .pg { position:absolute; top:7px; height:2.5px; width:38px; border-radius:2px; background:rgba(24,24,27,.12); overflow:hidden; }
        & .pg i { position:absolute; inset:0; background:#18181b; transform-origin:0 0; }
        & .tag { position:absolute; left:18px; bottom:16px; font-size:11px; font-weight:700; color:#6b6b74; border:1px solid #d6d3cc; padding:3px 8px; border-radius:6px; }
      `, `<div class="bgc"><div class="bgs">${strip}</div></div><div class="ph"><div class="stp">${strip}</div>${[0, 1, 2].map((i) => `<div class="pg" style="left:${8 + i * 42}px"><i></i></div>`).join("")}</div><div class="tag">9:16</div>`);
    },
    render(el, t) {
      const D = 7 / 3, i = Math.floor(t / D), lt = t - i * D;
      const pos = i + io(lt, D - 0.35, D, ease.inOut);
      S(q(el, ".stp"), { transform: `translateY(${-pos * 250}px)` });
      S(q(el, ".bgs"), { transform: `scale(3.4) translateY(${-pos * 250}px)` });
      qa(el, ".pg i").forEach((p, k) => (p.style.transform = `scaleX(${k < i ? 1 : k === i ? prog(lt, 0, D - 0.2) : 0})`));
      el.querySelectorAll(".cl").forEach((c) => {
        const k = +c.className.match(/c(\d)/)[1], idx = Math.round(parseFloat(c.style.top) / 250);
        const local = t - idx * D + (idx === 3 ? 0 : 0);
        const lc = idx === 3 ? t - 7 : local; // the copy of clip 0 at the end of the strip
        qa(c, ".cap span").forEach((w, j) => {
          const p = io(lc, 0.15 + j * 0.12, 0.4 + j * 0.12, ease.back);
          S(w, { opacity: prog(lc, 0.15 + j * 0.12, 0.25 + j * 0.12), transform: `scale(${lerp(0.5, 1, p)})` });
        });
        if (k === 2) {
          const tp = prog(lc, 0.9, 1.4);
          S(q(c, ".tap"), { transform: `scale(${0.6 + tp * 1.8})`, opacity: tp > 0 ? 1 - tp : 0 });
          S(q(c, ".btn"), { transform: `scale(${1 + 0.18 * Math.sin(Math.PI * prog(lc, 0.2, 0.9)) - (tp > 0 && tp < 0.3 ? 0.06 : 0)})` });
        }
        if (k === 1) S(q(c, ".q2"), { opacity: prog(lc, 0.6, 0.9), transform: `translateY(${(1 - io(lc, 0.6, 0.9)) * 8}px)` });
        if (k === 0) S(q(c, ".sg"), { transform: `scale(${1.15 - 0.15 * io(lc, 0, 2)}) rotate(${-3 + 3 * io(lc, 0, 2)}deg)` });
      });
    },
  });

  /* 15 ---------- Terminal and code demo ---------- */
  add({
    id: "terminal-demo",
    title: "Terminal and code demo",
    desc: "A terminal types a real command and the output streams in. Then the code sits next to the live result so you see one change the other.",
    bestFor: ["Developer tools", "APIs and SDKs", "Open source"],
    loop: 8,
    build(el) {
      const lines = [
        ["g", "▲ Building project…"],
        ["ok", "✓ Compiled 42 modules in 1.2s"],
        ["pr", ""],
        ["ac", "✓ Live at https://acme.app"],
      ];
      mount(el, "fm-td", `
        & { background:radial-gradient(ellipse at 50% 40%, #13202f, #0b0b0f 70%); color:#e7e7ea; }
        & .all { position:absolute; inset:0; }
        & .tm { position:absolute; left:50px; top:28px; width:380px; height:214px; border-radius:11px; background:#0e0e12; border:1px solid #27272a; overflow:hidden; box-shadow:0 24px 50px rgba(0,0,0,.6); }
        & .tb { height:24px; display:flex; gap:5px; align-items:center; padding-left:10px; background:#18181b; border-bottom:1px solid #27272a; font-size:11px; color:#a1a1aa; }
        & .tb i { width:8px; height:8px; border-radius:50%; background:#3f3f46; }
        & .tb i:nth-child(1) { background:#f87171; } & .tb i:nth-child(2) { background:#fbbf24; } & .tb i:nth-child(3) { background:#4ade80; }
        & .tb b { margin-left:auto; margin-right:auto; font-weight:600; transform:translateX(-20px); }
        & .bd, & .cd2 { font-family:ui-monospace,Menlo,monospace; font-size:12px; line-height:21px; padding:10px 14px; white-space:pre; }
        & .pm { color:#2dd4bf; } & .g { color:#a1a1aa; } & .ok { color:#4ade80; } & .ac { color:#60a5fa; }
        & .ln { opacity:0; }
        & .prb { display:inline-block; width:150px; height:7px; border-radius:4px; background:#27272a; vertical-align:0; margin:0 8px; position:relative; overflow:hidden; }
        & .prb i { position:absolute; inset:0; background:linear-gradient(90deg,#3b82f6,#2dd4bf); transform-origin:0 0; }
        & .cur { display:inline-block; width:7px; height:14px; background:#e7e7ea; vertical-align:-2px; }
        & .ed { position:absolute; left:16px; top:20px; width:248px; height:230px; border-radius:11px; background:#111114; border:1px solid #27272a; overflow:hidden; }
        & .cd2 { font-size:11.5px; line-height:20px; color:#d4d4d8; padding:8px 12px; }
        & .k { color:#60a5fa; } & .s { color:#86efac; } & .p { color:#5eead4; } & .n { color:#52525b; display:inline-block; width:16px; }
        & .hlr { position:absolute; left:0; right:0; height:20px; background:rgba(59,130,246,.16); border-left:2px solid #3b82f6; }
        & .rs { position:absolute; left:274px; top:20px; width:190px; height:230px; border-radius:11px; overflow:hidden; border:1px solid #27272a; }
        & .rb { height:24px; background:#18181b; border-bottom:1px solid #27272a; display:flex; align-items:center; gap:6px; padding:0 10px; font-size:10px; font-weight:700; color:#86efac; }
        & .rb i { width:7px; height:7px; border-radius:50%; background:#4ade80; }
        & .rv { position:absolute; left:0; right:0; top:24px; bottom:0; }
        & .rc { position:absolute; left:16px; top:20px; width:158px; height:100px; border-radius:10px; }
      `, `<div class="all">
        <div class="tm"><div class="tb"><i></i><i></i><i></i><b>zsh</b></div><div class="bd"><span class="pm">$ </span><span class="cmd"></span><span class="cur"></span>
${lines.map(([c, s]) => c === "pr" ? `<span class="ln g">  Uploading  <span class="prb"><i></i></span><span class="pct">0%</span></span>` : `<span class="ln ${c}">${s}</span>`).join("\n")}</div></div>
        <div class="ed"><div class="tb"><i></i><i></i><i></i><b>app.config.ts</b></div><div class="a hlr" style="top:92px"></div><div class="cd2"><span class="n">1</span><span class="k">export default</span> {
<span class="n">2</span>  <span class="p">name</span>: <span class="s">"acme"</span>,
<span class="n">3</span>  <span class="p">theme</span>: <span class="s th">"light"</span>,
<span class="n">4</span>  <span class="p">region</span>: <span class="s">"eu-west"</span>,
<span class="n">5</span>  <span class="p">cache</span>: <span class="k">true</span>,
<span class="n">6</span>}</div></div>
        <div class="rs"><div class="rb"><i></i>Live preview</div><div class="rv"><div class="rc">${bx(12, 12, 22, 22, "av")}${bar(42, 15, 70, "w", 6)}${bar(42, 26, 44, "", 5)}${bar(12, 50, 130, "", 5)}${bar(12, 62, 100, "", 5)}${bx(12, 76, 60, 16, "", "border-radius:5px;background:#2563eb")}</div>${bar(16, 136, 120, "", 5)}${bar(16, 148, 90, "", 5)}</div></div>
      </div>`);
    },
    render(el, t) {
      S(q(el, ".all"), { opacity: prog(t, 0, 0.3) * (1 - prog(t, 7.5, 8)) });
      const cmd = "npx acme deploy";
      q(el, ".cmd").textContent = typed(cmd, t, 0.35, 20);
      S(q(el, ".cur"), { opacity: t < 1.2 || Math.floor(t * 3) % 2 ? 1 : 0 });
      qa(el, ".ln").forEach((l, i) => S(l, { opacity: prog(t, 1.3 + i * 0.45, 1.4 + i * 0.45) }));
      const pr = io(t, 2.2, 2.9, ease.inOut);
      S(q(el, ".prb i"), { transform: `scaleX(${pr})` });
      q(el, ".pct").textContent = Math.round(pr * 100) + "%";
      const sw = io(t, 3.7, 4.4, ease.inOut);
      S(q(el, ".tm"), { opacity: 1 - sw, transform: `scale(${1 - sw * 0.08}) translateY(${-sw * 10}px)`, display: sw >= 1 ? "none" : "block" });
      S(q(el, ".ed"), { opacity: sw, transform: `translateX(${(1 - sw) * -30}px)` });
      S(q(el, ".rs"), { opacity: sw, transform: `translateX(${(1 - sw) * 30}px)` });
      const th = q(el, ".th"), sel = t > 4.8 && t < 5.1, ty = t >= 5.1 ? '"' + typed('dark"', t, 5.1, 12) : '"light"';
      th.textContent = ty;
      S(th, { background: sel ? "rgba(59,130,246,.45)" : "transparent" });
      S(q(el, ".hlr"), { opacity: vis(t, 4.6, 7.2, 0.3) });
      const dk = io(t, 5.75, 6.2);
      const mix = (a, b) => a.map((v, i) => Math.round(lerp(v, b[i], dk))).join(",");
      S(q(el, ".rv"), { background: `rgb(${mix([246, 245, 242], [24, 24, 27])})` });
      S(q(el, ".rc"), { background: `rgb(${mix([255, 255, 255], [39, 39, 42])})`, boxShadow: `0 6px 18px rgba(0,0,0,${0.08 + dk * 0.3})` });
      qa(el, ".rv .b:not(.w)").forEach((b) => (b.style.background = `rgba(${mix([27, 26, 34], [255, 255, 255])},${lerp(0.14, 0.16, dk)})`));
      qa(el, ".rv .b.w").forEach((b) => (b.style.background = `rgba(${mix([27, 26, 34], [255, 255, 255])},.6)`));
    },
  });

  /* 16 ---------- Data story ---------- */
  const DATA = [30, 36, 34, 44, 70, 86], MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  add({
    id: "data-story",
    title: "Data story",
    desc: "A chart builds itself step by step. Bars grow, a line draws, one point gets a note, and the takeaway lands as a headline.",
    bestFor: ["Analytics products", "Reports", "Board updates"],
    loop: 8,
    build(el) {
      const X0 = 70, W = 380, Y0 = 232, H = 140, g = W / 6;
      const yOf = (v) => Y0 - (v / 100) * H;
      const trend = DATA.map((v, i) => [X0 + g * i + g / 2, yOf(v + 6)]);
      const path = trend.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
      mount(el, "fm-dt", `
        & .all { position:absolute; inset:0; }
        & .hl { position:absolute; left:24px; top:14px; font-size:21px; font-weight:850; letter-spacing:-.6px; }
        & .hl b { background:linear-gradient(90deg,#2563eb,#0d9488); -webkit-background-clip:text; background-clip:text; color:transparent; }
        & .sub { position:absolute; left:24px; top:42px; font-size:11px; font-weight:600; color:#6b6b74; }
        & svg { position:absolute; left:0; top:0; overflow:visible; }
        & .gl { stroke:#e7e5e0; stroke-width:1; }
        & .yl, & .xl { fill:#6b6b74; font-size:10px; font-weight:600; font-family:Inter,-apple-system,system-ui,sans-serif; }
        & .br { fill:#2563eb; }
        & .an { position:absolute; left:0; top:0; font-size:11px; font-weight:800; color:#18181b; background:#fff; padding:4px 8px; border-radius:7px; white-space:nowrap; box-shadow:0 6px 18px rgba(24,24,27,.16); }
        & .an:after { content:""; position:absolute; left:50%; bottom:-4px; margin-left:-4px; width:8px; height:8px; background:#fff; transform:rotate(45deg); }
      `, `<div class="all"><div class="hl">Launch <b>doubled</b> weekly signups</div><div class="sub">Weekly signups, Jan to Jun</div>
        <svg width="480" height="270">
          ${[0, 25, 50, 75, 100].map((v) => `<line class="gl" x1="${X0}" x2="${X0 + W}" y1="${yOf(v)}" y2="${yOf(v)}"/><text class="yl" x="${X0 - 10}" y="${yOf(v) + 3.5}" text-anchor="end">${v}</text>`).join("")}
          ${DATA.map((v, i) => `<rect class="br" x="${X0 + g * i + g * 0.22}" y="${yOf(v)}" width="${g * 0.56}" height="${Y0 - yOf(v)}" rx="4" opacity="${i >= 4 ? 1 : 0.45}"/><text class="xl" x="${X0 + g * i + g / 2}" y="${Y0 + 16}" text-anchor="middle">${MON[i]}</text>`).join("")}
          <path class="tl" d="${path}" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1"/>
          <circle class="pr" cx="${trend[4][0]}" cy="${trend[4][1]}" r="12" fill="none" stroke="#0d9488" stroke-width="2"/>
          <circle class="pt" cx="${trend[4][0]}" cy="${trend[4][1]}" r="5" fill="#fff" stroke="#0d9488" stroke-width="2.5"/>
        </svg><div class="an" data-x="${trend[4][0]}" data-y="${trend[4][1]}">+64% after launch</div></div>`);
    },
    render(el, t) {
      S(q(el, ".all"), { opacity: 1 - prog(t, 7.4, 8) });
      qa(el, ".gl").forEach((l, i) => S(l, { strokeDasharray: "380", strokeDashoffset: 380 * (1 - io(t, 0.1 + i * 0.06, 0.7 + i * 0.06)) }));
      qa(el, ".yl").forEach((l, i) => S(l, { opacity: prog(t, 0.4 + i * 0.05, 0.7 + i * 0.05) }));
      qa(el, ".xl").forEach((l, i) => S(l, { opacity: prog(t, 0.6 + i * 0.05, 0.9 + i * 0.05) }));
      qa(el, ".br").forEach((b, i) => S(b, { transform: `scaleY(${io(t, 0.8 + i * 0.16, 1.4 + i * 0.16, ease.out)})`, transformOrigin: "0 232px", transformBox: "view-box" }));
      S(q(el, ".tl"), { strokeDashoffset: 1 - io(t, 2.0, 3.1, ease.inOut) });
      const pp = io(t, 3.1, 3.4, ease.back);
      S(q(el, ".pt"), { opacity: prog(t, 3.1, 3.2), transform: `scale(${pp})` });
      [q(el, ".pt"), q(el, ".pr")].forEach((c) => S(c, { transformOrigin: `${c.getAttribute("cx")}px ${c.getAttribute("cy")}px`, transformBox: "view-box" }));
      const ring = (t - 3.3) % 1.2 / 1.2;
      S(q(el, ".pr"), { opacity: t > 3.3 ? (1 - ring) * 0.9 : 0, transform: `scale(${0.6 + ring * 0.9})` });
      const an = q(el, ".an"), ap = io(t, 3.5, 3.9, ease.back);
      S(an, { opacity: prog(t, 3.5, 3.7), transform: `translate(${+an.dataset.x}px,${+an.dataset.y - 44}px) translateX(-50%) translateY(${(1 - ap) * 8}px)` });
      const hp = io(t, 4.3, 4.9);
      S(q(el, ".hl"), { opacity: hp, transform: `translateY(${(1 - hp) * 10}px)` });
      S(q(el, ".sub"), { opacity: io(t, 0.2, 0.6) });
    },
  });
})();
