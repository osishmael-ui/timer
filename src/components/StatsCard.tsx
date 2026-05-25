import React from 'react';

interface StatsCardProps {
  moveScore: number;
  streak: number;
  breaksCompleted: number;
  flowSafeReturns: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  moveScore,
  streak,
  breaksCompleted,
  flowSafeReturns,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg shadow-navy-500/5">
      <h3 className="text-sm font-semibold text-charcoal/70 mb-3 uppercase tracking-wide">
        Today's Stats
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-lavender/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-lavender">{moveScore}</div>
          <div className="text-xs text-charcoal/60 mt-1">Move Score</div>
        </div>
        <div className="bg-coral-500/10 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-coral-500">{streak}</div>
          <div className="text-xs text-charcoal/60 mt-1">Day Streak</div>
        </div>
        <div className="bg-mint/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-lime-600">{breaksCompleted}</div>
          <div className="text-xs text-charcoal/60 mt-1">Breaks Done</div>
        </div>
        <div className="bg-sky-500/10 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-sky-500">{flowSafeReturns}</div>
          <div className="text-xs text-charcoal/60 mt-1">Flow Returns</div>
        </div>
      </div>
    </div>
  );
};
