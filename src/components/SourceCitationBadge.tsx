import React from 'react';
import { ExternalLink, ShieldCheck, Newspaper, AlertCircle, Clock } from 'lucide-react';
import { SourceCitation } from '../lib/types';

interface SourceCitationBadgeProps {
  citation: SourceCitation;
}

export const SourceCitationBadge: React.FC<SourceCitationBadgeProps> = ({ citation }) => {
  const isOfficial = citation.verificationStatus === 'verified_official';
  const isSecondary = citation.verificationStatus === 'secondary_context';

  const formattedTime = citation.checkedAt
    ? new Date(citation.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Session check';

  return (
    <div
      className={`inline-flex flex-col text-xs rounded-lg border p-2.5 transition-all duration-150 ${
        isOfficial
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:bg-emerald-100/60'
          : isSecondary
          ? 'bg-blue-50/70 border-blue-200 text-blue-950 hover:bg-blue-100/60'
          : 'bg-stone-50 border-stone-200 text-stone-800'
      }`}
    >
      <div className="flex items-center gap-1.5 font-medium mb-1">
        {isOfficial ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
        ) : isSecondary ? (
          <Newspaper className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
        )}
        <span className="truncate max-w-[200px]" title={citation.authority}>
          {citation.authority}
        </span>
        {citation.academicYear && (
          <span className="bg-white/80 px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-800 border border-emerald-200">
            {citation.academicYear}
          </span>
        )}
      </div>

      <div className="text-[11px] text-stone-600 truncate max-w-[260px] font-normal" title={citation.title}>
        {citation.title}
      </div>

      <div className="mt-1.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-[10px] text-stone-500">
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          Checked {formattedTime}
        </span>
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-amber-900 hover:text-amber-700 hover:underline ml-2"
          aria-label={`Open official page: ${citation.title}`}
        >
          <span>Visit portal</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
