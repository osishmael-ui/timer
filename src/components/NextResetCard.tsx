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
    <div className="bg-gradient-to-br from-mint/40 to-lime-500/20 rounded-2xl p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wide">
        Next Reset
      </h3>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-charcoal truncate">
            {suggestedMovement}
          </p>
          <p className="text-xs text-charcoal/60 mt-0.5">
            in {formatTime(secondsUntilNudge)}
          </p>
        </div>
      </div>
    </div>
  );
};
