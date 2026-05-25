// StandLoop Types - Core data models for the application

export type SessionState = 
  | 'idle'
  | 'focus'
  | 'movement-nudge'
  | 'break-active'
  | 'break-drifting'
  | 'returned'
  | 'session-complete';

export type ReminderTone = 'gentle' | 'direct' | 'playful';

export interface UserSettings {
  focusIntervalMinutes: number;      // Default: 45
  breakDurationMinutes: number;      // Default: 3
  driftThresholdMinutes: number;     // Default: 8
  reminderTone: ReminderTone;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  gamificationEnabled: boolean;
}

export interface BreakType {
  id: string;
  name: string;
  durationSeconds: number;
  description: string;
}

export interface ActiveSession {
  active: boolean;
  startedAt: number | null;           // Timestamp when focus session started
  currentState: SessionState;
  lastBreakAt: number | null;         // Timestamp of last break start
  breakStartedAt: number | null;      // Timestamp when current break started
  skippedReminders: number;
  completedBreaks: number;
  flowSafeReturns: number;
  pointsEarnedInSession: number;
}

export interface DailyStats {
  date: string;                       // YYYY-MM-DD
  focusMinutes: number;
  movementBreaks: number;
  skippedReminders: number;
  flowSafeReturns: number;
  points: number;
  badgesEarned: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface SessionSummary {
  date: string;
  totalFocusMinutes: number;
  breaksCompleted: number;
  nudgesSkipped: number;
  flowSafeReturns: number;
  pointsEarned: number;
  badgesEarned: string[];
}

export interface AppState {
  settings: UserSettings;
  activeSession: ActiveSession;
  dailyStats: DailyStats;
  sessionHistory: SessionSummary[];
  totalPoints: number;
  currentStreak: number;
  badges: string[];  // Array of badge IDs earned
}

// Default values
export const DEFAULT_SETTINGS: UserSettings = {
  focusIntervalMinutes: 45,
  breakDurationMinutes: 3,
  driftThresholdMinutes: 8,
  reminderTone: 'gentle',
  soundEnabled: true,
  notificationsEnabled: false,
  gamificationEnabled: true,
};

export const DEFAULT_ACTIVE_SESSION: ActiveSession = {
  active: false,
  startedAt: null,
  currentState: 'idle',
  lastBreakAt: null,
  breakStartedAt: null,
  skippedReminders: 0,
  completedBreaks: 0,
  flowSafeReturns: 0,
  pointsEarnedInSession: 0,
};

export const BREAK_TYPES: BreakType[] = [
  { id: 'breathe', name: 'Stand and breathe', durationSeconds: 60, description: 'Just stand and take 5 deep breaths' },
  { id: 'shoulders', name: 'Shoulder roll and neck reset', durationSeconds: 90, description: 'Roll shoulders, gentle neck stretches' },
  { id: 'water', name: 'Walk to water and back', durationSeconds: 120, description: 'Quick hydration trip' },
  { id: 'window', name: 'Window reset', durationSeconds: 120, description: 'Look at something 20 feet away' },
  { id: 'stretch', name: 'Gentle desk stretch', durationSeconds: 180, description: 'Hamstring, hip flexor, arm stretches' },
  { id: 'walk', name: 'Light walk', durationSeconds: 300, description: 'Only after a long session' },
];

export const BADGES: Badge[] = [
  { id: 'first-stand', name: 'First Stand', description: 'Complete your first stand break', icon: '🎉' },
  { id: 'flow-saver', name: 'Flow Saver', description: 'Return from break in under 3 minutes', icon: '💫' },
  { id: 'chair-defeated', name: 'Chair Defeated', description: 'Earn 500 total points', icon: '🏆' },
  { id: 'back-before-drift', name: 'Back Before Drift', description: 'Return before drift warning 5 times', icon: '⚡' },
  { id: 'tiny-reset-pro', name: 'Tiny Reset Pro', description: 'Complete 20 short breaks total', icon: '🔄' },
  { id: 'deep-work-defender', name: 'Deep Work Defender', description: 'Complete a 90+ minute focus session with breaks', icon: '🛡️' },
  { id: 'three-tiny-resets', name: '3 Tiny Resets', description: 'Complete 3 short breaks in one day', icon: '✨' },
  { id: 'five-day-streak', name: '5-Day Movement Streak', description: 'Use StandLoop 5 days in a row', icon: '🔥' },
];

// Scoring constants
export const SCORING = {
  respondToNudge: 5,           // Points for responding to a movement nudge
  completeShortBreak: 10,      // Points for completing a 2-5 min break
  returnBeforeDrift: 5,        // Bonus for returning before drift warning
  useDelayNotSkip: 3,          // Points for using Delay instead of Skip
  threeBreaksBonus: 2,         // Bonus for completing 3 breaks in a day
  dailyCap: 100,               // Max points per day to avoid gaming
};
