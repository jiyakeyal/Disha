import { buildRuntimeSystemInstruction } from '../server/systemPrompt.js';
import { getRecommendedPortalsForQuery } from '../server/domainKnowledge.js';
import { generateChat } from '../server/llmAdapter.js';

export default async function handler(req: any, res: any) {
  // Always allow CORS for web clients
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { message, history = [], personaStyle, language } = req.body || {};

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'A valid message string is required.' });
      return;
    }

    const systemInstruction = buildRuntimeSystemInstruction({
      personaStyle,
      language,
    });

    const checkedAt = new Date().toISOString();

    const result = await generateChat({
      systemInstruction,
      history,
      message,
      enableSearch: true,
    });

    const recommendedPortals = getRecommendedPortalsForQuery(message);

    res.status(200).json({
      text: result.text,
      citations: result.citations || [],
      recommendedPortals,
      checkedAt,
      model: result.model,
      provider: result.provider,
      grounded: result.grounded,
      groundingNote: result.groundingNote,
    });
  } catch (error: any) {
    console.error('[Vercel /api/chat Error]:', error?.message || error);
    const recommendedPortals = getRecommendedPortalsForQuery(req.body?.message || '');
    res.status(200).json({
      text:
        "**Service Connectivity Note:** Disha is online, but encountered an error contacting OpenRouter.\n\n" +
        "**System Note:** " + (error?.message || 'Check your OpenRouter API Key and model availability.') + "\n\n" +
        "**Troubleshooting:**\n" +
        "1. Verify that `OPENROUTER_API_KEY` is added in Vercel Settings → Environment Variables.\n" +
        "2. Ensure your key has active credits or free access on [openrouter.ai](https://openrouter.ai).\n" +
        "3. Click **Retry** below.",
      citations: [],
      recommendedPortals,
      checkedAt: new Date().toISOString(),
      model: 'openrouter/fallback',
      provider: 'openrouter',
      grounded: false,
      groundingNote: 'Verify OPENROUTER_API_KEY on Vercel.',
      isError: true,
    });
  }
}
