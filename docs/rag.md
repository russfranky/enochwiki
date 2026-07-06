# RAG over the corpus

The corpus (verses, scholarly **Sources**, **Evidence**, **TopicPages**, **Glossary**)
is retrievable as a knowledge base, and the AI Q&A endpoint is grounded in what it
retrieves — with citations and credibility weighting. Semantic (vector) search is
wired but **dormant**: it turns on the moment chunks are embedded, with no code
changes. That's the whole design goal — *effective now, trivial to deepen later.*

## Pieces

| File | Role |
|---|---|
| [`src/lib/rag-retrieval.ts`](../src/lib/rag-retrieval.ts) | The seam. `retrieve(query, opts)` returns ranked `RetrievedChunk[]` across all corpus kinds; `buildContext()` formats them for an LLM. Backend is auto-selected. |
| [`src/app/api/rag/route.ts`](../src/app/api/rag/route.ts) | `GET /api/rag?q=…` → retrieval only. `POST /api/rag {question}` → retrieval + grounded GLM answer with citations. |
| [`src/lib/zai-api.ts`](../src/lib/zai-api.ts) | `embedText()` / `embedTexts()` — z.ai embeddings; the only external call the vector path needs. Returns `null` gracefully when no key/balance. |
| [`scripts/rag-index.mjs`](../scripts/rag-index.mjs) | Chunks the corpus into `RagChunk` rows (text now, embeddings on `--embed`). Idempotent via `contentHash`. |
| `RagChunk` (Prisma) | Persistent, embeddable chunk store. `embedding Bytes?` is `NULL` until you embed. |

## Retrieval backends (chosen automatically, in order)

1. **vector** — cosine over `RagChunk.embedding`. Auto-selected once *any* chunk is
   embedded. Brute-force cosine in JS is fine at current scale.
2. **fts** — SQLite **FTS5** (`sources_fts` / `evidence_fts` / `verses_fts`, already
   defined in `scripts/fts5-migration.sql`). Default once the FTS tables are built.
3. **keyword** — Prisma `contains` + token-overlap. Zero setup; always works.

`retrieve()` tries them top-down and falls through on empty/error, so the endpoint
behaves the same regardless of what's set up — you just get better relevance as you
enable more. The response includes `backend` so callers can see which ran.

## Use it now (keyword/FTS — no embeddings, no cost)

```bash
# build FTS tables once (keyword search over sources/evidence/verses)
bun scripts/setup-fts.ts

# stage chunks for the whole corpus (also good hygiene for later embedding)
bun run rag:index

# query
curl 'http://localhost:3000/api/rag?q=watchers%20forbidden%20knowledge&topK=8'
curl -X POST http://localhost:3000/api/rag -H 'content-type: application/json' \
     -d '{"question":"What does 1 Enoch say about the Watchers on Mount Hermon?"}'
```

Filter by corpus kind or credibility:
`/api/rag?q=azazel&kinds=source,evidence&minCredibility=0.75`.

## Turn on semantic vector search later (three steps)

1. Ensure `ZAI_API_KEY` (or `~/.config/glm/z-ai.key`) is set and the account has
   embeddings quota. Model defaults to `embedding-3` (`ZAI_EMBED_MODEL` to override).
2. Embed the chunks:
   ```bash
   bun run rag:index          # make sure chunks exist
   bun run rag:embed          # fills RagChunk.embedding
   ```
3. Nothing else. `retrieve()` sees embedded chunks (`hasEmbeddings()`), prefers the
   vector backend, and `GET/POST /api/rag` start returning semantic hits. Re-run
   `rag:embed` after each churn to embed the new chunks.

## Scaling past in-memory cosine

When the corpus outgrows a brute-force scan (roughly tens of thousands of chunks),
replace the loop in `vectorRetrieve()` with a vector index — `sqlite-vec` (a `vec0`
virtual table alongside the existing FTS5) is the lowest-friction option since we're
already on SQLite. The seam (`retrieve()` / `RagChunk.embedding`) does not change.

## Hybrid (optional, later)

For best relevance, blend vector + FTS scores (reciprocal-rank fusion) inside
`retrieve()`. The per-kind normalized scores already returned by both backends make
this a small, localized addition — no schema or API change.
```
