import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLLMProvider, getActiveApiKey, getActiveModelName } from '../../server/llmAdapter.ts';

test('getLLMProvider detects OpenRouter when OPENROUTER_API_KEY is present', () => {
  const origOpenRouter = process.env.OPENROUTER_API_KEY;
  const origGemini = process.env.GEMINI_API_KEY;

  try {
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-test-key-12345';
    process.env.GEMINI_API_KEY = '';

    assert.equal(getLLMProvider(), 'openrouter');
    assert.equal(getActiveApiKey(), 'sk-or-v1-test-key-12345');
  } finally {
    process.env.OPENROUTER_API_KEY = origOpenRouter;
    process.env.GEMINI_API_KEY = origGemini;
  }
});

test('getLLMProvider auto-detects OpenRouter key placed in GEMINI_API_KEY variable', () => {
  const origOpenRouter = process.env.OPENROUTER_API_KEY;
  const origGemini = process.env.GEMINI_API_KEY;

  try {
    process.env.OPENROUTER_API_KEY = '';
    process.env.GEMINI_API_KEY = 'sk-or-v1-accidental-paste';

    assert.equal(getLLMProvider(), 'openrouter');
    assert.equal(getActiveApiKey(), 'sk-or-v1-accidental-paste');
  } finally {
    process.env.OPENROUTER_API_KEY = origOpenRouter;
    process.env.GEMINI_API_KEY = origGemini;
  }
});

test('getLLMProvider defaults to native gemini when standard key is provided', () => {
  const origOpenRouter = process.env.OPENROUTER_API_KEY;
  const origGemini = process.env.GEMINI_API_KEY;

  try {
    process.env.OPENROUTER_API_KEY = '';
    process.env.GEMINI_API_KEY = 'AIzaSyStandardGoogleKey123';

    assert.equal(getLLMProvider(), 'gemini');
    assert.equal(getActiveApiKey(), 'AIzaSyStandardGoogleKey123');
  } finally {
    process.env.OPENROUTER_API_KEY = origOpenRouter;
    process.env.GEMINI_API_KEY = origGemini;
  }
});

test('getActiveModelName resolves OpenRouter default model and override', () => {
  const origOpenRouter = process.env.OPENROUTER_API_KEY;
  const origModel = process.env.OPENROUTER_MODEL;

  try {
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-key';
    delete process.env.OPENROUTER_MODEL;
    assert.equal(getActiveModelName(), 'google/gemini-2.5-flash');

    process.env.OPENROUTER_MODEL = 'google/gemini-2.0-flash-001';
    assert.equal(getActiveModelName(), 'google/gemini-2.0-flash-001');
  } finally {
    process.env.OPENROUTER_API_KEY = origOpenRouter;
    process.env.OPENROUTER_MODEL = origModel;
  }
});
