// Starter step: a browser window whose headline types in, a counter, and a camera zoom.
import { prog, ease, io, typed, count, KF, S, rise } from "../helpers.js";

export default {
  build(root) {
    root.innerHTML = `<style>
      .s-hello { background: radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--accent) 30%, var(--night)), var(--night) 70%); }
      .s-hello .browser { left: 120px; top: 90px; width: 1360px; height: 720px; }
      .s-hello .page { padding: 70px 80px; background: var(--page); }
      .s-hello h2 { font-size: 64px; font-weight: 800; letter-spacing: -1.5px; color: var(--ink); min-height: 80px; }
      .s-hello .stat { margin-top: 50px; display: flex; gap: 24px; }
      .s-hello .stat .card { padding: 26px 30px; width: 300px; }
      .s-hello .stat b { display: block; font-size: 48px; color: var(--accent); }
    </style>
    <div class="browser"><div class="bar"><i></i><i></i><i></i><div class="url">app.example.com</div></div>
      <div class="page"><h2 class="h"></h2><div class="stat">
        <div class="card"><span class="muted">Visitors</span><b class="n1">0</b></div>
        <div class="card"><span class="muted">Identified</span><b class="n2">0</b></div></div></div></div>`;
  },
  render(root, lt, ctx) {
    const q = (s) => root.querySelector(s);
    const before = lt < 0;                                  // poster state: finished screen
    q(".h").textContent = before ? "Hello, world" : typed("Hello, world", lt, 1.4, 14);
    q(".n1").textContent = (before ? 12480 : count(0, 12480, lt, ctx.at(0.3), ctx.at(0.6))).toLocaleString("en-US");
    q(".n2").textContent = before ? 3140 : count(0, 3140, lt, ctx.at(0.6), ctx.at(0.9));
    root.querySelectorAll(".stat .card").forEach((c, i) => S(c, before ? { opacity: 1, transform: "none" } : rise(lt, 1.6 + i * .2)));
  },
  cam(lt) {
    const [x, y, w] = KF(lt, [[0, 800 - 980, 450 - 551 + 60, 1960], [2.2, 800 - 980, 450 - 551 + 60, 1960], [4, 150, 300, 1100], [7, 150, 300, 1100], [8.5, 800 - 980, 450 - 551 + 60, 1960]]);
    return { x, y, w };
  },
};
