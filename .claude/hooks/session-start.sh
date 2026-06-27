#!/bin/bash
# SessionStart hook — bootstraps deps, Prisma engines, and the seeded database.
set -euo pipefail
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then exit 0; fi
bash "${CLAUDE_PROJECT_DIR}/scripts/bootstrap.sh"
