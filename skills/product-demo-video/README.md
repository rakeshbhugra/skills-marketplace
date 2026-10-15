# product-demo-video

Makes a product demo or explainer video entirely in code. Each frame is drawn from HTML, CSS and three.js in headless Chrome, then joined into a 1080p MP4. A voiceover from edge-tts sets the timing, with captions, a music bed and sound effects mixed in. It works from a codebase, a deck or just a description.
Ask for it with things like "make a demo video of this app" or "turn this deck into an explainer video".

Before it builds anything, it asks if you want to pick the style yourself. If you do, it opens a recipe builder page with live previews and voice and music samples.

## Needs

- Node 18+ (Playwright and three.js install per project with `npm install`)
- Python 3 and [uv](https://docs.astral.sh/uv/) (the voiceover runs `uvx edge-tts`)
- ffmpeg

## Install in Claude Code

Option 1: add this repo as a plugin marketplace, then install the skill.

```
/plugin marketplace add rakeshbhugra/skills-marketplace
/plugin install product-demo-video@rakesh-skills
```

Option 2: copy the folder into your skills folder.

```bash
git clone https://github.com/rakeshbhugra/skills-marketplace.git
cp -R skills-marketplace/skills/product-demo-video ~/.claude/skills/
```

Use `.claude/skills/` inside a project instead if you only want it there.

## Install in Codex

```bash
codex plugin marketplace add rakeshbhugra/skills-marketplace
codex plugin add product-demo-video@rakesh-skills
```

Or copy the folder by hand:

```bash
git clone https://github.com/rakeshbhugra/skills-marketplace.git
mkdir -p ~/.codex/skills
cp -R skills-marketplace/skills/product-demo-video ~/.codex/skills/
```

Restart Codex so it picks up the new skill.
