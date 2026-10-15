/* Items inspired by the reference launch film (calm, warm, documentary). Each one joins an existing section. */
(() => {
  const { prog, io, vis, lerp, clamp, ease, typed, S } = G;
  const CO = "#d9573b", NV = "#2f4f8f";
  const $ = (r, s) => ((r._c ||= {})[s] ??= r.querySelector(s));
  const $$ = (r, s) => ((r._a ||= {})[s] ??= [...r.querySelectorAll(s)]);
  const html = (el, s) => { if (el._s !== s) { el._s = s; el.innerHTML = s; } };
  const rise = (el, k, d = 10) => S(el, { opacity: k, transform: `translateY(${(1 - k) * d}px)` });
  const draw = (p, k) => S(p, { strokeDashoffset: 1 - k });
  // scene visibility with a soft focus dissolve
  const scene = (el, t, a, b, f = 0.4) => { const o = Math.min(prog(t, a, a + f), 1 - prog(t, b - f, b)); S(el, { opacity: o, filter: `blur(${(1 - o) * 7}px)`, visibility: o > 0 ? "visible" : "hidden" }); return o; };

  const BASE = `
&{position:absolute;inset:0;overflow:hidden;background:#f6f1ec;color:#22242e;font-family:-apple-system,"Helvetica Neue",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
&::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 55% at 50% 45%,rgba(255,255,255,.6),rgba(255,255,255,0) 72%),radial-gradient(ellipse 90% 90% at 50% 50%,transparent 55%,rgba(130,90,60,.09))}
& .sc,& .ss{position:absolute;inset:0}
& .mono{font-family:"SF Mono",ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.2em}
& .kick{position:absolute;left:0;right:0;top:34px;text-align:center;font-size:9.5px;color:#a3978d;white-space:nowrap}
& .cd{position:absolute;background:#fff;border-radius:9px;box-shadow:0 1px 2px rgba(70,45,25,.06),0 10px 28px -8px rgba(70,45,25,.18)}
& .serif{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-style:italic}
& .bar{display:block;height:5px;border-radius:3px;background:#ece5de}
& .pill{display:inline-block;font-size:8.5px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap}
& svg{position:absolute;left:0;top:0;overflow:visible}
& .ln{fill:none;stroke-dasharray:1;stroke-dashoffset:1}
& .fur{position:absolute;font-size:8.5px;color:#aa9e94;letter-spacing:.18em;white-space:nowrap}
& .fur.tr{top:12px;right:14px}& .fur.bl{bottom:11px;left:14px}& .fur.br{bottom:11px;right:14px;color:${CO};font-weight:600}
& .cap{position:absolute;left:20px;right:20px;top:222px;text-align:center;font-size:14.5px;line-height:1.35;color:#2b2a30}
& .ap{padding:10px 12px;width:140px}
& .ap .ah{display:flex;justify-content:space-between;align-items:center}
& .ap .cal{width:10px;height:10px;border:1.5px solid #9fb0cf;border-radius:2px}
& .ap .at{display:block;font-size:14px;margin:7px 0 2px}
& .ap .ad{font-size:8.5px;color:#7f766f;letter-spacing:.12em}
& .ap .af{display:flex;gap:6px;align-items:center;margin-top:8px}
& .ap .trk{font-size:8.5px;color:#3f8f6b;font-weight:600}`;

  const FUR = `<div class="fur mono tr">UC-07 · Missed follow-up</div><div class="fur mono bl">Dramatised · Not real data</div><div class="fur mono br">Relay</div>`;
  const APPT = (st = "") => `<div class="cd ap" style="${st}"><div class="ah"><span class="pill mono" style="background:#e6ecf6;color:${NV}">Follow-up</span><span class="cal"></span></div>
    <b class="at">CT chest</b><span class="mono ad">Sep 18 · 9:30 AM</span><div class="af"><span class="pill" style="background:#efebe6;color:#6f665f">Scheduled</span><span class="trk">● Tracking</span></div></div>`;
  const NODE = (x, y, c, ty, ti, w = 92) => `<div class="nd" style="left:${x}px;top:${y}px;width:${w}px"><i style="background:${c}22;box-shadow:inset 0 0 0 1.5px ${c}"></i><div><span class="mono" style="color:${c}">${ty}</span><b>${ti}</b></div></div>`;
  const NODE_CSS = `& .nd{position:absolute;height:38px;background:#fff;border-radius:7px;border:1px solid #ece4dc;box-shadow:0 6px 16px -8px rgba(70,45,25,.25);display:flex;align-items:center;gap:7px;padding:0 8px}
& .nd i{width:15px;height:15px;border-radius:4px;flex:none}
& .nd div{display:flex;flex-direction:column;gap:2px}
& .nd span{font-size:7.5px;letter-spacing:.14em}& .nd b{font-size:10px;white-space:nowrap;color:#262833}`;

  function add(section, id, title, desc, bestFor, loop, css, body, render, outer = "") {
    const cls = "rf-" + id, P = "." + cls;
    GALLERY.add({
      section, id, title, desc, bestFor, loop,
      build(el) { el.innerHTML = `<style>${(BASE + css).replaceAll("&", P)}</style><div class="${cls}"><div class="sc">${body}</div>${outer}</div>`; },
      render(el, t) { const r = el.lastElementChild; S($(r, ".sc"), { opacity: vis(t, 0, loop, 0.45) }); render(r, t); },
    });
  }

  // 1. formats / case-story
  const CASE = [
    [0.0, 1.8, "ED · March 12 · 11:48 PM", "A scan rules out one thing, and finds another."],
    [1.6, 3.4, "Run 1 · March 12 · 11:48 PM", "The hospital's own rule routes it, that minute."],
    [3.2, 4.9, "March 13 · 8:02 AM", "By morning, it's on the worklist."],
    [4.7, 6.3, "Six months later", "Then six months pass. People move on."],
    [6.1, 8.0, "", ""],
  ];
  const MON = ["MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP"];
  add("formats", "case-story", "Case story", "One case followed in real time. A timestamp changes per scene as a document types in, a workflow builds, a row lands, months skip by, and a statement card lands the point.", ["Clinical and ops products", "Documentary feel"], 8,
    NODE_CSS + `
     & .doc{left:80px;top:60px;width:320px;height:112px;padding:14px 18px}
     & .doc .h{font-size:8px;color:#7d746d;display:flex;justify-content:space-between}
     & .doc .tx{margin-top:14px;font-size:14px;line-height:1.5;color:#2a2c36}
     & .doc em{font-style:normal;font-weight:600;border-radius:3px;padding:0 1px;white-space:nowrap}
     & .wl{left:60px;top:66px;width:226px;padding:10px 10px 6px;background:#f3ede6}
     & .wl .t{font-size:11.5px;font-weight:700;margin:0 0 6px 4px}
     & .rw{height:24px;display:flex;align-items:center;gap:6px;padding:0 7px;border-radius:5px;font-size:9.5px;font-weight:650;overflow:hidden}
     & .mo{position:absolute;top:58px;left:0;width:80px;text-align:center;font:300 28px/1 "SF Mono",ui-monospace,Menlo,monospace}
     & .st{position:absolute;left:0;right:0;text-align:center;font-size:24px;color:#25242c}`,
    `<div class="kick mono"></div>
     <div class="ss s0"><div class="cd doc"><div class="h mono"><span>CT chest · Emergency</span><span>Signed 11:48</span></div><div class="tx"></div></div></div>
     <div class="ss s1"><svg width="480" height="270"><g stroke="#cdbfb3" stroke-width="1.4"><path class="ln" pathLength="1" d="M118,120H138"/><path class="ln" pathLength="1" d="M230,120H250"/><path class="ln" pathLength="1" d="M342,120H362"/></g></svg>
       ${NODE(26, 101, "#4a74c9", "Trigger", "Report received")}${NODE(138, 101, "#2f4f8f", "AI read", "Read the report")}${NODE(250, 101, "#c98a1a", "Router", "Apply the rule")}${NODE(362, 101, CO, "Action", "Task navigator")}</div>
     <div class="ss s2"><div class="cd wl"><div class="t">Worklist</div><div class="rw nw"><span class="pill" style="background:${CO};color:#fff">NEW</span>Schedule follow-up CT</div>
       <div class="rw">Review CT chest</div><div class="rw">Confirm results letter</div></div>${APPT("left:306px;top:86px")}</div>
     <div class="ss s3">${MON.map((m) => `<div class="mo">${m}</div>`).join("")}${APPT("left:170px;top:112px")}</div>
     <div class="ss s4"><div class="st serif" style="top:84px">It doesn't fail at the scan.</div><div class="st serif" style="top:120px">It fails in the <span>follow-through.</span></div></div>
     <div class="cap serif"></div>`,
    (r, t) => {
      const cur = CASE.findIndex(([a, b]) => t >= a && t < b - 0.2), ci = cur < 0 ? 4 : cur;
      const [ka, kb, kick, cap] = CASE[ci];
      const ko = Math.min(prog(t, ka + 0.15, ka + 0.5), 1 - prog(t, kb - 0.45, kb - 0.15));
      html($(r, ".kick"), kick); S($(r, ".kick"), { opacity: ko });
      html($(r, ".cap"), cap); S($(r, ".cap"), { opacity: ko, filter: `blur(${(1 - ko) * 3}px)` });
      CASE.forEach(([a, b], i) => scene($(r, ".s" + i), t, a, b));
      // doc types with highlights
      const T = "Incidental 8 mm nodule. Recommend CT in 6–12 months.", n = Math.floor((t - 0.35) * 48);
      const s = T.slice(0, Math.max(0, n));
      html($(r, ".tx"), s.replace("8 mm nodule", `<em style="color:#2f4f8f;background:rgba(47,79,143,.13)">8 mm nodule</em>`).replace("CT in 6–12 months", `<em style="color:${CO};background:rgba(217,87,59,.14)">CT in 6–12 months</em>`));
      $$(r, ".nd").forEach((nd, i) => { const k = io(t, 1.8 + i * 0.3, 2.2 + i * 0.3); S(nd, { opacity: k, transform: `translateX(${(1 - k) * -8}px)` }); });
      $$(r, ".s1 .ln").forEach((p, i) => draw(p, io(t, 2.05 + i * 0.3, 2.3 + i * 0.3)));
      const k = io(t, 3.6, 4.1, ease.inOut);
      S($(r, ".nw"), { height: `${24 * k}px`, opacity: k, background: "#fff", boxShadow: k ? "0 4px 12px -6px rgba(70,45,25,.3)" : "none" });
      rise($(r, ".s2 .ap"), io(t, 4.0, 4.4), 8);
      const raw = 6 * prog(t, 4.9, 6.0), pos = Math.floor(raw) + ease.inOut(raw % 1);
      $$(r, ".mo").forEach((m, i) => { const d = i - Math.min(6, pos); S(m, { transform: `translateX(${240 + d * 80 - 40}px)`, opacity: Math.max(0.1, 1 - Math.abs(d) * 0.4), color: i === 6 && pos > 5.5 ? CO : "#2a2c36" }); });
      const sts = $$(r, ".st");
      rise(sts[0], io(t, 6.3, 6.8), 6); rise(sts[1], io(t, 6.8, 7.3), 6);
      S(sts[1].firstElementChild, { color: t > 7.0 ? CO : "inherit" });
    }, FUR);

  // 2. looks / warm-editorial (same mock as the other looks: headline, card, chart, button)
  const BARS = [0.38, 0.55, 0.47, 0.7, 0.62, 0.95];
  add("looks", "warm-editorial", "Warm editorial light", "Warm paper with a soft vignette, coral and navy accents, spaced mono labels and white cards with soft shadows. Small corner labels give it a calm documentary feel.", ["Calm, trusted products", "Healthcare and ops", "Case stories"], 6,
    `& .cam{position:absolute;inset:0}
     & .left{position:absolute;left:36px;top:0;bottom:0;width:214px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
     & .k{font-size:9.5px;color:${CO};margin-bottom:12px}
     & .h{font-size:44px;line-height:1;font-weight:780;letter-spacing:-1.6px;color:#22242e}
     & .it{margin-top:12px;font-size:15px;color:#5b5550}
     & .btn{margin-top:18px;padding:9px 16px;font-size:12.5px;font-weight:650;border-radius:999px;background:${CO};color:#fff;box-shadow:0 8px 18px -8px rgba(217,87,59,.7)}
     & .crd{left:266px;top:50px;width:180px;height:172px;padding:16px}
     & .top{display:flex;align-items:center;gap:9px}
     & .av{width:24px;height:24px;border-radius:50%;background:${NV}}
     & .top div{display:flex;flex-direction:column;gap:5px}
     & .lns{margin-top:14px;display:flex;flex-direction:column;gap:6px}
     & .ch{position:absolute;left:16px;right:16px;bottom:16px;height:62px;display:flex;align-items:flex-end;gap:8px;border-bottom:1px solid #ece5de}
     & .ch s{flex:1;height:100%;border-radius:3px 3px 0 0;background:#c9d3e6;transform-origin:50% 100%}
     & .ch s:last-child{background:${CO}}
     & .tag{position:absolute;right:14px;top:18px;font-size:8px;padding:2px 5px;border-radius:3px;background:#e6ecf6;color:${NV};letter-spacing:.14em}`,
    `<div class="cam"><div class="left"><div class="k mono">Case 07 · Launch</div><div class="h">Ship faster</div><div class="it serif">Calm, clear, on time.</div><div class="btn">Get started</div></div>
     <div class="cd crd"><span class="tag mono">Live</span><div class="top"><b class="av"></b><div><i class="bar" style="width:70px"></i><i class="bar" style="width:44px"></i></div></div><div class="lns"><i class="bar" style="width:140px"></i><i class="bar" style="width:100px"></i></div>
     <div class="ch">${BARS.map(() => "<s></s>").join("")}</div></div></div>`,
    (r, t) => {
      const d = t / 6;
      S($(r, ".cam"), { transform: `translate(${lerp(4, -4, d)}px,${lerp(2, -2, d)}px) scale(${lerp(1, 1.035, ease.inOut(d))})` });
      [".k", ".h", ".it", ".btn"].forEach((s, i) => rise($(r, s), io(t, 0.25 + i * 0.2, 1.05 + i * 0.2), 14));
      const kc = io(t, 0.5, 1.4);
      S($(r, ".crd"), { opacity: kc, transform: `translateY(${(1 - kc) * 18}px)` });
      $$(r, ".ch s").forEach((b, i) => S(b, { transform: `scaleY(${Math.max(0.001, io(t, 1.1 + i * 0.15, 2.0 + i * 0.15) * BARS[i])})` }));
      $$(r, ".fur").forEach((f, i) => S(f, { opacity: io(t, 0.6 + i * 0.15, 1.2 + i * 0.15) * vis(t, 0, 6, 0.45) }));
    }, FUR);

  // 3. captions / italic-serif
  const CAPS = [[0.3, 3.4, "Eleven forty-eight p.m. A scan rules out one thing,<br>and finds something else."], [3.6, 6.7, "By morning, it's on the worklist.<br>The follow-up is booked for September."]];
  add("captions", "italic-serif", "Italic serif narration", "Centred italic serif subtitles near the bottom, in dark ink with no box. Each line holds for the whole scene, like a documentary.", ["Narrated stories", "Calm, premium feel"], 7,
    `& .wl{left:96px;top:44px;width:288px;padding:10px 10px 6px;background:#f3ede6}
     & .wl .t{font-size:11.5px;font-weight:700;margin:0 0 6px 4px;display:flex;gap:6px;align-items:center}
     & .rws{position:relative;height:96px}
     & .rw{position:absolute;left:0;right:0;height:24px;display:flex;align-items:center;gap:7px;padding:0 7px;border-radius:5px;font-size:9.5px;font-weight:650;color:#3a3b44}
     & .rw small{margin-left:auto;font-size:8px;color:#a3978d;font-weight:500}
     & .c{position:absolute;left:20px;right:20px;top:198px;text-align:center;font-size:16px;line-height:1.4;color:#24232b}`,
    `<div class="cd wl"><div class="t">Worklist<span class="pill" style="background:#f6e6c8;color:#a8710f">Navigators</span></div><div class="rws">
       <div class="rw nw"><span class="pill" style="background:${CO};color:#fff">NEW</span>Schedule follow-up CT<small>Sep 18</small></div>
       ${["Review CT chest", "Confirm results letter", "Call back lab"].map((x, i) => `<div class="rw old">${x}<small>Mar ${20 + i}</small></div>`).join("")}</div></div>
     ${CAPS.map((c) => `<div class="c serif">${c[2]}</div>`).join("")}`,
    (r, t) => {
      rise($(r, ".wl"), io(t, 0.1, 0.8), 10);
      const k = io(t, 3.8, 4.4, ease.inOut);
      $$(r, ".old").forEach((el, i) => S(el, { top: `${(i + k) * 24}px` }));
      S($(r, ".nw"), { top: "0px", opacity: k, background: "#fff", transform: `translateX(${(1 - k) * -16}px)` });
      S($(r, ".rws"), { height: `${72 + 24 * k}px` });
      $$(r, ".c").forEach((c, i) => { const o = vis(t, CAPS[i][0], CAPS[i][1], 0.45); S(c, { opacity: o, filter: `blur(${(1 - o) * 3}px)`, transform: `translateY(${(1 - o) * 4}px)` }); });
    });

  // 4. transitions / focus-pull
  add("transitions", "focus-pull", "Focus pull", "The scene softly blurs out while the next one blurs in. One card carries across sharp and unchanged, tying the two moments together.", ["Calm stories", "Time passing"], 6,
    NODE_CSS + `& .doc{left:26px;top:70px;width:260px;height:118px;padding:14px 16px}
     & .doc .h{font-size:8px;color:#7d746d}
     & .doc .tx{margin-top:12px;font-size:12.5px;line-height:1.5;color:#2a2c36}
     & .doc em{font-style:normal;font-weight:600;color:${CO};background:rgba(217,87,59,.14);border-radius:3px;padding:0 1px}`,
    `<div class="ss a"><div class="kick mono">March 12 · 11:48 PM</div><div class="cd doc"><div class="h mono">CT chest · Emergency</div><div class="tx">Incidental 8 mm nodule.<br>Recommend <em>CT in 6–12 months</em>.</div><div style="margin-top:12px;display:flex;gap:8px"><i class="bar" style="width:60px"></i><i class="bar" style="width:90px"></i></div></div></div>
     <div class="ss b"><div class="kick mono">September 18 · 9:40 AM</div><svg width="480" height="270"><path d="M120,102V116M120,154V168" stroke="#cdbfb3" stroke-width="1.4"/></svg>
       ${NODE(50, 64, "#4a74c9", "Trigger", "Visit missed", 140)}${NODE(50, 116, "#c98a1a", "Check", "No-show?", 140)}${NODE(50, 168, CO, "Action", "Call to rebook", 140)}</div>
     ${APPT("left:318px;top:92px")}`,
    (r, t) => {
      // A [0,1.9] -> B [1.5,4.9] -> A [4.5,6]
      const a = Math.max(1 - prog(t, 1.3, 2.1), prog(t, 4.3, 5.1)), b = 1 - a;
      S($(r, ".a"), { opacity: a, filter: `blur(${(1 - a) * 10}px)`, transform: `scale(${lerp(1.03, 1, a)})` });
      S($(r, ".b"), { opacity: b, filter: `blur(${(1 - b) * 10}px)`, transform: `scale(${lerp(0.97, 1, b)})` });
    });

  // 5. intros / introducing
  add("intros", "introducing", "Introducing + mark", "INTRODUCING appears in spaced mono capitals, a chevron mark draws in, then the wordmark slides out beside it on warm paper.", ["Launch films", "Calm brands"], 6,
    `& .in{position:absolute;left:0;right:0;top:86px;text-align:center;font-size:11px;color:#3a3b44}
     & .mk{position:absolute;top:116px;width:48px;height:40px}
     & .wm{position:absolute;left:218px;top:110px;height:52px;overflow:hidden}
     & .wm b{display:block;font-size:44px;font-weight:780;letter-spacing:-1.6px;line-height:52px;color:#22242e}
     & .wm b span{color:${CO}}
     & .tg{position:absolute;left:0;right:0;top:184px;text-align:center;font-size:15px;color:#5b5550}`,
    `<div class="in mono">Introducing</div>
     <svg class="mk" viewBox="0 0 48 40"><g fill="none" stroke="${CO}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path class="ln" pathLength="1" d="M6,6 20,20 6,34"/><path class="ln" pathLength="1" d="M22,6 36,20 22,34"/></g><circle cx="44" cy="20" r="3" fill="${CO}"/></svg>
     <div class="wm"><b>Re<span>lay</span></b></div><div class="tg serif">Your workflows, automated.</div>`,
    (r, t) => {
      const sp = io(t, 0.2, 1.2);
      S($(r, ".in"), { opacity: sp, letterSpacing: `${lerp(0.75, 0.5, sp)}em` });
      const ps = $$(r, ".mk .ln");
      draw(ps[0], io(t, 0.9, 1.5, ease.inOut)); draw(ps[1], io(t, 1.15, 1.75, ease.inOut));
      S($(r, ".mk circle"), { opacity: io(t, 1.7, 1.9), transform: `scale(${io(t, 1.7, 2.0, ease.back)})`, transformOrigin: "44px 20px" });
      const m = io(t, 2.1, 2.9, ease.inOut);
      S($(r, ".mk"), { left: `${lerp(216, 158, m)}px` });
      const w = io(t, 2.5, 3.3, ease.out);
      S($(r, ".wm b"), { transform: `translateX(${(w - 1) * 110}%)` });
      rise($(r, ".tg"), io(t, 3.5, 4.2), 8);
    });

  // 6. intros / frame-furniture
  const K1 = "Emergency dept · March 12 · 11:48 PM", K2 = "September 18 · 9:40 AM";
  add("intros", "frame-furniture", "Documentary frame labels", "Small labels stay in the corners the whole time: a case code, a 'not real data' note and the product name. A mono timestamp retypes itself between scenes.", ["Case stories", "Honest demos with sample data"], 7,
    `& .kick{color:${NV}}
     & .kick b{display:inline-block;width:6px;height:10px;background:${NV};vertical-align:-1px;margin-left:2px}
     & .doc{left:90px;top:62px;width:300px;height:104px;padding:14px 16px}
     & .doc .h{font-size:8px;color:#7d746d}
     & .doc .tx{margin-top:12px;font-size:13.5px;line-height:1.5;color:#2a2c36}
     & .doc em{font-style:normal;font-weight:600;color:${CO};background:rgba(217,87,59,.14);border-radius:3px;padding:0 1px}
     & .ns{position:absolute;left:298px;top:132px;font-size:9px;font-weight:700;color:#a8710f;background:#f6e6c8;padding:3px 7px;border-radius:4px}
     & .fur{color:#8f857d}
     & .hl{position:absolute;height:1px;background:${CO}}`,
    `<div class="ss a"><div class="cd doc"><div class="h mono">CT chest · Emergency · Signed 11:48</div><div class="tx">Incidental 8 mm nodule.<br>Recommend <em>CT in 6–12 months</em>.</div></div><div class="cap serif">A scan rules out one thing, and finds another.</div></div>
     <div class="ss b">${APPT("left:170px;top:66px")}<span class="ns">No-show</span><div class="cap serif">On the day, the patient doesn't come.</div></div>`,
    (r, t) => {
      scene($(r, ".a"), t, 0, 3.6, 0.45);
      scene($(r, ".b"), t, 3.4, 7.3, 0.45);
      rise($(r, ".a .doc"), io(t, 0.2, 0.9), 10);
      rise($(r, ".b .ap"), io(t, 3.5, 4.2), 10);
      const k = io(t, 4.6, 5.0, ease.back);
      S($(r, ".ns"), { opacity: clamp(k), transform: `scale(${lerp(0.6, 1, k)})` });
      let s;
      if (t < 2.9) s = typed(K1, t, 0.4, 34);
      else if (t < 3.6) s = K1.slice(0, Math.max(0, K1.length - Math.floor((t - 2.9) * 60)));
      else s = typed(K2, t, 3.7, 30);
      const blink = Math.floor(t * 2.4) % 2 === 0 || (t > 0.4 && t < 1.5) || (t > 2.9 && t < 4.5);
      html($(r, ".kick"), s + (blink ? "<b></b>" : ""));
      // corner labels: always on; a thin coral underline sweeps under each once at the start
      $$(r, ".hl").forEach((h, i) => { const p = prog(t, 0.6 + i * 0.25, 1.4 + i * 0.25); S(h, { opacity: p > 0 && p < 1 ? 1 - p : 0, transform: `scaleX(${p})` }); });
      S($(r, ".kick"), { opacity: t > 6.6 ? 1 - prog(t, 6.6, 7) : 1 });
    }, FUR + `<div class="kick mono"></div><i class="hl" style="right:14px;top:24px;width:130px;transform-origin:100% 50%"></i><i class="hl" style="left:14px;bottom:8px;width:156px;transform-origin:0 50%"></i><i class="hl" style="right:14px;bottom:8px;width:34px;transform-origin:100% 50%"></i>`);
})();
