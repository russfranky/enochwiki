// Launch-time switch for AI-facing UI.
//
// Owner direction 2026-09-20: hide AI for the initial launch, introduce it
// later. This is the single switch that controls all AI-facing UI.
// Default is OFF (hidden). Set NEXT_PUBLIC_AI_ENABLED=true to show it.
// No AI provider is chosen or wired at launch; all AI/RAG code and API
// routes stay in place for later use.
export const AI_ENABLED = process.env.NEXT_PUBLIC_AI_ENABLED === 'true'
