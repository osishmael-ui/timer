// State machine and scoring logic for Qithym
import type { 
  AppState, 
  SessionState, 
} from '../types';
import { 
  SCORING,
  DEFAULT_ACTIVE_SESSION 
} from '../types';

/**
 * State Machine Transitions
 * 
 * Core states:
 * - idle: No active session
 * - focus: User is in a focus session
 * - movement-nudge: Time to take a movement break
 * - break-active: User is on a break
 * - break-drifting: Break has exceeded the drift threshold
 * - returned: User returned from break (transient state)
 * - session-complete: Session has ended
 */

const getTodayDateString = (): string => new Date().toISOString().split('T')[0];

const addDays = (dateString: string, days: number): string => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const updateStreakForActiveDay = (state: AppState): Pick<AppState, 'currentStreak' | 'lastActiveDate' | 'lastStreakDate'> => {
  const today = getTodayDateString();

  if (state.lastStreakDate === today) {
    return {
      currentStreak: state.currentStreak,
      lastActiveDate: today,
      lastStreakDate: state.lastStreakDate,
    };
  }

  const isConsecutive = state.lastStreakDate ? addDays(state.lastStreakDate, 1) === today : false;

  return {
    currentStreak: isConsecutive ? state.currentStreak + 1 : 1,
    lastActiveDate: today,
    lastStreakDate: today,
  };
};

export const startFocusSession = (state: AppState): AppState => {
  const now = Date.now();

  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      active: true,
      startedAt: now,
      accumulatedFocusSeconds: 0,
      focusStartedAt: now,
      focusMinutesCredited: 0,
      currentState: 'focus',
      lastBreakAt: now,
      breakStartedAt: null,
      skippedReminders: 0,
      completedBreaks: 0,
      flowSafeReturns: 0,
      pointsEarnedInSession: 0,
      tagId: state.activeSession.tagId,
      routineId: state.activeSession.routineId,
      presetId: state.activeSession.presetId,
    },
  };
};

export const triggerMovementNudge = (state: AppState): AppState => {
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      currentState: 'movement-nudge',
    },
  };
};

export const startBreak = (state: AppState): AppState => {
  const now = Date.now();
  const activeFocusSeconds = state.activeSession.focusStartedAt
    ? Math.max(0, Math.floor((now - state.activeSession.focusStartedAt) / 1000))
    : 0;

  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      currentState: 'break-active',
      accumulatedFocusSeconds: state.activeSession.accumulatedFocusSeconds + activeFocusSeconds,
      focusStartedAt: null,
      lastBreakAt: now,
      breakStartedAt: now,
    },
  };
};

export const delayNudge = (state: AppState): AppState => {
  // Award points for using Delay instead of Skip
  let pointsToAdd = 0;
  if (state.settings.gamificationEnabled) {
    const remainingDailyPoints = Math.max(0, SCORING.dailyCap - state.dailyStats.points);
    pointsToAdd = Math.min(SCORING.useDelayNotSkip, remainingDailyPoints);
  }
  
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      currentState: 'focus',
      focusStartedAt: Date.now(),
      pointsEarnedInSession: state.activeSession.pointsEarnedInSession + pointsToAdd,
    },
    dailyStats: {
      ...state.dailyStats,
      points: Math.min(state.dailyStats.points + pointsToAdd, SCORING.dailyCap),
    },
    totalPoints: state.totalPoints + pointsToAdd,
  };
};

export const skipNudge = (state: AppState): AppState => {
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      currentState: 'focus',
      focusStartedAt: Date.now(),
      skippedReminders: state.activeSession.skippedReminders + 1,
    },
    dailyStats: {
      ...state.dailyStats,
      skippedReminders: state.dailyStats.skippedReminders + 1,
    },
  };
};

export const checkDriftStatus = (state: AppState): AppState => {
  const { breakStartedAt, currentState } = state.activeSession;
  
  if (currentState !== 'break-active' || !breakStartedAt) {
    return state;
  }
  
  const elapsedMinutes = (Date.now() - breakStartedAt) / 1000 / 60;
  
  if (elapsedMinutes >= state.settings.driftThresholdMinutes) {
    return {
      ...state,
      activeSession: {
        ...state.activeSession,
        currentState: 'break-drifting',
      },
    };
  }
  
  return state;
};

