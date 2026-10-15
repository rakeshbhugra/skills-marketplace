// Full-screen finale: a stack of four glass layers that flies together, then the top modules light up
// and the context layer feeds all three. Three.js for the 3D, DOM labels projected each frame for crisp text.
import { clamp, prog, lerp, ease, io, rnd, S } from "../helpers.js";
import * as THREE from "three";

const SW = 14, SD = 5.2, ST = 0.26, GAP = 2.45, TH = 0.2;
const MAG = new THREE.Color("#d33a8f"), VIO = new THREE.Color("#c36bff"), PLUM = new THREE.Color("#3a1d3c");

// top -> bottom
const LAYERS = [
  { name: "Users & Teams", tint: "#d33a8f", tiles: [["AI Assistant", "Answers users in context"], ["Live Support", "Real-time human handoff"], ["Team Copilot", "Helps your team act"]], tw: 4.25, td: 3.5 },
  { name: "Context Layer", tint: "#e0559f", tiles: [["Unified Records", "Every record, enriched and linked"]], tw: 13.2, td: 3.5 },
  { name: "Agent Engineering", tint: "#a24fd0", tiles: [["Agents"], ["Evaluations"], ["Workflows"]], tw: 4.25, td: 3.5 },
  { name: "Platform Services", tint: "#7b3fae", tiles: [["Routing"], ["Alerts"], ["Analytics"], ["Knowledge Management"], ["Integration"], ["Trust & Safety"]], tw: 2.07, td: 3.5 },
];

const dot = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.3, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
})();
// glass top: soft centre sheen + faint grid
const glassTex = (() => {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 380;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(512, 150, 40, 512, 190, 620);
  gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,.12)");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 380);
  g.strokeStyle = "rgba(255,255,255,.10)"; g.lineWidth = 1;
  for (let x = 0; x <= 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 380); g.stroke(); }
  for (let y = 0; y <= 380; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
})();

// soft vertical beam: bright core, fades at the sides and ends
const beamTex = (() => {
  const c = document.createElement("canvas"); c.width = 64; c.height = 256;
  const g = c.getContext("2d"), d = g.createImageData(64, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 64; x++) {
    const u = Math.abs(x - 31.5) / 32, w = Math.pow(1 - u, 2.2) + Math.max(0, 1 - u * 9) * .8, e = Math.min(1, y / 40, (255 - y) / 40);
    const k = (y * 64 + x) * 4; d.data[k] = d.data[k + 1] = d.data[k + 2] = 255; d.data[k + 3] = 255 * Math.min(1, w) * e;
  }
  g.putImageData(d, 0, 0); return new THREE.CanvasTexture(c);
})();
const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
let R, scene, camera, layers, streams, floor, els, title;

function box(w, h, d, topMat, sideMat, edgeColor) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: edgeColor, ...add }));
  m.add(e); m.userData.edge = e; return m;
}

