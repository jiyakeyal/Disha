/**
 * Disha - LLM Adapter Layer
 * Provides a unified interface supporting both:
 * 1. Google Gemini via native @google/genai SDK (Google AI Studio / GCP)
 * 2. OpenRouter via OpenAI-compatible REST API (for GitHub / Vercel deployments with OpenRouter API keys)
 */

import { ai, DEFAULT_MODEL } from './gemini';
import { parseGroundingMetadata } from './domainKnowledge';

export type LLMProvider = 'openrouter' | 'gemini';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  systemInstruction: string;
  history: ChatMessage[];
  message: string;
  enableSearch?: boolean;
}

export interface ChatCompletionResult {
  text: string;
  citations: Array<{ title: string; url: string; hostname?: string; isOfficial?: boolean }>;
  model: string;
  provider: LLMProvider;
  grounded: boolean;
  groundingNote?: string;
}

/**
 * Detects whether the runtime should use OpenRouter or Google AI Studio.
 * Auto-detects if OPENROUTER_API_KEY is present OR if GEMINI_API_KEY starts with "sk-or-".
 */
export function getLLMProvider(): LLMProvider {
  const openRouterKey = process.env.OPENROUTER_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';

  if (openRouterKey.trim() || geminiKey.trim().startsWith('sk-or-')) {
    return 'openrouter';
  }
  return 'gemini';
}

/**
 * Retrieves the active API key for the detected provider.
 */
export function getActiveApiKey(): string {
  const openRouterKey = process.env.OPENROUTER_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';

  if (openRouterKey.trim()) return openRouterKey.trim();
  if (geminiKey.trim().startsWith('sk-or-')) return geminiKey.trim();
  return geminiKey.trim();
}

/**
 * Retrieves the model ID to request based on provider and environment overrides.
 */
export function getActiveModelName(): string {
  const provider = getLLMProvider();
  if (provider === 'openrouter') {
    // OpenRouter uses namespaced model names like "google/gemini-2.5-flash" or "google/gemini-2.0-flash-001"
    return process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
  }
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/**
 * Circuit breaker for Google Search grounding quota exhaustion on Google AI Studio
 */
let googleSearchGroundingExhaustedUntil = 0;

/**
 * Universal Chat Generation
 */
export async function generateChat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const provider = getLLMProvider();
  const apiKey = getActiveApiKey();
  const modelName = getActiveModelName();

  if (provider === 'openrouter') {
    return await generateChatWithOpenRouter(options, apiKey, modelName);
  } else {
    return await generateChatWithGoogleGemini(options, modelName);
  }
}

/**
 * OpenRouter Chat Implementation (OpenAI-compatible REST API)
 */
async function generateChatWithOpenRouter(
  options: ChatCompletionOptions,
  apiKey: string,
  modelName: string
): Promise<ChatCompletionResult> {
  const { systemInstruction, history, message, enableSearch = true } = options;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing. Please set it in your Vercel or local environment variables.');
  }

  // Construct standard OpenAI message array
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemInstruction },
  ];

  const recentHistory = history.slice(-8);
  for (const item of recentHistory) {
    if (item.content && item.content.trim()) {
      messages.push({
        role: item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user',
        content: item.content.trim(),
      });
    }
  }

  messages.push({
    role: 'user',
    content: message.trim(),
  });

  const requestBody: any = {
    model: modelName,
    messages: messages,
    temperature: 0.7,
  };

  // Optionally enable OpenRouter web search plugin for ground truth verification
  if (enableSearch) {
    requestBody.plugins = [{ id: 'web' }];
  }

  const appUrl = process.env.APP_URL || 'https://disha-career.vercel.app';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': appUrl,
      'X-Title': 'Disha - Career Choices Clearly',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OpenRouter API Error]:', response.status, errorText);
    throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const replyContent = data.choices?.[0]?.message?.content || '';

  // Parse any citations provided in OpenRouter metadata or annotations
  const citations: Array<{ title: string; url: string; hostname?: string }> = [];
  if (Array.isArray(data.citations)) {
    for (const c of data.citations) {
      if (typeof c === 'string') {
        try {
          const u = new URL(c);
          citations.push({ title: u.hostname, url: c, hostname: u.hostname });
        } catch {
          // ignore invalid url
        }
      } else if (c?.url) {
        citations.push({ title: c.title || c.url, url: c.url });
      }
    }
  }

  return {
    text: replyContent,
    citations,
    model: modelName,
    provider: 'openrouter',
    grounded: citations.length > 0,
    groundingNote:
      citations.length === 0
        ? 'Answered using OpenRouter Gemini model with authoritative guidance rules. Always verify current dates on official portals.'
        : undefined,
  };
}

