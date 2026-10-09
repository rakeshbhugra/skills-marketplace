# oled-doc

Makes a single HTML file with a pure black background and only gray tones. Every process in it becomes a diagram you can click through step by step. Good for research docs, proposals and design write-ups.
Ask for it with things like "make me an HTML doc about X" or "write this plan up as a nice doc".

## Install in Claude Code

Option 1: add this repo as a plugin marketplace, then install the skill.

```
/plugin marketplace add rakeshbhugra/skills-marketplace
/plugin install oled-doc@rakesh-skills
```

Option 2: copy the folder into your skills folder.

```bash
git clone https://github.com/rakeshbhugra/skills-marketplace.git
cp -R skills-marketplace/skills/oled-doc ~/.claude/skills/
```

Use `.claude/skills/` inside a project instead if you only want it there.

## Install in Codex

```bash
codex plugin marketplace add rakeshbhugra/skills-marketplace
codex plugin add oled-doc@rakesh-skills
```

Or copy the folder by hand:

```bash
git clone https://github.com/rakeshbhugra/skills-marketplace.git
mkdir -p ~/.codex/skills
cp -R skills-marketplace/skills/oled-doc ~/.codex/skills/
```

Restart Codex so it picks up the new skill.

