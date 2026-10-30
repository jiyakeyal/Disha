import React from 'react';
import { BookOpen, GraduationCap, Compass, Scale, CalendarCheck, ArrowUpRight, Sparkles } from 'lucide-react';

interface WelcomeBannerProps {
  onSelectPrompt: (promptText: string) => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onSelectPrompt }) => {
  const starters = [
    {
      badge: 'Classes 9–10',
      label: 'After Class 10',
      description: 'Compare Science (PCM/PCB), Commerce, Arts & Vocational streams without assumptions.',
      prompt: "I am in Class 10 and wondering what stream to choose. Can we compare Science, Commerce, and Humanities without making assumptions?",
      icon: <BookOpen className="w-4 h-4 text-orange-600" />,
    },
    {
      badge: 'Classes 11–12',
      label: 'After Class 12 & ACPC',
      description: 'Explore degrees, Gujarat ACPC engineering/pharmacy routes, cutoffs & entrance exams.',
      prompt: "I am finishing Class 12. Can you help me compare Bachelor degree options, state counselling via ACPC Gujarat, and central entrance exams?",
      icon: <GraduationCap className="w-4 h-4 text-purple-600" />,
    },
    {
      badge: 'Deep Dive',
      label: 'Explore a Career',
      description: 'Day-to-day reality, realistic study timelines, required skills, and genuine trade-offs.',
      prompt: "I want to explore what a career in Biotechnology or Clinical Research involves, including education routes in India and practical entry requirements.",
      icon: <Compass className="w-4 h-4 text-amber-600" />,
    },
    {
      badge: 'Financial & ROI',
      label: 'Compare Colleges & Costs',
      description: 'Tuition vs total living expenses, hidden hostel costs, and official accreditation checks.',
      prompt: "How should my family and I compare colleges fairly? What hidden costs (hostel, lab fees, deposits) should we check beyond tuition fees?",
      icon: <Scale className="w-4 h-4 text-rose-600" />,
    },
    {
      badge: 'Timeline',
      label: 'Application Checklist',
      description: 'Official dates, documents, and admission cycles for NEET, JEE, CUET & Gujarat portals.',
      prompt: "What is the official application timeline and document checklist for national and Gujarat state college admissions this cycle?",
      icon: <CalendarCheck className="w-4 h-4 text-blue-600" />,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-2 sm:py-4">
      {/* Editorial Hero Statement (Matching Reference Typography) */}
      <div className="mb-8 space-y-4">
        {/* Editorial Primary Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-950 leading-[1.18]">
          A moment to explore your path with clarity and care. An experience to discover choices, without pressure.
        </h1>

        {/* Editorial Secondary Paragraph */}
        <p className="text-sm sm:text-base text-stone-500 font-normal leading-relaxed max-w-2xl">
          Everything you need to navigate Class 10 & 12 decisions. Neutral, balanced comparisons across Science, Commerce, Arts, and vocational routes in Gujarat and national portals. No algorithms picking your life for you.
        </p>

        {/* Editorial Mission Statement & Guiding Principle */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs text-stone-600">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/90 text-stone-700 font-medium border border-stone-200/80">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Parent & Student Companion</span>
          </div>
          <span className="text-stone-300">•</span>
          <span className="text-stone-600 font-normal">
            Disha helps you examine real trade-offs and verify official portals. You and your family decide your future.
          </span>
        </div>
      </div>

      {/* Starter Option Boxes (Pure White Boxes with Glass Accents) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Start with an exploration topic
          </span>
          <span className="text-[11px] text-stone-400">
            or type / speak your question below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {starters.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex flex-col justify-between p-4 sm:p-4.5 rounded-2xl bg-white border border-stone-200/80 hover:border-orange-500/80 hover:shadow-md transition-all duration-200 text-left group cursor-pointer shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-100 group-hover:bg-orange-50 group-hover:border-orange-200 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-stone-400 group-hover:text-orange-700 transition-colors">
                      {item.badge}
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                <div className="font-bold text-sm text-stone-900 group-hover:text-orange-950 transition-colors mb-1">
                  {item.label}
                </div>
                <div className="text-xs text-stone-500 leading-relaxed font-normal">
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