/**
 * Return to work from break
 * This is where scoring happens
 */
export const returnToWork = (state: AppState): AppState => {
  const { breakStartedAt } = state.activeSession;
  const { driftThresholdMinutes } = state.settings;
  
  let pointsEarned = 0;
  const newBadges = [...state.badges];
  const badgesEarnedThisReturn: string[] = [];
  
  // Calculate break duration
  let breakDurationMins = 0;
  if (breakStartedAt) {
    breakDurationMins = (Date.now() - breakStartedAt) / 1000 / 60;
  }
  
  // Award points based on behavior
  const returnedBeforeDrift = breakDurationMins < driftThresholdMinutes;

  if (state.settings.gamificationEnabled) {
    // Points for responding to nudge
    pointsEarned += SCORING.respondToNudge;
    
    // Points for completing a short break (2-5 minutes)
    if (breakDurationMins >= 2 && breakDurationMins <= 5) {
      pointsEarned += SCORING.completeShortBreak;
    }
    
    // Bonus for returning before drift
    if (returnedBeforeDrift) {
      pointsEarned += SCORING.returnBeforeDrift;
      
      // Check for Flow Saver badge (return under 3 minutes)
      if (breakDurationMins < 3 && !state.badges.includes('flow-saver')) {
        newBadges.push('flow-saver');
        badgesEarnedThisReturn.push('flow-saver');
      }
    }
  }
  
  const streak = updateStreakForActiveDay(state);
  
  // Check for Three Tiny Resets badge
  const updatedBreaksCount = state.dailyStats.movementBreaks + 1;
  if (updatedBreaksCount >= 3 && !newBadges.includes('three-tiny-resets')) {
    newBadges.push('three-tiny-resets');
    badgesEarnedThisReturn.push('three-tiny-resets');
    if (state.settings.gamificationEnabled) {
      pointsEarned += SCORING.threeBreaksBonus;
    }
  }
  
  const updatedFlowSafeReturns = state.dailyStats.flowSafeReturns + (returnedBeforeDrift ? 1 : 0);
  if (updatedFlowSafeReturns >= 5 && !newBadges.includes('back-before-drift')) {
    newBadges.push('back-before-drift');
    badgesEarnedThisReturn.push('back-before-drift');
  }
  if (streak.currentStreak >= 5 && !newBadges.includes('five-day-streak')) {
    newBadges.push('five-day-streak');
    badgesEarnedThisReturn.push('five-day-streak');
  }

  const remainingDailyPoints = Math.max(0, SCORING.dailyCap - state.dailyStats.points);
  const cappedPointsEarned = Math.min(pointsEarned, remainingDailyPoints);

  // Check for other badges
  const totalPoints = state.totalPoints + cappedPointsEarned;
  if (totalPoints >= 500 && !newBadges.includes('chair-defeated')) {
    newBadges.push('chair-defeated');
    badgesEarnedThisReturn.push('chair-defeated');
  }
  
  const totalBreaks = state.dailyStats.movementBreaks + 1 + 
    state.sessionHistory.reduce((sum, s) => sum + s.breaksCompleted, 0);
  if (totalBreaks >= 20 && !newBadges.includes('tiny-reset-pro')) {
    newBadges.push('tiny-reset-pro');
    badgesEarnedThisReturn.push('tiny-reset-pro');
  }
  
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      currentState: 'focus',
      breakStartedAt: null,
      focusStartedAt: Date.now(),
      completedBreaks: state.activeSession.completedBreaks + 1,
      flowSafeReturns: state.activeSession.flowSafeReturns + (returnedBeforeDrift ? 1 : 0),
      pointsEarnedInSession: state.activeSession.pointsEarnedInSession + cappedPointsEarned,
    },
    dailyStats: {
      ...state.dailyStats,
      movementBreaks: state.dailyStats.movementBreaks + 1,
      flowSafeReturns: updatedFlowSafeReturns,
      points: Math.min(state.dailyStats.points + cappedPointsEarned, SCORING.dailyCap),
      badgesEarned: [...state.dailyStats.badgesEarned, ...badgesEarnedThisReturn],
    },
    totalPoints: totalPoints,
    currentStreak: streak.currentStreak,
    lastActiveDate: streak.lastActiveDate,
    lastStreakDate: streak.lastStreakDate,
    badges: newBadges,
  };
};

