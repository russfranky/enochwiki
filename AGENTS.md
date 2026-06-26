# AGENTS.md

Agent configuration for enochWIKI.

## Agent skills

The Matt Pocock engineering skills (installed under `.claude/skills/`) read their per-repo
configuration from the files below.

### Issue tracker

Local markdown — issues and PRDs live as files under `.scratch/<feature>/` (this repo has no
git remote). External PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map 1:1 to `Status:` strings on each `.scratch/` issue file. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root (created lazily by
`/domain-modeling`). See `docs/agents/domain.md`.
