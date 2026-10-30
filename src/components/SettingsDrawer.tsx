import React from 'react';
import { X, Sliders, Shield, RefreshCw, Languages, MessageSquare, Info } from 'lucide-react';
import { UserSettings, PersonaStyle, LanguageChoice } from '../lib/types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetSession: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end no-print">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-stone-200 animate-slide-left">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-800" />
            <h3 className="font-serif-editorial font-bold text-base text-stone-900">
              Preferences & Safeguards
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-stone-700 font-normal">
          {/* Persona Style Preset */}
          <div>
            <label className="flex items-center gap-2 font-semibold text-xs text-stone-900 uppercase tracking-wider mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              <span>Conversation Style Preset</span>
            </label>
            <p className="text-xs text-stone-500 mb-2.5">
              Adjusts tone and pacing. System boundaries, neutral agency, and source rules always take precedence.
            </p>
            <div className="space-y-2">
              {[
                {
                  id: 'friendly_expert',
                  title: 'Friendly Expert (Default)',
                  desc: 'Structured, practical, warm, and direct with clear trade-offs.',
                },
                {
                  id: 'question_coach',
                  title: 'Question-Led Coach',
                  desc: 'Asks 1–2 thoughtful questions first to help articulate your interests.',
                },
                {
                  id: 'calm_guide',
                  title: 'Calm Guide',
                  desc: 'Extra reassurance, step-by-step pacing for stressful decision moments.',
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    settings.personaStyle === item.id
                      ? 'border-amber-600 bg-amber-50/60'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="personaStyle"
                    value={item.id}
                    checked={settings.personaStyle === item.id}
                    onChange={() => onUpdateSettings({ personaStyle: item.id as PersonaStyle })}
                    className="mt-0.5 text-amber-800 focus:ring-amber-600"
                  />
                  <div>
                    <div className="font-semibold text-xs text-stone-900">{item.title}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Language Preference */}
          <div>
            <label className="flex items-center gap-2 font-semibold text-xs text-stone-900 uppercase tracking-wider mb-2">
              <Languages className="w-3.5 h-3.5 text-amber-700" />
              <span>Language & Tone</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'english', label: 'English', sub: 'Clear & direct' },
                { id: 'hinglish', label: 'Hinglish', sub: 'Natural youth blend' },
                { id: 'gujarati_blend', label: 'Gujarati Blend', sub: 'Gujarat context' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUpdateSettings({ language: item.id as LanguageChoice })}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    settings.language === item.id
                      ? 'border-amber-600 bg-amber-50/70 font-semibold text-amber-950'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Minor Safeguards Disclosure */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 text-xs text-stone-700 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Session-Only Privacy & Minor Safeguards</span>
            </div>
            <p className="leading-relaxed text-stone-600">
              Disha is built India-first for students aged 14–19. Under the Digital Personal Data Protection Act (DPDP),
              processing persistent personal data of minors requires verifiable parental consent.
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-stone-200 text-[11px]">
              <span className="font-semibold text-stone-800">Persistent Profile Status: </span>
              <span className="text-amber-800 font-semibold">Disabled (Session-Only Active)</span>
              <p className="mt-1 text-stone-500">
                All conversation context stays in this active session and clears upon closing this tab. No tracking,
                no behavioral profiling, and no commercial college promotion.
              </p>
            </div>
          </div>

          {/* Reset Conversation Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                onResetSession();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:border-rose-300 hover:bg-rose-50/50 text-rose-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Chat & Start Fresh Session</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 text-[11px] text-stone-500 flex items-center justify-between">
          <span>Disha Build v1.0.0</span>
          <span>Google AI Studio Build</span>
        </div>
      </div>
    </div>
  );
};
