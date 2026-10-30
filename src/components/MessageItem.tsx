import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, RotateCcw, Compass, User, FileText } from 'lucide-react';
import { MessageItem as MessageItemType } from '../lib/types';
import { SourceCitationBadge } from './SourceCitationBadge';
import { RecommendedPortalsCard } from './RecommendedPortalsCard';
import { parseResponseSections } from '../lib/formatters';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageItemProps {
  message: MessageItemType;
  onRetry?: (text: string) => void;
  speechAudioEnabled?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for natural speech
    const cleanSpeechText = message.content
      .replace(/[#*`_~]/g, '')
      .replace(/\[cite-[^\]]+\]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN'; // Prefer Indian English accent if available

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // User message rendering: Sleek modern dark stone box with glass badge
  if (isUser) {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl sm:rounded-3xl rounded-tr-xs bg-stone-900 text-white px-4.5 py-3.5 shadow-sm border border-stone-800">
          <div className="flex items-center gap-1.5 text-xs text-stone-300 mb-1.5">
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-semibold text-white">You</span>
            <span className="text-[10px] text-stone-400 ml-auto font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {message.documentMeta && (
            <div className="mb-2 flex items-center gap-1.5 text-xs bg-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 text-stone-200 border border-white/15">
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              <span className="truncate">{message.documentMeta.filename}</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full ml-auto font-medium">Redacted Review</span>
            </div>
          )}

          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">{message.content}</div>
        </div>
      </div>
    );
  }

  // Model (Disha) message rendering: Crisp White Box with Glass Controls
  const sections = parseResponseSections(message.content);

  return (
    <div className="flex justify-start mb-6 group">
      <div className="w-full max-w-[96%] sm:max-w-[92%] rounded-3xl rounded-tl-xs glass-card px-5 sm:px-6 py-5 shadow-lg">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-orange-600 shadow-2xs">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-sm text-stone-950 tracking-tight">Disha</span>
              <span className="text-[11px] text-stone-700/80 ml-2 font-medium">Career Choices, Clearly</span>
            </div>
          </div>

          {/* Frosted Glass & White Pill Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSpeech}
              title={isPlayingAudio ? 'Stop readout' : 'Listen to this response'}
              aria-label={isPlayingAudio ? 'Stop readout' : 'Listen to this response'}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-orange-600 text-white ring-2 ring-orange-300 animate-pulse'
                  : 'white-pill-btn p-2 hover:bg-stone-50 text-stone-700'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              title="Copy answer"
              aria-label="Copy answer text"
              className="white-pill-btn p-2 hover:bg-stone-50 text-stone-700 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {message.isError && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.content)}
                title="Retry message"
                className="white-pill-btn px-3.5 py-1 text-orange-950 hover:bg-orange-50 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="text-stone-800 text-sm leading-relaxed space-y-3 font-normal">
          {sections.map((sec, idx) => {
            const isHeard = sec.type === 'heard';
            const isOptions = sec.type === 'options';
            const isTradeoffs = sec.type === 'tradeoffs';
            const isNextStep = sec.type === 'next_step';

            return (
              <div
                key={idx}
                className={
                  isHeard
                    ? 'p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/60 text-stone-700 text-xs sm:text-sm'
                    : isOptions
                    ? 'p-4 bg-orange-50/40 rounded-2xl border border-orange-200/60'
                    : isTradeoffs
                    ? 'p-4 bg-purple-50/40 rounded-2xl border border-purple-200/60'
                    : isNextStep
                    ? 'p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-200/60 text-emerald-950'
                    : 'p-2'
                }
              >
                {sec.title !== 'Guidance' && (
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                    {sec.title}
                  </h4>
                )}
                <MarkdownRenderer content={sec.content} />
              </div>
            );
          })}
        </div>

        {/* Official source citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-5 pt-3.5 border-t border-stone-100">
            <div className="text-xs font-bold text-stone-700 mb-2 flex items-center justify-between">
              <span>Verified Sources & Reference Portals:</span>
              <span className="text-[10px] text-stone-400 font-normal">Sources returned with this response</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((c) => (
                <SourceCitationBadge key={c.id || c.url} citation={c} />
              ))}
            </div>
          </div>
        )}

        {/* Fallback recommended portals when citations are empty */}
        {message.recommendedPortals && message.recommendedPortals.length > 0 && (
          <RecommendedPortalsCard portals={message.recommendedPortals} />
        )}
      </div>
    </div>
  );
};
