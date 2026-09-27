#!/usr/bin/env node
// load-test.mjs — baseline load test for enoch.wiki. No dependencies.
//
// Hits the cacheable public pages plus two API routes with N concurrent
// users for T seconds, then prints latency percentiles and status counts.
//
// Usage:
//   node scripts/load-test.mjs [--base http://localhost:3000] [--concurrency 10] [--duration 30]
//
// "Pass" means: p95 under 1000 ms AND at least 99% 2xx on the cached pages
// (/, /sitemap.xml) at 10x the expected peak concurrency. The API routes are
// reported for reference only (/api/health calls the external Z.ai API and may
// be slow; /api/fts depends on the database).
//
// D-009: the old /topics target does not exist in the app (no such route), so
// every run failed on 404s regardless of app health. Targets below are real
// routes only.

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};

const BASE = (opt("--base", "http://localhost:3000") || "").replace(/\/$/, "");
const CONCURRENCY = parseInt(opt("--concurrency", "10"), 10);
const DURATION_MS = parseInt(opt("--duration", "30"), 10) * 1000;

const TARGETS = [
  { path: "/", cached: true },
  { path: "/sitemap.xml", cached: true },
  { path: "/api/fts?q=enoch", cached: false },
  { path: "/api/search?q=enoch", cached: false },
  { path: "/api/health", cached: false },
];

const results = new Map(TARGETS.map((t) => [t.path, { lat: [], status: {} }]));

async function hit(path) {
  const r = results.get(path);
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + path);
    await res.arrayBuffer(); // drain the body so timing is honest
    r.lat.push(Date.now() - t0);
    const s = String(res.status);
    r.status[s] = (r.status[s] || 0) + 1;
  } catch (e) {
    r.lat.push(Date.now() - t0);
    r.status["ERR"] = (r.status["ERR"] || 0) + 1;
  }
}

function pct(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function worker(deadline) {
  let i = 0;
  while (Date.now() < deadline) {
    const t = TARGETS[i % TARGETS.length];
    i += 1;
    await hit(t.path);
  }
}

console.log(`base: ${BASE}`);
console.log(`concurrency: ${CONCURRENCY}, duration: ${DURATION_MS / 1000}s`);
console.log(`targets: ${TARGETS.map((t) => t.path).join(", ")}`);
console.log("");

const deadline = Date.now() + DURATION_MS;
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(deadline)));

let failed = 0;
for (const t of TARGETS) {
  const r = results.get(t.path);
  const s = [...r.lat].sort((a, b) => a - b);
  const n = s.length;
  const p50 = pct(s, 50).toFixed(0);
  const p95 = pct(s, 95).toFixed(0);
  const max = n ? s[n - 1].toFixed(0) : 0;
  const statuses = Object.entries(r.status)
    .map(([k, v]) => `${k}:${v}`)
    .join(" ");
  const ok2xx = Object.entries(r.status)
    .filter(([k]) => k.startsWith("2"))
    .reduce((a, [, v]) => a + v, 0);
  const successRate = n ? ok2xx / n : 0;
  let verdict = "";
  if (t.cached && n > 0) {
    // A fast refusal (server down) must not read as a pass: require both
    // low latency and a high 2xx rate.
    const ok = pct(s, 95) < 1000 && successRate >= 0.99;
    verdict = ok ? "PASS" : "FAIL";
    if (!ok) failed += 1;
  }
  console.log(
    `${t.path}\n  requests: ${n}  2xx: ${(successRate * 100).toFixed(1)}%  p50: ${p50}ms  p95: ${p95}ms  max: ${max}ms  status: ${statuses}${verdict ? `  [${verdict}]` : ""}`
  );
}

console.log("");
if (failed > 0) {
  console.log(`RESULT: FAIL — ${failed} cached page(s) over the bar (p95 >= 1000 ms or 2xx rate < 99%)`);
  process.exit(1);
}
console.log("RESULT: PASS — cached pages under the bar (p95 < 1000 ms, 2xx >= 99%)");
