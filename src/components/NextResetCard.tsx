import React from 'react';

interface NextResetCardProps {
  suggestedMovement: string;
  secondsUntilNudge: number;
}

export const NextResetCard: React.FC<NextResetCardProps> = ({
  suggestedMovement,
  secondsUntilNudge,
}) => {
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="panel-card p-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-lime-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-lime-500/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-charcoal/45">Next Reset</p>
          <p className="mt-1 text-base font-black text-navy truncate">
            {suggestedMovement}
          </p>
          <p className="text-sm font-semibold text-charcoal/55 mt-0.5">
            in {formatTime(secondsUntilNudge)}
          </p>
        </div>
      </div>
    </div>
  );
};
