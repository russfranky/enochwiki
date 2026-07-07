#!/usr/bin/env bun
// Chat with the RAG corpus straight from the terminal — same retrieval +
// generation path as POST /api/rag, no dev server required.
//
//   bun run rag:ask                          # interactive chat (REPL)
//   bun run rag:ask "Who is Azazel?"          # one-shot
//   bun run rag:ask --provider kilo           # force a provider (chat or one-shot)
import * as readline from 'node:readline/promises'
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

async function ask(q: string): Promise<void> {
  const { chunks, backend } = await retrieve(q, { k: 8 })
  if (!chunks.length) {
    process.stdout.write('No matches in the local corpus. Try rephrasing or broadening the terms.\n')
    return
  }
  console.error(`[rag-ask] backend=${backend} chunks=${chunks.length} provider=${provider} — generating (kilo takes ~25-30s)…\n`)
  const context = buildContext(chunks)
  const { answer, provider: usedProvider } = await generateAnswer(q, context, provider)
  if (!answer) {
    console.error('[rag-ask] no generation provider available — showing raw retrieved chunks instead:\n')
    process.stdout.write(context + '\n')
    return
  }
  process.stdout.write(answer + '\n')
  console.error(`\n[rag-ask] answered by ${usedProvider}`)
}

if (question) {
  await ask(question)
  process.exit(0)
}

// No question given — interactive chat loop.
process.stderr.write('Enoch.Wiki RAG chat — ask about the corpus (1 Enoch, EOTC canon, sources, evidence…).\nType /exit or Ctrl+D to quit.\n\n')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
for (;;) {
  let line: string
  try {
    line = (await rl.question('you> ')).trim()
  } catch {
    break // Ctrl+D / stream closed
  }
  if (!line) continue
  if (line === '/exit' || line === '/quit') break
  process.stdout.write('\n')
  await ask(line)
  process.stdout.write('\n')
}
rl.close()
process.stderr.write('bye.\n')
