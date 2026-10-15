# Styles

Pick the one that fits the story. They mix well: a canvas explainer can end on a full-screen three.js scene, and a sequence promo can be followed by a screen recording for people who want proof.

## Canvas (`"layout": "canvas"`)

All steps are 1600×900 cards on one big dark canvas, laid out in a snake (left to right, then right to left). Glowing paths join them, and `"loop": true` closes the last card back to the first. After the intro, an `overview` step shows the whole flow zoomed out while the paths draw in. Then the camera flies along each path into the next card, with a glowing dot running ahead of it and motion blur. A progress bar shows where you are.

- **Use for:** "how it works", end-to-end flows, a deck turned into a story, anything where seeing the whole system matters.
- **Needs:** every card must look good small (its "poster" state at negative local time), because the overview shows them all at once.
- **Tune:** `columns` (cards per row), `fly` (seconds per flight, default 1.6), `pos: [x, y]` on a step to place it by hand.

## Sequence (`"layout": "sequence"`)

The same cards sit in one row, with no labels or paths. The camera slides from card to card with a small dip, so each card reads as its own full-screen scene. There is no overview step.

- **Use for:** feature tours, launch promos, short social cuts, anything told as a list of moments.
- **Tip:** if the cards should fill the screen edge to edge, give each step a `cam()` that frames the card tightly. The default framing leaves a margin.

## Full-screen scenes (`"kind": "scene"`)

Any step can be a 1920×1080 layer over everything, instead of a card: a three.js 3D moment, big kinetic type, a stats wall. The engine fades it in and out and pulls the world camera back behind it. `references/example-scene-threejs.js` is a good model: its own WebGLRenderer with a transparent background, DOM labels projected from 3D for sharp text, and everything set from `lt` each frame.

## Screen recording (separate, no engine)

Playwright drives the real running app: clicks, scrolls and typing, with an injected fake cursor and click ripple. `recordVideo` captures it. It is the most honest demo but has the least polish. See `references/capturing-real-screens.md` for the cursor script and the grey-strip crop. Voice it the same way: write the lines, run edge-tts, and mix with ffmpeg at the right times.

## Promo with real screenshots (cards only)

The simplest high-quality option when the app can be captured: each card is a real screenshot inside a browser frame. The camera keyframes zoom and pan across it, highlight rings sit on key numbers, and labels point things out. The `aeo` step from the first run worked this way.
