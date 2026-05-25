import React from 'react';

interface CompanionOrbProps {
  state: 'idle' | 'focus' | 'movement-nudge' | 'break-active' | 'break-drifting' | 'returned' | 'session-complete';
}

/**
 * Loop Spark - Abstract visual companion for StandLoop
 * A simple, cute but builder-friendly mascot made with CSS/SVG
 */
export const CompanionOrb: React.FC<CompanionOrbProps> = ({ state }) => {
  // Different colors and animations based on state
  const getStateStyles = () => {
    switch (state) {
      case 'idle':
        return { color: '#94A3B8', animation: 'float', message: 'Ready when you are.' };
      case 'focus':
        return { color: '#0EA5E9', animation: 'pulse-slow', message: 'Building mode is on.' };
      case 'movement-nudge':
        return { color: '#F97316', animation: 'bounce', message: 'Tiny reset?' };
      case 'break-active':
        return { color: '#84CC16', animation: 'float', message: 'Move gently. Keep the idea warm.' };
      case 'break-drifting':
        return { color: '#F97316', animation: 'shake', message: 'Break is drifting.' };
      case 'returned':
        return { color: '#A7F3D0', animation: 'celebrate', message: 'Good reset. Back to the build.' };
      case 'session-complete':
        return { color: '#C4B5FD', animation: 'celebrate', message: 'Session complete!' };
      default:
        return { color: '#94A3B8', animation: 'float', message: '' };
    }
  };

  const styles = getStateStyles();

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className={`transition-all duration-500 ${
          styles.animation === 'bounce' ? 'animate-bounce' :
          styles.animation === 'shake' ? 'animate-pulse' :
          'animate-pulse'
        }`}
        style={{ animationDuration: styles.animation === 'pulse-slow' ? '3s' : '2s' }}
      >
        {/* Outer glow */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill={styles.color}
          opacity="0.2"
          className="transition-all duration-500"
        />
        
        {/* Main orb */}
        <circle
          cx="60"
          cy="60"
          r="35"
          fill={styles.color}
          className="transition-all duration-500"
        />
        
        {/* Inner highlight */}
        <circle
          cx="60"
          cy="60"
          r="25"
          fill="white"
          opacity="0.3"
        />
        
        {/* Sparkle accents */}
        {(state === 'returned' || state === 'session-complete') && (
          <>
            <circle cx="85" cy="35" r="4" fill="#FCD34D" className="animate-ping" />
            <circle cx="35" cy="40" r="3" fill="#FCD34D" className="animate-ping" style={{ animationDelay: '0.2s' }} />
            <circle cx="90" cy="70" r="3" fill="#FCD34D" className="animate-ping" style={{ animationDelay: '0.4s' }} />
          </>
        )}
        
        {/* Simple eyes based on state */}
        {state === 'focus' && (
          <>
            <ellipse cx="50" cy="55" rx="4" ry="6" fill="#1E293B" />
            <ellipse cx="70" cy="55" rx="4" ry="6" fill="#1E293B" />
          </>
        )}
        {state === 'movement-nudge' && (
          <>
            <circle cx="50" cy="55" r="5" fill="#1E293B" />
            <circle cx="70" cy="55" r="5" fill="#1E293B" />
            <path d="M 55 65 Q 60 60 65 65" stroke="#1E293B" strokeWidth="2" fill="none" />
          </>
        )}
        {state === 'break-drifting' && (
          <>
            <line x1="45" y1="52" x2="55" y2="58" stroke="#1E293B" strokeWidth="2" />
            <line x1="55" y1="52" x2="45" y2="58" stroke="#1E293B" strokeWidth="2" />
            <line x1="65" y1="52" x2="75" y2="58" stroke="#1E293B" strokeWidth="2" />
            <line x1="75" y1="52" x2="65" y2="58" stroke="#1E293B" strokeWidth="2" />
            <path d="M 55 70 Q 60 65 65 70" stroke="#1E293B" strokeWidth="2" fill="none" />
          </>
        )}
        {(state === 'returned' || state === 'session-complete') && (
          <>
            <path d="M 45 55 Q 50 60 55 55" stroke="#1E293B" strokeWidth="2" fill="none" />
            <path d="M 65 55 Q 70 60 75 55" stroke="#1E293B" strokeWidth="2" fill="none" />
            <path d="M 50 65 Q 60 75 70 65" stroke="#1E293B" strokeWidth="2" fill="none" />
          </>
        )}
        {(state === 'idle' || state === 'break-active') && (
          <>
            <circle cx="50" cy="55" r="3" fill="#1E293B" />
            <circle cx="70" cy="55" r="3" fill="#1E293B" />
            <path d="M 55 65 Q 60 68 65 65" stroke="#1E293B" strokeWidth="2" fill="none" />
          </>
        )}
      </svg>
      
      {/* State message */}
      <p className="mt-3 text-sm font-medium text-charcoal/70 text-center">
        {styles.message}
      </p>
    </div>
  );
};
