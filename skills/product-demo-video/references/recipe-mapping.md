# From recipe to project

The builder (`builder/index.html`) copies a recipe like this:

```json
{ "recipe": {
    "format": "formats/canvas-flow", "look": "looks/clinical-calm", "length": "length/120", "aspect": "aspect/16x9",
    "pace": "pace/standard", "opener": "intros/logo-mask", "blocks": ["blocks/split-values", "blocks/stack-3d"],
    "transitions": ["transitions/camera-fly", "transitions/zoom-through"], "captions": "captions/subtitle-pill",
    "background": "background/grid", "device": "device/laptop", "cursor": "cursor/macos", "progress": "progress/top-bar",
    "frame": "frame/logo-bug", "voice": "voice/en-US-AvaMultilingualNeural", "music": "music/none", "sfx": [], "ending": "intros/end-cta" },
  "note": "anything the person typed in the note box" }
```

Each value is `<section>/<option id>`. A missing category means "you choose". Read the note; it can override any pick.

Each pick lands in one or more of four places:

- **script.json**: fields the engine and `mix.py` read.
- **theme.css**: a token block appended at the end.
- **STEP_CONTRACT.md**: the "This video's recipe" section, which every step agent reads.
- **Agent briefs**: what a single step must build.

"Not native" means the engine does not draw it. A step agent builds it inside its own scene, or it is a follow-up for the engine. Say so to the person when you use one.

## When the person does not choose

Pick one coherent set yourself. Vary it a little between runs, but stay inside what fits:

| Domain | Look | Voice | Background |
|---|---|---|---|
| Healthcare, care, wellbeing | clinical-calm or warm-editorial | Ava, or Sonia | grid or paper |
| B2B SaaS, sales, ops | clean-light or dark-glow | Ava, or Andrew | grid or particles |
| Developer tools, infra, data | oled-mono, dark-glow or blueprint | Brian or Andrew | particles, grid or plain |
| Fintech | clean-light or glass-gradient | Ava, or Christopher | plain or gradient |
| Consumer apps | glass-gradient, bold-color or neo-brutal | Emma or Ava | gradient or plain |

Then:

- **Format:** canvas-flow for "how it works end to end"; feature-tour for a list of features; case-story for one real-world case.
- **Blocks:** 2 or 3 that fit the story. Skip any that would need data the product does not have.
- **Transitions:** 1 or 2. camera-fly comes with canvas-flow; add zoom-through or mask-wipe.
- **The rest:** 16:9, standard pace, subtitle-pill captions, macOS cursor, and `voice/en-US-AvaMultilingualNeural` when unsure. Length 60 to 90 seconds. For a light look, use a light background (grid, paper or plain), never particles. For a dark look, use particles or gradient.
- **Sound:** the generated pad (`"music": "pad"`) and `["whoosh", "hit"]`, or no music for a calm, clinical tone.

State the picks in one short list and carry on.

## format

| Option | script.json | Steps to create |
|---|---|---|
| canvas-flow | `"layout": "canvas"`, `"columns": 3` or `4` | an opener, an `overview` step, one `node` per moment, closing `scene`s |
| feature-tour | `"layout": "sequence"`, `"progress": "pill"` | one `node` or `scene` per feature |
| kinetic-promo | `"layout": "sequence"` | mostly `scene`s of big type with short product flashes. Use energetic pace. |
| device-showcase | `"layout": "sequence"` | one long `scene` with a laptop and a phone in CSS 3D (see `example-scene-css3d.js`); its screens change per beat |
| before-after | `"layout": "sequence"` | `scene`s with a sweeping divider between the old way and the new way |
| deep-zoom | `"layout": "canvas"`, `"columns": 1` | one detailed screen, drawn again by each `node` step. Each step uses `"transition": "zoom"` with `zoomInto` on the part it names. |
| cursor-walkthrough | `"layout": "sequence"` | `node`s driven by the kit cursor, with zoom-ins on each click. Or a real screen recording (`styles.md`). |
| bento-reel | `"layout": "sequence"` | one `scene` with a tile grid; each tile plays its own small animation in turn |
| stats-impact | `"layout": "sequence"` | `scene`s with counters and a growing chart (kpi-counters, stat-dotgrid blocks). Only approved numbers. |
| day-in-life | `"layout": "sequence"` | `scene`s that share an hour timeline from the kit; one moment of the day per scene |
| chat-first | `"layout": "canvas"` or `"sequence"` | `node`s built around one chat UI; results appear inside the chat |
| stack-explainer | `"layout": "sequence"` | one `scene` with the stack-3d block, plus a few `node`s for the layers |
| whats-new | `"layout": "sequence"`, `"progress": "pill"` | a title `scene`, one numbered `node` per feature, a version-number end card |
| vertical-teaser | not native (see aspect) | short `scene`s with big captions |
| terminal-demo | `"layout": "sequence"` | `node`s with a terminal mock; then code beside the live result |
| data-story | `"layout": "sequence"` | `scene`s where one chart builds step by step, and a headline lands the point |
| case-story | `"layout": "sequence"` | `scene`s with a timestamp per scene, frame furniture, and the blocks doc-highlight, workflow-build, worklist-arrival, time-skip and statement-card |

