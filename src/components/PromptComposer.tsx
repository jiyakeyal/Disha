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
              setInput(fullTranscript.trim());
            }
          };

          liveSpeech.onerror = () => {
            // MediaRecorder handles fallback
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
        mediaRecorderRef.current.requestData();
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

  const transcribeAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = reader.result as string;
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
    <div className="sticky bottom-0 pt-3 pb-5">
      <div className="max-w-3xl mx-auto px-4">
        {/* Hidden audio file input for voice memo upload */}
        <input
          ref={audioFileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac"
          className="hidden"
          onChange={handleAudioFileUpload}
        />

        {/* Voice status banner */}
        {voiceNotice && (
          <div className="mb-2 p-2.5 rounded-2xl glass-card text-stone-900 text-xs flex items-center justify-between shadow-md animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-800 flex-shrink-0" />
              <span className="font-medium">{voiceNotice}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsVoiceHelpOpen(true)}
                className="text-[10px] uppercase font-bold text-orange-950 underline cursor-pointer"
              >
                Help
              </button>
              <button
                type="button"
                onClick={() => setVoiceNotice(null)}
                className="text-stone-500 hover:text-stone-800 ml-1 cursor-pointer"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active Recording UI Overlay with Audio Waveform / Volume Meter */}
        {isRecording && (
          <div className="mb-3 p-3.5 glass-card rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-fade-in border-2 border-orange-300">
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
                    Recording Live
                  </span>
                  <span className="font-mono text-xs font-semibold text-orange-900 bg-white/70 px-2.5 py-0.5 rounded-full border border-white/80 shadow-2xs">
                    {formatTimer(recordingSeconds)}
                  </span>

                  {/* Dynamic Audio Level Meter / Waveform */}
                  <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-full border border-white/80">
                    <Volume2 className={`w-3 h-3 ${audioLevel > 10 ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <div className="flex items-end gap-0.5 h-3 w-12">
                      {[15, 30, 45, 60, 75, 90].map((threshold, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 rounded-xs transition-all duration-75 ${
                            audioLevel >= threshold
                              ? 'bg-emerald-600'
                              : 'bg-stone-300/60'
                          }`}
                          style={{
                            height: audioLevel >= threshold ? `${Math.max(4, (idx + 1) * 2)}px` : '3px',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-stone-700 ml-0.5">
                      {audioLevel > 10 ? (
                        <span className="text-emerald-800 font-semibold">Sound detected</span>
                      ) : (
                        'Listening...'
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-orange-950 mt-1 max-w-md">
                  {input ? (
                    <span className="font-medium bg-white/60 px-2 py-0.5 rounded-full">
                      Transcribing: "{input}"
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
                className="glass-pill-btn px-3 py-1.5 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={stopRecordingAndTranscribe}
                className="glass-pill-btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done & Transcribe</span>
              </button>
            </div>
          </div>
        )}

        {/* Transcribing state overlay */}
        {isTranscribing && (
          <div className="mb-3 p-3 glass-card rounded-2xl flex items-center gap-2.5 text-xs text-orange-950 shadow-md animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-orange-800 flex-shrink-0" />
            <span className="font-medium">
              Transcribing speech with Gemini speech model...
            </span>
          </div>
        )}

        {/* 
          Main Input Capsule:
          Styled as a large frosted glass pill container (rounded-full) just like the reference capsule!
        */}
        <form
          onSubmit={handleSubmit}
          className="relative glass-capsule rounded-full shadow-xl transition-all focus-within:border-white focus-within:ring-2 focus-within:ring-white/50"
        >
          <div className="flex items-center px-3 py-1.5 sm:py-2 gap-1.5 sm:gap-2">
            {/* Attachment button */}
            <button
              type="button"
              onClick={onOpenUploadModal}
              title="Upload marksheet or document checklist"
              aria-label="Upload marksheet or document checklist"
              className="p-2 text-stone-700 hover:text-stone-900 glass-pill-btn rounded-full cursor-pointer flex-shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Mic / Record Pill */}
            <button
              type="button"
              onClick={isRecording ? stopRecordingAndTranscribe : startRecording}
              disabled={isTranscribing}
              title={
                isRecording
                  ? 'Click to finish speaking and transcribe'
                  : 'Record voice memo / speak question'
              }
              aria-label={isRecording ? 'Finish speaking' : 'Record voice memo'}
              className={`p-2 rounded-full cursor-pointer flex-shrink-0 flex items-center gap-1.5 transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400 animate-pulse'
                  : 'glass-pill-btn text-orange-950'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[11px] font-semibold pr-1">Stop</span>
                </>
              ) : (
                <Mic className="w-4 h-4 text-orange-900" />
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
                  ? 'Speaking... words appear here live...'
                  : 'Ask about streams, cutoffs, careers, or trade-offs...'
              }
              className="w-full resize-none border-0 bg-transparent py-1.5 px-2 text-sm text-stone-900 placeholder:text-stone-600/80 focus:outline-hidden focus:ring-0 max-h-32 overflow-y-auto font-medium"
              aria-label="Your career or education question"
            />

            {/* Send or Stop button styled as glowing pill */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                title="Stop response"
                aria-label="Stop current response"
                className="p-2.5 rounded-full bg-stone-900 text-white hover:bg-black transition-colors cursor-pointer flex-shrink-0 shadow-md"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || isRecording}
                title="Send message (Enter)"
                aria-label="Send message"
                className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  input.trim() && !isRecording
                    ? 'glass-pill-btn-primary cursor-pointer active:scale-95'
                    : 'bg-white/30 text-stone-400 border border-white/40 cursor-not-allowed'
                }`}
              >
                <span className="text-xs font-semibold hidden sm:inline">Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Footnote with voice options and quick voice memo triggers */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-stone-800/90 px-3 gap-2">
          <div className="flex items-center gap-1.5 font-medium drop-shadow-2xs">
            <Shield className="w-3 h-3 text-emerald-800 flex-shrink-0" />
            <span>Session privacy • Audio processed transiently and never stored</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
              className="glass-pill-btn px-2.5 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              title="Upload a voice memo file from your device"
            >
              <UploadCloud className="w-3 h-3 text-orange-900" />
              <span>Upload Voice Memo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceHelpOpen(true)}
              className="glass-pill-btn px-2.5 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer font-medium"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Voice Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Options & Microphone Help Modal */}
      {isVoiceHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-up text-xs text-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-white/60 mb-3.5">
              <div className="flex items-center gap-2 font-bold font-serif-editorial text-base text-stone-900">
                <Mic className="w-4 h-4 text-orange-800" />
                <span>Microphone & Voice Memo Options</span>
              </div>
              <button
                onClick={() => setIsVoiceHelpOpen(false)}
                className="glass-pill-btn p-1.5 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <p className="leading-relaxed text-stone-800 font-medium">
                Disha supports asking career questions via voice. Speak live through your microphone or upload a recorded voice memo.
              </p>

              {/* Option 1: Live mic permissions */}
              <div className="p-3.5 bg-white/50 rounded-2xl border border-white/70">
                <div className="font-semibold text-stone-900 mb-1 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Option 1: Live Voice Recording</span>
                </div>
                <p className="text-[11px] text-stone-700 leading-relaxed mb-2.5">
                  Click below to start live recording. As you speak, words transcribe into the question box in real time.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceHelpOpen(false);
                    startRecording();
                  }}
                  className="w-full py-2 glass-pill-btn-primary font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Microphone Recording</span>
                </button>
              </div>

              {/* Option 2: Upload Audio File */}
              <div className="p-3.5 bg-orange-100/40 rounded-2xl border border-white/70">
                <div className="font-semibold text-orange-950 mb-1 flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-orange-800" />
                  <span>Option 2: Upload Audio Voice Memo</span>
                </div>
                <p className="text-[11px] text-stone-700 mb-2">
                  Recorded a question on your phone or voice recorder? Upload your audio file (.mp3, .m4a, .wav, .webm).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceHelpOpen(false);
                    audioFileInputRef.current?.click();
                  }}
                  className="w-full py-2 glass-pill-btn font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-orange-800" />
                  <span>Choose Voice Memo File</span>
                </button>
              </div>

              {/* Option 3: Quick Voice Test Questions */}
              <div>
                <span className="font-semibold text-stone-900 block mb-1.5 text-[11px]">
                  Or try a sample spoken question:
                </span>
                <div className="space-y-1.5">
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
                      className="w-full p-2 text-left rounded-xl bg-white/40 hover:bg-white/70 border border-white/60 text-stone-900 text-[11px] transition-colors truncate cursor-pointer font-medium"
                    >
                      "{sample}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/60 flex justify-end">
              <button
                type="button"
                onClick={() => setIsVoiceHelpOpen(false)}
                className="glass-pill-btn px-4 py-1.5 text-xs font-semibold cursor-pointer"
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
