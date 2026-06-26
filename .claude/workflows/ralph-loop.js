export const meta = {
  name: 'ralph-loop',
  description: 'enochWIKI Ralph loop: a FRESH subagent per iteration does one verified unit of work from .ralph/items.json, runs the gates (bash scripts/check.sh), appends progress, commits, and emits a promise (NEXT/COMPLETE/STOP). Loops until COMPLETE/STOP/max. Durable state in .ralph/ so context stays fresh and we never lose our place.',
  phases: [{ title: 'Iterate', detail: 'fresh agent per iteration until COMPLETE / STOP / max-iterations' }],
}

// args: { maxIterations?: number }  — default 20
const MAX = (args && typeof args.maxIterations === 'number' && args.maxIterations > 0) ? args.maxIterations : 20

const PROMISE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    promise: { type: 'string', enum: ['NEXT', 'COMPLETE', 'STOP'] },
    item: { type: 'string', description: 'id/description of the items.json item worked this iteration' },
    summary: { type: 'string', description: 'what was done + the verification evidence' },
    committed: { type: 'boolean', description: 'true if a git commit was made this iteration' },
    progress_appended: { type: 'boolean', description: 'true if .ralph/progress.md grew' },
  },
  required: ['promise', 'summary'],
}

const ITER_PROMPT = `You are ONE iteration of the enochWIKI Ralph loop in /Users/russ/Documents/GITHUB/enochWIKI.
You have a CLEAN context: the durable state in .ralph/ is your only memory.

1. Read .ralph/prompt.md (your full contract), then .ralph/plan.md, .ralph/items.json,
   and .ralph/progress.md. Skim any source files plan.md names before touching code.
2. Take the FIRST item in items.json with "passes": false AND "blocked" != true, and do
   exactly ONE coherent unit of work toward it (use its "steps"). If every passes:false item
   is blocked, return STOP citing the blocker — never work a blocked item.
3. Run the gates: bash scripts/check.sh — it MUST end "ALL GATES PASS". (bun is on PATH
   inside check.sh.) If gates fail, fix or revert; never leave the tree broken.
4. Append a dated entry to .ralph/progress.md (item, what, evidence: command output / file:line).
   This file MUST grow.
5. If the item is fully done + gates green: set its "passes": true in items.json; git add -A
   && git commit (conventional message, NO AI / "Claude" attribution). Do NOT push. Branch is
   ralph/typecheck-gate; NEVER push or merge to main without owner OK.
6. Update .ralph/loop.md frontmatter (iteration, git_head = new HEAD, last_promise).
7. Return your promise: NEXT (item done, more remain), COMPLETE (all items pass + gates green),
   or STOP (blocked — say why). ONE item per iteration. Do NOT change runtime behavior or flip
   next.config.ts build flags unless the item is explicitly unblocked. Verify with evidence;
   never claim.`

let iteration = 0
let stopReason = null

while (!stopReason && iteration < MAX) {
  iteration++
  log(`--- ralph iteration ${iteration}/${MAX} ---`)
  const r = await agent(ITER_PROMPT, { label: `ralph#${iteration}`, phase: 'Iterate', schema: PROMISE_SCHEMA })

  if (!r) {
    stopReason = 'error'
    log(`iteration ${iteration}: agent returned null (error/skip) — stopping`)
    break
  }

  log(`iteration ${iteration}: <${r.promise}> ${r.summary}`)

  // A real NEXT must have appended progress AND committed; otherwise we're spinning
  // without advancing — downgrade to a stall stop.
  if (r.promise === 'NEXT' && (r.progress_appended === false || r.committed === false)) {
    log(`iteration ${iteration}: NEXT without progress-append+commit — treating as STOP (no real advance)`)
    stopReason = 'stalled'
    break
  }

  if (r.promise === 'COMPLETE') stopReason = 'complete'
  else if (r.promise === 'STOP') stopReason = 'stopped'
}

if (!stopReason) stopReason = 'max_iterations'
log(`ralph loop ended: ${stopReason} after ${iteration} iteration(s). State in .ralph/.`)
return { iterations: iteration, stop_reason: stopReason }
