import React from 'react';
import { BADGES } from '../types';

interface BadgeGridProps {
  earnedBadges: string[];
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ earnedBadges }) => {
  return (
    <div className="glass rounded-2xl p-5 shadow-xl">
      <h3 className="text-sm font-semibold text-charcoal/70 mb-4 uppercase tracking-wide flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="7"/>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
        </svg>
        Badges
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {BADGES.map((badge) => {
          const isEarned = earnedBadges.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`
                relative group rounded-xl p-3 text-center transition-all duration-300
                ${isEarned 
                  ? 'bg-gradient-to-br from-lavender/40 to-sky-500/20 shadow-md cursor-pointer' 
                  : 'bg-charcoal/5 opacity-50 grayscale'
                }
              `}
              title={isEarned ? badge.name : 'Locked'}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <div className={`text-xs font-medium ${isEarned ? 'text-charcoal' : 'text-charcoal/40'}`}>
                {badge.name.split(' ').slice(0, 2).join(' ')}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                <div className="font-semibold">{badge.name}</div>
                <div className="text-charcoal/70 mt-1">{badge.description}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
