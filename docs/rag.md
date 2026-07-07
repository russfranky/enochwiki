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
| [`src/lib/embedder.ts`](../src/lib/embedder.ts) | Pluggable, provider-agnostic embedder — POSTs to any OpenAI-compatible `/embeddings` endpoint (Ollama, OpenAI, Voyage, …). Returns `null` when unconfigured, so the vector path stays dormant instead of erroring. |
| [`scripts/rag-index.mjs`](../scripts/rag-index.mjs) | Chunks the corpus into `RagChunk` rows (text now, embeddings on `--embed`). Idempotent via `contentHash`. |
| `RagChunk` (Prisma) | Persistent, embeddable chunk store. `embedding Bytes?` is `NULL` until you embed. |
| [`src/lib/kilo.ts`](../src/lib/kilo.ts) | Free chat-completion fallback — shells out to the local `kilo` CLI (Tencent Hy3, `kilo/tencent/hy3:free`, cost $0) when z.ai is unavailable. |

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

## Answer generation (POST) — provider fallback chain

`POST /api/rag` tries **z.ai** (`glm-4.5`, thinking-enabled) first, and on *any*
failure (unconfigured, out of quota, network) falls through automatically to
**kilo** — the local [`@kilocode/cli`](https://kilo.ai) binary, which proxies to
Tencent Hy3 for free (`kilo/tencent/hy3:free`, confirmed `cost: 0`). No API key
needed for the fallback: `kilo auth list` shows 0 stored credentials, so
`src/lib/kilo.ts` shells out to `kilo run --format json -m kilo/tencent/hy3:free`
and parses the NDJSON event stream rather than calling an HTTP endpoint directly.
Requires `kilo` on `PATH` and a logged-in kilo.ai session (`kilo auth login`).

The response includes `provider: "zai" | "kilo"` so callers can see which one
answered. Force one explicitly for testing: `{"question": "…", "provider": "kilo"}`.

Latency note: kilo's CLI carries a large fixed agent system-prompt (~14.7K input
tokens) on every call regardless of prompt size, so expect ~25–30s — fine for a
free fallback, not for a low-latency primary path.

### Chat with the corpus from the terminal

`scripts/rag-ask.ts` is the same retrieval + generation path as `POST /api/rag`,
no dev server required:

```bash
bun run rag:ask                          # interactive chat (REPL) — /exit to quit
bun run rag:ask "Who is Azazel?"         # one-shot
bun run rag:ask --provider kilo          # force a provider (chat or one-shot)
```

## Turn on semantic vector search (point it at an embeddings endpoint)

The embedder is provider-agnostic (`src/lib/embedder.ts`) — it needs any
OpenAI-compatible `/embeddings` endpoint. Set three env vars, embed, done.

> Note: the GLM Coding Plan powering the churn does **not** expose an embeddings
> model (its `/paas/v4/embeddings` returns 1211 "Unknown Model"), so semantic search
> uses a separate embedder. Keyword/FTS RAG needs none of this and already works.

**Recommended — Ollama (local, free, no key, any CPU arch):**
```bash
ollama pull nomic-embed-text
export EMBED_BASE_URL=http://localhost:11434/v1
export EMBED_MODEL=nomic-embed-text
bun run rag:index    # make sure chunks exist
bun run rag:embed    # fills RagChunk.embedding
```

**Or a hosted provider** (OpenAI / Voyage / any OpenAI-shaped API):
```bash
export EMBED_BASE_URL=https://api.openai.com/v1
export EMBED_MODEL=text-embedding-3-small
export EMBED_API_KEY=sk-…
bun run rag:embed
```

Then nothing else: `retrieve()` sees embedded chunks (`hasEmbeddings()`), prefers the
vector backend, and `GET/POST /api/rag` start returning semantic hits. Re-run
`rag:embed` after each churn to embed new chunks. Keep the SAME `EMBED_MODEL` for
indexing and querying — queries are embedded by the same endpoint at request time.

> Local native embedders (Transformers.js/onnxruntime-node) were tried and dropped:
> no prebuilt onnxruntime binary exists for x64-darwin (Rosetta), and the WASM
> backend still eagerly requires the native module. The endpoint approach sidesteps
> all of that and works identically on a laptop or in CI (as an Ollama sidecar).

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
