// Pluggable text embedder for semantic RAG.
//
// Deliberately provider-agnostic: it POSTs to any OpenAI-compatible
// `${EMBED_BASE_URL}/embeddings` endpoint. That makes semantic search a matter of
// configuration, not code — set three env vars and vector retrieval turns on
// (src/lib/rag-retrieval.ts prefers vectors once RagChunk.embedding is filled):
//
//   EMBED_BASE_URL   e.g. http://localhost:11434/v1   (Ollama — local, free, no key)
//                         https://api.openai.com/v1    (OpenAI)
//                         https://api.voyageai.com/v1  (Voyage)
//   EMBED_MODEL      e.g. nomic-embed-text | text-embedding-3-small | voyage-3
//   EMBED_API_KEY    optional (Ollama/LM Studio need none)
//
// Why not z.ai? The GLM Coding Plan exposes chat + web search/reader but NOT an
// embeddings model (its /paas/v4/embeddings returns 1211 "Unknown Model"). So the
// embedder is decoupled from zai-api on purpose. Returns `null` when unconfigured
// or on error, so callers fall back to FTS/keyword retrieval instead of throwing.

const BASE_URL = (process.env.EMBED_BASE_URL || '').replace(/\/$/, '')
const MODEL = process.env.EMBED_MODEL || ''
const API_KEY = process.env.EMBED_API_KEY || ''

/** True when an embeddings endpoint is configured (base URL + model). */
export function embeddingsConfigured(): boolean {
  return Boolean(BASE_URL && MODEL)
}

export function embedderInfo(): { configured: boolean; baseUrl: string; model: string } {
  return { configured: embeddingsConfigured(), baseUrl: BASE_URL, model: MODEL }
}

/** Embed a batch. Returns one vector per input (or `null` per slot / all-null on failure). */
export async function embedTexts(texts: string[]): Promise<(number[] | null)[]> {
  if (!embeddingsConfigured() || texts.length === 0) return texts.map(() => null)
  try {
    const res = await fetch(`${BASE_URL}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}) },
      body: JSON.stringify({ model: MODEL, input: texts }),
    })
    if (!res.ok) return texts.map(() => null)
    const data = await res.json()
    const rows: unknown[] = Array.isArray(data?.data) ? data.data : []
    const bySlot: (number[] | null)[] = texts.map(() => null)
    rows.forEach((r: any, idx) => {
      const i = typeof r?.index === 'number' ? r.index : idx
      if (Array.isArray(r?.embedding) && i < bySlot.length) bySlot[i] = r.embedding as number[]
    })
    return bySlot
  } catch {
    return texts.map(() => null)
  }
}

/** Embed a single string → vector, or `null` if embeddings are unavailable. */
export async function embedText(text: string): Promise<number[] | null> {
  const [v] = await embedTexts([text])
  return v ?? null
}
