import React from 'react';
import { ExternalLink, Compass } from 'lucide-react';
import { OfficialAuthority } from '../lib/types';

interface RecommendedPortalsCardProps {
  portals: OfficialAuthority[];
}

export const RecommendedPortalsCard: React.FC<RecommendedPortalsCardProps> = ({ portals }) => {
  if (!portals || portals.length === 0) return null;

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-950 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-2">
        <Compass className="w-4 h-4 text-amber-700" />
        <span>Official Verification Portals for Current Notices:</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {portals.map((portal, idx) => (
          <a
            key={`${portal.name}-${idx}`}
            href={portal.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col p-2 bg-white/90 hover:bg-white rounded-lg border border-amber-200 shadow-xs hover:border-amber-400 transition-colors group"
          >
            <div className="flex items-center justify-between font-medium text-stone-900 group-hover:text-amber-800">
              <span className="truncate">{portal.name}</span>
              <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-amber-600 flex-shrink-0 ml-1" />
            </div>
            <span className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">{portal.description}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