## look

Append the look's block to the end of `theme.css`. Then put the product's own brand colours over `--accent`, `--accent-2` and `--accent-3` if it has them. The look sets the mood; the brand sets the colour. Put the look's surfaces, radius, shadows and motion into the recipe section of STEP_CONTRACT.md in words, the way the Tidy example does.

On a light look, the engine's built-in intro and outro text is white and will not show. Build the opener and the end card as `scene` steps instead.

**dark-glow** (dark):
```css
:root {
  --accent: #3b82f6; --accent-2: #60a5fa; --accent-3: #22d3ee; --accent-soft: #e6f0ff;
  --chrome: #11131a; --chrome-2: #0e1016; --night: #0b0b0f;
  --glow-a: #3b82f6; --glow-b: #22d3ee; --particles: #3b82f6,#22d3ee,#93c5fd,#ffffff;
  --font: -apple-system, "SF Pro Text", system-ui, sans-serif;
}
.grad { background: linear-gradient(90deg, #60a5fa, #22d3ee); -webkit-background-clip: text; background-clip: text; color: transparent; }
```

**clean-light** (light):
```css
:root {
  --accent: #0071e3; --accent-2: #2b8cff; --accent-3: #111114; --accent-soft: #e8f1fd;
  --chrome: #f5f5f7; --chrome-2: #ffffff; --night: #f5f5f7;
  --glow-a: #0071e3; --glow-b: #2b8cff; --particles: #0071e3,#2b8cff,#c7d7ee,#ffffff;
  --ink: #111114; --ink-2: #3a3a40; --muted: #86868b; --line: #ececf0; --page: #fafafa;
  --font: -apple-system, "SF Pro Display", system-ui, sans-serif;
  --label-ink: #111114; --frame-border: #e6e6ea; --frame-shadow: 0 50px 110px -40px rgba(0, 0, 0, .28);
  --cap-ink: #111114; --cap-bg: rgba(255, 255, 255, .94); --cap-shadow: 0 12px 30px -12px rgba(0, 0, 0, .25);
  --hud-ink: #111114; --hud-bg: rgba(255, 255, 255, .9); --vignette: rgba(0, 0, 0, .05);
  --grid-dot: rgba(0, 0, 0, .12); --grid-line: rgba(0, 0, 0, .04); --path-base: rgba(0, 0, 0, .10);
  --pbar-track: rgba(0, 0, 0, .06); --flash: #ffffff;
}
.grad { background: linear-gradient(90deg, #0071e3, #2b8cff); -webkit-background-clip: text; background-clip: text; color: transparent; }
```

**editorial** (light, use background paper):
```css
:root {
  --accent: #a8402b; --accent-2: #c4593f; --accent-3: #1d1a16; --accent-soft: #f3e1d9;
  --chrome: #ebe2d3; --chrome-2: #faf6ee; --night: #f3ece0;
  --glow-a: #a8402b; --glow-b: #1d1a16; --particles: #a8402b,#1d1a16,#d8c7ad,#ffffff;
  --ink: #1d1a16; --ink-2: #4a433a; --muted: #8a7f70; --line: #d9cfbf; --paper: #fffdf8; --page: #faf6ee;
  --font: Georgia, "Times New Roman", serif;
  --label-ink: #1d1a16; --frame-border: #d9cfbf; --frame-shadow: 0 40px 90px -40px rgba(60, 40, 20, .30);
  --cap-ink: #1d1a16; --cap-bg: rgba(255, 253, 248, .94); --cap-shadow: 0 10px 26px -12px rgba(60, 40, 20, .30);
  --hud-ink: #1d1a16; --hud-bg: rgba(255, 253, 248, .9); --vignette: rgba(60, 40, 20, .08);
  --grid-dot: rgba(29, 26, 22, .14); --grid-line: rgba(29, 26, 22, .05); --path-base: rgba(29, 26, 22, .14);
  --paper-edge: rgba(120, 90, 60, .14); --pbar-track: rgba(29, 26, 22, .08); --flash: #fffdf8;
}
.grad { color: #a8402b; font-style: italic; }
```

