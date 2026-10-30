import React from 'react';
import { Compass, Sparkles, BookOpen, GraduationCap, Scale, CalendarCheck } from 'lucide-react';

interface WelcomeBannerProps {
  onSelectPrompt: (promptText: string) => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onSelectPrompt }) => {
  const starters = [
    {
      icon: <BookOpen className="w-4 h-4 text-amber-700" />,
      label: 'After Class 10',
      description: 'Compare Science (PCM/PCB), Commerce, Arts & Vocational streams',
      prompt: "I am in Class 10 and wondering what stream to choose. Can we compare Science, Commerce, and Humanities without making assumptions?",
    },
    {
      icon: <GraduationCap className="w-4 h-4 text-emerald-700" />,
      label: 'After Class 12',
      description: 'Explore degrees, Gujarat ACPC routes, entrance tests & cutoffs',
      prompt: "I am finishing Class 12. Can you help me compare Bachelor degree options, state counselling via ACPC Gujarat, and central entrance exams?",
    },
    {
      icon: <Compass className="w-4 h-4 text-indigo-700" />,
      label: 'Explore a Career',
      description: 'Day-to-day work, study paths, skills & realistic trade-offs',
      prompt: "I want to explore what a career in Biotechnology or Clinical Research involves, including education routes in India and practical entry requirements.",
    },
    {
      icon: <Scale className="w-4 h-4 text-rose-700" />,
      label: 'Compare Colleges & Costs',
      description: 'Tuition vs total living expenses & accreditation rules',
      prompt: "How should my family and I compare colleges fairly? What hidden costs (hostel, lab fees, deposits) should we check beyond tuition fees?",
    },
    {
      icon: <CalendarCheck className="w-4 h-4 text-blue-700" />,
      label: 'Application Checklist',
      description: 'NEET, JEE, CUET & Gujarat state admissions timeline',
      prompt: "What is the official application timeline and document checklist for national and Gujarat state college admissions this cycle?",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto mb-8 pt-4">
      {/* Intro card */}
      <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-stone-50 border border-amber-200/80 rounded-2xl p-5 sm:p-6 shadow-xs mb-6 text-stone-900">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 mb-1">
              Disha — Career Choices, Clearly
            </h1>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
              A trustworthy career exploration guide for Indian students aged 14–19 and their parents.
              Explore paths, examine trade-offs, and check official requirements.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-stone-600 bg-white/70 py-1.5 px-3 rounded-lg border border-amber-200/60 inline-flex">
              <span className="font-semibold text-amber-900">Guiding Principle:</span>
              <span>Disha provides neutral options and verified facts; you and your family decide your future.</span>
              <span className="text-stone-300 hidden sm:inline">•</span>
              <span className="text-amber-800 font-medium hidden sm:inline">🎙️ Voice memos and microphone speaking supported</span>
            </div>
          </div>
        </div>
      </div>

      {/* Starting prompt chips */}
      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2.5 px-1">
          Start with a topic or ask your own question below:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {starters.map((item) => (
            <button
              key={item.label}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex items-start gap-3 p-3 text-left rounded-xl bg-white hover:bg-amber-50/50 border border-stone-200/80 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all duration-150 group cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-stone-50 group-hover:bg-amber-100/60 flex-shrink-0 transition-colors">
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-stone-900 group-hover:text-amber-900 flex items-center gap-1">
                  <span>{item.label}</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
