import { useState, useEffect } from 'react';
import { SessionState, FocusSession, DailyStats } from '../types';
import { getSession, getDailyStats, getTotalPoints, getStreak } from '../storage/local-storage';

interface PopupState {
  session: FocusSession;
  dailyStats: DailyStats;
  totalPoints: number;
  streak: number;
}

const STATE_LABELS: Record<SessionState, string> = {
  idle: 'Ready to Focus',
  focus: 'In Flow',
  'sitting-too-long': 'Time to Move',
  'break-suggested': 'Break Ready',
  'break-active': 'Breaking...',
  'break-drifting': 'Come Back!',
  returned: 'Welcome Back',
};

const STATE_COLORS: Record<SessionState, string> = {
  idle: 'bg-gray-100 text-gray-700',
  focus: 'bg-sky-100 text-sky-700',
  'sitting-too-long': 'bg-orange-100 text-orange-700',
  'break-suggested': 'bg-lime-100 text-lime-700',
  'break-active': 'bg-emerald-100 text-emerald-700',
  'break-drifting': 'bg-red-100 text-red-700',
  returned: 'bg-purple-100 text-purple-700',
};

// Simple SVG icons as components
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

const SkipForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const AwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const FlameIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
);

const CoffeeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.5 3H6c-1.1 0-2 .9-2 2v9.91c0 2.82 2.56 5.25 5.57 5.07 2.7-.16 4.43-2.47 4.43-5.08V15h4.5c1.93 0 3.5-1.57 3.5-3.5S20.43 8 18.5 8H17V5c0-1.1-.9-2-2-2h3.5zM16 13H6V5h10v8zm2.5-2c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H17v-3h1.5z"/>
  </svg>
);

export default function Popup() {
  const [state, setState] = useState<PopupState | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusTimer, setFocusTimer] = useState(0);

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadState() {
    try {
      const [session, dailyStats, totalPoints, streak] = await Promise.all([
        getSession(),
        getDailyStats(),
        getTotalPoints(),
        getStreak(),
      ]);
      
      setState({ session, dailyStats, totalPoints, streak });
      
      // Update focus timer if session is active
      if (session.active && session.startedAt) {
        const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
        setFocusTimer(elapsed);
      } else {
        setFocusTimer(0);
      }
    } catch (error) {
      console.error('Error loading state:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSession() {
    chrome.runtime.sendMessage({ type: 'START_SESSION' }, loadState);
  }

  async function handleEndSession() {
    chrome.runtime.sendMessage({ type: 'END_SESSION' }, loadState);
  }

  async function handleStartBreak() {
    chrome.runtime.sendMessage({ type: 'START_BREAK' }, loadState);
  }

  async function handleCompleteBreak() {
    chrome.runtime.sendMessage({ type: 'COMPLETE_BREAK' }, loadState);
  }

  async function handleSkipReminder() {
    chrome.runtime.sendMessage({ type: 'SKIP_REMINDER' }, loadState);
  }

  async function handleReturnFromDrift() {
    chrome.runtime.sendMessage({ type: 'RETURN_FROM_DRIFT' }, loadState);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function calculateMoveScore(): number {
    if (!state) return 0;
    const { movementBreaks, focusMinutes, skippedReminders } = state.dailyStats;
    
    const breakScore = Math.min(movementBreaks * 10, 50);
    const idealBreaks = Math.max(1, Math.floor(focusMinutes / 45));
    const ratioScore = movementBreaks >= idealBreaks ? 30 : Math.floor((movementBreaks / idealBreaks) * 30) || 0;
    const skipPenalty = Math.min(skippedReminders * 5, 20);
    
    return Math.max(0, Math.min(100, breakScore + ratioScore - skipPenalty));
  }

  if (loading || !state) {
    return (
      <div className="w-[350px] h-[500px] flex items-center justify-center bg-cream">
        <div className="text-charcoal">Loading...</div>
      </div>
    );
  }

  const { session, dailyStats, totalPoints, streak } = state;
  const currentState = session.currentState;
  const moveScore = calculateMoveScore();

  return (
    <div className="w-[350px] min-h-[500px] bg-cream text-charcoal font-sans">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-navy">StandLoop</h1>
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="p-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${STATE_COLORS[currentState]}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {STATE_LABELS[currentState]}
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {session.active ? (
            <>
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 mb-1">Focus Session</div>
                <div className="text-4xl font-bold text-navy font-mono">
                  {formatTime(focusTimer)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-sky-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-sky-600 mb-1">Sit Time</div>
                  <div className="text-lg font-semibold text-sky-700">
                    {session.sitTimeMinutes} min
                  </div>
                </div>
                <div className="bg-lime-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-lime-600 mb-1">Breaks Today</div>
                  <div className="text-lg font-semibold text-lime-700">
                    {dailyStats.movementBreaks}
                  </div>
                </div>
              </div>

              {/* Action Buttons based on state */}
              <div className="space-y-2">
                {currentState === 'focus' && (
                    <button
                      onClick={handleStartBreak}
                      className="w-full py-3 px-4 bg-lime-500 hover:bg-lime-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CoffeeIcon />
                      Take Movement Break
                    </button>
                )}

                {(currentState === 'sitting-too-long' || currentState === 'break-suggested') && (
                  <>
                    <button
                      onClick={handleStartBreak}
                      className="w-full py-3 px-4 bg-lime-500 hover:bg-lime-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CoffeeIcon />
                      Start Break
                    </button>
                    <button
                      onClick={handleSkipReminder}
                      className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <SkipForwardIcon />
                      Skip for Now
                    </button>
                  </>
                )}

                {currentState === 'break-active' && (
                  <>
                    <button
                      onClick={handleCompleteBreak}
                      className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon />
                      Complete Break & Return
                    </button>
                  </>
                )}

                {currentState === 'break-drifting' && (
                  <>
                    <button
                      onClick={handleReturnFromDrift}
                      className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <TrendingUpIcon />
                      Return to Work
                    </button>
                  </>
                )}

                <button
                  onClick={handleEndSession}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <PauseIcon />
                  End Session
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">Ready to start your focus session?</div>
              <button
                onClick={handleStartSession}
                className="w-full py-3 px-4 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <PlayIcon />
                Start Focus Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-mint-600 mb-1">
                <AwardIcon />
                <span className="text-xs font-medium">Move Score</span>
              </div>
              <div className="text-2xl font-bold text-mint-700">{moveScore}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                <FlameIcon />
                <span className="text-xs font-medium">Streak</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{streak}d</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lavender-600 mb-1">
                <AwardIcon />
                <span className="text-xs font-medium">Points</span>
              </div>
              <div className="text-2xl font-bold text-lavender-700">{totalPoints}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Break */}
      {(currentState === 'sitting-too-long' || currentState === 'break-suggested') && (
        <div className="px-4 pb-4">
          <div className="bg-lime-50 rounded-2xl p-4 border border-lime-200">
            <div className="text-sm text-lime-800 font-medium mb-1">Suggested Reset</div>
            <div className="text-lime-900">Stand and breathe for 2 min</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 text-center">
        <div className="text-xs text-gray-400">
          Stand up without dropping the thread
        </div>
      </div>
    </div>
  );
}