**oled-mono** (dark):
```css
:root {
  --accent: #38bdf8; --accent-2: #7dd3fc; --accent-3: #ffffff; --accent-soft: #0c1a22;
  --chrome: #000000; --chrome-2: #000000; --night: #000000;
  --glow-a: #ffffff; --glow-b: #38bdf8; --particles: #ffffff,#d4d4d8,#38bdf8,#ffffff;
  --ink: #ffffff; --ink-2: #d4d4d8; --muted: #71717a; --line: rgba(255, 255, 255, .18); --paper: #000000; --page: #050505;
  --font: -apple-system, "Helvetica Neue", system-ui, sans-serif;
  --frame-border: rgba(255, 255, 255, .35); --frame-shadow: none; --path-base: rgba(255, 255, 255, .22);
}
.grad { color: #ffffff; }
```

**glass-gradient** (colour, use background gradient; steps add `backdrop-filter: blur(16px)` to their cards):
```css
:root {
  --accent: #1d4ed8; --accent-2: #ffffff; --accent-3: #ff7a6b; --accent-soft: #e0ebff;
  --chrome: rgba(255, 255, 255, .18); --chrome-2: rgba(255, 255, 255, .22); --night: #2f7fe0;
  --glow-a: #ffb35c; --glow-b: #2dd4bf; --particles: #ff7a6b,#2dd4bf,#ffb35c,#ffffff;
  --font: -apple-system, system-ui, sans-serif;
  --label-ink: #ffffff; --frame-border: rgba(255, 255, 255, .45); --frame-shadow: 0 40px 90px -30px rgba(10, 40, 110, .55);
  --cap-ink: #ffffff; --cap-bg: rgba(10, 30, 90, .45); --hud-ink: #ffffff; --hud-bg: rgba(255, 255, 255, .2);
  --vignette: rgba(10, 30, 90, .25); --path-base: rgba(255, 255, 255, .35); --pbar-track: rgba(255, 255, 255, .25);
}
.grad { background: linear-gradient(90deg, #ffd9c2, #ffffff); -webkit-background-clip: text; background-clip: text; color: transparent; }
```

**blueprint** (dark blue, use background grid; steps draw UI as white outlines):
```css
:root {
  --accent: #9fd0ff; --accent-2: #ffffff; --accent-3: #5aa9e6; --accent-soft: rgba(255, 255, 255, .10);
  --chrome: #0f3270; --chrome-2: #14408a; --night: #123a80;
  --glow-a: #9fd0ff; --glow-b: #ffffff; --particles: #9fd0ff,#ffffff,#5aa9e6,#ffffff;
  --ink: #ffffff; --ink-2: #cfe3ff; --muted: #8fb3e6; --line: rgba(255, 255, 255, .35); --paper: #14408a; --page: #123a80;
  --font: "SF Mono", Menlo, Consolas, monospace;
  --frame-border: rgba(255, 255, 255, .8); --frame-shadow: none;
  --grid-dot: rgba(255, 255, 255, .22); --grid-line: rgba(255, 255, 255, .08); --path-base: rgba(255, 255, 255, .3);
  --cap-bg: rgba(8, 30, 70, .8); --hud-bg: rgba(8, 30, 70, .8); --pbar-track: rgba(255, 255, 255, .12);
}
.grad { color: #9fd0ff; }
```

