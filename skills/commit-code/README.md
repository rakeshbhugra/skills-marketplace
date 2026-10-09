# commit-code

Looks at your uncommitted changes, splits them into groups by topic, and makes one small commit per group. It never adds co-author lines and never pushes.
Ask for it with "commit my changes" or type `/commit-code` in Claude Code.

## Install in Claude Code

Option 1: add this repo as a plugin marketplace, then install the skill.

```
/plugin marketplace add rakeshbhugra/skills-marketplace
/plugin install commit-code@rakesh-skills
```

Option 2: copy the folder into your skills folder.

```bash
git clone https://github.com/rakeshbhugra/skills-marketplace.git
cp -R skills-marketplace/skills/commit-code ~/.claude/skills/
```

Use `.claude/skills/` inside a project instead if you only want it there.

## Install in Codex

```bash
codex plugin marketplace add rakeshbhugra/skills-marketplace
codex plugin add commit-code@rakesh-skills
```

Or copy the folder by hand:

```bash
git clone https://github.com/rakeshbhugra/skills-marketplace.git
mkdir -p ~/.codex/skills
cp -R skills-marketplace/skills/commit-code ~/.codex/skills/
```

Restart Codex so it picks up the new skill.

Note: in Claude Code the skill loads `git status` and `git diff` for you before it starts. Codex does not do this, so it runs those commands itself.
