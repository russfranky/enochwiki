# `.ralph/` — Ralph Loop state (Claude-native)

A Claude Code adaptation of the Ralph Wiggum loop. **Goal: stop losing track of where we
are.** Each iteration does ONE verified unit of work, writes durable state here, commits, and
ends — then a *fresh* agent resumes from these files with a clean context window. "Throw away
live context, keep durable evidence."

## Files (the durable state — this is the source of truth)

| File | Holds |
|---|---|
| `plan.md` | High-level objective + constraints. Stable across iterations. |
| `items.json` | Structured backlog (each item `passes: false/true`, `blocked`) + `runtime_contract` (verification gates, one-item-per-iteration, require-commit, require-progress-append). |
| `progress.md` | Append-only log of completed work + evidence. Grows every `NEXT`. |
| `loop.md` | Runtime state (iteration, running, stop_reason, git_head, last_promise). |
| `prompt.md` | The per-iteration contract handed to each fresh agent. |

## The loop (one iteration)

1. Read `plan.md`, `items.json`, `progress.md`, `prompt.md`.
2. Pick the first `passes:false`, non-`blocked` item; do **one** coherent unit toward it.
3. Run `runtime_contract.verification_gates` (`bash scripts/check.sh`) — they MUST pass.
4. Append a dated entry to `progress.md` (what + evidence).
5. If the item is done: set `passes:true`, then `git commit` (no push).
6. Update `loop.md` (iteration, git_head, last_promise).
7. End with exactly one promise tag: `<promise>NEXT</promise>`, `<promise>COMPLETE</promise>`, or `<promise>STOP</promise>`.

## Engine + commands

- Engine: `.claude/workflows/ralph-loop.js` (Workflow tool — fresh subagent per iteration,
  enforces the promise/gates, loops until COMPLETE/STOP/stalled/max).
- `/ralph-plan <goal>` — (re)seed `plan.md` + `items.json` from a goal.
- `/ralph-loop [N]` — run up to N iterations (default 20).
- `/ralph-status` — iteration, items passed/total, last progress.
- `/ralph-stop` — set `loop.md running:false`.

## Hard rules (inherited from CLAUDE.md)
One item per iteration; `scripts/check.sh` green before any "done"; **never change runtime
behavior or flip `next.config.ts` build flags / `prisma` migrations unless the item is
unblocked**; no secrets in git (`.env`, `db/*.db`); branch only (`ralph/typecheck-gate` or the
intended `ralph/<topic>` branch) — never push/merge to `main` without owner OK; no AI
attribution in commits; verify with evidence, never claim.
