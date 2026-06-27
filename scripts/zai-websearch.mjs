#!/usr/bin/env node
// Z.AI Coding Plan web search CLI — uses the MCP `web_search_prime` tool, which
// draws the GLM Coding Plan "Web Search / Reader / Zread" quota (NOT the
// pay-as-you-go REST /paas/v4/web_search, which 1113s without a balance, and NOT
// chat/completions, which 1308s when the 5-hour premium quota is spent).
//
// Requires Node.js >= v22 (global fetch) or bun.
// Docs: https://docs.z.ai/guides/tools/web-search
//
// API key resolution order:
//   1. $ZAI_API_KEY / $Z_AI_API_KEY   (env)
//   2. ~/.config/glm/z-ai.key         (local key file, never committed)
//
// Usage:
//   node scripts/zai-websearch.mjs "your query"  [--recency oneWeek] [--n 5]
//   echo "your query" | node scripts/zai-websearch.mjs
//   bun run websearch "your query"

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ENDPOINT = process.env.ZAI_MCP_WEB_SEARCH_URL || 'https://api.z.ai/api/mcp/web_search_prime/mcp';

const key = process.env.ZAI_API_KEY ||
  process.env.Z_AI_API_KEY ||
  (() => { try { return readFileSync(join(homedir(), '.config/glm/z-ai.key'), 'utf8').trim(); } catch { return ''; } })();
if (!key) { console.error('no z.ai key (set ZAI_API_KEY or ~/.config/glm/z-ai.key)'); process.exit(1); }

// Parse args: positional query + optional --recency / --n
const argv = process.argv.slice(2);
let recency, n = 8;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--recency') { recency = argv[i + 1]; argv.splice(i, 2); i--; }
  else if (argv[i] === '--n') { n = parseInt(argv[i + 1], 10) || 8; argv.splice(i, 2); i--; }
}
const query = argv.join(' ').trim() || readFileSync(0, 'utf8').trim();
if (!query) { console.error('usage: zai-websearch.mjs "query" [--recency oneWeek] [--n 5]'); process.exit(2); }

async function rpc(method, params, sid, id = 1) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(sid ? { 'Mcp-Session-Id': sid } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const text = await res.text();
  if (!res.ok) { console.error(`z.ai MCP ${method} ${res.status}: ${text.slice(0, 300)}`); process.exit(1); }
  const newSid = res.headers.get('Mcp-Session-Id') || res.headers.get('mcp-session-id');
  let json = null;
  for (let line of text.split('\n')) {
    line = line.trim();
    if (line.startsWith('data:')) line = line.slice(5).trim();
    if (line.startsWith('{')) { try { json = JSON.parse(line); break; } catch { /* keep scanning */ } }
  }
  return { sid: newSid, json };
}

const init = await rpc('initialize', {
  protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'enochwiki', version: '1' },
});
const args = { search_query: query };
if (recency) args.search_recency_filter = recency;
const { json } = await rpc('tools/call', { name: 'web_search_prime', arguments: args }, init.sid, 3);

if (!json || !json.result) { console.error(`no result: ${json?.error ? JSON.stringify(json.error) : 'empty'}`); process.exit(1); }
let parsed = json.result.content?.[0]?.text ?? '';
for (let i = 0; i < 2; i++) { if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch { break; } } }

if (Array.isArray(parsed)) {
  console.error(`[web_search_prime: ${parsed.length} results]\n`);
  for (const r of parsed.slice(0, n)) {
    if (r && typeof r === 'object' && (r.link || r.url)) {
      process.stdout.write(`• ${r.title || ''}\n  ${r.link || r.url}\n  ${(r.content || '').slice(0, 200)}\n\n`);
    }
  }
} else {
  process.stdout.write(String(parsed).slice(0, 1500) + '\n');
}
