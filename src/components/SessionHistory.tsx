import React from 'react';
import type { SessionSummary } from '../types';

interface SessionHistoryProps {
  history: SessionSummary[];
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="panel-card p-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Activity</p>
          <h3 className="mt-1 text-lg font-black text-navy">Recent Sessions</h3>
        </div>
        <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/75 py-8 text-center text-charcoal/50">
          <p className="text-sm font-bold">No sessions yet.</p>
          <p className="text-xs mt-1">Start your first focus session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card p-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Activity</p>
        <h3 className="mt-1 text-lg font-black text-navy">Recent Sessions</h3>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {history.slice(0, 5).map((session, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-[20px] bg-slate-50 p-4 transition-colors hover:bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-lavender rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-sky-500/10">
                {new Date(session.date).getDate()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-navy">
                  {session.totalFocusMinutes} min focus
                </div>
                <div className="text-xs font-semibold text-charcoal/55">
                  {session.breaksCompleted} breaks • {session.pointsEarned} pts
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs font-semibold text-charcoal/55">
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