**clinical-calm** (light, use background grid or plain):
```css
:root {
  --accent: #14a39a; --accent-2: #3b8fe0; --accent-3: #6cc8bf; --accent-soft: #e3f5f3;
  --chrome: #f1f7f7; --chrome-2: #ffffff; --night: #f3f7f7;
  --glow-a: #14a39a; --glow-b: #3b8fe0; --particles: #14a39a,#3b8fe0,#9fd9d3,#ffffff;
  --ink: #17323a; --ink-2: #44606a; --muted: #7c939a; --line: #e3eced; --page: #f7fafa;
  --font: -apple-system, "Avenir Next", "SF Pro Text", system-ui, sans-serif;
  --label-ink: #17323a; --frame-border: #e3eced; --frame-shadow: 0 50px 110px -40px rgba(23, 80, 90, .35);
  --cap-ink: #17323a; --cap-bg: rgba(255, 255, 255, .94); --cap-shadow: 0 12px 30px -12px rgba(23, 80, 90, .35);
  --hud-ink: #17323a; --hud-bg: rgba(255, 255, 255, .9); --vignette: rgba(23, 50, 58, .07);
  --grid-dot: rgba(23, 50, 58, .14); --grid-line: rgba(23, 50, 58, .045); --path-base: rgba(23, 50, 58, .10);
  --pbar-track: rgba(23, 50, 58, .07); --flash: #ffffff;
}
.grad { background: linear-gradient(90deg, #14a39a, #3b8fe0); -webkit-background-clip: text; background-clip: text; color: transparent; }
```

**neo-brutal** (light, use background plain or grid; steps use 3px black borders and hard offset shadows):
```css
:root {
  --accent: #ff5c8a; --accent-2: #5c8aff; --accent-3: #ffe14d; --accent-soft: #ffe14d;
  --chrome: #ffe14d; --chrome-2: #ffffff; --night: #f5f0e6;
  --glow-a: #ff5c8a; --glow-b: #5c8aff; --particles: #ff5c8a,#5c8aff,#ffe14d,#000000;
  --ink: #000000; --ink-2: #222222; --muted: #555555; --line: #000000; --page: #f5f0e6;
  --font: "Arial Black", "Helvetica Neue", Arial, sans-serif;
  --label-ink: #000000; --frame-border: #000000; --frame-shadow: 14px 14px 0 #000000;
  --cap-ink: #000000; --cap-bg: #ffe14d; --cap-shadow: 5px 5px 0 #000000;
  --hud-ink: #000000; --hud-bg: #ffffff; --vignette: transparent;
  --grid-dot: rgba(0, 0, 0, .25); --grid-line: rgba(0, 0, 0, .06); --path-base: rgba(0, 0, 0, .35);
  --pbar-track: rgba(0, 0, 0, .12); --flash: #ffe14d;
}
.grad { color: #ff5c8a; }
```

**bold-color** (colour, use background plain; mask-wipe scenes make the colour panels):
```css
:root {
  --accent: #111111; --accent-2: #ffd400; --accent-3: #1d4ed8; --accent-soft: #fff1c2;
  --chrome: #111111; --chrome-2: #ffffff; --night: #ff4d2e;
  --glow-a: #ffd400; --glow-b: #ffffff; --particles: #ffd400,#ffffff,#1d4ed8,#111111;
  --font: -apple-system, "Helvetica Neue", system-ui, sans-serif;
  --label-ink: #ffffff; --frame-border: #ffffff; --frame-shadow: 0 40px 90px -30px rgba(80, 10, 0, .45);
  --cap-ink: #ffffff; --cap-bg: rgba(17, 17, 17, .85); --hud-ink: #ffffff; --hud-bg: rgba(17, 17, 17, .85);
  --vignette: rgba(0, 0, 0, .15); --path-base: rgba(255, 255, 255, .4); --pbar-track: rgba(0, 0, 0, .15);
}
.grad { color: #ffd400; }
```

