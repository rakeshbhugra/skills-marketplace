# code-taste-python

Reviews and plans Python backend code using a set of notes on layered design. The layers are Domain, Repository, Service, Adapter and Unit of Work. The notes come from the book *Architecture Patterns with Python* and live in `docs/architecture/`.
Ask for it with "review this against code-taste" or type `/code-taste-python` in Claude Code.

## Install in Claude Code

Option 1: add this repo as a plugin marketplace, then install the skill.

```
/plugin marketplace add rakeshbhugra/skills-marketplace
/plugin install code-taste-python@rakesh-skills
```

Option 2: copy the folder into your skills folder.

```bash
git clone https://github.com/rakeshbhugra/skills-marketplace.git
cp -R skills-marketplace/skills/code-taste-python ~/.claude/skills/
```

Use `.claude/skills/` inside a project instead if you only want it there.

## Install in Codex

```bash
codex plugin marketplace add rakeshbhugra/skills-marketplace
codex plugin add code-taste-python@rakesh-skills
```

Or copy the folder by hand:

```bash
git clone https://github.com/rakeshbhugra/skills-marketplace.git
mkdir -p ~/.codex/skills
cp -R skills-marketplace/skills/code-taste-python ~/.codex/skills/
```

Restart Codex so it picks up the new skill.

## Read the notes without the skill

Start with `docs/architecture/README.md`. It explains the main rule and the words the other files use.
