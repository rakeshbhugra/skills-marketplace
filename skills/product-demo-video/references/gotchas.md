# Gotchas

Bugs and lessons from earlier runs, roughly in order of time lost.

## Rendering

- **ES modules need HTTP.** Chrome blocks module imports over `file://`, so serve the project folder (`python3 -m http.server`).
- **Check the port is free** before starting the server (`lsof -iTCP:<port> -sTCP:LISTEN`). Another project held 8790; its pages loaded, the engine never did, and `render is not defined` was the only clue. Set `PORT` for `still.mjs` and `render.mjs`.
- **Every animated style must be set every frame from `t`.** A style set only inside an `if (t > x)` branch stays stuck when rendering out of order. Write `opacity = prog(...)`, not `if (...) opacity = 1`.
- **`preserveDrawingBuffer: true`** on every WebGLRenderer, or screenshots come out blank.
- **Speed:** headless Chrome with GPU flags (`--use-angle=metal`) rendered 1080p at about 1.5 seconds per second of video. JPEG screenshots at quality 92 are fine.

## Layout

- **Captions with `left:50%; transform:translateX(-50%)` wrap at half the screen width.** Add `width: max-content; max-width: …`, or every caption becomes three lines.
- **Overlays in solo checks:** a full-screen scene layer stays on top unless the solo mode hides it. Solo previews then show the wrong thing.
- **Things over the content:** the progress pill and captions sit over the content. Give them a dark backing, and keep key content clear of the top-left corner and the bottom 13%.
- **Line up the end card:** the crisp logo image has to match the particle logo exactly. The engine works out both from the same `logoHeight`. If you change one, change the other.

## Particles

- **Particles waiting to enter** sit at their start positions. Hide them until they move (multiply colour by an "on" factor; with additive blending, black is invisible), or they draw a visible ring at the screen edge.
- **Sampling a logo image** for particle targets needs a light-on-transparent PNG. A dark logo on transparent gives dark particles that vanish on the dark background.

## Story and content

- **Agents invent details independently.** Write one story bible (names, numbers, prices, quotes, times) into the contract, then grep the finished steps for numbers and prices. The first run had "usage-based hours", "per seat-hour" and "per seat plus pool" in three scenes.
- **No overclaiming:** labels must match the data on screen. "#1 share of voice" over 19% vs 17% was cut.
- **Agents add features the product does not have.** Plausible extras like "Next best action", "Suggested opener" or "Suggested replies" appeared in four scenes, and the client had to point them out. Ask the person early which features are real, put the ones that are not in the contract's "Claims we must NOT make" section, and grep every step for those words before rendering.
- **Do not knock things the product also does.** One scene crossed out a contact form ("No forms. Just ask."), but the product also scores forms. Check every "instead of X" beat against the full feature list.
- **Weekdays must match dates.** Check with a quick script. "Thu, Oct 16" was a Friday in 2026, and it appeared in three places, including a calendar card.
- **Story order matters.** When the order changes, a scene can show events that have not happened yet. After the reorder, the identity scene still showed the chat question that came later. Re-read each scene against what the viewer has seen so far.
- **Real people:** do not put real, identifiable people in mock tracking or alert screens, even if the source deck does. Invent names.
- **Real screenshots with another brand's demo data** (e.g. the product's demo dataset names some company): fine for the product scene, but say so in the handover, since it will not match the made-up story.

## Agents

- **Poster states snap at lt = 0.** Agents often show the finished state for lt < 0 and jump to the start state at 0. It is mostly hidden by the fly-in blur; better is to fade between them over the first second.
- **Short gaps between beats:** when beats come under a second apart, per-beat camera pushes feel jumpy. One slow push across the step reads better.
- **Too many camera moves:** cap them at about three per step. More than that feels seasick.
