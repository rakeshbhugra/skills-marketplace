# Gallery preview contract

`index.html` is a gallery of options for product demo videos. Each option is a card with a **live animated preview** that loops. A person scrolls the page, watches the previews, and picks the ones they like. The picks become starting templates for a video-making skill, so each preview must make the option obvious at a glance in 4 to 8 seconds, and look genuinely good.

## File format

Each section file (`sections/<section>.js`) is a plain script, not a module, so the page works when opened straight from disk. It adds items like this:

```js
GALLERY.add({
  section: "formats",            // formats | looks | transitions | captions | intros | blocks | pace | background | device | cursor | progress | frame
  id: "canvas-flow",              // kebab-case, unique within the section
  title: "Infinite canvas flow",  // 2 to 4 words
  desc: "All steps sit on one big canvas joined by glowing paths. The camera opens on the whole flow, then flies into each step.", // 1 to 2 plain sentences
  bestFor: ["How it works", "End-to-end flows"],  // 2 to 3 short tags
  loop: 6,                        // seconds per loop (4 to 8)
  build(el) { /* create the DOM inside el (a 480×270 box). Scope your CSS: prefix every selector with a unique class you put on a wrapper. */ },
  render(el, t) { /* set every animated style from t (0..loop). Pure function of t. */ },
});
```

The helpers are on the global `G`:
- `G.prog(t, a, b)`, `G.io(t, a, b)`, `G.vis(t, a, b)`
- `G.lerp`, `G.clamp`, `G.ease.out` / `G.ease.inOut` / `G.ease.back`
- `G.rnd(i)`, `G.typed(text, t, a, cps)`
- `G.KF(t, [[t0, ...values], ...])` for keyframes
- `G.S(el, styleObject)`

## Rules

- **Preview size:** every preview is drawn in a fixed 480×270 box and scaled to the card, so design at 480×270. Text smaller than about 10px will not read.
- **Self-contained:** no network, no images, no fonts, no libraries. Draw everything with HTML, CSS, inline SVG or a `<canvas>`. Use plain shapes for mock UI: grey bars for text, rectangles for cards, a circle for an avatar. Real words only where the words are the point (captions, titles, a headline).
- **Pure function of t:** set every animated style from `t` each frame and never rely on the previous frame. The page and its screenshot tool call `render` at any time, in any order.
- **Loops cleanly:** fade or settle near the end of the loop so the jump from `t = loop` back to `0` is not jarring.
- **Scope everything:** add a `<style>` inside your build with selectors prefixed by a wrapper class unique to the item (e.g. `.fx-canvas-flow`). Never use global selectors, ids, or `document.*` queries outside your own `el`.
- **Colours: light mode, no purple.** The page is light, so previews are light by default. Use:
  - backgrounds: `#ffffff` or `#f6f5f2`;
  - cards: `#ffffff` with a `#e5e3de` border and soft shadows;
  - ink: `#18181b`; muted: `#6b6b74`; faint bars: `#e7e5e0`;
  - accent: `#2563eb` (blue); second accent: `#0d9488` (teal); a warm highlight when needed: `#ea580c`.

  **Never use purple or violet** (no `#7c7cf5`, `#c084fc`, `#8b5cf6` or anything in that hue). A dark preview is allowed only where darkness is the point of the option (the "Dark glow" and "OLED" looks, a terminal, a cinematic opener). Those use near-black `#0b0b0f` with the blue or teal accent, never purple. A "look" item still shows its own palette, but without purple.
- **Each preview must show the difference:** a transition preview should play the transition at least twice per loop between two clearly different mock screens. A caption preview should show the caption style over a simple mock scene. A look preview should show the same simple mock (a title, a card, a small chart, a button) styled in that look.
- **Quality bar:** smooth easing, nothing popping without motion, balanced composition, clear hierarchy. It should feel like a frame from a top-tier launch video.

## Checking your work

```
node shot.mjs <category> 1,3,5     # screenshots one category with every preview frozen at those times -> shots/<category>_<t>.png
# categories: format look pace opener blocks transitions captions background device cursor progress frame ending
```

Look at the PNGs with the Read tool. The tool also prints page errors. Iterate until every card reads instantly and looks great. Check several times across the loop.

Only edit your own section files. Do not edit `index.html`, `shot.mjs` or other sections.
