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

  // User message rendering
  if (isUser) {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-amber-900 text-white px-4 py-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-amber-200 mb-1">
            <User className="w-3.5 h-3.5" />
            <span className="font-medium">You</span>
            <span className="text-[10px] opacity-75 ml-auto">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {message.documentMeta && (
            <div className="mb-2 flex items-center gap-1.5 text-xs bg-amber-950/40 rounded px-2 py-1 text-amber-100 border border-amber-800">
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate">{message.documentMeta.filename}</span>
              <span className="text-[10px] bg-amber-800 px-1 rounded ml-auto">Redacted transient review</span>
            </div>
          )}

          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  // Model (Disha) message rendering
  const sections = parseResponseSections(message.content);

  return (
    <div className="flex justify-start mb-6 group">
      <div className="w-full max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-xs bg-white border border-stone-200/90 px-5 py-4 shadow-xs">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-sm text-stone-900">Disha</span>
              <span className="text-[11px] text-stone-500 ml-2">Career Companion</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleSpeech}
              title={isPlayingAudio ? 'Stop readout' : 'Listen to this response'}
              aria-label={isPlayingAudio ? 'Stop readout' : 'Listen to this response'}
              className={`p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors ${
                isPlayingAudio ? 'text-amber-800 bg-amber-50 animate-pulse' : ''
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleCopy}
              title="Copy answer"
              aria-label="Copy answer text"
              className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {message.isError && onRetry && (
              <button
                onClick={() => onRetry(message.content)}
                title="Retry message"
                className="p-1.5 rounded-md text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-1 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
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
                    ? 'p-3 bg-stone-50 rounded-lg border border-stone-200/60 text-stone-700 text-xs sm:text-sm'
                    : isOptions
                    ? 'p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/70'
                    : isTradeoffs
                    ? 'p-3.5 bg-orange-50/30 rounded-xl border border-orange-200/60'
                    : isNextStep
                    ? 'p-3 bg-emerald-50/40 rounded-lg border border-emerald-200/60 text-emerald-950'
                    : ''
                }
              >
                {sec.title !== 'Guidance' && (
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-stone-500 mb-1.5 flex items-center gap-1">
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
          <div className="mt-4 pt-3 border-t border-stone-100">
            <div className="text-xs font-semibold text-stone-700 mb-2 flex items-center justify-between">
              <span>Verified Sources & Reference Portals:</span>
              <span className="text-[10px] text-stone-500 font-normal">Directly retrieved via Google Search Grounding</span>
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
