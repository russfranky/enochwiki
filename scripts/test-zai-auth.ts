// Verify Z.ai SDK authentication with the new API key
import ZAI from 'z-ai-web-dev-sdk'

async function main() {
  console.log('🔧 Testing Z.ai SDK authentication...')

  const zai = await ZAI.create()

  // Test 1: simple chat completion
  console.log('\n1. Chat completion test:')
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a test bot. Reply with exactly: "Auth OK"' },
        { role: 'user', content: 'Test' },
      ],
      thinking: { type: 'disabled' },
    })
    const reply = completion?.choices?.[0]?.message?.content
    console.log('  ✓ Chat response:', reply?.slice(0, 80))
  } catch (e: any) {
    console.error('  ✗ Chat failed:', e.message)
    return
  }

  // Test 2: web_search function
  console.log('\n2. Web search test:')
  try {
    const results = await zai.functions.invoke('web_search', {
      query: 'Dead Sea Scrolls 1 Enoch Aramaic fragments',
      num: 3,
    })
    if (Array.isArray(results)) {
      console.log(`  ✓ Web search returned ${results.length} results`)
      results.forEach((r: any, i: number) => {
        console.log(`    [${i + 1}] ${r.name?.slice(0, 70)}`)
        console.log(`        ${r.url?.slice(0, 80)}`)
        console.log(`        ${r.snippet?.slice(0, 100)}`)
      })
    } else {
      console.log('  ⚠ Unexpected response:', JSON.stringify(results).slice(0, 200))
    }
  } catch (e: any) {
    console.error('  ✗ Web search failed:', e.message)
  }

  // Test 3: page_reader function
  console.log('\n3. Page reader test:')
  try {
    const page = await zai.functions.invoke('page_reader', {
      url: 'https://www.biblicalarchaeology.org/daily/biblical-artifacts/facts-about-the-dead-sea-scrolls/',
    })
    if (page?.data?.title) {
      console.log(`  ✓ Page reader retrieved: ${page.data.title}`)
      console.log(`    URL: ${page.data.url}`)
      console.log(`    HTML length: ${page.data.html?.length || 0} chars`)
      if (page.data.publishedTime) {
        console.log(`    Published: ${page.data.publishedTime}`)
      }
    } else {
      console.log('  ⚠ Unexpected response:', JSON.stringify(page).slice(0, 200))
    }
  } catch (e: any) {
    console.error('  ✗ Page reader failed:', e.message)
  }

  console.log('\n✅ Z.ai SDK authentication verified.')
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
