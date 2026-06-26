// Probe the correct Z.ai API request format for web_search and page_reader
import ZAI from 'z-ai-web-dev-sdk'

const apiKey = (process.env.ZAI_API_KEY || '')
const baseUrl = 'https://api.z.ai/api/paas/v4'

async function tryFetch(url: string, body: any, label: string) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Z-AI-From': 'Z',
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    console.log(`  ${label}: ${res.status} — ${text.slice(0, 300)}`)
    return res.ok
  } catch (e: any) {
    console.log(`  ${label}: ERROR — ${e.message}`)
    return false
  }
}

async function main() {
  console.log('🔧 Probing Z.ai API request formats...\n')

  // Test 1: /v4/tools with different body formats
  console.log('=== /v4/tools endpoint ===')
  await tryFetch(`${baseUrl}/tools`, { name: 'web_search', arguments: { query: 'Dead Sea Scrolls Enoch', num: 3 } }, 'name+arguments')
  await tryFetch(`${baseUrl}/tools`, { tool: 'web_search', input: { query: 'Dead Sea Scrolls Enoch', num: 3 } }, 'tool+input')
  await tryFetch(`${baseUrl}/tools`, { type: 'web_search', query: 'Dead Sea Scrolls Enoch', num: 3 }, 'type+query')
  await tryFetch(`${baseUrl}/tools`, { request_id: 'test1', tool: 'web_search', input: { query: 'Dead Sea Scrolls Enoch', num: 3 } }, 'request_id+tool+input')

  // Test 2: /v4/web_search with different body formats
  console.log('\n=== /v4/web_search endpoint ===')
  await tryFetch(`${baseUrl}/web_search`, { query: 'Dead Sea Scrolls Enoch', num: 3 }, 'query+num')
  await tryFetch(`${baseUrl}/web_search`, { search_query: 'Dead Sea Scrolls Enoch', count: 3 }, 'search_query+count')
  await tryFetch(`${baseUrl}/web_search`, { q: 'Dead Sea Scrolls Enoch', size: 3 }, 'q+size')

  // Test 3: /v4/page_reader
  console.log('\n=== /v4/page_reader endpoint ===')
  await tryFetch(`${baseUrl}/page_reader`, { url: 'https://example.com' }, 'url')
  await tryFetch(`${baseUrl}/page_reader`, { link: 'https://example.com' }, 'link')

  // Test 4: Check the actual SDK chat completions response structure
  console.log('\n=== Chat completions response structure ===')
  const zai = await ZAI.create()
  try {
    const completion = await zai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello in one word.' }],
      thinking: { type: 'disabled' },
    })
    console.log('  Full response:', JSON.stringify(completion, null, 2).slice(0, 800))
  } catch (e: any) {
    console.log('  Error:', e.message)
  }
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
