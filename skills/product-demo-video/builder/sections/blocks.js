/* Scene blocks: reusable scene types, drawn as miniatures in the warm editorial light look. */
(() => {
  const { prog, io, vis, lerp, clamp, ease, rnd, typed, S } = G;
  const CO = "#d9573b", NV = "#2f4f8f";
  const $ = (r, s) => ((r._c ||= {})[s] ??= r.querySelector(s));
  const $$ = (r, s) => ((r._a ||= {})[s] ??= [...r.querySelectorAll(s)]);
  const html = (el, s) => { if (el._s !== s) { el._s = s; el.innerHTML = s; } };
  const rise = (el, k, d = 10) => S(el, { opacity: k, transform: `translateY(${(1 - k) * d}px)` });
  const draw = (p, k) => S(p, { strokeDashoffset: 1 - k });

  const BASE = `
&{position:absolute;inset:0;overflow:hidden;background:#f6f1ec;color:#22242e;font-family:-apple-system,"Helvetica Neue",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
&::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 55% at 50% 45%,rgba(255,255,255,.6),rgba(255,255,255,0) 72%),radial-gradient(ellipse 90% 90% at 50% 50%,transparent 55%,rgba(130,90,60,.09))}
& .sc{position:absolute;inset:0}
& .mono{font-family:"SF Mono",ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.2em}
& .kick{position:absolute;left:0;right:0;top:18px;text-align:center;font-size:9.5px;color:#a3978d}
& .cd{position:absolute;background:#fff;border-radius:9px;box-shadow:0 1px 2px rgba(70,45,25,.06),0 10px 28px -8px rgba(70,45,25,.18)}
& .serif{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-style:italic}
& .bar{display:block;height:5px;border-radius:3px;background:#ece5de}
& .pill{display:inline-block;font-size:8.5px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap}
& svg{position:absolute;left:0;top:0;overflow:visible}
& .ln{fill:none;stroke-dasharray:1;stroke-dashoffset:1}`;

  function add(id, title, desc, bestFor, loop, css, body, render) {
    const cls = "bk-" + id, P = "." + cls;
    GALLERY.add({
      section: "blocks", id, title, desc, bestFor, loop,
      build(el) { el.innerHTML = `<style>${(BASE + css).replaceAll("&", P)}</style><div class="${cls}"><div class="sc">${body}</div></div>`; },
      render(el, t) { const r = el.lastElementChild; S($(r, ".sc"), { opacity: vis(t, 0, loop, 0.5) }); render(r, t); },
    });
  }

  // small follow-up appointment card used by several blocks
  const APPT = (cls) => `<div class="cd ${cls}"><div class="ah"><span class="pill mono" style="background:#e6ecf6;color:${NV}">Follow-up</span><span class="cal"></span></div>
    <b class="at">CT chest</b><span class="mono ad">Sep 18 · 9:30 AM</span><div class="af"><span class="pill" style="background:#efebe6;color:#6f665f">Scheduled</span><span class="trk">● Tracking</span></div></div>`;
  const APPT_CSS = (c) => `
& .${c}{padding:10px 12px;width:140px}
& .${c} .ah{display:flex;justify-content:space-between;align-items:center}
& .${c} .cal{width:10px;height:10px;border:1.5px solid #9fb0cf;border-radius:2px}
& .${c} .at{display:block;font-size:14px;margin:7px 0 2px}
& .${c} .ad{font-size:8.5px;color:#7f766f;letter-spacing:.12em}
& .${c} .af{display:flex;gap:6px;align-items:center;margin-top:8px}
& .${c} .trk{font-size:8.5px;color:#3f8f6b;font-weight:600}`;

  // 1. Document with highlights
  const DOC = [["No acute findings. Incidental "], ["8 mm solid nodule", "#2f4f8f", "rgba(47,79,143,.14)"], [" in the right upper lobe. Recommend "], ["CT chest in 6–12 months", CO, "rgba(217,87,59,.15)"], ["."]];
  add("doc-highlight", "Document with highlights", "A report types in line by line. Key phrases light up in colour the moment they are typed.", ["Reports and records", "AI reading text"], 7,
    `& .doc{left:52px;top:50px;width:376px;height:170px;padding:16px 20px}
     & .hd{display:flex;justify-content:space-between;font-size:8.5px;color:#7d746d}
     & .meta{display:flex;gap:10px;margin:9px 0 14px}
     & .lab{font-size:8.5px;color:#b2a69c;margin-bottom:6px}
     & .txt{font-size:14.5px;line-height:1.55;color:#2a2c36}
     & .txt span{white-space:nowrap;background-repeat:no-repeat;border-radius:3px;padding:0 1px}
     & .cur{display:inline-block;width:1.5px;height:15px;background:${CO};vertical-align:-2px;margin-left:1px}`,
    `<div class="kick mono">Radiology report · March 12 · 11:48 PM</div>
     <div class="cd doc"><div class="hd mono"><span>CT chest · Emergency</span><span>Signed 11:48</span></div>
     <div class="meta"><i class="bar" style="width:64px"></i><i class="bar" style="width:92px"></i><i class="bar" style="width:72px"></i></div>
     <div class="lab mono">Findings</div><div class="txt"></div></div>`,
    (r, t) => {
      rise($(r, ".kick"), io(t, 0.1, 0.7));
      rise($(r, ".doc"), io(t, 0.2, 0.9), 14);
      const t0 = 1.0, cps = 26, n = Math.floor((t - t0) * cps);
      let s = "", off = 0;
      for (const [txt, col, bg] of DOC) {
        const part = txt.slice(0, clamp(n - off, 0, txt.length));
        if (col && part) {
          const k = io(t, t0 + (off + txt.length) / cps, t0 + (off + txt.length) / cps + 0.45);
          s += `<span style="color:${col};font-weight:600;background-image:linear-gradient(${bg},${bg});background-size:${k * 100}% 100%">${part}</span>`;
        } else s += part;
        off += txt.length;
      }
      const typing = n >= 0 && n < off;
      const on = typing || (n >= 0 && Math.floor(t * 2.2) % 2 === 0);
      html($(r, ".txt"), s + (on ? '<b class="cur"></b>' : ""));
    });

  // 2. Workflow graph builds
  const WF = [
    { x: 16, y: 115, ts: "11:48:03", ty: "Trigger", ti: "Report received", c: "#4a74c9", ro: ["id", "r_31418"] },
    { x: 126, y: 115, ts: "11:48:04", ty: "AI read", ti: "Read the report", c: "#2f4f8f", ro: ["size", "8 mm"] },
    { x: 236, y: 115, ts: "11:48:05", ty: "Router", ti: "Apply the rule", c: "#c98a1a", ro: ["rule", "6–12 mo"] },
    { x: 364, y: 66, ts: "11:48:06", ty: "Action", ti: "Tag the patient", c: "#3f8f6b", ro: ["tag", "IPN"], w: 100 },
    { x: 364, y: 164, ts: "11:48:06", ty: "Action", ti: "Task navigator", c: CO, ro: ["due", "Sep 18"], w: 100 },
  ];
  const WF_AT = [0.7, 1.6, 2.5, 3.6, 3.95];
  add("workflow-build", "Workflow graph builds", "Steps appear left to right and connectors draw between them. Each step shows its time and the data it read, then the flow branches into actions.", ["How it works", "Automation", "AI agents"], 8,
    `& .nd{position:absolute;width:92px;height:40px;background:#fff;border-radius:7px;border:1px solid #ece4dc;box-shadow:0 6px 16px -8px rgba(70,45,25,.25);display:flex;align-items:center;gap:7px;padding:0 8px}
     & .ic{width:16px;height:16px;border-radius:4px;flex:none}
     & .nd div{display:flex;flex-direction:column;gap:2px;min-width:0}
     & .ty{font-size:7.5px;letter-spacing:.14em}
     & .ti{font-size:10px;font-weight:700;white-space:nowrap;color:#262833}
     & .ts{position:absolute;font-size:8.5px;color:#a3978d;letter-spacing:.06em}
     & .ro{position:absolute;font-size:8.5px;letter-spacing:.06em;display:flex;gap:8px;padding:3px 6px;background:rgba(255,255,255,.55);border-radius:4px}
     & .ro span:first-child{color:#a3978d}`,
    `<div class="kick mono" style="left:20px;text-align:left;color:${NV}">Run 1 · March 12</div>
     <svg width="480" height="270"><g stroke="#cdbfb3" stroke-width="1.4">
       <path class="ln" pathLength="1" d="M108,135H126"/><path class="ln" pathLength="1" d="M218,135H236"/>
       <path class="ln" pathLength="1" d="M328,135C346,135 346,86 364,86"/><path class="ln" pathLength="1" d="M328,135C346,135 346,184 364,184"/></g>
       <circle class="pk" r="3" fill="${CO}"/></svg>
     ${WF.map((n) => `<span class="ts mono" style="left:${n.x}px;top:${n.y - 14}px">${n.ts}</span>
       <div class="nd" style="left:${n.x}px;top:${n.y}px;${n.w ? `width:${n.w}px` : ""}"><i class="ic" style="background:${n.c}22;box-shadow:inset 0 0 0 1.5px ${n.c}"></i><div><span class="ty mono" style="color:${n.c}">${n.ty}</span><span class="ti">${n.ti}</span></div></div>
       <div class="ro mono" style="left:${n.x}px;top:${n.y + 46}px"><span>${n.ro[0]}</span><span style="color:${n.c}">${n.ro[1]}</span></div>`).join("")}`,
    (r, t) => {
      rise($(r, ".kick"), io(t, 0.1, 0.6));
      const nds = $$(r, ".nd"), tss = $$(r, ".ts"), ros = $$(r, ".ro"), lns = $$(r, ".ln");
      WF.forEach((n, i) => {
        const a = WF_AT[i], k = io(t, a, a + 0.5);
        S(nds[i], { opacity: k, transform: `translateX(${(1 - k) * -10}px) scale(${lerp(0.94, 1, k)})`, borderColor: `rgba(${i > 2 ? "217,87,59" : "47,79,143"},${0.55 * vis(t, a, a + 1.2, 0.3)})` });
        rise(tss[i], io(t, a + 0.15, a + 0.6), 4);
        rise(ros[i], io(t, a + 0.35, a + 0.8), -6);
      });
      const L = [[1.25, 1.6], [2.15, 2.5], [3.2, 3.6], [3.35, 3.95]];
      lns.forEach((p, i) => draw(p, io(t, L[i][0], L[i][1], ease.inOut)));
      // a small dot runs along each connector as it draws
      const seg = L.findIndex(([a, b]) => t >= a && t <= b);
      const pk = $(r, ".pk");
      if (seg >= 0) { const p = lns[seg], k = io(t, L[seg][0], L[seg][1], ease.inOut), pt = p.getPointAtLength(k * p.getTotalLength()); S(pk, { opacity: 1 }); pk.setAttribute("cx", pt.x); pk.setAttribute("cy", pt.y); } else S(pk, { opacity: 0 });
    });

  // 3. Row arrives in a list
  const ROWS = [["Review CT chest", "M, 64", "Due Mar 20"], ["Confirm results letter", "F, 49", "Due Mar 22"], ["Call back lab", "M, 71", "Due Apr 2"]];
  add("worklist-arrival", "Row arrives in a list", "A worklist sits quietly, then a new row slides in at the top with a NEW tag. The matching appointment card appears beside it.", ["Inbox and queues", "Results landing"], 7,
    `& .wl{left:30px;top:52px;width:282px;padding:12px 12px 8px;background:#f3ede6;border:1px solid #ebe2d9}
     & .wh{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;margin-bottom:8px;padding:0 4px}
     & .wh .n{margin-left:auto;font-size:8.5px;color:#a3978d;font-weight:500}
     & .rows{position:relative;height:120px}
     & .rw{position:absolute;left:0;right:0;height:28px;display:flex;align-items:center;gap:7px;padding:0 8px;border-radius:6px;font-size:10.5px;font-weight:650}
     & .rw small{font-size:8.5px;color:#a3978d;font-weight:500}
     & .rw .d{margin-left:auto;font-size:8px;color:#a3978d;letter-spacing:.06em}
     & .new{background:#fff;box-shadow:0 4px 14px -6px rgba(70,45,25,.3)}
     ${APPT_CSS("ap")}& .ap{left:332px;top:92px}`,
    `<div class="kick mono">March 13 · 8:02 AM</div>
     <div class="cd wl"><div class="wh"><span style="color:#b0a49a">☰</span>Worklist<span class="pill" style="background:#f6e6c8;color:#a8710f">Navigators</span><span class="n mono"></span></div>
     <div class="rows"><div class="rw new"><span class="pill" style="background:${CO};color:#fff">NEW</span>Schedule follow-up CT<span class="pill d" style="background:#e6ecf6;color:${NV}">Sep 18</span></div>
     ${ROWS.map((x) => `<div class="rw old">${x[0]}<small>${x[1]}</small><span class="d mono">${x[2]}</span></div>`).join("")}</div></div>
     <svg width="480" height="270"><path class="ln" pathLength="1" d="M300,90C316,90 316,130 332,130" stroke="${NV}" stroke-width="1.2" stroke-dasharray="1" opacity=".5"/></svg>
     ${APPT("ap")}`,
    (r, t) => {
      rise($(r, ".kick"), io(t, 0.1, 0.6));
      rise($(r, ".wl"), io(t, 0.2, 0.9), 14);
      const k = io(t, 1.5, 2.2, ease.inOut);
      $$(r, ".old").forEach((el, i) => S(el, { top: `${(i + k) * 30}px` }));
      const nw = $(r, ".new");
      S(nw, { top: "0px", opacity: io(t, 1.6, 2.2), transform: `translateX(${(1 - io(t, 1.5, 2.3)) * -24}px)`, background: `rgb(255,${lerp(236, 255, io(t, 2.4, 4.4))},${lerp(228, 255, io(t, 2.4, 4.4))})` });
      S($(r, ".rows"), { height: `${90 + 30 * k}px` });
      html($(r, ".n"), t < 1.9 ? "3 open" : "4 open");
      draw($(r, ".ln"), io(t, 2.7, 3.2));
      const ka = io(t, 3.0, 3.7);
      S($(r, ".ap"), { opacity: ka, transform: `translateX(${(1 - ka) * -16}px)` });
    });

  // 4. Time skip ticker
  const MON = ["MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP"];
  const NOTES = [[1.5, "shift change", -1], [2.5, "new navigator", 1], [4.5, "holiday coverage", -1]];
  add("time-skip", "Time skip ticker", "Months scroll past on a ticker with small notes about what changed. One card stays still in the middle, so the viewer knows what to watch.", ["Long journeys", "Before and after"], 7,
    `& .m{position:absolute;top:44px;left:0;width:92px;text-align:center;font:300 34px/1 "SF Mono",ui-monospace,Menlo,monospace;letter-spacing:.04em}
     & .tr{position:absolute;left:70px;width:340px;top:96px;height:1px;background:#e3d8ce}
     & .fl{position:absolute;left:70px;top:95.5px;height:2px;background:${CO};border-radius:1px}
     & .nt{position:absolute;left:0;width:120px;text-align:center;font-size:11.5px;color:#9c9087}
     & .cap{position:absolute;left:0;right:0;top:230px;text-align:center;font-size:15px;color:#2b2a30}
     ${APPT_CSS("ap")}& .ap{left:176px;top:124px}`,
    `${MON.map((m) => `<div class="m">${m}</div>`).join("")}<div class="tr"></div><div class="fl"></div>
     ${NOTES.map((n) => `<div class="nt serif">${n[1]}</div>`).join("")}${APPT("ap")}<div class="cap serif">Then six months pass. Shifts change. People move on.</div>`,
    (r, t) => {
      const raw = 6 * prog(t, 0.9, 5.2), pos = Math.min(6, Math.floor(raw) + ease.inOut(raw % 1));
      $$(r, ".m").forEach((el, i) => {
        const d = i - pos, x = 240 + d * 92;
        const hot = i === 6 ? io(t, 4.9, 5.5) : 0;
        S(el, { transform: `translateX(${x - 46}px)`, opacity: Math.max(0.1, 1 - Math.abs(d) * 0.4) * io(t, 0.1, 0.7), color: hot ? CO : "#2a2c36", fontWeight: hot > 0.5 ? 400 : 300 });
      });
      S($(r, ".fl"), { width: `${(340 * pos) / 6}px` });
      $$(r, ".nt").forEach((el, i) => {
        const [at, , side] = NOTES[i], d = at - pos;
        S(el, { transform: `translate(${240 + d * 92 - 60}px,${side < 0 ? 26 : 106}px)`, opacity: clamp(1 - Math.abs(d) / 1.3) });
      });
      rise($(r, ".ap"), io(t, 0.3, 1.0), 10);
      rise($(r, ".cap"), io(t, 0.6, 1.3), 6);
    });

  // 5. Statement card
  const L1 = "Work doesn't fail at the start.".split(" "), L2 = ["It", "fails", "in", "the", "<em>follow-through.</em>"];
  add("statement-card", "Statement card", "A big serif statement alone on an empty page. The second line follows, with one word picked out in the accent colour.", ["The big idea", "Turning points"], 7,
    `& .st{position:absolute;left:0;right:0;text-align:center;font-size:30px;color:#25242c;letter-spacing:-.2px}
     & .st span{display:inline-block;margin:0 .13em}
     & .st em{font-style:italic}`,
    `<div class="st serif" style="top:88px">${L1.map((w) => `<span>${w}</span>`).join("")}</div>
     <div class="st serif" style="top:132px">${L2.map((w) => `<span>${w}</span>`).join("")}</div>`,
    (r, t) => {
      const [a, b] = $$(r, ".st").map((x) => [...x.children]);
      a.forEach((w, i) => { const k = io(t, 0.5 + i * 0.1, 1.3 + i * 0.1); S(w, { opacity: k, filter: `blur(${(1 - k) * 5}px)`, transform: `translateY(${(1 - k) * 8}px)` }); });
      b.forEach((w, i) => { const k = io(t, 2.3 + i * 0.12, 3.1 + i * 0.12); S(w, { opacity: k, filter: `blur(${(1 - k) * 5}px)`, transform: `translateY(${(1 - k) * 8}px)` }); });
      const c = io(t, 3.2, 4.0);
      S(b[4], { color: `rgb(${lerp(37, 217, c)},${lerp(36, 87, c)},${lerp(44, 59, c)})` });
    });

  // 6. Stat with dot grid
  const COLS = 10, ROWS_N = 8, LOST = [...Array(COLS * ROWS_N)].map((_, i) => rnd(i * 3.1) < 0.3);
  add("stat-dotgrid", "Stat with dot grid", "A big number counts up beside a grid of dots that turn the problem colour in a wave. Then the same dots flip to the solved colour with ticks.", ["Size of the problem", "Before and after"], 8,
    `& .side{position:absolute;left:36px;top:0;bottom:0;width:220px;display:flex;flex-direction:column;justify-content:center}
     & .num{font-size:64px;font-weight:800;letter-spacing:-3px;color:${CO};line-height:1}
     & .lbl{font-size:14px;margin-top:6px;color:#2a2c36}
     & .sub{font-size:8px;color:#a3978d;margin-top:8px;letter-spacing:.16em}
     & .k2{font-size:8.5px;color:${CO};letter-spacing:.2em;margin-bottom:8px}
     & .h2{font-size:23px;font-weight:750;line-height:1.12;letter-spacing:-.6px;color:#22242e}
     & .h2 b{color:${NV}}
     & .grid{position:absolute;left:272px;top:58px;display:grid;grid-template-columns:repeat(${COLS},11px);gap:7px}
     & .dt{width:11px;height:11px;border-radius:50%;background:#e6ddd4;display:flex;align-items:center;justify-content:center}
     & .dt svg{position:static;width:8px;height:8px}
     & .lg{position:absolute;left:272px;top:212px;font-size:8.5px;color:#8f857d;letter-spacing:.1em}`,
    `<div class="side s1"><div class="num">0</div><div class="lbl">follow-ups lost every month.</div><div class="sub mono">One health system · never rebooked</div></div>
     <div class="side s2"><div class="k2 mono">With the product</div><div class="h2">Each missed visit becomes a <b>task</b>, the same day.</div></div>
     <div class="grid">${LOST.map(() => `<i class="dt"><svg viewBox="0 0 8 8"><path d="M1.5,4.2 3.3,6 6.6,2.2" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg></i>`).join("")}</div>
     <div class="lg mono"></div>`,
    (r, t) => {
      const c = io(t, 0.6, 2.8, (x) => 1 - Math.pow(1 - x, 2));
      const sw = io(t, 4.0, 4.7);
      html($(r, ".num"), t >= 2.8 ? "1,000+" : Math.round(c * 1000).toLocaleString("en-US"));
      S($(r, ".s1"), { opacity: io(t, 0.2, 0.8) * (1 - sw), transform: `translateY(${-sw * 12}px)` });
      S($(r, ".s2"), { opacity: io(t, 4.3, 5.0), transform: `translateY(${(1 - io(t, 4.3, 5.0)) * 12}px)` });
      $$(r, ".dt").forEach((d, i) => {
        const col = i % COLS, row = Math.floor(i / COLS);
        S(d, { opacity: io(t, 0.2 + col * 0.03 + row * 0.02, 0.7 + col * 0.03 + row * 0.02) });
        if (!LOST[i]) return;
        const a = io(t, 1.0 + col * 0.13 + rnd(i) * 0.25, 1.35 + col * 0.13 + rnd(i) * 0.25);
        const f = prog(t, 4.5 + col * 0.09 + rnd(i + 7) * 0.2, 4.85 + col * 0.09 + rnd(i + 7) * 0.2);
        const solved = f > 0.5;
        S(d, { background: solved ? NV : `rgb(${lerp(230, 217, a)},${lerp(221, 87, a)},${lerp(212, 59, a)})`, transform: `scale(${(f > 0 && f < 1 ? Math.abs(1 - 2 * f) : 1) * lerp(1, 1.1, a * (1 - f))},1)` });
        S(d.firstChild, { opacity: solved ? 1 : 0 });
      });
      html($(r, ".lg"), t < 4.6 ? `<span style="color:${CO}">●</span> lost follow-up` : `<span style="color:${NV}">●</span> task created, same day`);
      S($(r, ".lg"), { opacity: io(t, 1.6, 2.2) * (1 - vis(t, 4.4, 4.8, 0.2)) });
    });

  // 7. Document lines become rules
  add("doc-to-rules", "Document lines become rules", "A written protocol sits on the left. Its highlighted lines draw connectors to rule cards on the right, which light up as they come alive.", ["Policies to automation", "Rules engines"], 8,
    `& .pd{left:26px;top:34px;width:176px;height:206px;padding:0}
     & .pd > *{position:absolute;left:14px;right:14px}
     & .pt{top:13px;font:600 14px/1.15 "Iowan Old Style",Palatino,Georgia,serif;color:#25242c}
     & .stamp{position:absolute;left:auto!important;right:10px!important;top:14px;font-size:7px;color:#3f8f6b;border:1.2px solid #3f8f6b;padding:2px 4px;border-radius:3px;transform:rotate(-5deg);letter-spacing:.12em}
     & .pm{top:50px;font-size:7.5px;color:#b2a69c;letter-spacing:.12em}
     & .h{font-size:9.5px;font-weight:700;color:#2a2c36}
     & .hl{height:16px;font-size:9px;line-height:16px;padding:0 4px;margin:0 -4px;border-radius:3px;color:#3a3b44;background-repeat:no-repeat;background-image:linear-gradient(rgba(240,186,64,.38),rgba(240,186,64,.38))}
     & .rc{left:262px;width:196px;height:72px;padding:11px 12px;border:1px solid transparent}
     & .rn{position:absolute;left:12px;top:11px;width:18px;height:18px;border-radius:50%;font-size:9.5px;font-weight:700;display:flex;align-items:center;justify-content:center}
     & .ring{position:absolute;left:12px;top:11px;width:18px;height:18px;border-radius:50%;border:1.5px solid ${CO}}
     & .rt{margin-left:26px;font-size:10.5px;font-weight:700;line-height:1.3;color:#262833}
     & .rt span{color:#8f857d;font-weight:500}
     & .ok{position:absolute;left:38px;bottom:10px;font-size:8.5px;font-weight:650;color:#2f7a57;background:#e3f1ea;padding:2px 6px;border-radius:4px}`,
    `<div class="kick mono" style="left:26px;text-align:left"><span style="color:${CO}">Protocol 1 of 12</span> · Follow-up program</div>
     <div class="cd pd"><div class="pt">Follow-up<br>Protocol</div><span class="stamp mono">Approved</span><div class="pm mono">v3 · approved by committee</div>
     <div class="h" style="top:68px">1 · Eligibility</div><i class="bar" style="top:84px;width:130px"></i><i class="bar" style="top:93px;width:96px"></i>
     <div class="h" style="top:104px">2 · Classification</div><div class="hl" style="top:120px">6–8 mm → CT in 6–12 months</div><i class="bar" style="top:141px;width:110px"></i>
     <div class="h" style="top:152px">3 · Missed visits</div><div class="hl" style="top:168px">No-show → call to rebook</div><i class="bar" style="top:189px;width:120px"></i></div>
     <svg width="480" height="270"><g stroke="${CO}" stroke-width="1.3" opacity=".7"><path class="ln" pathLength="1" d="M200,162C232,162 232,100 262,100"/><path class="ln" pathLength="1" d="M200,210C232,210 232,196 262,196"/></g></svg>
     ${[["Follow-up recommended", "task the navigator"], ["Follow-up missed", "call to rebook"]].map((x, i) => `<div class="cd rc" style="top:${i ? 160 : 64}px"><i class="ring"></i><b class="rn">${i + 1}</b><div class="rt">${x[0]}<br><span>→ ${x[1]}</span></div><span class="ok">✓ Task created · ${i ? "9:41 AM" : "11:48 PM"}</span></div>`).join("")}`,
    (r, t) => {
      rise($(r, ".kick"), io(t, 0.1, 0.6));
      rise($(r, ".pd"), io(t, 0.2, 0.9), 14);
      const lit = [2.2, 4.4], H = [1.0, 3.2];
      $$(r, ".hl").forEach((h, i) => S(h, { backgroundSize: `${io(t, H[i], H[i] + 0.6, ease.inOut) * 100}% 100%` }));
      $$(r, ".ln").forEach((p, i) => draw(p, io(t, H[i] + 0.6, lit[i], ease.inOut)));
      $$(r, ".rc").forEach((c, i) => {
        const k = io(t, 0.4 + i * 0.15, 1.0 + i * 0.15), on = io(t, lit[i], lit[i] + 0.4);
        S(c, { opacity: lerp(0.45, 1, on) * k, transform: `translateX(${(1 - k) * 12}px)`, borderColor: `rgba(217,87,59,${on * 0.7})`, boxShadow: `0 10px 28px -8px rgba(70,45,25,.18),0 0 0 ${on * 3}px rgba(217,87,59,.1)` });
        const rn = c.querySelector(".rn");
        S(rn, { background: on > 0.5 ? CO : "#efe9e3", color: on > 0.5 ? "#fff" : "#9c9087" });
        const p = prog(t, lit[i], lit[i] + 0.9);
        S(c.querySelector(".ring"), { opacity: p > 0 && p < 1 ? 1 - p : 0, transform: `scale(${1 + p * 1.4})` });
        rise(c.querySelector(".ok"), io(t, lit[i] + 0.5, lit[i] + 1.0), 5);
      });
    });

  // 8. Orbit ecosystem
  const OC = { x: 240, y: 172 };
  const ORB = [["EMR", 0, 0.2], ["Scheduling", 0, 1.45], ["Labs", 0, 2.7], ["Messaging", 0, 3.95], ["CRM", 0, 5.2], ["Imaging", 1, 0.85], ["Billing", 1, 2.95], ["Team", 1, 5.05]];
  const RING = [[198, 60], [122, 37]];
  const opos = (j, t, f = 1, dth = 0) => { const [, ring, a0] = ORB[j], [rx, ry] = RING[ring], th = a0 + t * 0.07 + dth; return [OC.x + Math.cos(th) * rx * f, OC.y + Math.sin(th) * ry * f, th]; };
  const EV = [[0.9, 0, 1], [1.7, 5, 1], [2.5, 2, -1], [3.1, 3, 1], [3.8, 7, -1], [4.4, 1, -1], [5.0, 6, 1], [5.6, 4, -1]];
  add("orbit-ecosystem", "Orbit ecosystem", "The product sits in the middle with the systems it talks to on rings around it. Events travel in along the rings and actions travel back out.", ["Platform story", "Integrations"], 8,
    `& .hd{position:absolute;left:0;right:0;top:20px;text-align:center;font-size:23px;font-weight:750;letter-spacing:-.6px;color:#22242e}
     & .hd span{display:inline-block;margin:0 4px}
     & .core{position:absolute;left:${OC.x - 27}px;top:${OC.y - 27}px;width:54px;height:54px;border-radius:50%;background:#fff;box-shadow:0 0 0 6px rgba(217,87,59,.08),0 10px 24px -6px rgba(217,87,59,.45);display:flex;align-items:center;justify-content:center}
     & .glow{position:absolute;left:${OC.x - 90}px;top:${OC.y - 56}px;width:180px;height:112px;border-radius:50%;background:radial-gradient(closest-side,rgba(217,87,59,.2),rgba(217,87,59,0))}
     & .on{position:absolute;left:0;top:0;width:0;height:0}
     & .on i{position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 2px 8px -2px rgba(70,45,25,.35),inset 0 0 0 1.5px #d9cdc2}
     & .on span{position:absolute;left:-40px;width:80px;top:11px;text-align:center;font-size:9.5px;font-weight:600;color:#6f665f}`,
    `<div class="hd"><span>One engine.</span><span style="color:${CO}">Every system.</span></div>
     <div class="glow"></div><svg width="480" height="270">
     ${RING.map(([rx, ry]) => `<ellipse cx="${OC.x}" cy="${OC.y}" rx="${rx}" ry="${ry}" fill="none" stroke="#e0d3c7" stroke-width="1"/>`).join("")}
     ${EV.map(() => `<g class="ev">${[0, 1, 2, 3].map((k) => `<circle r="${3 - k * 0.6}"/>`).join("")}</g>`).join("")}</svg>
     ${ORB.map((o) => `<div class="on"><i></i><span>${o[0]}</span></div>`).join("")}
     <div class="core"><svg width="26" height="20" viewBox="0 0 26 20" style="position:static"><path d="M3,3 10,10 3,17M12,3 19,10 12,17" fill="none" stroke="${CO}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`,
    (r, t) => {
      const hs = [...$(r, ".hd").children];
      rise(hs[0], io(t, 0.4, 1.1), 8); rise(hs[1], io(t, 2.4, 3.1), 8);
      let pulse = 0;
      const hit = new Array(ORB.length).fill(0);
      $$(r, ".ev").forEach((g, e) => {
        const [ts, j, dir] = EV[e], s = prog(t, ts, ts + 1.3), es = ease.inOut(s);
        const live = s > 0 && s < 1;
        [...g.children].forEach((c, k) => {
          const sk = clamp(es - k * 0.035), f = dir > 0 ? lerp(1, 0.2, sk) : lerp(0.2, 1, sk);
          const [x, y] = opos(j, t, f, dir > 0 ? sk * 1.1 : -(1 - sk) * 1.1);
          c.setAttribute("cx", x); c.setAttribute("cy", y);
          c.setAttribute("fill", dir > 0 ? CO : NV);
          c.setAttribute("opacity", live ? (1 - k * 0.25) * Math.min(1, s * 6, (1 - s) * 6) : 0);
        });
        if (dir > 0) pulse = Math.max(pulse, vis(t, ts + 1.15, ts + 1.6, 0.2));
        else hit[j] = Math.max(hit[j], vis(t, ts + 1.15, ts + 1.8, 0.25));
      });
      S($(r, ".core"), { transform: `scale(${io(t, 0.2, 0.9, ease.back) * (1 + pulse * 0.1)})` });
      $$(r, ".on").forEach((el, j) => {
        const [x, y, th] = opos(j, t), back = Math.sin(th) < 0;
        const k = io(t, 0.3 + j * 0.08, 0.9 + j * 0.08);
        S(el, { transform: `translate(${x}px,${y}px) scale(${(back ? 0.88 : 1) * lerp(0.6, 1, k)})`, opacity: k * (back ? 0.75 : 1) });
        S(el.firstChild, { background: hit[j] > 0.05 ? `rgba(47,79,143,${hit[j]})` : "#fff" });
      });
    });

  // 9. Split values
  add("split-values", "Split values", "Two short statements side by side, each over its own small picture. The divider slides in to set them against each other.", ["Values and promises", "Two sides of the product"], 7,
    `& .lp{position:absolute;inset:0;background:linear-gradient(160deg,#e8f0f1,#dfe8ea)}
     & .rp{position:absolute;top:0;bottom:0;left:0;width:240px;background:#f8f4ef;box-shadow:-8px 0 24px -10px rgba(40,60,70,.35)}
     & .vh{position:absolute;top:44px;font-size:28px;font-weight:780;letter-spacing:-1px;line-height:1;color:#1f2a30;white-space:nowrap}
     & .vk{position:absolute;top:82px;font-size:8px;letter-spacing:.18em;color:#7f8f94}
     & .lane{position:absolute;left:0;height:30px}
     & .dr{position:absolute;top:0;width:68px;height:30px;background:#fff;border-radius:5px;box-shadow:0 4px 10px -6px rgba(30,60,70,.4);padding:6px 7px}
     & .dr i{display:block;height:4px;border-radius:2px;background:#d6e1e4;margin-bottom:4px}
     & .dr i:first-child{width:24px;background:#9fb6bd}
     & .apc{position:absolute;left:24px;top:112px;width:192px;padding:11px 12px}
     & .apc b{font-size:11px}
     & .chk{display:flex;align-items:center;gap:7px;margin-top:7px;font-size:9px;color:#6f665f}
     & .chk i{width:12px;height:12px;border-radius:50%;border:1.3px solid #cfc5bb;display:flex;align-items:center;justify-content:center;font-size:8px;font-style:normal;color:#fff}
     & .stp{position:absolute;right:10px;top:10px;font-size:8px;padding:2px 5px;border-radius:3px}
     & .sig{position:static;margin-top:6px}`,
    `<div class="lp"><div class="lc"><div class="vh" style="left:26px">Move fast.</div><div class="vk mono" style="left:27px">Drafts · your team reviews</div>
       ${[0, 1, 2].map((l) => `<div class="lane" style="top:${118 + l * 40}px">${[0, 1, 2, 3, 4, 5, 6, 7].map(() => `<div class="dr"><i></i><i></i><i style="width:40px"></i></div>`).join("")}</div>`).join("")}</div></div>
     <div class="rp"><div class="rc"><div class="vh" style="left:24px">Stay in <span style="color:${CO}">control.</span></div><div class="vk mono" style="left:25px;color:#a3978d">Nothing goes live unsigned</div>
       <div class="cd apc"><b>Follow-up flow</b><span class="stp mono"></span>
       ${["Trigger · report signed", "Rule · 6–12 months", "Action · task navigator"].map((x) => `<div class="chk"><i>✓</i>${x}</div>`).join("")}
       <svg class="sig" width="90" height="20"><path class="ln" pathLength="1" d="M2,14C10,2 14,18 22,10S34,4 40,12 52,16 60,8 74,10 88,9" stroke="#2a2c36" stroke-width="1.3"/></svg></div></div></div>`,
    (r, t) => {
      const d = io(t, 1.9, 2.9, ease.inOut);
      S($(r, ".lc"), { transform: `translateX(${(1 - d) * 120}px)` });
      rise($(r, ".lp .vh"), io(t, 0.2, 0.9), 10);
      rise($(r, ".lp .vk"), io(t, 0.5, 1.1), 6);
      $$(r, ".lane").forEach((ln, l) => {
        const sp = (80 * (l + 1)) / 7, dir = l % 2 ? 1 : -1;
        S(ln, { opacity: io(t, 0.4 + l * 0.15, 1.1 + l * 0.15) });
        [...ln.children].forEach((c, i) => { const x = (((i * 80 + dir * t * sp + (l * 30)) % 640) + 640) % 640 - 80; S(c, { transform: `translateX(${x}px)` }); });
      });
      S($(r, ".rp"), { transform: `translateX(${lerp(480, 240, d)}px)` });
      rise($(r, ".rp .vh"), io(t, 2.6, 3.2), 10);
      rise($(r, ".rp .vk"), io(t, 2.8, 3.4), 6);
      rise($(r, ".apc"), io(t, 2.9, 3.5), 12);
      $$(r, ".chk i").forEach((c, i) => { const k = io(t, 3.6 + i * 0.3, 3.85 + i * 0.3); S(c, { background: k > 0.5 ? "#3f8f6b" : "transparent", borderColor: k > 0.5 ? "#3f8f6b" : "#cfc5bb", transform: `scale(${1 + Math.sin(k * Math.PI) * 0.25})` }); });
      draw($(r, ".ln"), io(t, 4.5, 5.2, ease.inOut));
      const ok = t > 5.2;
      html($(r, ".stp"), ok ? "Approved" : "In review");
      S($(r, ".stp"), { background: ok ? "#e3f1ea" : "#f6e6c8", color: ok ? "#2f7a57" : "#a8710f" });
    });

  // 10. Chat widget conversation
  const SLOTS = ["Tue 10:00", "Tue 2:30", "Wed 11:00"];
  add("chat-widget", "Chat widget conversation", "A website chat widget opens, the visitor types a question, and the reply streams in with time slots. One slot gets clicked and booked.", ["Chatbots and assistants", "Booking flows"], 8,
    `& .site{position:absolute;inset:0;background:#fbfaf8}
     & .nav{position:absolute;left:0;right:0;top:0;height:30px;border-bottom:1px solid #eee8e2;display:flex;align-items:center;gap:12px;padding:0 18px}
     & .nav i{display:block;height:5px;width:34px;border-radius:3px;background:#e4ddd6}
     & .hero{position:absolute;left:28px;top:62px;width:200px}
     & .hero b{display:block;height:15px;border-radius:4px;background:#d9d1c9;margin-bottom:8px}
     & .hero i{display:block;height:6px;border-radius:3px;background:#e9e2db;margin-top:7px}
     & .img{position:absolute;left:28px;top:170px;width:200px;height:70px;border-radius:8px;background:linear-gradient(135deg,#efe7df,#e6ecf2)}
     & .lau{position:absolute;right:16px;bottom:14px;width:30px;height:30px;border-radius:50%;background:${NV};box-shadow:0 6px 14px -4px rgba(47,79,143,.6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px}
     & .pan{position:absolute;right:16px;bottom:52px;width:200px;height:206px;background:#fff;border-radius:12px;box-shadow:0 18px 40px -12px rgba(30,30,60,.35),0 0 0 1px rgba(0,0,0,.04);overflow:hidden;transform-origin:100% 100%}
     & .ph{height:32px;background:${NV};display:flex;align-items:center;gap:7px;padding:0 10px;color:#fff;font-size:10.5px;font-weight:650}
     & .ph i{width:16px;height:16px;border-radius:50%;background:#8aa2d0}
     & .ph s{width:6px;height:6px;border-radius:50%;background:#5fd39a;margin-left:auto}
     & .msgs{position:absolute;left:0;right:0;top:32px;bottom:30px;overflow:hidden}
     & .mi{position:absolute;left:0;right:0;top:0}
     & .b{position:absolute;max-width:150px;font-size:9.5px;line-height:1.35;padding:5px 8px;border-radius:9px}
     & .bot{left:10px;background:#f1ede8;color:#2a2c36;border-bottom-left-radius:3px}
     & .usr{right:10px;background:${NV};color:#fff;border-bottom-right-radius:3px}
     & .slots{position:absolute;left:10px;right:10px;display:flex;gap:5px}
     & .sl{font-size:9px;font-weight:650;padding:4px 6px;border-radius:6px;border:1.2px solid ${NV};color:${NV};white-space:nowrap}
     & .inp{position:absolute;left:0;right:0;bottom:0;height:30px;border-top:1px solid #f0ebe6;display:flex;align-items:center;padding:0 10px;font-size:9.5px;color:#2a2c36}
     & .inp em{color:#b4aaa1;font-style:normal}
     & .cur{position:absolute;left:0;top:0;width:14px;height:18px}`,
    `<div class="site"><div class="nav"><b style="width:14px;height:14px;border-radius:4px;background:${NV}"></b><i></i><i></i><i></i></div>
     <div class="hero"><b style="width:180px"></b><b style="width:130px"></b><i style="width:170px"></i><i style="width:140px"></i></div><div class="img"></div></div>
     <div class="pan"><div class="ph"><i></i>Assistant<s></s></div><div class="msgs"><div class="mi">
       <div class="b bot" style="top:8px">Hi! How can I help today?</div>
       <div class="b usr" style="top:34px">Can I book a demo?</div>
       <div class="b bot rep" style="top:60px"></div>
       <div class="slots" style="top:98px">${SLOTS.map((s) => `<span class="sl">${s}</span>`).join("")}</div>
       <div class="b usr ok" style="top:126px">Booked Tue 2:30 ✓</div></div></div>
       <div class="inp"></div></div>
     <div class="lau"></div>
     <svg class="cur" viewBox="0 0 14 18"><path d="M1,1 1,14 4.5,10.8 7,16.5 9.2,15.5 6.8,10 11.5,10Z" fill="#1d1e26" stroke="#fff" stroke-width="1.1"/></svg>`,
    (r, t) => {
      const o = io(t, 0.5, 1.0, ease.back);
      S($(r, ".pan"), { opacity: io(t, 0.5, 0.8), transform: `scale(${lerp(0.6, 1, o)})` });
      html($(r, ".lau"), t < 0.65 ? "●" : "×");
      const [g, u, rep, ok] = $$(r, ".b");
      rise(g, io(t, 1.0, 1.4), 6);
      const q = "Can I book a demo?";
      const typing = typed(q, t, 1.5, 17);
      html($(r, ".inp"), t < 2.8 ? (typing ? typing + '<b style="display:inline-block;width:1px;height:11px;background:#2a2c36;margin-left:1px"></b>' : "<em>Type a message…</em>") : "<em>Type a message…</em>");
      rise(u, io(t, 2.8, 3.1), 6);
      const ans = "Sure! Pick a time that works for you:";
      html(rep, typed(ans, t, 3.3, 40) || "");
      S(rep, { opacity: t > 3.25 ? 1 : 0 });
      const sls = $$(r, ".sl"), click = io(t, 5.7, 5.8), pressed = t > 5.7;
      sls.forEach((s, i) => {
        const k = io(t, 4.4 + i * 0.15, 4.8 + i * 0.15, ease.back);
        S(s, { opacity: clamp(k), transform: `scale(${lerp(0.7, 1, k) * (i === 1 ? 1 - Math.sin(click * Math.PI) * 0.08 : 1)})` });
        if (i === 1) S(s, { background: pressed ? NV : "#fff", color: pressed ? "#fff" : NV });
      });
      rise(ok, io(t, 6.1, 6.4), 6);
      S($(r, ".mi"), { transform: `translateY(${-28 * io(t, 6.0, 6.4)}px)` });
      // cursor: enters from the bottom-right, rests on the second slot
      const sl = sls[1], tx = 480 - 16 - 200 + 10 + sl.offsetLeft + 26, ty = 270 - 52 - 206 + 32 + 98 + 10;
      const m = io(t, 4.9, 5.6, ease.inOut);
      S($(r, ".cur"), { opacity: io(t, 4.8, 5.0) * (1 - io(t, 6.6, 6.9)), transform: `translate(${lerp(470, tx, m)}px,${lerp(262, ty, m)}px) scale(${1 - click * 0.15 * (t < 5.85 ? 1 : 0)})` });
    });

  // 11. Alerts across apps
  const APPS = [["Chat", "#3d2b4c"], ["Team", "#45507e"], ["Email", null]];
  const ARR = [1.1, 2.0, 2.9];
  add("alert-stack", "Alerts across apps", "One alert lands in three different apps, one after another: a chat app, a team app and an email inbox. A toast counts where it went.", ["Notifications", "Integrations"], 7,
    `& .win{position:absolute;top:66px;width:138px;height:168px;background:#fff;border-radius:9px;overflow:hidden;box-shadow:0 1px 2px rgba(70,45,25,.06),0 12px 28px -10px rgba(70,45,25,.25)}
     & .wt{height:20px;display:flex;align-items:center;gap:3px;padding:0 7px;border-bottom:1px solid #f0ebe6;font-size:9.5px;font-weight:650;color:#6f665f}
     & .wt s{width:5px;height:5px;border-radius:50%;background:#e4dcd4}
     & .wt span{margin-left:6px}
     & .rail{position:absolute;left:0;top:20px;bottom:0;width:24px;display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:8px}
     & .rail i{width:12px;height:12px;border-radius:3px;background:rgba(255,255,255,.25)}
     & .bd{position:absolute;top:28px;right:8px}
     & .bd .bar{margin-bottom:6px;background:#efe9e3}
     & .ac{position:absolute;left:0;right:0;top:0;background:#fff;border-radius:6px;border:1px solid #f0e2dc;border-left:3px solid ${CO};padding:6px 7px;box-shadow:0 6px 14px -8px rgba(217,87,59,.6)}
     & .ac b{display:block;font-size:9.5px;color:#262833}
     & .ac small{display:block;font-size:8px;color:#8f857d;margin:2px 0 5px}
     & .ac span{font-size:8px;font-weight:700;color:#fff;background:${NV};padding:2px 5px;border-radius:3px}
     & .rest{position:absolute;left:0;right:0}
     & .toast{position:absolute;left:50%;top:18px;margin-left:-92px;width:184px;height:30px;background:#22242e;color:#fff;border-radius:15px;display:flex;align-items:center;gap:8px;padding:0 12px;font-size:10px;box-shadow:0 10px 24px -8px rgba(20,20,30,.5)}
     & .toast i{width:8px;height:8px;border-radius:50%;background:${CO};box-shadow:0 0 0 3px rgba(217,87,59,.3)}`,
    `${APPS.map(([n, rail], i) => `<div class="win" style="left:${18 + i * 153}px"><div class="wt"><s></s><s></s><s></s><span>${n}</span></div>
       ${rail ? `<div class="rail" style="background:${rail}"><i></i><i></i><i></i></div>` : ""}
       <div class="bd" style="left:${rail ? 32 : 8}px"><div class="ac"><b>Follow-up due</b><small>F, 58 · CT chest</small><span>Open task</span></div>
       <div class="rest">${[0, 1, 2, 3, 4].map((k) => `<i class="bar" style="width:${60 + rnd(i * 9 + k) * 40}%"></i>`).join("")}</div></div></div>`).join("")}
     <div class="toast"><i></i><span class="tt"></span></div>`,
    (r, t) => {
      $$(r, ".win").forEach((w, i) => {
        rise(w, io(t, 0.1 + i * 0.1, 0.7 + i * 0.1), 12);
        const k = io(t, ARR[i], ARR[i] + 0.5, ease.out), ac = w.querySelector(".ac");
        S(ac, { opacity: k, transform: `translateY(${(k - 1) * 20}px) scale(${lerp(0.94, 1, k)})` });
        S(w.querySelector(".rest"), { top: `${4 + 62 * io(t, ARR[i], ARR[i] + 0.45, ease.inOut)}px` });
        S(w, { boxShadow: `0 1px 2px rgba(70,45,25,.06),0 12px 28px -10px rgba(70,45,25,.25),0 0 0 ${vis(t, ARR[i] + 0.2, ARR[i] + 1.2, 0.3) * 3}px rgba(217,87,59,.18)` });
      });
      const n = ARR.filter((a) => t > a + 0.2).length;
      html($(r, ".tt"), `Alert sent to <b>${Math.max(1, n)}</b> of 3 apps`);
      const k = io(t, 0.9, 1.4, ease.back);
      S($(r, ".toast"), { opacity: clamp(k), transform: `translateY(${(1 - k) * -14}px)` });
    });

  // 12. Queue re-sorts by score
  const Q = [["Case 1041", 42], ["Case 1042", 91], ["Case 1043", 63], ["Case 1044", 77], ["Case 1045", 18], ["Case 1046", 85]];
  const QR = Q.map((_, i) => i).sort((a, b) => Q[b][1] - Q[a][1]).reduce((m, oi, ni) => ((m[oi] = ni), m), []);
  add("queue-resort", "Queue re-sorts by score", "Each row in a queue gets a score that ticks up. Then the rows glide into score order and the top one is highlighted.", ["Prioritisation", "AI scoring"], 8,
    `& .qc{left:70px;top:30px;width:340px;height:212px;padding:12px 14px}
     & .qh{display:flex;align-items:baseline;gap:8px;font-size:12.5px;font-weight:700}
     & .qh span{font-size:8.5px;font-weight:500;color:${CO};letter-spacing:.14em}
     & .cols{display:flex;margin-top:9px;padding:0 8px;font-size:7.5px;color:#b2a69c}
     & .rows{position:absolute;left:14px;right:14px;top:56px}
     & .qr{position:absolute;left:0;right:0;height:24px;border-radius:6px;display:flex;align-items:center;gap:9px;padding:0 8px;font-size:10px;font-weight:600;color:#2a2c36}
     & .qr .av{width:14px;height:14px;border-radius:50%;background:#e9e2db}
     & .qr .nm{width:72px;font-size:9px;letter-spacing:.08em}
     & .sg{width:110px;height:5px;border-radius:3px;background:#f0eae4;overflow:hidden}
     & .sg i{display:block;height:100%;border-radius:3px}
     & .sc2{margin-left:auto;width:34px;text-align:center;font-size:10px;font-weight:750;padding:2px 0;border-radius:4px}
     & .top{position:absolute;right:52px;font-size:7.5px;font-weight:700;color:#fff;background:${CO};padding:2px 4px;border-radius:3px;letter-spacing:.12em}`,
    `<div class="cd qc"><div class="qh">Queue<span class="mono">Sorted by score</span></div><div class="cols mono"><span style="width:95px">Case</span><span>Signal</span><span style="margin-left:auto">Score</span></div>
     <div class="rows">${Q.map(([n]) => `<div class="qr"><i class="av"></i><span class="nm mono">${n}</span><span class="sg"><i></i></span><span class="sc2"></span><span class="top mono">Top</span></div>`).join("")}</div></div>`,
    (r, t) => {
      rise($(r, ".qc"), io(t, 0.1, 0.8), 14);
      S($(r, ".qh span"), { opacity: io(t, 4.3, 4.8) });
      $$(r, ".qr").forEach((row, i) => {
        const v = Q[i][1], tk = io(t, 0.8 + i * 0.15, 2.2 + i * 0.15), cur = Math.round(v * tk);
        const hi = v >= 80, mid = v >= 60;
        const sc = row.querySelector(".sc2");
        html(sc, String(cur));
        S(sc, { background: hi ? "#fbe6df" : mid ? "#f8ecd2" : "#f1ece7", color: hi ? CO : mid ? "#a8710f" : "#8f857d" });
        S(row.querySelector(".sg i"), { width: `${cur}%`, background: hi ? CO : mid ? "#d9a441" : "#c9bfb6" });
        const s = io(t, 3.0 + QR[i] * 0.06, 4.2 + QR[i] * 0.06, ease.inOut);
        const y = lerp(i, QR[i], s) * 25, lift = Math.sin(s * Math.PI);
        const top = QR[i] === 0 ? io(t, 4.4, 4.9) : 0;
        S(row, { top: `${y}px`, zIndex: lift > 0.01 ? 2 : 1, background: top ? `rgba(217,87,59,${0.09 * top})` : lift > 0.01 ? "#fff" : "transparent", boxShadow: lift > 0.01 ? `0 ${6 * lift}px ${14 * lift}px -6px rgba(70,45,25,.35)` : top ? `inset 3px 0 0 rgba(217,87,59,${top})` : "none", transform: `scale(${1 + lift * 0.02})`, opacity: io(t, 0.3 + i * 0.06, 0.8 + i * 0.06) });
        S(row.querySelector(".top"), { opacity: top, transform: `scale(${lerp(0.6, 1, top)})` });
      });
    });

  // 13. KPI counters
  const KPI = [["Follow-ups closed", 1284, 0, "", "+12%", NV], ["On-time rate", 98.2, 1, "%", "+4.1 pts", "#3f8f6b"], ["Median response", 3.4, 1, "h", "−38%", CO], ["Staff hours saved", 412, 0, "", "+21%", NV]];
  const spark = (i) => [...Array(9)].map((_, k) => `${k * 10},${26 - (k * 2.2 + rnd(i * 13 + k) * 9)}`).join(" ");
  add("kpi-counters", "KPI counters", "Three or four result tiles count up to their numbers while small sparklines draw beside them.", ["Results and ROI", "Dashboards"], 7,
    `& .kt{width:192px;height:84px;padding:12px 14px}
     & .kl{font-size:8.5px;color:#a3978d;letter-spacing:.16em}
     & .kv{font-size:28px;font-weight:780;letter-spacing:-1px;margin-top:8px;color:#22242e;font-variant-numeric:tabular-nums}
     & .kd{position:absolute;left:14px;bottom:11px;font-size:8.5px;font-weight:700;padding:2px 5px;border-radius:4px;background:#e3f1ea;color:#2f7a57}
     & .kt svg{left:auto;right:14px;top:auto;bottom:16px}`,
    `<div class="kick mono">This quarter · after launch</div>
     ${KPI.map((k, i) => `<div class="cd kt" style="left:${40 + (i % 2) * 208}px;top:${46 + Math.floor(i / 2) * 98}px"><div class="kl mono">${k[0]}</div><div class="kv"></div><span class="kd">${k[4]}</span>
       <svg width="80" height="30"><polygon class="ar" points="0,30 ${spark(i)} 80,30" fill="${k[5]}" opacity="0"/><polyline class="ln" pathLength="1" points="${spark(i)}" stroke="${k[5]}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg></div>`).join("")}`,
    (r, t) => {
      rise($(r, ".kick"), io(t, 0.1, 0.6));
      $$(r, ".kt").forEach((el, i) => {
        const a = 0.3 + i * 0.22, [, v, dec, suf] = KPI[i];
        rise(el, io(t, a, a + 0.6), 14);
        const c = io(t, a + 0.3, a + 2.2, (x) => 1 - Math.pow(1 - x, 3));
        html(el.querySelector(".kv"), (v * c).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf);
        draw(el.querySelector(".ln"), io(t, a + 0.5, a + 2.0, ease.inOut));
        S(el.querySelector(".ar"), { opacity: 0.1 * io(t, a + 1.6, a + 2.3) });
        rise(el.querySelector(".kd"), io(t, a + 1.9, a + 2.4), 4);
      });
    });

  // 14. 3D layer stack
  const LAY = [["Interface", "Apps · chat · email", "#fff", "#e7ddd3"], ["Engine", "Rules · AI · routing", "#fbebe5", "#efc3b5"], ["Data", "EMR · labs · scheduling", "#e8edf6", "#c4d0e6"]];
  add("stack-3d", "3D layer stack", "A flat diagram tilts into 3D and its layers lift apart, with the labels lying on each plane. Then it settles back.", ["Architecture", "Platform story"], 8,
    `& .wr{position:absolute;inset:0;perspective:900px;perspective-origin:50% 40%}
     & .stg{position:absolute;left:240px;top:150px;width:0;height:0;transform-style:preserve-3d}
     & .pl{position:absolute;left:-120px;width:240px;border-radius:10px;border:1.2px solid;padding:10px 14px;display:flex;flex-direction:column;justify-content:flex-start;box-shadow:0 10px 30px -10px rgba(70,45,25,.3)}
     & .pl b{font-size:14px;color:#25242c}
     & .pl small{font-size:8.5px;color:#8f857d;letter-spacing:.14em;margin-top:3px}
     & .chips{display:flex;gap:6px;margin-top:9px}
     & .chips i{width:40px;height:16px;border-radius:4px;background:rgba(255,255,255,.75);box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}`,
    `<div class="kick mono">How it fits together</div><div class="wr"><div class="stg">${LAY.map(([n, s, bg, bd]) => `<div class="pl" style="background:${bg};border-color:${bd}"><b>${n}</b><small class="mono">${s}</small><div class="chips"><i></i><i></i><i></i></div></div>`).join("")}</div></div>`,
    (r, t) => {
      rise($(r, ".kick"), io(t, 0.1, 0.6));
      const tilt = Math.min(io(t, 1.1, 2.7, ease.inOut), 1 - io(t, 5.7, 7.2, ease.inOut));
      const sep = Math.min(io(t, 2.1, 3.5, ease.inOut), 1 - io(t, 5.4, 6.8, ease.inOut));
      const br = Math.sin(t * 1.6) * 5 * sep;
      S($(r, ".stg"), { transform: `rotateX(${58 * tilt}deg) rotateZ(${(-36 + Math.sin(t * 0.7) * 3 * sep) * tilt}deg)` });
      $$(r, ".pl").forEach((p, i) => {
        const h = lerp(52, 112, tilt), y = lerp((i - 1) * 60, 0, tilt);
        const k = io(t, 0.2 + i * 0.12, 0.8 + i * 0.12);
        S(p, { height: `${h}px`, top: `${y - h / 2}px`, opacity: k, transform: `translateZ(${(1 - i) * (62 * sep + br)}px) translateY(${(1 - k) * 10}px)`, boxShadow: `0 ${10 + sep * 14}px ${30 + sep * 10}px -10px rgba(70,45,25,${0.3 + sep * 0.1})` });
      });
    });

  // 15. Annotated figure
  const SPOTS = [[85, 58, "Thyroid nodule", "Ultrasound · 12 mo"], [64, 92, "Lung nodule", "CT · 6–12 mo"], [100, 122, "Liver lesion", "MRI · 3 mo"], [74, 150, "Kidney cyst", "Ultrasound · 6 mo"]];
  const FX = 36, FY = 30;
  add("map-or-body", "Annotated figure", "A simple outline figure gets numbered hotspots that pop in one by one. Each one links to a row in a list that fills in beside it.", ["Coverage and scope", "Maps and parts"], 8,
    `& .fh{position:absolute;left:250px;top:26px;font-size:17px;font-weight:750;letter-spacing:-.4px}
     & .fh b{color:${CO}}
     & .li{position:absolute;left:250px;width:200px;height:34px;padding:0 10px;display:flex;align-items:center;gap:9px}
     & .li em{width:16px;height:16px;border-radius:50%;background:${CO};color:#fff;font-size:9px;font-weight:700;font-style:normal;display:flex;align-items:center;justify-content:center;flex:none}
     & .li div{display:flex;flex-direction:column;gap:2px}
     & .li b{font-size:11px;color:#262833}
     & .li small{font-size:8px;color:#a3978d;letter-spacing:.1em}
     & .hs{position:absolute;width:0;height:0}
     & .hs em{position:absolute;left:-8px;top:-8px;width:16px;height:16px;border-radius:50%;background:${CO};color:#fff;font-size:9px;font-weight:700;font-style:normal;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(255,255,255,.8),0 4px 10px -2px rgba(217,87,59,.6)}
     & .hs i{position:absolute;left:-8px;top:-8px;width:16px;height:16px;border-radius:50%;border:1.5px solid ${CO}}`,
    `<svg width="480" height="270">
     <g transform="translate(${FX},${FY})"><g class="fig" stroke="#c4b5a8" stroke-width="1.4">
       <circle class="ln" style="fill:#eee5dc" pathLength="1" cx="85" cy="24" r="17"/>
       <path class="ln" style="fill:#eee5dc" pathLength="1" d="M62,48Q85,42 108,48L126,58Q134,62 136,74L144,126Q145,132 139,133L134,133L124,82L120,136Q119,170 111,206L95,206L88,152L82,152L75,206L59,206Q51,170 50,136L46,82L36,133L31,133Q25,132 26,126L34,74Q36,62 44,58Z"/></g></g>
     <g fill="none" stroke="${CO}" stroke-width="1" opacity=".55" stroke-dasharray="2 3">${SPOTS.map((s, i) => `<path class="lk" d="M${FX + s[0] + 10},${FY + s[1]}C200,${FY + s[1]} 210,${84 + i * 44} 250,${84 + i * 44}"/>`).join("")}</g></svg>
     ${SPOTS.map((s, i) => `<div class="hs" style="left:${FX + s[0]}px;top:${FY + s[1]}px"><i></i><em>${i + 1}</em></div>`).join("")}
     <div class="fh"><b>0</b> <span>findings</span> mapped</div>
     ${SPOTS.map((s, i) => `<div class="cd li" style="top:${67 + i * 44}px"><em>${i + 1}</em><div><b>${s[2]}</b><small class="mono">${s[3]}</small></div></div>`).join("")}`,
    (r, t) => {
      $$(r, ".fig .ln").forEach((p) => { draw(p, io(t, 0.2, 1.5, ease.inOut)); S(p, { fillOpacity: io(t, 1.0, 1.8) }); });
      const AT = (i) => 1.7 + i * 0.75;
      let n = 0;
      $$(r, ".hs").forEach((h, i) => {
        const k = io(t, AT(i), AT(i) + 0.45, ease.back), p = prog(t, AT(i), AT(i) + 1.0);
        if (t > AT(i)) n = i + 1;
        S(h.lastChild, { transform: `scale(${Math.max(0, k)})` });
        S(h.firstChild, { opacity: p > 0 && p < 1 ? 1 - p : 0, transform: `scale(${1 + p * 1.6})` });
      });
      $$(r, ".lk").forEach((l, i) => S(l, { opacity: io(t, AT(i) + 0.2, AT(i) + 0.6) }));
      $$(r, ".li").forEach((l, i) => { const k = io(t, AT(i) + 0.25, AT(i) + 0.75); S(l, { opacity: k, transform: `translateX(${(1 - k) * 14}px)` }); });
      html($(r, ".fh b"), String(n)); html($(r, ".fh span"), n === 1 ? "finding" : "findings");
      S($(r, ".fh"), { opacity: io(t, 0.4, 1.0) });
    });
})();