**warm-editorial** (light, use background paper; pairs with `intros/frame-furniture`):
```css
:root {
  --accent: #d9573b; --accent-2: #2f4f8f; --accent-3: #3f8f6b; --accent-soft: #f7e3dc;
  --chrome: #ece5de; --chrome-2: #ffffff; --night: #f6f1ec;
  --glow-a: #d9573b; --glow-b: #2f4f8f; --particles: #d9573b,#2f4f8f,#c9d3e6,#ffffff;
  --ink: #22242e; --ink-2: #5b5550; --muted: #a3978d; --line: #ece5de; --page: #fbf8f5;
  --font: -apple-system, "SF Pro Text", system-ui, sans-serif; --mono: "SF Mono", Menlo, monospace;
  --label-ink: #22242e; --frame-border: #ece5de; --frame-shadow: 0 40px 100px -40px rgba(60, 40, 20, .30);
  --cap-ink: #22242e; --cap-bg: rgba(255, 255, 255, .92); --cap-shadow: 0 10px 26px -12px rgba(60, 40, 20, .30);
  --hud-ink: #22242e; --hud-bg: rgba(255, 255, 255, .9); --vignette: rgba(60, 40, 20, .08);
  --grid-dot: rgba(34, 36, 46, .12); --grid-line: rgba(34, 36, 46, .04); --path-base: rgba(34, 36, 46, .12);
  --paper-edge: rgba(120, 90, 60, .14); --pbar-track: rgba(34, 36, 46, .07); --flash: #ffffff;
}
.grad { color: #d9573b; }
```

## length

Aim for about 9 to 12 seconds per step. Check the total that `vo.py` prints.

| Option | Target total | Steps, opener and end included |
|---|---|---|
| 15 | 13–17 s | 2–3: a hook, one moment, the end card. No overview. |
| 30 | 27–33 s | 3–4 |
| 60 | 55–65 s | 5–7 |
| 90 | 80–95 s | 7–9 |
| 120 | 105–125 s | 9–12 |

## aspect

- **16x9**: native. The engine renders 1920×1080.
- **9x16, 1x1, all**: not native yet. Render the 16:9 master and say so. For a rough social cut, crop it with ffmpeg (`crop=608:1080` for 9:16, `crop=1080:1080` for 1:1) and warn that captions and content may fall outside the crop. A real vertical layout is a follow-up for the engine.

## pace

Pace sets each step's `"extra"` hold seconds and the motion the agents use.

- **calm**: `"extra"` of 3 to 4.5 per step. Slow, eased moves and long holds. Say "calm and slow" in the recipe notes.
- **standard**: `"extra"` of 2 to 3.5. The Tidy example used 1.8 to 3.6.
- **energetic**: `"extra"` of 0.5 to 1.5, shorter voice lines, `"fly": 1.1` in script.json for quicker camera flights. Tell agents: quick punch-ins, snappy entrances.

## opener

| Option | How |
|---|---|
| particle-logo | native: a `kind: "intro"` step with `"intro": { "headline", "sub" }` in script.json. Dark looks only, because the text is white. |
| typewriter-hook, question-hook, stat-hook, cold-open, logo-mask, introducing | a `scene` step called `opener`, built by a step agent. Give the brief the exact words and the beats. For logo-mask: a shape grows from the centre to reveal the product, then shrinks into the logo. |

## blocks

Each block is a step (or part of one) that a step agent builds. Put it in the brief by name, with the block's description from the builder and the real content to show.

| Option | Kind | Notes for the brief |
|---|---|---|
| doc-highlight | node or scene | a report types in line by line; key phrases light up as typed |
| workflow-build | node or scene | steps appear left to right, connectors draw, then it branches |
| worklist-arrival | node | a quiet list; a new row slides in with a NEW tag |
| time-skip | scene | months tick past; one card stays still in the middle |
| statement-card | scene | one big serif statement, one word in the accent colour |
| stat-dotgrid | scene | a number counts up beside dots that change colour in a wave. Approved numbers only. |
| doc-to-rules | node | a document on the left; its lines draw connectors to rule cards on the right |
| orbit-ecosystem | scene | the product in the middle, connected systems on rings (`example-scene-threejs.js` for depth) |
| split-values | scene | two short statements side by side, a divider slides in between |
| chat-widget | node | a website chat widget conversation (`example-step-website.js`) |
| alert-stack | node or scene | one alert lands in three apps in turn |
| queue-resort | node | rows get scores, then glide into order |
| kpi-counters | scene | 3 or 4 tiles count up with sparklines. Approved numbers only. |
| stack-3d | scene | a flat diagram tilts into 3D layers (`example-scene-css3d.js`) |
| map-or-body | node or scene | numbered hotspots on an outline figure, each linked to a list row |

## transitions

Pick 1 or 2.

