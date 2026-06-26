// Test the correct BigModel/Z.ai tools API format
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
    console.log(`  ${label}: ${res.status} — ${text.slice(0, 400)}`)
    return text
  } catch (e: any) {
    console.log(`  ${label}: ERROR — ${e.message}`)
    return ''
  }
}

async function main() {
  console.log('🔧 Testing Z.ai tools API with correct BigModel format...\n')

  // The BigModel tools API uses: POST /v4/tools with {request_id, tool, messages}
  // tool values: "web-search", "page-reader" (with hyphens)
  const requestId = `enoch-wiki-${Date.now()}`.slice(0, 30)

  console.log('=== /v4/tools with web-search (messages format) ===')
  await tryFetch(`${baseUrl}/tools`, {
    request_id: requestId,
    tool: 'web-search',
    messages: [{ role: 'user', content: 'Dead Sea Scrolls 1 Enoch Aramaic fragments' }],
  }, 'web-search + messages')

  console.log('\n=== /v4/tools with web_search (underscore) ===')
  await tryFetch(`${baseUrl}/tools`, {
    request_id: `${requestId}2`,
    tool: 'web_search',
    messages: [{ role: 'user', content: 'Dead Sea Scrolls 1 Enoch Aramaic fragments' }],
  }, 'web_search + messages')

  console.log('\n=== /v4/tools with page-reader ===')
  await tryFetch(`${baseUrl}/tools`, {
    request_id: `${requestId}3`,
    tool: 'page-reader',
    messages: [{ role: 'user', content: 'https://www.biblicalarchaeology.org/daily/biblical-artifacts/facts-about-the-dead-sea-scrolls/' }],
  }, 'page-reader + messages')

  console.log('\n=== /v4/tools with page_reader (underscore) ===')
  await tryFetch(`${baseUrl}/tools`, {
    request_id: `${requestId}4`,
    tool: 'page_reader',
    messages: [{ role: 'user', content: 'https://www.biblicalarchaeology.org/daily/biblical-artifacts/facts-about-the-dead-sea-scrolls/' }],
  }, 'page_reader + messages')

  // Also try the chat completions with glm-4-plus and tools
  console.log('\n=== Chat completions with glm-4-plus + web_search tool ===')
  await tryFetch(`${baseUrl}/chat/completions`, {
    model: 'glm-4-plus',
    messages: [{ role: 'user', content: 'Search for: Dead Sea Scrolls Enoch' }],
    tools: [{ type: 'function', function: { name: 'web_search', description: 'Search the web', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } }],
    tool_choice: 'auto',
  }, 'glm-4-plus + tools')
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
