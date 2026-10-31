/**
 * Disha - LLM Adapter Layer
 * Provides a unified interface supporting both:
 * 1. Google Gemini via native @google/genai SDK (Google AI Studio / GCP)
 * 2. OpenRouter via OpenAI-compatible REST API (for GitHub / Vercel deployments with OpenRouter API keys)
 */

import { getGeminiClient, DEFAULT_MODEL } from './gemini.js';
import { parseGroundingMetadata } from './domainKnowledge.js';

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
  const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');

  if (openRouterKey || geminiKey.startsWith('sk-or-')) {
    return 'openrouter';
  }
  return 'gemini';
}

/**
 * Retrieves the active API key for the detected provider.
 */
export function getActiveApiKey(): string {
  const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');

  if (openRouterKey) return openRouterKey;
  if (geminiKey.startsWith('sk-or-')) return geminiKey;
  return geminiKey;
}

/**
 * Retrieves the model ID to request based on provider and environment overrides.
 */
export function getActiveModelName(): string {
  const provider = getLLMProvider();
  if (provider === 'openrouter') {
    let raw = (process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash').trim().replace(/^['"]|['"]$/g, '');
    if (raw.startsWith('gemini') && !raw.includes('/')) {
      raw = `google/${raw}`;
    }
    return raw || 'google/gemini-2.5-flash';
  }
  return (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Circuit breaker for Google Search grounding quota exhaustion on Google AI Studio
 */
let googleSearchGroundingExhaustedUntil = 0;

/**
 * Universal Chat Generation
 */
/**
 * Universal Chat Generation
 */
export async function generateChat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const provider = getLLMProvider();
  const apiKey = getActiveApiKey();
  const modelName = getActiveModelName();

  try {
    if (provider === 'openrouter') {
      return await generateChatWithOpenRouter(options, apiKey, modelName);
    } else {
      return await generateChatWithGoogleGemini(options, modelName);
    }
  } catch (primaryError: any) {
    console.error(`[Disha LLM Primary Error - ${provider}]:`, primaryError?.message || primaryError);

    // Cross-provider fallback if both keys exist
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';

    if (provider === 'openrouter' && geminiKey.trim() && !geminiKey.trim().startsWith('sk-or-')) {
      console.log('[Disha LLM Fallback] Falling back from OpenRouter to Google Gemini SDK...');
      try {
        return await generateChatWithGoogleGemini(options, 'gemini-2.5-flash');
      } catch (fbErr: any) {
        console.error('[Disha LLM Fallback Gemini Error]:', fbErr?.message || fbErr);
      }
    } else if (provider === 'gemini' && openRouterKey.trim()) {
      console.log('[Disha LLM Fallback] Falling back from Google Gemini SDK to OpenRouter...');
      try {
        return await generateChatWithOpenRouter(options, openRouterKey.trim(), 'google/gemini-2.5-flash');
      } catch (fbErr: any) {
        console.error('[Disha LLM Fallback OpenRouter Error]:', fbErr?.message || fbErr);
      }
    }

    // Safe user-facing response if all providers/models fail
    return {
      text:
        "**Service Connectivity Note:** Disha is temporarily unable to reach the AI model provider. \n\n" +
        "**Possible Causes:**\n" +
        "- Missing or invalid API Key (`OPENROUTER_API_KEY` or `GEMINI_API_KEY` in environment variables).\n" +
        "- Temporary rate limit or network glitch from the model provider.\n\n" +
        "**What you can do:**\n" +
        "1. Verify that `OPENROUTER_API_KEY` or `GEMINI_API_KEY` is set in your Vercel / environment settings.\n" +
        "2. Click the **Retry** button below or ask your question again in a moment.",
      citations: [],
      model: modelName,
      provider,
      grounded: false,
      groundingNote: 'Model service temporarily unreachable. Please check API keys in environment variables.',
    };
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

  if (modelName === 'google/gemini-3.8-flash') {
    requestBody.reasoning = { effort: 'low' };
  }

  if (enableSearch) {
    requestBody.plugins = [{ id: 'web' }];
  }

  const appUrl = process.env.APP_URL || 'https://disha-career.vercel.app';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': appUrl,
    'X-Title': 'Disha - Career Choices, Clearly',
  };

  let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  // Retry without plugins if plugin request fails
  if (!response.ok && requestBody.plugins) {
    console.warn('[OpenRouter] Search plugin request returned error. Retrying without web plugin...');
    delete requestBody.plugins;
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
  }

  // Fallback to alternative OpenRouter models if requested model fails
  if (!response.ok) {
    const fallbackModels = [
      'google/gemini-2.5-flash',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct',
    ];

    for (const fbModel of fallbackModels) {
      if (fbModel === modelName) continue;
      console.log(`[OpenRouter] Primary model ${modelName} failed (${response.status}). Retrying with ${fbModel}...`);
      requestBody.model = fbModel;
      delete requestBody.reasoning;
      delete requestBody.plugins;

      const fbResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (fbResp.ok) {
        response = fbResp;
        modelName = fbModel;
        break;
      }
    }
  }

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

  const attemptGeneration = async (model: string, useSearch: boolean): Promise<string> => {
    const config: any = {
      systemInstruction: systemInstruction,
      temperature: 0.7,
    };
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }
    const resp = await getGeminiClient().models.generateContent({
      model: model,
      contents: contents,
      config: config,
    });
    if (useSearch) {
      const candidate = resp.candidates?.[0];
      citations = parseGroundingMetadata(candidate?.groundingMetadata);
      searchGroundingSucceeded = true;
    }
    return resp.text || '';
  };

  try {
    if (!isGroundingQuotaPaused) {
      try {
        responseText = await attemptGeneration(modelName, true);
      } catch (groundingError: any) {
        const errMsg = String(groundingError?.message || '');
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
          googleSearchGroundingExhaustedUntil = Date.now() + 15 * 60 * 1000;
          console.log('[Disha Server] Google Search grounding quota paused. Falling back to core model.');
        }
        groundingNote =
          'Live search grounding quota is unavailable. Changing admission dates and fees are not verified in this session; please verify with official portals.';
        responseText = await attemptGeneration(modelName, false);
      }
    } else {
      groundingNote =
        'Live search grounding quota is unavailable. Changing admission dates and fees are not verified in this session; please verify with official portals.';
      responseText = await attemptGeneration(modelName, false);
    }
  } catch (primaryModelErr: any) {
    console.warn(`[Google Gemini] Primary model ${modelName} failed. Trying fallback models...`);
    const fallbackModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let succeeded = false;
    for (const fbModel of fallbackModels) {
      try {
        responseText = await attemptGeneration(fbModel, false);
        modelName = fbModel;
        succeeded = true;
        break;
      } catch {
        // continue
      }
    }
    if (!succeeded) {
      throw primaryModelErr;
    }
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
    const response = await getGeminiClient().models.generateContent({
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
    const response = await getGeminiClient().models.generateContent({
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
    const response = await getGeminiClient().models.generateContent({
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
