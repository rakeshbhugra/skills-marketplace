---
name: commit-code
description: Commit changes in sensible grouped commits. Groups related changes by topic/area, creates multiple focused commits instead of one big one. Never adds co-author lines.
---

# Commit Code

Create sensible, grouped commits from the current working tree changes. Never lump everything into a single commit. Never add co-author lines.

## How It Works

Follow these steps exactly:

### Step 1 — Survey the changes

The working tree state is pre-loaded below. Read it to understand what files changed and how they group together. Do NOT re-run these commands.

**git status**
```
!`git status`
```

**Working tree changes (unstaged):**
```
!`git diff --stat`
```

**Staged changes:**
```
!`git diff --stat --cached`
```

**Recent commits (for style reference):**
```
!`git log --oneline -5 2>/dev/null || echo "(no commits yet)"`
```

### Step 2 — Plan commit groups

Analyze all changed/untracked files and group them by logical topic. Common groupings:

- **By feature area**: frontend vs backend vs docs vs config
- **By purpose**: new feature vs fix vs refactor vs chore
- **By component**: auth changes vs chat UI changes vs agent changes
- **By repo** (in monorepos with submodules): changes in different submodules get separate commits

Each group becomes one commit. Aim for 2–6 commits typically. Never make a single commit unless there truly is only one logical change.

### Step 3 — Create commits sequentially

For each group, stage only the relevant files and commit:

```bash
git add <specific files for this group>
git commit -m "$(cat <<'EOF'
<commit message>
EOF
)"
```

### Commit Message Rules

- Start with a lowercase verb: add, update, fix, remove, refactor, configure
- One line, under 72 characters
- Focus on *what* changed, not *how*
- **NEVER add a Co-Authored-By line**
- **NEVER add Signed-off-by or any trailer lines**
- **NEVER add "Generated with Claude Code" or any AI attribution in PR descriptions**
- Use conventional-ish style but no strict prefix required

### Examples of good grouping

Given changes across docs, frontend config, and admin UI:
```
Commit 1: "add screen wireframes for chat UI"
Commit 2: "add screen wireframes for admin UI"  
Commit 3: "initialize next.js project for frontend"
Commit 4: "add design philosophy and design guide docs"
```

NOT:
```
Commit 1: "add all frontend and admin changes"  ← too broad
```

### Step 4 — Verify

Run `git log --oneline -10` and `git status` to confirm everything is committed and the history looks clean.

## Important

- Do NOT push to remote unless explicitly asked
- Do NOT use `git add .` or `git add -A` — always add specific files
- Do NOT amend existing commits
- Do NOT skip hooks (no `--no-verify`)
- Do NOT include files that look like secrets (.env, credentials, tokens)
- If a submodule has changes, commit inside the submodule first, then commit the submodule pointer update in the parent repo
