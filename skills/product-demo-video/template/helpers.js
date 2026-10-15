// Pure timing helpers. Everything is a function of time, so any frame can be rendered in any order.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, a, b) => clamp((t - a) / (b - a));           // 0 before a, 1 after b
export const lerp = (a, b, x) => a + (b - a) * x;
export const ease = {
  out: (x) => 1 - Math.pow(1 - x, 3),
  inOut: (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
  expo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
};
// fade in over f seconds from a, fade out over f seconds before b
export const vis = (t, a, b, f = .4) => Math.min(prog(t, a, a + f), 1 - prog(t, b - f, b));
// eased 0..1 between a and b
export const io = (t, a, b, e = ease.out) => e(prog(t, a, b));
// deterministic noise 0..1
export const rnd = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
// typewriter: how much of `text` is visible at time t if typing starts at a with cps chars/second
export const typed = (text, t, a, cps = 40) => text.slice(0, Math.max(0, Math.floor((t - a) * cps)));
// number counting from `from` to `to` between a and b
export const count = (from, to, t, a, b) => Math.round(lerp(from, to, ease.out(prog(t, a, b))));
// keyframes: KF(t, [[t0, ...values], [t1, ...values], ...]) -> eased values (inOut between frames)
export function KF(t, frames, e = ease.inOut) {
  if (t <= frames[0][0]) return frames[0].slice(1);
  for (let i = 0; i < frames.length - 1; i++) {
    const [t0, ...a] = frames[i], [t1, ...b] = frames[i + 1];
    if (t <= t1) { const x = e((t - t0) / (t1 - t0)); return a.map((v, j) => lerp(v, b[j], x)); }
  }
  return frames[frames.length - 1].slice(1);
}
// style shortcut: S(el, {opacity: .5, transform: "..."}). Skips work when el is missing.
export const S = (el, st) => { if (el) Object.assign(el.style, st); };
// common "enter" motion: fade + rise. Returns a style object.
export const rise = (t, a, d = .6, px = 30) => { const p = ease.out(prog(t, a, a + d)); return { opacity: p, transform: `translateY(${(1 - p) * px}px)` }; };
export const pop = (t, a, d = .5) => { const p = prog(t, a, a + d); return { opacity: clamp(p * 2), transform: `scale(${.6 + .4 * ease.back(p)})` }; };
