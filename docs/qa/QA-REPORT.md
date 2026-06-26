# enoch.wiki — QA Campaign Report (Iteration 1)

_Generated 2026-06-26. Source of truth: the CSVs in this folder._

| Artifact | Rows | What it is |
|---|---|---|
| [`feature-catalog.csv`](./feature-catalog.csv) | 74 | **The canonical spreadsheet** — every feature with user story, expected behaviour, edge cases, validation, deps, test-case count, status, defect count, severity, last-tested. |
| [`test-cases.csv`](./test-cases.csv) | 425 | Every generated test case (happy/error/boundary/invalid/security/permission/performance/responsive/accessibility). |
| [`defects.csv`](./defects.csv) | 111 | Every defect found via static + runtime execution, with severity, repro, root-cause hypothesis, status. |
| [`execution-log.csv`](./execution-log.csv) | 16 | What was actually executed at runtime against the seeded DB. |

Regenerate: `python3 scripts/qa/assemble.py <tool-results-dir>` then `python3 scripts/qa/update.py`.

---

## 1. Coverage Summary

- **Surface mapped:** 22 API endpoints (every `route.ts`), 1 page (`/`) composed of 7 study
  components + header/search/export/grow workflows, robots/sitemap, the Z.ai integration lib,
  and the 18-model Prisma domain (3-layer architecture + 4 pillars).
- **Features documented:** **74 / 74 identifiable** (AI gen 16 · study content 17 · editorial
  pipeline 15 · frontend/UI 26). No undocumented routes, screens, or workflows remain → **Phase 1
  exit criteria met.**
- **Test cases designed:** **425** across all 9 categories (avg 5.7/feature) → every feature has a
  suite → **Phase 2 exit criteria met.**
- **Executed:** 16 runtime executions (12 endpoints HTTP-200 against the seeded DB + 2 fix-proof
  checks + DB row counts + the full build/lint gate). 28 happy-path test cases marked Passed.
  The remaining 397 cases are **designed but not yet run** (static review only) → **Phase 3
  partially complete.**

## 2. Features Tested (runtime, happy-path PASS)
scripture · themes · glossary · daily-insight · cross-refs · fts (search) · claim-types ·
perspectives · study-plans · public (topics/articles/slug) · health. All returned 200 with real
seeded data (4 books, 182 verses, 13 themes, 13 evidence, 6 topic pages). `flashcards`,
`study-plans`, `notes` have **no seed data** (empty-but-valid responses).

## 3. Defects Found — 111 total
| Severity | Count | Character |
|---|---|---|
| Critical | 5 | hardcoded API secret; editorial gate bypass (no transition guard / no auth); full-DB export unauthenticated |
| High | 10 | global/unscoped chat; unauthenticated destructive deletes; broken auto-grow query; fabricated public scores; draft-content leak |
| Medium | 32 | missing input validation, unbounded queries/no pagination, missing error handling, schema drift |
| Low | 64 | no rate limiting, missing aria/loading/empty states, minor UX friction |

## 4. Defects Fixed — 5 (verified, gate green)
| ID | Sev | Fix | Verification |
|---|---|---|---|
| D-022 | critical | Removed hardcoded Z.ai key from `src/lib/zai-api.ts`; env-only + graceful free-fallback when unset | `bash scripts/check.sh` green; ⚠ **leaked key must be rotated by owner** |
| D-052 | critical | Added editorial **state-transition guard** to `review` POST (409 on illegal transition — can no longer approve straight from draft) | logic verified; gate green |
| D-064 | high | `public` topic page gated on `reviewState='approved'` (`findFirst`) | **runtime-proven:** unapproved slug → HTTP 404, approved → 200 |
| D-045 | high | Evidence `DELETE` now writes an `AuditLog` entry + 404 on missing id | gate green |
| D-054 | high | Reconciled `Evidence.reviewState` schema comment to include `needs-revision` | `prisma validate` OK |

Note: the known `flashcards/route.ts:98` type error is **already tracked** as Ralph backlog item
**EW-002** on this branch — left for that loop rather than duplicated here.

## 5. Remaining Risks (106 open defects)

**A. Authentication / authorization — WAIVED as Phase-1-by-design** (the app footer declares
_"Phase 1 · Private Engine + Gate + Public Skeleton"_). Real and important, but they are an
architectural Phase-2 epic, not a "smallest safe fix":
- D-053 / D-058 — **no authz** on review/publish; any caller can self-assign `publisher` and push
  content live (the transition guard D-052 now blocks *illegal-state* approvals, but not
  *unauthenticated* ones).
- D-066 — `GET /api/export` dumps the entire private DB unauthenticated.
- D-040 / D-001 / D-005 — evidence world-readable; chat history global & unscoped; `DELETE /api/chat`
  wipes all chat unauthenticated.

**B. Deferred functional defects — real bugs, need a dedicated task** (not auth):
- D-017 (high) — `auto-grow` "verses needing evidence" query is dead code (`.map(()=>'')`); the
  advertised behaviour never runs. Deferred because the fix rewrites a credit-consuming external
  path (not a safe one-liner).
- D-059 / D-060 / D-069 (high) — public corroboration/confidence scores + `sourcesCount` are
  **hardcoded placeholders** ("computed later"); the rubric checklist is computed but never gates
  approval. The "how we vet" numbers are not derived from real sources×perspectives yet.

**C. Environment:** committed `.env` `DATABASE_URL` points at `/home/z/my-project/...` (the original
build container) — the DB layer won't connect on any other machine without overriding it. (`.env`
is owner-managed/gitignored; flagged, not modified.)

## 6. Confidence Score

**Overall campaign: 60 / 100.** Calibrated by component:

| Dimension | Confidence | Why |
|---|---|---|
| Phase 1 discovery completeness | 92% | Systematic over every route/screen/component; small chance a minor UI affordance is uncatalogued |
| Phase 2 test-design coverage | 88% | 425 cases, all categories, every feature ≥1 suite |
| Phase 3 execution | 35% | Only 28/425 run live; rest are static-review only |
| The 5 fixes' correctness | 90% | Gate green + D-064 runtime-proven; others logic-verified |
| "Production-ready / all exit criteria met" | **low** | 3 critical + 7 high remain open (waived/deferred) |

**Completion is NOT declared.** Phase 5/6 exit criteria require zero open critical/high defects;
10 remain (3 critical + 7 high). They are documented, triaged, and either waived-by-design (auth,
group A) or deferred to dedicated tasks (group B). The recursive loop should continue by: (1)
running the remaining 397 designed test cases, (2) deciding the Phase-2 auth epic with the owner,
(3) implementing real score computation + fixing the auto-grow query.
