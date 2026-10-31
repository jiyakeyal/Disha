import { analyzeDocumentImage } from '../server/llmAdapter.js';

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
    const { base64Data, mimeType, filename } = req.body || {};

    if (!base64Data || !mimeType) {
      res.status(400).json({ error: 'Base64 file data and MIME type are required.' });
      return;
    }

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

    res.status(200).json({
      analysis,
      checkedAt: new Date().toISOString(),
      filename: filename || 'uploaded_document',
    });
  } catch (error: any) {
    console.error('[Vercel /api/analyze-document Error]:', error?.message || error);
    res.status(500).json({
      error: 'Unable to analyze the document. Please ensure the image is clear and under 5MB, or enter your subjects manually in the chat.',
    });
  }
}
