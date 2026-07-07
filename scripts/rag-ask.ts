#!/usr/bin/env bun
// Ask the RAG corpus a question straight from the terminal — same retrieval +
// generation path as POST /api/rag, no dev server required.
//
//   bun run rag:ask "What does 1 Enoch say about the Watchers on Mount Hermon?"
//   bun run rag:ask --provider kilo "Who is Azazel?"
import { retrieve, buildContext } from '@/lib/rag-retrieval'
import { generateAnswer, type GeneratorProvider } from '@/lib/rag-answer'

// The shared Prisma client (src/lib/db.ts) logs every query via console.log for
// API-route debugging; silence that here so the CLI only prints the answer.
console.log = () => {}

const argv = process.argv.slice(2)
let provider: GeneratorProvider = 'auto'
const pIdx = argv.indexOf('--provider')
if (pIdx >= 0) { provider = argv[pIdx + 1] as GeneratorProvider; argv.splice(pIdx, 2) }
const question = argv.join(' ').trim()

if (!question) {
  console.error('usage: bun run rag:ask [--provider zai|kilo] "<question>"')
  process.exit(1)
}

const { chunks, backend } = await retrieve(question, { k: 8 })
if (!chunks.length) {
  process.stdout.write('No matches in the local corpus. Try rephrasing or broadening the terms.\n')
  process.exit(0)
}

console.error(`[rag-ask] backend=${backend} chunks=${chunks.length} provider=${provider} — generating (kilo takes ~25-30s)…\n`)

const context = buildContext(chunks)
const { answer, provider: usedProvider } = await generateAnswer(question, context, provider)

if (!answer) {
  console.error('[rag-ask] no generation provider available — showing raw retrieved chunks instead:\n')
  process.stdout.write(context + '\n')
  process.exit(1)
}

process.stdout.write(answer + '\n')
console.error(`\n[rag-ask] answered by ${usedProvider}`)
