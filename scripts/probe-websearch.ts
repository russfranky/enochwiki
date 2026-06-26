// Comprehensive probe of Z.ai web search API — find the working format
const apiKey = (process.env.ZAI_API_KEY || '')
const baseUrl = 'https://api.z.ai/api/paas/v4'

async function probe(url: string, body: any, label: string): Promise<any> {
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
    console.log(`  [${label}] ${res.status}: ${text.slice(0, 300)}`)
    if (res.ok) {
      try { return JSON.parse(text) } catch { return null }
    }
    return null
  } catch (e: any) {
    console.log(`  [${label}] ERROR: ${e.message}`)
    return null
  }
}

async function main() {
  console.log('🔍 Probing Z.ai web search API formats...\n')

  const query = 'Dead Sea Scrolls 1 Enoch Aramaic fragments'

  // ── /v4/tools endpoint (BigModel tools API) ────────────────────────────────
  console.log('=== /v4/tools with various tool names ===')
  for (const toolName of ['web-search-pro', 'web-search', 'web_search', 'web_search_pro', 'search-pro', 'extract-reader', 'page-reader', 'page_reader']) {
    await probe(`${baseUrl}/tools`, {
      model: 'glm-4-plus',
      request_id: `probe-${Date.now()}-${toolName}`.slice(0, 40),
      tool: toolName,
      messages: [{ role: 'user', content: query }],
      stream: false,
    }, `tool=${toolName}`)
  }

  console.log('\n=== /v4/tools without model param ===')
  for (const toolName of ['web-search-pro', 'web-search', 'web_search']) {
    await probe(`${baseUrl}/tools`, {
      request_id: `probe2-${Date.now()}-${toolName}`.slice(0, 40),
      tool: toolName,
      messages: [{ role: 'user', content: query }],
      stream: false,
    }, `no-model tool=${toolName}`)
  }

  console.log('\n=== /v4/tools with messages as plain text ===')
  await probe(`${baseUrl}/tools`, {
    request_id: `probe3-${Date.now()}`.slice(0, 40),
    tool: 'web-search-pro',
    input: query,
    stream: false,
  }, 'tool=web-search-pro input=string')

  console.log('\n=== /v4/tools with content array ===')
  await probe(`${baseUrl}/tools`, {
    request_id: `probe4-${Date.now()}`.slice(0, 40),
    tool: 'web-search-pro',
    messages: [{ role: 'user', content: [{ type: 'text', text: query }] }],
    stream: false,
  }, 'tool=web-search-pro content=array')

  // ── /v4/web_search direct endpoint ─────────────────────────────────────────
  console.log('\n=== /v4/web_search direct ===')
  await probe(`${baseUrl}/web_search`, {
    search_query: query,
    search_engine: 'zai',
    count: 3,
  }, 'search_query+search_engine=zai+count')

  await probe(`${baseUrl}/web_search`, {
    search_query: query,
    search_engine: 'google',
    count: 3,
  }, 'search_engine=google')

  await probe(`${baseUrl}/web_search`, {
    search_query: query,
    search_engine: 'zai',
    num: 3,
    recency_days: 365,
  }, 'with recency_days')

  // ── Try the SDK's functions.invoke with a fresh SDK create ────────────────
  console.log('\n=== SDK functions.invoke (web_search) ===')
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const results = await zai.functions.invoke('web_search', { query, num: 3 })
    console.log(`  SDK web_search: ${Array.isArray(results) ? results.length + ' results' : JSON.stringify(results).slice(0, 200)}`)
    if (Array.isArray(results) && results.length > 0) {
      console.log(`  First result: ${JSON.stringify(results[0]).slice(0, 200)}`)
    }
  } catch (e: any) {
    console.log(`  SDK web_search error: ${e.message}`)
  }

  console.log('\n=== SDK functions.invoke (web-search-pro) ===')
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const results = await zai.functions.invoke('web-search-pro', { query, num: 3 } as any)
    console.log(`  SDK web-search-pro: ${Array.isArray(results) ? results.length + ' results' : JSON.stringify(results).slice(0, 200)}`)
  } catch (e: any) {
    console.log(`  SDK web-search-pro error: ${e.message}`)
  }
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
