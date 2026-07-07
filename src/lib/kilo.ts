// Free chat-completion fallback via the local `kilo` CLI (@kilocode/cli), which
// proxies to Tencent Hy3 (kilo/tencent/hy3:free) through the user's kilo.ai account —
// no portable API key is exposed (`kilo auth list` shows 0 stored credentials), so
// this shells out to the binary itself rather than calling an HTTP endpoint directly.
import { spawn } from 'node:child_process'

const KILO_BIN = process.env.KILO_BIN || 'kilo'
const KILO_MODEL = process.env.KILO_MODEL || 'kilo/tencent/hy3:free'
const TIMEOUT_MS = 55_000

type KiloEvent = { type: string; part?: { type?: string; text?: string } }

export async function kiloGenerate(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const prompt = `${systemPrompt}\n\n---\n\nUser question: ${userPrompt}`
  return new Promise((resolve) => {
    let settled = false
    const done = (v: string | null) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v) } }

    const child = spawn(KILO_BIN, ['run', prompt, '--format', 'json', '-m', KILO_MODEL], { stdio: ['ignore', 'pipe', 'pipe'] })
    const timer = setTimeout(() => { child.kill('SIGKILL'); done(null) }, TIMEOUT_MS)

    let out = ''
    child.stdout.on('data', (d) => { out += d.toString() })
    child.on('error', () => done(null)) // binary not found, etc.
    child.on('close', () => {
      let text = ''
      for (const line of out.split('\n')) {
        if (!line.trim()) continue
        try {
          const evt = JSON.parse(line) as KiloEvent
          if (evt.type === 'text' && evt.part?.text) text += evt.part.text
        } catch { /* non-JSON noise line */ }
      }
      done(text || null)
    })
  })
}