/**
 * Google Native Gemini Implementation (@google/genai SDK)
 */
async function generateChatWithGoogleGemini(
  options: ChatCompletionOptions,
  modelName: string
): Promise<ChatCompletionResult> {
  const { systemInstruction, history, message } = options;

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  const recentHistory = history.slice(-8);

  for (const item of recentHistory) {
    if (item.content && item.content.trim()) {
      contents.push({
        role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content.trim() }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: message.trim() }],
  });

  let responseText = '';
  let citations: any[] = [];
  let searchGroundingSucceeded = false;
  let groundingNote: string | undefined;

  const isGroundingQuotaPaused = Date.now() < googleSearchGroundingExhaustedUntil;

  if (!isGroundingQuotaPaused) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          tools: [{ googleSearch: {} }],
        },
      });

      responseText = response.text || '';
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      citations = parseGroundingMetadata(groundingMetadata);
      searchGroundingSucceeded = true;
    } catch (groundingError: any) {
      const errMsg = String(groundingError?.message || '');
      const isQuotaExhausted =
        errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');

      if (isQuotaExhausted) {
        googleSearchGroundingExhaustedUntil = Date.now() + 15 * 60 * 1000;
        console.log('[Disha Server] Google Search grounding quota paused. Falling back to core model.');
      }

      groundingNote =
        'Live search grounding quota is unavailable. Changing admission dates and fees are not verified in this session; please verify with the official portals below.';

      let fallbackResponse: any;
      try {
        fallbackResponse = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });
      } catch (liteErr) {
        fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });
      }
      responseText = fallbackResponse.text || '';
    }
  } else {
    groundingNote =
      'Live search grounding quota is unavailable. Changing admission dates and fees are not verified in this session; please verify with the official portals below.';

    let fallbackResponse: any;
    try {
      fallbackResponse = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });
    } catch (liteErr) {
      fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });
    }
    responseText = fallbackResponse.text || '';
  }

  return {
    text: responseText,
    citations,
    model: modelName,
    provider: 'gemini',
    grounded: searchGroundingSucceeded && citations.length > 0,
    groundingNote,
  };
}

/**
 * Universal Parent Summary Generation
 */
export async function generateParentSummaryText(transcript: string, promptText: string): Promise<string> {
  const provider = getLLMProvider();
  const apiKey = getActiveApiKey();
  const modelName = getActiveModelName();

  if (provider === 'openrouter') {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You generate neutral, balanced, 1-page parent summaries for Indian career guidance.',
          },
          {
            role: 'user',
            content: `${promptText}\n\nTranscript:\n${transcript}`,
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter summary failed: ${await response.text()}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Unable to generate parent summary.';
  } else {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `${promptText}\n\nTranscript:\n${transcript}`,
    });
    return response.text || 'Unable to generate parent summary.';
  }
}

/**
 * Universal Document Image Analysis
 */
export async function analyzeDocumentImage(
  base64Data: string,
  mimeType: string,
  promptText: string
): Promise<string> {
  const provider = getLLMProvider();
  const apiKey = getActiveApiKey();
  const modelName = getActiveModelName();
  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

  if (provider === 'openrouter') {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter document analysis failed: ${await response.text()}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Could not interpret document.';
  } else {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          { text: promptText },
        ],
      },
    });
    return response.text || 'Could not interpret document clearly.';
  }
}

/**
 * Universal Audio Transcription
 */
export async function transcribeAudioData(
  audioData: string,
  mimeType: string,
  promptText: string
): Promise<string> {
  const provider = getLLMProvider();
  const apiKey = getActiveApiKey();
  const modelName = getActiveModelName();
  const cleanBase64 = audioData.replace(/^data:[^;]+;base64,/, '');

  let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
  if (cleanMime === 'audio/m4a' || cleanMime === 'audio/x-m4a') cleanMime = 'audio/mp4';
  if (cleanMime === 'audio/mpeg') cleanMime = 'audio/mp3';

  if (provider === 'openrouter') {
    // OpenRouter Gemini models accept inline data URLs in multimodal messages
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              {
                type: 'image_url', // OpenRouter standard data uri field
                image_url: {
                  url: `data:${cleanMime};base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      // If multimodal audio is not supported on this specific OpenRouter route, log warning
      console.warn('[OpenRouter Audio Transcription]:', await response.text());
      return '';
    }
    const data = await response.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  } else {
    // Native Google GenAI
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          inlineData: {
            mimeType: cleanMime,
            data: cleanBase64,
          },
        },
        promptText,
      ],
    });
    return (response.text || '').trim();
  }
}
