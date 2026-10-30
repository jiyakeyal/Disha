/**
 * Disha - Server-side Express API Routes
 * Handles LLM generation with OpenRouter & Google Gemini adapter,
 * transient document analysis, parent summaries, audio transcription, and system status.
 */

import { Router, Request, Response } from 'express';
import { buildRuntimeSystemInstruction } from './systemPrompt';
import { getRecommendedPortalsForQuery, OFFICIAL_AUTHORITIES } from './domainKnowledge';
import {
  generateChat,
  generateParentSummaryText,
  analyzeDocumentImage,
  transcribeAudioData,
  getLLMProvider,
  getActiveModelName,
} from './llmAdapter';

export const apiRouter = Router();

interface ChatMessageInput {
  role: 'user' | 'model';
  content: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatMessageInput[];
  personaStyle?: 'friendly_expert' | 'question_coach' | 'calm_guide';
  language?: 'english' | 'hinglish' | 'gujarati_blend';
}

/**
 * POST /api/chat
 * Primary conversation endpoint with universal adapter (OpenRouter / Google Gemini)
 */
apiRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history = [], personaStyle, language } = req.body as ChatRequestBody;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'A valid message string is required.' });
      return;
    }

    if (message.length > 4000) {
      res.status(400).json({ error: 'Message exceeds maximum length of 4000 characters.' });
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

    // Always provide recommended official portals for admissions & state guidance
    const recommendedPortals = getRecommendedPortalsForQuery(message);

    res.json({
      text: result.text,
      citations: result.citations,
      recommendedPortals,
      checkedAt,
      model: result.model,
      provider: result.provider,
      grounded: result.grounded,
      groundingNote: result.groundingNote,
    });
  } catch (error: any) {
    console.error('[Disha API Error in /api/chat]:', error?.message || error);
    res.status(500).json({
      error:
        'Disha could not connect to the education guidance service right now. Please check your API key configuration in environment variables or try again shortly.',
      detail: error?.message || 'Network or model availability issue.',
    });
  }
});

/**
 * POST /api/analyze-document
 * Transient analysis of user-uploaded redacted marksheet or document checklist.
 * Raw file is NEVER saved to disk or persistent storage.
 */
apiRouter.post('/analyze-document', async (req: Request, res: Response): Promise<void> => {
  try {
    const { base64Data, mimeType, filename } = req.body;

    if (!base64Data || !mimeType) {
      res.status(400).json({ error: 'Base64 file data and MIME type are required.' });
      return;
    }

    // Enforce acceptable MIME types: png, jpeg, webp, pdf
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(mimeType)) {
      res.status(400).json({
        error: 'Unsupported file type. Please upload a PNG, JPEG, WEBP image or a PDF document.',
      });
      return;
    }

    const promptText = `You are Disha's document review assistant for Indian students (Classes 9–12).
Analyze this uploaded marksheet or academic document checklist.
IMPORTANT SAFETY INSTRUCTIONS:
1. Extract ONLY visible, legible subject names and corresponding scores/marks/grades.
2. Flag any numbers or subjects that are blurry, ambiguous, or uncertain.
3. DO NOT look for or transcribe personal identifiers like Aadhaar numbers, phone numbers, home addresses, roll numbers, or candidate photographs. If any are visible, advise the student to keep them redacted.
4. Formulate 2-3 specific confirmation questions asking the student to verify what was read before using it for any eligibility checking.
5. Provide a clear note: "A mark sheet alone does not guarantee eligibility; official board rules, cutoff ranks, and admission notices must be verified directly with the exam portal."`;

    const analysis = await analyzeDocumentImage(base64Data, mimeType, promptText);

    res.json({
      analysis,
      checkedAt: new Date().toISOString(),
      filename: filename || 'uploaded_document',
    });
  } catch (error: any) {
    console.error('[Disha API Error in /analyze-document]:', error?.message || error);
    res.status(500).json({
      error: 'Unable to analyze the document. Please ensure the image is clear and under 5MB, or enter your subjects manually in the chat.',
    });
  }
});

/**
 * POST /api/parent-summary
 * Generates a concise, 1-page printable summary for parents based strictly on active conversation.
 */
apiRouter.post('/parent-summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { history = [] } = req.body;

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

    res.json({
      summaryMarkdown,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Disha API Error in /parent-summary]:', error?.message || error);
    res.status(500).json({
      error: 'Could not generate parent summary. Please try again with the current conversation.',
    });
  }
});

/**
 * POST /api/transcribe-audio
 * Multimodal speech transcription endpoint (OpenRouter / Google Gemini).
 */
apiRouter.post('/transcribe-audio', async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioData, mimeType } = req.body;

    if (!audioData) {
      res.status(400).json({ error: 'Audio data is required for transcription.' });
      return;
    }

    const promptText =
      'You are a high-accuracy speech transcription assistant for Indian students (Classes 9-12). ' +
      'Transcribe all spoken words in this audio exactly. If the student speaks in English, Hindi, Hinglish, or Gujarati, transcribe the words accurately into standard text. ' +
      'Do not add conversational replies, explanations, notes, or quotes. Output ONLY the transcribed words. If the audio has no speech or is only noise, return an empty string.';

    const transcript = await transcribeAudioData(audioData, mimeType, promptText);

    res.json({
      transcript,
      success: true,
    });
  } catch (error: any) {
    console.error('[Disha API Error in /transcribe-audio]:', error?.message || error);
    res.status(500).json({
      error: 'Audio transcription failed. Please try speaking again or type your question.',
    });
  }
});

/**
 * GET /api/system-status
 * Health check & runtime capabilities (no secrets exposed)
 */
apiRouter.get('/system-status', (_req: Request, res: Response): void => {
  res.json({
    status: 'online',
    appName: 'Disha — Career Choices, Clearly',
    activeProvider: getLLMProvider(),
    activeModel: getActiveModelName(),
    storageMode: 'session-only',
    persistentProfilesEnabled: false,
    persistentProfileReason:
      'Disabled for minor privacy safeguarding and DPDP compliance until verifiable parental consent infrastructure is verified.',
    officialAuthoritiesCount: OFFICIAL_AUTHORITIES.length,
    timestamp: new Date().toISOString(),
  });
});
