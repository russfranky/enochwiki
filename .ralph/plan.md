# Ralph plan — enochWIKI

## Objective
Harden enochWIKI's type-safety and **lock in the verification gates**. The repo ships today
with `next.config.ts` → `typescript.ignoreBuildErrors: true` and a `tsc --noEmit` that fails on
pre-existing errors, and there is **no CI**. Drive `tsc --noEmit` to clean across the real app
surface, add a `typecheck` script, and tighten `scripts/check.sh` to enforce it — all
**behavior-preserving** (no runtime/logic changes). Flipping the build-policy flag itself
(`ignoreBuildErrors`) is owner-gated and stays **blocked**.

> This is the seed backlog. Replace it for a different goal with `/ralph-plan <goal>`.

## Source-of-truth files (read before acting — do not plan from memory)
- `package.json` — the scripts the gate mirrors (`lint` = `eslint .`, `build` = `next build`).
- `next.config.ts` — `output: "standalone"`, `typescript.ignoreBuildErrors: true` (EW-005).
- `eslint.config.mjs` — flat config; already ignores `examples/**` and `skills`.
- `tsconfig.json` — `strict: true`; `include` currently sweeps `**/*.ts(x)` (pulls in `scripts/`
  + `examples/`, which is where most tsc noise comes from).
- `prisma/schema.prisma` — sqlite; the client must be generated before build/typecheck.
- `scripts/check.sh` — the gates every iteration must pass.

## Known type errors at seed (from `bunx tsc --noEmit`)
- `src/app/page.tsx:257` — `boolean | null` not assignable to `boolean | undefined` (EW-001).
- `src/app/api/flashcards/route.ts:98` — argument typed `never` (EW-002).
- `scripts/*` (probe-final, probe-websearch, test-zai-*, test-fts, seed) + `examples/websocket/*`
  — dev scripts / examples, not app code; redeclares + missing optional deps (EW-003).

## Backlog
Tracked in `.ralph/items.json`. EW-001…004 are safe, behavior-preserving fixes + gate
tightening (gates stay green). **EW-005** (flip `ignoreBuildErrors` to `false` in
`next.config.ts`) is **blocked** — it changes build-failure semantics + could break deploys, so
it needs owner OK and should only land after the `tsc` gate has been green.

## Invariants (non-negotiable)
- **One item per iteration**; `bash scripts/check.sh` must end **ALL GATES PASS** before any
  item flips `passes:true`.
- **No AI / "Claude" attribution** in commits; conventional messages.
- **Branch-only:** commit to `ralph/typecheck-gate`; **NEVER push or merge** to `main` without
  owner OK.
- **No secrets / no DB blobs** in git (`.env`, `db/*.db` — both already gitignored).
- **Behavior-preserving:** do NOT change runtime/logic, flip `next.config.ts` build flags, or
  touch `prisma` migrations unless the worked item is explicitly unblocked (EW-005 is blocked).
- `bun` is the runtime + package manager; `scripts/check.sh` puts `/Users/russ/.bun/bin` on PATH.
- Verify with evidence (command output / file:line). Never claim.
