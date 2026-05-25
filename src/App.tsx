import { useState, useEffect, useCallback } from 'react';
import { loadState, saveState, clearAllData, sendNotification } from './storage/localStorage';
import { 
  startFocusSession, 
  triggerMovementNudge, 
  startBreak, 
  delayNudge, 
  skipNudge, 
  checkDriftStatus, 
  returnToWork, 
  endSession,
  updateFocusTime,
  getReminderMessage,
  getSuggestedMovement,
} from './engine/stateMachine';
import type { AppState, SessionState } from './types';
import { CompanionOrb } from './components/CompanionOrb';
import { TimerDisplay } from './components/TimerDisplay';
import { ActionButton } from './components/ActionButton';
import { StatsCard } from './components/StatsCard';
import { NextResetCard } from './components/NextResetCard';
import { BadgeGrid } from './components/BadgeGrid';
import { SessionHistory } from './components/SessionHistory';
import { SettingsModal } from './components/SettingsModal';

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [elapsedFocusSeconds, setElapsedFocusSeconds] = useState(0);
  const [elapsedBreakSeconds, setElapsedBreakSeconds] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);

  // Save state on changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Check drift status periodically during break
  useEffect(() => {
    if (state.activeSession.currentState === 'break-active') {
      const interval = setInterval(() => {
        const newState = checkDriftStatus(state);
        if (newState.activeSession.currentState !== state.activeSession.currentState) {
          setState(newState);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state, state.activeSession.currentState, state.activeSession.breakStartedAt]);

  // Main timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      const { activeSession, settings: appSettings } = state;

      if (activeSession.active && activeSession.startedAt) {
        if (activeSession.currentState === 'focus') {
          const elapsedMs = Date.now() - activeSession.startedAt;
          const elapsedSecs = Math.floor(elapsedMs / 1000);
          setElapsedFocusSeconds(elapsedSecs);

          const focusIntervalSecs = appSettings.focusIntervalMinutes * 60;
          const timeSinceLastBreak = activeSession.lastBreakAt 
            ? Date.now() - activeSession.lastBreakAt 
            : elapsedMs;
          
          if (timeSinceLastBreak >= focusIntervalSecs * 1000) {
            setState(triggerMovementNudge(state));
            if (appSettings.notificationsEnabled) {
              sendNotification('Time for a movement reset', getReminderMessage(appSettings.reminderTone, 'movement-nudge'));
            }
          }

          if (elapsedSecs > 0 && elapsedSecs % 60 === 0) {
            setState(updateFocusTime(state, 1));
          }
        } else if (activeSession.currentState === 'break-active' || activeSession.currentState === 'break-drifting') {
          if (activeSession.breakStartedAt) {
            const elapsedMs = Date.now() - activeSession.breakStartedAt;
            const elapsedSecs = Math.floor(elapsedMs / 1000);
            setElapsedBreakSeconds(elapsedSecs);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, state.activeSession.active, state.activeSession.currentState, state.activeSession.startedAt, state.activeSession.breakStartedAt]);

  useEffect(() => {
    if (state.activeSession.currentState === 'session-complete') {
      setShowSessionComplete(true);
    }
  }, [state.activeSession.currentState]);

  const handleStartFocusSession = useCallback(() => {
    setState(startFocusSession(state));
    setElapsedFocusSeconds(0);
    setElapsedBreakSeconds(0);
    setShowSessionComplete(false);
  }, [state]);

  const handleTakeBreak = useCallback(() => {
    setState(startBreak(state));
    setElapsedBreakSeconds(0);
  }, [state]);

  const handleDelayNudge = useCallback(() => {
    const newState = delayNudge(state);
    newState.activeSession.lastBreakAt = Date.now();
    setState(newState);
  }, [state]);

  const handleSkipNudge = useCallback(() => {
    const newState = skipNudge(state);
    newState.activeSession.lastBreakAt = Date.now();
    setState(newState);
  }, [state]);

  const handleReturnToWork = useCallback(() => {
    setState(returnToWork(state));
    setElapsedBreakSeconds(0);
  }, [state]);

  const handleEndSession = useCallback(() => {
    setState(endSession(state));
  }, [state]);

  const handleSaveSettings = useCallback((newSettings: any) => {
    setState({ ...state, settings: newSettings });
  }, [state]);

  const handleResetData = useCallback(() => {
    clearAllData();
    setState(loadState());
  }, []);

  const secondsUntilNudge = (() => {
    if (!state.activeSession.active || !state.activeSession.startedAt) return 0;
    const focusIntervalSecs = state.settings.focusIntervalMinutes * 60;
    const timeSinceLastBreak = state.activeSession.lastBreakAt 
      ? (Date.now() - state.activeSession.lastBreakAt) / 1000 
      : elapsedFocusSeconds;
    return Math.max(0, Math.floor(focusIntervalSecs - timeSinceLastBreak));
  })();

  const suggestedMovement = getSuggestedMovement(state.activeSession.completedBreaks);

  const getStateMessage = (): string => {
    const messages: Record<SessionState, string> = {
      'idle': 'Ready when you are.',
      'focus': 'Building mode is on.',
      'movement-nudge': 'Tiny reset?',
      'break-active': 'Move gently. Keep the idea warm.',
      'break-drifting': 'Break is drifting.',
      'returned': 'Good reset. Back to the build.',
      'session-complete': 'Session complete!',
    };
    return messages[state.activeSession.currentState];
  };

  const getStateSubMessage = (): string => {
    switch (state.activeSession.currentState) {
      case 'movement-nudge':
        return 'Stand, breathe, move briefly, then get back before the thread cools.';
      case 'break-drifting':
        return 'Good break. Now come back before the idea gets cold.';
      case 'focus':
        return 'Stand up without dropping the thread.';
      default:
        return '';
    }
  };

  const renderMainContent = () => {
    const { currentState } = state.activeSession;

    if (showSessionComplete && currentState === 'session-complete') {
      return (
        <div className="glass rounded-3xl p-8 shadow-2xl text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-lavender to-sky-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-2">Session Complete!</h2>
          <p className="text-charcoal/60 mb-6">Great work. Time to reflect and reset.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-sky-500/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-sky-500">{state.dailyStats.focusMinutes}</div>
              <div className="text-xs text-charcoal/60">Focus Minutes</div>
            </div>
            <div className="bg-lime-500/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-lime-600">{state.activeSession.completedBreaks}</div>
              <div className="text-xs text-charcoal/60">Breaks Completed</div>
            </div>
            <div className="bg-lavender/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-lavender">{state.activeSession.pointsEarnedInSession}</div>
              <div className="text-xs text-charcoal/60">Points Earned</div>
            </div>
            <div className="bg-coral-500/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-coral-500">{state.activeSession.flowSafeReturns}</div>
              <div className="text-xs text-charcoal/60">Flow Returns</div>
            </div>
          </div>

          <ActionButton onClick={handleStartFocusSession} variant="primary" size="lg" className="w-full">
            Start New Session
          </ActionButton>
        </div>
      );
    }

    if (currentState === 'idle') {
      return (
        <div className="glass rounded-3xl p-8 shadow-2xl text-center max-w-lg mx-auto">
          <div className="mb-6">
            <CompanionOrb state={currentState} />
          </div>
          <h2 className="text-3xl font-bold text-charcoal mb-3">Stand up without dropping the thread.</h2>
          <p className="text-charcoal/60 mb-8 text-lg">
            StandLoop helps coders, founders, and desk workers break up long focus sessions with short, flow-safe movement nudges.
          </p>
          <ActionButton onClick={handleStartFocusSession} variant="primary" size="lg" className="px-12">
            Start Focus Session
          </ActionButton>
          <p className="text-xs text-charcoal/40 mt-6">
            No login. No tracking. Your rhythm stays in your browser.
          </p>
        </div>
      );
    }

    return (
      <div className="glass rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-charcoal mb-1">{getStateMessage()}</h2>
          {getStateSubMessage() && (
            <p className="text-charcoal/60 text-sm">{getStateSubMessage()}</p>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <CompanionOrb state={currentState} />
        </div>

        <div className="flex justify-center mb-8">
          {currentState === 'focus' ? (
            <TimerDisplay seconds={elapsedFocusSeconds} label="Focus Time" size="lg" color="sky" />
          ) : (
            <TimerDisplay seconds={elapsedBreakSeconds} label="Break Time" size="lg" color={currentState === 'break-drifting' ? 'coral' : 'lime'} />
          )}
        </div>

        <div className="space-y-3">
          {currentState === 'focus' && (
            <>
              <ActionButton onClick={handleTakeBreak} variant="success" size="lg" className="w-full">
                Take Break
              </ActionButton>
              <div className="flex gap-3">
                <ActionButton onClick={handleEndSession} variant="secondary" size="md" className="flex-1">
                  End Session
                </ActionButton>
              </div>
            </>
          )}

          {currentState === 'movement-nudge' && (
            <>
              <ActionButton onClick={handleTakeBreak} variant="success" size="lg" className="w-full">
                Start 2-min Break
              </ActionButton>
              <div className="flex gap-3">
                <ActionButton onClick={handleDelayNudge} variant="secondary" size="md" className="flex-1">
                  Delay 10 min
                </ActionButton>
                <ActionButton onClick={handleSkipNudge} variant="danger" size="md" className="flex-1">
                  Skip
                </ActionButton>
              </div>
            </>
          )}

          {(currentState === 'break-active' || currentState === 'break-drifting') && (
            <ActionButton onClick={handleReturnToWork} variant="primary" size="lg" className="w-full">
              Back to Work
            </ActionButton>
          )}
        </div>

        {currentState === 'focus' && (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-charcoal/60 mb-2">
              <span>Next reset in</span>
              <span>{Math.floor(secondsUntilNudge / 60)}m {secondsUntilNudge % 60}s</span>
            </div>
            <div className="w-full bg-charcoal/10 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-lavender transition-all duration-1000"
                style={{ width: `${Math.min(100, ((state.settings.focusIntervalMinutes * 60 - secondsUntilNudge) / (state.settings.focusIntervalMinutes * 60)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal">StandLoop</h1>
              <p className="text-xs text-charcoal/60">Stand up without dropping the thread.</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/60 hover:bg-white/80 flex items-center justify-center transition-colors shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 xl:col-span-8">
            {renderMainContent()}
            
            {state.activeSession.active && state.activeSession.currentState === 'focus' && (
              <div className="mt-6">
                <NextResetCard suggestedMovement={suggestedMovement} secondsUntilNudge={secondsUntilNudge} />
              </div>
            )}
          </div>

          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <StatsCard 
              moveScore={state.dailyStats.points}
              streak={state.currentStreak}
              breaksCompleted={state.dailyStats.movementBreaks}
              flowSafeReturns={state.dailyStats.flowSafeReturns}
            />
            <BadgeGrid earnedBadges={state.badges} />
            <SessionHistory history={state.sessionHistory} />
          </div>
        </div>
      </main>

      <SettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={state.settings}
        onSave={handleSaveSettings}
        onResetData={handleResetData}
      />
    </div>
  );
}

export default App;
