// localStorage wrapper for Qithym data persistence
import type { AppState, FocusGoal, PlanStartReminder, SessionSummary, SessionTag, TimerPreset, TimerRoutine } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_ACTIVE_SESSION } from '../types';

const LEGACY_STORAGE_KEY = 'standloop-state';
const STORAGE_KEY_PREFIX = 'qithym-state-v2';

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const createEmptyDailyStats = (date: string) => ({
  date,
  focusMinutes: 0,
  movementBreaks: 0,
  skippedReminders: 0,
  flowSafeReturns: 0,
  points: 0,
  badgesEarned: [] as string[],
});

const DEFAULT_TAGS: SessionTag[] = [
  { id: 'tag-deep-work', name: 'Deep work', color: 'sky' },
  { id: 'tag-writing', name: 'Writing', color: 'lavender' },
  { id: 'tag-admin', name: 'Admin', color: 'slate' },
  { id: 'tag-study', name: 'Study', color: 'lime' },
];

const DEFAULT_PRESETS: TimerPreset[] = [
  {
    id: 'preset-classic',
    name: 'Classic reset',
    focusIntervalMinutes: 45,
    breakDurationMinutes: 3,
    driftThresholdMinutes: 8,
    tagId: 'tag-deep-work',
    createdAt: Date.now(),
  },
  {
    id: 'preset-short',
    name: 'Short start',
    focusIntervalMinutes: 25,
    breakDurationMinutes: 2,
    driftThresholdMinutes: 6,
    tagId: null,
    createdAt: Date.now(),
  },
];

const DEFAULT_ROUTINES: TimerRoutine[] = [
  {
    id: 'routine-deep-start',
    name: 'Deep work opener',
    description: 'A simple first block with a short reset.',
    steps: [
      {
        id: 'routine-deep-start-step-1',
        label: 'Protect the thread',
        focusIntervalMinutes: 45,
        breakDurationMinutes: 3,
        tagId: 'tag-deep-work',
      },
    ],
    createdAt: Date.now(),
    lastStartedAt: null,
  },
];

const normalizeSessionHistory = (history: unknown): SessionSummary[] => {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry, index) => {
      const session = entry as Partial<SessionSummary> & {
        focusMinutes?: number;
        movementBreaks?: number;
        points?: number;
      };

      return {
        id: session.id || `session-${session.date || getTodayDateString()}-${index}`,
        date: session.date || getTodayDateString(),
        startedAt: session.startedAt ?? new Date(`${session.date || getTodayDateString()}T09:00:00`).getTime(),
        endedAt: session.endedAt ?? new Date(`${session.date || getTodayDateString()}T10:00:00`).getTime(),
        status: session.status ?? 'completed',
        durationMinutes: session.durationMinutes ?? session.totalFocusMinutes ?? session.focusMinutes ?? 0,
        totalFocusMinutes: session.totalFocusMinutes ?? session.focusMinutes ?? 0,
        breaksCompleted: session.breaksCompleted ?? session.movementBreaks ?? 0,
        nudgesSkipped: session.nudgesSkipped ?? 0,
        flowSafeReturns: session.flowSafeReturns ?? 0,
        pointsEarned: session.pointsEarned ?? session.points ?? 0,
        badgesEarned: session.badgesEarned ?? [],
        tagId: session.tagId ?? null,
        tagName: session.tagName,
        routineId: session.routineId ?? null,
        presetId: session.presetId ?? null,
      };
    })
    .filter((session) => session.totalFocusMinutes > 0 || session.breaksCompleted > 0 || session.pointsEarned > 0);
};

const normalizeTags = (tags: unknown): SessionTag[] => {
  if (!Array.isArray(tags)) return DEFAULT_TAGS;
  const normalized = tags
    .map((tag) => tag as Partial<SessionTag>)
    .filter((tag) => tag.id && tag.name)
    .map((tag) => ({ id: tag.id as string, name: tag.name as string, color: tag.color || 'sky' }));
  return normalized.length > 0 ? normalized : DEFAULT_TAGS;
};

const normalizeGoals = (goals: unknown): FocusGoal[] => {
  if (!Array.isArray(goals)) return [];
  return goals
    .map((goal) => goal as Partial<FocusGoal>)
    .filter((goal) => goal.id && goal.title && goal.metric && goal.target)
    .map((goal) => ({
      id: goal.id as string,
      title: goal.title as string,
      metric: goal.metric as FocusGoal['metric'],
      target: Math.max(1, Number(goal.target) || 1),
      period: goal.period || 'weekly',
      status: goal.status || 'active',
      createdAt: goal.createdAt || Date.now(),
      completedAt: goal.completedAt ?? null,
    }));
};

