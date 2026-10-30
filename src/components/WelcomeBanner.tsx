import React from 'react';


interface WelcomeBannerProps {
  onSelectPrompt: (promptText: string) => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onSelectPrompt }) => {
  const starters = [
    {
      label: 'After Class 10',
      description: 'Compare streams and find your fit.',
      prompt: "I am in Class 10 and wondering what stream to choose. Can we compare Science, Commerce, and Humanities without making assumptions?",
    },
    {
      label: 'After Class 12',
      description: 'Explore degrees and admissions.',
      prompt: "I am finishing Class 12. Can you help me compare Bachelor degree options, state counselling via ACPC Gujarat, and central entrance exams?",
    },
    {
      label: 'Explore a Career',
      description: 'Understand the work and study path.',
      prompt: "I want to explore what a career in Biotechnology or Clinical Research involves, including education routes in India and practical entry requirements.",
    },
    {
      label: 'Colleges & Costs',
      description: 'Compare options and total costs.',
      prompt: "How should my family and I compare colleges fairly? What hidden costs (hostel, lab fees, deposits) should we check beyond tuition fees?",
    },
    {
      label: 'Application Checklist',
      description: 'Know the dates and documents.',
      prompt: "What is the official application timeline and document checklist for national and Gujarat state college admissions this cycle?",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto py-2 sm:py-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-950 leading-[1.12]">
          Explore your next step<br />with clarity.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-stone-900/80 font-medium">
          Compare study paths and careers. Find the questions that matter to you.
        </p>
      </div>
      <section aria-label="Exploration topics">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-stone-900">Where would you like to start?</h2>
          <span className="hidden sm:block text-xs text-stone-700">Choose a topic or ask below</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {starters.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="topic-card"
            >
              <span><strong className="block text-sm">{item.label}</strong><span className="block mt-1.5 text-xs leading-relaxed text-stone-700">{item.description}</span></span>
              <span className="text-xs font-bold text-orange-800">Explore &rarr;</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