| Option | How |
|---|---|
| camera-fly | native: the camera flies between `node` steps in `"layout": "canvas"`. In `"sequence"` the camera slides instead. |
| zoom-through | native: `"transition": "zoom"` on a `node` step whose previous step is also a `node`. `"zoomFrom": [x, y]` is the point in the previous card (1600×900 card px) to dive into. `"zoomInto": [x, y]` is where the new card opens from. Use it on 1 to 3 chosen steps, not all. |
| mask-wipe | native: `"enter": "wipe"` on a `scene` step, with `"wipeFrom": [x, y]` in screen px (where the circle starts, e.g. the button just pressed). |
| crossfade | native for scenes: a scene without `"enter"` fades in. |
| push-slide, whip-pan, shared-morph, flip-3d, beat-cut, stack-shuffle, focus-pull | not native. A step agent animates its own entrance from `lt` near 0 inside one scene. Use them only inside a scene, or treat them as a follow-up. |

## captions

| Option | How |
|---|---|
| subtitle-pill | native: the engine's caption pill. Its colours come from `--cap-ink`, `--cap-bg`, `--cap-shadow`. |
| minimal-line, italic-serif | close to native: restyle `#cap` in theme.css (small thin text and no box; or italic serif, no box). |
| lower-third, chapter-card, callouts, side-panel, kinetic-centre | not native. Set `"captions": false` and tell each step agent to draw its text in this style. |
| karaoke-words | not native. Word timings are not produced yet. Follow-up: `edge-tts --write-subtitles` gives word times. |

Keep the bottom 13% clear whenever the engine draws captions.

## background

| Option | script.json |
|---|---|
| particles | `"background": "particles"` (the default). Dark looks only. |
| grid | `"background": "grid"`; colours from `--grid-dot`, `--grid-line` |
| paper | `"background": "paper"`; edge from `--paper-edge` |
| plain | `"background": "plain"` |
| gradient | `"background": "gradient"`; washes from `--glow-a`, `--glow-b` |
| spotlight | not native. Use `"plain"`, and tell scene agents to add a soft pool of light behind their main screen. |

## device

| Option | Tell the agents |
|---|---|
| none | the card's own frame is enough; product screens fill it |
| browser | use the `.browser` window from theme.css |
| laptop | use `laptop()` from the shared kit (`references/kit-example.js`) |
| phone | add a `phone()` frame to the kit before starting agents (390×844 screen, rounded 48px, a notch); use it for every phone screen |

## cursor

| Option | Tell the agents |
|---|---|
| macos | use `cursor()` from the shared kit |
| dot, spotlight | not in the kit yet. Add a variant of `cursor()` to the kit before starting agents (a soft dark dot with a ring pulse; or a dimmed screen with a light circle around the cursor). |
| none | no pointer. Buttons glow and press on their own. |

## progress

| Option | script.json |
|---|---|
| step-pill | `"progress": "pill"` (the default; shows the step title, keep the top-left clear) |
| top-bar | `"progress": "bar"` (keep the top 60px calm) |
| chapter-dots | not native. Use `"none"`; a follow-up for the engine. |
| none | `"progress": "none"` |

## frame

| Option | How |
|---|---|
| none | leave out `"logoBug"` |
| logo-bug | `"logoBug": "assets/mark.png"` (a small mark, top right). `true` reuses the main logo. Keep the top-right corner calm. |
| chapter-corner | not native. Tell each step to draw its title in small caps top-left, and use `"progress": "none"` or `"bar"` so it does not clash with the pill. |
| intros/frame-furniture | not native. Add a `furniture(root, { code, note })` helper to the kit that draws the corner labels (a case code, "Dramatised · Not real data", the product name) and a mono timestamp, and tell every step to call it. |

## voice

- `voice/<id>` → `"voice": "<id>"`. The default is `en-US-AvaMultilingualNeural`. Andrew (`en-US-AndrewMultilingualNeural`) is the main male alternative.
- `voice/none` → give each step `"line": ""` and a `"min"` length in seconds, so `vo.py` still makes a timeline. On-screen text carries the story; tell agents to show the words themselves. Set `"captions": false`.

## music

- `music/none` → `"music": null`.
- `music/<id>` → copy `builder/audio/music/<id>.mp3` to `assets/music.mp3` and set `"music": "assets/music.mp3"`. These beds are placeholders; tell the person to swap in a licensed track for the final cut. `"music": "pad"` is the generated pad, close to ambient-pad.

