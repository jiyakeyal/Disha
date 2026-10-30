import React from 'react';

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
        <div>
          <span className="block font-serif-editorial font-bold text-2xl text-stone-900 tracking-tight">Disha</span>
          <span className="block text-[10px] text-stone-700 font-medium tracking-wide">Career choices, clearly</span>
        </div>

        {/* Action items styled with reference image pill button appearance (mix of glass and white pill buttons) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* New Chat - Crisp White Pill Button */}
          {hasMessages && (
            <button
              onClick={onResetSession}
              className="white-pill-btn px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
              title="Start a new session"
              aria-label="New Conversation"
            >

              <span className="hidden md:inline">New Chat</span>
            </button>
          )}

          {/* Parent Summary Pill Button - Crisp White Pill Button */}
          <button
            onClick={onOpenParentSummary}
            disabled={!hasMessages}
            className={`px-3.5 py-1.5 text-xs flex items-center gap-1.5 rounded-full transition-all cursor-pointer ${
              hasMessages
                ? 'white-pill-btn font-semibold text-stone-900 shadow-sm'
                : 'bg-white/40 text-stone-500 border border-white/50 cursor-not-allowed opacity-70'
            }`}
            title="Generate a 1-page summary for family discussion"
            aria-label="Generate Parent Summary"
          >

            <span>Parent Summary</span>
          </button>

          {/* Evaluation / Dev View - Frosted Glass Pill Button (matching 'menu' in image) */}
          <button
            onClick={onOpenEvaluation}
            className="glass-pill-btn px-3.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
            title="Evaluation Suite (16 Acceptance Tests from 06_TEST_EVALUATE_IMPROVE.md)"
            aria-label="Evaluation & Test Suite"
          >

            <span>Eval</span>
          </button>

          {/* Settings - Frosted Glass Circular Pill Button */}
          <button
            onClick={onOpenSettings}
            className="glass-pill-btn px-3 py-1.5 rounded-full cursor-pointer flex items-center justify-center"
            title="Language & Style Preferences"
            aria-label="Preferences and Settings"
          >
            <span className="text-xs font-semibold">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
