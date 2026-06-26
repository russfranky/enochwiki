---
name: ralph-stop
description: Stop the enochWIKI Ralph loop — set .ralph/loop.md running=false with a stop_reason. Use when the user types /ralph-stop or wants to halt the loop after the current iteration.
---

# /ralph-stop

Halt the loop cleanly:

1. If a `ralph-loop` Workflow is currently running in this session, stop it (TaskStop the
   running workflow task).
2. Edit `.ralph/loop.md` frontmatter: `running: false`, `stop_reason: user_cancelled`,
   `completed_at:` (a timestamp passed in by the user, since scripts can't read the clock).
3. Leave `.ralph/items.json` and `.ralph/progress.md` intact (durable state persists for resume).
4. Report the final iteration + items passed/total.

Do NOT revert or discard work. Stopping only halts iteration; the durable state stays so
`/ralph-loop` can resume later.
