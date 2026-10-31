import { getLLMProvider, getActiveModelName } from '../server/llmAdapter.js';
import { OFFICIAL_AUTHORITIES } from '../server/domainKnowledge.js';

export default function handler(_req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  res.status(200).json({
    status: 'online',
    appName: 'Disha — Career Choices, Clearly',
    activeProvider: getLLMProvider(),
    activeModel: getActiveModelName(),
    hasOpenRouterKey: !!(process.env.OPENROUTER_API_KEY || '').trim(),
    hasGeminiKey: !!(process.env.GEMINI_API_KEY || '').trim(),
    storageMode: 'session-only',
    persistentProfilesEnabled: false,
    persistentProfileReason:
      'Disabled for minor privacy safeguarding and DPDP compliance until verifiable parental consent infrastructure is verified.',
    officialAuthoritiesCount: OFFICIAL_AUTHORITIES.length,
    timestamp: new Date().toISOString(),
  });
}
