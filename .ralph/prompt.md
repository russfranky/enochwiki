# Ralph iteration contract — enochWIKI (handed to each fresh agent)

You are ONE iteration of the enochWIKI Ralph loop. Repo: `/Users/russ/Documents/GITHUB/enochWIKI`.
You start with a CLEAN context — the durable state in `.ralph/` is your only memory. Do ONE
verified unit of work, persist evidence, commit, and exit. Do not try to do everything.

## Steps (in order)
1. Read `.ralph/plan.md`, `.ralph/items.json`, `.ralph/progress.md`. Skim the source files
   `plan.md` names before acting (`package.json`, `tsconfig.json`, `next.config.ts`,
   `prisma/schema.prisma`).
2. Select the FIRST item in `items.json` with `"passes": false` AND `"blocked"` != true. Do
   exactly ONE coherent unit of work toward it (its `steps` are the guide). If EVERY
   `passes:false` item is `blocked:true`, emit `<promise>STOP</promise>` citing the blocker —
   never work a blocked item.
3. Run the gates: `bash scripts/check.sh` — it MUST end `ALL GATES PASS`. (It puts `bun` on
   PATH.) If gates fail, fix or revert; never leave the tree broken.
4. Append a dated entry to `.ralph/progress.md` (item, what you did, the evidence: command
   output / file:line). This file MUST grow.
5. If the item is fully done AND gates pass: set its `"passes": true` in `items.json`, then
   `git add -A && git commit` (conventional message, **NO AI / "Claude" attribution**). Do NOT
   push.
6. Update `.ralph/loop.md` frontmatter: `iteration`, `git_head` (new HEAD), `last_promise`.
7. End your final message with EXACTLY ONE promise tag on its own line:
   - `<promise>NEXT</promise>` — this item done, more `passes:false` items remain.
   - `<promise>COMPLETE</promise>` — every non-blocked item `passes:true` and gates green.
   - `<promise>STOP</promise>` — only blocked items remain (or a real blocker); explain why.

## Hard rules (enochWIKI invariants)
- **Behavior-preserving:** do NOT change runtime/logic, flip `next.config.ts` build flags, or
  touch `prisma` migrations unless the worked item is explicitly unblocked. EW-005 is blocked —
  never start it here.
- **Branch `ralph/typecheck-gate`; NEVER push or merge** to `main` without owner OK.
- **No secrets / no DB blobs in git** (`.env`, `db/*.db`). No AI attribution in commits.
- `bun` is required for the gates; `scripts/check.sh` handles the PATH. Do not switch package
  managers (no npm/yarn install).
- ONE item per iteration. Verify with evidence; never claim.