export const endSession = (state: AppState): AppState => {
  const { activeSession, dailyStats, sessionHistory } = state;
  const now = Date.now();
  const activeFocusSeconds = (activeSession.currentState === 'focus' || activeSession.currentState === 'movement-nudge') && activeSession.focusStartedAt
    ? Math.max(0, Math.floor((now - activeSession.focusStartedAt) / 1000))
    : 0;
  const sessionFocusMinutes = Math.max(
    activeSession.focusMinutesCredited,
    Math.floor((activeSession.accumulatedFocusSeconds + activeFocusSeconds) / 60),
  );
  const finalUncreditedFocusMinutes = Math.max(0, sessionFocusMinutes - activeSession.focusMinutesCredited);
  
  // Check for First Stand badge
  const newBadges = [...state.badges];
  const sessionBadges = [...dailyStats.badgesEarned];
  if (activeSession.completedBreaks >= 1 && !state.badges.includes('first-stand')) {
    newBadges.push('first-stand');
    sessionBadges.push('first-stand');
  }
  
  // Check for Deep Work Defender badge (90+ minute session)
  if (sessionFocusMinutes >= 90 && activeSession.completedBreaks >= 1 && 
      !state.badges.includes('deep-work-defender')) {
    newBadges.push('deep-work-defender');
    sessionBadges.push('deep-work-defender');
  }

  // Create session summary after final focus and badge accounting
  const summary = {
    id: `session-${now}`,
    date: dailyStats.date,
    startedAt: activeSession.startedAt ?? now,
    endedAt: now,
    status: 'completed' as const,
    durationMinutes: activeSession.startedAt ? Math.max(1, Math.round((now - activeSession.startedAt) / 60000)) : sessionFocusMinutes,
    totalFocusMinutes: sessionFocusMinutes,
    breaksCompleted: activeSession.completedBreaks,
    nudgesSkipped: activeSession.skippedReminders,
    flowSafeReturns: activeSession.flowSafeReturns,
    pointsEarned: activeSession.pointsEarnedInSession,
    badgesEarned: sessionBadges,
    tagId: activeSession.tagId,
    routineId: activeSession.routineId,
    presetId: activeSession.presetId,
  };
  
  return {
    ...state,
    activeSession: {
      ...DEFAULT_ACTIVE_SESSION,
      currentState: 'session-complete',
    },
    dailyStats: {
      ...dailyStats,
      focusMinutes: dailyStats.focusMinutes + finalUncreditedFocusMinutes,
      badgesEarned: sessionBadges,
    },
    sessionHistory: [summary, ...sessionHistory].slice(0, 100),
    lastSessionSummary: summary,
    badges: newBadges,
  };
};

export const updateFocusTime = (state: AppState, minutes: number): AppState => {
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      focusMinutesCredited: state.activeSession.focusMinutesCredited + minutes,
    },
    dailyStats: {
      ...state.dailyStats,
      focusMinutes: state.dailyStats.focusMinutes + minutes,
    },
  };
};

/**
 * Get reminder message based on tone setting
 */
export const getReminderMessage = (tone: 'gentle' | 'direct' | 'playful', sessionState: SessionState): string => {
  const messages: Record<'gentle' | 'direct' | 'playful', Record<string, string>> = {
    gentle: {
      'movement-nudge': 'Good moment for a short stand reset.',
      'break-drifting': 'Your break is getting long. Come back when you are ready.',
    },
    direct: {
      'movement-nudge': 'Stand up for 2 minutes.',
      'break-drifting': 'Time to return to work now.',
    },
    playful: {
      'movement-nudge': 'The chair is winning. Time to stand.',
      'break-drifting': 'Good break. Now come back before the idea gets cold.',
    },
  };
  
  return messages[tone][sessionState] || 'Time for a change.';
};

/**
 * Get suggested movement based on session progress
 */
export const getSuggestedMovement = (completedBreaks: number): string => {
  const suggestions = [
    'Stand and breathe for 60 seconds',
    'Shoulder roll and neck reset for 90 seconds',
    'Walk to water and back for 2 minutes',
    'Window reset for 2 minutes',
    'Gentle desk stretch for 3 minutes',
  ];
  
  // Rotate through suggestions based on completed breaks
  return suggestions[completedBreaks % suggestions.length];
};
