import React from 'react';
import { Compass, Sparkles, BookOpen, GraduationCap, Scale, CalendarCheck } from 'lucide-react';

interface WelcomeBannerProps {
  onSelectPrompt: (promptText: string) => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onSelectPrompt }) => {
  const starters = [
    {
      icon: <BookOpen className="w-4 h-4 text-orange-900" />,
      label: 'After Class 10',
      description: 'Compare Science (PCM/PCB), Commerce, Arts & Vocational streams',
      prompt: "I am in Class 10 and wondering what stream to choose. Can we compare Science, Commerce, and Humanities without making assumptions?",
    },
    {
      icon: <GraduationCap className="w-4 h-4 text-emerald-900" />,
      label: 'After Class 12',
      description: 'Explore degrees, Gujarat ACPC routes, entrance tests & cutoffs',
      prompt: "I am finishing Class 12. Can you help me compare Bachelor degree options, state counselling via ACPC Gujarat, and central entrance exams?",
    },
    {
      icon: <Compass className="w-4 h-4 text-indigo-900" />,
      label: 'Explore a Career',
      description: 'Day-to-day work, study paths, skills & realistic trade-offs',
      prompt: "I want to explore what a career in Biotechnology or Clinical Research involves, including education routes in India and practical entry requirements.",
    },
    {
      icon: <Scale className="w-4 h-4 text-rose-900" />,
      label: 'Compare Colleges & Costs',
      description: 'Tuition vs total living expenses & accreditation rules',
      prompt: "How should my family and I compare colleges fairly? What hidden costs (hostel, lab fees, deposits) should we check beyond tuition fees?",
    },
    {
      icon: <CalendarCheck className="w-4 h-4 text-blue-900" />,
      label: 'Application Checklist',
      description: 'NEET, JEE, CUET & Gujarat state admissions timeline',
      prompt: "What is the official application timeline and document checklist for national and Gujarat state college admissions this cycle?",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto mb-8 pt-4">
      {/* Intro hero card with frosted glass background */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 shadow-xl mb-6 text-stone-900">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-white/60 border border-white/80 text-orange-950 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-orange-800" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-editorial text-stone-900 tracking-tight mb-1.5">
              Disha — Career Choices, Clearly
            </h1>
            <p className="text-xs sm:text-sm text-stone-800/90 leading-relaxed font-normal">
              A trustworthy career exploration guide for Indian students aged 14–19 and their parents.
              Explore paths, examine trade-offs, and check official requirements.
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-800 bg-white/50 py-1.5 px-3 rounded-full border border-white/60 inline-flex shadow-2xs">
              <span className="font-semibold text-orange-950">Guiding Principle:</span>
              <span>Disha provides neutral options and verified facts; you and your family decide your future.</span>
              <span className="text-stone-400 hidden sm:inline">•</span>
              <span className="text-orange-900 font-medium hidden sm:inline">🎙️ Voice memos supported</span>
            </div>
          </div>
        </div>
      </div>

      {/* Starting prompt chips styled with frosted glass pill buttons */}
      <div>
        <div className="text-[11px] font-bold text-stone-900/80 uppercase tracking-wider mb-3 px-1 drop-shadow-2xs">
          Start with a topic or ask your own question below:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {starters.map((item) => (
            <button
              key={item.label}
              onClick={() => onSelectPrompt(item.prompt)}
              className="glass-capsule glass-capsule-hover flex items-start gap-3.5 p-3.5 text-left rounded-2xl transition-all duration-200 group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-white/60 border border-white/70 group-hover:bg-white/80 flex-shrink-0 transition-colors shadow-2xs">
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-stone-900 group-hover:text-orange-950 flex items-center gap-1">
                  <span>{item.label}</span>
                </div>
                <div className="text-[11px] text-stone-700/85 mt-0.5 line-clamp-1">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
