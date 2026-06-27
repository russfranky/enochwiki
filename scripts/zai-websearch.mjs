#!/usr/bin/env node
// Z.AI web search CLI helper.
//
// One-shot web-search query against Z.AI's coding chat-completions endpoint
// (the inline `web_search` tool). Prints the model's answer to stdout and the
// raw search-result list to stderr.
//
// Requires Node.js >= v22 (top-level await + global fetch) or bun.
//
// API key resolution order:
//   1. $Z_AI_API_KEY            (this script's preferred env var)
//   2. $ZAI_API_KEY             (repo convention, see .env.example)
//   3. ~/.config/glm/z-ai.key   (local key file, never committed)
//
// Usage:
//   node scripts/zai-websearch.mjs "your query here"
//   echo "your query" | node scripts/zai-websearch.mjs
//   bun run websearch "your query here"
//
// Optional env overrides:
//   GLM_ENDPOINT  default https://api.z.ai/api/coding/paas/v4/chat/completions
//   GLM_MODEL     default glm-5.2
//   GLM_EFFORT    default low
//   SE            search engine, default search_pro

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const key = process.env.Z_AI_API_KEY ||
  process.env.ZAI_API_KEY ||
  (() => { try { return readFileSync(join(homedir(), '.config/glm/z-ai.key'), 'utf8').trim(); } catch { return ''; } })();
if (!key) { console.error('no z.ai key (set Z_AI_API_KEY / ZAI_API_KEY or ~/.config/glm/z-ai.key)'); process.exit(1); }

const endpoint = process.env.GLM_ENDPOINT || 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const prompt = process.argv.slice(2).join(' ').trim() || readFileSync(0, 'utf8');

const body = {
  model: process.env.GLM_MODEL || 'glm-5.2',
  reasoning_effort: process.env.GLM_EFFORT || 'low',
  max_tokens: 131072,
  temperature: 0.3,
  tools: [{ type: 'web_search', web_search: { enable: true, search_engine: process.env.SE || 'search_pro', search_result: true } }],
  messages: [{ role: 'user', content: prompt }],
  stream: false,
};

const res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
  body: JSON.stringify(body),
});
if (!res.ok) { console.error(`z.ai ${res.status}: ${(await res.text()).slice(0, 800)}`); process.exit(1); }

const data = await res.json();
const choice = data.choices?.[0];
const msg = choice?.message ?? {};

const ws = data.web_search || msg.web_search || choice?.web_search;
if (ws) {
  const arr = Array.isArray(ws) ? ws : (ws.results || ws.search_result || []);
  console.error(`\n[web_search: ${arr.length} results]`);
  for (const r of arr) console.error(`  - ${r.title || r.media || ''} :: ${r.link || r.url || ''}`);
  console.error('');
}

const content = (msg.content ?? '').trim();
if (content) { process.stdout.write(content + '\n'); }
else {
  console.error(`[no content] finish=${choice?.finish_reason} keys=${Object.keys(msg)}`);
  if (msg.reasoning_content) process.stderr.write('[reasoning]\n' + msg.reasoning_content.slice(0, 1500) + '\n');
  console.error('raw(500): ' + JSON.stringify(data).slice(0, 500));
}
