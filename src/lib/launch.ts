// Launch-time switch for AI-facing UI.
//
// Owner direction 2026-09-20: hide AI for the initial launch, introduce it
// later. This is the single switch that controls all AI-facing UI.
// Default is OFF (hidden). Set NEXT_PUBLIC_AI_ENABLED=true to show it.
// No AI provider is chosen or wired at launch; all AI/RAG code and API
// routes stay in place for later use.
export const AI_ENABLED = process.env.NEXT_PUBLIC_AI_ENABLED === 'true'

// Scrape/corpus-growth pipeline switch.
//
// Owner direction 2026-09-26: the corpus is already in hand, so scraping is
// dormant — not removed, just off. Default is OFF. Set SCRAPE_ENABLED=true to
// feed the pipeline again (routes /api/scrape and /api/auto-grow plus the
// scripts/scrape-grow.mjs, scripts/crawl.mjs, scripts/eotc-grow.mjs runners).
export const SCRAPE_ENABLED = process.env.SCRAPE_ENABLED === 'true'
