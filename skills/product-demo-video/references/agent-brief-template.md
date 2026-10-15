# Briefing a step agent

Start one general-purpose agent per one or two steps, all in one message so they run in parallel, in the background. Five agents for ten steps worked well. A three.js full-screen scene deserves its own agent.

Each brief must stand on its own, because the agent has not seen the conversation. Use this shape:

```
You are building <one/two> animated scenes for a ~<N>s product video about <product>, <one-line what it does>.

Project: <absolute path>
FIRST read, in full: STEP_CONTRACT.md (rules + shared story), helpers.js, theme.css, timeline.json. Skim engine.js for context.
A local HTTP server is already running on port <PORT> — do not stop it. Run tools with PORT=<PORT>. Node + Playwright are installed here.

You own ONLY: steps/<a>.js, steps/<b>.js (plus optional assets named assets/<a>-* / assets/<b>-*). Do not touch any other file.

## Step "<a>" (dur <dur>s, voice starts at lt <vo>, lasts <voDur>s)
Voice: "<the exact line>"
<What the screen is: which app/page, real screenshot or mock, layout, the actual content and data to show.>
Beats: <ordered list, each tied to a word in the line: "on 'X' ... then on 'Y' ...">
Camera: <e.g. zoom into the widget (w ~1100) for the conversation, ease back out at the end>
Poster state (lt<0): <what it should look like small, in the overview>

## Step "<b>" ...

Quality bar: top-tier product launch video, in the tone set in STEP_CONTRACT.md. Believable, crisp UI with real-looking content; motion that means something. Deterministic, a pure function of lt.

Verify with `PORT=<PORT> node still.mjs <a> -1,1,2.5,4,6,8,10` (and the same for <b>) and READ the PNGs in stills/. Iterate until it genuinely looks great (alignment, overflow, readability at the camera framing, no console errors, key content clear of the bottom 13% and the top-left corner).
Final report: 5–8 lines — what each scene shows, any limitations, anything you needed from shared files.
```

## What made the briefs work

- **Concrete content:** "a Slack bot message 'New high-intent visitor on acme.com' with a rich card: name, title, company, score 91, the page they are on, buttons Open / View details", not "a Slack alert".
- **Beats tied to words** in the voice line, so the agent can use `ctx.at()`.
- **The poster state** spelled out, because the canvas overview shows every card at once.
- **A self-check loop** (`still.mjs` plus reading the PNGs). Agents fixed most of their own layout bugs this way.
- **Ownership limits** ("only these files"), so parallel agents never collide.

## After they report

- **Look at their stills yourself:** one or two frames each, at a key beat.
- **Check facts across scenes:** agents invent details independently. The first run had three different pricing models across three scenes. Grep the steps for numbers, prices and names and make them match.
- **Check claims:** one agent wrote "#1 share of voice" over a 2-point lead. Reword anything the data does not support.
- **Fix small things directly** with a quick edit; do not restart the agent.
