import { ChatCompletionOptions, getActiveApiKey, getActiveModelName, getLLMProvider, generateChat } from './llmAdapter.js';

export async function streamChat(options: ChatCompletionOptions, onText: (text: string) => void, signal: AbortSignal) {
  if (getLLMProvider() !== 'openrouter') {
    const result = await generateChat(options);
    onText(result.text);
    return result;
  }
  const apiKey = getActiveApiKey();
  if (!apiKey) throw new Error('Missing API key');
  const model = getActiveModelName();
  const messages = [
    { role: 'system', content: options.systemInstruction },
    ...options.history.slice(-8).filter(item => item.content?.trim()).map(item => ({ role: item.role === 'user' ? 'user' : 'assistant', content: item.content.trim() })),
    { role: 'user', content: options.message.trim() },
  ];
  const body: any = { model, messages, temperature: 0.7, stream: true };
  if (model === 'google/gemini-3.8-flash') body.reasoning = { effort: 'low' };
  if (options.enableSearch !== false) body.plugins = [{ id: 'web' }];
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': process.env.APP_URL || 'https://disha-career.vercel.app', 'X-Title': 'Disha - Career Choices, Clearly' };
  const request = () => fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers, body: JSON.stringify(body), signal });
  let response = await request();
  if (!response.ok && body.plugins) { delete body.plugins; response = await request(); }
  if (!response.ok || !response.body) throw new Error(`Model service returned ${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', text = '', doneEvent = false;
  const citations: Array<{ title: string; url: string; hostname?: string }> = [];
  const handle = (event: string) => {
    const data = event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!data) return;
    if (data === '[DONE]') { doneEvent = true; return; }
    const chunk = JSON.parse(data);
    if (chunk.error) throw new Error(chunk.error.message || 'Model stream failed');
    const delta = chunk.choices?.[0]?.delta;
    if (typeof delta?.content === 'string' && delta.content) { text += delta.content; onText(delta.content); }
    for (const annotation of delta?.annotations || chunk.choices?.[0]?.message?.annotations || []) {
      const item = annotation.url_citation || annotation;
      if (item?.url && !citations.some(c => c.url === item.url)) citations.push({ title: item.title || item.url, url: item.url });
    }
  };
  try {
    while (true) {
      const part = await reader.read();
      buffer += decoder.decode(part.value, { stream: !part.done });
      const events = buffer.split(/\r?\n\r?\n/); buffer = events.pop() || '';
      events.forEach(handle);
      if (part.done) break;
    }
    if (buffer.trim()) handle(buffer);
  } finally { reader.releaseLock(); }
  if (!doneEvent) throw new Error('Model stream ended unexpectedly');
  if (!text.trim()) throw new Error('Model returned an empty response');
  return { text, citations, model, provider: 'openrouter' as const, grounded: citations.length > 0 };
}
