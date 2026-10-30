import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Square,
  Mic,
  Paperclip,
  Shield,
  AlertCircle,
  Check,
  X,
  Loader2,
  UploadCloud,
  HelpCircle,
  Volume2,
  Radio,
} from 'lucide-react';

interface PromptComposerProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStop?: () => void;
  onOpenUploadModal: () => void;
  hasMessages: boolean;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onSendMessage,
  isLoading,
  onStop,
  onOpenUploadModal,
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [isVoiceHelpOpen, setIsVoiceHelpOpen] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 for live meter

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Clean up recording stream & audio context on unmount
  useEffect(() => {
    return () => {
      stopAllMediaStreams();
    };
  }, []);

  const stopAllMediaStreams = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || isRecording) return;

    onSendMessage(input.trim());
    setInput('');
    setInterimText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * Starts live audio recording with Web Audio visualizer and live speech recognition
   */
  const startRecording = async () => {
    setVoiceNotice(null);
    setInterimText('');
    audioChunksRef.current = [];

    // Verify browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceNotice('Microphone access is not supported by this browser. You can type or upload an audio file.');
      setIsVoiceHelpOpen(true);
      return;
    }

    try {
      // 1. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // 2. Setup Web Audio API for real-time sound meter/waveform
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.6;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!streamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            // Scale average to 0-100 range
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            setAudioLevel(normalized);
            animFrameRef.current = requestAnimationFrame(updateMeter);
          };
          animFrameRef.current = requestAnimationFrame(updateMeter);
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext visualizer not available:', audioCtxErr);
      }

      // 3. Determine supported MIME type for MediaRecorder
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          stopAllMediaStreams();
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          if (audioBlob.size > 50) {
            await transcribeAudioBlob(audioBlob, mimeType);
          } else {
            setIsTranscribing(false);
            if (input.trim()) {
              setVoiceNotice('Voice captured! Click Send to ask Disha.');
            } else {
              setVoiceNotice('No audio detected. Please speak closer to your microphone or type your question.');
            }
            setTimeout(() => setVoiceNotice(null), 4000);
          }
        };

        recorder.start(200); // Flush chunks every 200ms
      }

      setIsRecording(true);
      setRecordingSeconds(0);

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // 4. Try Web Speech Recognition for instant real-time live typing
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const liveSpeech = new SpeechRecognition();
          liveSpeech.continuous = true;
          liveSpeech.interimResults = true;
          liveSpeech.lang = 'en-IN';

          liveSpeech.onresult = (evt: any) => {
            let fullTranscript = '';
            for (let i = 0; i < evt.results.length; ++i) {
              fullTranscript += evt.results[i][0].transcript;
            }
            if (fullTranscript.trim()) {
              setInterimText(fullTranscript.trim());
              // Update input directly in real-time so user sees words appearing!
              setInput(fullTranscript.trim());
            }
          };

          liveSpeech.onerror = () => {
            // MediaRecorder handles fallback, so ignore minor speech recognition error
          };

          speechRecognitionRef.current = liveSpeech;
          liveSpeech.start();
        } catch {
          // ignore web speech failure
        }
      }
    } catch (err: any) {
      console.warn('Microphone permission or hardware access issue:', err?.name || err);
      setIsRecording(false);
      stopAllMediaStreams();

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceNotice('Microphone access was blocked. Click "Voice Options" to enable permissions or upload a voice memo.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setVoiceNotice('No microphone found on your device. You can type or upload an audio file.');
      } else {
        setVoiceNotice('Could not start microphone. You can type your question or upload an audio file.');
      }
      setIsVoiceHelpOpen(true);
      setTimeout(() => setVoiceNotice(null), 7000);
    }
  };

  /**
   * Stops recording and triggers transcription
   */
  const stopRecordingAndTranscribe = () => {
    setIsTranscribing(true);
    setIsRecording(false);

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData(); // Flush remaining audio buffer
      } catch {
        // ignore
      }
      mediaRecorderRef.current.stop();
    } else {
      stopAllMediaStreams();
      setIsTranscribing(false);
      if (input.trim()) {
        setVoiceNotice('Voice captured! Click Send or press Enter to ask Disha.');
        setTimeout(() => setVoiceNotice(null), 3500);
      }
    }
  };

  /**
   * Cancels current recording without transcribing
   */
  const cancelRecording = () => {
    stopAllMediaStreams();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
    setInterimText('');
    setVoiceNotice('Voice recording cancelled.');
    setTimeout(() => setVoiceNotice(null), 2500);
  };

  /**
   * Sends audio blob to server /api/transcribe-audio
   */
  const transcribeAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = reader.result as string;
        // Strip codec parameters for server API
        const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();

        const res = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData: base64Audio, mimeType: cleanMime }),
        });

        if (!res.ok) {
          throw new Error('Transcription service responded with error.');
        }

        const data = await res.json();
        const recognized = data.transcript || interimText;

        if (recognized && recognized.trim()) {
          setInput(recognized.trim());
          setVoiceNotice('✓ Voice transcribed successfully! Click Send or press Enter.');
          setTimeout(() => setVoiceNotice(null), 4000);
        } else if (input.trim()) {
          // If we already had words from WebSpeech, keep them
          setVoiceNotice('✓ Voice transcribed! Click Send to ask Disha.');
          setTimeout(() => setVoiceNotice(null), 3000);
        } else {
          setVoiceNotice('No clear speech was recognized. Please speak closer to your microphone or type.');
          setTimeout(() => setVoiceNotice(null), 4500);
        }
        setIsTranscribing(false);
        setInterimText('');
      };

      reader.onerror = () => {
        setIsTranscribing(false);
        setVoiceNotice('Could not process audio. Please type your message.');
        setTimeout(() => setVoiceNotice(null), 3000);
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('Transcription error:', err);
      setIsTranscribing(false);
      // Fallback to interimText or existing input if available
      if (input.trim() || interimText.trim()) {
        if (!input.trim() && interimText.trim()) {
          setInput(interimText.trim());
        }
        setVoiceNotice('Voice captured! Click Send to ask Disha.');
      } else {
        setVoiceNotice('Speech transcription service unavailable. You can type your question.');
      }
      setTimeout(() => setVoiceNotice(null), 4000);
    }
  };

  /**
   * Upload and transcribe an audio file (e.g. voice memo from phone or computer)
   */
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setVoiceNotice('Audio file exceeds 15MB limit. Please choose a smaller voice clip.');
      return;
    }

    setIsTranscribing(true);
    setIsVoiceHelpOpen(false);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Audio = reader.result as string;
        const cleanMime = (file.type || 'audio/wav').split(';')[0].trim();

        const res = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData: base64Audio, mimeType: cleanMime }),
        });

        if (!res.ok) throw new Error('Failed to transcribe audio file.');

        const data = await res.json();
        if (data.transcript && data.transcript.trim()) {
          setInput(data.transcript.trim());
          setVoiceNotice(`✓ Voice memo "${file.name}" transcribed into input! Click Send to ask Disha.`);
        } else {
          setVoiceNotice(`No distinct speech found in "${file.name}".`);
        }
      } catch {
        setVoiceNotice('Could not transcribe audio file. Please type your question directly.');
      } finally {
        setIsTranscribing(false);
        setTimeout(() => setVoiceNotice(null), 4500);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-3 pb-4">
      <div className="max-w-3xl mx-auto px-4">
        {/* Hidden audio file input for voice memo upload fallback */}
        <input
          ref={audioFileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac"
          className="hidden"
          onChange={handleAudioFileUpload}
        />

        {/* Voice status banner */}
        {voiceNotice && (
          <div className="mb-2 p-2.5 rounded-2xl bg-orange-50 text-orange-950 border border-orange-200 text-xs flex items-center justify-between shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-700 flex-shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsVoiceHelpOpen(true)}
                className="text-[10px] uppercase font-bold text-orange-900 underline hover:text-orange-950 cursor-pointer"
              >
                Help
              </button>
              <button
                type="button"
                onClick={() => setVoiceNotice(null)}
                className="text-stone-400 hover:text-stone-700 ml-1 cursor-pointer"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active Recording UI Overlay with Audio Waveform / Volume Meter */}
        {isRecording && (
          <div className="mb-3 p-3.5 bg-white border-2 border-orange-400 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-orange-600 animate-ping absolute" />
                <div className="w-4 h-4 rounded-full bg-orange-600 relative flex items-center justify-center">
                  <Radio className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-xs text-orange-950 uppercase tracking-wider">
                    Recording Voice
                  </span>
                  <span className="font-mono text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 shadow-2xs">
                    {formatTimer(recordingSeconds)}
                  </span>

                  {/* Dynamic Audio Level Meter / Waveform */}
                  <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-full border border-stone-200">
                    <Volume2 className={`w-3 h-3 ${audioLevel > 10 ? 'text-emerald-600' : 'text-stone-400'}`} />
                    <div className="flex items-end gap-0.5 h-3 w-12">
                      {[15, 30, 45, 60, 75, 90].map((threshold, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 rounded-xs transition-all duration-75 ${
                            audioLevel >= threshold
                              ? 'bg-emerald-600'
                              : 'bg-stone-200'
                          }`}
                          style={{
                            height: audioLevel >= threshold ? `${Math.max(4, (idx + 1) * 2)}px` : '3px',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-stone-600 ml-0.5">
                      {audioLevel > 10 ? (
                        <span className="text-emerald-700 font-semibold">Sound detected</span>
                      ) : (
                        'Listening...'
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-600 mt-1 max-w-md">
                  {input ? (
                    <span className="font-medium bg-orange-50 text-orange-900 px-1.5 py-0.5 rounded-md">
                      Transcribing live: "{input}"
                    </span>
                  ) : (
                    'Speak naturally in English, Hindi, Hinglish, or Gujarati...'
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-3.5 py-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={stopRecordingAndTranscribe}
                className="px-4 py-1.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done & Transcribe</span>
              </button>
            </div>
          </div>
        )}

        {/* Transcribing state overlay */}
        {isTranscribing && (
          <div className="mb-3 p-3 bg-white border border-orange-200 rounded-3xl flex items-center gap-2.5 text-xs text-orange-950 shadow-xs animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-orange-600 flex-shrink-0" />
            <span className="font-medium">
              Transcribing your spoken question using Gemini speech model...
            </span>
          </div>
        )}

        {/* Input box container: Pure White Box with Glass Accents */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-white rounded-3xl border border-stone-200/90 focus-within:border-orange-500/80 focus-within:ring-2 focus-within:ring-orange-500/20 shadow-md transition-all"
        >
          <div className="flex items-end p-2.5 sm:p-3 gap-2">
            {/* Attachment / Upload document button: Sleek Glass Button */}
            <button
              type="button"
              onClick={onOpenUploadModal}
              title="Upload redacted marksheet or document checklist"
              aria-label="Upload redacted marksheet or document checklist"
              className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors cursor-pointer flex-shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Microphone / Voice Memo Button: Sleek Glass Pill */}
            <button
              type="button"
              onClick={isRecording ? stopRecordingAndTranscribe : startRecording}
              disabled={isTranscribing}
              title={
                isRecording
                  ? 'Click to finish speaking and transcribe'
                  : 'Record voice memo / speak your question (Microphone)'
              }
              aria-label={isRecording ? 'Finish speaking' : 'Record voice memo'}
              className={`p-2.5 rounded-full transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                isRecording
                  ? 'bg-orange-600 text-white ring-2 ring-orange-400 animate-pulse'
                  : 'text-stone-600 hover:text-orange-900 hover:bg-orange-50/80'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span className="text-xs font-semibold pr-1">Stop</span>
                </>
              ) : (
                <Mic className="w-4 h-4 text-orange-600" />
              )}
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? 'Speaking... your words are transcribing live here...'
                  : 'Ask about streams after 10th, college cutoffs, careers, or trade-offs...'
              }
              className="w-full resize-none border-0 bg-transparent py-1 px-1 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-0 max-h-40 overflow-y-auto leading-relaxed font-normal"
              aria-label="Your career or education question"
            />

            {/* Send or Stop button: High contrast modern action */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                title="Stop response"
                aria-label="Stop current response"
                className="p-2.5 rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer flex-shrink-0 shadow-xs"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || isRecording}
                title="Send message (Enter)"
                aria-label="Send message"
                className={`p-2.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                  input.trim() && !isRecording
                    ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-xs hover:scale-105 active:scale-95'
                    : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Footnote with voice options and quick voice memo triggers */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-stone-500 px-2 gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span>Session privacy • Audio is processed transiently and never stored</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
              className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
              title="Upload a voice memo file from your phone or device"
            >
              <UploadCloud className="w-3 h-3 text-orange-600" />
              <span>Upload Voice Memo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceHelpOpen(true)}
              className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer font-medium"
            >
              <HelpCircle className="w-3 h-3 text-stone-400" />
              <span>Voice Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Options & Microphone Help Modal */}
      {isVoiceHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 animate-scale-up text-xs text-stone-700">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <div className="flex items-center gap-2 font-bold font-serif-editorial text-sm text-stone-900">
                <Mic className="w-4 h-4 text-amber-800" />
                <span>Microphone & Voice Memo Options</span>
              </div>
              <button
                onClick={() => setIsVoiceHelpOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="leading-relaxed text-stone-600">
                Disha supports asking career questions via your voice. You can talk live with your microphone or upload a recorded voice memo (.mp3, .m4a, .wav, .webm).
              </p>

              {/* Option 1: Live mic permissions */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="font-semibold text-stone-900 mb-1 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Option 1: Live Voice Recording</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
                  Click below to start live recording. As you speak, your words will transcribe into the question box in real time.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceHelpOpen(false);
                    startRecording();
                  }}
                  className="w-full py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Microphone Recording</span>
                </button>
              </div>

              {/* Option 2: Upload Audio File */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                <div className="font-semibold text-amber-950 mb-1 flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-amber-800" />
                  <span>Option 2: Upload Audio Voice Memo</span>
                </div>
                <p className="text-[11px] text-stone-600 mb-2">
                  Recorded a question on your phone or voice recorder? Upload your audio file (.mp3, .m4a, .wav, .webm) and Disha will transcribe it.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceHelpOpen(false);
                    audioFileInputRef.current?.click();
                  }}
                  className="w-full py-1.5 border border-amber-300 bg-white hover:bg-amber-100/50 text-amber-900 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-amber-800" />
                  <span>Choose Voice Memo File</span>
                </button>
              </div>

              {/* Option 3: Quick Voice Test Questions */}
              <div>
                <span className="font-semibold text-stone-800 block mb-1.5 text-[11px]">
                  Or try a sample spoken question:
                </span>
                <div className="space-y-1">
                  {[
                    "I like biology but am scared of maths. What should I choose after Class 10?",
                    "What are the best degree options after 12th science in Gujarat?",
                    "Can you explain career opportunities in Biotechnology and Pharmacy?",
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInput(sample);
                        setIsVoiceHelpOpen(false);
                      }}
                      className="w-full p-2 text-left rounded-lg bg-stone-50 hover:bg-amber-50/60 border border-stone-200 text-stone-800 text-[11px] transition-colors truncate cursor-pointer"
                    >
                      "{sample}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsVoiceHelpOpen(false)}
                className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
