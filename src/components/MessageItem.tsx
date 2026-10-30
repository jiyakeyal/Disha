import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, RotateCcw, Sparkles, User, FileText } from 'lucide-react';
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

  // User message rendering: styled with warm translucent capsule
  if (isUser) {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-tr-sm bg-gradient-to-r from-orange-600 to-amber-700 text-white px-5 py-3.5 shadow-lg border border-white/30 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs text-orange-100 mb-1">
            <User className="w-3.5 h-3.5" />
            <span className="font-medium">You</span>
            <span className="text-[10px] opacity-75 ml-auto">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {message.documentMeta && (
            <div className="mb-2 flex items-center gap-1.5 text-xs bg-black/20 rounded-full px-3 py-1 text-orange-100 border border-white/20">
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate">{message.documentMeta.filename}</span>
              <span className="text-[10px] bg-orange-950/60 px-2 py-0.5 rounded-full ml-auto">Review</span>
            </div>
          )}

          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  // Model (Disha) message rendering: styled with frosted glass container
  const sections = parseResponseSections(message.content);

  return (
    <div className="flex justify-start mb-6 group">
      <div className="w-full max-w-[92%] sm:max-w-[85%] rounded-3xl rounded-tl-sm glass-card px-5 sm:px-6 py-4 sm:py-5 shadow-xl text-stone-900">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2.5 mb-3.5 border-b border-white/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-orange-900 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-sm text-stone-900">Disha</span>
              <span className="text-[11px] text-stone-600/90 ml-2 font-medium">Career Companion</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSpeech}
              title={isPlayingAudio ? 'Stop readout' : 'Listen to this response'}
              aria-label={isPlayingAudio ? 'Stop readout' : 'Listen to this response'}
              className={`p-1.5 rounded-full text-stone-700 hover:text-stone-900 glass-pill-btn transition-colors ${
                isPlayingAudio ? 'bg-orange-200/80 animate-pulse' : ''
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleCopy}
              title="Copy answer"
              aria-label="Copy answer text"
              className="p-1.5 rounded-full text-stone-700 hover:text-stone-900 glass-pill-btn transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {message.isError && onRetry && (
              <button
                onClick={() => onRetry(message.content)}
                title="Retry message"
                className="px-2.5 py-1 rounded-full glass-pill-btn text-orange-900 transition-colors flex items-center gap-1 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="text-stone-900 text-sm leading-relaxed space-y-3 font-normal">
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
                    ? 'p-3.5 bg-white/40 rounded-2xl border border-white/60 text-stone-800 text-xs sm:text-sm'
                    : isOptions
                    ? 'p-4 bg-orange-100/40 rounded-2xl border border-white/60'
                    : isTradeoffs
                    ? 'p-4 bg-amber-100/40 rounded-2xl border border-white/60'
                    : isNextStep
                    ? 'p-3.5 bg-emerald-100/40 rounded-2xl border border-white/60 text-emerald-950 font-medium'
                    : ''
                }
              >
                {sec.title !== 'Guidance' && (
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1">
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
          <div className="mt-4 pt-3 border-t border-white/50">
            <div className="text-xs font-semibold text-stone-800 mb-2 flex items-center justify-between">
              <span>Verified Sources & Reference Portals:</span>
              <span className="text-[10px] text-stone-600 font-normal">Retrieved via Search Grounding</span>
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
