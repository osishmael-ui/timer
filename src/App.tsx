import React, { useState, useEffect, useCallback, useRef } from 'react';
import { loadState, saveState, clearAllData, sendNotification, requestNotificationPermission, exportStateJson, parseImportedState } from './storage/localStorage';
import {
  deleteAccount,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  signIn,
  signOut,
  signUp,
  updateProfile,
} from './auth/authStorage';
import type { AuthUser } from './auth/authStorage';
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
import type { AppState, DailyPlan, DailyPlanBlock, FocusGoal, SessionState, SessionSummary, SessionTag, TimerPreset, TimerRoutine, UserSettings } from './types';
import { BADGES, SCORING } from './types';
import { CompanionOrb } from './components/CompanionOrb';
import { TimerDisplay } from './components/TimerDisplay';
import { ActionButton } from './components/ActionButton';
import { NextResetCard } from './components/NextResetCard';
import { SettingsModal } from './components/SettingsModal';
import { PlanMyDay } from './components/PlanMyDay';
import { StatsCard } from './components/StatsCard';
import { BadgeGrid } from './components/BadgeGrid';
import { SessionHistory } from './components/SessionHistory';
import { GoalsView, HistoryView, RetentionSettingsView, RewardsView, RoutinesView } from './components/RetentionViews';
import { AccountPanel } from './components/AccountPanel';
import { AuthGate, AuthLoading, ResetPasswordView } from './components/AuthGate';
import { LegalPage } from './components/LegalPage';
import { PublicPages } from './components/PublicPages';
import type { MarketingRoute } from './components/PublicPages';
import { parseTime } from './utils/dailyPlanner';

type AppView = 'plan' | 'session' | 'progress' | 'history' | 'goals' | 'routines' | 'rewards' | 'settings' | 'science' | 'account';
type PublicRoute = MarketingRoute | 'app' | 'privacy' | 'terms' | 'reset';
type ActiveAlert = 'movement-nudge' | 'break-complete' | 'break-drifting' | null;
type BrowserWindowWithWebkitAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

const sessionReflectionMessages = [
  {
    title: 'Progress banked.',
    detail: 'You showed up, protected attention, and closed the loop. That is real forward motion.',
  },
  {
    title: 'A solid block counts.',
    detail: 'Even one focused session can move the day. You gave the work a clear container.',
  },
  {
    title: 'You kept the promise.',
    detail: 'The win is not doing everything. It is choosing a block, working it, and ending with intention.',
  },
  {
    title: 'Momentum is still momentum.',
    detail: 'This session added evidence that you can return to focus without forcing the whole day.',
  },
  {
    title: 'Good stopping is progress.',
    detail: 'You finished the session cleanly. That makes the next start easier, not heavier.',
  },
];

const getSessionReceiptFocusMinutes = (summary: SessionSummary | null | undefined, fallbackFocusMinutes: number): number => {
  if (!summary) return fallbackFocusMinutes;
  if (summary.durationMinutes > 0 && summary.totalFocusMinutes > summary.durationMinutes) {
    return summary.durationMinutes;
  }
  return summary.totalFocusMinutes;
};

