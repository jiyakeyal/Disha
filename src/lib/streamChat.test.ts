import test from 'node:test';
import assert from 'node:assert/strict';
import { streamChat } from '../../server/streamChat';

test('streamChat decodes fragmented SSE events and forwards text incrementally', async () => {
  const originalFetch = globalThis.fetch, originalKey = process.env.OPENROUTER_API_KEY, originalModel = process.env.OPENROUTER_MODEL;
  try {
    process.env.OPENROUTER_API_KEY = 'test'; process.env.OPENROUTER_MODEL = 'google/gemini-3.8-flash';
    let request: any;
    globalThis.fetch = async (_url, options) => {
      request = JSON.parse(String(options?.body));
      const data = 'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\ndata: {"choices":[{"delta":{"content":"world"}}]}\n\ndata: [DONE]\n\n';
      const encoder = new TextEncoder();
      return new Response(new ReadableStream({ start(controller) { controller.enqueue(encoder.encode(data.slice(0, 17))); controller.enqueue(encoder.encode(data.slice(17))); controller.close(); } }));
    };
    const pieces: string[] = [];
    const result = await streamChat({ systemInstruction: 'test', history: [], message: 'Hi' }, text => pieces.push(text), new AbortController().signal);
    assert.deepEqual(pieces, ['Hello ', 'world']); assert.equal(result.text, 'Hello world');
    assert.equal(request.stream, true); assert.deepEqual(request.reasoning, { effort: 'low' });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = originalModel;
  }
});
