// Test corrected Z.ai API formats
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
    const status = res.status
    console.log(`  ${label}: ${status} — ${text.slice(0, 400)}`)
    return { ok: res.ok, text }
  } catch (e: any) {
    console.log(`  ${label}: ERROR — ${e.message}`)
    return { ok: false, text: '' }
  }
}

async function main() {
  console.log('🔧 Testing corrected Z.ai API formats...\n')

  // Test 1: web_search with search_query + search_engine
  console.log('=== /v4/web_search with search_engine ===')
  for (const engine of ['google', 'zai', 'bing', 'baidu']) {
    await tryFetch(`${baseUrl}/web_search`, {
      search_query: 'Dead Sea Scrolls 1 Enoch Aramaic fragments',
      search_engine: engine,
    }, `engine=${engine}`)
  }

  // Test 2: chat completions with model parameter
  console.log('\n=== /v4/chat/completions with model ===')
  for (const model of ['glm-4', 'glm-4-flash', 'glm-4-plus', 'glm-4-long', 'glm-4v', 'glm-4-9b']) {
    await tryFetch(`${baseUrl}/chat/completions`, {
      model,
      messages: [{ role: 'user', content: 'Say hello in one word.' }],
    }, `model=${model}`)
  }

  // Test 3: web_search with more params
  console.log('\n=== /v4/web_search with count + recency ===')
  await tryFetch(`${baseUrl}/web_search`, {
    search_query: 'Dead Sea Scrolls 1 Enoch Aramaic fragments',
    search_engine: 'zai',
    count: 5,
  }, 'with count=5')
  await tryFetch(`${baseUrl}/web_search`, {
    search_query: 'Dead Sea Scrolls 1 Enoch Aramaic fragments',
    search_engine: 'zai',
    num: 5,
  }, 'with num=5')
  await tryFetch(`${baseUrl}/web_search`, {
    search_query: 'Dead Sea Scrolls 1 Enoch Aramaic fragments',
    search_engine: 'zai',
    size: 5,
  }, 'with size=5')
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
