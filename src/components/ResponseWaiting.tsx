import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const messages = ['Looking at your question', 'Considering your options', 'Preparing a clear response'];
export function ResponseWaiting() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep(value => (value + 1) % messages.length), 1600);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="flex justify-start mb-6" role="status" aria-live="polite">
    <div className="glass-card rounded-3xl rounded-tl-xs px-5 py-4 flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-orange-600 motion-safe:animate-pulse"><Sparkles className="w-4 h-4" /></span>
      <span className="text-sm font-medium text-stone-800">{messages[step]}<span aria-hidden="true">...</span></span>
    </div>
  </div>;
}
