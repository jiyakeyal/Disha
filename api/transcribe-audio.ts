import { transcribeAudioData } from '../server/llmAdapter.js';

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
    const { audioData, mimeType } = req.body || {};

    if (!audioData) {
      res.status(400).json({ error: 'Audio data is required for transcription.' });
      return;
    }

    const promptText =
      'You are a high-accuracy speech transcription assistant for Indian students (Classes 9-12). ' +
      'Transcribe all spoken words in this audio exactly. If the student speaks in English, Hindi, Hinglish, or Gujarati, transcribe the words accurately into standard text. ' +
      'Do not add conversational replies, explanations, notes, or quotes. Output ONLY the transcribed words. If the audio has no speech or is only noise, return an empty string.';

    const transcript = await transcribeAudioData(audioData, mimeType, promptText);

    res.status(200).json({
      transcript,
      success: true,
    });
  } catch (error: any) {
    console.error('[Vercel /api/transcribe-audio Error]:', error?.message || error);
    res.status(200).json({
      transcript: '',
      success: false,
      error: 'Audio transcription failed. Please try speaking again or type your question.',
    });
  }
}
