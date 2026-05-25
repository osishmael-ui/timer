// StandLoop - TypeScript Types
// Shared types for the extension

export type SessionState = 
  | 'idle'
  | 'focus'
  | 'movement-nudge'
  | 'break-suggested'
  | 'break-active'
  | 'break-drifting'
  | 'returned';

export type ReminderTone = 'gentle' | 'direct' | 'playful';

export interface UserSettings {
  reminderIntervalMinutes: number;      // Default: 45
  breakDurationMinutes: number;         // Default: 3
  driftWarningMinutes: number;          // Default: 8
  quietHoursStart: number;              // 0-23, default: 22
  quietHoursEnd: number;                // 0-23, default: 7
  reminderTone: ReminderTone;
  gamificationEnabled: boolean;
  soundEnabled: boolean;
  deepWorkModeEnabled: boolean;
}

export interface FocusSession {
  active: boolean;
  startedAt: number;                    // Timestamp
  lastBreakAt: number | null;           // Timestamp
  currentState: SessionState;
  skippedReminders: number;
  completedBreaks: number;
  focusTimeMinutes: number;             // Renamed from sitTimeMinutes
  breakStartTime: number | null;        // When current break started
}

export interface DailyStats {
  date: string;                         // YYYY-MM-DD
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
  earned: boolean;
  earnedAt?: number;
}

export interface BreakType {
  name: string;
  duration: number;                     // seconds
  description: string;
  condition?: 'longSession' | 'lowEnergy' | 'default';
}

// Storage key constants
export const STORAGE_KEYS = {
  SETTINGS: 'standloop_settings',
  SESSION: 'standloop_session',
  DAILY_STATS: 'standloop_daily_stats',
  BADGES: 'standloop_badges',
  TOTAL_POINTS: 'standloop_total_points',
  STREAK: 'standloop_streak',
} as const;
