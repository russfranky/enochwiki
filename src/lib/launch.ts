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

// Named launch states. The switches above are booleans, but the product
// behavior has three named conditions and every consumer used to re-derive
// them (the health route even read the raw env vars with !!, which reports
// "enabled" for the string "false"; launch.ts is the only reader now).
// AI: 'on' | 'off' (hidden). Scrape: 'on' | 'dormant'.
export type AiState = 'on' | 'off'
export const AI_STATE: AiState = AI_ENABLED ? 'on' : 'off'

export type ScrapeState = 'on' | 'dormant'
export const SCRAPE_STATE: ScrapeState = SCRAPE_ENABLED ? 'on' : 'dormant'

// The one dormant response body for the scrape-fed routes. Before this,
// /api/scrape and /api/auto-grow each defined their own identical copy.
export const SCRAPE_DORMANT_BODY = {
  error: 'Scrape pipeline is dormant. Set SCRAPE_ENABLED=true to feed it again.',
} as const
