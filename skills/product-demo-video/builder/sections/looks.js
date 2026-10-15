/* Looks: the same small mock (headline, product card, mini chart, button) drawn in each look's own palette. */
(() => {
  const { io, vis, lerp, KF, S, rnd, ease } = G;
  const LOOP = 6;

  // Shared layout. Each look sets CSS variables and adds its own overrides (P = the item's wrapper class).
  const base = (P) => `
${P}{position:absolute;inset:0;overflow:hidden;background:var(--bg);color:var(--ink);font-family:var(--font)}
${P} .deco{position:absolute;inset:0;pointer-events:none}
${P} .cam{position:absolute;inset:0;transform-origin:50% 50%}
${P} .left{position:absolute;left:36px;top:0;bottom:0;width:210px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
${P} .kick{white-space:nowrap;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--acc);margin-bottom:10px}
${P} .h{font-size:44px;line-height:1;font-weight:var(--hw,800);letter-spacing:var(--hls,-1.5px)}
${P} .sub{margin-top:16px;display:flex;flex-direction:column;gap:7px}
${P} .sub i{display:block;height:7px;border-radius:4px;background:var(--mute)}
${P} .sub i:nth-child(1){width:170px}${P} .sub i:nth-child(2){width:120px}
${P} .btn{margin-top:20px;display:inline-block;padding:10px 18px;font-size:13px;font-weight:700;border-radius:var(--br,999px);background:var(--acc);color:var(--btnInk,#fff)}
${P} .card{position:absolute;left:262px;top:47px;width:184px;height:176px;border-radius:var(--r,14px);background:var(--card);border:var(--cardB,1px solid var(--line));box-shadow:var(--cardSh,none);padding:16px}
${P} .top{display:flex;align-items:center;gap:9px}
${P} .av{width:24px;height:24px;border-radius:50%;background:var(--acc2);flex:none}
${P} .top div{display:flex;flex-direction:column;gap:5px}
${P} .top i,${P} .lines i{display:block;height:6px;border-radius:3px;background:var(--mute)}
${P} .top i:nth-child(1){width:70px}${P} .top i:nth-child(2){width:44px;opacity:.6}
${P} .lines{margin-top:14px;display:flex;flex-direction:column;gap:6px}
${P} .lines i:nth-child(1){width:140px}${P} .lines i:nth-child(2){width:100px}
${P} .chart{position:absolute;left:16px;right:16px;bottom:16px;height:62px;display:flex;align-items:flex-end;gap:8px;border-bottom:var(--axis,1px solid var(--line))}
${P} .chart s{flex:1;height:100%;border-radius:var(--barR,3px 3px 0 0);background:var(--bar,var(--acc));transform-origin:50% 100%}
${P} .chart s:last-child{background:var(--barHi,var(--acc2))}`;

  const mock = (kick, btn) => `<div class="deco"></div><div class="cam">
    <div class="left"><div class="kick">${kick}</div><div class="h">Ship faster</div><div class="sub"><i></i><i></i></div><div class="btn">${btn}</div></div>
    <div class="card"><div class="top"><b class="av"></b><div><i></i><i></i></div></div><div class="lines"><i></i><i></i></div>
    <div class="chart"><s></s><s></s><s></s><s></s><s></s><s></s></div></div></div>`;

  const BARS = [0.38, 0.55, 0.47, 0.7, 0.62, 0.95];

  // The common motion: rise in, bars grow, gentle drift, settle out before the loop wraps.
  function common(el, t, o = {}) {
    const q = el._q || (el._q = {
      cam: el.querySelector(".cam"), parts: [".kick", ".h", ".sub", ".btn"].map((s) => el.querySelector(s)),
      card: el.querySelector(".card"), bars: [...el.querySelectorAll(".chart s")],
    });
    const calm = o.calm ? 1.6 : 1, out = vis(t, 0, LOOP, 0.55);
    const d = KF(t, [[0, 0], [LOOP, 1]], (x) => x)[0];
    S(q.cam, { transform: `translate(${lerp(6, -6, d)}px,${lerp(3, -3, d)}px) scale(${lerp(1.0, 1.045, ease.inOut(d))})`, opacity: out });
    q.parts.forEach((p, i) => {
      const k = io(t, 0.2 + i * 0.14 * calm, 0.9 + i * 0.14 * calm + (calm - 1) * 0.6);
      S(p, { opacity: k, transform: `translateY(${(1 - k) * 16}px)` });
    });
    const kc = io(t, 0.45, 1.3 * calm);
    S(q.card, { opacity: kc, transform: `translateY(${(1 - kc) * 22}px) scale(${lerp(0.96, 1, kc)})` });
    q.bars.forEach((b, i) => {
      const k = io(t, 1.0 + i * 0.12 * calm, 1.8 + i * 0.12 * calm, o.bounce ? ease.back : ease.out);
      S(b, { transform: `scaleY(${Math.max(0.001, k * BARS[i])})` });
    });
    return q;
  }

  function look(id, title, desc, bestFor, vars, css, kick, btn, extra = {}) {
    const P = ".lk-" + id;
    GALLERY.add({
      section: "looks", id, title, desc, bestFor, loop: LOOP,
      build(el) {
        el.innerHTML = `<style>${base(P)}${P}{${vars}}${css.replaceAll("P", P)}</style><div class="lk-${id}">${mock(kick, btn)}</div>`;
        extra.build?.(el.querySelector(P), el.querySelector(P + " .deco"));
      },
      render(el, t) {
        const root = el.firstElementChild.nextElementSibling;
        const q = common(root, t, extra);
        extra.render?.(root, t, q);
      },
    });
  }

  // 1. Dark glow
  look("dark-glow", "Dark glow", "Near-black screen with soft neon glows and drifting light specks. Feels modern and techy.", ["SaaS launches", "AI products", "Dev tools"],
    `--bg:#0b0b0f;--ink:#fff;--mute:rgba(255,255,255,.16);--card:rgba(255,255,255,.045);--line:rgba(59,130,246,.35);--acc:#3b82f6;--acc2:#22d3ee;--font:-apple-system,system-ui,sans-serif;--cardSh:0 0 40px rgba(59,130,246,.25),inset 0 1px 0 rgba(255,255,255,.08);--bar:linear-gradient(#93c5fd,#3b82f6)`,
    `P .h{background:linear-gradient(90deg,#fff,#bfdbfe 60%,#22d3ee);-webkit-background-clip:text;background-clip:text;color:transparent}
     P .btn{box-shadow:0 0 22px rgba(59,130,246,.7)}
     P .chart s{box-shadow:0 0 12px rgba(59,130,246,.6)}
     P .glow{position:absolute;border-radius:50%;filter:blur(30px)}
     P .pt{position:absolute;width:3px;height:3px;border-radius:50%;background:#bfdbfe;box-shadow:0 0 6px #60a5fa}`,
    "New", "Get started", {
      build(root, deco) {
        deco.innerHTML = `<div class="glow" style="left:250px;top:30px;width:220px;height:200px;background:rgba(59,130,246,.28)"></div><div class="glow" style="left:-40px;top:150px;width:200px;height:160px;background:rgba(34,211,238,.16)"></div>` +
          Array.from({ length: 26 }, () => `<b class="pt"></b>`).join("");
      },
      render(root, t) {
        root.querySelectorAll(".pt").forEach((p, i) => {
          const y = (rnd(i) * 300 - t * (8 + rnd(i + 9) * 14) * (LOOP / 6)) % 300;
          const yy = ((y % 300) + 300) % 300 - 15, a = 0.25 + 0.6 * Math.abs(Math.sin(t * 1.05 + i));
          S(p, { left: rnd(i + 3) * 480 + "px", top: yy + "px", opacity: a * vis(t, 0, LOOP, 0.6) });
        });
        const g = root.querySelectorAll(".glow");
        S(g[0], { opacity: 0.75 + 0.25 * Math.sin((t / LOOP) * Math.PI * 2) });
      },
    });

  // 2. Clean light
  look("clean-light", "Clean light", "Bright white, lots of space, crisp soft shadows and black type with one blue accent.", ["Consumer apps", "Premium brands", "Product pages"],
    `--bg:#fff;--ink:#111114;--mute:#e6e6ea;--card:#fff;--line:#ececf0;--acc:#0071e3;--acc2:#111114;--font:-apple-system,"SF Pro Display",system-ui,sans-serif;--hw:700;--hls:-2px;--r:18px;--cardSh:0 1px 2px rgba(0,0,0,.04),0 18px 40px -10px rgba(0,0,0,.14);--bar:#e3e8f0;--barHi:#0071e3;--barR:4px;--axis:0`,
    `P .kick{color:#86868b;letter-spacing:.5px;text-transform:none;font-size:13px;font-weight:600}
     P .av{background:linear-gradient(135deg,#d9d9de,#bdbdc4)}`,
    "Introducing", "Learn more ›");

  // 3. Editorial
  look("editorial", "Editorial", "Warm paper, a big serif headline and thin rules, laid out like a magazine page.", ["Thought leadership", "Brand stories", "Reports"],
    `--bg:#f3ece0;--ink:#1d1a16;--mute:rgba(29,26,22,.18);--card:transparent;--line:#1d1a16;--acc:#a8402b;--acc2:#1d1a16;--font:Georgia,"Times New Roman",serif;--hw:400;--hls:-1px;--r:0;--br:0;--bar:#1d1a16;--barHi:#a8402b;--barR:0;--cardB:0`,
    `P .h{font-size:42px;font-style:italic}
     P .left{top:44px;bottom:44px}
     P .sub{margin-top:12px}P .btn{margin-top:14px}
     P .kick{font-family:Georgia,serif;color:#1d1a16;font-weight:400;letter-spacing:3px;font-size:10.5px;border-bottom:1px solid #1d1a16;padding-bottom:6px;width:190px}
     P .btn{background:transparent;color:#1d1a16;border-bottom:1.5px solid #a8402b;padding:4px 0;font-style:italic;font-weight:400;font-size:14px}
     P .card{border-top:3px double #1d1a16;border-bottom:1px solid #1d1a16;padding:14px 4px}
     P .chart{left:4px;right:4px}
     P .av{border-radius:0;background:#a8402b}
     P .rule{position:absolute;background:#1d1a16;transform-origin:0 0}
     P .folio{position:absolute;font:italic 11px Georgia,serif;color:rgba(29,26,22,.6)}`,
    "Issue 04 · Product", "Read the story →", {
      build(root, deco) {
        deco.innerHTML = `<div class="rule" style="left:24px;top:30px;width:432px;height:1px"></div><div class="rule" style="left:24px;top:240px;width:432px;height:1px"></div><div class="rule" style="left:244px;top:48px;width:1px;height:176px"></div><div class="folio" style="left:24px;top:246px">The Acme Review</div><div class="folio" style="right:24px;top:246px">p. 12</div>`;
      },
      render(root, t) {
        const r = root.querySelectorAll(".rule"), k = io(t, 0, 1.0, ease.inOut) * vis(t, 0, LOOP, 0.55);
        S(r[0], { transform: `scaleX(${k})` }); S(r[1], { transform: `scaleX(${k})` }); S(r[2], { transform: `scaleY(${io(t, 0.3, 1.3)})`, opacity: vis(t, 0, LOOP, 0.55) });
        root.querySelectorAll(".folio").forEach((f) => S(f, { opacity: k }));
      },
    });

  // 4. OLED monochrome
  look("oled-mono", "OLED monochrome", "Pure black with thin white lines only, and one tiny cool accent. Quiet and precise.", ["Dev tools", "Infra and data", "Minimal brands"],
    `--bg:#000;--ink:#fff;--mute:rgba(255,255,255,.22);--card:#000;--line:rgba(255,255,255,.55);--acc:#fff;--acc2:transparent;--font:-apple-system,"Helvetica Neue",system-ui,sans-serif;--hw:200;--hls:-1.5px;--r:6px;--br:4px;--btnInk:#000;--bar:transparent;--barHi:transparent;--barR:0`,
    `P .kick{color:rgba(255,255,255,.55);font-weight:500;letter-spacing:3px;display:flex;align-items:center;gap:8px}
     P .kick:before{content:"";width:6px;height:6px;border-radius:50%;background:#5ad1ff;box-shadow:0 0 8px #5ad1ff}
     P .h{font-size:46px}
     P .btn{background:transparent;color:#fff;border:1px solid #fff;font-weight:500;letter-spacing:.5px}
     P .av{border:1px solid #fff}
     P .chart s{border:1px solid rgba(255,255,255,.85);border-bottom:0}
     P .chart s:last-child{border-color:#5ad1ff;background:rgba(90,209,255,.12)}`,
    "Status", "Get started");

  // 5. Glass and gradient
  look("glass-gradient", "Glass and gradient", "A colourful moving gradient behind frosted glass cards. Soft, bright and modern.", ["Consumer apps", "Fintech", "Social ads"],
    `--bg:#2f7fe0;--ink:#fff;--mute:rgba(255,255,255,.55);--card:rgba(255,255,255,.18);--line:rgba(255,255,255,.45);--acc:rgba(255,255,255,.95);--acc2:#ffd9c2;--btnInk:#1d4ed8;--font:-apple-system,system-ui,sans-serif;--r:20px;--cardSh:0 20px 40px -12px rgba(10,40,110,.45),inset 0 1px 0 rgba(255,255,255,.6);--bar:rgba(255,255,255,.75);--barHi:#fff;--barR:6px;--axis:0`,
    `P .card{backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3)}
     P .kick{color:rgba(255,255,255,.85)}
     P .h{text-shadow:0 4px 24px rgba(10,40,120,.35)}
     P .btn{box-shadow:0 8px 20px -6px rgba(10,40,110,.5)}
     P .blob{position:absolute;border-radius:50%;filter:blur(36px)}
     P .glass2{position:absolute;left:404px;top:22px;width:62px;height:62px;border-radius:16px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}`,
    "New", "Try it free", {
      build(root, deco) {
        deco.innerHTML = [["#ff7a6b", 200], ["#2dd4bf", 220], ["#ffb35c", 170], ["#38bdf8", 240]].map(([c, s]) => `<div class="blob" style="width:${s}px;height:${s}px;background:${c}"></div>`).join("");
        root.querySelector(".cam").insertAdjacentHTML("afterbegin", `<div class="glass2"></div>`);
      },
      render(root, t) {
        const a = (t / LOOP) * Math.PI * 2;
        const pos = [[60, -40, 50], [300, 120, 60], [340, -60, 40], [-40, 140, 50]];
        root.querySelectorAll(".blob").forEach((b, i) => S(b, { left: pos[i][0] + Math.cos(a + i * 1.7) * pos[i][2] + "px", top: pos[i][1] + Math.sin(a + i * 1.7) * pos[i][2] * 0.7 + "px" }));
        const k = io(t, 1.2, 2.1, ease.back);
        S(root.querySelector(".glass2"), { opacity: Math.min(1, k), transform: `translateY(${(1 - k) * 18}px)` });
      },
    });

  // 6. Blueprint
  look("blueprint", "Blueprint", "Deep blue grid paper with white wireframe outlines and measuring marks. Shows how things are built.", ["Technical products", "Architecture", "Hardware"],
    `--bg:#123a80;--ink:#fff;--mute:rgba(255,255,255,.4);--card:transparent;--line:rgba(255,255,255,.9);--acc:transparent;--acc2:transparent;--font:"SF Mono",Menlo,Consolas,monospace;--hw:600;--hls:-2px;--r:2px;--br:2px;--bar:rgba(255,255,255,.08);--barHi:rgba(255,255,255,.22);--barR:0`,
    `P{background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.14) 1px,transparent 1px);background-size:12px 12px,12px 12px,60px 60px,60px 60px}
     P .h{font-size:40px;font-weight:400}
     P .kick{color:#9fd0ff;letter-spacing:1px;font-weight:500;text-transform:none;font-size:11px}
     P .btn{border:1.2px dashed #fff;color:#fff;font-weight:500}
     P .sub i,P .top i,P .lines i{background:transparent;border:1px solid rgba(255,255,255,.6)}
     P .av{border:1px solid #fff}
     P .card{border:1.2px solid #fff;box-shadow:none}
     P .chart s{border:1px solid #fff;border-bottom:0}
     P .dim{position:absolute;color:#9fd0ff;font:10.5px Menlo,monospace}
     P .dim.hz{left:262px;top:232px;width:184px;height:10px;border-left:1px solid #9fd0ff;border-right:1px solid #9fd0ff;transform-origin:50% 50%}
     P .dim.hz:before{content:"";position:absolute;left:0;right:0;top:5px;border-top:1px solid #9fd0ff}
     P .dim.hz span{position:absolute;left:50%;top:-1px;transform:translateX(-50%);background:#123a80;padding:0 5px}
     P .dim.vt{left:452px;top:48px;width:10px;height:176px;border-top:1px solid #9fd0ff;border-bottom:1px solid #9fd0ff}
     P .dim.vt:before{content:"";position:absolute;top:0;bottom:0;left:5px;border-left:1px solid #9fd0ff}
     P .dim.vt span{position:absolute;top:50%;left:-6px;transform:translateY(-50%) rotate(90deg);background:#123a80;padding:0 4px}
     P .tag{position:absolute;left:24px;top:236px;font:10.5px Menlo,monospace;color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.4);padding:3px 7px}`,
    "// fig. 1 — dashboard", "get_started()", {
      build(root) {
        root.querySelector(".cam").insertAdjacentHTML("beforeend", `<div class="dim hz"><span>184</span></div><div class="dim vt"><span>176</span></div>`);
      },
      render(root, t) {
        const k = io(t, 1.3, 2.1, ease.inOut), d = root.querySelectorAll(".dim");
        S(d[0], { opacity: k, transform: `scaleX(${k})` }); S(d[1], { opacity: k, transform: `scaleY(${k})` });
      },
    });

  // 7. Clinical calm
  look("clinical-calm", "Clinical calm", "Soft off-white with teal and blue, rounded friendly shapes and slow, gentle motion.", ["Healthcare", "Wellness", "Trust-first products"],
    `--bg:#f3f7f7;--ink:#17323a;--mute:#dde8ea;--card:#fff;--line:#e3eced;--acc:#14a39a;--acc2:#bfe6f2;--font:-apple-system,"Avenir Next",system-ui,sans-serif;--hw:650;--hls:-1px;--r:22px;--cardSh:0 14px 34px -14px rgba(23,80,90,.25);--bar:#cdeceb;--barHi:#3b8fe0;--barR:8px;--axis:0`,
    `P .kick{color:#3b8fe0;letter-spacing:.5px;text-transform:none;font-size:12.5px;font-weight:600}
     P .h{font-size:42px}
     P .btn{box-shadow:0 8px 18px -8px rgba(20,163,154,.7)}
     P .soft{position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(20,163,154,.13),transparent)}
     P .pill{position:absolute;left:372px;top:32px;height:28px;padding:0 12px 0 8px;border-radius:14px;background:#fff;box-shadow:0 8px 20px -10px rgba(23,80,90,.35);display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:600;color:#14a39a}
     P .pill b{width:14px;height:14px;border-radius:50%;background:#14a39a;position:relative}
     P .pill b:after{content:"";position:absolute;left:4px;top:3px;width:3px;height:6px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}`,
    "Care, simplified", "Book a demo", {
      calm: true,
      build(root, deco) {
        deco.innerHTML = `<div class="soft" style="left:220px;top:-60px;width:320px;height:320px"></div><div class="soft" style="left:-80px;top:140px;width:260px;height:260px"></div>`;
        root.querySelector(".cam").insertAdjacentHTML("beforeend", `<div class="pill"><b></b>All clear</div>`);
      },
      render(root, t) {
        const k = io(t, 2.4, 3.3, ease.inOut);
        S(root.querySelector(".pill"), { opacity: k, transform: `translateY(${(1 - k) * 10}px)` });
        root.querySelectorAll(".soft").forEach((s, i) => S(s, { transform: `scale(${1 + 0.06 * Math.sin((t / LOOP) * Math.PI * 2 + i * 2)})` }));
      },
    });

  // 8. Neo-brutalist
  look("neo-brutal", "Neo-brutalist", "Flat loud colours, thick black borders, hard offset shadows and chunky type.", ["Startups", "Gen Z products", "Playful brands"],
    `--bg:#f5f0e6;--ink:#000;--mute:#000;--card:#ffe14d;--line:#000;--acc:#ff5c8a;--acc2:#5c8aff;--btnInk:#000;--font:"Arial Black","Helvetica Neue",Arial,sans-serif;--hw:900;--hls:-1.5px;--r:10px;--br:10px;--cardB:3px solid #000;--cardSh:7px 7px 0 #000;--bar:#5c8aff;--barHi:#ff5c8a;--barR:0;--axis:3px solid #000`,
    `P .h{font-size:46px;text-transform:uppercase;line-height:.95}
     P .kick{display:inline-block;background:#000;color:#ffe14d;padding:4px 8px;letter-spacing:1px;font-family:Arial,sans-serif}
     P .btn{border:3px solid #000;box-shadow:4px 4px 0 #000;font-family:Arial,sans-serif;font-weight:900;text-transform:uppercase;font-size:13px}
     P .sub i{height:8px;border-radius:0;opacity:.85}
     P .top i,P .lines i{border-radius:0;height:7px}
     P .av{border:3px solid #000;background:#ff5c8a}
     P .chart s{border:2.5px solid #000;border-bottom:0}
     P .star{position:absolute;left:216px;top:28px;width:52px;height:52px;background:#5c8aff;border:3px solid #000;border-radius:50%;display:grid;place-items:center;font:900 12px Arial,sans-serif;color:#fff;box-shadow:3px 3px 0 #000}`,
    "New drop", "Start now", {
      bounce: true,
      build(root) { root.querySelector(".cam").insertAdjacentHTML("beforeend", `<div class="star">2×</div>`); },
      render(root, t, q) {
        const k = io(t, 1.4, 2.0, ease.back);
        S(root.querySelector(".star"), { opacity: Math.min(1, k * 2), transform: `scale(${k}) rotate(${lerp(-40, -10, k) + Math.sin(t * 2) * 4}deg)` });
        // the button "presses" once mid loop
        const pr = Math.max(0, Math.sin(G.prog(t, 3.2, 3.6) * Math.PI));
        q.parts[3].style.boxShadow = `${4 - pr * 4}px ${4 - pr * 4}px 0 #000`;
        q.parts[3].style.transform += ` translate(${pr * 4}px,${pr * 4}px)`;
      },
    });

  // 9. Bold colour blocks
  look("bold-color", "Bold colour blocks", "Big saturated colour panels wipe across the screen under large white type. Loud and high energy.", ["Ads and promos", "Launch teasers", "Social clips"],
    `--bg:#ff4d2e;--ink:#fff;--mute:rgba(255,255,255,.55);--card:#fff;--line:#fff;--acc:#111;--acc2:#ff4d2e;--font:-apple-system,"Helvetica Neue",system-ui,sans-serif;--hw:900;--hls:-2.5px;--r:4px;--br:4px;--bar:#1d4ed8;--barHi:#ff4d2e;--barR:0;--axis:0`,
    `P .h{font-size:58px;line-height:.9;width:220px}
     P .kick{color:#111;background:#ffd400;display:inline-block;padding:4px 8px}
     P .card .top i,P .card .lines i{background:#e7e7ee}
     P .card{box-shadow:none}
     P .panel{position:absolute;top:0;bottom:0}`,
    "Launch week", "Get it now", {
      build(root, deco) {
        deco.innerHTML = `<div class="panel" style="left:0;width:480px;background:#1d4ed8"></div><div class="panel" style="left:236px;width:244px;background:#ffd400"></div><div class="panel" style="left:456px;width:24px;background:#111"></div>`;
      },
      render(root, t) {
        const p = root.querySelectorAll(".panel");
        // panels wipe in from the left, then wipe out to the right at the end
        [0, 0.18, 0.32].forEach((d, i) => {
          const a = io(t, 0.05 + d, 0.6 + d, ease.inOut), b = io(t, 5.3 + d * 0.6, 5.85 + d * 0.3, ease.inOut);
          S(p[i], { clipPath: `inset(0 ${(1 - a) * 100}% 0 ${b * 100}%)` });
        });
      },
    });
})();
