/* Production options: pace, background, device, cursor, progress, frame.
   Every preview uses the same mock product window so only the option changes. */
(() => {
  const { KF, io, prog, lerp, clamp, ease, S } = G;
  const TAU = Math.PI * 2;
  const INK = "#18181b", MUTED = "#6b6b74", F = "#e7e5e0", BLUE = "#2563eb", TEAL = "#0d9488", WARM = "#ea580c";
  const $ = (el, s) => ((el._c ||= {})[s] ||= el.querySelector(s));
  const $$ = (el, s) => ((el._C ||= {})[s] ||= [...el.querySelectorAll(s)]);
  const bar = (l, t, w, h, c, r) => `<i style="left:${l}px;top:${t}px;width:${w}px;height:${h}px;background:${c};border-radius:${r ?? h / 2}px"></i>`;
  const card = (l, t, w, h, inner, cls = "") => `<div class="cd ${cls}" style="left:${l}px;top:${t}px;width:${w}px;height:${h}px">${inner}</div>`;
  const SCENES = ["Overview", "Customers", "Reports", "Sharing"];

  /* ---------- the mock product window (400 x 228) ---------- */
  const CSS = `
&{position:absolute;inset:0;overflow:hidden;background:#f6f5f2;font-family:Inter,-apple-system,system-ui,sans-serif;color:${INK}}
& *{box-sizing:border-box}
& .win{position:absolute;width:400px;height:228px;background:#fff;border:1px solid #e5e3de;border-radius:10px;overflow:hidden;box-shadow:0 18px 40px rgba(24,24,27,.12),0 2px 6px rgba(24,24,27,.06);transform-origin:50% 50%}
& .win div,& .win i,& .win b,& .win svg{position:absolute;display:block}
& .tb{left:0;top:0;width:400px;height:28px;border-bottom:1px solid #eeece8;background:#fff}
& .nb{left:322px;top:6px;width:46px;height:16px;border-radius:8px;background:${BLUE};transform-origin:50% 50%}
& .sb{left:0;top:28px;width:70px;height:200px;background:#faf9f7;border-right:1px solid #eeece8}
& .sb b{left:6px;top:9px;width:58px;height:16px;border-radius:5px;background:#e8effd}
& .ct{left:70px;top:28px;width:330px;height:200px;overflow:hidden}
& .pane{left:0;top:0;width:330px;height:200px;background:#fff}
& .cd{background:#fff;border:1px solid #e5e3de;border-radius:8px;box-shadow:0 1px 2px rgba(24,24,27,.04)}
`;
  const kpi = (i) => card(12 + i * 104, 12, 98, 52, bar(10, 10, 44, 5, F) + bar(10, 22, [52, 44, 58][i], 11, INK, 3) + bar(10, 39, 26, 5, [TEAL, TEAL, WARM][i]), "k");
  const BH = [30, 42, 36, 54, 48, 62, 58, 70, 64, 78, 72, 86, 80, 92];
  const chart = `<svg width="306" height="114" viewBox="0 0 306 114">${BH.map((h, i) => `<rect x="${16 + i * 20.5}" y="${104 - h * 0.8}" width="12" height="${h * 0.8}" rx="2.5" fill="${BLUE}" opacity="${i > 10 ? 1 : 0.35 + i * 0.05}"/>`).join("")}</svg>`;
  const P0 = kpi(0) + kpi(1) + kpi(2) + card(12, 74, 306, 114, chart + bar(12, 12, 70, 6, F));
  const rows = Array.from({ length: 6 }, (_, i) => {
    const y = 32 + i * 24, c = ["#dbe6fd", "#ccebe7", "#fde3d3"][i % 3], ok = i % 3 !== 2;
    return (i ? `<i style="left:0;top:${y}px;width:306px;height:1px;background:#f0eeea"></i>` : "") +
      `<i style="left:12px;top:${y + 5}px;width:14px;height:14px;border-radius:50%;background:${c}"></i>` +
      bar(34, y + 9, [84, 66, 92, 72, 60, 80][i], 6, "rgba(24,24,27,.7)") + bar(140, y + 9, [50, 38, 56, 44, 52, 40][i], 6, F) +
      bar(238, y + 5, 46, 14, ok ? "#d5efec" : "#fde6d6", 7) + bar(250, y + 10, 22, 4, ok ? TEAL : WARM);
  }).join("");
  const P1 = card(12, 12, 306, 176, bar(12, 12, 60, 6, MUTED) + bar(140, 12, 40, 6, F) + bar(238, 12, 34, 6, F) + rows);
  const line = [[10, 92], [34, 84], [58, 88], [82, 70], [106, 74], [130, 56], [154, 60], [178, 38], [190, 32]];
  const lpts = line.map((p) => p.join(",")).join(" ");
  const P2 = card(12, 12, 200, 176, bar(12, 12, 60, 6, F) + bar(12, 24, 74, 14, INK, 3) + bar(92, 28, 30, 6, TEAL) +
      `<svg width="200" height="176" viewBox="0 0 200 176" style="left:0;top:0"><g transform="translate(0,62)"><path d="M10,92 ${line.map((p) => "L" + p.join(",")).join(" ")} L190,104 L10,104 Z" fill="rgba(37,99,235,.1)"/><polyline points="${lpts}" fill="none" stroke="${BLUE}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="190" cy="32" r="4" fill="#fff" stroke="${BLUE}" stroke-width="2.5"/></g></svg>`) +
    card(220, 12, 98, 176, `<svg width="98" height="110" viewBox="0 0 98 110" style="left:0;top:0"><circle cx="49" cy="58" r="27" fill="none" stroke="${F}" stroke-width="10"/><circle cx="49" cy="58" r="27" fill="none" stroke="${TEAL}" stroke-width="10" stroke-dasharray="${0.64 * 170} 170" transform="rotate(-90 49 58)"/><circle cx="49" cy="58" r="27" fill="none" stroke="${BLUE}" stroke-width="10" stroke-dasharray="${0.2 * 170} 170" stroke-dashoffset="${-0.64 * 170}" transform="rotate(-90 49 58)"/></svg>` +
      bar(12, 12, 44, 6, F) + [TEAL, BLUE, F].map((c, i) => bar(14, 118 + i * 18, 8, 8, c, 2) + bar(28, 119 + i * 18, [46, 36, 40][i], 6, F)).join(""));
  const field = (i) => bar(12, 34 + i * 38, 40, 5, MUTED) + `<i style="left:12px;top:${43 + i * 38}px;width:160px;height:20px;border:1px solid #e5e3de;border-radius:5px"></i>` + bar(20, 50 + i * 38, [70, 96, 54][i], 6, F);
  const P3 = card(12, 12, 186, 176, bar(12, 12, 70, 7, INK) + field(0) + field(1) + field(2) + bar(12, 152, 72, 18, BLUE, 6) + bar(28, 159, 40, 4, "#fff")) +
    card(206, 12, 112, 176, bar(12, 12, 54, 6, F) + [0, 1, 2, 3].map((i) => `<i style="left:12px;top:${34 + i * 32}px;width:18px;height:18px;border-radius:50%;background:${["#dbe6fd", "#ccebe7", "#fde3d3", "#e7e5e0"][i]}"></i>` + bar(36, 40 + i * 32, 36, 6, "rgba(24,24,27,.65)") + `<i style="left:80px;top:${37 + i * 32}px;width:22px;height:12px;border-radius:6px;background:${i < 3 ? TEAL : F}"><i style="left:${i < 3 ? 12 : 2}px;top:2px;width:8px;height:8px;border-radius:50%;background:#fff"></i></i>`).join(""));
  const PANES = [P0, P1, P2, P3];
  const win = (style = "", extra = "") => `<div class="win" style="${style}">
    <div class="tb">${bar(12, 8, 12, 12, BLUE, 4)}${bar(32, 11, 58, 6, "rgba(24,24,27,.85)")}${bar(150, 7, 110, 14, "#f3f2ef", 7)}<div class="nb">${bar(13, 6, 20, 4, "#fff")}</div>${bar(376, 7, 14, 14, "#ccebe7", 7)}</div>
    <div class="sb"><b></b>${[0, 1, 2, 3, 4, 5].map((i) => bar(14, 14 + i * 22, [42, 36, 46, 32, 40, 30][i], 6, i < 4 ? "#d6d3cc" : F)).join("")}</div>
    <div class="ct">${PANES.map((p, i) => `<div class="pane p${i}" style="opacity:${i ? 0 : 1}">${p}</div>`).join("")}</div>${extra}</div>`;

  // beats: [[time, paneIndex], ...] starting at 0. Crossfades the current pane over the previous one.
  function panes(el, t, beats, fade, wrap = true) {
    let k = 0;
    for (let i = 0; i < beats.length; i++) if (t >= beats[i][0]) k = i;
    const cur = beats[k][1], prev = beats[(k + beats.length - 1) % beats.length][1];
    const x = !wrap && k === 0 ? 1 : fade ? ease.inOut(prog(t, beats[k][0], beats[k][0] + fade)) : 1;
    $$(el, ".pane").forEach((p, i) => S(p, { opacity: i === cur ? x : i === prev ? 1 : 0, zIndex: i === cur ? 2 : 1, transform: i === cur ? `translateY(${(1 - x) * 6}px)` : "" }));
    S($(el, ".sb b"), { transform: `translateY(${lerp(prev, cur, x) * 22}px)` });
    return { k, x, cur };
  }

  const add = (section, id, title, desc, bestFor, loop, extraCSS, body, render) => {
    const cls = `pr-${section}-${id}`;
    GALLERY.add({
      section, id, title, desc, bestFor, loop,
      build(el) { el.innerHTML = `<style>${(CSS + extraCSS).replaceAll("&", "." + cls)}</style><div class="${cls}">${typeof body === "function" ? body() : body}</div>`; },
      render(el, t) { render(el.lastElementChild, t); },
    });
  };

  /* ================= PACE ================= */
  const paceCSS = `
& {background:#fff}
& .vp{position:absolute;left:48px;top:8px;width:384px;height:216px;border-radius:10px;overflow:hidden;background:#f6f5f2;border:1px solid #e5e3de}
& .vp .win{left:-8px;top:-6px}
& .lab{position:absolute;left:48px;top:236px;font:650 12px/16px Inter,system-ui,sans-serif;color:${INK};white-space:nowrap}
& .lab span{color:${MUTED};font-weight:500}
& .trk{position:absolute;left:190px;top:243px;width:242px;height:2px;border-radius:1px;background:${F}}
& .fill{position:absolute;left:0;top:0;height:2px;background:${BLUE};border-radius:1px}
& .tk{position:absolute;top:-5px;width:2px;height:12px;margin-left:-1px;border-radius:1px;background:#c9c6bf}
& .ph{position:absolute;top:-4px;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:${BLUE};box-shadow:0 0 0 3px rgba(37,99,235,.18)}
`;
  const PACES = [
    { id: "calm", title: "Calm", desc: "Slow, eased camera moves and long holds. Each screen gets time to sink in.", tags: ["Healthcare", "Premium"],
      beats: [[0, 0, 1, 0, 0], [3, 1, 1.1, -26, -12]], fade: 0.9, move: 2.2 },
    { id: "standard", title: "Standard", desc: "A steady, medium rhythm. A new moment every couple of seconds.", tags: ["Explainers", "B2B"],
      beats: [[0, 0, 1, 0, 0], [1.5, 1, 1.12, 18, 8], [3, 2, 1.05, 10, -4], [4.5, 3, 1.14, -16, 6]], fade: 0.35, move: 0.6 },
    { id: "energetic", title: "Energetic", desc: "Quick, snappy cuts and punch-ins. Feels like a launch trailer.", tags: ["Launches", "Social"],
      beats: [[0, 0, 1, 0, 0], [1, 2, 1.45, 70, 34], [2, 1, 1, 0, 0], [3, 3, 1.5, -60, 20], [4, 0, 1.55, 40, -50], [5, 2, 1.05, 0, 0]], fade: 0, move: 0.22 },
  ];
  for (const p of PACES) {
    const n = p.beats.length;
    add("pace", p.id, p.title, p.desc, p.tags, 6, paceCSS,
      `<div class="vp">${win()}</div><div class="lab">${n} beats <span>per loop</span></div><div class="trk"><div class="fill"></div>${p.beats.map((b) => `<div class="tk" style="left:${(b[0] / 6) * 100}%"></div>`).join("")}<div class="ph"></div></div>`,
      (el, t) => {
        const { k } = panes(el, t, p.beats, p.fade);
        const b = p.beats[k], a = p.beats[(k + n - 1) % n];
        const m = (p.id === "energetic" ? ease.out : ease.inOut)(prog(t, b[0], b[0] + p.move));
        let s = lerp(a[2], b[2], m), x = lerp(a[3], b[3], m), y = lerp(a[4], b[4], m);
        if (p.id === "energetic") { const e = io(t, b[0], b[0] + 0.3); s = b[2] * (1.07 - 0.07 * e); x = b[3]; y = b[4]; }
        S($(el, ".win"), { transform: `translate(${x}px,${y}px) scale(${0.82 * s})` });
        const f = t / 6;
        S($(el, ".fill"), { width: `${f * 100}%` });
        S($(el, ".ph"), { left: `${f * 100}%` });
        $$(el, ".tk").forEach((tk, i) => { const hit = 1 - prog(t, p.beats[i][0], p.beats[i][0] + 0.35); S(tk, { background: t >= p.beats[i][0] ? BLUE : "#c9c6bf", transform: `scaleY(${1 + hit * 0.6})` }); });
      });
  }

  /* ================= BACKGROUND ================= */
  const bgCSS = (bg) => `
& .bg{position:absolute;left:-30px;top:-30px;width:540px;height:330px;${bg}}
& .win{left:40px;top:21px}
& .sh{position:absolute;left:90px;top:226px;width:300px;height:26px;border-radius:50%;background:rgba(24,24,27,.14);filter:blur(12px)}
`;
  const floatWin = (el, t, ax = 6, ay = 4, k = 1) => {
    const a = Math.sin((TAU * t) / 8), c = Math.cos((TAU * t) / 8);
    S($(el, ".win"), { transform: `translate(${a * ax}px,${c * ay}px) scale(.8) rotate(${a * 0.4}deg)` });
    S($(el, ".sh"), { transform: `translate(${a * ax}px,0) scale(${1 - c * 0.03})` });
    S($(el, ".bg"), { transform: `translate(${-a * 10 * k}px,${-c * 6 * k}px)` });
    panes(el, t, [[0, 0], [4, 2]], 0.6);
    return a;
  };
  add("background", "plain", "Plain", "A flat, neutral backdrop. Nothing competes with the product.", ["Tutorials", "Docs"], 8,
    bgCSS("background:#f1f0ec"), `<div class="bg"></div><div class="sh"></div>${win()}`, (el, t) => floatWin(el, t));
  add("background", "paper", "Paper", "Warm paper tone with a soft vignette. Feels calm and editorial.", ["Healthcare", "Stories"], 8,
    bgCSS("background:radial-gradient(ellipse 60% 62% at 50% 46%,#fdfaf3 0%,#f3ecdd 58%,#e0d4bc 100%)") + `& .grain{position:absolute;inset:0;opacity:.35;mix-blend-mode:multiply}`,
    `<div class="bg"><svg class="grain" width="540" height="330"><filter id="prgr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .35 0"/></filter><rect width="540" height="330" filter="url(#prgr)"/></svg></div><div class="sh"></div>${win()}`,
    (el, t) => floatWin(el, t));
  add("background", "grid", "Grid", "A faint dot and line grid. Reads as precise and technical.", ["Developer tools", "Data"], 8,
    bgCSS(`background-color:#f8f7f4;background-image:linear-gradient(#e9e7e2 1px,transparent 1px),linear-gradient(90deg,#e9e7e2 1px,transparent 1px),radial-gradient(#c9c6bf 1.3px,transparent 1.7px);background-size:72px 72px,72px 72px,18px 18px;background-position:-1px -1px,-1px -1px,0 0`) +
      `& .fade{position:absolute;inset:0;background:radial-gradient(ellipse 70% 70% at 50% 50%,transparent 40%,#f8f7f4 100%)}`,
    `<div class="bg"></div><div class="fade"></div><div class="sh"></div>${win()}`, (el, t) => floatWin(el, t, 6, 4, 1.6));
  add("background", "gradient", "Soft gradient", "Slow-moving washes of blue, teal and peach. Bright and modern.", ["Launches", "Consumer"], 8,
    bgCSS("background:#f6f5f2") + `& .bl{position:absolute;border-radius:50%;filter:blur(46px);opacity:.75}`,
    `<div class="bg"><div class="bl" style="width:280px;height:240px;background:#8fb0f7"></div><div class="bl" style="width:250px;height:220px;background:#7fd6cb"></div><div class="bl" style="width:260px;height:220px;background:#fbc4a0"></div></div><div class="sh"></div>${win()}`,
    (el, t) => {
      floatWin(el, t);
      const a = (TAU * t) / 8;
      [[20, -10, 0], [300, 10, 2.1], [170, 140, 4.2]].forEach(([x, y, ph], i) => S($$(el, ".bl")[i], { transform: `translate(${x + Math.cos(a + ph) * 50}px,${y + Math.sin(a + ph) * 34}px)` }));
    });
  const DOTS = Array.from({ length: 90 }, (_, i) => ({ x: G.rnd(i) * 540, y: G.rnd(i + 99) * 330, d: [0.35, 0.65, 1][i % 3], ph: G.rnd(i + 7) * TAU, c: i % 4 ? "#3b82f6" : "#22d3ee" }));
  add("background", "particles", "Particles", "Dark navy with slow drifting points of light at different depths. Cinematic and techy.", ["AI products", "Big reveals"], 8,
    bgCSS("background:radial-gradient(ellipse 70% 70% at 50% 45%,#141a2e 0%,#0b0b0f 75%)") +
      `& .p{position:absolute;border-radius:50%}& .glow{position:absolute;left:110px;top:60px;width:260px;height:160px;border-radius:50%;background:rgba(37,99,235,.35);filter:blur(50px)}& .win{box-shadow:0 24px 60px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06)}& .sh{display:none}`,
    `<div class="bg">${DOTS.map((p) => `<i class="p" style="width:${2 + p.d * 4}px;height:${2 + p.d * 4}px;background:${p.c};opacity:${0.35 + p.d * 0.6};box-shadow:0 0 ${p.d * 8}px ${p.c}"></i>`).join("")}</div><div class="glow"></div><div class="sh"></div>${win()}`,
    (el, t) => {
      const s = floatWin(el, t, 6, 4, 0);
      const a = (TAU * t) / 8;
      $$(el, ".p").forEach((d, i) => { const p = DOTS[i]; S(d, { transform: `translate(${p.x + Math.sin(a + p.ph) * 24 * p.d - s * 18 * p.d}px,${p.y + Math.cos(a + p.ph) * 14 * p.d}px)` }); });
    });
  add("background", "spotlight", "Spotlight", "A soft pool of light follows the screen across a muted stage. Draws the eye to the product.", ["Feature reveals", "Premium"], 8,
    bgCSS("background:#dedbd4") + `& .pool{position:absolute;left:0;top:0;width:480px;height:270px}`,
    `<div class="bg"></div><div class="pool"></div><div class="sh"></div>${win()}`,
    (el, t) => {
      const a = Math.sin((TAU * t) / 8), lag = Math.sin((TAU * t) / 8 - 0.6), c = Math.cos((TAU * t) / 8);
      S($(el, ".win"), { transform: `translate(${a * 40}px,${c * 3}px) scale(.74)` });
      S($(el, ".sh"), { transform: `translate(${a * 40}px,-8px) scale(.85)` });
      S($(el, ".pool"), { background: `radial-gradient(ellipse 210px 150px at ${240 + lag * 40}px 128px,#fffefb 0%,rgba(255,254,251,.85) 35%,rgba(255,254,251,0) 100%)` });
      panes(el, t, [[0, 0], [4, 2]], 0.6);
    });

  /* ================= DEVICE ================= */
  const devBreath = (t) => ({ a: Math.sin((TAU * t) / 6), c: Math.cos((TAU * t) / 6) });
  add("device", "none", "No frame", "The screen floats on its own with rounded corners and a soft shadow. The cleanest option.", ["Any product", "Close-ups"], 6,
    `& .win{left:40px;top:21px;border-radius:14px}& .sh{position:absolute;left:100px;top:232px;width:280px;height:22px;border-radius:50%;background:rgba(24,24,27,.16);filter:blur(12px)}`,
    `<div class="sh"></div>${win()}`,
    (el, t) => { const { a, c } = devBreath(t); S($(el, ".win"), { transform: `translateY(${c * 3}px) scale(.86) rotate(${a * 0.5}deg)` }); panes(el, t, [[0, 0], [3, 2]], 0.6); });
  add("device", "browser", "Browser", "Browser chrome with traffic lights and an address bar. Says \"this is a web app\".", ["Web apps", "SaaS"], 6,
    `& .bro{position:absolute;left:40px;top:6px;width:400px;height:258px;border-radius:10px;overflow:hidden;background:#fff;border:1px solid #dcd9d3;box-shadow:0 18px 40px rgba(24,24,27,.14),0 2px 6px rgba(24,24,27,.06);transform-origin:50% 50%}
& .bh{position:absolute;left:0;top:0;width:400px;height:30px;background:#f1f0ec;border-bottom:1px solid #e2e0da}
& .tl{position:absolute;top:10px;width:10px;height:10px;border-radius:50%}
& .url{position:absolute;left:96px;top:6px;width:208px;height:18px;border-radius:6px;background:#fff;border:1px solid #e2e0da;font:500 10.5px/16px Inter,system-ui,sans-serif;color:${MUTED};text-align:center}
& .url b{color:${INK};font-weight:600}
& .bro .win{left:-1px;top:30px;border:0;border-radius:0;box-shadow:none}`,
    `<div class="bro"><div class="bh"><i class="tl" style="left:12px;background:#ff5f57"></i><i class="tl" style="left:28px;background:#febc2e"></i><i class="tl" style="left:44px;background:#28c840"></i><div class="url">🔒&#xFE0E; <b>app.acme.com</b>/overview</div></div>${win()}</div>`,
    (el, t) => { const { a, c } = devBreath(t); S($(el, ".bro"), { transform: `translateY(${c * 3}px) scale(.88) rotate(${a * 0.4}deg)` }); panes(el, t, [[0, 0], [3, 2]], 0.6); });
  add("device", "laptop", "Laptop", "The screen sits inside a laptop, slightly tilted in 3D. Feels like a real product shot.", ["Desktop apps", "Hero shots"], 6,
    `& {background:radial-gradient(ellipse 70% 70% at 50% 40%,#fbfaf8,#ecebe6)}
& .stage{position:absolute;inset:0;perspective:900px}
& .lap{position:absolute;left:80px;top:20px;width:320px;height:230px;transform-style:preserve-3d;transform-origin:50% 90%}
& .lid{position:absolute;left:10px;top:0;width:300px;height:190px;border-radius:12px 12px 4px 4px;background:#1f1f23;box-shadow:inset 0 0 0 1px #3a3a40}
& .scr{position:absolute;left:8px;top:8px;width:284px;height:174px;overflow:hidden;border-radius:3px;background:#fff}
& .scr .win{left:-58px;top:-27px;border:0;border-radius:0;box-shadow:none;transform:scale(.71)}
& .cam{position:absolute;left:148px;top:3px;width:4px;height:4px;border-radius:50%;background:#3a3a40}
& .base{position:absolute;left:-14px;top:190px;width:348px;height:12px;border-radius:2px 2px 10px 10px;background:linear-gradient(#e4e2dd,#bebbb4);box-shadow:0 1px 0 #a9a69f}
& .notch{position:absolute;left:144px;top:0;width:60px;height:5px;border-radius:0 0 6px 6px;background:#c9c6bf}
& .lsh{position:absolute;left:60px;top:218px;width:360px;height:26px;border-radius:50%;background:rgba(24,24,27,.22);filter:blur(14px)}
& .glare{position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.18) 0%,rgba(255,255,255,0) 40%)}`,
    `<div class="lsh"></div><div class="stage"><div class="lap"><div class="lid"><i class="cam"></i><div class="scr">${win()}<div class="glare"></div></div></div><div class="base"><i class="notch"></i></div></div></div>`,
    (el, t) => { const { a, c } = devBreath(t); S($(el, ".lap"), { transform: `translateY(${c * 3}px) rotateX(${8 + c * 2}deg) rotateY(${a * 9}deg)` }); S($(el, ".lsh"), { transform: `translateX(${a * 6}px)` }); panes(el, t, [[0, 0], [3, 2]], 0.6); });
  add("device", "phone", "Phone", "A phone frame with a mobile layout. Use it when the product lives on a phone.", ["Mobile apps", "Vertical cuts"], 6,
    `& {background:radial-gradient(ellipse 60% 70% at 50% 45%,#fbfaf8,#ecebe6)}
& .ph{position:absolute;left:182px;top:10px;width:116px;height:250px;border-radius:24px;background:#18181b;box-shadow:0 20px 40px rgba(24,24,27,.22),inset 0 0 0 1.5px #3a3a40;transform-origin:50% 50%}
& .ms{position:absolute;left:5px;top:5px;width:106px;height:240px;border-radius:19px;overflow:hidden;background:#f6f5f2}
& .ms i,& .ms div{position:absolute;display:block}
& .isl{position:absolute;left:40px;top:10px;width:36px;height:10px;border-radius:5px;background:#18181b;z-index:3}
& .feed{left:0;top:0;width:106px;height:330px}
& .tab{left:0;top:214px;width:106px;height:26px;background:#fff;border-top:1px solid #e7e5e0;z-index:2}
& .cd{background:#fff;border:1px solid #e5e3de;border-radius:9px}`,
    `<div class="ph"><div class="ms"><i class="isl"></i><div class="feed">
      ${bar(10, 32, 12, 12, BLUE, 4)}${bar(28, 36, 40, 5, INK)}${bar(84, 32, 12, 12, "#ccebe7", 6)}
      ${card(8, 54, 90, 44, bar(9, 9, 34, 4, F) + bar(9, 18, 50, 10, INK, 3) + bar(9, 33, 22, 4, TEAL))}
      ${card(8, 104, 90, 62, `<svg width="90" height="62" style="position:absolute;left:0;top:0">${[16, 24, 20, 30, 26, 36, 32, 42].map((h, i) => `<rect x="${9 + i * 9.5}" y="${54 - h}" width="6" height="${h}" rx="1.5" fill="${BLUE}" opacity="${0.4 + i * 0.08}"/>`).join("")}</svg>`)}
      ${[0, 1, 2, 3].map((i) => card(8, 172 + i * 34, 90, 28, `<i style="left:7px;top:7px;width:13px;height:13px;border-radius:50%;background:${["#dbe6fd", "#ccebe7", "#fde3d3", "#e7e5e0"][i]}"></i>` + bar(26, 9, 40, 4, "rgba(24,24,27,.7)") + bar(26, 17, 26, 3, F))).join("")}
    </div><div class="tab">${[0, 1, 2, 3].map((i) => bar(14 + i * 22, 9, 10, 8, i ? "#d6d3cc" : BLUE, 3)).join("")}</div></div></div>`,
    (el, t) => {
      const { a, c } = devBreath(t);
      S($(el, ".ph"), { transform: `translateY(${c * 3}px) rotate(${a * 2}deg)` });
      S($(el, ".feed"), { transform: `translateY(${-KF(t, [[0, 0], [1.6, 0], [2.8, 86], [4.4, 86], [5.6, 0]])[0]}px)` });
    });

  /* ================= CURSOR ================= */
  // targets in frame coordinates (window nudged by translate(-14px,10px) scale(.93))
  const START = [300, 215], T1 = [361, 52], T2 = [259, 100];
  function cursorAt(t) {
    const seg = (a, b, t0, t1, bend) => { const x = ease.inOut(prog(t, t0, t1)), arc = Math.sin(Math.PI * x) * bend; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [lerp(a[0], b[0], x) - (dy / L) * arc, lerp(a[1], b[1], x) + (dx / L) * arc]; };
    if (t < 1.25) return seg(START, T1, 0.25, 1.25, 18);
    if (t < 3.05) return seg(T1, T2, 2.05, 3.05, -16);
    return seg(T2, START, 4.6, 5.6, 14);
  }
  const press = (t, c) => Math.min(prog(t, c, c + 0.08), 1 - prog(t, c + 0.16, c + 0.32)); // 0..1 button-down amount
  const C1 = 1.35, C2 = 3.15;
  function cursorScene(el, t) {
    const p1 = press(t, C1), p2 = press(t, C2);
    S($(el, ".nb"), { transform: `scale(${1 - p1 * 0.1})`, background: p1 > 0.01 ? "#1d4ed8" : BLUE, boxShadow: `0 0 0 ${p1 * 4}px rgba(37,99,235,.2)` });
    const sel = Math.min(io(t, C2 + 0.08, C2 + 0.35), 1 - prog(t, 4.9, 5.5));
    const k = $$(el, ".p0 .k")[1];
    S(k, { transform: `translateY(${-sel * 2}px) scale(${1 - p2 * 0.04})`, borderColor: sel > 0.5 ? BLUE : "#e5e3de", boxShadow: `0 0 0 ${sel * 3}px rgba(37,99,235,.18),0 ${2 + sel * 8}px ${4 + sel * 14}px rgba(24,24,27,${0.04 + sel * 0.06})` });
    const menu = Math.min(io(t, C1 + 0.15, C1 + 0.45), 1 - prog(t, 2.2, 2.5));
    S($(el, ".menu"), { opacity: menu, transform: `translateY(${(1 - menu) * -6}px)` });
    return { p1, p2, xy: cursorAt(t) };
  }
  const menuHTML = `<div class="menu">${[0, 1, 2].map((i) => bar(12, 10 + i * 16, [56, 44, 50][i], 6, i ? F : "rgba(24,24,27,.7)")).join("")}</div>`;
  const curCSS = `& .win{left:40px;top:21px;transform:translate(-14px,10px) scale(.93)}& .win .menu{left:300px;top:26px;width:86px;height:56px;background:#fff;border:1px solid #e5e3de;border-radius:8px;box-shadow:0 10px 24px rgba(24,24,27,.12);z-index:5;opacity:0}
& .rip{position:absolute;left:0;top:0;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;opacity:0;pointer-events:none}
& .cur{position:absolute;left:0;top:0;z-index:9}`;
  const ripple = (r, t, x, y) => {
    const a = prog(t, C1, C1 + 0.55), b = prog(t, C2, C2 + 0.55), on = a > 0 && a < 1 ? a : b > 0 && b < 1 ? b : 0;
    const at = a > 0 && a < 1 ? T1 : T2;
    S(r, { transform: `translate(${at[0]}px,${at[1]}px) scale(${0.3 + ease.out(on) * 1.2})`, opacity: on ? (1 - on) * 0.9 : 0 });
  };
  add("cursor", "macos", "macOS pointer", "The classic arrow pointer with a small ripple on each click. Familiar to everyone.", ["Walkthroughs", "Desktop apps"], 6,
    curCSS + `& .rip{border:2px solid ${BLUE}}`,
    `${win("", menuHTML)}<div class="rip"></div><svg class="cur" width="22" height="30" viewBox="0 0 22 30"><path d="M2 2 L2 23 L7.2 18.2 L10.6 26.2 L14 24.8 L10.6 17 L17.6 17 Z" fill="${INK}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    (el, t) => {
      const { p1, p2, xy } = cursorScene(el, t);
      S($(el, ".cur"), { transform: `translate(${xy[0] - 2}px,${xy[1] - 2}px) scale(${1 - (p1 + p2) * 0.12})`, transformOrigin: "2px 2px", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.25))" });
      ripple($(el, ".rip"), t);
    });
  add("cursor", "dot", "Soft dot", "A soft dark dot instead of an arrow, with a ring pulse on click. Calm and modern.", ["Polished demos", "Mobile apps"], 6,
    curCSS + `& .rip{border:2px solid rgba(24,24,27,.5)}& .cur{width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(24,24,27,.42);border:2px solid rgba(255,255,255,.85);box-shadow:0 2px 8px rgba(24,24,27,.25)}`,
    `${win("", menuHTML)}<div class="rip"></div><div class="cur"></div>`,
    (el, t) => { const { p1, p2, xy } = cursorScene(el, t); S($(el, ".cur"), { transform: `translate(${xy[0]}px,${xy[1]}px) scale(${1 - (p1 + p2) * 0.3})` }); ripple($(el, ".rip"), t); });
  add("cursor", "spotlight", "Spotlight cursor", "The screen dims except a circle of light around the cursor. Nobody misses where to look.", ["Busy screens", "Training"], 6,
    curCSS + `& .dim{position:absolute;inset:0;z-index:8;pointer-events:none}& .cur{width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;border:2px solid ${INK};box-shadow:0 1px 4px rgba(0,0,0,.3)}`,
    `${win("", menuHTML)}<div class="dim"></div><div class="cur"></div>`,
    (el, t) => {
      const { p1, p2, xy } = cursorScene(el, t);
      const dim = Math.min(io(t, 0, 0.5), 1 - prog(t, 5.6, 6)) * 0.55, r = 50 - (p1 + p2) * 10;
      S($(el, ".dim"), { background: `radial-gradient(circle at ${xy[0]}px ${xy[1]}px,rgba(11,11,15,0) ${r}px,rgba(11,11,15,${dim}) ${r + 8}px)` });
      S($(el, ".cur"), { transform: `translate(${xy[0]}px,${xy[1]}px) scale(${1 - (p1 + p2) * 0.25})` });
    });
  add("cursor", "none", "No cursor", "No pointer at all. Each button or card glows and presses on its own.", ["Clean demos", "Short promos"], 6,
    curCSS + `& .ring{position:absolute;border-radius:10px;border:2px solid ${BLUE};box-shadow:0 0 0 4px rgba(37,99,235,.15);opacity:0;z-index:6;pointer-events:none}`,
    `${win("", menuHTML)}<div class="ring r1" style="left:335px;top:40px;width:52px;height:24px;border-radius:12px"></div><div class="ring r2" style="left:209px;top:72px;width:99px;height:57px"></div>`,
    (el, t) => {
      cursorScene(el, t);
      const g1 = Math.min(io(t, 0.7, 1.15), 1 - prog(t, 1.8, 2.2)), g2 = Math.min(io(t, 2.5, 2.95), 1 - prog(t, 4.6, 5.2));
      S($(el, ".r1"), { opacity: g1, transform: `scale(${1.15 - 0.15 * g1})` });
      S($(el, ".r2"), { opacity: g2 * 0.9, transform: `scale(${1.08 - 0.08 * g2})` });
    });

  /* ================= PROGRESS + FRAME: same 4-scene story ================= */
  const STORY = [[0, 0], [2, 1], [4, 2], [6, 3]];
  const storyCSS = `& .win{left:40px;top:21px}& .dip{position:absolute;inset:0;background:#f6f5f2;z-index:20;pointer-events:none}`;
  function story(el, t) {
    const { k, x } = panes(el, t, STORY, 0.45, false);
    const z = KF(t, [[0, 0.84], [8, 0.9]], (u) => u)[0];
    S($(el, ".win"), { transform: `translateY(6px) scale(${z})` });
    S($(el, ".dip"), { opacity: Math.max(prog(t, 7.6, 8), 1 - prog(t, 0, 0.35)) });
    return { k, x };
  }
  const SMALL = "font-family:Inter,-apple-system,system-ui,sans-serif";
  const PSTEPS = ["Import data", "Find customers", "Build report", "Share it"];
  add("progress", "step-pill", "Step pill", "A small pill shows the step number and name, with a thin bar that fills. Clear for long walkthroughs.", ["Tutorials", "Onboarding"], 8,
    storyCSS + `& .pill{position:absolute;left:16px;top:12px;height:30px;padding:0 14px;border-radius:15px;background:#fff;border:1px solid #e5e3de;box-shadow:0 4px 12px rgba(24,24,27,.08);overflow:hidden;z-index:10;${SMALL};font-size:13px;line-height:29px;white-space:nowrap}
& .num{display:inline-block;width:50px;font-weight:700;color:${INK};font-variant-numeric:tabular-nums}
& .num b{color:${MUTED};font-weight:500}
& .nm{display:inline-block;color:${MUTED};font-weight:600;position:relative;width:126px;height:29px;vertical-align:top;overflow:hidden}
& .nm span{position:absolute;left:0;top:0;color:${INK}}
& .pb{position:absolute;left:0;bottom:0;height:2px;background:${BLUE}}`,
    `${win()}<div class="pill"><span class="num"></span><span class="nm">· ${PSTEPS.map((s) => `<span>${s}</span>`).join("")}</span><i class="pb"></i></div><div class="dip"></div>`,
    (el, t) => {
      const { k, x } = story(el, t);
      $(el, ".num").innerHTML = `0${k + 3} <b>/ 08</b>`;
      $$(el, ".nm span").forEach((s, i) => S(s, { left: "10px", opacity: i === k ? x : i === k - 1 ? 1 - x : 0, transform: `translateY(${i === k ? (1 - x) * 12 : -x * 12}px)` }));
      S($(el, ".pb"), { width: `${lerp(k + 2, k + 3, io(t, STORY[k][0], STORY[k][0] + 0.6)) / 8 * 100}%` });
    });
  add("progress", "top-bar", "Top bar", "A thin bar across the top fills as the story moves on. Quiet but always there.", ["Explainers", "Sales demos"], 8,
    storyCSS + `& .trk{position:absolute;left:0;top:0;width:480px;height:4px;background:rgba(24,24,27,.06);z-index:10}& .fill{height:4px;background:${BLUE};border-radius:0 2px 2px 0;box-shadow:0 0 8px rgba(37,99,235,.4)}& .sep{position:absolute;top:0;width:2px;height:4px;background:#f6f5f2}`,
    `${win()}<div class="trk"><div class="fill"></div>${[1, 2, 3].map((i) => `<i class="sep" style="left:${i * 120 - 1}px"></i>`).join("")}</div><div class="dip"></div>`,
    (el, t) => { const { k } = story(el, t); S($(el, ".fill"), { width: `${lerp(k, k + 1, io(t, STORY[k][0], STORY[k][0] + 1.6, ease.inOut)) * 25}%` }); });
  add("progress", "chapter-dots", "Chapter dots", "A row of dots at the bottom. The current chapter stretches into a wide pill.", ["Stories", "Social"], 8,
    storyCSS + `& .dots{position:absolute;left:0;top:250px;width:480px;height:8px;display:flex;justify-content:center;gap:6px;z-index:10}& .dots i{display:block;height:8px;border-radius:4px;background:#d6d3cc}`,
    `${win()}<div class="dots">${[0, 1, 2, 3].map(() => "<i></i>").join("")}</div><div class="dip"></div>`,
    (el, t) => {
      const { k, x } = story(el, t);
      $$(el, ".dots i").forEach((d, i) => { const w = i === k ? x : i === k - 1 ? 1 - x : 0; S(d, { width: `${8 + w * 22}px`, background: i <= k ? (w > 0.5 ? INK : "#9b9890") : "#d6d3cc" }); });
    });
  add("progress", "none", "No progress", "No indicator. The story speaks for itself and the frame stays clean.", ["Short promos", "Ads"], 8,
    storyCSS, `${win()}<div class="dip"></div>`, (el, t) => story(el, t));

  add("frame", "none", "Clean frame", "Nothing but the product on screen. No marks or labels.", ["Any video", "Ads"], 8,
    storyCSS, `${win()}<div class="dip"></div>`, (el, t) => story(el, t));
  add("frame", "logo-bug", "Logo bug", "A small, see-through logo sits in one corner the whole time, like a TV channel mark.", ["Brand videos", "Social reposts"], 8,
    storyCSS + `& .bug{position:absolute;right:14px;bottom:10px;display:flex;align-items:center;gap:6px;opacity:.55;z-index:10;${SMALL};font:800 16px/1 Inter,system-ui,sans-serif;color:${INK};letter-spacing:-.2px}& .bug i{display:block;width:22px;height:22px;border-radius:5px;background:${INK};position:relative}& .bug i:after{content:"";position:absolute;left:6px;top:6px;width:10px;height:10px;border-radius:50%;border:2px solid #fff;box-sizing:border-box}`,
    `${win()}<div class="bug"><i></i>acme</div><div class="dip"></div>`, (el, t) => story(el, t));
  add("frame", "chapter-corner", "Chapter corner", "The current chapter name sits in small caps in the top-left corner and changes with each scene.", ["Long demos", "Training"], 8,
    storyCSS + `& .cc{position:absolute;left:18px;top:10px;height:20px;width:240px;overflow:hidden;z-index:10;${SMALL}}
& .cc span{position:absolute;left:0;top:0;font-size:12.5px;line-height:20px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${INK};white-space:nowrap}
& .cc span b{color:${BLUE};font-weight:700;margin-right:8px}`,
    `${win()}<div class="cc">${SCENES.map((s, i) => `<span><b>0${i + 1}</b>${s}</span>`).join("")}</div><div class="dip"></div>`,
    (el, t) => {
      const { k, x } = story(el, t);
      $$(el, ".cc span").forEach((s, i) => S(s, { opacity: i === k ? x : i === k - 1 ? 1 - x : 0, transform: `translateY(${i === k ? (1 - x) * 14 : -x * 14}px)` }));
    });
})();
