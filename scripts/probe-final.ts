// Final probe — try glm-4-flash (free tier?) and alternative auth methods
const apiKey = (process.env.ZAI_API_KEY || '')
const baseUrl = 'https://api.z.ai/api/paas/v4'

async function probe(url: string, body: any, label: string) {
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
    console.log(`  [${label}] ${res.status}: ${text.slice(0, 250)}`)
    return res.ok
  } catch (e: any) {
    console.log(`  [${label}] ERROR: ${e.message}`)
    return false
  }
}

async function main() {
  const query = 'Dead Sea Scrolls 1 Enoch Aramaic fragments'

  console.log('=== web-search-pro with different models ===')
  for (const model of ['glm-4-flash', 'glm-4', 'glm-4-9b', 'glm-4v', 'glm-4-air', 'glm-4-airx', 'glm-4-long', 'glm-zero-preview']) {
    await probe(`${baseUrl}/tools`, {
      model,
      request_id: `m-${Date.now()}-${model}`.slice(0, 40),
      tool: 'web-search-pro',
      messages: [{ role: 'user', content: query }],
      stream: false,
    }, `model=${model}`)
  }

  console.log('\n=== Try the international endpoint (open.bigmodel.cn) ===')
  await probe('https://open.bigmodel.cn/api/paas/v4/tools', {
    model: 'glm-4-plus',
    request_id: `bg-${Date.now()}`.slice(0, 40),
    tool: 'web-search-pro',
    messages: [{ role: 'user', content: query }],
    stream: false,
  }, 'bigmodel.cn web-search-pro')

  console.log('\n=== Try with X-Chat-Id and X-User-Id headers ===')
  try {
    const res = await fetch(`${baseUrl}/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Z-AI-From': 'Z',
        'X-Chat-Id': 'enoch-wiki',
        'X-User-Id': 'enoch-wiki-editor',
      },
      body: JSON.stringify({
        model: 'glm-4-plus',
        request_id: `h-${Date.now()}`.slice(0, 40),
        tool: 'web-search-pro',
        messages: [{ role: 'user', content: query }],
        stream: false,
      }),
    })
    console.log(`  [with headers] ${res.status}: ${(await res.text()).slice(0, 250)}`)
  } catch (e: any) {
    console.log(`  [with headers] ERROR: ${e.message}`)
  }

  console.log('\n=== Check account balance via user endpoint ===')
  try {
    const res = await fetch(`${baseUrl}/user/balance`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    console.log(`  /user/balance: ${res.status} — ${(await res.text()).slice(0, 300)}`)
  } catch (e: any) {
    console.log(`  /user/balance: ERROR: ${e.message}`)
  }

  console.log('\n=== Check available models ===')
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    console.log(`  /models: ${res.status} — ${(await res.text()).slice(0, 400)}`)
  } catch (e: any) {
    console.log(`  /models: ERROR: ${e.message}`)
  }
}

main().catch(console.error)