const navigationItems: Array<{
  id: AppView;
  label: string;
  iconPath: string;
}> = [
  { id: 'plan', label: 'Plan', iconPath: 'M4 6h16M4 12h10M4 18h16' },
  { id: 'session', label: 'Session in progress', iconPath: 'M8 5v14M16 5v14M4 12h16' },
  { id: 'progress', label: 'Progress overview', iconPath: 'M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-8' },
  { id: 'history', label: 'History', iconPath: 'M3 12a9 9 0 1 0 3-6.7M3 4v6h6M12 7v5l3 2' },
  { id: 'goals', label: 'Goals', iconPath: 'M12 21a9 9 0 1 0-9-9M12 17a5 5 0 1 0-5-5M12 13a1 1 0 1 0-1-1' },
  { id: 'routines', label: 'Routines', iconPath: 'M4 5h16M4 12h16M4 19h16M8 5v14' },
  { id: 'rewards', label: 'Rewards', iconPath: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4M5 6H3a4 4 0 0 0 4 4M19 6h2a4 4 0 0 1-4 4' },
  { id: 'settings', label: 'Settings', iconPath: 'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5M19 13v-2M5 13v-2M17 5.5l-1.4 1.4M8.4 17.1 7 18.5M7 5.5l1.4 1.4M15.6 17.1l1.4 1.4' },
  { id: 'science', label: 'Logic and terms', iconPath: 'M12 3v18M6 7h12M8 21h8M8 3h8' },
  { id: 'account', label: 'Account', iconPath: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10' },
];

const planKindLabel = (kind: DailyPlanBlock['kind']): string => {
  if (kind === 'deepWork') return 'Deep work';
  if (kind === 'backupDeepWork') return 'Fallback (if needed)';
  if (kind === 'secondaryFocus') return 'Secondary focus';
  if (kind === 'movement') return 'Movement';
  if (kind === 'recovery') return 'Recovery';
  if (kind === 'fixed') return 'Fixed';
  return 'Admin';
};

const planKindClass = (kind: DailyPlanBlock['kind']): string => {
  if (kind === 'deepWork') return 'bg-sky-500 text-white';
  if (kind === 'backupDeepWork') return 'bg-lavender text-slate-950';
  if (kind === 'secondaryFocus') return 'bg-emerald-400 text-slate-950';
  if (kind === 'movement') return 'bg-lime-400 text-slate-950';
  if (kind === 'recovery') return 'bg-coral-400 text-slate-950';
  if (kind === 'fixed') return 'bg-slate-300 text-slate-900';
  return 'bg-white text-slate-950';
};

const formatPlanDuration = (block: DailyPlanBlock): string => {
  const minutes = Math.max(0, parseTime(block.endTime) - parseTime(block.startTime));
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

// Helper components for Today's Plan sidebar and mobile views
interface PlanPosition {
  blocks: DailyPlanBlock[];
  currentBlock: DailyPlanBlock | null;
  nextBlock: DailyPlanBlock | null;
  completedBlocks: DailyPlanBlock[];
  activeIndex: number;
  dayProgress: number;
  blockProgress: number;
}

interface MobileTodayPlanProps {
  planPosition: PlanPosition;
  onViewPlan: () => void;
}

const MobileTodayPlan: React.FC<MobileTodayPlanProps> = ({ planPosition, onViewPlan }) => {
  const currentClockMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  
  return (
    <div className="mt-6 panel-card xl:hidden">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Today's Plan</p>
        <span className="text-xs font-black text-charcoal/55">
          {planPosition.completedBlocks.length} done · {planPosition.currentBlock ? '1 now' : 'between'} · {planPosition.blocks.length - planPosition.completedBlocks.length - (planPosition.currentBlock ? 1 : 0)} up
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {planPosition.blocks.slice(0, 5).map((block) => {
          const isCurrent = planPosition.currentBlock?.id === block.id;
          const isComplete = parseTime(block.endTime) <= currentClockMinutes;
          return (
            <div key={block.id} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ${isCurrent ? 'bg-sky-50 ring-sky-200' : isComplete ? 'bg-slate-50 ring-slate-100' : 'bg-white ring-slate-200'}`}>
              <div className="min-w-0">
                <p className={`truncate text-xs font-black ${isCurrent ? 'text-navy' : isComplete ? 'text-charcoal/50 line-through' : 'text-charcoal/70'}`}>
                  {block.title}
                </p>
                <p className="text-[10px] font-semibold text-charcoal/45">{block.startTime}-{block.endTime}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${isCurrent ? planKindClass(block.kind) : isComplete ? 'bg-lime-100 text-lime-700' : 'bg-slate-100 text-charcoal/45'}`}>
                {isCurrent ? 'Now' : isComplete ? 'Done' : ''}
              </span>
            </div>
          );
        })}
        {planPosition.blocks.length > 5 && (
          <button
            onClick={onViewPlan}
            className="w-full rounded-xl bg-slate-50 py-2 text-xs font-bold text-sky-600 hover:bg-slate-100"
          >
            View all {planPosition.blocks.length} blocks →
          </button>
        )}
      </div>
    </div>
  );
};

interface TodayPlanSidebarProps {
  planPosition: PlanPosition;
}

const TodayPlanSidebar: React.FC<TodayPlanSidebarProps> = ({ planPosition }) => {
  const currentClockMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  
  return (
    <div className="panel-card flex flex-col p-5 xl:flex-1">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Today's Plan</p>
      <h3 className="mt-1 text-lg font-black text-navy">
        {planPosition.completedBlocks.length} done · {planPosition.currentBlock ? '1 now' : 'Between blocks'} · {planPosition.blocks.length - planPosition.completedBlocks.length - (planPosition.currentBlock ? 1 : 0)} upcoming
      </h3>
      <div className="mt-4 max-h-[42rem] space-y-2 overflow-y-auto pr-1 xl:flex-1">
        {planPosition.blocks.map((block) => {
          const isCurrent = planPosition.currentBlock?.id === block.id;
          const isComplete = parseTime(block.endTime) <= currentClockMinutes;
          return (
            <div key={block.id} className={`rounded-2xl p-3 ring-1 ${isCurrent ? 'bg-sky-50 ring-sky-200' : 'bg-white/80 ring-slate-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-navy">{block.title}</p>
                  <p className="mt-1 text-xs font-semibold text-charcoal/55">{block.startTime}-{block.endTime} · {formatPlanDuration(block)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${isCurrent ? planKindClass(block.kind) : isComplete ? 'bg-lime-100 text-lime-700' : 'bg-slate-100 text-charcoal/55'}`}>
                  {isCurrent ? 'Now' : isComplete ? 'Done' : planKindLabel(block.kind)}
                </span>
              </div>
              {isCurrent && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sky-100">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${planPosition.blockProgress}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NoPlanSidebar: React.FC = () => (
  <div className="panel-card p-5">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Today's Plan</p>
    <h3 className="mt-1 text-lg font-black text-navy">No plan for today yet</h3>
    <p className="mt-3 text-sm font-semibold text-charcoal/55">
      Create a plan to see your focus blocks, movement breaks, and recovery time laid out for the day.
    </p>
    <a
      href="#app"
      onClick={(e) => { e.preventDefault(); window.location.hash = '#app'; }}
      className="mt-4 inline-block rounded-full bg-sky-500 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-sky-600"
    >
      Plan My Day
    </a>
  </div>
);

interface RhythmCardProps {
  focusIntervalMinutes: number;
  secondsUntilNudge: number;
  activeSession: AppState['activeSession'];
}

const RhythmCard: React.FC<RhythmCardProps> = ({ focusIntervalMinutes, secondsUntilNudge, activeSession }) => (
  <div className="panel-card p-5">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Rhythm</p>
    <h3 className="mt-1 text-lg font-black text-navy">{focusIntervalMinutes}m reset cadence</h3>
    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-lime-400 to-lavender transition-all duration-1000"
        style={{ width: `${focusIntervalMinutes > 0 ? ((focusIntervalMinutes * 60 - secondsUntilNudge) / (focusIntervalMinutes * 60)) * 100 : 0}%` }}
      />
    </div>
    <p className="mt-3 text-sm font-semibold text-charcoal/55">
      {activeSession.active
        ? `Next reset in ${Math.floor(secondsUntilNudge / 60)}m ${secondsUntilNudge % 60}s`
        : 'Start a focus session to begin the reset cadence.'}
    </p>
  </div>
);

interface BreakLengthCardProps {
  breakDurationMinutes: number;
}

const BreakLengthCard: React.FC<BreakLengthCardProps> = ({ breakDurationMinutes }) => (
  <div className="panel-card p-5">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Break Length</p>
    <h3 className="mt-1 text-lg font-black text-navy">{breakDurationMinutes}m recommended</h3>
    <p className="mt-3 text-sm font-semibold text-charcoal/55">
      Short resets protect momentum. The app will chime when the break target is up.
    </p>
  </div>
);

const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];

const getDayLabel = (dateKey: string): string => {
  const date = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date);
};

const getPublicRoute = (): PublicRoute => {
  const hash = window.location.hash;
  if (hash.startsWith('#features')) return 'features';
  if (hash.startsWith('#pricing')) return 'pricing';
  if (hash.startsWith('#download')) return 'download';
  if (hash.startsWith('#help')) return 'help';
  if (hash.startsWith('#privacy')) return 'privacy';
  if (hash.startsWith('#terms')) return 'terms';
  if (hash.startsWith('#contact')) return 'contact';
  if (hash.startsWith('#changelog')) return 'changelog';
  if (hash.startsWith('#app')) return 'app';
  if (hash.startsWith('#reset')) return 'reset';
  return 'home';
};

const isMarketingRoute = (route: PublicRoute): route is MarketingRoute => (
  route === 'home'
  || route === 'features'
  || route === 'pricing'
  || route === 'download'
  || route === 'help'
  || route === 'contact'
  || route === 'changelog'
);

const getResetToken = (): string => {
  const rawHash = window.location.hash.startsWith('#reset') ? window.location.hash.slice('#reset'.length) : '';
  const query = rawHash.startsWith('?') ? rawHash : '';
  return new URLSearchParams(query).get('token') ?? '';
};

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [publicRoute, setPublicRoute] = useState<PublicRoute>(() => getPublicRoute());
  const [state, setState] = useState<AppState>(() => {
    const user = getCurrentUser();
    return loadState(user?.profile.id);
  });
  const [currentPlan, setCurrentPlan] = useState<DailyPlan | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [elapsedFocusSeconds, setElapsedFocusSeconds] = useState(0);
  const [elapsedBreakSeconds, setElapsedBreakSeconds] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('plan');
  const [activeAlert, setActiveAlert] = useState<ActiveAlert>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => (
    'Notification' in window ? Notification.permission : 'unsupported'
  ));
  const [waitingForPlanStart, setWaitingForPlanStart] = useState(false);
  const [planStartTimeMs, setPlanStartTimeMs] = useState<number | null>(null);
  const breakTargetAlertedRef = useRef(false);
  const lastStateAlertRef = useRef<SessionState>('idle');

  useEffect(() => {
    const handleHashChange = () => setPublicRoute(getPublicRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const playAlert = useCallback((kind: 'nudge' | 'complete' | 'drift' = 'nudge') => {
    if (!state.settings.soundEnabled) return;

    const AudioContextCtor = window.AudioContext || (window as BrowserWindowWithWebkitAudio).webkitAudioContext;
    if (!AudioContextCtor) return;

    const audioContext = new AudioContextCtor();
    const gain = audioContext.createGain();
    gain.connect(audioContext.destination);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.75);

    const tones = {
      nudge: [660, 880],
      complete: [784, 988, 1175],
      drift: [440, 392, 330],
    }[kind];

    tones.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.14);
      oscillator.connect(gain);
      oscillator.start(audioContext.currentTime + index * 0.14);
      oscillator.stop(audioContext.currentTime + index * 0.14 + 0.12);
    });

    window.setTimeout(() => {
      void audioContext.close();
    }, 1000);
  }, [state.settings.soundEnabled]);

  // Save state on changes
  useEffect(() => {
    if (authUser) saveState(state, authUser.profile.id);
  }, [authUser, state]);

  useEffect(() => {
    const reminder = state.settings.gentleReminders;
    if (!reminder.enabled) return;

    const todayKey = new Date().toISOString().split('T')[0];
    const now = new Date();
    const weekday = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (reminder.lastShownDate === todayKey || !reminder.days.includes(weekday) || currentTime < reminder.checkInHour) return;

    const timeout = window.setTimeout(() => {
      if (state.settings.notificationsEnabled) {
        sendNotification('Qithym check-in', reminder.message);
      }

      setState((current) => ({
        ...current,
        settings: {
          ...current.settings,
          gentleReminders: {
            ...current.settings.gentleReminders,
            lastShownDate: todayKey,
          },
        },
      }));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [state.settings.gentleReminders, state.settings.notificationsEnabled]);

  // Check drift status periodically during break
  useEffect(() => {
    if (state.activeSession.currentState === 'break-active') {
      const interval = setInterval(() => {
        const newState = checkDriftStatus(state);
        if (newState.activeSession.currentState !== state.activeSession.currentState) {
          setState(newState);
          setActiveAlert('break-drifting');
          playAlert('drift');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [playAlert, state, state.activeSession.currentState, state.activeSession.breakStartedAt]);

  // Main timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNowMs(currentTime);
      const { activeSession, settings: appSettings } = state;

      if (activeSession.active && activeSession.startedAt) {
        if (activeSession.currentState === 'focus') {
          const activeSegmentSecs = activeSession.focusStartedAt
            ? Math.floor((currentTime - activeSession.focusStartedAt) / 1000)
            : 0;
          const totalFocusSecs = activeSession.accumulatedFocusSeconds + activeSegmentSecs;
          setElapsedFocusSeconds(totalFocusSecs);

          const focusIntervalSecs = appSettings.focusIntervalMinutes * 60;
          const timeSinceLastBreak = activeSession.lastBreakAt 
            ? currentTime - activeSession.lastBreakAt 
            : currentTime - activeSession.startedAt;
          
          if (timeSinceLastBreak >= focusIntervalSecs * 1000) {
            setState(triggerMovementNudge(state));
            setActiveAlert('movement-nudge');
            playAlert('nudge');
            if (appSettings.notificationsEnabled) {
              sendNotification('Time for a movement reset', getReminderMessage(appSettings.reminderTone, 'movement-nudge'));
            }
          }

          const totalFocusMinutes = Math.floor(totalFocusSecs / 60);
          if (totalFocusMinutes > activeSession.focusMinutesCredited) {
            const minutesToAdd = totalFocusMinutes - activeSession.focusMinutesCredited;
            setState(updateFocusTime(state, minutesToAdd));
          }
        } else if (activeSession.currentState === 'break-active' || activeSession.currentState === 'break-drifting') {
          if (activeSession.breakStartedAt) {
            const elapsedMs = currentTime - activeSession.breakStartedAt;
            const elapsedSecs = Math.floor(elapsedMs / 1000);
            setElapsedBreakSeconds(elapsedSecs);
            const breakTargetSecs = appSettings.breakDurationMinutes * 60;
            if (elapsedSecs >= breakTargetSecs && !breakTargetAlertedRef.current) {
              breakTargetAlertedRef.current = true;
              setActiveAlert('break-complete');
              playAlert('complete');
              if (appSettings.notificationsEnabled) {
                sendNotification('Break complete', 'Your planned break is up. Come back when you are ready.');
              }
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playAlert, state, state.activeSession.active, state.activeSession.currentState, state.activeSession.startedAt, state.activeSession.breakStartedAt]);

  useEffect(() => {
    if (!activeAlert || !state.settings.soundEnabled) return undefined;

    const interval = window.setInterval(() => {
      playAlert(activeAlert === 'break-drifting' ? 'drift' : activeAlert === 'break-complete' ? 'complete' : 'nudge');
    }, 15000);

    return () => window.clearInterval(interval);
  }, [activeAlert, playAlert, state.settings.soundEnabled]);

  useEffect(() => {
    const currentState = state.activeSession.currentState;
    if (currentState !== lastStateAlertRef.current) {
      if (currentState === 'break-active') {
        breakTargetAlertedRef.current = false;
      }

      if (currentState === 'session-complete') {
        playAlert('complete');
      }

      lastStateAlertRef.current = currentState;
    }
  }, [playAlert, state.activeSession.currentState]);

  const handleStartFocusSession = useCallback(() => {
    setState(startFocusSession(state));
    setElapsedFocusSeconds(0);
    setElapsedBreakSeconds(0);
    setActiveAlert(null);
    setActiveView('session');
  }, [state]);

  const handleTakeBreak = useCallback(() => {
    setState(startBreak(state));
    setElapsedBreakSeconds(0);
    breakTargetAlertedRef.current = false;
    setActiveAlert(null);
  }, [state]);

  const handleDelayNudge = useCallback(() => {
    const newState = delayNudge(state);
    newState.activeSession.lastBreakAt = Date.now();
    setState(newState);
    setActiveAlert(null);
  }, [state]);

  const handleSkipNudge = useCallback(() => {
    const newState = skipNudge(state);
    newState.activeSession.lastBreakAt = Date.now();
    setState(newState);
    setActiveAlert(null);
  }, [state]);

  const handleReturnToWork = useCallback(() => {
    setState(returnToWork(state));
    setElapsedBreakSeconds(0);
    setActiveAlert(null);
  }, [state]);

  const handleEndSession = useCallback(() => {
    setState(endSession(state));
    setActiveAlert(null);
  }, [state]);

  const handleSaveSettings = useCallback(async (newSettings: UserSettings): Promise<boolean> => {
    let settingsToSave = newSettings;

    if (newSettings.notificationsEnabled) {
      const allowed = await requestNotificationPermission();
      setNotificationPermission('Notification' in window ? Notification.permission : 'unsupported');
      if (!allowed) {
        settingsToSave = { ...newSettings, notificationsEnabled: false };
        setState({ ...state, settings: settingsToSave });
        return false;
      }
    }

    setState({ ...state, settings: settingsToSave });
    return true;
  }, [state]);

  const handleResetData = useCallback(() => {
    clearAllData(authUser?.profile.id);
    setState(loadState(authUser?.profile.id));
    setActiveAlert(null);
  }, [authUser]);

  const handleExportData = useCallback(() => {
    const exportPayload = authUser
      ? JSON.stringify({
          exportedAt: new Date().toISOString(),
          account: {
            profile: authUser.profile,
            sessionExported: false,
          },
          data: JSON.parse(exportStateJson(state, authUser.profile.id)),
          notes: {
            passwordIncluded: false,
            resetTokensIncluded: false,
            syncStatus: 'Prepared for cloud sync; currently local to this browser.',
          },
        }, null, 2)
      : exportStateJson(state);
    const blob = new Blob([exportPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qithym-account-data-${state.dailyStats.date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [authUser, state]);

  const handleImportData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseImportedState(String(reader.result), authUser?.profile.id);
        setState(imported);
        setActiveAlert(null);
      } catch (error) {
        console.error('Could not import Qithym data:', error);
        window.alert('That file could not be imported. Please choose a Qithym JSON export.');
      }
    };
    reader.readAsText(file);
  }, [authUser]);

  const handleSetActiveTag = useCallback((tagId: string | null) => {
    setState((current) => ({
      ...current,
      activeSession: {
        ...current.activeSession,
        tagId,
      },
    }));
  }, []);

  const handleUpdateSessionTag = useCallback((sessionId: string, tagId: string | null) => {
    setState((current) => ({
      ...current,
      sessionHistory: current.sessionHistory.map((session) => (
        session.id === sessionId ? { ...session, tagId } : session
      )),
      lastSessionSummary: current.lastSessionSummary?.id === sessionId
        ? { ...current.lastSessionSummary, tagId }
        : current.lastSessionSummary,
    }));
  }, []);

  const handleSaveTag = useCallback((tag: SessionTag) => {
    setState((current) => ({
      ...current,
      tags: current.tags.some((item) => item.id === tag.id)
        ? current.tags.map((item) => item.id === tag.id ? tag : item)
        : [...current.tags, tag],
    }));
  }, []);

  const handleSaveGoal = useCallback((goal: FocusGoal) => {
    setState((current) => ({
      ...current,
      goals: current.goals.some((item) => item.id === goal.id)
        ? current.goals.map((item) => item.id === goal.id ? goal : item)
        : [goal, ...current.goals],
    }));
  }, []);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setState((current) => ({ ...current, goals: current.goals.filter((goal) => goal.id !== goalId) }));
  }, []);

  const handleResetGoal = useCallback((goalId: string) => {
    setState((current) => ({
      ...current,
      goals: current.goals.map((goal) => goal.id === goalId ? { ...goal, status: 'active', completedAt: null } : goal),
    }));
  }, []);

  const handleSaveRoutine = useCallback((routine: TimerRoutine) => {
    setState((current) => ({
      ...current,
      routines: current.routines.some((item) => item.id === routine.id)
        ? current.routines.map((item) => item.id === routine.id ? routine : item)
        : [routine, ...current.routines],
    }));
  }, []);

  const handleDeleteRoutine = useCallback((routineId: string) => {
    setState((current) => ({ ...current, routines: current.routines.filter((routine) => routine.id !== routineId) }));
  }, []);

  const handleSavePreset = useCallback((preset: TimerPreset) => {
    setState((current) => ({
      ...current,
      presets: current.presets.some((item) => item.id === preset.id)
        ? current.presets.map((item) => item.id === preset.id ? preset : item)
        : [preset, ...current.presets],
    }));
  }, []);

  const handleDeletePreset = useCallback((presetId: string) => {
    setState((current) => ({ ...current, presets: current.presets.filter((preset) => preset.id !== presetId) }));
  }, []);

  const startWithSetup = useCallback((nextSettings: UserSettings, tagId: string | null, routineId: string | null, presetId: string | null) => {
    const preparedState: AppState = {
      ...state,
      settings: nextSettings,
      activeSession: {
        ...state.activeSession,
        tagId,
        routineId,
        presetId,
      },
    };
    setState(startFocusSession(preparedState));
    setElapsedFocusSeconds(0);
    setElapsedBreakSeconds(0);
    setActiveAlert(null);
    setActiveView('session');
  }, [state]);

  const handleStartPreset = useCallback((presetId: string) => {
    const preset = state.presets.find((item) => item.id === presetId);
    if (!preset) return;
    startWithSetup({
      ...state.settings,
      focusIntervalMinutes: preset.focusIntervalMinutes,
      breakDurationMinutes: preset.breakDurationMinutes,
      driftThresholdMinutes: preset.driftThresholdMinutes,
    }, preset.tagId, null, preset.id);
  }, [startWithSetup, state.presets, state.settings]);

  const handleStartRoutine = useCallback((routineId: string) => {
    const routine = state.routines.find((item) => item.id === routineId);
    const firstStep = routine?.steps[0];
    if (!routine || !firstStep) return;
    const nextSettings = {
      ...state.settings,
      focusIntervalMinutes: firstStep.focusIntervalMinutes,
      breakDurationMinutes: firstStep.breakDurationMinutes,
    };
    const preparedState: AppState = {
      ...state,
      settings: nextSettings,
      routines: state.routines.map((item) => item.id === routine.id ? { ...item, lastStartedAt: Date.now() } : item),
      activeSession: {
        ...state.activeSession,
        tagId: firstStep.tagId,
        routineId: routine.id,
        presetId: null,
      },
    };
    setState(startFocusSession(preparedState));
    setElapsedFocusSeconds(0);
    setElapsedBreakSeconds(0);
    setActiveAlert(null);
    setActiveView('session');
  }, [state]);

  const handleSignUp = useCallback(async (email: string, password: string, displayName: string) => {
    const result = await signUp(email, password, displayName);
    if (!result.user) return result.error ?? 'Account could not be created.';
    setAuthUser(result.user);
    setState(loadState(result.user.profile.id));
    setActiveView('session');
    window.location.hash = '';
    return null;
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (!result.user) return result.error ?? 'Could not log in.';
    setAuthUser(result.user);
    setState(loadState(result.user.profile.id));
    setActiveView('session');
    window.location.hash = '';
    return null;
  }, []);

  const handleResetPassword = useCallback(async (password: string) => {
    const token = getResetToken();
    if (!token) return 'This reset link is missing a token. Request a new one.';
    const result = await resetPassword(token, password);
    if (!result.user) return result.error ?? 'Could not reset password.';
    setAuthUser(result.user);
    setState(loadState(result.user.profile.id));
    setActiveView('session');
    window.location.hash = '';
    return null;
  }, []);

  const handleSignOut = useCallback(() => {
    signOut();
    setAuthUser(null);
    setActiveView('session');
    setActiveAlert(null);
    window.location.hash = '';
  }, []);

  const handleUpdateProfile = useCallback((displayName: string) => {
    if (!authUser) return;
    const updatedUser = updateProfile(authUser.profile.id, displayName);
    if (updatedUser) setAuthUser(updatedUser);
  }, [authUser]);

  const handleDeleteAccount = useCallback(() => {
    if (!authUser) return;
    const deleted = deleteAccount(authUser.profile.id);
    if (deleted) {
      setAuthUser(null);
      setState(loadState());
      setActiveView('session');
      setActiveAlert(null);
      window.location.hash = '';
    }
  }, [authUser]);

  const handleStartToday = useCallback((plan: DailyPlan) => {
    setCurrentPlan(plan);
    
    // Get the first focus block start time from the plan
    const firstFocusBlock = plan.mainDeepWorkBlock || plan.backupDeepWorkBlock || plan.secondaryFocusBlock;
    
    if (firstFocusBlock) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const [hours, minutes] = firstFocusBlock.startTime.split(':').map(Number);
      const firstBlockStartTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      
      // If the first block is in the future, wait until then to start
      if (firstBlockStartTime.getTime() > now.getTime()) {
        setWaitingForPlanStart(true);
        setPlanStartTimeMs(firstBlockStartTime.getTime());
        setActiveView('session');
        return;
      }
    }
    
    // Otherwise, start immediately (late start or no specific start time)
    setState((current) => startFocusSession(current));
    setElapsedFocusSeconds(0);
    setElapsedBreakSeconds(0);
    setActiveAlert(null);
    setActiveView('session');
  }, []);

  const secondsUntilNudge = (() => {
    if (!state.activeSession.active || !state.activeSession.startedAt) return 0;
    const focusIntervalSecs = state.settings.focusIntervalMinutes * 60;
    const timeSinceLastBreak = state.activeSession.lastBreakAt 
      ? (nowMs - state.activeSession.lastBreakAt) / 1000 
      : elapsedFocusSeconds;
    return Math.max(0, Math.floor(focusIntervalSecs - timeSinceLastBreak));
  })();

  const suggestedMovement = getSuggestedMovement(state.activeSession.completedBreaks);
  const breakTargetSeconds = state.settings.breakDurationMinutes * 60;
  const breakSecondsRemaining = Math.max(0, breakTargetSeconds - elapsedBreakSeconds);
  const breakProgress = breakTargetSeconds > 0
    ? Math.min(100, (elapsedBreakSeconds / breakTargetSeconds) * 100)
    : 0;
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
  const activeViewTitle = activeView === 'plan'
      ? 'Plan'
      : activeView === 'session'
        ? 'Session in progress'
        : activeView === 'progress'
          ? 'Progress'
          : activeView === 'history'
            ? 'History'
            : activeView === 'goals'
              ? 'Goals'
              : activeView === 'routines'
                ? 'Routines'
                : activeView === 'rewards'
                  ? 'Rewards'
                  : activeView === 'settings'
                    ? 'Settings'
                    : activeView === 'science'
                      ? 'Logic and terms'
                      : 'Account';
  const hasActiveTimer = state.activeSession.currentState !== 'idle' && state.activeSession.currentState !== 'session-complete';

  const sessionStatusLabel = state.activeSession.active
    ? state.activeSession.currentState.replace('-', ' ')
    : 'ready';

  const focusProgress = state.settings.focusIntervalMinutes > 0
    ? Math.min(100, ((state.settings.focusIntervalMinutes * 60 - secondsUntilNudge) / (state.settings.focusIntervalMinutes * 60)) * 100)
    : 0;

  const currentClockMinutes = new Date(nowMs).getHours() * 60 + new Date(nowMs).getMinutes();
  const planPosition = (() => {
    if (!currentPlan || currentPlan.blocks.length === 0) return null;

    const blocks = [...currentPlan.blocks].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    const currentBlock = blocks.find((block) => currentClockMinutes >= parseTime(block.startTime) && currentClockMinutes < parseTime(block.endTime)) ?? null;
    const nextBlock = blocks.find((block) => parseTime(block.startTime) > currentClockMinutes) ?? null;
    const completedBlocks = blocks.filter((block) => parseTime(block.endTime) <= currentClockMinutes);
    const activeIndex = currentBlock ? blocks.findIndex((block) => block.id === currentBlock.id) : completedBlocks.length;
    const dayStart = parseTime(blocks[0].startTime);
    const dayEnd = parseTime(blocks[blocks.length - 1].endTime);
    const dayProgress = dayEnd > dayStart
      ? Math.min(100, Math.max(0, ((currentClockMinutes - dayStart) / (dayEnd - dayStart)) * 100))
      : 0;
    const blockProgress = currentBlock
      ? Math.min(100, Math.max(0, ((currentClockMinutes - parseTime(currentBlock.startTime)) / Math.max(1, parseTime(currentBlock.endTime) - parseTime(currentBlock.startTime))) * 100))
      : 0;
    return { blocks, currentBlock, nextBlock, completedBlocks, activeIndex, dayProgress, blockProgress };
  })();

  // Calculate time remaining in current planned block (if following a plan)
  const currentBlockTimeRemaining = (() => {
    if (!planPosition?.currentBlock) return null;
    const blockEndMinutes = parseTime(planPosition.currentBlock.endTime);
    const remainingMinutes = Math.max(0, blockEndMinutes - currentClockMinutes);
    return remainingMinutes * 60; // Convert to seconds
  })();

  // Determine what the main timer should display
  const mainTimerSeconds = (() => {
    // If following a plan and currently in a focus block, show time remaining in that block
    if (planPosition?.currentBlock && state.activeSession.currentState === 'focus') {
      return currentBlockTimeRemaining ?? elapsedFocusSeconds;
    }
    // Otherwise show elapsed focus time or break time
    return state.activeSession.currentState === 'focus' || state.activeSession.currentState === 'movement-nudge'
      ? elapsedFocusSeconds
      : elapsedBreakSeconds;
  })();

  const currentSessionFocusMinutes = state.activeSession.focusMinutesCredited;

  // Get label for current block type with consistent naming
  const getCurrentBlockLabel = (): string => {
    if (!planPosition?.currentBlock) return 'Focus Time';
    const kind = planPosition.currentBlock.kind;
    if (kind === 'deepWork') return 'Deep Work Block';
    if (kind === 'backupDeepWork') return 'Fallback Focus Block';
    if (kind === 'secondaryFocus') return 'Secondary Focus';
    if (kind === 'movement') return 'Movement Break';
    if (kind === 'recovery') return 'Recovery';
    if (kind === 'fixed') return 'Fixed Commitment';
    return 'Admin Block';
  };

  // Determine if we should show "Next reset" or block end info
  const shouldShowNextReset = (() => {
    if (!planPosition?.currentBlock || state.activeSession.currentState !== 'focus') return true;
    // Check if next reset happens before current block ends
    const blockEndMinutes = parseTime(planPosition.currentBlock.endTime);
    const resetTimeMinutes = currentClockMinutes + (secondsUntilNudge / 60);
    return resetTimeMinutes < blockEndMinutes;
  })();

  // Get appropriate copy for next action
  const getNextActionCopy = (): string => {
    if (!planPosition?.currentBlock || state.activeSession.currentState !== 'focus') {
      return `Next reset in ${Math.floor(secondsUntilNudge / 60)}m ${secondsUntilNudge % 60}s`;
    }
    const blockEndMinutes = parseTime(planPosition.currentBlock.endTime);
    const resetTimeMinutes = currentClockMinutes + (secondsUntilNudge / 60);
    
    if (resetTimeMinutes >= blockEndMinutes) {
      const minutesUntilBlockEnd = Math.max(0, Math.floor(blockEndMinutes - currentClockMinutes));
      return `Block ends in ${minutesUntilBlockEnd}m`;
    }
    return `Next reset in ${Math.floor(secondsUntilNudge / 60)}m ${secondsUntilNudge % 60}s`;
  };

  const rewardLevel = (() => {
    const points = state.activeSession.pointsEarnedInSession;
    if (points >= 45) return 'Momentum streak';
    if (points >= 25) return 'Flow protected';
    if (points >= 10) return 'Reset banked';
    return 'Progress started';
  })();

  const weeklyRhythm = (() => {
    const todayDate = new Date(`${state.dailyStats.date}T00:00:00`);
    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() - (6 - index));
      return formatDateKey(date);
    });
    const historyByDate = new Map<string, {
      focusMinutes: number;
      movementBreaks: number;
      flowSafeReturns: number;
      points: number;
    }>();

    state.sessionHistory.forEach((session) => {
      const existing = historyByDate.get(session.date) ?? {
        focusMinutes: 0,
        movementBreaks: 0,
        flowSafeReturns: 0,
        points: 0,
      };
      historyByDate.set(session.date, {
        focusMinutes: existing.focusMinutes + session.totalFocusMinutes,
        movementBreaks: existing.movementBreaks + session.breaksCompleted,
        flowSafeReturns: existing.flowSafeReturns + session.flowSafeReturns,
        points: existing.points + session.pointsEarned,
      });
    });

    const todayExisting = historyByDate.get(state.dailyStats.date) ?? {
      focusMinutes: 0,
      movementBreaks: 0,
      flowSafeReturns: 0,
      points: 0,
    };
    historyByDate.set(state.dailyStats.date, {
      focusMinutes: Math.max(todayExisting.focusMinutes, state.dailyStats.focusMinutes),
      movementBreaks: Math.max(todayExisting.movementBreaks, state.dailyStats.movementBreaks),
      flowSafeReturns: Math.max(todayExisting.flowSafeReturns, state.dailyStats.flowSafeReturns),
      points: Math.max(todayExisting.points, state.dailyStats.points),
    });

    const days = weekDays.map((date) => {
      const stats = historyByDate.get(date) ?? {
        focusMinutes: 0,
        movementBreaks: 0,
        flowSafeReturns: 0,
        points: 0,
      };
      return {
        date,
        label: getDayLabel(date),
        isToday: date === state.dailyStats.date,
        active: stats.focusMinutes > 0 || stats.movementBreaks > 0,
        ...stats,
      };
    });

    const activeDays = days.filter((day) => day.active).length;
    const focusMinutes = days.reduce((sum, day) => sum + day.focusMinutes, 0);
    const movementBreaks = days.reduce((sum, day) => sum + day.movementBreaks, 0);
    const flowSafeReturns = days.reduce((sum, day) => sum + day.flowSafeReturns, 0);
    const points = days.reduce((sum, day) => sum + day.points, 0);
    const momentumLabel = activeDays >= 5
      ? 'Strong rhythm'
      : activeDays >= 3
        ? 'Building rhythm'
        : activeDays >= 1
          ? 'Early momentum'
          : 'Ready to begin';
    const momentumDetail = activeDays >= 5
      ? 'You are showing up most days. Keep breaks boring, useful, and easy to return from.'
      : activeDays >= 3
        ? 'A few active days are enough to see a pattern. The next win is consistency, not intensity.'
        : activeDays >= 1
          ? 'There is a starting signal here. Add another humane session when the day allows.'
          : 'Start one session and the weekly rhythm will begin filling in.';

    return {
      days,
      activeDays,
      focusMinutes,
      movementBreaks,
      flowSafeReturns,
      points,
      momentumLabel,
      momentumDetail,
    };
  })();

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
      case 'break-active':
        return `${state.settings.breakDurationMinutes} minutes is the target. I will alert you when it is up.`;
      case 'focus':
        return 'Stand up without dropping the thread.';
      default:
        return '';
    }
  };

  const activeAlertCopy = (() => {
    if (activeAlert === 'movement-nudge') {
      return {
        title: 'Movement reset waiting',
        detail: 'This alert stays here until you start the break, delay it, or skip it.',
        tone: 'bg-sky-50 text-sky-700 ring-sky-100',
      };
    }
    if (activeAlert === 'break-complete') {
      return {
        title: 'Break target reached',
        detail: 'Come back when you are ready. The alert stays on until you press Back to Work.',
        tone: 'bg-lime-50 text-lime-700 ring-lime-100',
      };
    }
    if (activeAlert === 'break-drifting') {
      return {
        title: 'Break is drifting',
        detail: 'This is your return cue. Press Back to Work when you are back at the task.',
        tone: 'bg-coral-500/10 text-coral-500 ring-coral-500/15',
      };
    }
    return null;
  })();

  const renderMainContent = () => {
    const { currentState } = state.activeSession;

    if (currentState === 'session-complete') {
      const summary = state.lastSessionSummary ?? state.sessionHistory[0];
      const receiptFocusMinutes = getSessionReceiptFocusMinutes(summary, state.activeSession.focusMinutesCredited);
      return (
        <div className="panel-card p-6 text-center sm:p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-lavender to-sky-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-float shadow-xl shadow-sky-500/20">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-2">Session Complete!</h2>
          <p className="text-charcoal/60 mb-6">Great work. Time to reflect and reset.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-sky-500/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-sky-500">{receiptFocusMinutes}</div>
              <div className="text-xs text-charcoal/60">Focus Minutes</div>
            </div>
            <div className="bg-lime-500/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-lime-600">{summary?.breaksCompleted ?? 0}</div>
              <div className="text-xs text-charcoal/60">Breaks Completed</div>
            </div>
            <div className="bg-lavender/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-lavender">{summary?.pointsEarned ?? 0}</div>
              <div className="text-xs text-charcoal/60">Points Earned</div>
            </div>
            <div className="bg-coral-500/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-coral-500">{summary?.flowSafeReturns ?? 0}</div>
              <div className="text-xs text-charcoal/60">Flow Returns</div>
            </div>
          </div>

          <div className="grid gap-3">
            <ActionButton onClick={() => setActiveView('plan')} variant="primary" size="lg" className="w-full">
              Plan Next Session
            </ActionButton>
          </div>
        </div>
      );
    }

    if (currentState === 'idle') {
      return (
        <div className="panel-card p-8 text-center max-w-xl mx-auto">
          <div className="mb-4">
            <CompanionOrb state={currentState} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-navy mb-3 leading-tight">No active session yet.</h2>
          <p className="text-charcoal/65 mb-8 text-base md:text-lg leading-relaxed">
            Start a focus session to track focus time, movement breaks, returns, and points here.
          </p>
          <ActionButton onClick={handleStartFocusSession} variant="primary" size="lg" className="px-12">
            Start Focus Session
          </ActionButton>
          <p className="text-xs text-charcoal/40 mt-6">
            This view only shows the current session.
          </p>
        </div>
      );
    }

    return (
      <div className="panel-card overflow-hidden max-w-3xl mx-auto">
        <div className="border-b border-slate-200/70 px-6 py-5 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Live Session</p>
              <h2 className="text-2xl font-black text-navy mt-1">{getStateMessage()}</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-charcoal/70">
              {sessionStatusLabel}
            </div>
          </div>
          {getStateSubMessage() && (
            <p className="text-charcoal/60 text-sm mt-2">{getStateSubMessage()}</p>
          )}
          {activeAlertCopy && (
            <div className={`mt-4 rounded-2xl p-4 text-left ring-1 ${activeAlertCopy.tone}`}>
              <p className="text-sm font-black">{activeAlertCopy.title}</p>
              <p className="mt-1 text-xs font-semibold opacity-80">{activeAlertCopy.detail}</p>
            </div>
          )}
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr] md:p-8">
          <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50/80">
            <CompanionOrb state={currentState} />
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-8">
              {currentState === 'focus' ? (
                <TimerDisplay seconds={mainTimerSeconds} label={getCurrentBlockLabel()} size="lg" color="sky" />
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
                Start {state.settings.breakDurationMinutes}-min Break
              </ActionButton>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ActionButton onClick={handleDelayNudge} variant="secondary" size="md" className="flex-1">
                  Delay 10 min
                </ActionButton>
                <ActionButton onClick={handleSkipNudge} variant="secondary" size="md" className="flex-1">
                  Skip and keep focusing
                </ActionButton>
              </div>
              <ActionButton onClick={handleEndSession} variant="secondary" size="md" className="w-full">
                End Session
              </ActionButton>
            </>
          )}

          {(currentState === 'break-active' || currentState === 'break-drifting') && (
            <>
              <div className="rounded-2xl bg-lime-50 p-4">
                <div className="flex justify-between text-xs font-semibold text-charcoal/60 mb-2">
                  <span>{currentState === 'break-drifting' ? 'Break target passed' : 'Recommended break'}</span>
                  <span>
                    {breakSecondsRemaining > 0
                      ? `${Math.floor(breakSecondsRemaining / 60)}m ${breakSecondsRemaining % 60}s left`
                      : 'Time to return'}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-lime-200/70">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${currentState === 'break-drifting' ? 'bg-coral-500' : 'bg-lime-500'}`}
                    style={{ width: `${breakProgress}%` }}
                  />
                </div>
              </div>
              <ActionButton onClick={handleReturnToWork} variant="primary" size="lg" className="w-full">
                Back to Work
              </ActionButton>
              <ActionButton onClick={handleEndSession} variant="secondary" size="md" className="w-full">
                End Session
              </ActionButton>
            </>
          )}
            </div>

            {currentState === 'focus' && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between text-xs font-semibold text-charcoal/60 mb-2">
                  <span>{shouldShowNextReset ? 'Next reset' : 'Block ending'}</span>
                  <span>{getNextActionCopy()}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-lime-400 to-lavender transition-all duration-1000"
                    style={{ width: `${focusProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSessionView = () => {
    const isSessionComplete = state.activeSession.currentState === 'session-complete';
    const summary = state.lastSessionSummary ?? state.sessionHistory[0];
    const receiptFocusMinutes = getSessionReceiptFocusMinutes(summary, state.activeSession.focusMinutesCredited);
    const sessionBadgeCount = summary?.badgesEarned.length ?? 0;
    const sessionBadges = summary?.badgesEarned
      .map((badgeId) => BADGES.find((badge) => badge.id === badgeId))
      .filter((badge): badge is (typeof BADGES)[number] => Boolean(badge)) ?? [];
    const sessionReflection = sessionReflectionMessages[(summary?.startedAt ?? 0) % sessionReflectionMessages.length];
    const sessionRewardTitle = sessionBadgeCount > 0
      ? `${sessionBadgeCount} badge${sessionBadgeCount === 1 ? '' : 's'} earned`
      : (summary?.pointsEarned ?? 0) > 0
        ? `${summary?.pointsEarned ?? 0} points earned`
        : 'Progress saved';
    const sessionRewardCopy = sessionBadgeCount > 0
      ? 'New reward progress was added from this session.'
      : (summary?.pointsEarned ?? 0) > 0
        ? 'Those points came from choices inside this session, not from the whole day.'
        : `You protected ${receiptFocusMinutes} minutes. That still counts.`;

    return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        {!isSessionComplete && planPosition && (
          <div className="panel-card mb-6 overflow-hidden">
            <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-6">
              <div className="min-w-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Focus Block</p>
                    <h2 className="mt-1 text-2xl font-black text-navy">
                      {planPosition.currentBlock ? planPosition.currentBlock.title : planPosition.nextBlock ? 'Between planned blocks' : 'Plan wrapped'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveView('plan')}
                    className="min-h-10 rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100 transition-colors hover:bg-sky-50"
                  >
                    Edit Plan
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {planPosition.currentBlock && (
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${planKindClass(planPosition.currentBlock.kind)}`}>
                      {planKindLabel(planPosition.currentBlock.kind)}
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-charcoal/65">
                    Stage {Math.min(planPosition.activeIndex + 1, planPosition.blocks.length)} of {planPosition.blocks.length}
                  </span>
                  {planPosition.currentBlock && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-charcoal/65 ring-1 ring-slate-200">
                      {planPosition.currentBlock.startTime}-{planPosition.currentBlock.endTime}
                    </span>
                  )}
                </div>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-lime-400 to-lavender" style={{ width: `${planPosition.dayProgress}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-charcoal/55">
                  {planPosition.nextBlock
                    ? `Next: ${planPosition.nextBlock.title} at ${planPosition.nextBlock.startTime}`
                    : 'No more planned blocks today.'}
                </p>
              </div>
              <div className="rounded-2xl bg-lime-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">Reward</p>
                <h3 className="mt-1 text-xl font-black text-navy">{rewardLevel}</h3>
                <p className="mt-2 text-sm font-semibold text-charcoal/60">
                  {state.activeSession.pointsEarnedInSession} points earned, {state.activeSession.completedBreaks} resets completed, {state.activeSession.flowSafeReturns} flow-safe returns.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isSessionComplete && (
        <div className="panel-card mb-6 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Current Session</p>
              <h3 className="mt-1 text-lg font-black text-navy">Live Details</h3>
            </div>
            <select
              value={state.activeSession.tagId ?? ''}
              onChange={(event) => handleSetActiveTag(event.target.value || null)}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-charcoal"
              aria-label="Active session tag"
            >
              <option value="">No tag</option>
              {state.tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
            </select>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-sky-50 p-3">
              <div className="text-2xl font-black text-sky-500">{currentSessionFocusMinutes}</div>
              <div className="mt-1 text-xs font-semibold text-charcoal/55">Session focus</div>
            </div>
            <div className="rounded-2xl bg-lime-50 p-3">
              <div className="text-2xl font-black text-lime-600">{state.activeSession.completedBreaks}</div>
              <div className="mt-1 text-xs font-semibold text-charcoal/55">Breaks</div>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3">
              <div className="text-2xl font-black text-violet-500">{state.activeSession.flowSafeReturns}</div>
              <div className="mt-1 text-xs font-semibold text-charcoal/55">Returns</div>
            </div>
            <div className="rounded-2xl bg-orange-50 p-3">
              <div className="text-2xl font-black text-coral-500">{state.activeSession.pointsEarnedInSession}</div>
              <div className="mt-1 text-xs font-semibold text-charcoal/55">Points</div>
            </div>
          </div>
        </div>
        )}

        {renderMainContent()}

        {state.activeSession.active && state.activeSession.currentState === 'focus' && (
          <div className="mt-6">
            <NextResetCard 
              suggestedMovement={suggestedMovement} 
              secondsUntilNudge={secondsUntilNudge}
              currentBlock={planPosition?.currentBlock ?? null}
              currentClockMinutes={currentClockMinutes}
            />
          </div>
        )}

        {/* Today's Plan - Compact section below main content on mobile */}
        {!isSessionComplete && planPosition && (
          <MobileTodayPlan planPosition={planPosition} onViewPlan={() => setActiveView('plan')} />
        )}
      </div>
      
      <aside className="hidden flex-col gap-4 xl:flex">
        {isSessionComplete ? (
          <>
            <div className="panel-card p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Session Reward</p>
              <h3 className="mt-2 text-xl font-black text-navy">{sessionRewardTitle}</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/60">
                {sessionRewardCopy}
              </p>
              {sessionBadgeCount > 0 && (
                <div className="mt-4 space-y-2">
                  {sessionBadges.slice(0, 3).map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3 rounded-2xl bg-lime-50 px-3 py-2 text-sm font-black text-lime-700">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm shadow-lime-100">
                        {badge.icon}
                      </span>
                      <span>{badge.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setActiveView('rewards')}
                className="mt-5 min-h-10 w-full rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100 transition-colors hover:bg-sky-50"
              >
                See all my rewards
              </button>
            </div>
            <div className="panel-card p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Reflection</p>
              <h3 className="mt-2 text-xl font-black text-navy">{sessionReflection.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/60">
                {sessionReflection.detail}
              </p>
            </div>
          </>
        ) : planPosition ? (
          <TodayPlanSidebar planPosition={planPosition} />
        ) : (
          <NoPlanSidebar />
        )}

        {!isSessionComplete && (
          <>
        <RhythmCard 
          focusIntervalMinutes={state.settings.focusIntervalMinutes}
          secondsUntilNudge={secondsUntilNudge}
          activeSession={state.activeSession}
        />

        <BreakLengthCard breakDurationMinutes={state.settings.breakDurationMinutes} />
          </>
        )}
      </aside>
    </div>
    );
  };

  const renderProgressView = () => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <section className="panel-card overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_220px] md:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Progress</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-navy md:text-4xl">
                Your rhythm over time.
              </h2>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-charcoal/62">
                This page keeps reflection away from the live timer. Points, streaks, badges, and history are here to show whether breaks are helping you return, not to push longer sessions.
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-lime-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-charcoal/45">Today</p>
              <h3 className="mt-2 text-2xl font-black text-navy">{state.dailyStats.points}/{SCORING.dailyCap} points</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/58">
                {state.dailyStats.movementBreaks} resets completed, {state.dailyStats.flowSafeReturns} flow-safe returns, {state.currentStreak} day streak.
              </p>
            </div>
          </div>
        </section>

        <section className="panel-card p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Weekly Rhythm</p>
              <h3 className="mt-1 text-2xl font-black text-navy">{weeklyRhythm.momentumLabel}</h3>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-charcoal/58">
                {weeklyRhythm.momentumDetail}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[28rem]">
              {[
                [`${weeklyRhythm.activeDays}/7`, 'active days'],
                [weeklyRhythm.focusMinutes, 'focus min'],
                [weeklyRhythm.movementBreaks, 'resets'],
                [weeklyRhythm.flowSafeReturns, 'safe returns'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center">
                  <div className="text-xl font-black text-navy">{value}</div>
                  <div className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-charcoal/45">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2">
            {weeklyRhythm.days.map((day) => {
              const height = day.active
                ? Math.max(24, Math.min(88, 24 + day.movementBreaks * 12 + Math.floor(day.focusMinutes / 20) * 8))
                : 16;

              return (
                <div key={day.date} className="min-w-0 rounded-2xl bg-white/75 p-2 text-center ring-1 ring-slate-200">
                  <div className={`mx-auto flex w-full max-w-12 items-end justify-center rounded-xl ${day.active ? 'bg-sky-50' : 'bg-slate-100'}`} style={{ height: 96 }}>
                    <div
                      className={`w-5 rounded-full transition-all ${day.active ? 'bg-gradient-to-t from-sky-500 to-lime-400' : 'bg-slate-300'}`}
                      style={{ height }}
                      title={`${day.focusMinutes} focus minutes, ${day.movementBreaks} resets`}
                    />
                  </div>
                  <p className={`mt-2 truncate text-[0.68rem] font-black ${day.isToday ? 'text-sky-600' : 'text-charcoal/50'}`}>
                    {day.label}
                  </p>
                  <p className="text-[0.65rem] font-bold text-charcoal/35">{day.movementBreaks} reset{day.movementBreaks === 1 ? '' : 's'}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <StatsCard
            moveScore={state.dailyStats.points}
            streak={state.currentStreak}
            breaksCompleted={state.dailyStats.movementBreaks}
            flowSafeReturns={state.dailyStats.flowSafeReturns}
          />
          <div className="panel-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">How Rewards Work</p>
            <h3 className="mt-1 text-lg font-black text-navy">Healthy returns, not endless work.</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                [`+${SCORING.respondToNudge}`, 'respond to a movement nudge'],
                [`+${SCORING.completeShortBreak}`, 'complete a 2-5 minute break'],
                [`+${SCORING.returnBeforeDrift}`, 'return before drift'],
                [`+${SCORING.useDelayNotSkip}`, 'delay instead of skip'],
              ].map(([points, label]) => (
                <div key={label} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-slate-200">
                  <span className="text-sm font-black text-sky-500">{points}</span>
                  <span className="text-right text-xs font-semibold text-charcoal/60">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-bold leading-relaxed text-charcoal/45">
              Daily points cap at {SCORING.dailyCap}. Delay earns points because it preserves agency; skip is available for real constraints.
            </p>
          </div>
        </section>

        <BadgeGrid earnedBadges={state.badges} />
      </div>

      <aside className="flex flex-col gap-4">
        <SessionHistory history={state.sessionHistory} />
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Account Data</p>
          <h3 className="mt-1 text-lg font-black text-navy">Owned by your user ID.</h3>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/55">
            History, streaks, points, settings, and badges are account-scoped. Cloud sync is prepared, but this build still stores the data locally in this browser.
          </p>
          <button
            onClick={() => setActiveView('account')}
            className="mt-4 min-h-10 w-full rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100 transition-colors hover:bg-sky-50"
          >
            Manage Account
          </button>
        </div>
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Live Work</p>
          <h3 className="mt-1 text-lg font-black text-navy">Return to the timer.</h3>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/55">
            Use Progress when reflecting. Use Session when you need the next action.
          </p>
          <button
            onClick={() => setActiveView('session')}
            className="mt-4 min-h-10 w-full rounded-full bg-navy px-4 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-colors hover:bg-slate-800"
          >
            Go to Session
          </button>
        </div>
      </aside>
    </div>
  );

  const sciencePrinciples = [
    {
      label: 'Effort + recovery',
      value: '45-90m',
      detail: 'Most deep work benefits from focused blocks paired with real recovery. The exact interval is a starting point, not a law.',
      tone: 'bg-sky-50 text-sky-500',
    },
    {
      label: 'True breaks',
      value: '10-20m',
      detail: 'Micro-breaks reduce fatigue, but harder cognitive work usually needs a longer reset when the block has been demanding.',
      tone: 'bg-lime-50 text-lime-600',
    },
    {
      label: 'Sleep floor',
      value: '7h+',
      detail: 'Consistent sleep protects attention, mood, motivation, and the ability to return to complex work.',
      tone: 'bg-violet-50 text-violet-500',
    },
    {
      label: 'Nap reset',
      value: '10-20m',
      detail: 'Short early-afternoon naps can restore alertness with less risk of grogginess than longer naps.',
      tone: 'bg-orange-50 text-coral-500',
    },
  ];

  const termCards = [
    {
      term: 'Deep work',
      meaning: 'A deliberate work mode: sustained, distraction-minimized effort on cognitively demanding tasks.',
      appLink: 'The planner protects your highest-value blocks and keeps breaks from becoming accidental context switches.',
    },
    {
      term: 'Flow',
      meaning: 'A temporary state of absorption, clear goals, feedback, and challenge-skill fit.',
      appLink: 'The app can make flow more likely, but it does not assume every session should feel effortless.',
    },
    {
      term: 'Burnout',
      meaning: 'A chronic occupational pattern involving exhaustion, distance or cynicism, and reduced efficacy.',
      appLink: 'Qithym treats recovery as part of the work system, not as a reward after overextension.',
    },
  ];

  const logicRows = [
    ['Focus interval', 'Defaults near 45 minutes because attention fatigue rises with time-on-task, while many users can still preserve the thread.'],
    ['Movement nudge', 'A small physical reset interrupts fatigue before it pushes you toward easier, lower-value tasks.'],
    ['Break drift', 'Breaks help most when they restore you without dissolving the task context you meant to return to.'],
    ['Chronotype', 'Morning, balanced, and late rhythms affect when hard analytical work is most likely to land well.'],
    ['Planning confidence', 'The day plan lowers confidence when sleep, load, fixed commitments, or target depth make the schedule fragile.'],
  ];

  const implementedConcepts = [
    {
      label: 'Rhythm',
      value: `${state.settings.focusIntervalMinutes}m reset cadence`,
      detail: 'This is the live session clock for effort plus recovery. It tracks how long you have been focusing since the last reset and nudges before fatigue makes returning harder.',
    },
    {
      label: 'Break Length',
      value: `${state.settings.breakDurationMinutes}m recommended`,
      detail: 'This is a short momentum-preserving reset, not the full 10-20 minute recovery break used after heavier blocks. The app chimes when the target is up so the break does not quietly become drift.',
    },
    {
      label: 'Current Session',
      value: 'Live details',
      detail: 'Focus minutes, completed breaks, returns, and points are feedback signals. They show whether the day is balancing output with recovery, not whether you stayed locked in forever.',
    },
    {
      label: 'Focus Block',
      value: 'Now / Next',
      detail: 'The focus block connects the timer to the day plan, so deep work, recovery, admin, and fixed commitments stay in their intended lanes.',
    },
    {
      label: 'Reward',
      value: 'Flow protected',
      detail: 'Rewards favor returning from breaks and using resets well. The behavior being reinforced is sustainable rhythm, not simply maximizing chair time.',
    },
    {
      label: 'Delay / Skip',
      value: 'Nudge choices',
      detail: 'Delay preserves agency when you are close to a stopping point. Skip exists for real constraints, but repeated skipping is a signal that the cadence or workload may need adjustment.',
    },
  ];

  const renderScienceView = () => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <section className="panel-card overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_240px] md:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Evidence Base</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-navy md:text-4xl">
                The app is built around repeatable focus, not heroic intensity.
              </h2>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-charcoal/62">
                Qithym is built for builders and creators who need short movement resets during long focus sessions. The goal is to maximize flow and output while lowering the burnout risk that comes from treating recovery as optional.
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-lime-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-charcoal/45">Core Rule</p>
              <h3 className="mt-2 text-2xl font-black text-navy">Protect the thread. Restore the system.</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/58">
                Breaks are timed to reduce fatigue while helping you return before the work context cools.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {sciencePrinciples.map((principle) => (
            <div key={principle.label} className="metric-card items-start">
              <div>
                <p className="metric-label">{principle.label}</p>
                <div className="metric-value">{principle.value}</div>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/55">{principle.detail}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${principle.tone}`}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M5 8h14M7 22h10M7 2h10" />
                </svg>
              </div>
            </div>
          ))}
        </section>

        <section className="panel-card p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Terms</p>
          <h3 className="mt-1 text-xl font-black text-navy">What the app means by the big words</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {termCards.map((card) => (
              <article key={card.term} className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
                <h4 className="text-lg font-black text-navy">{card.term}</h4>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-charcoal/60">{card.meaning}</p>
                <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-relaxed text-charcoal/55">{card.appLink}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel-card p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">App Logic</p>
          <h3 className="mt-1 text-xl font-black text-navy">How the evidence becomes product behavior</h3>
          <div className="mt-5 divide-y divide-slate-200/80 overflow-hidden rounded-2xl bg-white/70 ring-1 ring-slate-200">
            {logicRows.map(([label, detail]) => (
              <div key={label} className="grid gap-2 p-4 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-black text-navy">{label}</p>
                <p className="text-sm font-semibold leading-relaxed text-charcoal/58">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">In The App</p>
          <h3 className="mt-1 text-xl font-black text-navy">What the existing cards and labels are telling you</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {implementedConcepts.map((concept) => (
              <article key={concept.label} className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-charcoal/45">{concept.label}</p>
                    <h4 className="mt-1 text-lg font-black text-navy">{concept.value}</h4>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12h16M12 4v16" />
                    </svg>
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/58">{concept.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Bottom Line</p>
          <h3 className="mt-1 text-lg font-black text-navy">Use defaults, then calibrate.</h3>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/55">
            The evidence is strong for sleep, breaks, interruption control, and recovery. It is weaker for exact universal timer numbers.
          </p>
        </div>
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Good Breaks</p>
          <div className="mt-4 space-y-2">
            {['Walk or stand', 'Look away from the screen', 'Breathe slowly', 'Get daylight when possible'].map((item) => (
              <div key={item} className="rounded-2xl bg-lime-50 px-4 py-3 text-sm font-black text-lime-700">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Caution</p>
          <h3 className="mt-1 text-lg font-black text-navy">A timer cannot fix every constraint.</h3>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/55">
            Chronic sleep loss, unmanaged workload, health issues, or constant interruptions need changes beyond session timing.
          </p>
        </div>
      </aside>
    </div>
  );

  const retentionViewProps = {
    state,
    settings: state.settings,
    onSetActiveTag: handleSetActiveTag,
    onUpdateSessionTag: handleUpdateSessionTag,
    onSaveTag: handleSaveTag,
    onSaveGoal: handleSaveGoal,
    onDeleteGoal: handleDeleteGoal,
    onResetGoal: handleResetGoal,
    onSaveRoutine: handleSaveRoutine,
    onStartRoutine: handleStartRoutine,
    onDeleteRoutine: handleDeleteRoutine,
    onSavePreset: handleSavePreset,
    onStartPreset: handleStartPreset,
    onDeletePreset: handleDeletePreset,
    onSaveSettings: handleSaveSettings,
    onExportData: handleExportData,
    onImportData: handleImportData,
  };

  const renderAccountView = () => {
    if (!authUser) return null;

    return (
      <AccountPanel
        user={authUser}
        state={state}
        onUpdateProfile={handleUpdateProfile}
        onExportData={handleExportData}
        onDeleteAccount={handleDeleteAccount}
        onSignOut={handleSignOut}
        onShowPrivacy={() => { window.location.hash = 'privacy'; }}
        onShowTerms={() => { window.location.hash = 'terms'; }}
      />
    );
  };

  if (publicRoute === 'privacy' || publicRoute === 'terms') {
    return (
      <LegalPage
        kind={publicRoute}
        isAuthenticated={Boolean(authUser)}
        onBack={() => { window.location.hash = authUser ? 'app' : 'home'; }}
        onSignIn={() => { window.location.hash = 'app'; }}
      />
    );
  }

  if (publicRoute === 'reset') {
    return (
      <ResetPasswordView
        onResetPassword={handleResetPassword}
        onBackToSignIn={() => { window.location.hash = ''; }}
      />
    );
  }

  if (authUser === undefined) {
    return <AuthLoading />;
  }

  if (isMarketingRoute(publicRoute) && (!authUser || publicRoute !== 'home')) {
    return (
      <PublicPages
        route={publicRoute}
        onOpenApp={() => { window.location.hash = 'app'; }}
      />
    );
  }

  if (!authUser) {
    return (
      <AuthGate
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onRequestReset={requestPasswordReset}
        onShowPrivacy={() => { window.location.hash = 'privacy'; }}
        onShowTerms={() => { window.location.hash = 'terms'; }}
      />
    );
  }

  return (
    <div className={`app-shell min-h-screen overflow-x-hidden bg-dashboard app-theme-${state.settings.theme} p-3 md:p-5 lg:p-6`}>
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-7xl gap-4 rounded-[2rem] border border-white/70 bg-white/55 p-3 shadow-2xl shadow-slate-200/80 backdrop-blur-xl md:min-h-[calc(100vh-40px)] md:p-4">
        <aside className="hidden w-36 flex-col items-center rounded-[1.5rem] bg-white/80 px-4 py-5 shadow-lg shadow-slate-200/70 lg:flex">
          <div className="mb-14 flex h-12 w-full items-center justify-center">
            <img src="/brand/qithym-logo-wordmark.svg" alt="Qithym" className="h-9 w-full object-contain" />
          </div>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                activeView === item.id ? 'bg-sky-50 text-sky-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.iconPath} />
              </svg>
            </button>
          ))}
          <button
            onClick={() => setSettingsOpen(true)}
            className="mt-auto flex h-12 w-12 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label="Open settings"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </aside>

        <div className="min-w-0 flex-1">
      <header className="mb-5 lg:pt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <img src="/brand/qithym-logo-wordmark.svg" alt="Qithym" className="h-10 w-auto max-w-[11rem] object-contain lg:hidden" />
              <h1 className="text-2xl font-black text-navy">{activeViewTitle}</h1>
              <p className="mt-1 text-sm font-semibold text-charcoal/50">Work rhythm for builders and creators · {today}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeView === 'plan' && hasActiveTimer && (
              <button
                onClick={() => setActiveView('session')}
                className="min-h-11 rounded-full bg-navy px-5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-colors hover:bg-slate-800"
              >
                Return to Session
              </button>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-11 h-11 rounded-2xl bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm lg:hidden"
              aria-label="Open settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/70 p-1 shadow-sm sm:grid-cols-5 lg:hidden">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`min-h-11 rounded-full px-3 text-sm font-black transition-colors ${
                activeView === item.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-charcoal/55 hover:bg-white'
              }`}
            >
              {item.id === 'plan' ? 'Plan' : item.id === 'session' ? 'Session' : item.id === 'progress' ? 'Progress' : item.id === 'history' ? 'History' : item.id === 'goals' ? 'Goals' : item.id === 'routines' ? 'Routines' : item.id === 'rewards' ? 'Rewards' : item.id === 'settings' ? 'Settings' : item.id === 'science' ? 'Logic' : 'Account'}
            </button>
          ))}
        </div>
      </header>

      <main>
        <div className={activeView === 'plan' ? 'block' : 'hidden'}>
          <PlanMyDay
            onStartToday={handleStartToday}
            onReturnToSession={() => setActiveView('session')}
            hasActiveSession={hasActiveTimer}
          />
        </div>
        <div className={activeView === 'session' ? 'block' : 'hidden'}>
          {renderSessionView()}
        </div>
        <div className={activeView === 'progress' ? 'block' : 'hidden'}>
          {renderProgressView()}
        </div>
        <div className={activeView === 'history' ? 'block' : 'hidden'}>
          <HistoryView state={state} onUpdateSessionTag={handleUpdateSessionTag} />
        </div>
        <div className={activeView === 'goals' ? 'block' : 'hidden'}>
          <GoalsView state={state} onSaveGoal={handleSaveGoal} onDeleteGoal={handleDeleteGoal} onResetGoal={handleResetGoal} />
        </div>
        <div className={activeView === 'routines' ? 'block' : 'hidden'}>
          <RoutinesView state={state} onSaveRoutine={handleSaveRoutine} onStartRoutine={handleStartRoutine} onDeleteRoutine={handleDeleteRoutine} />
        </div>
        <div className={activeView === 'rewards' ? 'block' : 'hidden'}>
          <RewardsView state={state} />
        </div>
        <div className={activeView === 'settings' ? 'block' : 'hidden'}>
          <RetentionSettingsView {...retentionViewProps} />
        </div>
        <div className={activeView === 'science' ? 'block' : 'hidden'}>
          {renderScienceView()}
        </div>
        <div className={activeView === 'account' ? 'block' : 'hidden'}>
          {renderAccountView()}
        </div>
      </main>
        </div>
      </div>

      <SettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={state.settings}
        notificationPermission={notificationPermission}
        onSave={handleSaveSettings}
        onResetData={handleResetData}
        onExportData={handleExportData}
      />
    </div>
  );
}

export default App;
