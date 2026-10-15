---
name: product-demo-video
description: Make a polished product demo or explainer video entirely in code — real product screens and mock app screens animated in HTML/CSS/three.js, voiceover from edge-tts, captions, music bed and whooshes, rendered frame by frame to a 1080p MP4. Use whenever someone asks for a product demo video, walkthrough video, launch video, explainer, promo, "animated demo of this feature", "turn this deck into a video", "video like the ones people make with Claude", or wants an existing demo video changed (new voice, new scene, re-cut). Works for any kind of product — B2B SaaS, clinical/healthcare, developer tools, fintech, consumer apps — from a codebase (run the app, capture its screens), a deck, or just a description.
---

# Product demo video

Everything is code. Each frame is a pure function of time: `render(t)` sets every style from `t`, headless Chrome screenshots it, ffmpeg joins the frames. Because no frame depends on the one before, you can render any second on its own, which makes checking and fixing fast.

The pieces:

- **Voice decides the timing.** You write one spoken line per step. `vo.py` voices them with edge-tts, measures each clip, and writes `timeline.json` with every step's start and length. Animations land on words using `ctx.at(fraction of the line)`.
- **An engine** (`template/engine.js`) owns the camera, the background, the intro and outro, the progress bar and captions.
- **Steps** are small modules (`steps/<id>.js`), one per moment in the story. Each builds its own UI and animates it from local time. This is where the product shows up.
- **Parallel agents** build the steps. Each agent gets one or two steps, the shared contract, and a still-frame checker, so they can look at their own output and iterate.

## Process

### 1. Understand the product and the story

Read the source material first: the codebase (its README, CLAUDE.md, docs and main screens), the deck, and any product docs. Then:

- **Name the domain** and read its notes in `references/domains.md`. A clinical tool, a sales tool and a developer tool differ in cast, tone, mock apps, data rules and claim rules.
- **Find the 6 to 10 moments** that tell the story, in order.
- **Follow one person** the product serves (a rep, a clinician, a developer, a shopper), with a real-sounding problem at the start and a result at the end.

Write a **story bible**: the made-up organisations, people, records and numbers every scene will use. Use invented names for people and companies. Never show a real, identifiable person, customer or patient, even if the source material does. Sensitive data (health, finance) must be synthetic. See `references/domains.md`. Keep one set of facts and reuse it everywhere. Scenes built by different agents drift apart otherwise (for example, two different pricing models).

List every feature the video will show, and only include features the source material confirms. Claims about accuracy, outcomes, savings or regulatory status ("FDA cleared", "SOC 2") are used only word for word from approved material. Write the ones it must not claim into the contract's "Claims we must NOT make" section. Agents add plausible features otherwise ("next best action", "suggested replies"). If the material is unclear about what the product does, ask once, up front.

Do not stop to ask the person questions you can answer from the material. The recipe question in step 2 is the exception: always ask it. Pick sensible defaults and say what you chose at the end.

### 2. Choose the recipe

Every video starts from a recipe: one pick per category (format, look, length, opener, scene blocks, transitions, captions, background, device, cursor, progress, frame label, voice, music, sound, ending). The builder shows each option as a live preview, with voice and music samples.

