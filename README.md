# Skills Marketplace

Skills for Claude Code and Codex. Each skill is a folder under `skills/` with a `SKILL.md` and a `README.md` that shows how to install it.

| Skill | What it does |
|---|---|
| [oled-doc](skills/oled-doc) | Builds a black, gray-only HTML doc with clickable step-by-step diagrams. |
| [commit-code](skills/commit-code) | Splits your changes into small commits grouped by topic. |
| [code-taste-python](skills/code-taste-python) | Reviews Python backend code against a layered-architecture playbook. |
| [product-demo-video](skills/product-demo-video) | Makes a product demo video in code, with voiceover, captions and music. |

## Install everything in Claude Code

```
/plugin marketplace add rakeshbhugra/skills-marketplace
/plugin install oled-doc@rakesh-skills
/plugin install commit-code@rakesh-skills
/plugin install code-taste-python@rakesh-skills
/plugin install product-demo-video@rakesh-skills
```

## Install in Codex

```bash
codex plugin marketplace add rakeshbhugra/skills-marketplace
codex plugin add oled-doc@rakesh-skills
codex plugin add commit-code@rakesh-skills
codex plugin add code-taste-python@rakesh-skills
codex plugin add product-demo-video@rakesh-skills
```

Or copy them by hand:

```bash
git clone https://github.com/rakeshbhugra/skills-marketplace.git
mkdir -p ~/.codex/skills
cp -R skills-marketplace/skills/* ~/.codex/skills/
```

## Add a skill

1. Make a folder `skills/<name>/` with a `SKILL.md` and a `README.md`.
2. Add an entry for it in `.claude-plugin/marketplace.json`.
3. Add a row to the table above.
