# enoch.wiki

**The Ethiopian Bible, corroborated.** A study engine for the Ethiopian Tewahedo canon
(1 Enoch, Jubilees, Meqabyan, and more) that pairs scripture with external scholarly
corroboration, multi-perspective framing, and an editorial review gate before anything reaches
the public site.

> Status: **Phase 1 — Private Engine + Editorial Gate + Public Skeleton.**

## Architecture

A three-layer pipeline keeps unvetted research separate from published content:

1. **Private research / ingestion** — scripture canon (Book → Chapter → Verse), themes,
   cross-references, glossary, external `Source`s and `Evidence` with credibility tiers and
   perspective tags.
2. **Editorial approval gate** — every item moves through a review state machine
   (`draft → auto-corroborated → in-review → approved / rejected / needs-revision / archived`)
   with a rubric checklist and an append-only `AuditLog`.
3. **Public presentation** — only `approved` `TopicPage`s and `PublicArticle`s are served, with
   a transparency ("how we vet") view.

Four study pillars sit on top: **daily wisdom**, **AI study tools** (flashcards with SM-2
spaced repetition, study plans), **scripture reader + synergy/theme exploration**, and an
**AI study companion** (chat / RAG / summarize, backed by the Z.ai SDK).

## Tech stack

- **Next.js 16** (App Router, standalone output) · **React 19** · **TypeScript**
- **Prisma 6** over **SQLite**
- **Tailwind v4** + **shadcn/ui**
- **bun** as runtime + package manager
- **Z.ai** (`z-ai-web-dev-sdk`) for AI features, with free fallbacks when no API key is set

## Getting started

```bash
bun install
cp .env.example .env          # then fill in DATABASE_URL (and ZAI_API_KEY for AI features)
bunx prisma generate
bunx prisma db push           # create the SQLite schema
bun run scripts/seed.ts       # optional: seed demo data (the DB is not committed)
bun run dev                   # http://localhost:3000
```

### Environment

See [`.env.example`](./.env.example). `DATABASE_URL` is required; `ZAI_API_KEY` is optional —
without it, web-search / page-reader / health degrade gracefully to free fallbacks.

## Verification gate

`scripts/check.sh` is the local gate (mirrored by CI): Prisma client generate → `eslint .` →
`next build`. It prints `ALL GATES PASS` on success.

```bash
bash scripts/check.sh
```

## Repo tooling

- **`docs/qa/`** — a QA campaign: a canonical feature catalogue (`feature-catalog.csv`), test
  cases, defect log, and `QA-REPORT.md`.
- **`.ralph/` + `.claude/`** — a "Ralph loop" (fresh-context iterative work engine) and a set of
  engineering skills (grilling, TDD, domain-modeling, diagnosing-bugs, …). See `AGENTS.md`.

## License

No license has been chosen yet — all rights reserved until one is added.