- **Always ask first**, before writing any project files: "Do you want to pick the recipe yourself in the builder, or should I choose?" Use AskUserQuestion with those two options. A vague request ("any app", "make a demo") is not a "surprise me"; still ask.
- If they want to pick: open it in the person's browser with `open <this skill's folder>/builder/index.html`. It works straight from disk. Ask them to pick, press "Copy recipe" and paste it back. Wait for the recipe before setting up the project; you can read the material and write the story bible meanwhile.
- If they would rather not choose, or say "just do it" or "surprise me", pick a coherent recipe yourself. Match the look and voice to the domain (clinical-calm for healthcare, for example). Use one format, 2 or 3 scene blocks that fit the story, and 1 or 2 transitions at most. State the picks in one short list and carry on without waiting.
- Once they have chosen to pick, wait for their recipe. Only use your own picks if they chose "you choose", or later tell you to go ahead without it.

`references/recipe-mapping.md` turns each pick into `script.json` fields, a `theme.css` token block, notes for STEP_CONTRACT.md and lines for the agent briefs. It also lists picks the engine does not draw yet, which step agents build themselves. The default voice is `en-US-AvaMultilingualNeural`.

### 3. The style behind each format

The recipe's format decides the style. Read `references/styles.md`. In short:

- **canvas**: all steps as cards on one big dark canvas joined by glowing paths. Opens zoomed out on the whole flow, then flies into each card. Best for "how it works end to end".
- **sequence**: full-screen scenes one after another with a camera slide. Best for a feature tour or a promo.
- **screen recording**: Playwright drives the real app with a fake cursor. The most honest option, and a good companion to either of the above.

The canvas is one option, not the default. Choose what fits the story.

### 4. Match the brand

The template ships a neutral indigo look and a placeholder "acme" logo. Replace both before building anything, because every scene reads them. Start from the recipe's look block in `references/recipe-mapping.md`, then put the brand's own colours over the accents.

- **Colours:** take them from the product itself. In priority order:
  1. An existing brand or design system. Look for a design-system doc in the repo (e.g. `docs/` or `knowledge-base/design-system.md`), a brand-book or deck skill for that company, or design tokens.
  2. CSS variables or a Tailwind config in the codebase.
  3. The colours in its real app screenshots.
  4. The logo.
  5. The deck.
- **Tokens:** set them in `theme.css` `:root`:
  - `--accent`: the main brand colour.
  - `--accent-2`: a brighter version for glows and rings on dark.
  - `--accent-3`: a second brand colour.
  - `--accent-soft`: a pale tint.
  - `--chrome`: the product's own sidebar or top-bar colour.
  - `--night`: the video background. Very dark, slightly tinted towards the brand.
  - `--glow-a` / `--glow-b`: the gradient for paths, headline text and the progress bar.
  - `--particles`: four colours for the 3D particles.
- **Logo:** a light-on-transparent PNG at `assets/logo.png`. Set `"logo"` in `script.json` to it. If the product only has a dark logo, make a white version, or the particles and end card will vanish on the dark background.
- **App chrome:** `.app-shell` / `.app-side` / `.app-top` / `.app-main` in `theme.css` give mock screens the product's own frame. Adjust their widths, colours and radius to match a real screenshot of the app.
- **Fonts:** if the product or brand system ships its font files (a `fonts/` folder, or a brand skill's assets), copy them into `assets/` and load them with `@font-face` in `theme.css`. Otherwise use a locally installed font. Never load web fonts from the network; renders must work offline.
- **Background:** the default is a dark night background with glowing particles. For a calm, light brand (common in healthcare), set `--night` to a deep brand tone, or lighten the whole look. The engine only needs `--night` and `--particles`; lower the particle colours' brightness for a quieter feel.

### 5. Get the screens

- **Real product screens** beat mock ones. If there is a codebase, run the app and capture its screens. `references/capturing-real-screens.md` covers both routes: signing in to the team's test environment (the person signs in by hand; you reuse the saved session), or a fake backend with the repo's demo data. It also covers freezing the clock, hiding dev overlays and keeping sensitive data out of frame.
- **Other apps in the user's day** get **mock screens** built in HTML/CSS that look right at a glance: chat and email, a CRM, an EHR, a PACS viewer, a terminal. `references/domains.md` lists the usual ones per domain. Use no real logos as images; a coloured shape or letter mark is enough.
- Product pages that come up empty without backend data also become mock screens, styled like the real app's chrome.

### 6. Set up the project

```bash
cp -R <this skill's folder>/template/. <project>/   # engine, theme, scripts (the template folder sits next to this SKILL.md)
cd <project> && npm install                                                 # playwright + three
```

- **`script.json`**: the story, with the recipe's fields (background, progress, logoBug, music, sfx, transitions). Use layout `canvas` or `sequence`, the logo, intro and outro text, and one entry per step (`id`, `kind`, `title`, `line`, optional `extra` seconds of hold, optional `min` length). Step kinds: `intro`, `overview` (canvas only), `node` (a 1600×900 card), `scene` (full screen, good for three.js), `outro`. See `references/script-example.json`.
- **`theme.css`**: brand colours, set in the next step.
- **`assets/`**: the logo (light on transparent, for particles and the end card), screenshots and icons. The template's `assets/logo.png` and `steps/hello.js` are placeholders. Replace them.

Then voice it and start the server. Check the port is free first, because another project may already be using it:

```bash
python3 vo.py                                     # writes out/vo/*.mp3 and timeline.json; total must fit the target length
lsof -iTCP:8780 -sTCP:LISTEN || python3 -m http.server 8780 &
```

Aim for about 9 to 12 seconds per step and under 2 minutes in total, unless asked otherwise. Write the voiceover in plain spoken English, in the tone the domain needs: short sentences, one idea each. For another language, pick a matching edge-tts voice in `script.json`. If a step needs more time for its visuals than its line gives, add `extra` instead of slowing the voice.

### 7. Build the steps, in parallel

Copy `references/step-contract.md` into the project as `STEP_CONTRACT.md`. Fill its recipe section from the recipe, and paste the story bible into its last section.

Before starting the agents, write a small shared kit (`steps/kit.js`): the device frame, the product's app shell, list rows and the cursor. `references/kit-example.js` is a working one; set its product name, user and nav. Every agent imports it and does not edit it. This keeps the product looking the same in every scene. Then start one agent per one or two steps, all in a single message so they run at the same time. Use `references/agent-brief-template.md` for each brief: the step's voice line, its length, what the screen shows, the beats tied to words, and the camera moves.

While they work, do your own part: the intro and outro wording, the overview, and the sound.

When each agent reports back, check its stills yourself. Then check the facts across scenes: the same names, numbers, prices and dates everywhere, and weekdays that match the dates. Grep the steps for the banned claims. Remove anything the data does not support. For sensitive domains, look at every frame with a person's details in it, and confirm they are invented.

### 8. Check the whole thing

```bash
node still.mjs full 3,12,30,60           # whole-video stills at global times
node still.mjs <stepId> -1,2,5,8         # one step on its own (negative time = its overview "poster" state)
```

Look at frames during camera flights as well as during holds. Read `references/gotchas.md`. It lists the bugs that cost the most time last run.

### 9. Render and mix

```bash
node render.mjs out/video-silent.mp4      # about 1.5 seconds of render per second of video at 1080p30
python3 mix.py out/video-silent.mp4 out/video.mp4
```

`mix.py` lays each voice clip at its start time. By default it adds a soft synth pad that gets quieter under the voice, a whoosh on every camera flight, and a low hit when the logo lands. The recipe's `music` and `sfx` fields change that. It then sets the overall loudness to a normal level. See `references/audio.md` for the levels and how to swap in real music.

Open the result (`open out/video.mp4`) and sample frames from the MP4 to confirm.

### 10. Hand over

Tell the person:

- the file path and length;
- what each part shows;
- what is real versus mock;
- the made-up names you used;
- anything you could not check, such as sound levels, since you cannot listen.

Also tell them how to change things: edit a line in `script.json`, then run `vo.py`, `render.mjs` and `mix.py`. Scene lengths follow the voice automatically.

## Files

- `template/`: engine, theme, helpers and scripts. Copy them into the project.
- `builder/`: the recipe builder page, with live previews and voice, music and sound samples. `builder/CONTRACT.md` explains how to add an option; `node shot.mjs <category>` screenshots one category (needs Playwright).
- `references/recipe-mapping.md`: how each recipe pick becomes script.json fields, theme tokens and agent notes, with the Tidy example.
- `references/kit-example.js`: a shared kit (laptop, app shell, rows, macOS cursor) to copy into `steps/kit.js`.
- `references/styles.md`: when to use canvas, sequence or screen recording.
- `references/domains.md`: cast, tone, mock apps, data and claim rules per kind of product (B2B, healthcare, developer tools, fintech, consumer).
- `references/step-contract.md`: the rules every step follows. Give it to the agents.
- `references/agent-brief-template.md`: how to brief a step agent.
- `references/capturing-real-screens.md`: running the real app and capturing it.
- `references/audio.md`: voice, music and sound effects.
- `references/gotchas.md`: bugs and lessons from earlier runs.
- `references/script-example.json`: a complete example `script.json` (a made-up notes app).
- `references/example-step-website.js`: a strong card step (website plus chat widget, camera zoom, typing).
- `references/example-scene-css3d.js`: a full-screen CSS 3D scene. It starts as a flat copy of a slide diagram, then tilts into real perspective with the text lying on each layer. Use this approach whenever text must sit on 3D surfaces.
- `references/example-scene-threejs.js`: a full-screen three.js scene (glowing slabs, beams, particles, with DOM labels projected from 3D).
- The example step and scene files come from a real run; their product names have been made generic. Copy their techniques, not their content.