export default {
  build(root, ctx) {
    root.innerHTML = `<style>
      .s-platform { color: #fff; }
      .s-platform canvas { position: absolute; inset: 0; width: 1920px; height: 1080px; }
      .s-platform .ttl { position: absolute; left: 0; right: 0; top: 58px; text-align: center; font-size: 60px; font-weight: 800; letter-spacing: -2px; }
      .s-platform .ttl span { background: linear-gradient(90deg, #ff6fb5, #c36bff); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .s-platform .lab { position: absolute; left: 0; top: 0; white-space: nowrap; will-change: transform; }
      .s-platform .ly { text-align: right; transform-origin: 100% 50%; }
      .s-platform .ly .k { font-size: 13px; font-weight: 700; letter-spacing: 2.5px; color: rgba(255,255,255,.5); text-transform: uppercase; }
      .s-platform .ly .n { font-size: 24px; font-weight: 750; letter-spacing: -.3px; margin-top: 3px; }
      .s-platform .ly i { position: absolute; right: -44px; top: 50%; width: 32px; height: 2px; background: currentColor; opacity: .5; }
      .s-platform .tl { text-align: center; }
      .s-platform .tl .n { font-size: 17px; font-weight: 650; color: rgba(255,255,255,.9); }
      .s-platform .tl.hi .n { font-size: 25px; font-weight: 800; letter-spacing: -.4px; }
      .s-platform .tl .d { font-size: 15px; font-weight: 500; color: rgba(255,255,255,.62); margin-top: 3px; }
    </style>
    <canvas width="1920" height="1080"></canvas>
    <div class="ttl">One platform. <span>Four layers.</span></div>`;
    title = root.querySelector(".ttl");
    R = new THREE.WebGLRenderer({ canvas: root.querySelector("canvas"), alpha: true, antialias: true, preserveDrawingBuffer: true });
    R.setPixelRatio(1); R.setSize(1920, 1080, false); R.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(27, 1920 / 1080, 1, 200);

    floor = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: "#8a2a7a", ...add }));
    scene.add(floor);

    els = [];
    const mkLab = (cls, html) => { const d = document.createElement("div"); d.className = "lab " + cls; d.innerHTML = html; root.appendChild(d); return d; };

    layers = LAYERS.map((L, li) => {
      const tint = new THREE.Color(L.tint);
      const g = new THREE.Group(); scene.add(g);
      const top = new THREE.MeshBasicMaterial({ map: glassTex, color: tint.clone().lerp(PLUM, .55), transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide });
      const side = new THREE.MeshBasicMaterial({ color: tint.clone().lerp(PLUM, .35), transparent: true, opacity: .55, depthWrite: false });
      const slab = box(SW, ST, SD, top, side, tint.clone().lerp(new THREE.Color("#fff"), .25));
      slab.renderOrder = 10 * (4 - li); g.add(slab);
      // soft glow under each slab
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(SW * 1.25, SD * 1.6), new THREE.MeshBasicMaterial({ map: dot, color: tint, ...add, opacity: .25 }));
      halo.rotation.x = -Math.PI / 2; halo.position.y = -ST; halo.renderOrder = 10 * (4 - li) - 1; g.add(halo);

      const n = L.tiles.length, gap = (SW - .8 - n * L.tw) / Math.max(1, n - 1);
      const tiles = L.tiles.map((T, ti) => {
        const x = n === 1 ? 0 : -SW / 2 + .4 + L.tw / 2 + ti * (L.tw + gap);
        const tm = new THREE.MeshBasicMaterial({ color: tint.clone().lerp(PLUM, .5), transparent: true, opacity: .75, depthWrite: false });
        const sm = new THREE.MeshBasicMaterial({ color: tint.clone().lerp(PLUM, .2), transparent: true, opacity: .8, depthWrite: false });
        const m = box(L.tw, TH, L.td, tm, sm, tint.clone().lerp(new THREE.Color("#fff"), .45));
        m.position.set(x, ST / 2 + TH / 2 + .01, 0); m.renderOrder = 10 * (4 - li) + 2; g.add(m);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: MAG, ...add, opacity: 0 }));
        glow.position.set(x, .5, 0); glow.scale.set(L.tw * 1.9, 3.2, 1); glow.renderOrder = 100; g.add(glow);
        const lab = mkLab("tl" + (li === 0 ? " hi" : ""), `<div class="n">${T[0]}</div>${T[1] ? `<div class="d">${T[1]}</div>` : ""}`);
        if (L.tw < 3) lab.style.whiteSpace = "normal", lab.style.width = "150px";
        return { m, tm, sm, glow, lab, x };
      });
      const lab = mkLab("ly", `<div class="k">Layer ${li + 1}</div><div class="n" style="color:${li === 1 ? "#ff8cc6" : "#fff"}">${L.name}</div><i style="color:${L.tint}"></i>`);
      return { g, slab, top, side, halo, tiles, lab, tint };
    });

    // context -> top modules: beams + rising particles
    streams = layers[0].tiles.map((t, si) => {
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(.22, 1), new THREE.MeshBasicMaterial({ map: beamTex, color: "#ffd0ea", ...add, opacity: 0 }));
      const beamW = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1), new THREE.MeshBasicMaterial({ map: beamTex, color: MAG, ...add, opacity: 0 }));
      beam.renderOrder = beamW.renderOrder = 60; scene.add(beam, beamW);
      const N = 18, pos = new Float32Array(N * 3), geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pm = new THREE.PointsMaterial({ map: dot, color: "#ffc2e2", size: .32, ...add, opacity: 0 });
      const pts = new THREE.Points(geo, pm); pts.renderOrder = 61; scene.add(pts);
      return { beam, beamW, pts, pos, geo, pm, N, x: t.x, si };
    });
    // the context layer pulse ring
    layers[1].ring = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 96), new THREE.MeshBasicMaterial({ color: "#ff8cc6", ...add, opacity: 0, side: THREE.DoubleSide }));
    layers[1].ring.rotation.x = -Math.PI / 2; layers[1].ring.position.y = ST / 2 + TH + .03; layers[1].ring.renderOrder = 50;
    layers[1].g.add(layers[1].ring);
  },

  render(root, lt, ctx) {
    const at = (f) => ctx.at(f);
    // beats
    const lightT = [Math.max(at(.156) + .05, 2.05), at(.256) + .05, at(.456) + .05];
    const ctxT = at(.72);

    // camera: slow orbit + gentle push-in
    const az = lerp(-0.42, -0.16, ease.inOut(prog(lt, 0, ctx.dur))), el = lerp(.30, .40, ease.inOut(prog(lt, 0, ctx.dur)));
    const dist = lerp(36.5, 32.5, ease.out(prog(lt, 0, ctx.dur)));
    const tgt = new THREE.Vector3(0, -0.25, 0);
    camera.position.set(tgt.x + Math.sin(az) * Math.cos(el) * dist, tgt.y + Math.sin(el) * dist, tgt.z + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(tgt); camera.updateMatrixWorld();

    S(title, { opacity: io(lt, .5, 1.3), transform: `translateY(${(1 - io(lt, .5, 1.4)) * 24}px)` });

    const v = new THREE.Vector3();
    const proj = (obj, x, y, z) => { v.set(x, y, z); obj.localToWorld(v); v.project(camera); return [(v.x + 1) * 960, (1 - v.y) * 540]; };

    layers.forEach((L, li) => {
      // bottom layer lands first; each starts exploded below and swings in
      const s = .55 + (3 - li) * .18, p = ease.out(prog(lt, s, s + 1.15)), a = prog(lt, s, s + .5);
      const yRest = (1.5 - li) * GAP;
      L.g.position.set(0, yRest - (1 - p) * (7 + li * 2.4), (1 - p) * 3);
      L.g.rotation.set((1 - p) * .35, (1 - p) * (li % 2 ? .5 : -.5), 0);
      L.g.updateMatrixWorld();
      const ctxGlow = li === 1 ? io(lt, ctxT - .1, ctxT + .6) : 0;
      L.top.opacity = (.42 + .25 * ctxGlow) * a; L.side.opacity = .5 * a;
      L.top.color.copy(L.tint).lerp(PLUM, .55 - .3 * ctxGlow);
      L.halo.material.opacity = (.22 + .55 * ctxGlow) * a;
      L.slab.userData.edge.material.opacity = (.75 + .25 * ctxGlow) * a;

      L.tiles.forEach((T, ti) => {
        const lit = li === 0 ? io(lt, lightT[ti], lightT[ti] + .5) : li === 1 ? ctxGlow : 0;
        const flash = li === 0 ? Math.exp(-Math.max(0, lt - lightT[ti]) * 2.2) * (lt > lightT[ti] ? 1 : 0) : 0;
        T.tm.opacity = (.7 + .25 * lit) * a; T.sm.opacity = .8 * a;
        T.tm.color.copy(L.tint).lerp(PLUM, .5 - .35 * lit);
        T.m.userData.edge.material.opacity = (.55 + .45 * lit) * a;
        const feed = li === 0 ? io(lt, ctxT + .7 + ti * .12, ctxT + 1.2 + ti * .12) * (.75 + .25 * Math.sin(lt * 5 + ti * 2)) : 0;
        T.glow.material.opacity = (lit * .5 + flash * .6 + feed * .35) * a;
        T.glow.material.color.copy(li === 1 ? new THREE.Color("#ff6fb5") : MAG);
        const [x, y] = proj(L.g, T.x, ST / 2 + TH + .02, li === 1 ? .7 : 0);
        const lo = clamp(prog(lt, s + .55, s + 1.1));
        S(T.lab, { transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`, opacity: lo });
        T.lab.querySelector(".n").style.color = li === 0 ? `rgba(255,255,255,${.78 + .22 * lit})` : "";
        T.lab.style.textShadow = lit > 0 ? `0 0 ${18 * lit}px rgba(255,111,181,${.9 * lit})` : "none";
      });
      if (L.ring) {
        const rp = prog(lt, ctxT, ctxT + 1.4), rp2 = prog(lt, ctxT + .7, ctxT + 2.1);
        L.ring.scale.set(1 + rp * 6.5, 1 + rp * 2.4, 1);
        L.ring.material.opacity = Math.sin(Math.PI * rp) * .8 + 0 * rp2;
      }
      const [lx, ly] = proj(L.g, -SW / 2, 0, 0);
      S(L.lab, { transform: `translate(${lx - 60}px, ${ly}px) translate(-100%, -50%)`, opacity: clamp(prog(lt, s + .5, s + 1.1)) });
    });

    // flows from the context layer up into each top module
    const yA = layers[1].g.position.y + ST / 2 + TH, yB = layers[0].g.position.y - ST / 2 - .65;
    streams.forEach((F) => {
      const on = io(lt, ctxT + .15 + F.si * .12, ctxT + .8 + F.si * .12);
      const grow = io(lt, ctxT + .15 + F.si * .12, ctxT + .75 + F.si * .12, ease.inOut);
      const h = Math.max(.001, (yB - yA) * grow);
      for (const b of [F.beam, F.beamW]) {
        b.position.set(F.x, yA + h / 2, -1.45); b.scale.set(1, h, 1);
        b.quaternion.copy(camera.quaternion); // face the camera
      }
      F.beam.material.opacity = .85 * on; F.beamW.material.opacity = .45 * on;
      for (let k = 0; k < F.N; k++) {
        const f = (lt * .55 + k / F.N + rnd(k + F.si * 40) * .05) % 1;
        F.pos[k * 3] = F.x + (rnd(k * 3 + F.si) - .5) * 1.4 * (1 - f);
        F.pos[k * 3 + 1] = yA + (yB - yA) * f;
        F.pos[k * 3 + 2] = -1.45 + (rnd(k * 5 + F.si) - .5) * 1.2 * (1 - f);
      }
      F.geo.attributes.position.needsUpdate = true;
      F.pm.opacity = on;
    });

    floor.position.set(0, -1.5 * GAP - 1.2, 0); floor.scale.set(26, 9, 1);
    floor.material.opacity = .35 * io(lt, .3, 1.8);

    R.render(scene, camera);
  },
};
