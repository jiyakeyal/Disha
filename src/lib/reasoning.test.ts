import test from 'node:test';
import assert from 'node:assert/strict';
import { generateChat } from '../../server/llmAdapter';

test('Gemini 3.8 OpenRouter chat requests low reasoning effort', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalModel = process.env.OPENROUTER_MODEL;
  let body: any;
  try {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_MODEL = 'google/gemini-3.8-flash';
    globalThis.fetch = async (_url, options) => {
      body = JSON.parse(String(options?.body));
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Hello' } }] }), { status: 200 });
    };
    const result = await generateChat({ systemInstruction: 'test', history: [], message: 'Hi', enableSearch: false });
    assert.deepEqual(body.reasoning, { effort: 'low' });
    assert.equal(result.text, 'Hello');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = originalModel;
  }
});
