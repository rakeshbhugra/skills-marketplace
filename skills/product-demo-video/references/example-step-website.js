import { clamp, prog, lerp, ease, vis, io, rnd, typed, KF, S } from "../helpers.js";

// lumeneda.com with the Acme widget. A sales form is crossed out, the buyer just asks,
// the AI answers from Lumen's pricing guide and offers a 20-minute meeting with time slots.

const CURSOR = `<svg width="30" height="34" viewBox="0 0 26 30"><path d="M3 2 L3 24 L9 18.5 L13 27.5 L17 25.8 L13 17 L21 17 Z" fill="#fff" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
const MARK = `<span class="lm"><i></i></span>`;
const Q = "How does emulation pricing work?";
const ANS = "Emulation is usage-based. You buy a pool of emulator hours, not seats, starting at 500 hours a quarter. Unused hours roll over for 90 days.";
const BX = 40, BY = 20, BW = 1520, BH = 822;          // browser on the card
const PX = BX, PY = BY + 40;                           // page origin on the card
const WW = 430, WH = 540, WR = 28, WB = 22;           // widget size and offsets inside the page

// a deterministic waveform lane for the product visual
function wave(i, w, h) {
  let x = 0, hi = rnd(i) > .5, d = `M0 ${hi ? 4 : h - 4}`;
  const step = i === 0 ? 22 : 0;
  let k = 0;
  while (x < w) {
    const seg = step || 18 + Math.floor(rnd(i * 31 + k) * 70);
    x = Math.min(w, x + seg); d += ` H${x}`;
    if (x < w) { hi = !hi; d += ` V${hi ? 4 : h - 4}`; }
    k++;
  }
  return d;
}
const LANES = ["clk", "req", "ack", "data[31:0]", "irq"];

const CSS = `
.s-website { background: radial-gradient(1200px 700px at 60% 30%, #3b2139 0%, #2D1A2C 45%, #160c16 100%); overflow:hidden; }
.s-website .lm { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #4f46e5, #06b6d4); display: inline-flex; align-items: center; justify-content: center; flex: none; }
.s-website .lm i { width: 12px; height: 12px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 8px rgba(255,255,255,.8); }
.s-website .browser { box-shadow: 0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.08); }
.s-website .browser .url { font-size: 14px; gap: 8px; }
.s-website .browser .url b { color: #16a34a; font-size: 12px; }
.s-website .page { background: #fff; }
.s-website .nav { height: 70px; display:flex; align-items:center; gap: 34px; padding: 0 56px; background:#0f0d2a; color:#c7c9f5; font-size: 16px; font-weight: 500; border-bottom:1px solid rgba(255,255,255,.08); }
.s-website .nav .brand { display:flex; align-items:center; gap:10px; color:#fff; font-weight:800; font-size:20px; letter-spacing:-.3px; margin-right: 22px; }
.s-website .nav .sp { flex:1; }
.s-website .nav .cs { background:#fff; color:#0f0d2a; font-weight:700; padding:10px 18px; border-radius:9px; }
.s-website .hero { position:relative; height: 520px; background: radial-gradient(700px 400px at 78% 40%, rgba(99,102,241,.45), transparent), radial-gradient(500px 300px at 10% 100%, rgba(6,182,212,.25), transparent), linear-gradient(180deg,#0f0d2a,#17134a); color:#fff; overflow:hidden; }
.s-website .hero .grid { position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px); background-size: 48px 48px; }
.s-website .copy { position:absolute; left:72px; top:78px; width:560px; }
.s-website .kick { font-size:14px; font-weight:800; letter-spacing:2.5px; color:#67e8f9; }
.s-website h1 { font-size:54px; line-height:1.06; letter-spacing:-1.8px; font-weight:800; margin:16px 0 18px; }
.s-website h1 em { font-style:normal; background:linear-gradient(90deg,#67e8f9,#a5b4fc); -webkit-background-clip:text; background-clip:text; color:transparent; }
.s-website .copy p { font-size:19px; line-height:1.5; color:#c7c9f5; }
.s-website .ctas { display:flex; gap:14px; margin-top:30px; }
.s-website .ctas span { padding:14px 22px; border-radius:10px; font-weight:700; font-size:16px; }
.s-website .ctas .a { background:linear-gradient(135deg,#22d3ee,#6366f1); color:#0b0a24; }
.s-website .ctas .b { border:1px solid rgba(255,255,255,.3); color:#fff; }
.s-website .vis { position:absolute; left:720px; top:64px; width:700px; height:400px; border-radius:16px; background:rgba(16,14,48,.85); border:1px solid rgba(165,180,252,.25); box-shadow:0 30px 80px rgba(0,0,0,.5), 0 0 80px rgba(99,102,241,.25); overflow:hidden; }
.s-website .vis .vt { height:40px; display:flex; align-items:center; gap:10px; padding:0 16px; border-bottom:1px solid rgba(255,255,255,.08); font-size:13px; color:#a5b4fc; font-weight:600; }
.s-website .vis .vt b { color:#fff; } .s-website .vis .vt .ok { margin-left:auto; color:#4ade80; }
.s-website .lane { display:flex; align-items:center; height:46px; padding:0 16px; border-bottom:1px solid rgba(255,255,255,.05); }
.s-website .lane span { width:96px; font: 600 13px ui-monospace, Menlo, monospace; color:#8b8fd8; }
.s-website .lane svg { flex:1; height:30px; overflow:visible; }
.s-website .cursorline { position:absolute; top:40px; bottom:0; width:2px; background:#f472b6; box-shadow:0 0 12px #f472b6; }
.s-website .stat { position:absolute; background:#fff; color:#1d1720; border-radius:12px; padding:12px 16px; box-shadow:0 20px 50px rgba(0,0,0,.4); font-size:13px; color:#6b6470; font-weight:600; }
.s-website .stat b { display:block; font-size:26px; color:#0f0d2a; letter-spacing:-.6px; }
.s-website .stat b em { font-style:normal; color:#16a34a; font-size:14px; margin-left:6px; }
.s-website .below { padding: 34px 72px; }
.s-website .trust { font-size:13px; font-weight:700; letter-spacing:2px; color:#8a8190; }
.s-website .logos { display:flex; gap:56px; margin-top:16px; font-size:22px; font-weight:800; color:#b8b2c0; letter-spacing:1px; }
.s-website .feats { display:flex; gap:24px; margin-top:34px; }
.s-website .feats div { width:300px; border:1px solid #ece8ee; border-radius:14px; padding:18px; font-size:15px; color:#4a4250; }
.s-website .feats b { display:block; font-size:18px; color:#1d1720; margin-bottom:6px; }

/* sales form */
.s-website .dim { position:absolute; inset:0; background:rgba(10,8,30,.55); opacity:0; }
.s-website .form { position:absolute; left:470px; top:120px; width:520px; background:#fff; border-radius:18px; padding:28px 30px; box-shadow:0 40px 100px rgba(0,0,0,.5); opacity:0; }
.s-website .form h3 { font-size:24px; letter-spacing:-.5px; color:#1d1720; }
.s-website .form .sub { font-size:14.5px; color:#8a8190; margin:6px 0 18px; }
.s-website .form .fr { display:flex; gap:12px; margin-bottom:12px; }
.s-website .form .f { flex:1; } .s-website .form .f label { display:block; font-size:12.5px; font-weight:700; color:#4a4250; margin-bottom:5px; }
.s-website .form .f div { height:40px; border:1px solid #dcd6df; border-radius:8px; }
.s-website .form .f.tall div { height:70px; }
.s-website .form .f .caret { width:2px; height:20px; background:#6366f1; margin:9px 0 0 12px; border:0; border-radius:0; }
.s-website .form .sb { margin-top:6px; height:46px; border-radius:10px; background:#0f0d2a; color:#fff; font-weight:700; font-size:16px; display:flex; align-items:center; justify-content:center; }
.s-website .form .x { position:absolute; inset:-12px; pointer-events:none; }
.s-website .form .x line { stroke:#d33a8f; stroke-width:10; stroke-linecap:round; filter: drop-shadow(0 0 10px rgba(211,58,143,.8)); }
.s-website .noform { position:absolute; left:50%; top:46%; transform:translate(-50%,-50%); background:#d33a8f; color:#fff; font-weight:800; font-size:22px; padding:10px 22px; border-radius:999px; box-shadow:0 10px 40px rgba(211,58,143,.7); white-space:nowrap; opacity:0; }

/* widget */
.s-website .launch { position:absolute; right:${WR}px; bottom:${WB}px; width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#AC246E,#d33a8f); box-shadow:0 12px 30px rgba(172,36,110,.55); display:flex; align-items:center; justify-content:center; }
.s-website .launch i { width:28px; height:22px; border-radius:7px; background:#fff; position:relative; }
.s-website .launch i:after { content:""; position:absolute; left:6px; bottom:-6px; border:6px solid transparent; border-top-color:#fff; border-left-color:#fff; }
.s-website .teaser { position:absolute; right:${WR + 76}px; bottom:${WB + 12}px; background:#fff; border-radius:14px 14px 4px 14px; padding:12px 16px; font-size:15px; color:#1d1720; font-weight:600; box-shadow:0 12px 40px rgba(0,0,0,.25); white-space:nowrap; }
.s-website .wdg { position:absolute; right:${WR}px; bottom:${WB}px; width:${WW}px; height:${WH}px; border-radius:20px; overflow:hidden; background:#fff; box-shadow:0 30px 80px rgba(30,10,40,.45), 0 0 0 1px rgba(0,0,0,.05); transform-origin: 100% 100%; display:flex; flex-direction:column; }
.s-website .wh { height:66px; flex:none; background:linear-gradient(120deg,#AC246E,#d33a8f); color:#fff; display:flex; align-items:center; gap:12px; padding:0 18px; }
.s-website .wh .lm { width:38px; height:38px; border-radius:50%; box-shadow:0 0 0 2px rgba(255,255,255,.6); }
.s-website .wh b { display:block; font-size:17px; }
.s-website .wh small { font-size:12.5px; opacity:.9; display:flex; align-items:center; gap:6px; }
.s-website .wh small i { width:7px; height:7px; border-radius:50%; background:#4ade80; }
.s-website .wh .cl { margin-left:auto; font-size:22px; opacity:.85; }
.s-website .msgs { flex:1; display:flex; flex-direction:column; justify-content:flex-end; padding:0 16px 10px; overflow:hidden; background:#faf8fb; gap:0; }
.s-website .m { overflow:hidden; flex:none; }
.s-website .msgs { -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 26px); mask-image: linear-gradient(180deg, transparent 0, #000 26px); }
.s-website .day { flex:none; text-align:center; font-size:12px; font-weight:600; color:#a39aa8; padding:14px 0 2px; }
.s-website .sug { display:flex; flex-wrap:wrap; gap:7px; margin:10px 0 0 34px; }
.s-website .sug span { padding:6px 12px; border-radius:999px; border:1px solid #e2b7cf; color:#AC246E; font-size:13px; font-weight:600; background:#fff; }
.s-website .m > div { padding-top:12px; }
.s-website .bot { display:flex; gap:8px; align-items:flex-end; }
.s-website .bot .lm { width:26px; height:26px; border-radius:50%; } .s-website .bot .lm i { width:9px; height:9px; border-width:2px; box-shadow:none; }
.s-website .bb { background:#fff; border:1px solid #ece8ee; border-radius:16px 16px 16px 4px; padding:11px 14px; font-size:15px; line-height:1.45; color:#1d1720; max-width:330px; box-shadow:0 2px 6px rgba(30,10,30,.04); }
.s-website .ub { margin-left:auto; width:fit-content; max-width:300px; background:linear-gradient(135deg,#AC246E,#c22f80); color:#fff; border-radius:16px 16px 4px 16px; padding:11px 14px; font-size:15px; font-weight:500; }
.s-website .dots { display:flex; gap:5px; padding:4px 2px; } .s-website .dots i { width:8px; height:8px; border-radius:50%; background:#c9bfcf; }
.s-website .src { display:inline-flex; align-items:center; gap:7px; margin-top:9px; padding:5px 11px 5px 7px; border-radius:999px; background:#fbeaf3; color:#AC246E; font-size:13px; font-weight:700; }
.s-website .src i { width:14px; height:17px; border-radius:2px; background:#fff; border:1.5px solid #AC246E; position:relative; }
.s-website .src i:after { content:""; position:absolute; left:2px; right:2px; top:4px; height:5px; border-top:1.5px solid #AC246E; border-bottom:1.5px solid #AC246E; }
.s-website .slots { display:flex; gap:8px; margin:10px 0 0 34px; }
.s-website .slot { padding:9px 13px; border-radius:10px; border:1.5px solid #e2b7cf; background:#fff; color:#AC246E; font-size:14.5px; font-weight:700; white-space:nowrap; }
.s-website .slot small { display:block; font-size:11px; color:#8a8190; font-weight:600; }
.s-website .in { flex:none; height:58px; border-top:1px solid #ece8ee; display:flex; align-items:center; gap:10px; padding:0 12px 0 18px; background:#fff; }
.s-website .in .tx { flex:1; font-size:15px; color:#1d1720; white-space:nowrap; overflow:hidden; display:flex; align-items:center; }
.s-website .in .tx.ph { color:#a39aa8; }
.s-website .in .car { width:2px; height:19px; background:#AC246E; margin-left:1px; }
.s-website .in .send { width:38px; height:38px; border-radius:10px; background:#AC246E; color:#fff; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:18px; }
.s-website .ft { flex:none; height:28px; display:flex; align-items:center; justify-content:center; gap:6px; font-size:12px; color:#8a8190; background:#fff; }
.s-website .ft img { width:14px; height:14px; } .s-website .ft b { color:#4a4250; }
.s-website .cur { position:absolute; left:0; top:0; opacity:0; filter:drop-shadow(0 3px 4px rgba(0,0,0,.35)); z-index:10; }
`;

const pos = (el, root) => { let x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x, y }; };

export default {
  build(root, ctx) {
    const lanes = LANES.map((n, i) => `<div class="lane"><span>${n}</span><svg viewBox="0 0 560 30" preserveAspectRatio="none"><path d="${wave(i, 560, 30)}" fill="none" stroke="${["#67e8f9", "#a5b4fc", "#a5b4fc", "#f0abfc", "#4ade80"][i]}" stroke-width="2"/></svg></div>`).join("");
    root.innerHTML = `<style>${CSS}</style>
    <div class="browser" style="left:${BX}px;top:${BY}px;width:${BW}px;height:${BH}px">
      <div class="bar"><i></i><i></i><i></i><div class="url"><b>🔒</b>lumeneda.com/ai-studio</div></div>
      <div class="page">
        <div class="nav"><span class="brand">${MARK}Lumen EDA</span><span>Products</span><span>Solutions</span><span>Aerospace</span><span>Pricing</span><span>Resources</span><span class="sp"></span><span>Sign in</span><span class="cs">Contact sales</span></div>
        <div class="hero"><div class="grid"></div>
          <div class="copy"><div class="kick">LUMEN AI STUDIO</div><h1>Verify flight-grade silicon in <em>weeks, not months.</em></h1>
            <p>AI-driven formal, simulation and emulation in one workspace. Built for DO-254 and safety-critical teams.</p>
            <div class="ctas"><span class="a">Start free trial</span><span class="b">▶ Watch demo</span></div></div>
          <div class="vis"><div class="vt"><b>avionics_ctrl.sv</b>· emulation run #2,184<span class="ok">● 0 open bugs</span></div>${lanes}
            <div class="cursorline" style="left:420px"></div></div>
          <div class="stat" style="left:660px;top:380px">Coverage<b>98.7%<em>▲ 4.1</em></b></div>
          <div class="stat" style="left:1240px;top:30px">Bugs caught pre-silicon<b>14</b></div>
        </div>
        <div class="below"><div class="trust">TRUSTED BY FLIGHT AND SPACE PROGRAMS</div>
          <div class="logos"><span>NORTHWIND</span><span>KESTREL</span><span>ORBITAL ONE</span><span>HELIX</span><span>VANTA AERO</span></div>
          <div class="feats"><div><b>Formal + emulation</b>One flow, one coverage model.</div><div><b>DO-254 ready</b>Audit trails out of the box.</div></div></div>
        <div class="dim"></div>
        <div class="form"><div class="fc"><h3>Contact sales</h3><div class="sub">Fill in the form and we will get back to you in 2 to 3 business days.</div>
          <div class="fr"><div class="f"><label>First name</label><div><div class="caret"></div></div></div><div class="f"><label>Last name</label><div></div></div></div>
          <div class="fr"><div class="f"><label>Work email</label><div></div></div></div>
          <div class="fr"><div class="f"><label>Company</label><div></div></div><div class="f"><label>Job title</label><div></div></div></div>
          <div class="fr"><div class="f tall"><label>How can we help?</label><div></div></div></div>
          <div class="sb">Submit request</div></div>
          <svg class="x" width="544" height="100%" viewBox="0 0 544 560" preserveAspectRatio="none"><line class="l1" x1="30" y1="30" x2="514" y2="530"/><line class="l2" x1="514" y1="30" x2="30" y2="530"/></svg>
          <div class="noform">No forms. Just ask.</div>
        </div>
        <div class="teaser">Questions about pricing? Just ask.</div>
        <div class="launch"><i></i></div>
        <div class="wdg">
          <div class="wh">${MARK}<div><b>Lumen Assistant</b><small><i></i>Online · answers instantly</small></div><span class="cl">×</span></div>
          <div class="msgs"><div class="day">Today · 2:14 PM</div>
            <div class="m g"><div><div class="bot">${MARK}<div class="bb">Hi! I'm the Lumen Assistant. Ask me anything about Lumen AI Studio.</div></div><div class="sug"><span>Emulation pricing</span><span>DO-254 support</span><span>Book a demo</span></div></div></div>
            <div class="m u"><div><div class="ub">${Q}</div></div></div>
            <div class="m a"><div><div class="bot">${MARK}<div class="bb"><div class="dots"><i></i><i></i><i></i></div><span class="txt"></span><div><span class="src"><i></i>Lumen pricing guide</span></div></div></div></div></div>
            <div class="m o"><div><div class="bot">${MARK}<div class="bb">Want to talk it through with an engineer? I can book 20 minutes.</div></div>
              <div class="slots"><span class="slot"><small>Thu, Oct 16</small>10:00</span><span class="slot"><small>Thu, Oct 16</small>14:30</span><span class="slot"><small>Fri, Oct 17</small>11:00</span></div></div></div>
          </div>
          <div class="in"><span class="tx"></span><span class="send">↑</span></div>
          <div class="ft"><img src="assets/logo.png">Powered by <b>Acme</b></div>
        </div>
      </div>
    </div>
    <div class="cur">${CURSOR}</div>`;
    const q = (s) => root.querySelector(s);
    this.el = {
      dim: q(".dim"), form: q(".form"), fc: q(".fc"), l1: q(".x .l1"), l2: q(".x .l2"), noform: q(".noform"), caret: q(".form .caret"),
      wdg: q(".wdg"), launch: q(".launch"), teaser: q(".teaser"),
      u: q(".m.u"), a: q(".m.a"), o: q(".m.o"), dots: q(".dots"), txt: q(".txt"), src: q(".src"),
      slots: [...root.querySelectorAll(".slot")], tx: q(".in .tx"), send: q(".in .send"), cur: q(".cur"), cline: q(".cursorline"),
    };
    const L = ctx.line, at = (w, k = 0) => ctx.at((L.indexOf(w) + k) / L.length);
    this.T = { form: at("form"), ask: at("ask"), answers: at("answers"), content: at("content"), meeting: at("offers") };
  },

  render(root, lt, ctx) {
    const E = this.el, T = this.T;
    const P = lt < 0; // poster: open widget showing the question
    // --- the sales form: appears, gets crossed out on "form", falls away ---
    const fIn = io(lt, 1.3, 1.8), fOut = io(lt, T.form + .55, T.form + .95, ease.inOut);
    const fv = P ? 0 : fIn * (1 - fOut);
    S(E.dim, { opacity: fv });
    S(E.form, { opacity: fv, display: fv > 0 ? "block" : "none", transform: `translateY(${(1 - fIn) * 30 + fOut * 60}px) scale(${1 - fOut * .05})` });
    const gr = prog(lt, T.form - .2, T.form + .1);
    S(E.fc, { filter: `grayscale(${gr})`, opacity: 1 - .45 * gr });
    S(E.caret, { opacity: Math.floor(lt * 2.5) % 2 ? 0 : 1 });
    const d1 = io(lt, T.form - .15, T.form + .1), d2 = io(lt, T.form + .02, T.form + .27);
    const len = Math.hypot(484, 500);
    E.l1.style.strokeDasharray = len; E.l1.style.strokeDashoffset = len * (1 - d1);
    E.l2.style.strokeDasharray = len; E.l2.style.strokeDashoffset = len * (1 - d2);
    S(E.noform, { opacity: io(lt, T.form + .15, T.form + .35), transform: `translate(-50%,-50%) scale(${.7 + .3 * io(lt, T.form + .15, T.form + .45, ease.back)})` });

    // --- widget: open in the poster, closed while flying in, opens on "They just ask" ---
    const open = P ? 1 : Math.max(1 - io(lt, .1, .6), io(lt, T.ask - .55, T.ask - .05, ease.back));
    S(E.wdg, { opacity: clamp(open * 1.6), transform: `scale(${.4 + .6 * open})`, visibility: open < .01 ? "hidden" : "visible" });
    S(E.launch, { opacity: 1 - clamp(open * 2), transform: `scale(${1 + .08 * Math.sin(lt * 5) * vis(lt, 1, T.ask - .5)})` });
    S(E.teaser, { opacity: (1 - clamp(open * 2)) * vis(lt, .9, T.ask - .5, .3) * (1 - fv) });

    // --- conversation ---
    const typeA = T.ask, cps = 34, typeEnd = typeA + Q.length / cps, sent = typeEnd + .15;
    const tq = P ? Q : typed(Q, lt, typeA, cps);
    const showTyped = !P && lt >= typeA - .3 && lt < sent;
    E.tx.className = "tx" + (showTyped && tq ? "" : " ph");
    E.tx.innerHTML = showTyped ? `${tq}<span class="car" style="opacity:${Math.floor(lt * 3) % 2 && tq.length === Q.length ? 0 : 1}"></span>` : "Ask about Lumen AI Studio…";
    S(E.send, { transform: `scale(${1 - .12 * vis(lt, sent - .1, sent + .1, .08)})` });

    const grow = (el, p) => {
      if (p <= 0) { el.style.display = "none"; return; }
      el.style.display = "block";
      const h = el.firstElementChild.offsetHeight;
      const e = ease.out(p);
      S(el, { height: p >= 1 ? "auto" : h * e + "px", opacity: clamp(p * 1.5) });
      S(el.firstElementChild, { transform: `translateY(${(1 - e) * 14}px)` });
    };
    grow(E.u, P || lt < .6 ? 1 : prog(lt, sent, sent + .35));
    const aStart = sent + .4, streamA = Math.max(T.answers, aStart + .55), streamB = T.content + .1;
    grow(E.a, P ? 0 : prog(lt, aStart, aStart + .3));
    const words = ANS.split(" "), k = Math.floor(words.length * prog(lt, streamA, streamB));
    S(E.dots, { display: k === 0 ? "flex" : "none" });
    [...E.dots.children].forEach((d, i) => S(d, { transform: `translateY(${-4 * Math.max(0, Math.sin(lt * 9 - i * .9))}px)` }));
    E.txt.textContent = words.slice(0, k).join(" ");
    const srcP = io(lt, streamB, streamB + .35, ease.back);
    S(E.src.parentElement, { display: lt >= streamB ? "block" : "none" });
    S(E.src, { opacity: clamp(srcP * 2), transform: `scale(${.7 + .3 * srcP})` });
    const oA = T.meeting - .25;
    grow(E.o, P ? 0 : prog(lt, oA, oA + .4));
    E.slots.forEach((s, i) => S(s, { opacity: io(lt, oA + .35 + i * .12, oA + .6 + i * .12), transform: `translateY(${(1 - io(lt, oA + .35 + i * .12, oA + .7 + i * .12, ease.back)) * 10}px)` }));

    // --- cursor drifts to the Thu 14:30 slot and hovers ---
    const hv = io(lt, oA + 1.45, oA + 1.7);
    const slot = E.slots[1];
    slot.style.background = hv > 0 ? `rgba(172,36,110,${hv})` : "#fff";
    slot.style.color = hv > .5 ? "#fff" : "#AC246E";
    slot.querySelector("small").style.color = hv > .5 ? "rgba(255,255,255,.8)" : "#8a8190";
    slot.style.boxShadow = hv > 0 ? `0 8px 22px rgba(172,36,110,${.4 * hv})` : "none";
    if (!P && lt > oA + .6) {
      const p = pos(slot, root), tx = p.x + slot.offsetWidth * .72, ty = p.y + slot.offsetHeight * .78;
      const m = io(lt, oA + .7, oA + 1.6, ease.inOut);
      S(E.cur, { opacity: prog(lt, oA + .7, oA + 1.0), transform: `translate(${lerp(tx - 260, tx, m)}px, ${lerp(ty + 40, ty, m) + Math.sin(lt * 2) * 1.5 * hv}px)` });
    } else S(E.cur, { opacity: 0 });

    // product visual: emulation cursor sweeps the waveform
    S(E.cline, { left: 112 + ((lt < 0 ? 3 : lt) * 60) % 560 + "px" });
  },

  cam(lt, ctx) {
    const T = this.T, oA = T.meeting - .25;
    const [x, y, w] = KF(lt, [
      [1.6, -180, -41, 1960],
      [T.ask - .6, -180, -41, 1960],
      [T.ask + .7, 318, 232, 1250],
      [oA + 2.0, 318, 232, 1250],
      [Math.min(ctx.dur, oA + 3.8), 96, 140, 1460],
    ]);
    return { x, y, w };
  },
};
