---
name: ralph-plan
description: (Re)seed the enochWIKI Ralph loop plan — write .ralph/plan.md (objective + constraints) and .ralph/items.json (backlog + verification gates) from a goal. Use when the user types /ralph-plan <goal> or before starting a ralph-loop on a fresh objective.
---

# /ralph-plan <goal>

Write the durable plan the loop will grind. This is the "plan writer" step.

1. Read the goal from the argument + the source-of-truth context: `package.json` (scripts),
   `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `prisma/schema.prisma`,
   `scripts/check.sh`, and `git log --oneline -10` for recent state. Do NOT plan from memory.
2. Rewrite `.ralph/plan.md`: the objective, the source files to read, and the non-negotiable
   enochWIKI invariants (no AI/"Claude" attribution in commits; one item per iteration;
   `scripts/check.sh` green before any "done"; branch-only — never push/merge to `main`
   without owner OK; no secrets in git; never commit `.env`/`db/*.db`; do NOT change runtime
   behavior or flip `next.config.ts` build flags / touch `prisma` migrations unless the item is
   explicitly unblocked).
3. Rewrite `.ralph/items.json`: break the goal into small, independently-verifiable items,
   each `{ id, category, description, steps (incl. the verification command), passes:false,
   blocked:false, regression_notes }`. Set `runtime_contract.verification_gates` to
   `["bash scripts/check.sh"]`. Keep `require_one_item_per_iteration`, `require_commit`,
   `require_progress_append` true. Each item must be doable LOCALLY (bun on PATH) and verifiable
   by `scripts/check.sh`. Anything that needs an owner decision (e.g. flipping
   `typescript.ignoreBuildErrors`, editing `prisma` migrations, CI/CD, or `.env`) must be
   `blocked: true` (owner op).
4. Reset `.ralph/loop.md` (iteration 0, running false, stop_reason null) and append a
   `## <date> · replan` entry to `.ralph/progress.md` noting the new objective.
5. Confirm `items.json` is valid JSON (`python3 -c "import json;json.load(open('.ralph/items.json'))"`).

Each item must be small enough to finish in ONE fresh-context iteration with the gates green.
