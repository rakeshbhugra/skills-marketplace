/* Captions and titles: each preview shows one caption style over the same simple product scene, looping two spoken sentences. */
(() => {
  const { io, prog, lerp, clamp, ease, vis, S } = G;
  const LOOP = 8;
  const SEN = [
    { text: "Every visitor gets a personal conversation.", a: 0.3, b: 3.8 },
    { text: "Answers arrive in seconds, not days.", a: 4.2, b: 7.7 },
  ].map((s) => ({ ...s, w: s.text.split(" ") }));
  // time each word is spoken
  const wt = (s, i) => s.a + 0.2 + (i * (s.b - s.a - 1.0)) / s.w.length;

  /* ---------- shared scene: a light product page with a chat widget ---------- */
  const CSS = `
&{position:absolute;inset:0;overflow:hidden;background:#f6f5f2;font-family:Inter,-apple-system,system-ui,sans-serif;color:#18181b}
& .sc{position:absolute;left:0;top:0;width:480px;height:270px;overflow:hidden;background:#ffffff;transform-origin:62% 45%}
& .sc i,& .sc div{position:absolute;display:block;box-sizing:border-box}
& .sc .g{background:#e7e5e0;height:6px;border-radius:3px}
& .sc .w{background:#18181b;border-radius:8px}
& .sc .m{background:#d6d3cc;height:7px;border-radius:4px}
& .sc .wid{left:272px;top:52px;width:184px;height:196px;border-radius:14px;background:#fff;border:1px solid #e5e3de;box-shadow:0 20px 50px rgba(24,24,27,.12)}
& .sc .hd{left:0;top:0;width:182px;height:40px;border-bottom:1px solid #efede8}
& .sc .av{left:12px;top:9px;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#0d9488)}
& .sc .vb{background:#2563eb;border-radius:12px 12px 4px 12px}
& .sc .bb{background:#f1efea;border-radius:12px 12px 12px 4px}
& .sc .met{left:32px;top:198px;width:130px;height:46px;border-radius:10px;background:#fff;border:1px solid #e5e3de;box-shadow:0 2px 8px rgba(24,24,27,.05)}
& .dim{position:absolute;inset:0;background:#ffffff;pointer-events:none}
`;
  const SCENE = `<div class="sc">
    <i style="left:24px;top:18px;width:18px;height:18px;border-radius:6px;background:#2563eb"></i>
    <i class="g" style="left:56px;top:24px;width:34px"></i><i class="g" style="left:100px;top:24px;width:30px"></i><i class="g" style="left:140px;top:24px;width:38px"></i>
    <i style="left:398px;top:15px;width:58px;height:22px;border-radius:11px;border:1.5px solid #2563eb"></i>
    <i class="w" style="left:32px;top:66px;width:184px;height:16px"></i><i class="w" style="left:32px;top:90px;width:132px;height:16px"></i>
    <i class="m" style="left:32px;top:122px;width:170px"></i><i class="m" style="left:32px;top:135px;width:140px"></i>
    <i style="left:32px;top:156px;width:88px;height:26px;border-radius:13px;background:#2563eb;box-shadow:0 6px 16px rgba(37,99,235,.3)"></i>
    <div class="met"><i class="m" style="left:12px;top:10px;width:50px;height:6px"></i><i class="w" style="left:12px;top:23px;width:40px;height:12px;border-radius:6px"></i>
      ${[10, 16, 12, 20, 26].map((h, i) => `<i style="left:${76 + i * 9}px;bottom:10px;width:5px;height:${h}px;border-radius:2px;background:#2563eb;opacity:${0.5 + i * 0.12}"></i>`).join("")}</div>
    <div class="wid"><div class="hd"><i class="av"></i><i class="w" style="left:42px;top:12px;width:70px;height:7px;border-radius:4px"></i><i class="m" style="left:42px;top:23px;width:40px;height:5px"></i></div>
      <i class="vb" style="left:96px;top:52px;width:80px;height:24px"></i>
      <div class="bb" style="left:12px;top:86px;width:140px;height:36px"><i class="m" style="left:12px;top:10px;width:110px;height:6px"></i><i class="m" style="left:12px;top:21px;width:80px;height:6px"></i></div>
      <i class="vb" style="left:108px;top:130px;width:68px;height:22px"></i>
      <div style="left:10px;top:162px;width:164px;height:24px;border-radius:12px;background:#f6f5f2;border:1px solid #e5e3de"><i style="left:142px;top:4px;width:14px;height:14px;border-radius:50%;background:#2563eb"></i></div></div>
  </div>`;

  function mount(el, id, inner, extra = "") {
    const c = "cp-" + id;
    el.innerHTML = `<style>${(CSS + extra).replaceAll("&", "." + c)}</style><div class="${c}">${SCENE}<i class="dim"></i>${inner}</div>`;
    const r = el.lastElementChild;
    el._sc = r.querySelector(".sc"); el._dim = r.querySelector(".dim");
    return r;
  }
  // slow camera drift that loops cleanly; dim = how strongly a white veil softens the UI behind the words
  const scene = (el, t, dim, extra = "") => {
    S(el._sc, { transform: `scale(${1.03 + 0.025 * Math.sin((2 * Math.PI * t) / LOOP)})${extra}` });
    S(el._dim, { opacity: dim });
  };
  const add = (o) => GALLERY.add({ section: "captions", loop: LOOP, ...o });
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  /* 1. subtitle pill */
  add({
    id: "subtitle-pill", title: "Subtitle pill",
    desc: "The full sentence sits in a dark rounded pill, centred near the bottom. Clear and calm. This is the current default.",
    bestFor: ["Any video", "Sound-off viewing"],
    build(el) {
      const r = mount(el, "subtitle-pill", `<div class="cap">${SEN.map((s) => `<span>${esc(s.text)}</span>`).join("")}</div>`, `
        & .cap{position:absolute;left:0;right:0;bottom:18px;display:grid;justify-items:center}
        & .cap span{grid-area:1/1;background:#18181b;color:#fff;font:600 15px/1.3 Inter,-apple-system,system-ui,sans-serif;padding:9px 18px;border-radius:999px;box-shadow:0 8px 24px rgba(24,24,27,.22);white-space:nowrap}`);
      el._p = [...r.querySelectorAll(".cap span")];
    },
    render(el, t) {
      scene(el, t, 0.3);
      SEN.forEach((s, k) => S(el._p[k], { opacity: vis(t, s.a, s.b, 0.35), transform: `translateY(${(1 - io(t, s.a, s.a + 0.45)) * 8}px)` }));
    },
  });

  /* 2. karaoke word highlight */
  add({
    id: "karaoke-words", title: "Word highlight",
    desc: "Words pop in as they are spoken, and the current word lights up in the accent colour. Bold, social-video style.",
    bestFor: ["Social clips", "Reels and shorts"],
    build(el) {
      const r = mount(el, "karaoke-words", `<i class="fade"></i><div class="cap">${SEN.map((s) => `<div>${s.w.map((w) => `<span>${esc(w)}</span>`).join("")}</div>`).join("")}</div>`, `
        & .fade{position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(rgba(255,255,255,0),rgba(255,255,255,.97) 55%)}
        & .cap{position:absolute;left:36px;right:36px;bottom:24px;display:grid;align-items:end}
        & .cap div{grid-area:1/1;text-align:center;font:800 26px/1.3 Inter,-apple-system,system-ui,sans-serif;letter-spacing:-.4px}
        & .cap span{display:inline-block;padding:0 5px;margin:0 1px;border-radius:8px;color:#18181b}`);
      el._s = [...r.querySelectorAll(".cap div")].map((d) => [...d.querySelectorAll("span")]);
    },
    render(el, t) {
      scene(el, t, 0.35);
      SEN.forEach((s, k) => {
        const out = 1 - prog(t, s.b - 0.3, s.b);
        el._s[k].forEach((sp, i) => {
          const a = wt(s, i), nx = i + 1 < s.w.length ? wt(s, i + 1) : s.b - 0.5;
          const inn = io(t, a - 0.06, a + 0.16), hl = Math.min(prog(t, a, a + 0.06), 1 - prog(t, nx, nx + 0.06));
          S(sp, { opacity: inn * out, transform: `translateY(${(1 - inn) * 10}px) scale(${0.85 + 0.15 * ease.back(prog(t, a - 0.06, a + 0.2)) + 0.06 * hl})`, background: `rgba(37,99,235,${hl})`, color: hl > 0.5 ? "#fff" : "#18181b", boxShadow: `0 6px 18px rgba(37,99,235,${0.35 * hl})` });
        });
      });
    },
  });

  /* 3. kinetic words, centre */
  const CHUNKS = [
    [["Every visitor"], ["gets a"], ["personal", 1], ["conversation."]],
    [["Answers arrive"], ["in seconds,", 1], ["not days."]],
  ];
  add({
    id: "kinetic-centre", title: "Kinetic words, centre",
    desc: "One or two big words at a time punch in at the centre of the screen while the product sits dimmed behind.",
    bestFor: ["Hooks and openers", "Bold promos"],
    build(el) {
      const r = mount(el, "kinetic-centre", CHUNKS.flat().map(([w, hi]) => `<span class="${hi ? "hi" : ""}">${esc(w)}</span>`).join(""), `
        & span{position:absolute;left:0;right:0;top:50%;margin-top:-30px;text-align:center;font:800 50px/60px Inter,-apple-system,system-ui,sans-serif;letter-spacing:-1.5px;white-space:nowrap;color:#18181b;text-shadow:0 2px 20px rgba(255,255,255,.9)}
        & span.hi{color:#2563eb}`);
      el._w = [...r.querySelectorAll("span")];
    },
    render(el, t) {
      scene(el, t, 0.72);
      S(el._sc, { filter: "blur(2.5px)" });
      let n = 0;
      CHUNKS.forEach((ch, k) => {
        const s = SEN[k], d = (s.b - s.a) / ch.length;
        ch.forEach((_, j) => {
          const a = s.a + j * d, b = a + d, inn = prog(t, a, a + 0.28), out = prog(t, b - 0.14, b);
          S(el._w[n++], { opacity: Math.min(prog(t, a, a + 0.12), 1 - out), transform: `scale(${lerp(0.55, 1, ease.back(inn)) + 0.12 * ease.out(out)}) translateY(${-8 * out}px)` });
        });
      });
    },
  });

  /* 4. lower third */
  const LT = [["Personal conversations", "Every visitor gets one, instantly"], ["Answers in seconds", "Not days. Not tickets."]];
  add({
    id: "lower-third", title: "Lower third title",
    desc: "A title and subtitle bar slides in at the bottom left, news style, holds for the beat, then slides away.",
    bestFor: ["Feature names", "Speaker or step labels"],
    build(el) {
      const r = mount(el, "lower-third", LT.map(([a, b]) => `<div class="lt"><i class="bar"></i><div class="pn"><div class="tx"><b>${a}</b><span>${b}</span></div></div></div>`).join(""), `
        & .lt{position:absolute;left:24px;bottom:26px;height:54px}
        & .bar{position:absolute;left:0;top:0;width:5px;height:54px;border-radius:3px;background:#2563eb;transform-origin:50% 100%}
        & .pn{position:absolute;left:11px;top:0;height:54px;background:#fff;border:1px solid #e5e3de;border-radius:8px;box-shadow:0 10px 30px rgba(24,24,27,.14);white-space:nowrap}
        & .tx{padding:9px 18px 0 14px}
        & .tx b{display:block;font:750 17px/1.25 Inter,-apple-system,system-ui,sans-serif;color:#18181b;letter-spacing:-.2px}
        & .tx span{display:block;margin-top:2px;font:500 12px/1.3 Inter,-apple-system,system-ui,sans-serif;color:#6b6b74}`);
      el._l = [...r.querySelectorAll(".lt")].map((l) => ({ bar: l.querySelector(".bar"), pn: l.querySelector(".pn"), tx: l.querySelector(".tx") }));
    },
    render(el, t) {
      scene(el, t, 0.15);
      SEN.forEach((s, k) => {
        const L = el._l[k], out = io(t, s.b - 0.4, s.b, ease.inOut);
        S(L.bar, { transform: `translateX(${-30 * out}px) scaleY(${io(t, s.a, s.a + 0.3)})`, opacity: 1 - out });
        S(L.pn, { clipPath: `inset(0 ${100 * (1 - io(t, s.a + 0.15, s.a + 0.6, ease.inOut))}% 0 0 round 8px)`, transform: `translateX(${-40 * out}px)`, opacity: 1 - out });
        const tx = io(t, s.a + 0.35, s.a + 0.8);
        S(L.tx, { opacity: tx, transform: `translateX(${(1 - tx) * -10}px)` });
      });
    },
  });

  /* 5. chapter cards */
  const CH = [["02", "Personal conversation", -0.6, 1.6], ["03", "Instant answers", 3.4, 5.4]];
  add({
    id: "chapter-card", title: "Chapter cards",
    desc: "A full-screen card like “02 — Personal conversation” opens each part, then wipes away to the scene.",
    bestFor: ["Longer explainers", "Multi-part demos"],
    build(el) {
      const r = mount(el, "chapter-card", CH.map(([n, tl]) => `<div class="cc"><div class="row"><b>${n}</b><i class="ln"></i><div class="tl"><span>Chapter</span>${tl}</div></div></div>`).join(""), `
        & .cc{position:absolute;inset:0;background:radial-gradient(circle at 30% 50%,#ffffff,#f6f5f2 70%);display:flex;align-items:center;justify-content:center;box-shadow:0 0 60px rgba(24,24,27,.18)}
        & .row{display:flex;align-items:center;gap:18px}
        & .row b{font:800 66px/1 Inter,-apple-system,system-ui,sans-serif;letter-spacing:-2px;color:#2563eb}
        & .ln{display:block;width:3px;height:56px;border-radius:2px;background:#e5e3de;transform-origin:50% 50%}
        & .tl{font:700 24px/1.2 Inter,-apple-system,system-ui,sans-serif;letter-spacing:-.4px;color:#18181b;white-space:nowrap}
        & .tl span{display:block;font:600 11px/1 Inter,-apple-system,system-ui,sans-serif;letter-spacing:2.5px;text-transform:uppercase;color:#6b6b74;margin-bottom:8px}`);
      el._c = [...r.querySelectorAll(".cc")].map((c) => ({ c, b: c.querySelector("b"), ln: c.querySelector(".ln"), tl: c.querySelector(".tl") }));
    },
    render(el, t) {
      scene(el, t, 0);
      CH.forEach(([, , E, X], k) => {
        const tt = k === 0 && t > 7 ? t - LOOP : t, C = el._c[k];
        const y = 270 * (1 - io(tt, E, E + 0.6, ease.inOut)) - 270 * io(tt, X, X + 0.6, ease.inOut);
        S(C.c, { transform: `translateY(${y}px)`, visibility: Math.abs(y) >= 270 ? "hidden" : "visible" });
        const a = io(tt, E + 0.35, E + 0.85), b = io(tt, E + 0.45, E + 0.95);
        S(C.b, { opacity: a, transform: `translateX(${(1 - a) * -24}px)` });
        S(C.ln, { transform: `scaleY(${io(tt, E + 0.3, E + 0.7)})` });
        S(C.tl, { opacity: b, transform: `translateX(${(1 - b) * 24}px)` });
      });
    },
  });

  /* 6. callout labels */
  // [sentence, word index that triggers it, label, target x, y, side]
  const CO = [
    [0, 1, "Visitor", 284, 73, "L"], [0, 4, "Personal chat", 285, 157, "L"],
    [1, 0, "Instant answer", 369, 117, "L"], [1, 3, "Under 3 s", 162, 221, "R"],
  ];
  add({
    id: "callouts", title: "Callout labels",
    desc: "No subtitles. Short labels with thin lines point at parts of the product as the voice mentions them.",
    bestFor: ["UI tours", "Feature spotlights"],
    build(el) {
      const r = mount(el, "callouts", `<svg width="480" height="270">${CO.map(() => `<line stroke="#2563eb" stroke-width="1.5"/>`).join("")}</svg>` +
        CO.map(([, , l]) => `<i class="dot"></i><span class="lb">${l}</span>`).join(""), `
        & svg{position:absolute;left:0;top:0}
        & .dot{position:absolute;left:0;top:0;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.22),0 0 0 1.5px #fff inset}
        & .lb{position:absolute;left:0;top:0;height:24px;padding:0 11px;border-radius:12px;background:#18181b;color:#fff;font:650 12px/24px Inter,-apple-system,system-ui,sans-serif;white-space:nowrap;box-shadow:0 6px 18px rgba(24,24,27,.22)}`);
      el._o = { ln: [...r.querySelectorAll("line")], dot: [...r.querySelectorAll(".dot")], lb: [...r.querySelectorAll(".lb")] };
    },
    render(el, t) {
      scene(el, t, 0.42);
      const O = el._o;
      const z = 1.03 + 0.025 * Math.sin((2 * Math.PI * t) / LOOP);
      CO.forEach(([k, wi, , x0w, y0w, side], i) => {
        const x = 297.6 + (x0w - 297.6) * z, y = 121.5 + (y0w - 121.5) * z;
        const s = SEN[k], a = wt(s, wi) - 0.1, out = 1 - prog(t, s.b - 0.3, s.b);
        const lw = O.lb[i].offsetWidth, len = side === "L" ? 42 : 18;
        const x0 = side === "L" ? x - len : x + len, d = io(t, a + 0.1, a + 0.45, ease.inOut), lb = io(t, a + 0.3, a + 0.65);
        const p = ease.back(prog(t, a, a + 0.3));
        S(O.dot[i], { transform: `translate(${x}px,${y}px) scale(${p})`, opacity: out });
        const ln = O.ln[i];
        ln.setAttribute("x1", x); ln.setAttribute("y1", y); ln.setAttribute("x2", lerp(x, x0, d)); ln.setAttribute("y2", y);
        ln.style.opacity = out;
        const lx = side === "L" ? x0 - lw : x0;
        S(O.lb[i], { transform: `translate(${lx + (side === "L" ? 8 : -8) * (1 - lb)}px,${y - 12}px)`, opacity: lb * out });
      });
    },
  });

  /* 7. text beside the screen */
  const SP = [["Personal by default", "Every visitor gets a personal conversation."], ["Fast answers", "Answers arrive in seconds, not days."]];
  add({
    id: "side-panel", title: "Text beside the screen",
    desc: "The product sits on the right. A heading and one line of copy on the left change with each beat.",
    bestFor: ["Feature pages", "Website hero videos"],
    build(el) {
      const r = mount(el, "side-panel", SP.map(([h, c], k) => `<div class="tx"><span>0${k + 1} / 02</span><b>${h}</b><p>${c}</p></div>`).join(""), `
        &{background:radial-gradient(circle at 15% 50%,#ffffff,#f6f5f2 60%)}
        & > .sc{left:178px;top:54px;transform-origin:0 0;border-radius:12px;box-shadow:0 0 0 1px #e5e3de,0 24px 60px rgba(24,24,27,.14)}
        & > .dim{display:none}
        & .tx{position:absolute;left:26px;top:0;width:142px;height:270px;display:flex;flex-direction:column;justify-content:center}
        & .tx span{font:700 11px/1 Inter,-apple-system,system-ui,sans-serif;letter-spacing:1.5px;color:#2563eb;margin-bottom:10px}
        & .tx b{font:750 22px/1.15 Inter,-apple-system,system-ui,sans-serif;letter-spacing:-.5px;color:#18181b}
        & .tx p{margin:10px 0 0;font:400 13px/1.45 Inter,-apple-system,system-ui,sans-serif;color:#6b6b74}`);
      el._t = [...r.querySelectorAll(".tx")].map((x) => [...x.children]);
    },
    render(el, t) {
      S(el._sc, { transform: `scale(${0.6 + 0.012 * Math.sin((2 * Math.PI * t) / LOOP)})` });
      SEN.forEach((s, k) => el._t[k].forEach((c, j) => {
        const inn = io(t, s.a + j * 0.1, s.a + 0.5 + j * 0.1), out = io(t, s.b - 0.35, s.b, ease.inOut);
        S(c, { opacity: inn * (1 - out), transform: `translateY(${(1 - inn) * 14 - out * 10}px)` });
      }));
    },
  });

  /* 8. minimal line */
  add({
    id: "minimal-line", title: "Minimal line",
    desc: "A small, thin, lower-case line at the very bottom with a slim progress bar. Barely there, so the product leads.",
    bestFor: ["Premium brands", "Design-led products"],
    build(el) {
      const r = mount(el, "minimal-line", `<i class="fade"></i>${SEN.map((s) => `<span class="ln">${esc(s.text.toLowerCase())}</span>`).join("")}<i class="tr"></i><i class="fl"></i>`, `
        & .fade{position:absolute;left:0;right:0;bottom:0;height:60px;background:linear-gradient(rgba(255,255,255,0),rgba(255,255,255,.92))}
        & .ln{position:absolute;left:0;right:0;bottom:14px;text-align:center;font:500 12px/1 Inter,-apple-system,system-ui,sans-serif;letter-spacing:.4px;color:#18181b}
        & .tr,& .fl{position:absolute;left:0;bottom:0;height:2px}
        & .tr{right:0;background:rgba(24,24,27,.1)}
        & .fl{width:480px;background:#2563eb;transform-origin:0 0}`);
      el._l = [...r.querySelectorAll(".ln")]; el._f = r.querySelector(".fl");
    },
    render(el, t) {
      scene(el, t, 0);
      SEN.forEach((s, k) => { const v = vis(t, s.a, s.b, 0.4); S(el._l[k], { opacity: v, transform: `translateY(${(1 - io(t, s.a, s.a + 0.5)) * 4}px)` }); });
      S(el._f, { transform: `scaleX(${t / LOOP})`, opacity: 1 - prog(t, LOOP - 0.3, LOOP) });
    },
  });
})();
