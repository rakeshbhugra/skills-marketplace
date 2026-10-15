# How a step works

The video is rendered from code, one frame at a time. Each step is one moment in the story. A **card** step (`kind: "node"`) is a 1600×900 card the camera flies to. A **scene** step (`kind: "scene"`) is a full-screen 1920×1080 layer.
A voiceover line plays for each step, with captions at the bottom of the screen.

`engine.js` owns the camera, the paths between cards, the three.js background, the intro, the outro, the progress bar and captions. **You only write `steps/<id>.js`** (plus optional assets named `assets/<id>-*`).
Do not edit `engine.js`, `helpers.js`, `theme.css`, `index.html`, `timeline.json`, `script.json` or other people's steps. If you need something from them, say so in your final report.

## File format

```js
import { clamp, prog, lerp, ease, vis, io, rnd, typed, count, KF, S, rise, pop } from "../helpers.js";
import * as THREE from "three";   // only if you need it

export default {
  // Called once. root is the step's box (1600×900 for a card, 1920×1080 for a scene), class "ui s-<id>".
  // Build ALL the DOM here, and inject a <style> scoped with .s-<id>. May be async (e.g. await img.decode()).
  build(root, ctx) {},

  // Called EVERY frame with lt = seconds since this step started.
  // lt can be NEGATIVE (step not reached yet) or past ctx.dur (step finished).
  // Must be a pure function of lt: set every animated style from lt; never rely on the previous frame.
  render(root, lt, ctx) {},

  // Cards only, optional. Where the camera looks inside the card, in card pixels: { x, y, w } (height = w * 9/16).
  // Leave it out for the default: the whole card, slowly pushing in.
  cam(lt, ctx) {},
};
```

`ctx` gives you these fields:

- `dur`: step length in seconds.
- `vo`: local time the voice starts.
- `voDur`: voice length in seconds.
- `line`: the spoken line.
- `at(f)`: local time when the voice is fraction `f` through its line. Use it to land visual beats on words: estimate `f` from the character position of the word in `ctx.line`.
- `fly`: 1.6 for cards. The camera is still arriving until this time.
- `W`, `H`: the step's size in pixels.
- `THREE`: the three.js library.

The helpers in `helpers.js` are all pure functions of time:

- `prog(t, a, b)`: 0 to 1 between `a` and `b`.
- `io(t, a, b)`: eased version of `prog`.
- `vis(t, a, b)`: fades in after `a` and out before `b`.
- `typed(text, t, a, cps)`: typewriter text.
- `count(from, to, t, a, b)`: a number ticking up.
- `KF(t, frames)`: keyframes.
- `rise(t, a)` / `pop(t, a)`: entrance styles.
- `rnd(i)`: deterministic noise.

## Timing rules

- **Before the step (lt < 0)**, the card is seen small and dim (canvas overview, or neighbours in view). Show a good-looking "poster" state: the UI laid out with real content, never an empty box.
- **0 to 1.6s**: the camera is flying in. Start the main action at about lt = 1.2 to 1.6. If the poster state is the finished state, fade back to the start state while the camera flies, rather than snapping.
- Land the key beats on words with `ctx.at(f)`.
- **After `ctx.dur`**: hold the final state.
- Be deterministic: use `rnd(i)`, never `Math.random()` or `Date.now()`.

## Camera (`cam`, cards only)

- Ease between framings with `KF(lt, [[t, x, y, w], ...])`. Make the first keyframe the default framing so the fly-in lands cleanly: `{ x: 800 - w/2, y: 450 - w*9/32 + 60, w }` with `w = 1960`.
- Zooming in on a detail (w ≈ 1000 to 1300) for a few seconds, then back out, works well. Do not go below w = 800. Move the camera at most two or three times per step, and smoothly.
- Captions cover the bottom ~13% of the screen and the progress pill covers the top-left corner. Keep key content clear of both, in whatever the camera frames.

## Look and feel

- **Quality bar:** a top-tier product launch video (Linear, Stripe, Apple), in the tone the story section sets (bold for a marketing promo, calm and precise for a clinical tool). Crisp, believable UI with real-looking data, not wireframes. Generous spacing, clear hierarchy, 15 to 22px UI text inside screens, bold headings.
- **Motion:** plenty of it, but every motion means something. Staggered entrances, typing, counters ticking, a cursor that moves and clicks with a ripple, highlight rings (`.ring` in theme.css), toasts that slide in.
- **Brand:** use the tokens and classes in `theme.css` (`.card .chip .btn .avatar .app-shell .app-side .app-main .browser .ring`), and the logo and icons in `assets/`. Use colour tokens (`var(--accent)` etc.), never hardcoded brand hex values, so the video can be re-branded in one place.
- **Composition:** a card can be one app screen, or several smaller screens arranged on a dark backdrop.
- **Other apps** the user works in (chat, email, CRM, EHR, PACS viewer, terminal, calendar…): build mock screens in HTML/CSS that look like the real app at a glance (layout, colours, type). Do not use their logos as images; a coloured shape or letter mark is enough.
- **Real screenshots** in `assets/`: put them in a browser frame with overflow hidden. Pan and zoom by moving the image inside the frame, and place rings by the screenshot's own pixel coordinates (read the image first).
- **No network:** no web fonts, no CDN. Everything is local.
- **Claims:** only claim what the data on screen supports. No "#1" or "fastest" unless the numbers show it. Accuracy, outcome and regulatory claims only word for word from the story section.
- **People and records:** only the invented ones from the story section. Never real names, IDs, faces or records, and for health or finance, nothing that could be real data.

## Checking your work

A local server is already running (port in `$PORT`, default 8780). Do not stop it.

```bash
node still.mjs <id> -1,0,1.5,3,5,8     # renders your step alone at those local times -> stills/<id>_<t>.png
```

Look at the PNGs with the Read tool. The script also prints console errors. Check the poster state (-1), the fly-in (0 to 1.6), every beat, and the end. Iterate until it looks great. `ffmpeg -i a.png -i b.png -filter_complex hstack=2 x.png` puts frames side by side.

## This video's recipe (follow it)

<!-- Fill from the recipe (see references/recipe-mapping.md): format, look in words (background, ink, accents,
     surfaces, radius, shadows, motion), device frame, cursor, pace, which steps get which transition, progress
     and frame label (and the space to keep clear), captions, music and sound. Name anything the engine does not
     draw that agents must build themselves. If there is a shared kit (steps/kit.js), show its API here. -->

## The story (shared facts; use these everywhere)

<!-- Paste the story bible here: the made-up company, product, people, numbers, quotes, timeline.
     Every agent must use exactly these, so scenes agree with each other. -->

## Claims we must NOT make

<!-- List the features and wording the product does NOT have, confirmed with the person (e.g. "does not generate
     next best action, suggested openers or suggested replies"). Agents add plausible-sounding features otherwise. -->
