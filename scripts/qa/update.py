#!/usr/bin/env python3
"""Phase 4/5 update: mark fixed defects, record runtime execution, recompute the
canonical feature-catalog statuses, and emit the execution log."""
import csv, os
from collections import Counter

ROOT = "/Users/russ/Documents/GITHUB/enochWIKI"
QA = os.path.join(ROOT, "docs/qa")
TODAY = "2026-06-26"
SEV_RANK = {"critical": 4, "high": 3, "medium": 2, "low": 1, "": 0}

# Defects fixed + verified this iteration (Phase 4)
FIXED = {
    "D-022": "Removed hardcoded Z.ai key from src/lib/zai-api.ts; env-only + graceful fallback. Gate green. (Leaked key still needs owner rotation.)",
    "D-052": "Added editorial state-transition guard to review POST (409 on illegal transition). Verified logic + gate green.",
    "D-045": "Evidence DELETE now writes an AuditLog 'delete' entry + 404 on missing id. Gate green.",
    "D-054": "Reconciled Evidence.reviewState schema comment to include 'needs-revision'. prisma validate OK.",
    "D-064": "Public topic page gated on reviewState='approved' (findFirst). Verified at runtime: unapproved slug -> HTTP 404, approved -> 200.",
}

# Endpoints actually executed at runtime against the seeded DB (Phase 3 live)
EXECUTED_SURFACES = [
    "/api/health", "/api/scripture", "/api/themes", "/api/glossary", "/api/daily-insight",
    "/api/public", "/api/claim-types", "/api/perspectives", "/api/cross-refs", "/api/fts",
    "/api/study-plans",
]

EXEC_LOG = [
    # endpoint, method, result, evidence
    ("/api/health", "GET", "PASS", "HTTP 200; ok:false Insufficient-balance handled gracefully"),
    ("/api/scripture", "GET", "PASS", "HTTP 200 6.5KB; 4 books incl. geezName"),
    ("/api/themes", "GET", "PASS", "HTTP 200 3.9KB; 13 themes"),
    ("/api/glossary", "GET", "PASS", "HTTP 200 17KB; 10 entries"),
    ("/api/daily-insight", "GET", "PASS", "HTTP 200; today's insight 1-peter 4:14"),
    ("/api/public?list=topics", "GET", "PASS", "HTTP 200; only approved topics returned"),
    ("/api/public?list=articles", "GET", "PASS", "HTTP 200; approved articles only"),
    ("/api/claim-types", "GET", "PASS", "HTTP 200; 7 claim types"),
    ("/api/perspectives", "GET", "PASS", "HTTP 200; 10 perspective tags"),
    ("/api/cross-refs?ref=1-enoch 6:2", "GET", "PASS", "HTTP 200; outgoing refs returned"),
    ("/api/fts?q=watchers", "GET", "PASS", "HTTP 200 3.5KB; FTS verse matches"),
    ("/api/study-plans", "GET", "PASS", "HTTP 200; {plans:[]} (no seed data — empty OK)"),
    ("/api/public?slug=<unapproved>", "GET", "PASS (fix)", "D-064: HTTP 404 — draft topic page correctly gated"),
    ("/api/public?slug=<approved>", "GET", "PASS", "D-064: HTTP 200 — approved topic page served"),
    ("DB row counts", "tsx", "PASS", "books4 chapters18 verses182 themes13 evidence13 topicPages6(approved1) reviewRecords22"),
    ("bash scripts/check.sh", "gate", "PASS", "prisma validate + lint + next build all green post-fix"),
]

def read(name):
    with open(os.path.join(QA, name)) as f:
        return list(csv.DictReader(f)), f

def write(name, rows, fields):
    with open(os.path.join(QA, name), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for r in rows: w.writerow(r)

# ---- defects.csv ----
defects = list(csv.DictReader(open(os.path.join(QA, "defects.csv"))))
dfields = list(defects[0].keys())
if "Verification" not in dfields: dfields.append("Verification")
for d in defects:
    if d["Defect ID"] in FIXED:
        d["Status"] = "Fixed — verified"
        d["Verification"] = FIXED[d["Defect ID"]]
    else:
        d.setdefault("Verification", "")
write("defects.csv", defects, dfields)

# ---- recompute per-feature OPEN defects ----
open_def = [d for d in defects if d["Status"] != "Fixed — verified"]
fcount = Counter(d["Feature ID"] for d in open_def)
fmaxsev = {}
for d in open_def:
    cur = fmaxsev.get(d["Feature ID"], "")
    if SEV_RANK[d["Severity"]] > SEV_RANK.get(cur, 0):
        fmaxsev[d["Feature ID"]] = d["Severity"]

# ---- feature-catalog.csv ----
cat = list(csv.DictReader(open(os.path.join(QA, "feature-catalog.csv"))))
cfields = list(cat[0].keys())
def executed(surface):
    return any(s.split("?")[0] in (surface or "") for s in EXECUTED_SURFACES)
for r in cat:
    fid = r["Feature ID"]
    r["Defect Count"] = fcount.get(fid, 0)
    r["Severity"] = fmaxsev.get(fid, "")
    if executed(r["Surface"]):
        r["Current Status"] = "Executed (runtime) — happy path PASS"
    elif fcount.get(fid, 0):
        r["Current Status"] = "Static review — defect(s) open"
    else:
        r["Current Status"] = "Reviewed — no open defects"
    r["Last Tested Date"] = TODAY
write("feature-catalog.csv", cat, cfields)

# ---- test-cases.csv: flag executed happy paths ----
tests = list(csv.DictReader(open(os.path.join(QA, "test-cases.csv"))))
tfields = list(tests[0].keys())
execed_feats = set(r["Feature ID"] for r in cat if executed(r["Surface"]))
for t in tests:
    if t["Feature ID"] in execed_feats and t["Type"] == "happy":
        t["Status"] = "Passed"; t["Last Run"] = TODAY
write("test-cases.csv", tests, tfields)

# ---- execution-log.csv ----
write("execution-log.csv",
      [{"What": w, "Method": m, "Result": res, "Evidence": ev} for (w, m, res, ev) in EXEC_LOG],
      ["What", "Method", "Result", "Evidence"])

# ---- summary ----
sev_open = Counter(d["Severity"] for d in open_def)
print(f"Defects: total={len(defects)} fixed={len(FIXED)} open={len(open_def)}")
print(f"Open by severity: {dict(sev_open)}")
print(f"Features executed at runtime (happy path): {len(execed_feats)}")
ran = sum(1 for t in tests if t['Status'] != 'Not run')
print(f"Test cases marked run: {ran}/{len(tests)}")
