import React from 'react';
import { BADGES } from '../types';

interface BadgeGridProps {
  earnedBadges: string[];
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ earnedBadges }) => {
  return (
    <div className="panel-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Rewards</p>
          <h3 className="mt-1 text-lg font-black text-navy">Badges</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-charcoal/60">
          {earnedBadges.length}/{BADGES.length}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
        {BADGES.map((badge) => {
          const isEarned = earnedBadges.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`
                relative group rounded-2xl p-3 text-center transition-all duration-300
                ${isEarned 
                  ? 'bg-gradient-to-br from-violet-50 to-sky-50 shadow-sm cursor-pointer' 
                  : 'bg-slate-100/70 opacity-45 grayscale'
                }
              `}
              title={isEarned ? badge.name : 'Locked'}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <div className={`text-[0.68rem] font-bold leading-tight ${isEarned ? 'text-charcoal' : 'text-charcoal/40'}`}>
                {badge.name.split(' ').slice(0, 2).join(' ')}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden px-3 py-2 bg-navy text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg sm:block">
                <div className="font-semibold">{badge.name}</div>
                <div className="mt-1 text-white/70">{badge.description}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
