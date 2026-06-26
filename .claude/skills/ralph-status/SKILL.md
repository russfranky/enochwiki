---
name: ralph-status
description: Show the enochWIKI Ralph loop status — current iteration/running state, how many .ralph/items.json items pass vs total, and the latest progress entries. Use when the user types /ralph-status or asks "where are we".
---

# /ralph-status

Report where we are, from the durable state (no guessing):

1. Read `.ralph/loop.md` frontmatter → `running`, `iteration`, `max_iterations`,
   `stop_reason`, `last_promise`, `git_head`.
2. Read `.ralph/items.json` → count `passes:true` / total; list each item's `id` +
   `description` with a ✓ / ✗ (and mark `blocked` ones), and name the next `passes:false`
   (non-blocked) item.
3. Read the last ~15 lines of `.ralph/progress.md` → most recent work.
4. `git log --oneline -5` and `git status -sb` for actual repo state.

Output a tight summary: running state + iteration, items X/Y passing (with the next item
named), last progress entry, and current HEAD / branch / push state. Do not start or modify
anything — status only.
