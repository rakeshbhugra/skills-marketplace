/* Transitions: each preview plays its move at least twice per loop between clearly different mock screens. */
(() => {
  const { KF, io, prog, lerp, clamp, ease, S } = G;
  const PI = Math.PI;

  /* ---------- shared mock screens (480x270) ---------- */
  const CSS = `
&{position:absolute;inset:0;overflow:hidden;background:#f6f5f2;font-family:Inter,-apple-system,system-ui,sans-serif}
& .scr{position:absolute;left:0;top:0;width:480px;height:270px;overflow:hidden;transform-origin:50% 50%}
& .scr i,& .scr b,& .scr div{position:absolute;display:block;box-sizing:border-box}
& .scr svg{position:absolute;left:0;top:0}
& .sA{background:#ffffff}
& .sA .side{left:0;top:0;width:56px;height:270px;background:#f6f5f2;border-right:1px solid #e5e3de}
& .sA .logo{left:15px;top:16px;width:26px;height:26px;border-radius:8px;background:#2563eb}
& .sA .ic{left:19px;width:18px;height:18px;border-radius:6px;background:#e7e5e0}
& .sA .ic.on{background:rgba(37,99,235,.28)}
& .sA .ttl{left:76px;top:20px;width:130px;height:12px;border-radius:6px;background:#18181b}
& .sA .sub{left:76px;top:39px;width:86px;height:7px;border-radius:4px;background:#d6d3cc}
& .sA .btn{left:386px;top:20px;width:74px;height:24px;border-radius:12px;background:#2563eb;box-shadow:0 4px 14px rgba(37,99,235,.3)}
& .sA .tile{top:62px;width:121px;height:58px;border-radius:10px;background:#fff;border:1px solid #e5e3de;box-shadow:0 1px 3px rgba(24,24,27,.06)}
& .sA .tl{left:12px;top:11px;width:40px;height:6px;border-radius:3px;background:#e7e5e0}
& .sA .tb{left:12px;top:25px;height:12px;border-radius:6px;background:#18181b}
& .sA .tp{left:12px;top:43px;width:28px;height:6px;border-radius:3px;background:#2563eb}
& .sA .chart{left:76px;top:130px;width:384px;height:124px;border-radius:10px;background:#fff;border:1px solid #e5e3de;box-shadow:0 1px 3px rgba(24,24,27,.06)}
& .sB{background:#f6f5f2}
& .sB .hd{left:0;top:0;width:480px;height:48px;background:#fff;border-bottom:1px solid #e5e3de}
& .sB .av{left:20px;top:10px;width:28px;height:28px;border-radius:50%;background:#0d9488}
& .sB .nm{left:58px;top:13px;width:92px;height:9px;border-radius:5px;background:#18181b}
& .sB .st{left:58px;top:28px;width:54px;height:6px;border-radius:3px;background:#b8b5ad}
& .sB .dots{left:430px;top:19px;width:30px;height:10px;border-radius:5px;background:#efede8}
& .sB .bub{border-radius:14px;background:#fff;border:1px solid #e5e3de;box-shadow:0 1px 3px rgba(24,24,27,.06)}
& .sB .bub.l{border-bottom-left-radius:4px}
& .sB .bub.r{background:#0d9488;border:0;border-bottom-right-radius:4px;box-shadow:0 4px 12px rgba(13,148,136,.3)}
& .sB .bub i{height:7px;border-radius:4px;background:#e7e5e0}
& .sB .bub.r i{background:rgba(255,255,255,.8)}
& .sB .in{left:20px;top:218px;width:440px;height:38px;border-radius:19px;background:#fff;border:1px solid #e5e3de}
& .sB .in i{left:16px;top:14px;width:120px;height:7px;border-radius:4px;background:#e7e5e0}
& .sB .in b{left:405px;top:4px;width:28px;height:28px;border-radius:50%;background:#0d9488}
& .sC{background:linear-gradient(#2563eb 0 62px,#ffffff 62px)}
& .sC .ct{left:28px;top:22px;width:150px;height:13px;border-radius:7px;background:#fff}
& .sC .cs{left:28px;top:43px;width:96px;height:7px;border-radius:4px;background:rgba(255,255,255,.6)}
& .sC .cp{left:388px;top:20px;width:64px;height:24px;border-radius:12px;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.4)}
& .sC .row{left:28px;width:424px;height:48px;border-radius:12px;background:#fff;border:1px solid #e5e3de;box-shadow:0 4px 14px rgba(24,24,27,.08)}
& .sC .ra{left:12px;top:10px;width:28px;height:28px;border-radius:50%}
& .sC .r1{left:52px;top:13px;height:8px;border-radius:4px;background:#18181b}
& .sC .r2{left:52px;top:28px;width:80px;height:6px;border-radius:3px;background:#d6d3cc}
& .sC .rp{left:358px;top:15px;width:52px;height:18px;border-radius:9px;background:#ea580c}
& .sD{background:radial-gradient(circle at 30% 50%,#13213f,#0b0b0f 70%)}
& .sD .dt{left:262px;top:78px;width:150px;height:14px;border-radius:7px;background:#f4f4f5}
& .sD .ds{left:262px;top:101px;width:104px;height:8px;border-radius:4px;background:#3f3f46}
& .sD .bar{width:16px;bottom:62px;border-radius:5px 5px 2px 2px}
& .sD .rc{left:120px;top:126px;width:40px;height:18px;border-radius:6px;background:#f4f4f5}
`;
  const ys = [92, 84, 88, 70, 74, 58, 63, 48, 52, 38, 42, 26];
  const line = ys.map((y, i) => `${i ? "L" : "M"}${16 + i * 32} ${y}`).join(" ");
  const SCR = {
    A: () => `<div class="scr sA">
      <div class="side"><i class="logo"></i>${[64, 94, 124, 154].map((y, i) => `<i class="ic${i ? "" : " on"}" style="top:${y}px"></i>`).join("")}</div>
      <i class="ttl"></i><i class="sub"></i><i class="btn"></i>
      ${[58, 44, 52].map((w, i) => `<div class="tile" style="left:${76 + i * 131.5}px"><i class="tl"></i><i class="tb" style="width:${w}px"></i><i class="tp"></i></div>`).join("")}
      <div class="chart"><svg width="384" height="124" viewBox="0 0 384 124">
        ${[30, 60, 90].map((y) => `<line x1="16" x2="368" y1="${y}" y2="${y}" stroke="#efede8" stroke-width="1"/>`).join("")}
        <path d="${line} L368 112 L16 112Z" fill="rgba(37,99,235,.12)"/>
        <path d="${line}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="368" cy="26" r="5" fill="#fff" stroke="#2563eb" stroke-width="3"/></svg></div></div>`,
    B: () => `<div class="scr sB">
      <div class="hd"><i class="av"></i><i class="nm"></i><i class="st"></i><i class="dots"></i></div>
      <div class="bub l" style="left:20px;top:62px;width:200px;height:34px"><i style="left:14px;top:13px;width:150px"></i></div>
      <div class="bub r" style="left:270px;top:106px;width:190px;height:34px"><i style="left:18px;top:13px;width:140px"></i></div>
      <div class="bub l" style="left:20px;top:150px;width:250px;height:48px"><i style="left:14px;top:13px;width:200px"></i><i style="left:14px;top:28px;width:130px"></i></div>
      <div class="in"><i></i><b></b></div></div>`,
    C: () => `<div class="scr sC"><i class="ct"></i><i class="cs"></i><i class="cp"></i>
      ${[0, 1, 2].map((i) => `<div class="row k${i}" style="top:${70 + i * 58}px"><i class="ra" style="background:${["#e7e5e0", "linear-gradient(135deg,#2563eb,#0d9488)", "#fdba74"][i]}"></i><i class="r1" style="width:${[130, 110, 150][i]}px"></i><i class="r2"></i><i class="rp"></i></div>`).join("")}</div>`,
    D: () => `<div class="scr sD"><svg width="480" height="270">
        <circle cx="140" cy="135" r="62" fill="none" stroke="#1f2533" stroke-width="16"/>
        <circle cx="140" cy="135" r="62" fill="none" stroke="#2563eb" stroke-width="16" stroke-linecap="round" stroke-dasharray="280 400" transform="rotate(-90 140 135)"/></svg>
      <i class="rc"></i><i class="dt"></i><i class="ds"></i>
      ${[30, 46, 38, 62, 52, 74].map((h, i) => `<i class="bar" style="left:${262 + i * 26}px;height:${h}px;background:${i % 2 ? "#0d9488" : "#2563eb"};opacity:${0.55 + i * 0.09}"></i>`).join("")}</div>`,
  };

  function mount(el, id, inner, extra = "") {
    const c = "tx-" + id;
    el.innerHTML = `<style>${(CSS + extra).replaceAll("&", "." + c)}</style><div class="${c}">${inner}</div>`;
    return el.lastElementChild;
  }
  const add = (o) => GALLERY.add({ section: "transitions", loop: 6, ...o });
  const quint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2);
  const mix = (a, b, x) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], x))).join(",")})`;

  /* 1. camera fly-through */
  const camPos = (t) => io(t, 0.8, 2.5, ease.inOut) - io(t, 3.8, 5.5, ease.inOut);
  const camS = (t) => KF(t, [[0, 1], [0.8, 1], [1.35, 0.46], [1.95, 0.46], [2.5, 1], [3.8, 1], [4.35, 0.46], [4.95, 0.46], [5.5, 1], [6, 1]])[0];
  const bez = (u, p0, p1, p2, p3) => (1 - u) ** 3 * p0 + 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u * u * p2 + u ** 3 * p3;
  add({
    id: "camera-fly", title: "Camera fly-through",
    desc: "Both screens sit on one big canvas. The camera pulls back, follows a glowing path, and pushes into the next screen.",
    bestFor: ["Step-by-step flows", "Feature tours"],
    build(el) {
      const r = mount(el, "camera-fly", `<div class="world">
        <div class="grid"></div>
        <div class="ghost" style="left:-80px;top:340px;width:300px;height:170px"></div>
        <div class="ghost" style="left:620px;top:-170px;width:300px;height:170px"></div>
        <svg class="path" width="1300" height="900" viewBox="-200 -200 1300 900" style="left:-200px;top:-200px">
          <path class="glow" d="M480 135 C 610 135, 530 420, 660 420"/><path class="core" d="M480 135 C 610 135, 530 420, 660 420"/>
          <circle cx="480" cy="135" r="6" fill="#2563eb"/><circle cx="660" cy="420" r="6" fill="#0d9488"/></svg>
        <div class="pan pa">${SCR.A()}</div><div class="pan pb" style="left:660px;top:285px">${SCR.B()}</div>
        <div class="dot"></div></div>`, `
        & .world{position:absolute;left:0;top:0;width:480px;height:270px;transform-origin:0 0}
        & .grid{position:absolute;left:-900px;top:-700px;width:2400px;height:1800px;background-image:radial-gradient(rgba(24,24,27,.13) 1.3px,transparent 1.6px);background-size:30px 30px}
        & .path{position:absolute;overflow:visible}
        & .path path{fill:none}
        & .glow{stroke:rgba(37,99,235,.25);stroke-width:14;filter:blur(6px)}
        & .core{stroke:#2563eb;stroke-width:3;stroke-dasharray:10 9;stroke-linecap:round}
        & .pan{position:absolute;left:0;top:0;width:480px;height:270px;overflow:hidden}
        & .ghost{position:absolute;border-radius:18px;border:1px solid #e5e3de;background:rgba(255,255,255,.6)}
        & .dot{position:absolute;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:#fff;box-shadow:0 0 0 5px rgba(37,99,235,.55),0 0 24px 8px rgba(37,99,235,.4)}`);
      el._r = { w: r.querySelector(".world"), pans: [...r.querySelectorAll(".pan")], core: r.querySelector(".core"), dot: r.querySelector(".dot") };
    },
    render(el, t) {
      const R = el._r;
      const cam = (t) => { const u = camPos(t); return [lerp(240, 900, u), lerp(135, 420, u), camS(t)]; };
      const [cx, cy, s] = cam(t), [cx2, cy2, s2] = cam(t + 0.03);
      const speed = Math.hypot(cx2 - cx, cy2 - cy) * s + Math.abs(s2 - s) * 300;
      S(R.w, { transform: `translate(240px,135px) scale(${s}) translate(${-cx}px,${-cy}px)`, filter: `blur(${clamp(speed * 0.12, 0, 1.2).toFixed(2)}px)` });
      const zo = clamp((1 - s) / 0.54);
      R.pans.forEach((p) => S(p, { borderRadius: `${22 * zo}px`, boxShadow: `0 0 0 ${1.5 * zo}px #e5e3de, 0 30px 70px rgba(24,24,27,${0.16 * zo}), 0 0 60px rgba(37,99,235,${0.12 * zo})` }));
      R.core.style.strokeDashoffset = -t * 50;
      const u = camPos(t), du = clamp((u - 0.12) / 0.76);
      S(R.dot, { transform: `translate(${bez(du, 480, 610, 530, 660)}px,${bez(du, 135, 135, 420, 420)}px)`, opacity: Math.min(prog(u, 0.04, 0.14), 1 - prog(u, 0.86, 0.96)) });
    },
  });

  /* 2. soft crossfade */
  add({
    id: "crossfade", title: "Soft crossfade",
    desc: "A calm dissolve from one screen to the next, with a tiny scale change so it never feels flat.",
    bestFor: ["Calm explainers", "Clinical or finance"],
    build(el) {
      const r = mount(el, "crossfade", SCR.A() + SCR.B());
      el._r = [...r.querySelectorAll(".scr")];
    },
    render(el, t) {
      const [a, b] = el._r;
      const x = io(t, 1.1, 2.3, ease.inOut) - io(t, 4.1, 5.3, ease.inOut);
      S(a, { transform: `scale(${1 + 0.035 * x})` });
      S(b, { opacity: x, transform: `scale(${1.035 - 0.035 * x})` });
    },
  });

  /* 3. push slide */
  add({
    id: "push-slide", title: "Push slide",
    desc: "The new screen slides in from the side and pushes the old one out of frame.",
    bestFor: ["App walkthroughs", "Mobile flows"],
    build(el) {
      const r = mount(el, "push-slide", SCR.A() + SCR.B() + SCR.C() + `<i class="edge"></i>`, `& .edge{position:absolute;top:0;left:0;width:40px;height:270px;background:linear-gradient(90deg,transparent,rgba(24,24,27,.16));pointer-events:none}`);
      el._r = { s: [...r.querySelectorAll(".scr")], edge: r.querySelector(".edge") };
    },
    render(el, t) {
      const { s, edge } = el._r, T = [0.9, 2.9, 4.9];
      const i = t < T[0] ? -1 : t < T[1] ? 0 : t < T[2] ? 1 : 2;
      s.forEach((x) => S(x, { transform: "translateX(480px)", filter: "none" }));
      if (i < 0) { S(s[0], { transform: "none" }); S(edge, { opacity: 0 }); return; }
      const q = io(t, T[i], T[i] + 0.75, ease.inOut), out = s[i % 3], inn = s[(i + 1) % 3];
      S(out, { transform: `translateX(${-480 * q}px)`, filter: `brightness(${1 - 0.15 * q})`, zIndex: 1 });
      S(inn, { transform: `translateX(${480 * (1 - q)}px)`, zIndex: 2 });
      S(edge, { transform: `translateX(${480 * (1 - q) - 40}px)`, opacity: q > 0 && q < 1 ? 1 : 0, zIndex: 3 });
    },
  });

  /* 4. zoom through */
  add({
    id: "zoom-through", title: "Zoom through",
    desc: "The camera dives into one card on the screen, and that card opens up to become the next screen.",
    bestFor: ["Drill-down details", "List to detail"],
    build(el) {
      const r = mount(el, "zoom-through", `<div class="cz">${SCR.C()}</div>
        <div class="mor"><div class="mb">${SCR.B()}</div><div class="mc"><i style="left:52px;top:13px;width:110px;height:8px;border-radius:4px;background:#18181b"></i><i style="left:52px;top:28px;width:80px;height:6px;border-radius:3px;background:#d6d3cc"></i><i style="left:358px;top:15px;width:52px;height:18px;border-radius:9px;background:#ea580c"></i></div></div>
        <i class="mav"></i>`, `
        & .cz{position:absolute;inset:0;transform-origin:240px 152px}
        & .cz .k1{visibility:hidden}
        & .mor{position:absolute;overflow:hidden;box-shadow:0 4px 14px rgba(24,24,27,.1)}
        & .mor i{position:absolute}
        & .mc{position:absolute;left:0;top:0;width:424px;height:48px}
        & .mb{position:absolute;left:0;top:0;width:480px;height:270px;transform-origin:0 0}
        & .mb .av{visibility:hidden}
        & .mav{position:absolute;left:0;top:0;width:28px;height:28px;border-radius:50%;background:#0d9488}`);
      el._r = { cz: r.querySelector(".cz"), mor: r.querySelector(".mor"), mb: r.querySelector(".mb"), mc: r.querySelector(".mc"), av: r.querySelector(".mav") };
    },
    render(el, t) {
      const R = el._r;
      const p = io(t, 1.0, 1.9, ease.inOut) - io(t, 4.0, 4.9, ease.inOut);
      const L = lerp(28, 0, p), T = lerp(128, 0, p), W = lerp(424, 480, p), H = lerp(48, 270, p);
      S(R.cz, { transform: `scale(${lerp(1, 2.4, p)})`, opacity: 1 - prog(p, 0.3, 0.8), filter: `blur(${(Math.sin(PI * p) * 2).toFixed(2)}px)` });
      S(R.mor, { left: L + "px", top: T + "px", width: W + "px", height: H + "px", borderRadius: lerp(12, 0, p) + "px", background: mix([255, 255, 255], [246, 245, 242], p) });
      const sc = W / 480;
      S(R.mb, { opacity: prog(p, 0.25, 0.75), transform: `translate(0,${(H - 270 * sc) / 2}px) scale(${sc})` });
      S(R.mc, { opacity: 1 - prog(p, 0, 0.3) });
      S(R.av, { transform: `translate(${lerp(40, 20, p)}px,${lerp(138, 10, p)}px)` });
    },
  });

  /* 5. mask wipe */
  add({
    id: "mask-wipe", title: "Mask wipe",
    desc: "A circle grows out of the button you just pressed and reveals the next screen inside it.",
    bestFor: ["Click to result", "Before and after"],
    build(el) {
      const r = mount(el, "mask-wipe", SCR.A() + SCR.B() + `<i class="ring"></i><i class="tap"></i>`, `
        & .ring{position:absolute;left:0;top:0;border-radius:50%;border:2px solid #2563eb;box-shadow:0 0 20px 3px rgba(37,99,235,.35),inset 0 0 20px 3px rgba(37,99,235,.2);z-index:5}
        & .tap{position:absolute;left:0;top:0;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:2px solid #2563eb;z-index:5}`);
      const [a, b] = r.querySelectorAll(".scr");
      el._r = { a, b, ring: r.querySelector(".ring"), tap: r.querySelector(".tap") };
    },
    render(el, t) {
      const R = el._r, one = t < 3;
      const [ox, oy, max] = one ? [423, 32, 500] : [441, 238, 520];
      const t0 = one ? 1.0 : 4.0;
      const pr = io(t, t0, t0 + 0.85, ease.inOut), rad = pr * max;
      const base = one ? R.a : R.b, top = one ? R.b : R.a;
      S(base, { zIndex: 1, clipPath: "none" });
      S(top, { zIndex: 2, clipPath: `circle(${rad}px at ${ox}px ${oy}px)` });
      S(R.ring, { width: 2 * rad + "px", height: 2 * rad + "px", transform: `translate(${ox - rad}px,${oy - rad}px)`, opacity: rad > 0 ? 1 - prog(pr, 0.6, 1) : 0 });
      const tp = prog(t, t0 - 0.45, t0 + 0.1);
      S(R.tap, { transform: `translate(${ox}px,${oy}px) scale(${lerp(0.4, 1.3, ease.out(tp))})`, opacity: tp > 0 && tp < 1 ? Math.sin(PI * tp) : 0 });
    },
  });

  /* 6. whip pan */
  const whip = (t) => 520 * (quint(prog(t, 1.3, 1.75)) - quint(prog(t, 4.3, 4.75)));
  add({
    id: "whip-pan", title: "Whip pan",
    desc: "A very fast sideways pan with heavy motion blur, like a camera snapping to the next screen.",
    bestFor: ["Energetic promos", "Launch videos"],
    build(el) {
      const streaks = Array.from({ length: 14 }, (_, i) => `<i style="top:${Math.round(10 + G.rnd(i) * 250)}px;left:${Math.round(G.rnd(i + 30) * 300)}px;width:${Math.round(120 + G.rnd(i + 60) * 260)}px;opacity:${(0.25 + G.rnd(i + 90) * 0.5).toFixed(2)}"></i>`).join("");
      const r = mount(el, "whip-pan", `<div class="cam"><div class="strip">${SCR.A()}<div class="b2">${SCR.B()}</div></div></div><div class="sk">${streaks}</div>`, `
        & .cam{position:absolute;inset:0;transform-origin:50% 50%}
        & .strip{position:absolute;left:0;top:0;width:1000px;height:270px}
        & .b2{position:absolute;left:520px;top:0;width:480px;height:270px}
        & .sk{position:absolute;inset:0;pointer-events:none}
        & .sk i{position:absolute;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(24,24,27,.45),transparent)}`);
      el._r = { cam: r.querySelector(".cam"), strip: r.querySelector(".strip"), sk: r.querySelector(".sk") };
    },
    render(el, t) {
      const R = el._r, o = whip(t), v = (whip(t + 0.012) - whip(t - 0.012)) / 0.024;
      const n = clamp(Math.abs(v) / 5800), sg = Math.sign(v);
      S(R.strip, { transform: `translateX(${-o}px)` });
      S(R.cam, { filter: `blur(${(n * 14).toFixed(2)}px)`, transform: `skewX(${-sg * 9 * n}deg) scaleX(${1 + 0.3 * n})` });
      S(R.sk, { opacity: clamp(n * 1.4), transform: `translateX(${(-o * 0.6) % 200}px) scaleX(${1 + n})` });
    },
  });

  /* 7. shared element morph */
  const LC = [[252, 74], [24, 134], [252, 134], [24, 194], [252, 194]];
  add({
    id: "shared-morph", title: "Shared element morph",
    desc: "One element, like a profile card, stays on screen and smoothly changes size and place while the rest of the screen changes around it.",
    bestFor: ["List to profile", "Continuity between views"],
    build(el) {
      const card = (x, y) => `<div class="lc" style="left:${x}px;top:${y}px"><i class="la"></i><i class="l1"></i><i class="l2"></i></div>`;
      const r = mount(el, "shared-morph", `
        <div class="scr sL"><i class="lt"></i><i class="ls"></i>${LC.map(([x, y]) => card(x, y)).join("")}</div>
        <div class="scr sP"><i class="bk"></i>${[90, 194, 298].map((x) => `<div class="pt" style="left:${x}px"><i class="p1"></i><i class="p2"></i></div>`).join("")}<i class="pb"></i></div>
        <div class="mc"><i class="ma"></i><i class="m1"></i><i class="m2"></i></div>`, `
        & .sL{background:#f6f5f2}
        & .sL .lt{left:24px;top:24px;width:120px;height:12px;border-radius:6px;background:#18181b}
        & .sL .ls{left:300px;top:18px;width:156px;height:26px;border-radius:13px;background:#fff;border:1px solid #e5e3de}
        & .sL .lc{width:204px;height:50px;border-radius:12px;background:#fff;border:1px solid #e5e3de;box-shadow:0 2px 8px rgba(24,24,27,.06)}
        & .sL .la{left:10px;top:10px;width:30px;height:30px;border-radius:50%;background:#e7e5e0}
        & .sL .l1{left:50px;top:14px;width:90px;height:8px;border-radius:4px;background:#18181b}
        & .sL .l2{left:50px;top:28px;width:60px;height:6px;border-radius:3px;background:#d6d3cc}
        & .sP{background:radial-gradient(circle at 50% 0%,#172554,#0b0b0f 65%)}
        & .sP .bk{left:20px;top:20px;width:28px;height:28px;border-radius:50%;background:#1c1c22}
        & .sP .pt{top:172px;width:92px;height:42px;border-radius:10px;background:#141418;border:1px solid #27272a}
        & .sP .p1{left:12px;top:9px;width:40px;height:10px;border-radius:5px;background:#f4f4f5}
        & .sP .p2{left:12px;top:26px;width:56px;height:6px;border-radius:3px;background:#3f3f46}
        & .sP .pb{left:150px;top:226px;width:180px;height:28px;border-radius:14px;background:#2563eb;box-shadow:0 6px 18px rgba(37,99,235,.4)}
        & .mc{position:absolute;overflow:hidden}
        & .mc i{position:absolute;display:block}
        & .ma{border-radius:50%;background:linear-gradient(135deg,#2563eb,#0d9488)}`);
      el._r = { L: r.querySelector(".sL"), P: r.querySelector(".sP"), lc: [...r.querySelectorAll(".lc")], pp: [...r.querySelectorAll(".pt,.pb,.bk")], mc: r.querySelector(".mc"), ma: r.querySelector(".ma"), m1: r.querySelector(".m1"), m2: r.querySelector(".m2") };
    },
    render(el, t) {
      const R = el._r;
      const p = io(t, 1.0, 2.0, ease.inOut) - io(t, 4.0, 5.0, ease.inOut);
      S(R.L, { opacity: 1 - prog(p, 0.25, 0.6) });
      R.lc.forEach((c, i) => S(c, { transform: `translateY(${18 * ease.inOut(prog(p, i * 0.05, 0.5 + i * 0.05))}px)`, opacity: 1 - prog(p, i * 0.05, 0.45 + i * 0.05) }));
      S(R.P, { opacity: prog(p, 0.25, 0.6) });
      const cp = ease.inOut(prog(p, 0.2, 0.65));
      R.pp.forEach((c, i) => { const q = ease.out(prog(p, 0.35 + i * 0.06, 0.75 + i * 0.04)); S(c, { opacity: q, transform: `translateY(${(1 - q) * 16}px)` }); });
      S(R.mc, { left: lerp(24, 150, p) + "px", top: lerp(74, 18, p) + "px", width: lerp(204, 180, p) + "px", height: lerp(50, 142, p) + "px", borderRadius: lerp(12, 20, p) + "px",
        background: mix([255, 255, 255], [22, 22, 28], cp), boxShadow: `0 2px 8px rgba(24,24,27,${0.06 * (1 - p)}), 0 0 0 1px rgba(229,227,222,${1 - cp}), 0 0 50px rgba(37,99,235,${0.3 * p})` });
      const as = lerp(30, 60, p);
      S(R.ma, { left: lerp(10, 60, p) + "px", top: lerp(10, 16, p) + "px", width: as + "px", height: as + "px" });
      S(R.m1, { left: lerp(50, 40, p) + "px", top: lerp(14, 90, ease.out(p)) + "px", width: lerp(90, 100, p) + "px", height: lerp(8, 10, p) + "px", borderRadius: "5px", background: mix([24, 24, 27], [244, 244, 245], cp) });
      S(R.m2, { left: lerp(50, 60, p) + "px", top: lerp(28, 110, ease.out(p)) + "px", width: "60px", height: "6px", borderRadius: "3px", background: mix([214, 211, 204], [82, 82, 91], cp) });
    },
  });

  /* 8. 3D card flip */
  add({
    id: "flip-3d", title: "3D card flip",
    desc: "The whole screen flips over like a playing card to show the next screen on its back.",
    bestFor: ["Before and after", "Playful reveals"],
    build(el) {
      const r = mount(el, "flip-3d", `<div class="pp"><div class="cd"><div class="fc">${SCR.A()}<i class="sh"></i></div><div class="fc bk">${SCR.B()}<i class="sh"></i></div></div></div>`, `
        &{background:radial-gradient(circle at 50% 45%,#ffffff,#e7e5e0 75%)}
        & .pp{position:absolute;inset:0;perspective:900px}
        & .cd{position:absolute;inset:0;transform-style:preserve-3d}
        & .fc{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}
        & .fc.bk{transform:rotateY(180deg)}
        & .sh{position:absolute;inset:0;background:#000;pointer-events:none}`);
      el._r = { cd: r.querySelector(".cd"), fc: [...r.querySelectorAll(".fc")], sh: [...r.querySelectorAll(".sh")] };
    },
    render(el, t) {
      const R = el._r;
      const a1 = io(t, 1.1, 2.0, ease.inOut), a2 = io(t, 4.1, 5.0, ease.inOut);
      const ang = 180 * (a1 + a2), m = Math.sin(PI * a1) + Math.sin(PI * a2);
      S(R.cd, { transform: `scale(${1 - 0.2 * m}) rotateY(${ang}deg)` });
      R.fc.forEach((f) => S(f, { borderRadius: 18 * clamp(m * 2) + "px", boxShadow: `0 0 0 ${m > 0 ? 1 : 0}px #e5e3de, 0 30px 60px rgba(24,24,27,${0.25 * m})` }));
      R.sh.forEach((s) => S(s, { opacity: 0.3 * Math.abs(Math.sin((ang * PI) / 180)) }));
    },
  });

  /* 9. cut on the beat */
  add({
    id: "beat-cut", title: "Cut on the beat",
    desc: "Hard cuts timed to the music, each with a quick white flash and a small punch-in.",
    bestFor: ["Music-led promos", "Social ads"],
    build(el) {
      const r = mount(el, "beat-cut", `<div class="sh">${SCR.A()}</div><div class="sh">${SCR.B()}</div><div class="sh">${SCR.C()}</div><div class="sh">${SCR.D()}</div>
        <i class="fl"></i><div class="bt">${"<i></i>".repeat(4)}</div>`, `
        & .sh{position:absolute;inset:0;transform-origin:50% 50%}
        & .fl{position:absolute;inset:0;background:#fff;pointer-events:none}
        & .bt{position:absolute;left:204px;top:238px;width:72px;height:20px;border-radius:10px;background:rgba(24,24,27,.78);display:flex;align-items:center;justify-content:center;gap:7px}
        & .bt i{display:block;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.3)}`);
      el._r = { sh: [...r.querySelectorAll(".sh")], fl: r.querySelector(".fl"), dots: [...r.querySelectorAll(".bt i")] };
    },
    render(el, t) {
      const R = el._r, k = Math.min(3, Math.floor(t / 1.5)), dt = t - k * 1.5;
      R.sh.forEach((s, i) => S(s, { display: i === k ? "block" : "none", transform: `scale(${1 + 0.07 * (1 - io(dt, 0, 0.3)) + 0.012 * dt})` }));
      S(R.fl, { opacity: 0.85 * (1 - io(dt, 0, 0.2)) });
      R.dots.forEach((d, i) => S(d, { background: i === k ? "#3b82f6" : "rgba(255,255,255,.3)", transform: `scale(${i === k ? 1 + 0.6 * (1 - io(dt, 0, 0.35)) : 1})`, boxShadow: i === k ? "0 0 10px rgba(59,130,246,.9)" : "none" }));
    },
  });

  /* 10. stack shuffle */
  add({
    id: "stack-shuffle", title: "Stack shuffle",
    desc: "Screens sit in a stack of cards. The top card slides away and the next one moves forward.",
    bestFor: ["Feature lists", "Multiple use cases"],
    build(el) {
      const r = mount(el, "stack-shuffle", [SCR.A(), SCR.B(), SCR.C()].map((s) => `<div class="cd"><div class="in">${s}</div></div>`).join(""), `
        &{background:radial-gradient(circle at 50% 30%,#ffffff,#e9e7e2 75%)}
        & .cd{position:absolute;left:72px;top:56px;width:336px;height:189px;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px #e5e3de,0 18px 40px rgba(24,24,27,.16)}
        & .in{position:absolute;left:0;top:0;width:480px;height:270px;transform:scale(.7);transform-origin:0 0}`);
      el._r = [...r.querySelectorAll(".cd")];
    },
    render(el, t) {
      const ST = [1.0, 3.0, 5.0], D = 1.0;
      const n = ST.filter((s) => t >= s + D).length, si = ST.findIndex((s) => t >= s && t < s + D);
      const q = si < 0 ? 0 : (t - ST[si]) / D;
      const place = (d) => ({ y: -d * 22, sc: 1 - d * 0.075, br: 1 - d * 0.1 });
      el._r.forEach((c, j) => {
        const base = (((j - n) % 3) + 3) % 3;
        if (si >= 0 && base === 0) {
          if (q < 0.5) {
            const e = ease.inOut(q / 0.5);
            S(c, { zIndex: 20, opacity: 1, filter: "none", transform: `translate(${-470 * e}px,${14 * e}px) rotate(${-9 * e}deg)` });
          } else {
            const e = ease.out(prog(q, 0.5, 1)), pl = place(2);
            S(c, { zIndex: 0, opacity: e, filter: `brightness(${pl.br})`, transform: `translateY(${pl.y - 26 * (1 - e)}px) scale(${pl.sc})` });
          }
          return;
        }
        const d = base - (si >= 0 ? io(q, 0.15, 0.75, ease.inOut) : 0), pl = place(d);
        S(c, { zIndex: 10 - Math.round(d * 2), opacity: 1, filter: `brightness(${pl.br})`, transform: `translateY(${pl.y}px) scale(${pl.sc})` });
      });
    },
  });
})();
