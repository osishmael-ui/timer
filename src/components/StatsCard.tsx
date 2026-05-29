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
  const completionRate = Math.min(100, Math.round((flowSafeReturns / Math.max(1, breaksCompleted)) * 100));

  return (
    <div className="panel-card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Daily Health</p>
          <h3 className="mt-1 text-lg font-black text-navy">Momentum</h3>
        </div>
        <div className="relative grid h-16 w-16 place-items-center rounded-full bg-slate-100">
          <svg className="absolute inset-0 h-16 w-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="27" fill="none" stroke="#E2E8F0" strokeWidth="7" />
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="#22C55E"
              strokeLinecap="round"
              strokeWidth="7"
              strokeDasharray={`${completionRate * 1.7} 170`}
            />
          </svg>
          <span className="text-sm font-black text-navy">{completionRate}%</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-sky-50 p-4">
          <div className="text-2xl font-black text-sky-500">{moveScore}</div>
          <div className="mt-1 text-xs font-semibold text-charcoal/55">Move Score</div>
        </div>
        <div className="rounded-2xl bg-orange-50 p-4">
          <div className="text-2xl font-black text-coral-500">{streak}</div>
          <div className="mt-1 text-xs font-semibold text-charcoal/55">Day Streak</div>
        </div>
        <div className="rounded-2xl bg-lime-50 p-4">
          <div className="text-2xl font-black text-lime-600">{breaksCompleted}</div>
          <div className="mt-1 text-xs font-semibold text-charcoal/55">Breaks Done</div>
        </div>
        <div className="rounded-2xl bg-violet-50 p-4">
          <div className="text-2xl font-black text-violet-500">{flowSafeReturns}</div>
          <div className="mt-1 text-xs font-semibold text-charcoal/55">Flow Returns</div>
        </div>
      </div>
    </div>
  );
};
