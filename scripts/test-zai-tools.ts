// Test web_search and page_reader as tools in chat completions
import ZAI from 'z-ai-web-dev-sdk'

async function main() {
  console.log('🔧 Testing Z.ai function calling via chat completions tools...')

  const zai = await ZAI.create()

  // Test 1: chat completion with web_search tool
  console.log('\n1. Chat with web_search tool:')
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Search the web for: Dead Sea Scrolls 1 Enoch Aramaic fragments. What do you find?',
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Search the web for real-time information',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                num: { type: 'number', description: 'Number of results' },
              },
              required: ['query'],
            },
          },
        },
      ],
      tool_choice: 'auto',
    } as any)

    console.log('  Response received:')
    console.log('  Finish reason:', completion?.choices?.[0]?.finish_reason)
    console.log('  Message:', JSON.stringify(completion?.choices?.[0]?.message, null, 2).slice(0, 500))
  } catch (e: any) {
    console.error('  ✗ Chat with tools failed:', e.message)
  }

  // Test 2: Try chat completion with tools parameter for page_reader
  console.log('\n2. Chat with page_reader tool:')
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Read this webpage and tell me the title: https://www.biblicalarchaeology.org/daily/biblical-artifacts/facts-about-the-dead-sea-scrolls/',
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'page_reader',
            description: 'Read and parse a webpage',
            parameters: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to read' },
              },
              required: ['url'],
            },
          },
        },
      ],
      tool_choice: 'auto',
    } as any)

    console.log('  Response received:')
    console.log('  Finish reason:', completion?.choices?.[0]?.finish_reason)
    console.log('  Message:', JSON.stringify(completion?.choices?.[0]?.message, null, 2).slice(0, 500))
  } catch (e: any) {
    console.error('  ✗ Chat with page_reader tool failed:', e.message)
  }

  // Test 3: Try direct fetch to the Z.ai API for function invoke with different paths
  console.log('\n3. Testing alternative API paths:')
  const apiKey = (process.env.ZAI_API_KEY || '')
  const paths = [
    'https://api.z.ai/api/paas/v4/functions/invoke',
    'https://api.z.ai/api/paas/v4/tools',
    'https://api.z.ai/api/paas/v4/web_search',
    'https://open.bigmodel.cn/api/paas/v4/functions/invoke',
  ]
  for (const url of paths) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-Z-AI-From': 'Z',
        },
        body: JSON.stringify({ function_name: 'web_search', arguments: { query: 'test', num: 1 } }),
      })
      console.log(`  ${url.slice(0, 60)}... → ${res.status}`)
      if (res.ok) {
        const data = await res.json()
        console.log('    SUCCESS:', JSON.stringify(data).slice(0, 200))
      }
    } catch (e: any) {
      console.log(`  ${url.slice(0, 60)}... → ERROR: ${e.message}`)
    }
  }
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
