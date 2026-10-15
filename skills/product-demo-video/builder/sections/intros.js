/* Openers and endings: the first and last few seconds of a video. */
(() => {
  const { io, vis, lerp, clamp, prog, KF, S, rnd, ease, typed } = G;

  // Shared bits: dark stage, logo mark (rounded square with a circle), wordmark, a mock dashboard.
  const base = (P) => `
${P}{position:absolute;inset:0;overflow:hidden;background:#f6f5f2;color:#18181b;font-family:-apple-system,"Inter",system-ui,sans-serif}
${P} .bgglow{position:absolute;inset:0;background:radial-gradient(60% 70% at 50% 45%,rgba(37,99,235,.07),transparent 70%)}
${P} .mark{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#2563eb,#0d9488);position:relative;box-shadow:0 12px 34px -8px rgba(37,99,235,.7)}
${P} .mark:after{content:"";position:absolute;inset:17px;border-radius:50%;background:#f6f5f2}
${P} .word{font-weight:800;font-size:40px;letter-spacing:-1.5px}
${P} .c{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}
${P} .ui{position:absolute;inset:0;background:#ffffff;display:flex}
${P} .ui .sb{width:96px;background:#f6f5f2;border-right:1px solid #e5e3de;padding:16px 12px;display:flex;flex-direction:column;gap:11px}
${P} .ui .sb b{width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,#2563eb,#0d9488);margin-bottom:6px}
${P} .ui .sb i{display:block;height:7px;border-radius:4px;background:#e7e5e0}
${P} .ui .sb i:nth-of-type(1){background:#2563eb;width:60px}${P} .ui .sb i:nth-of-type(2){width:52px}${P} .ui .sb i:nth-of-type(3){width:64px}${P} .ui .sb i:nth-of-type(4){width:44px}
${P} .ui .mn{flex:1;padding:16px 18px;display:flex;flex-direction:column;gap:12px}
${P} .ui .hd{display:flex;justify-content:space-between;align-items:center}
${P} .ui .hd i{width:120px;height:10px;border-radius:5px;background:#d6d3cc}
${P} .ui .hd u{width:60px;height:20px;border-radius:6px;background:#2563eb}
${P} .ui .kp{display:flex;gap:10px}
${P} .ui .kp div{flex:1;height:52px;border-radius:10px;background:#ffffff;border:1px solid #e5e3de;padding:10px;display:flex;flex-direction:column;gap:8px}
${P} .ui .kp i{width:40px;height:6px;border-radius:3px;background:#d6d3cc}
${P} .ui .kp b{width:56px;height:12px;border-radius:4px;background:#18181b}
${P} .ui .kp div:nth-child(2) b{background:#0d9488}
${P} .ui .ch{flex:1;border-radius:10px;background:#ffffff;border:1px solid #e5e3de;position:relative;overflow:hidden}
${P} .ui .ch svg{position:absolute;inset:0;width:100%;height:100%}`;
  const UI = `<div class="ui"><div class="sb"><b></b><i></i><i></i><i></i><i></i></div><div class="mn"><div class="hd"><i></i><u></u></div>
    <div class="kp"><div><i></i><b></b></div><div><i></i><b></b></div><div><i></i><b></b></div></div>
    <div class="ch"><svg viewBox="0 0 340 110" preserveAspectRatio="none"><defs><linearGradient id="__G" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563eb" stop-opacity=".45"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs>
    <path d="M0 90 C40 80 60 60 100 66 S160 40 200 44 S270 18 340 14 L340 110 L0 110Z" fill="url(#__G)"/><path d="M0 90 C40 80 60 60 100 66 S160 40 200 44 S270 18 340 14" fill="none" stroke="#2563eb" stroke-width="2.5"/></svg></div></div></div>`;

  // Build helper: scoped style + html; every [data-k] element is cached as q.<name>.
  function item(o) {
    const P = ".in-" + o.id;
    GALLERY.add({
      section: "intros", id: o.id, title: o.title, desc: o.desc, bestFor: o.bestFor, loop: o.loop,
      build(el) {
        el.innerHTML = `<style>${base(P)}${(o.css || "").replaceAll("P", P)}</style><div class="in-${o.id}">${o.html.replaceAll("__G", "g-" + o.id)}</div>`;
        const root = el.querySelector(P), q = { root };
        root.querySelectorAll("[data-k]").forEach((n) => (q[n.dataset.k] = n));
        o.build?.(q);
        el._q = q;
      },
      render(el, t) { o.render(el._q, t); },
    });
  }
  const pop = (n, k, y = 14, s = 0.94) => S(n, { opacity: clamp(k), transform: `translateY(${(1 - k) * y}px) scale(${lerp(s, 1, k)})` });

  // 1. Particle logo -------------------------------------------------------
  const inRR = (x, y, cx, cy, h, r) => Math.hypot(Math.max(Math.abs(x - cx) - (h - r), 0), Math.max(Math.abs(y - cy) - (h - r), 0)) <= r;
  item({
    id: "particle-logo", title: "Particle logo", loop: 6,
    desc: "Hundreds of light specks stream in from the edges and gather into the logo, then the name fades in.",
    bestFor: ["Brand openers", "Launch videos", "Premium feel"],
    css: `P canvas{position:absolute;left:0;top:0;width:480px;height:270px}P .word{position:absolute;left:0;right:0;top:172px;text-align:center}
          P .tag{position:absolute;left:0;right:0;top:220px;text-align:center;font-size:13px;color:#6b6b74;letter-spacing:.3px}`,
    html: `<canvas data-k="cv" width="960" height="540"></canvas><div class="word" data-k="word">acme</div><div class="tag" data-k="tag">Work that follows up for you</div>`,
    build(q) {
      const pts = []; let s = 1;
      while (pts.length < 520) { const x = 202 + rnd(s++) * 76, y = 72 + rnd(s++) * 76; if (inRR(x, y, 240, 110, 38, 15) && Math.hypot(x - 240, y - 110) > 15) pts.push([x, y]); }
      q.pts = pts.map(([x, y], i) => { const a = rnd(i + 900) * Math.PI * 2, R = 220 + rnd(i + 400) * 100; return { x, y, sx: 240 + Math.cos(a) * R, sy: 135 + Math.sin(a) * R * 0.7, d: rnd(i + 77) * 0.9, sw: (rnd(i + 31) - 0.5) * 140, c: i % 3 ? "#2563eb" : "#18181b" }; });
      q.ctx = q.cv.getContext("2d");
    },
    render(q, t) {
      const c = q.ctx, out = vis(t, 0, 6, 0.5), solid = io(t, 2.3, 3.0) * out;
      c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 480, 270);
      const g = c.createRadialGradient(240, 110, 0, 240, 110, 150); g.addColorStop(0, `rgba(37,99,235,${0.22 * io(t, 1.4, 2.6) * out})`); g.addColorStop(1, "rgba(37,99,235,0)");
      c.fillStyle = g; c.fillRect(0, 0, 480, 270);
      c.globalCompositeOperation = "source-over";
      for (const p of q.pts) {
        const k = io(t, 0.15 + p.d, 1.5 + p.d, ease.inOut), sw = Math.sin(k * Math.PI) * p.sw;
        const dx = p.x - p.sx, dy = p.y - p.sy, L = Math.hypot(dx, dy) || 1;
        const x = lerp(p.sx, p.x, k) - (dy / L) * sw, y = lerp(p.sy, p.y, k) + (dx / L) * sw;
        c.globalAlpha = (0.35 + 0.65 * k) * out * (1 - 0.7 * solid); c.fillStyle = p.c;
        c.fillRect(x - 1, y - 1, 2, 2);
      }
      c.globalCompositeOperation = "source-over";
      if (solid > 0) {
        const sc = lerp(0.92, 1, solid);
        c.globalAlpha = solid; c.save(); c.translate(240, 110); c.scale(sc, sc);
        const gr = c.createLinearGradient(-38, -38, 38, 38); gr.addColorStop(0, "#2563eb"); gr.addColorStop(1, "#0d9488");
        c.shadowColor = "rgba(37,99,235,.8)"; c.shadowBlur = 30; c.fillStyle = gr;
        c.beginPath(); c.roundRect(-38, -38, 76, 76, 20); c.fill(); c.shadowBlur = 0;
        c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(0, 0, 15, 0, Math.PI * 2); c.fill();
        c.restore(); c.globalCompositeOperation = "source-over";
      }
      c.globalAlpha = 1;
      pop(q.word, io(t, 2.7, 3.4) * out, 12, 1);
      pop(q.tag, io(t, 3.1, 3.8) * out, 8, 1);
    },
  });

  // 2. Typewriter hook -----------------------------------------------------
  const LINE = "Your team loses 3 hours a day to busywork.";
  item({
    id: "typewriter-hook", title: "Typewriter hook", loop: 7,
    desc: "A one-line problem types out with a blinking cursor. Then the product name lands as the answer.",
    bestFor: ["Problem-first openers", "Explainers", "Social hooks"],
    css: `P .line{position:absolute;left:40px;right:40px;top:104px;font-size:25px;font-weight:600;letter-spacing:-.4px;line-height:1.3;color:#18181b}
          P .line em{font-style:normal;color:#2563eb}
          P .cur{display:inline-block;width:3px;height:26px;background:#2563eb;vertical-align:-4px;margin-left:3px;box-shadow:0 0 10px #2563eb}
          P .brand{position:absolute;left:0;right:0;top:150px;display:flex;align-items:center;justify-content:center;gap:14px}
          P .brand .mark{width:46px;height:46px;border-radius:13px}P .brand .mark:after{inset:14px}
          P .brand .word{font-size:46px}
          P .sub{position:absolute;left:0;right:0;top:214px;text-align:center;font-size:14px;color:#6b6b74}
          P .lbl{position:absolute;left:40px;top:72px;font:600 11px/1 -apple-system,system-ui;letter-spacing:2px;color:#6b6b74}`,
    html: `<div class="bgglow"></div><div class="lbl" data-k="lbl">THE PROBLEM</div><div class="line" data-k="line"></div>
           <div class="brand" data-k="brand"><div class="mark"></div><div class="word">acme</div></div><div class="sub" data-k="sub">gives those hours back.</div>`,
    render(q, t) {
      const out = vis(t, 0, 7, 0.5), s = typed(LINE, t, 0.5, 19), typing = s.length < LINE.length;
      const blink = typing || Math.floor(t * 2.4) % 2 === 0;
      if (q.line._s !== s + blink) { q.line._s = s + blink; q.line.innerHTML = s.replace("3 hours a day", "<em>3 hours a day</em>").replace(/<em>([^<]*)$/, "<em>$1</em>") + `<span class="cur" style="opacity:${blink ? 1 : 0}"></span>`; }
      const up = io(t, 3.5, 4.2, ease.inOut);
      S(q.line, { opacity: out * lerp(1, 0.5, up), transform: `translateY(${-up * 46}px) scale(${lerp(1, 0.8, up)})`, transformOrigin: "50% 0", textAlign: up > 0 ? "center" : "left", left: lerp(40, 20, up) + "px", right: lerp(40, 20, up) + "px" });
      S(q.lbl, { opacity: io(t, 0.1, 0.5) * (1 - up) * out });
      const b = io(t, 3.9, 4.6, ease.back);
      S(q.brand, { opacity: clamp(b * 1.5) * out, transform: `translateY(${(1 - b) * 26}px) scale(${lerp(0.85, 1, b)})` });
      pop(q.sub, io(t, 4.5, 5.1) * out, 8, 1);
    },
  });

  // 3. Question hook -------------------------------------------------------
  const QW = "What if your team never missed a lead?".split(" ");
  item({
    id: "question-hook", title: "Question hook", loop: 7,
    desc: "A big question appears one word at a time to make the viewer think. A quiet answer line follows.",
    bestFor: ["Social hooks", "Ads", "Problem-first openers"],
    css: `P .q{position:absolute;left:36px;right:36px;top:62px;font-size:38px;font-weight:800;letter-spacing:-1.2px;line-height:1.12;text-align:center}
          P .q span{display:inline-block}
          P .q span.hi{background:linear-gradient(90deg,#2563eb,#0d9488);-webkit-background-clip:text;background-clip:text;color:transparent}
          P .a{position:absolute;left:0;right:0;top:186px;display:flex;justify-content:center;align-items:center;gap:10px;font-size:15px;color:#6b6b74}
          P .a .mark{width:22px;height:22px;border-radius:7px}P .a .mark:after{inset:7px}
          P .a b{color:#18181b}
          P .rule{position:absolute;left:210px;width:60px;top:170px;height:2px;border-radius:2px;background:linear-gradient(90deg,#2563eb,#0d9488)}`,
    html: `<div class="bgglow"></div><div class="q" data-k="q">${QW.map((w) => `<span${w === "never" ? ' class="hi"' : ""}>${w}</span>`).join(" ")}</div>
           <div class="rule" data-k="rule"></div><div class="a" data-k="a"><div class="mark"></div><span><b>acme</b> follows up on every lead, for you.</span></div>`,
    build(q) { q.ws = [...q.q.children]; },
    render(q, t) {
      const out = vis(t, 0, 7, 0.5);
      q.ws.forEach((w, i) => {
        const k = io(t, 0.3 + i * 0.26, 0.9 + i * 0.26);
        S(w, { opacity: k * out, transform: `translateY(${(1 - k) * 18}px)`, filter: `blur(${(1 - k) * 6}px)` });
      });
      const settle = io(t, 2.9, 3.6, ease.inOut);
      S(q.q, { transform: `translateY(${-settle * 10}px)` });
      S(q.rule, { opacity: out, transform: `scaleX(${io(t, 3.2, 3.9, ease.inOut)})` });
      pop(q.a, io(t, 3.5, 4.2) * out, 10, 1);
    },
  });

  // 4. Cold open -----------------------------------------------------------
  item({
    id: "cold-open", title: "Cold open", loop: 7,
    desc: "Starts in the middle of the action inside the product, with the cursor already working. Then the title card cuts in.",
    bestFor: ["Product-led demos", "Developer tools", "Social clips"],
    css: `P .app{position:absolute;inset:0;transform-origin:62% 45%}
          P .rows{position:absolute;left:112px;right:16px;top:58px;display:flex;flex-direction:column;gap:8px}
          P .row{height:30px;border-radius:8px;background:#ffffff;border:1px solid #e5e3de;display:flex;align-items:center;gap:10px;padding:0 10px}
          P .row b{width:16px;height:16px;border-radius:50%;background:#e7e5e0;flex:none}
          P .row i{height:6px;border-radius:3px;background:#d6d3cc;width:90px}P .row i+i{width:50px;opacity:.6}
          P .row u{margin-left:auto;width:38px;height:12px;border-radius:6px;background:#e7e5e0}
          P .row.on{border-color:#2563eb;background:#eff6ff}
          P .top{position:absolute;left:112px;right:16px;top:18px;height:24px;display:flex;align-items:center;gap:10px}
          P .top i{width:110px;height:10px;border-radius:5px;background:#d6d3cc}
          P .side{position:absolute;left:0;top:0;bottom:0;width:96px;background:#f6f5f2;border-right:1px solid #e5e3de;padding:16px 12px;display:flex;flex-direction:column;gap:11px}
          P .side b{width:22px;height:22px;border-radius:7px;background:#e7e5e0;margin-bottom:6px}
          P .side i{height:7px;border-radius:4px;background:#e7e5e0}
          P .panel{position:absolute;right:0;top:0;bottom:0;width:170px;background:#ffffff;border-left:1px solid #e5e3de;padding:18px 16px;display:flex;flex-direction:column;gap:10px;box-shadow:-16px 0 30px rgba(0,0,0,.06)}
          P .panel b{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#0d9488)}
          P .panel i{height:7px;border-radius:4px;background:#d6d3cc}
          P .send{margin-top:auto;height:30px;border-radius:8px;background:#2563eb;color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center}
          P .cursor{position:absolute;left:0;top:0;width:18px;height:18px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}
          P .rip{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:2px solid #0d9488}
          P .title{position:absolute;inset:0;background:#f6f5f2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
          P .title .row2{display:flex;align-items:center;gap:14px}P .title .word{font-size:50px}
          P .title p{font-size:15px;color:#6b6b74}
          P .flash{position:absolute;inset:0;background:#18181b;pointer-events:none}
          P .live{position:absolute;left:112px;bottom:14px;font:600 10.5px/1 -apple-system,system-ui;color:#6b6b74;letter-spacing:1.5px;display:flex;align-items:center;gap:6px}
          P .live:before{content:"";width:6px;height:6px;border-radius:50%;background:#ef4444}`,
    html: `<div class="app" data-k="app" style="background:#ffffff;position:absolute;inset:0">
             <div class="side"><b></b><i style="width:60px;background:#2563eb"></i><i style="width:50px"></i><i style="width:64px"></i><i style="width:44px"></i></div>
             <div class="top"><i></i></div>
             <div class="rows" data-k="rows">${"<div class='row'><b></b><i></i><i></i><u></u></div>".repeat(5)}</div>
             <div class="panel" data-k="panel"><b></b><i style="width:100px"></i><i style="width:70px;opacity:.6"></i><i style="width:120px;margin-top:8px"></i><i style="width:96px"></i><i style="width:110px"></i><div class="send" data-k="send">Send follow-up</div></div>
             <div class="live">REC 00:14</div>
             <div class="rip" data-k="rip"></div>
             <svg class="cursor" data-k="cur" viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.5 L12 13.8 L19 13.8 Z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>
           </div>
           <div class="title" data-k="title"><div class="row2"><div class="mark"></div><div class="word">acme</div></div><p>Follow-ups on autopilot.</p></div>
           <div class="flash" data-k="flash"></div>`,
    build(q) { q.rs = [...q.rows.children]; },
    render(q, t) {
      // cursor path: already moving at t=0, clicks a row, then the send button
      const [cx, cy] = KF(t, [[0, 330, 230], [0.9, 300, 116], [1.3, 300, 116], [2.0, 395, 238], [3.4, 395, 238]]);
      const c1 = prog(t, 1.0, 1.4), c2 = prog(t, 2.2, 2.6);
      S(q.cur, { transform: `translate(${cx - 4}px,${cy - 2}px) scale(${1 - 0.15 * Math.sin(Math.max(c1, c2) * Math.PI)})` });
      const rc = c1 > 0 && c1 < 1 ? [300, 116, c1] : c2 > 0 && c2 < 1 ? [395, 238, c2] : null;
      S(q.rip, rc ? { left: rc[0] + "px", top: rc[1] + "px", opacity: 1 - rc[2], transform: `scale(${0.4 + rc[2] * 1.4})` } : { opacity: 0 });
      q.rs.forEach((r, i) => r.classList.toggle("on", i === 1 && t > 1.05));
      const pk = io(t, 1.2, 1.7);
      S(q.panel, { transform: `translateX(${(1 - pk) * 180}px)` });
      const sent = t > 2.35;
      if (q.send._s !== sent) { q.send._s = sent; q.send.textContent = sent ? "Sent ✓" : "Send follow-up"; q.send.style.background = sent ? "#0d9488" : "#2563eb"; }
      S(q.app, { transform: `scale(${lerp(1.0, 1.08, io(t, 0, 3.2, ease.inOut))})`, opacity: t < 3.3 ? prog(t, 0, 0.3) : 0 });
      // hard cut at 3.3 with a quick white flash
      const cut = t >= 3.3;
      S(q.title, { opacity: cut ? (t < 6.5 ? 1 : 1 - prog(t, 6.5, 7)) : 0 });
      S(q.flash, { opacity: cut ? 0.5 * (1 - prog(t, 3.3, 3.45)) : 0 });
      const tk = io(t, 3.3, 4.2);
      S(q.title.firstElementChild, { transform: `scale(${lerp(1.12, 1, tk)})` });
      pop(q.title.lastElementChild, io(t, 3.7, 4.3), 8, 1);
    },
  });

  // 5. Logo mask reveal ----------------------------------------------------
  item({
    id: "logo-mask", title: "Logo mask reveal", loop: 7,
    desc: "A shape grows from the centre to reveal the product behind it, then shrinks back down into the logo.",
    bestFor: ["Brand openers", "Endings", "Launch videos"],
    css: `P .win{position:absolute;inset:0}P .tint{position:absolute;inset:0;background:linear-gradient(135deg,#2563eb,#0d9488)}
          P .word{position:absolute;left:252px;top:115px;font-size:36px}
          P .ring{position:absolute;left:240px;top:135px;width:10px;height:10px;margin:-5px;border-radius:50%;border:1.5px solid rgba(37,99,235,.6)}`,
    html: `<div class="bgglow"></div><div class="ring" data-k="ring"></div><div class="win" data-k="win">${UI}<div class="tint" data-k="tint"></div><div data-k="hole" style="position:absolute;width:20px;height:20px;margin:-10px;border-radius:50%;background:#f6f5f2"></div></div><div class="word" data-k="word">acme</div>`,
    render(q, t) {
      // clip box: centre dot -> full screen -> 60px logo square, then slides left to make room for the name
      const [w, h, r, x] = KF(t, [[0, 0, 0, 0, 240], [0.3, 14, 14, 7, 240], [1.5, 620, 620, 310, 240], [3.4, 620, 620, 310, 240], [4.5, 60, 60, 17, 240], [5.0, 60, 60, 17, 208]]);
      const y = 135;
      S(q.win, { clipPath: `inset(${y - h / 2}px ${480 - x - w / 2}px ${270 - y - h / 2}px ${x - w / 2}px round ${r}px)`, opacity: vis(t, 0, 7, 0.45), transform: `scale(${lerp(1.06, 1, io(t, 0.4, 3.4))})`, transformOrigin: `${x}px ${y}px` });
      S(q.tint, { opacity: io(t, 3.9, 4.5) });
      S(q.hole, { left: x + 'px', top: y + 'px', opacity: io(t, 4.2, 4.6), transform: `scale(${io(t, 4.2, 4.7, ease.back)})` });
      const k = io(t, 4.9, 5.5);
      S(q.word, { opacity: k * vis(t, 0, 7, 0.45), transform: `translateX(${(1 - k) * -12}px)`, clipPath: `inset(0 ${(1 - k) * 100}% 0 0)` });
      const rk = prog(t, 0.1, 1.2);
      S(q.ring, { opacity: (1 - rk) * (rk > 0 ? 1 : 0), transform: `scale(${1 + rk * 30})` });
    },
  });

  // 6. Big stat hook -------------------------------------------------------
  item({
    id: "stat-hook", title: "Big stat hook", loop: 6,
    desc: "A huge number counts up to grab attention, with one short line that makes it hurt.",
    bestFor: ["Social hooks", "Sales videos", "Problem-first openers"],
    css: `P .num{position:absolute;left:0;right:0;top:44px;text-align:center;font-size:118px;font-weight:850;letter-spacing:-5px;line-height:1;font-variant-numeric:tabular-nums;
                 background:linear-gradient(180deg,#18181b 35%,#2563eb);-webkit-background-clip:text;background-clip:text;color:transparent}
          P .bar{position:absolute;left:120px;width:240px;top:178px;height:6px;border-radius:3px;background:#e5e3de;overflow:hidden}
          P .bar i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,#2563eb,#0d9488);}
          P .line{position:absolute;left:0;right:0;top:200px;text-align:center;font-size:19px;font-weight:600;color:#18181b;letter-spacing:-.2px}
          P .src{position:absolute;left:0;right:0;top:232px;text-align:center;font-size:11px;color:#6b6b74}`,
    html: `<div class="bgglow"></div><div class="num" data-k="num">0%</div><div class="bar"><i data-k="bar"></i></div>
           <div class="line" data-k="line">of buyers leave without a word</div><div class="src" data-k="src">Source: your own data</div>`,
    render(q, t) {
      const out = vis(t, 0, 6, 0.5), k = io(t, 0.3, 2.0, (x) => 1 - Math.pow(1 - x, 4));
      const n = Math.round(67 * k) + "%";
      if (q.num.textContent !== n) q.num.textContent = n;
      const pk = io(t, 0.1, 0.6);
      S(q.num, { opacity: pk * out, transform: `scale(${lerp(0.85, 1, pk) + 0.03 * Math.sin(prog(t, 1.9, 2.4) * Math.PI)})` });
      S(q.bar, { width: k * 67 + "%" }); S(q.bar.parentNode, { opacity: pk * out });
      pop(q.line, io(t, 1.7, 2.4) * out, 10, 1);
      S(q.src, { opacity: io(t, 2.4, 3) * out * 0.9 });
    },
  });

  // 7. End card with CTA ---------------------------------------------------
  item({
    id: "end-cta", title: "End card with call to action", loop: 6,
    desc: "Logo, tagline, web address and a pulsing button, so viewers know exactly what to do next.",
    bestFor: ["Every video ending", "Sales videos", "Ads"],
    css: `P .lg{position:absolute;left:0;right:0;top:46px;display:flex;justify-content:center;align-items:center;gap:12px}
          P .lg .mark{width:42px;height:42px;border-radius:12px}P .lg .mark:after{inset:13px}P .lg .word{font-size:38px}
          P .tg{position:absolute;left:0;right:0;top:104px;text-align:center;font-size:20px;font-weight:600;color:#18181b;letter-spacing:-.3px}
          P .btnw{position:absolute;left:0;right:0;top:150px;display:flex;justify-content:center}
          P .btn{position:relative;padding:12px 26px;border-radius:999px;background:linear-gradient(90deg,#2563eb,#1d4ed8);font-size:15px;font-weight:700;color:#fff;box-shadow:0 10px 30px -8px rgba(37,99,235,.8)}
          P .btn s{position:absolute;inset:0;border-radius:999px;border:2px solid #2563eb;text-decoration:none}
          P .url{position:absolute;left:0;right:0;top:212px;text-align:center;font:500 14px/1 "SF Mono",Menlo,monospace;color:#2563eb;letter-spacing:.3px}`,
    html: `<div class="bgglow"></div><div class="lg" data-k="lg"><div class="mark"></div><div class="word">acme</div></div><div class="tg" data-k="tg">Every lead, followed up.</div>
           <div class="btnw"><div class="btn" data-k="btn">Book a demo<s data-k="r1"></s><s data-k="r2"></s></div></div><div class="url" data-k="url">acme.com/demo</div>`,
    render(q, t) {
      const out = vis(t, 0, 6, 0.5);
      pop(q.lg, io(t, 0.2, 0.9, ease.back) * out, 12, 0.8);
      pop(q.tg, io(t, 0.6, 1.2) * out, 10, 1);
      const b = io(t, 1.0, 1.6, ease.back);
      const pulse = t > 1.8 ? 1 + 0.045 * Math.max(0, Math.sin((t - 1.8) * Math.PI * 1.25)) : 1;
      S(q.btn, { opacity: clamp(b * 1.4) * out, transform: `translateY(${(1 - b) * 12}px) scale(${lerp(0.9, 1, b) * pulse})` });
      [q.r1, q.r2].forEach((r, i) => { const p = ((t - 1.8 - i * 0.8) / 1.6) % 1; const on = t > 1.8 + i * 0.8 && t < 5.4; S(r, { opacity: on ? (1 - p) * 0.8 : 0, transform: `scale(${1 + (on ? p : 0) * 0.35},${1 + (on ? p : 0) * 0.9})` }); });
      pop(q.url, io(t, 1.4, 2.0) * out, 8, 1);
    },
  });

  // 8. Recap montage ending ------------------------------------------------
  const TILES = [
    `<svg viewBox="0 0 100 56"><rect x="12" y="30" width="10" height="16" rx="2" fill="#2563eb"/><rect x="28" y="22" width="10" height="24" rx="2" fill="#2563eb"/><rect x="44" y="26" width="10" height="20" rx="2" fill="#2563eb"/><rect x="60" y="14" width="10" height="32" rx="2" fill="#2563eb"/><rect x="76" y="8" width="10" height="38" rx="2" fill="#0d9488"/></svg>`,
    `<svg viewBox="0 0 100 56"><g fill="#d6d3cc"><circle cx="16" cy="14" r="5"/><circle cx="16" cy="28" r="5"/><circle cx="16" cy="42" r="5"/><rect x="26" y="11" width="44" height="6" rx="3"/><rect x="26" y="25" width="34" height="6" rx="3"/><rect x="26" y="39" width="50" height="6" rx="3"/></g><rect x="76" y="10" width="14" height="8" rx="4" fill="#0d9488"/><rect x="76" y="24" width="14" height="8" rx="4" fill="#2563eb"/></svg>`,
    `<svg viewBox="0 0 100 56"><circle cx="50" cy="28" r="17" fill="none" stroke="#e7e5e0" stroke-width="7"/><circle cx="50" cy="28" r="17" fill="none" stroke="#0d9488" stroke-width="7" stroke-dasharray="72 200" transform="rotate(-90 50 28)"/></svg>`,
    `<svg viewBox="0 0 100 56"><rect x="10" y="9" width="52" height="14" rx="7" fill="#e7e5e0"/><rect x="38" y="31" width="52" height="14" rx="7" fill="#2563eb"/></svg>`,
    `<svg viewBox="0 0 100 56"><path d="M6 46 C24 40 30 22 48 28 S74 12 94 8" fill="none" stroke="#2563eb" stroke-width="3"/><circle cx="94" cy="8" r="4" fill="#0d9488"/></svg>`,
    `<svg viewBox="0 0 100 56"><rect x="18" y="12" width="64" height="32" rx="6" fill="#f6f5f2" stroke="#d6d3cc"/><path d="M38 28 l7 7 l15 -14" fill="none" stroke="#0d9488" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ];
  item({
    id: "end-recap", title: "Recap montage ending", loop: 7,
    desc: "A grid of quick moments from the video plays once more, then they all fly together into the logo.",
    bestFor: ["Feature tours", "Launch videos", "Long demos"],
    css: `P .t{position:absolute;width:132px;height:74px;border-radius:12px;background:#ffffff;border:1px solid #e5e3de;overflow:hidden;box-shadow:0 10px 24px -12px rgba(0,0,0,.18)}
          P .t svg{position:absolute;inset:0;width:100%;height:100%}
          P .end{position:absolute;left:0;right:0;top:100px;display:flex;justify-content:center;align-items:center;gap:14px}
          P .end .word{font-size:46px}
          P .tg{position:absolute;left:0;right:0;top:176px;text-align:center;font-size:14px;color:#6b6b74}`,
    html: `<div class="bgglow"></div>${TILES.map((s) => `<div class="t">${s}</div>`).join("")}<div class="end" data-k="end"><div class="mark" data-k="mk"></div><div class="word" data-k="word">acme</div></div><div class="tg" data-k="tg">Everything your team needs, in one place.</div>`,
    build(q) { q.ts = [...q.root.querySelectorAll(".t")]; },
    render(q, t) {
      const out = vis(t, 0, 7, 0.5);
      q.ts.forEach((el, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = 24 + col * 150, y = 48 + row * 96, cx = 240 - 66, cy = 135 - 37;
        const k = io(t, 0.15 + i * 0.12, 0.75 + i * 0.12, ease.back), f = io(t, 2.7 + (5 - i) * 0.05, 3.6 + (5 - i) * 0.05, ease.inOut);
        S(el, {
          left: lerp(x, cx, f) + "px", top: lerp(y, cy, f) + "px", opacity: clamp(k * 1.3) * (1 - prog(t, 3.4, 3.75)) * out,
          transform: `scale(${lerp(0.7, 1, k) * lerp(1, 0.12, f) * (1 + 0.02 * Math.sin(t * 2 + i))}) rotate(${f * (i % 2 ? 40 : -40)}deg)`,
        });
      });
      const m = io(t, 3.55, 4.15, ease.back);
      S(q.end, { opacity: out });
      S(q.mk, { opacity: clamp(m * 2), transform: `translateX(${(1 - io(t, 4.0, 4.6, ease.inOut)) * 56}px) scale(${m}) rotate(${(1 - m) * -90}deg)` });
      const w = io(t, 4.1, 4.7);
      S(q.word, { opacity: w, clipPath: `inset(0 ${(1 - w) * 100}% 0 0)` });
      pop(q.tg, io(t, 4.5, 5.1) * out, 8, 1);
    },
  });

  // 9. Seamless loop ending ------------------------------------------------
  item({
    id: "end-loop", title: "Seamless loop ending", loop: 8,
    desc: "The last scene morphs back into the first one, so the video plays on repeat in social feeds with no visible restart.",
    bestFor: ["Social feeds", "Website hero videos", "Short ads"],
    css: `P .box{position:absolute;overflow:hidden;background:#ffffff;border:1px solid #e5e3de}
          P .s{position:absolute;inset:0}
          P .s1{display:flex;flex-direction:column;justify-content:center;padding:0 22px;gap:10px}
          P .s1 b{font-size:26px;font-weight:800;letter-spacing:-.8px;white-space:nowrap}
          P .s1 i{display:block;height:7px;border-radius:4px;background:#d6d3cc}
          P .s2{display:flex;align-items:flex-end;gap:10px;padding:26px 26px 22px}
          P .s2 i{flex:1;border-radius:4px 4px 0 0;background:linear-gradient(#2563eb,#2563eb);transform-origin:50% 100%}
          P .s3{display:flex;align-items:center;justify-content:center;gap:12px;background:linear-gradient(135deg,#2563eb,#0d9488)}
          P .s3 .word{font-size:34px;color:#fff}
          P .s3 .mk{width:36px;height:36px;border-radius:11px;background:#fff;position:relative}P .s3 .mk:after{content:"";position:absolute;inset:11px;border-radius:50%;background:#2563eb}
          P .tl{position:absolute;left:0;right:0;bottom:16px;display:flex;justify-content:center;align-items:center;gap:8px;font:600 11px/1 -apple-system,system-ui;color:#6b6b74}
          P .tl span{padding:5px 9px;border-radius:999px;border:1px solid #e5e3de}
          P .tl span.on{color:#fff;border-color:#2563eb;background:#2563eb}
          P .tl svg{width:14px;height:14px}`,
    html: `<div class="bgglow"></div><div class="box" data-k="box">
             <div class="s s1" data-k="s1"><b>Meet acme</b><i style="width:150px"></i><i style="width:100px;opacity:.6"></i></div>
             <div class="s s2" data-k="s2">${"<i></i>".repeat(6)}</div>
             <div class="s s3" data-k="s3"><div class="mk"></div><div class="word">acme</div></div></div>
           <div class="tl" data-k="tl"><span>Scene 1</span><span>Scene 2</span><span>End</span><svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg><span>Scene 1</span></div>`,
    build(q) { q.bars = [...q.s2.children]; q.pills = [...q.tl.querySelectorAll("span")]; },
    render(q, t) {
      // box geometry per scene; the end scene morphs back to exactly the first frame (t=8 equals t=0)
      const A = [130, 66, 220, 118, 18], B = [70, 40, 340, 176, 14], C = [150, 82, 180, 100, 50];
      const g = KF(t, [[0, ...A], [1.6, ...A], [2.4, ...B], [3.9, ...B], [4.7, ...C], [6.3, ...C], [7.3, ...A], [8, ...A]]);
      const [x, y, w, h, r] = g;
      S(q.box, { left: x + "px", top: y + "px", width: w + "px", height: h + "px", borderRadius: r + "px" });
      const o1 = Math.max(1 - prog(t, 1.6, 2.0), prog(t, 6.9, 7.4)), o2 = Math.min(prog(t, 2.0, 2.4), 1 - prog(t, 3.9, 4.3)), o3 = Math.min(prog(t, 4.2, 4.7), 1 - prog(t, 6.4, 6.9));
      S(q.s1, { opacity: o1 }); S(q.s2, { opacity: o2 }); S(q.s3, { opacity: o3 });
      q.bars.forEach((b, i) => S(b, { height: [40, 62, 50, 78, 66, 96][i] * io(t, 2.2 + i * 0.08, 2.8 + i * 0.08) + "%" }));
      const sc = t < 2.0 ? 0 : t < 4.3 ? 1 : t < 6.6 ? 2 : 3;
      q.pills.forEach((p, i) => p.classList.toggle("on", i === sc));
    },
  });
})();
