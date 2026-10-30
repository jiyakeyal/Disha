/**
 * Disha - Server-side Gemini Client
 * Follows gemini-api guidelines with @google/genai SDK
 * Uses User-Agent: 'aistudio-build'
 */

import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn(
    '[Disha Server] Warning: GEMINI_API_KEY is not defined in environment. Model calls will require the secret to be set in AI Studio Secrets.'
  );
}

export const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

