import React from 'react';
import type { SessionSummary } from '../types';

interface SessionHistoryProps {
  history: SessionSummary[];
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="glass rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-charcoal/70 mb-4 uppercase tracking-wide flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"/>
            <polyline points="12.5 13 12.5 17 16.5 17"/>
            <path d="M4 2v20l4-4 4 4 4-4 4 4V2"/>
          </svg>
          Recent Sessions
        </h3>
        <div className="text-center py-8 text-charcoal/50">
          <p className="text-sm">No sessions yet.</p>
          <p className="text-xs mt-1">Start your first focus session!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 shadow-xl">
      <h3 className="text-sm font-semibold text-charcoal/70 mb-4 uppercase tracking-wide flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="7"/>
          <polyline points="12.5 13 12.5 17 16.5 17"/>
          <path d="M4 2v20l4-4 4 4 4-4 4 4V2"/>
        </svg>
        Recent Sessions
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {history.slice(0, 5).map((session, index) => (
          <div
            key={index}
            className="bg-white/60 rounded-xl p-3 flex items-center justify-between hover:bg-white/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-lavender rounded-full flex items-center justify-center text-white font-bold text-sm">
                {new Date(session.date).getDate()}
              </div>
              <div>
                <div className="text-sm font-medium text-charcoal">
                  {session.totalFocusMinutes} min focus
                </div>
                <div className="text-xs text-charcoal/60">
                  {session.breaksCompleted} breaks • {session.pointsEarned} pts
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-charcoal/60">
                {session.flowSafeReturns} returns
              </div>
              {session.badgesEarned.length > 0 && (
                <div className="text-xs text-lavender font-medium">
                  +{session.badgesEarned.length} badge{session.badgesEarned.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
