import React from 'react';
import { PlusCircle, FileText, FlaskConical, Settings, ShieldCheck, Sparkles } from 'lucide-react';

interface PixelArtHeaderProps {
  onOpenParentSummary: () => void;
  onOpenSettings: () => void;
  onOpenEvaluation: () => void;
  onResetSession: () => void;
  hasMessages: boolean;
}

// 16x8 matrix of pixel colors sampled directly from the reference pixel art image:
// Warm sunset oranges, peach, apricot, blending into lilac, lavender, rose, and soft cream.
const PIXEL_MATRIX: string[][] = [
  // Row 0
  ['#e08c6c', '#e69a7c', '#eeb095', '#f3c7b2', '#edd3c4', '#e6d8ce', '#dbceda', '#d0c3dc', '#c5b8df', '#c2b2dc', '#c6b0d9', '#ccaed3', '#d4aecf', '#dcaecc', '#e2a9be', '#e29ab0'],
  // Row 1
  ['#eb794b', '#f1885b', '#f79f74', '#fab894', '#f8cca9', '#ecd4c3', '#decbda', '#cfbddf', '#c0aee2', '#bc9fde', '#be8ed7', '#c489cf', '#cb89c7', '#d78ec3', '#df90b8', '#dc85a7'],
  // Row 2
  ['#f4622b', '#fa7439', '#fd8d53', '#fca876', '#fbc097', '#f4ceb6', '#e0c4d8', '#ccaedd', '#be97e0', '#b583dc', '#b271d5', '#b96bca', '#c570bf', '#d375b8', '#dc76ab', '#d66e9a'],
  // Row 3
  ['#fa5216', '#ff6726', '#ff8040', '#ff9a5e', '#ffb682', '#f6c5a5', '#dcbad5', '#c39fd9', '#b381d6', '#a968d3', '#a756cd', '#b257c2', '#be5cb7', '#cc62ad', '#d6649f', '#ce5c8e'],
  // Row 4
  ['#ff4500', '#ff5816', '#ff7330', '#ff8f4f', '#ffa971', '#f5bc96', '#d6aed0', '#b78ecf', '#a46dc9', '#9953c3', '#9b43bd', '#a948b4', '#b84ea9', '#c5559f', '#cc5792', '#c24f81'],
  // Row 5
  ['#ff4703', '#ff5a17', '#ff7632', '#ff9150', '#ffab72', '#f0b38d', '#cf9fc7', '#ab7ec2', '#9358b6', '#873dad', '#8b30a5', '#9a369d', '#aa3e93', '#b8468b', '#bd467f', '#b23f72'],
  // Row 6
  ['#f7571d', '#fc6c32', '#ff8449', '#ff9e66', '#fcae7c', '#e7a382', '#c48db9', '#9c6cb0', '#8045a1', '#722b93', '#76208a', '#862784', '#962e7a', '#a33573', '#a83467', '#9d2f5e'],
  // Row 7
  ['#e86934', '#ef7a44', '#f68e59', '#f9a372', '#f4a87b', '#db9579', '#b57aa7', '#8a589c', '#6d3189', '#5f1979', '#631170', '#72176b', '#801d62', '#8c225b', '#912153', '#861e4b'],
];

export const PixelArtHeader: React.FC<PixelArtHeaderProps> = ({
  onOpenParentSummary,
  onOpenSettings,
  onOpenEvaluation,
  onResetSession,
  hasMessages,
}) => {
  return (
    <div className="relative overflow-hidden rounded-t-none sm:rounded-t-[32px] border-b border-stone-200/50">
      {/* 1. Underlying Pixel Mosaic Grid (Crisp pixelated vector blocks) */}
      <div className="absolute inset-0 grid grid-cols-16 grid-rows-8 w-full h-full select-none pointer-events-none">
        {PIXEL_MATRIX.map((row, rIdx) =>
          row.map((color, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              style={{ backgroundColor: color }}
              className="w-full h-full"
            />
          ))
        )}
      </div>

      {/* 2. Soft Ambient Vignette & Texture Overlay for smooth high-end contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/30 pointer-events-none" />

      {/* 3. Top Navigation Bar (Frosted Glass Header) */}
      <header className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Brand on Left: Clean white typography matching reference photo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-base sm:text-lg text-white tracking-widest uppercase drop-shadow-xs">
                Disha
              </span>
              <span className="hidden sm:inline-block text-[10px] font-medium tracking-wider text-white/90 uppercase px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25">
                Career Choices, Clearly
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium drop-shadow-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>Session Privacy • Minors Safeguarded</span>
            </div>
          </div>
        </div>

        {/* Action Items on Right: Frosted Glass Pill Buttons */}
        <div className="flex items-center gap-2">
          {/* New Chat Glass Button */}
          {hasMessages && (
            <button
              type="button"
              onClick={onResetSession}
              className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-md border border-white/30 text-white text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Start a new conversation session"
              aria-label="New Conversation"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Chat</span>
            </button>
          )}

          {/* Parent Summary Glass Button */}
          <button
            type="button"
            onClick={onOpenParentSummary}
            disabled={!hasMessages}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md border ${
              hasMessages
                ? 'bg-white/25 hover:bg-white/35 active:bg-white/45 text-white border-white/40 shadow-xs'
                : 'bg-white/10 text-white/40 border-white/15 cursor-not-allowed opacity-60'
            }`}
            title="Generate a 1-page summary for family discussion"
            aria-label="Generate Parent Summary"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            <span className="hidden xs:inline">Parent Summary</span>
          </button>

          {/* Evaluation / Dev Suite Glass Button */}
          <button
            type="button"
            onClick={onOpenEvaluation}
            className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-md border border-white/30 text-white text-xs font-medium flex items-center gap-1 transition-all shadow-xs cursor-pointer"
            title="Evaluation Suite (Acceptance Tests T01-T16)"
            aria-label="Evaluation & Test Suite"
          >
            <FlaskConical className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Eval</span>
          </button>

          {/* Settings / Menu Glass Button (as shown in reference photo "menu") */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-md border border-white/30 text-white text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Language & Style Preferences"
            aria-label="Preferences and Settings"
          >
            <Settings className="w-3.5 h-3.5 text-white" />
            <span>menu</span>
          </button>
        </div>
      </header>

      {/* Decorative Bottom Bar: Seamless Transition to White Content Area */}
      <div className="h-4 sm:h-6 w-full" />
    </div>
  );
};
