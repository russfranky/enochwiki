// Shared grounded-answer generation — used by the POST /api/rag route and the
// `bun run rag:ask` CLI, so both go through the exact same prompt + provider
// fallback chain (z.ai first, kilo/Tencent-Hy3 free fallback on any failure).
import ZAI from 'z-ai-web-dev-sdk'
import { kiloGenerate } from '@/lib/kilo'

export type GeneratorProvider = 'auto' | 'zai' | 'kilo'

export function buildSystemPrompt(context: string): string {
  return `You are the AI study tutor for Enoch.Wiki (https://enoch.wiki) — a rigorously corroborated knowledge resource for the Ethiopian Orthodox Tewahedo Bible and its wider sacred-text tradition (1 Enoch, Jubilees, the Meqabyan, church-order and liturgical texts, plus the scholarship that corroborates them). A user asked a question, and I retrieved the most relevant items from the local corpus below.

## Retrieved corpus items (your ONLY evidentiary basis)

${context}

## Grounding Rules (NON-NEGOTIABLE)

1. **Cite by the bracketed number and reference** — e.g. "[3] 1 Enoch 6:2 says…", "[5] (source: …) reports…". Never invent a citation.
2. Each retrieved item is tagged with its **kind** (verse | source | evidence | topic | glossary) and, for sources/evidence, a **credibility** score. Weight higher-credibility, peer-reviewed material above low-credibility community "leads," and say so when your basis is thin.
3. **Label every statement**: **[Text]** (what a scripture verse says) · **[Scholarship]** (established academic consensus — name the scholar/source) · **[Interpretation]** (devotional/theological reading — name the tradition, e.g. Ethiopian Orthodox Tewahedo).
4. If the retrieved items don't address the question, say so plainly rather than guessing. You may add clearly-labeled general knowledge, but never present it as corpus-sourced.
5. Distinguish faith claims from historical claims.
6. End with a short "For your reflection" section: 1-3 questions drawing toward wisdom.

## Format
Markdown, dense and focused. Cite references in **bold**.`
}

export async function generateAnswer(
  question: string,
  context: string,
  provider: GeneratorProvider = 'auto'
): Promise<{ answer: string | null; provider: 'zai' | 'kilo' | null }> {
  const systemPrompt = buildSystemPrompt(context)
  let answer: string | null = null
  let usedProvider: 'zai' | 'kilo' | null = null

  if (provider !== 'kilo') {
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        model: 'glm-4.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        thinking: { type: 'enabled' },
      } as any)
      answer = completion?.choices?.[0]?.message?.content ?? null
      if (answer) usedProvider = 'zai'
    } catch {
      // Any z.ai failure (unconfigured, out of quota, network) — fall through to kilo below.
    }
  }

  if (!answer && provider !== 'zai') {
    answer = await kiloGenerate(systemPrompt, question)
    if (answer) usedProvider = 'kilo'
  }

  return { answer, provider: usedProvider }
}
