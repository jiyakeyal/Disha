/**
 * Disha - Server-side Gemini Client
 * Follows gemini-api guidelines with @google/genai SDK
 * Uses User-Agent: 'aistudio-build'
 */

import { GoogleGenAI } from '@google/genai';

export function getGeminiClient() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey.startsWith('sk-or-')) {
    throw new Error('GEMINI_API_KEY is missing. Set it in your local .env or server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