## sfx

- `[]` → `"sfx": []`.
- `sfx/whoosh` → `"whoosh"` in the list. `mix.py` also knows `"hit"`, a low hit when the logo lands; add it with whoosh unless the person chose no sound.
- `sfx/click`, `sfx/pop`, `sfx/chime`, `sfx/riser` → not native in `mix.py`. Follow-up: add events for them (clicks from the cursor click times, chime on success beats).

## ending

| Option | How |
|---|---|
| end-cta | a `scene` step called `end`: logo, tagline, web address and a pulsing button. On a dark look the engine's `outro` (with `"outro": { "tagline" }`) also works. |
| end-recap | a `scene`: a grid of small moments from the video, then they fly into the logo |
| end-loop | a `scene` that ends on the first frame of the opener. In canvas layout `"loop": true` also draws a path from the last card back to the first. |

## STEP_CONTRACT.md recipe section

Write the picks as plain notes under "This video's recipe": format, look (background, ink, accents, surfaces, radius, shadows, motion), device, cursor, pace, which steps get which transition, progress, frame label and the space to keep clear, captions, music and sound. List anything not native that agents must build themselves.

## Worked example: Tidy

Recipe: canvas-flow, clinical-calm, 120, 16x9, standard, logo-mask, blocks split-values + stack-3d + doc-to-rules, transitions camera-fly + zoom-through + mask-wipe, grid, laptop, macos, top-bar, logo-bug, William voice, music none, no sfx, end-cta.

What it became:

- **theme.css**: the clinical-calm block above, appended.
- **steps/kit.js**: laptop, app shell, task rows and the macOS cursor (now `references/kit-example.js`).
- **script.json** (lines shortened):

```json
{
 "title": "Tidy — how it works", "layout": "canvas", "columns": 4, "loop": false,
 "voice": "en-AU-WilliamMultilingualNeural", "logo": "assets/logo.png", "logoBug": "assets/mark.png",
 "background": "grid", "progress": "bar", "music": null, "sfx": [],
 "steps": [
  { "id": "opener", "kind": "scene", "line": "…Meet Tidy…", "extra": 2.5 },
  { "id": "overview", "kind": "overview", "line": "Here's how Tidy turns a messy list into a calm day.", "extra": 2.2 },
  { "id": "capture", "kind": "node", "title": "Capture in plain words", "line": "…", "extra": 3.2 },
  { "id": "plan", "kind": "node", "title": "Your day, planned", "transition": "zoom", "zoomFrom": [800, 420], "line": "…", "extra": 3.2 },
  { "id": "focus", "kind": "node", "title": "One thing at a time", "line": "…", "extra": 2.8 },
  { "id": "rules", "kind": "node", "title": "Your playbook, as rules", "line": "…", "extra": 3.6 },
  { "id": "share", "kind": "node", "title": "Work it out together", "line": "…", "extra": 2.8 },
  { "id": "remind", "kind": "node", "title": "Reminders that follow you", "transition": "zoom", "zoomFrom": [800, 450], "line": "…", "extra": 3.2 },
  { "id": "review", "kind": "node", "title": "A calm weekly review", "line": "…", "extra": 2.8 },
  { "id": "platform", "kind": "scene", "enter": "wipe", "wipeFrom": [960, 540], "line": "…", "extra": 2.6 },
  { "id": "values", "kind": "scene", "enter": "wipe", "wipeFrom": [1500, 300], "line": "Capture in seconds. Stay calm all day.", "extra": 1.8 },
  { "id": "end", "kind": "scene", "enter": "wipe", "wipeFrom": [960, 760], "line": "Tidy. Your day, sorted. Start free today.", "extra": 3.2 }
 ]
}
```

How each pick shows up:

- **logo-mask** became the `opener` scene, because the engine intro is dark-only.
- **doc-to-rules** became the `rules` node.
- **stack-3d** became the `platform` scene.
- **split-values** became the `values` scene.
- **end-cta** became the `end` scene.
- **zoom-through** went on two chosen nodes, `plan` and `remind`.
- **mask-wipe** went on the three closing scenes.
- **Length:** 12 steps came to about 2 minutes.
