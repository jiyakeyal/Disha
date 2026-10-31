import { generateParentSummaryText } from '../server/llmAdapter.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { history = [] } = req.body || {};

    if (!Array.isArray(history) || history.length === 0) {
      res.status(400).json({ error: 'Conversation history is empty.' });
      return;
    }

    const transcript = history
      .map((h: any) => `${h.role === 'user' ? 'Student' : 'Disha'}: ${h.content}`)
      .join('\n\n');

    const prompt = `Based strictly on the following active career guidance conversation between a student and Disha, create a concise, 1-page "Parent Summary".

Format requirements:
- Use clean Markdown with headers (# Disha — Family Conversation Summary, ## Key Options Discussed, ## Essential Verification Checklist, ## Family Next Steps).
- Keep tone objective, reassuring, and neutral.
- Include 3 specific questions for the family to ask together at the next school or college counselling session.
- End with a prominent disclaimer: "Disha provides structured options and official portal references. Final admissions eligibility and rules must always be verified on official examination/counselling authority portals."`;

    const summaryMarkdown = await generateParentSummaryText(transcript, prompt);

    res.status(200).json({
      summaryMarkdown,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Vercel /api/parent-summary Error]:', error?.message || error);
    res.status(200).json({
      summaryMarkdown:
        "# Disha — Family Conversation Summary\n\n*Unable to generate summary automatically right now.* Please review options directly in the conversation panel.",
      generatedAt: new Date().toISOString(),
    });
  }
}
