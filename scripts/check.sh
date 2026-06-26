#!/usr/bin/env bash
# ============================================================
# enochWIKI :: verification gates
# ------------------------------------------------------------
# Exit 0 only if EVERY check passes. This is the Ralph loop's gate
# (.ralph/items.json runtime_contract) and a good pre-commit check.
#   bash scripts/check.sh
#
# The repo has NO CI workflow; these gates mirror the package.json
# scripts the project actually ships (lint + next build) plus a
# Prisma client generate (so types/build match prisma/schema.prisma).
#
# NOTE: a strict `tsc --noEmit` is NOT yet a gate — the codebase
# currently ships with pre-existing type errors and next.config.ts
# sets typescript.ignoreBuildErrors:true. Cleaning that up and
# tightening this gate is the Ralph backlog objective (see .ralph/plan.md).
# ============================================================
set -uo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"
# bun is the runtime + package manager for this repo.
export PATH="/Users/russ/.bun/bin:$PATH"
rc=0
step(){ printf '\n=== %s ===\n' "$1"; }

step "bun present"
command -v bun >/dev/null 2>&1 && echo "ok bun $(bun --version)" || { echo "FAIL: bun not on PATH"; rc=1; }

step "deps installed (node_modules)"
[ -d node_modules ] && echo "ok node_modules" || { echo "FAIL: run 'bun install' first"; rc=1; }

step "prisma client generate (matches prisma/schema.prisma)"
bunx prisma generate >/tmp/ew-prisma.log 2>&1 \
  && echo "ok prisma generate" || { echo "FAIL prisma generate"; tail -10 /tmp/ew-prisma.log; rc=1; }

step "lint (eslint .)"
bun run lint >/tmp/ew-lint.log 2>&1 \
  && echo "ok lint" || { echo "FAIL lint"; tail -20 /tmp/ew-lint.log; rc=1; }

step "build (next build, standalone)"
bun run build >/tmp/ew-build.log 2>&1 \
  && echo "ok build" || { echo "FAIL build"; tail -25 /tmp/ew-build.log; rc=1; }

step "ralph items.json valid"
python3 -c "import json;json.load(open('.ralph/items.json'))" >/dev/null 2>&1 \
  && echo "ok items.json" || { echo "FAIL items.json (invalid JSON)"; rc=1; }

echo
if [ "$rc" -eq 0 ]; then echo "ALL GATES PASS"; else echo "GATES FAILED"; fi
exit "$rc"