const normalizePresets = (presets: unknown): TimerPreset[] => {
  if (!Array.isArray(presets)) return DEFAULT_PRESETS;
  const normalized = presets
    .map((preset) => preset as Partial<TimerPreset>)
    .filter((preset) => preset.id && preset.name)
    .map((preset) => ({
      id: preset.id as string,
      name: preset.name as string,
      focusIntervalMinutes: preset.focusIntervalMinutes || 45,
      breakDurationMinutes: preset.breakDurationMinutes || 3,
      driftThresholdMinutes: preset.driftThresholdMinutes || 8,
      tagId: preset.tagId ?? null,
      createdAt: preset.createdAt || Date.now(),
    }));
  return normalized.length > 0 ? normalized : DEFAULT_PRESETS;
};

const normalizeRoutines = (routines: unknown): TimerRoutine[] => {
  if (!Array.isArray(routines)) return DEFAULT_ROUTINES;
  const normalized = routines
    .map((routine) => routine as Partial<TimerRoutine>)
    .filter((routine) => routine.id && routine.name)
    .map((routine) => ({
      id: routine.id as string,
      name: routine.name as string,
      description: routine.description || '',
      steps: Array.isArray(routine.steps) && routine.steps.length > 0
        ? routine.steps.map((step, index) => ({
            id: step.id || `${routine.id}-step-${index}`,
            label: step.label || `Step ${index + 1}`,
            focusIntervalMinutes: step.focusIntervalMinutes || 45,
            breakDurationMinutes: step.breakDurationMinutes || 3,
            tagId: step.tagId ?? null,
          }))
        : [{
            id: `${routine.id}-step-1`,
            label: 'Focus block',
            focusIntervalMinutes: 45,
            breakDurationMinutes: 3,
            tagId: null,
          }],
      createdAt: routine.createdAt || Date.now(),
      lastStartedAt: routine.lastStartedAt ?? null,
    }));
  return normalized.length > 0 ? normalized : DEFAULT_ROUTINES;
};

const getStorageKey = (userId?: string | null): string => {
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : LEGACY_STORAGE_KEY;
};

const withOwnerIdentity = (state: AppState, userId?: string | null): AppState => {
  if (!userId) return state;

  return {
    ...state,
    identity: {
      userId,
      ownerType: 'account',
      syncPartition: `usr_${userId}`,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    },
  };
};

export const exportStateJson = (state: AppState, userId?: string | null): string => {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      storage: userId ? 'account-scoped-local-browser' : 'local-browser',
      owner: userId
        ? {
            userId,
            syncPartition: `usr_${userId}`,
            syncStatus: 'Prepared for cloud sync; currently stored in this browser.',
          }
        : null,
      state: withOwnerIdentity(state, userId),
    },
    null,
    2,
  );
};

export const parseImportedState = (payload: string, userId?: string | null): AppState => {
  const parsed = JSON.parse(payload);
  const rawState = parsed.state ?? parsed.data?.state ?? parsed.data ?? parsed;
  return normalizeState(rawState, userId);
};

const defaultState = (userId?: string | null): AppState => {
  const today = getTodayDateString();
  return withOwnerIdentity({
    settings: DEFAULT_SETTINGS,
    activeSession: DEFAULT_ACTIVE_SESSION,
    dailyStats: createEmptyDailyStats(today),
    sessionHistory: [],
    lastSessionSummary: null,
    totalPoints: 0,
    currentStreak: 0,
    lastActiveDate: null,
    lastStreakDate: null,
    badges: [],
    tags: DEFAULT_TAGS,
    goals: [],
    routines: DEFAULT_ROUTINES,
    presets: DEFAULT_PRESETS,
  }, userId);
};

const normalizeState = (parsed: Partial<AppState>, userId?: string | null): AppState => {
  const today = getTodayDateString();
  const parsedDailyStats = parsed.dailyStats || createEmptyDailyStats(today);
  const normalizedHistory = normalizeSessionHistory(parsed.sessionHistory);

  return withOwnerIdentity({
    settings: {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings || {}),
      gentleReminders: {
        ...DEFAULT_SETTINGS.gentleReminders,
        ...(parsed.settings?.gentleReminders || {}),
      },
    },
    activeSession: { ...DEFAULT_ACTIVE_SESSION, ...(parsed.activeSession || {}) },
    dailyStats: parsedDailyStats,
    sessionHistory: normalizedHistory,
    lastSessionSummary: parsed.lastSessionSummary ? normalizeSessionHistory([parsed.lastSessionSummary])[0] : null,
    totalPoints: parsed.totalPoints || 0,
    currentStreak: parsed.currentStreak || 0,
    lastActiveDate: parsed.lastActiveDate || null,
    lastStreakDate: parsed.lastStreakDate || null,
    badges: parsed.badges || [],
    tags: normalizeTags(parsed.tags),
    goals: normalizeGoals(parsed.goals),
    routines: normalizeRoutines(parsed.routines),
    presets: normalizePresets(parsed.presets),
  }, userId);
};

