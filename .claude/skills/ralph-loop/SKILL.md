---
name: ralph-loop
description: Run the enochWIKI Ralph loop — fresh-context iterations that each do ONE verified unit of work from .ralph/items.json, run the gates (bash scripts/check.sh), append progress, commit, and emit a promise (NEXT/COMPLETE/STOP). Use when the user types /ralph-loop or wants to grind the tracked backlog to completion without losing state across context churn.
---

# /ralph-loop

Runs the durable, fresh-context work loop defined in `.ralph/`. Claude-native adaptation of
the Ralph Wiggum loop: keep durable evidence in files, throw away live context each iteration.

## Before running
1. Confirm `.ralph/plan.md` + `.ralph/items.json` reflect the current objective. If not,
   run `/ralph-plan <goal>` first to (re)seed them.
2. Confirm the working tree is in a known state (`git status`) and you are on
   `ralph/typecheck-gate` (or the intended `ralph/<topic>` branch — never `main`).

## Run
Invoke the **Workflow** tool with the engine script:
- `Workflow({ scriptPath: ".claude/workflows/ralph-loop.js", args: { maxIterations: N } })`
- `N` defaults to 20 if omitted. Parse the `/ralph-loop <N>` argument if the user gave one.

The engine spawns a fresh subagent per iteration (clean context), each doing one
`items.json` item, enforcing the gates (`bash scripts/check.sh`), appending
`.ralph/progress.md`, committing, and returning a promise. It loops until `COMPLETE`,
`STOP`, `max_iterations`, or a stalled `NEXT` (no progress-append + commit).

## Rules
- ONE item per iteration; `scripts/check.sh` must pass before any item flips `passes:true`.
- No secrets in git (`.env`, `db/*.db`); do NOT change runtime behavior or flip
  `next.config.ts` build flags / `prisma` migrations unless the worked item is explicitly
  unblocked.
- NEVER push or merge to `main` without explicit owner OK.
- No AI / "Claude" attribution in commits. Report the final `{ iterations, stop_reason }` and
  the items passed/total from `.ralph/items.json`.
