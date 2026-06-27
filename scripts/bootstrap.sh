#!/usr/bin/env bash
# Idempotent project bootstrap for Claude Code on the web (ephemeral containers).
# Captures the sandbox-specific workarounds discovered while wiring up Z.ai scraping:
#   1. bun install hangs on z-ai-web-dev-sdk's postinstall  → npm install --ignore-scripts
#   2. registry/binary DIRECT egress is firewalled (ECONNRESET) → force the proxy, clear no_proxy
#   3. Prisma's engine downloader resets                    → fetch engines via curl-through-proxy
#   4. Restores the scraped corroboration snapshot into a fresh SQLite db
#
# Safe to run repeatedly: each step is skipped when its output already exists.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}"
ROOT="$(pwd -P)"
log() { echo "[bootstrap] $*"; }

# Route package/binary downloads through the egress proxy (direct is reset).
export no_proxy="" NO_PROXY="" npm_config_noproxy=""
CA=/root/.ccr/ca-bundle.crt
PROXY_ARGS=()
[ -n "${HTTPS_PROXY:-}" ] && PROXY_ARGS=(--proxy "$HTTPS_PROXY") && [ -f "$CA" ] && PROXY_ARGS+=(--cacert "$CA")

# 1) Dependencies (skip the postinstall scripts that hang/reset in the sandbox).
if [ ! -d node_modules/next ] || [ ! -d node_modules/@prisma/client ]; then
  log "installing dependencies (npm --ignore-scripts)…"
  env no_proxy="" NO_PROXY="" npm_config_noproxy="" \
    npm install --ignore-scripts --no-audit --no-fund \
    ${HTTPS_PROXY:+--proxy="$HTTPS_PROXY" --https-proxy="$HTTPS_PROXY"} \
    ${HTTPS_PROXY:+--cafile="$CA"} \
    --registry=https://registry.npmjs.org --maxsockets=3 --fetch-retries=6 --fetch-timeout=300000
else
  log "dependencies present — skipping install"
fi

# 2) Prisma engines (downloader is reset in-sandbox; place them by hand).
ENG="node_modules/@prisma/engines"
PLAT="debian-openssl-3.0.x"
command -v musl-gcc >/dev/null 2>&1 && PLAT="linux-musl"  # rough libc check
QE="$ENG/libquery_engine-${PLAT}.so.node"
SE="$ENG/schema-engine-${PLAT}"
if [ ! -f "$QE" ] || [ ! -f "$SE" ]; then
  HASH="$(node -e 'process.stdout.write(require("@prisma/engines-version").enginesVersion)')"
  BASE="https://binaries.prisma.sh/all_commits/${HASH}/${PLAT}"
  log "fetching Prisma engines @ ${HASH} (${PLAT})…"
  curl -fsSL "${PROXY_ARGS[@]}" "${BASE}/libquery_engine.so.node.gz" | gunzip > "$QE"
  curl -fsSL "${PROXY_ARGS[@]}" "${BASE}/schema-engine.gz" | gunzip > "$SE" && chmod +x "$SE"
else
  log "Prisma engines present — skipping"
fi

# 3) .env — created without the secret. Live scraping needs ZAI_API_KEY in the
#    environment (or ~/.config/glm/z-ai.key); db setup + re-seed do not.
if [ ! -f .env ]; then
  log "writing .env (no secret)…"
  cat > .env <<EOF
DATABASE_URL="file:${ROOT}/db/custom.db"
ZAI_BASE_URL="https://api.z.ai/api/paas/v4"
ZAI_MODEL="glm-4.5"
ZAI_MCP_WEB_SEARCH_URL="https://api.z.ai/api/mcp/web_search_prime/mcp"
PRISMA_QUERY_ENGINE_LIBRARY="${ROOT}/${QE}"
PRISMA_SCHEMA_ENGINE_BINARY="${ROOT}/${SE}"
PRISMA_CLI_QUERY_ENGINE_TYPE="library"
PRISMA_CLIENT_ENGINE_TYPE="library"
EOF
  [ -n "${ZAI_API_KEY:-}" ] && echo "ZAI_API_KEY=\"${ZAI_API_KEY}\"" >> .env
fi

# 4) Database — generate client, create schema, seed base data + scraped snapshot.
if [ ! -f db/custom.db ]; then
  log "creating + seeding database…"
  set -a; . ./.env; set +a
  npx prisma generate >/dev/null
  npx prisma db push --skip-generate >/dev/null
  for s in seed seed-extended seed-supplementary seed-review-records; do
    [ -f "scripts/$s.ts" ] && { command -v bun >/dev/null 2>&1 && bun "scripts/$s.ts" >/dev/null 2>&1 || true; }
  done
  [ -f data/corroboration-export.json ] && node --env-file=.env scripts/seed-scraped.mjs || true
  log "database ready: $(node --env-file=.env -e 'import("@prisma/client").then(async({PrismaClient})=>{const d=new PrismaClient();console.log(await d.source.count(),"sources,",await d.evidence.count(),"evidence");await d.$disconnect()})' 2>/dev/null)"
else
  log "database present — skipping seed"
fi

log "done."
