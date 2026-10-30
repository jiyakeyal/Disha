import React from 'react';
import { Sparkles, FileText, Settings, FlaskConical, PlusCircle, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenParentSummary: () => void;
  onOpenSettings: () => void;
  onOpenEvaluation: () => void;
  onResetSession: () => void;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenParentSummary,
  onOpenSettings,
  onOpenEvaluation,
  onResetSession,
  hasMessages,
}) => {
  return (
    <header className="sticky top-0 z-30 pt-3 px-4 pb-2 no-print">
      {/* 
        Capsule container styled precisely like the top header bar in reference image:
        Frosted glass, generous rounded pill border, subtle translucent white fill, soft backdrop blur
      */}
      <div className="max-w-4xl mx-auto glass-capsule rounded-full px-5 py-2.5 flex items-center justify-between shadow-lg">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/40 border border-white/60 text-stone-900 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-editorial font-bold text-base text-stone-900 tracking-tight">
                Disha
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold text-stone-800 bg-white/50 px-2.5 py-0.5 rounded-full border border-white/60 tracking-wider">
                Career Choices, Clearly
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-700/90 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-800" />
              <span>Session-Only • Minors Safeguarded</span>
            </div>
          </div>
        </div>

        {/* Action items styled with reference image pill button appearance */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* New Chat */}
          {hasMessages && (
            <button
              onClick={onResetSession}
              className="glass-pill-btn px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
              title="Start a new session"
              aria-label="New Conversation"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Chat</span>
            </button>
          )}

          {/* Parent Summary Pill Button */}
          <button
            onClick={onOpenParentSummary}
            disabled={!hasMessages}
            className={`px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-full transition-all cursor-pointer ${
              hasMessages
                ? 'glass-pill-btn font-semibold'
                : 'bg-white/20 text-stone-400 border border-white/30 cursor-not-allowed opacity-60'
            }`}
            title="Generate a 1-page summary for family discussion"
            aria-label="Generate Parent Summary"
          >
            <FileText className="w-3.5 h-3.5 text-stone-800" />
            <span>Parent Summary</span>
          </button>

          {/* Evaluation / Dev View */}
          <button
            onClick={onOpenEvaluation}
            className="glass-pill-btn px-3 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
            title="Evaluation Suite (16 Acceptance Tests from 06_TEST_EVALUATE_IMPROVE.md)"
            aria-label="Evaluation & Test Suite"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-900" />
            <span className="hidden sm:inline">Eval</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="glass-pill-btn p-2 rounded-full cursor-pointer flex items-center justify-center"
            title="Language & Style Preferences"
            aria-label="Preferences and Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