export const loadState = (userId?: string | null): AppState => {
  try {
    const storageKey = getStorageKey(userId);
    const stored = localStorage.getItem(storageKey) ?? (userId ? localStorage.getItem(LEGACY_STORAGE_KEY) : null);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Check if we need to reset daily stats for a new day
      const today = getTodayDateString();
      parsed.sessionHistory = normalizeSessionHistory(parsed.sessionHistory);
      parsed.dailyStats = parsed.dailyStats || createEmptyDailyStats(today);

      if (parsed.dailyStats.date !== today) {
        // Archive yesterday's stats to history if there was progress
        if (parsed.dailyStats.focusMinutes > 0 || parsed.dailyStats.movementBreaks > 0) {
          parsed.sessionHistory = [
            {
              id: `session-${parsed.dailyStats.date}-archive`,
              date: parsed.dailyStats.date,
              startedAt: new Date(`${parsed.dailyStats.date}T09:00:00`).getTime(),
              endedAt: new Date(`${parsed.dailyStats.date}T23:59:00`).getTime(),
              status: 'completed',
              durationMinutes: parsed.dailyStats.focusMinutes,
              totalFocusMinutes: parsed.dailyStats.focusMinutes,
              breaksCompleted: parsed.dailyStats.movementBreaks,
              nudgesSkipped: parsed.dailyStats.skippedReminders,
              flowSafeReturns: parsed.dailyStats.flowSafeReturns,
              pointsEarned: parsed.dailyStats.points,
              badgesEarned: parsed.dailyStats.badgesEarned || [],
              tagId: null,
            },
            ...parsed.sessionHistory,
          ].slice(0, 100);
        }
        parsed.dailyStats = createEmptyDailyStats(today);
      }
      
      const normalizedState = normalizeState(parsed, userId);

      if (userId && !localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, JSON.stringify(normalizedState));
      }

      return normalizedState;
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
  }
  
  return defaultState(userId);
};

export const saveState = (state: AppState, userId?: string | null): void => {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(withOwnerIdentity(state, userId)));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
};

export const clearAllData = (userId?: string | null): void => {
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Helper to check and request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const sendNotification = (title: string, body: string): void => {
  if (!('Notification' in window)) {
    return;
  }
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/vite.svg',
    });
  }
};

// Plan start reminder helpers
const PLAN_REMINDER_STORAGE_KEY = 'qithym-plan-reminder';

export const savePlanStartReminder = (reminder: PlanStartReminder | null): void => {
  try {
    if (reminder) {
      localStorage.setItem(PLAN_REMINDER_STORAGE_KEY, JSON.stringify(reminder));
    } else {
      localStorage.removeItem(PLAN_REMINDER_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving plan start reminder:', error);
  }
};

export const loadPlanStartReminder = (): PlanStartReminder | null => {
  try {
    const stored = localStorage.getItem(PLAN_REMINDER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as PlanStartReminder;
    }
  } catch (error) {
    console.error('Error loading plan start reminder:', error);
  }
  return null;
};

export const clearPlanStartReminder = (): void => {
  savePlanStartReminder(null);
};

// Schedule a reminder timeout and return a function to cancel it
let reminderTimeoutId: number | null = null;

export const schedulePlanReminder = (
  reminder: PlanStartReminder,
  onRemind: () => void,
): (() => void) => {
  // Clear any existing reminder
  if (reminderTimeoutId !== null) {
    window.clearTimeout(reminderTimeoutId);
    reminderTimeoutId = null;
  }

  if (!reminder.enabled || reminder.remindAt === 'none' || reminder.scheduledTime === null) {
    return () => {};
  }

  const now = Date.now();
  const delay = reminder.scheduledTime - now;

  // If the scheduled time is in the past, don't schedule
  if (delay <= 0) {
    return () => {};
  }

  // Cap delay at 24 hours max (safety check)
  const maxDelay = 24 * 60 * 60 * 1000;
  const safeDelay = Math.min(delay, maxDelay);

  reminderTimeoutId = window.setTimeout(() => {
    onRemind();
    reminderTimeoutId = null;
  }, safeDelay);

  // Return cancel function
  return () => {
    if (reminderTimeoutId !== null) {
      window.clearTimeout(reminderTimeoutId);
      reminderTimeoutId = null;
    }
  };
};
