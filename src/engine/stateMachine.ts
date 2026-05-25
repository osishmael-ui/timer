// State machine and scoring logic for StandLoop
import { 
  AppState, 
  SessionState, 
  SCORING, 
  BADGES,
  ActiveSession,
  DailyStats,
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

export const startFocusSession = (state: AppState): AppState => {
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      active: true,
      startedAt: Date.now(),
      currentState: 'focus',
      lastBreakAt: Date.now(),
      breakStartedAt: null,
      skippedReminders: 0,
      completedBreaks: 0,
      flowSafeReturns: 0,
      pointsEarnedInSession: 0,
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
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      currentState: 'break-active',
      lastBreakAt: Date.now(),
      breakStartedAt: Date.now(),
    },
  };
};

export const delayNudge = (state: AppState): AppState => {
  // Award points for using Delay instead of Skip
  let pointsToAdd = 0;
  if (state.settings.gamificationEnabled) {
    pointsToAdd = SCORING.useDelayNotSkip;
  }
  
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      currentState: 'focus',
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
  const { breakStartedAt, currentState } = state.activeSession;
  const { breakDurationMinutes, driftThresholdMinutes } = state.settings;
  
  let pointsEarned = 0;
  let newBadges = [...state.badges];
  let badgesEarnedThisReturn: string[] = [];
  
  // Calculate break duration
  let breakDurationMinutes = 0;
  if (breakStartedAt) {
    breakDurationMinutes = (Date.now() - breakStartedAt) / 1000 / 60;
  }
  
  // Award points based on behavior
  if (state.settings.gamificationEnabled) {
    // Points for responding to nudge
    pointsEarned += SCORING.respondToNudge;
    
    // Points for completing a short break (2-5 minutes)
    if (breakDurationMinutes >= 2 && breakDurationMinutes <= 5) {
      pointsEarned += SCORING.completeShortBreak;
    }
    
    // Bonus for returning before drift
    if (breakDurationMinutes < driftThresholdMinutes) {
      pointsEarned += SCORING.returnBeforeDrift;
      
      // Check for Flow Saver badge (return under 3 minutes)
      if (breakDurationMinutes < 3 && !state.badges.includes('flow-saver')) {
        newBadges.push('flow-saver');
        badgesEarnedThisReturn.push('flow-saver');
      }
    }
  }
  
  // Update streak if this is a good return
  let newStreak = state.currentStreak;
  if (pointsEarned > 0 && state.dailyStats.movementBreaks === 0) {
    // Starting a new streak day
    newStreak = state.currentStreak + 1;
  }
  
  // Check for Three Tiny Resets badge
  const updatedBreaksCount = state.dailyStats.movementBreaks + 1;
  if (updatedBreaksCount >= 3 && !newBadges.includes('three-tiny-resets')) {
    newBadges.push('three-tiny-resets');
    badgesEarnedThisReturn.push('three-tiny-resets');
    if (state.settings.gamificationEnabled) {
      pointsEarned += SCORING.threeBreaksBonus;
    }
  }
  
  // Check for other badges
  const totalPoints = state.totalPoints + pointsEarned;
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
      completedBreaks: state.activeSession.completedBreaks + 1,
      flowSafeReturns: state.activeSession.flowSafeReturns + 1,
      pointsEarnedInSession: state.activeSession.pointsEarnedInSession + pointsEarned,
    },
    dailyStats: {
      ...state.dailyStats,
      movementBreaks: state.dailyStats.movementBreaks + 1,
      flowSafeReturns: state.dailyStats.flowSafeReturns + 1,
      points: Math.min(state.dailyStats.points + pointsEarned, SCORING.dailyCap),
      badgesEarned: [...state.dailyStats.badgesEarned, ...badgesEarnedThisReturn],
    },
    totalPoints: totalPoints,
    currentStreak: newStreak,
    badges: newBadges,
  };
};

export const endSession = (state: AppState): AppState => {
  const { activeSession, dailyStats, sessionHistory } = state;
  
  // Create session summary
  const summary = {
    date: dailyStats.date,
    totalFocusMinutes: dailyStats.focusMinutes,
    breaksCompleted: activeSession.completedBreaks,
    nudgesSkipped: activeSession.skippedReminders,
    flowSafeReturns: activeSession.flowSafeReturns,
    pointsEarned: activeSession.pointsEarnedInSession,
    badgesEarned: dailyStats.badgesEarned,
  };
  
  // Check for First Stand badge
  let newBadges = [...state.badges];
  if (activeSession.completedBreaks >= 1 && !state.badges.includes('first-stand')) {
    newBadges.push('first-stand');
  }
  
  // Check for Deep Work Defender badge (90+ minute session)
  if (dailyStats.focusMinutes >= 90 && activeSession.completedBreaks >= 1 && 
      !state.badges.includes('deep-work-defender')) {
    newBadges.push('deep-work-defender');
  }
  
  return {
    ...state,
    activeSession: {
      ...DEFAULT_ACTIVE_SESSION,
      currentState: 'session-complete',
    },
    sessionHistory: [summary, ...sessionHistory].slice(0, 10), // Keep last 10 sessions
    badges: newBadges,
  };
};

export const updateFocusTime = (state: AppState, minutes: number): AppState => {
  return {
    ...state,
    dailyStats: {
      ...state.dailyStats,
      focusMinutes: state.dailyStats.focusMinutes + minutes,
    },
  };
};

/**
 * Get reminder message based on tone setting
 */
export const getReminderMessage = (tone: 'gentle' | 'direct' | 'playful', state: SessionState): string => {
  const messages = {
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
  
  return messages[tone][state] || 'Time for a change.';
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
