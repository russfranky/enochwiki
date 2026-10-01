# Landing page integration — plan

## Objective

Ship the Mobbin-grounded landing page as the SEO front door of enoch.wiki at `/`,
and move the current app homepage to `/read`. Owner approved 2026-10-01:
"Whatever is the most seo friendly" → landing page owns the root, the app moves.

Design source of truth: `workspace/your_files/enoch-wiki-landing-page/enoch-wiki-landing-page.html`
(exported 2026-10-01, includes the CTA fix "Open app →" and the AI-companion claim
verified against `src/app/api/chat/route.ts` + `src/app/api/summarize/route.ts`).

## Invariants (non-negotiable)

1. **No emdashes.** Owner order 2026-10-01. Zero `—` characters in any new or
   changed copy. Rewrite with commas, colons, periods, or parentheses.
2. **Brevity.** Tighten copy wherever possible without changing meaning or
   dropping verified claims.
3. **Copy claims match the real app.** Reader, search, Knowledge Graph, Timeline,
   Themes, Study Tools (flashcards, study plans), AI companion (answers questions,
   summarizes passages, cites sources — `/api/chat`, `/api/summarize`), three-layer
   editorial pipeline, certainty tiers. Nothing invented.
4. **`/read` keeps everything.** Reader, chat, right panels, `?panel=explore`
   deep links, mobile bottom nav, theme toggle — all working after the move.
5. **Brand.** Parchment, antique gold, indigo, serif headlines — the repo's
   existing theme tokens. Respects light/dark mode.
6. **SEO.** Metadata (title, description, OG) on `/`; single `h1`; semantic
   heading order; alt text on images; sitemap updated; server-rendered content.
7. **Viewports.** 390px and 1440px render clean: no overflow, no wrapped CTA,
   no dead space, visible focus, working anchors, 44px+ touch targets.
8. **Gates.** `bash scripts/check.sh` → ALL GATES PASS before any commit.
9. **Merge.** Only under the standing enochwiki merge grant, and only with the
   repo's exact-head CI green and read. Never merge on red/unread CI.
10. **Scope.** Protected paths untouched: `prisma/schema.prisma`,
    `prisma/migrations/`, `src/app/api/health/route.ts`, `next.config.ts`,
    `Caddyfile`, `scripts/check.sh`, `.ralph/`.
