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
    <header className="sticky top-0 z-30 bg-[#faf9f6]/90 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 no-print">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-800 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-editorial font-bold text-lg text-stone-900 tracking-tight">
                Disha
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                Career Choices, Clearly
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Session-Only • Minors Safeguarded</span>
            </div>
          </div>
        </div>

        {/* Action items */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* New Chat */}
          {/* New Chat */}
          {hasMessages && (
            <button
              onClick={onResetSession}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Start a new session"
              aria-label="New Conversation"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden md:inline">New Chat</span>
            </button>
          )}

          {/* Parent Summary Button */}
          <button
            onClick={onOpenParentSummary}
            disabled={!hasMessages}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              hasMessages
                ? 'bg-amber-100 text-amber-950 hover:bg-amber-200/80 border border-amber-300 shadow-2xs'
                : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed opacity-60'
            }`}
            title="Generate a 1-page summary for family discussion"
            aria-label="Generate Parent Summary"
          >
            <FileText className="w-3.5 h-3.5 text-amber-800" />
            <span>Parent Summary</span>
          </button>

          {/* Evaluation / Dev View */}
          <button
            onClick={onOpenEvaluation}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
            title="Evaluation Suite (16 Acceptance Tests from 06_TEST_EVALUATE_IMPROVE.md)"
            aria-label="Evaluation & Test Suite"
          >
            <FlaskConical className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Eval Tests</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-xl transition-colors cursor-pointer"
            title="Language & Style Preferences"
            aria-label="Preferences and Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
