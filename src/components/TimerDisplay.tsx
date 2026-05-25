import React from 'react';

interface TimerDisplayProps {
  seconds: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'sky' | 'coral' | 'lime' | 'navy';
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  seconds,
  label,
  size = 'lg',
  color = 'sky',
}) => {
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const colors = {
    sky: 'text-sky-500',
    coral: 'text-coral-500',
    lime: 'text-lime-500',
    navy: 'text-navy-500',
  };

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-sm font-medium text-charcoal/60 mb-1 uppercase tracking-wide">
          {label}
        </span>
      )}
      <span className={`font-mono font-bold ${sizes[size]} ${colors[color]} tabular-nums`}>
        {formatTime(seconds)}
      </span>
    </div>
  );
};
