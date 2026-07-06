#!/usr/bin/env bash
# Durable corpus-growth runner. Safe to run on a schedule: it self-throttles (when
# the z.ai search quota is spent, searches return empty and it adds nothing), dedups
# by URL, and only commits when the corpus actually grew. High-yield search churn +
# free pure-HTTP crawl + RAG index refresh, in one guarded pass.
#
#   bash scripts/grow.sh            # one pass
#   (scheduled via ~/Library/LaunchAgents/wiki.enoch.grow.plist — every 6h)
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd -P)"
export PATH="$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -f .env ] || { echo "[grow] no .env — run scripts/bootstrap or set up DB first"; exit 1; }

LOG="$ROOT/.grow-cron.log"; exec >> "$LOG" 2>&1
echo "===== grow run $(date) ====="

# Single-instance guard (a run can outlast the 6h interval on a big quota reset).
LOCK="$ROOT/.grow.lock"
if [ -f "$LOCK" ] && kill -0 "$(cat "$LOCK" 2>/dev/null)" 2>/dev/null; then echo "[grow] already running (pid $(cat "$LOCK")) — skip"; exit 0; fi
echo $$ > "$LOCK"; trap 'rm -f "$LOCK"' EXIT

run() { node --env-file=.env "$@" || true; }

# New subject areas not yet in the corpus (durable capture — these are the growth
# frontier; each is a z.ai search + depth-2 crawl, no-op when quota is exhausted).
TOPICS=(
  "2 Enoch Slavonic Secrets of Enoch Melchizedek heavenly ascent scholarly"
  "3 Enoch Sefer Hekhalot Metatron Merkavah mysticism scholarly"
  "Manichaean Book of Giants Turfan fragments Enoch Nephilim scholarly"
  "Astronomical Book of Enoch 4Q208 4Q209 synchronistic calendar Qumran scholarly"
  "Hekhalot literature heavenly ascent throne mysticism Second Temple scholarly"
  "11QMelchizedek Melchizedek eschatology jubilee Qumran scholarly"
  "Ethiopic manuscript tradition Beta Masaheft EMML Geez codicology scholarly"
  "Apocalypse of Peter Ethiopic tours of hell judgment scholarly"
  "Shepherd of Hermas early Christian apocalyptic angelology scholarly"
  "Enoch reception patristic Tertullian Origen Jude 2 Peter scholarly"
  "Tartarus 1 Enoch Greek Akhmim 2 Peter fallen angels scholarly"
  "Rephaim Nephilim giants Second Temple demonology evil spirits scholarly"
)
for q in "${TOPICS[@]}"; do
  echo "--- seed-search: $q"
  run scripts/crawl.mjs --seed-search "$q" --depth 2 --max-pages 30 --per-domain 3 --breadth 6
done

# Recent scholarship + EOTC recency (dedups; adds only genuinely new/recent pages).
run scripts/scrape-grow.mjs all 12 --recency oneMonth
run scripts/eotc-grow.mjs --recency oneYear
# Free pure-HTTP deepening from the trusted set (no quota needed).
run scripts/crawl.mjs --seed-db --depth 2 --max-pages 120 --per-domain 3 --breadth 8

# Re-file, validate, map, export.
run scripts/classify-evidence.mjs
run scripts/validate-authorities.mjs --offline
run scripts/coverage-map.mjs
run scripts/export-snapshots.mjs

OLD=$(git show HEAD:data/corroboration-export.json | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).sources.length))' 2>/dev/null || echo 0)
NEW=$(node -e 'console.log(require("./data/corroboration-export.json").sources.length)' 2>/dev/null || echo 0)
echo "[grow] snapshot sources: HEAD=$OLD NEW=$NEW"
if [ "${NEW:-0}" -gt "${OLD:-0}" ]; then
  bun scripts/setup-fts.ts >/dev/null 2>&1 || true   # refresh keyword index
  run scripts/rag-index.mjs                            # refresh RAG chunks (text)
  git add data/corroboration-export.json data/authorities-export.json docs/coverage-map.md
  git commit -q -m "chore: deepen corpus via scheduled growth (${OLD}->${NEW} sources) [skip ci]" && git push -q origin HEAD 2>&1 | tail -1
  echo "[grow] committed+pushed ($OLD -> $NEW)"
else
  git checkout -- data/corroboration-export.json data/authorities-export.json 2>/dev/null || true
  echo "[grow] no net new sources (quota likely spent / saturated) — nothing to commit"
fi
echo "===== grow done $(date) ====="
