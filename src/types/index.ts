// Qithym Types - Core data models for the application

export type SessionState = 
  | 'idle'
  | 'focus'
  | 'movement-nudge'
  | 'break-active'
  | 'break-drifting'
  | 'returned'
  | 'session-complete';

export type ReminderTone = 'gentle' | 'direct' | 'playful';
export type ThemeOption = 'morning' | 'garden' | 'dusk' | 'mono';
export type GoalMetric = 'focusMinutes' | 'sessionCount' | 'streakDays' | 'movementBreaks';
export type GoalPeriod = 'daily' | 'weekly' | 'open';
export type GoalStatus = 'active' | 'completed' | 'paused';
export type SessionStatus = 'completed' | 'ended';

export interface UserSettings {
  focusIntervalMinutes: number;      // Default: 45
  breakDurationMinutes: number;      // Default: 3
  driftThresholdMinutes: number;     // Default: 8
  reminderTone: ReminderTone;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  gamificationEnabled: boolean;
  theme: ThemeOption;
  gentleReminders: GentleReminderSettings;
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
  accumulatedFocusSeconds: number;    // Focus seconds carried across returns/breaks
  focusStartedAt: number | null;      // Timestamp for the current focus segment
  focusMinutesCredited: number;       // Session focus minutes already added to daily stats
  currentState: SessionState;
  lastBreakAt: number | null;         // Timestamp of last break start
  breakStartedAt: number | null;      // Timestamp when current break started
  skippedReminders: number;
  completedBreaks: number;
  flowSafeReturns: number;
  pointsEarnedInSession: number;
  tagId: string | null;
  routineId: string | null;
  presetId: string | null;
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
  id: string;
  date: string;
  startedAt: number;
  endedAt: number;
  status: SessionStatus;
  durationMinutes: number;
  totalFocusMinutes: number;
  breaksCompleted: number;
  nudgesSkipped: number;
  flowSafeReturns: number;
  pointsEarned: number;
  badgesEarned: string[];
  tagId: string | null;
  tagName?: string;
  routineId?: string | null;
  presetId?: string | null;
}

export interface SessionTag {
  id: string;
  name: string;
  color: string;
}

export interface FocusGoal {
  id: string;
  title: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  status: GoalStatus;
  createdAt: number;
  completedAt: number | null;
}

export interface TimerPreset {
  id: string;
  name: string;
  focusIntervalMinutes: number;
  breakDurationMinutes: number;
  driftThresholdMinutes: number;
  tagId: string | null;
  createdAt: number;
}

export interface RoutineStep {
  id: string;
  label: string;
  focusIntervalMinutes: number;
  breakDurationMinutes: number;
  tagId: string | null;
}

export interface TimerRoutine {
  id: string;
  name: string;
  description: string;
  steps: RoutineStep[];
  createdAt: number;
  lastStartedAt: number | null;
}

export interface GentleReminderSettings {
  enabled: boolean;
  checkInHour: string;
  days: number[];
  message: string;
  lastShownDate: string | null;
}

export interface AppState {
  identity?: UserOwnedDataIdentity;
  settings: UserSettings;
  activeSession: ActiveSession;
  dailyStats: DailyStats;
  sessionHistory: SessionSummary[];
  lastSessionSummary: SessionSummary | null;
  totalPoints: number;
  currentStreak: number;
  lastActiveDate: string | null;
  lastStreakDate: string | null;
  badges: string[];  // Array of badge IDs earned
  tags: SessionTag[];
  goals: FocusGoal[];
  routines: TimerRoutine[];
  presets: TimerPreset[];
}

export interface UserOwnedDataIdentity {
  userId: string;
  ownerType: 'account';
  syncPartition: string;
  schemaVersion: 1;
  updatedAt: string;
}

export type Chronotype = 'early' | 'balanced' | 'late' | 'unsure';
export type SleepQuality = 'great' | 'okay' | 'poor' | 'veryPoor';
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type CognitiveLoad = 'light' | 'normal' | 'heavy' | 'veryHeavy';
export type WorkType = 'coding' | 'writingStrategy' | 'meetings' | 'admin' | 'mixed';
export type EnergyCost = 'low' | 'medium' | 'high';
export type MovementPreference = 'gentle' | 'normal' | 'active' | 'minimal';
export type DeepWorkTarget = '30' | '60' | '90' | '120' | '180';
export type WorkdayLength = '8' | '10' | '12';
export type PlanBlockKind = 'deepWork' | 'backupDeepWork' | 'secondaryFocus' | 'movement' | 'admin' | 'recovery' | 'fixed';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface FixedCommitment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  energyCost?: EnergyCost;
}

export interface DailyPlanBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  kind: PlanBlockKind;
  note: string;
}

export interface DailySetupInput {
  chronotype: Chronotype | '';
  sleepQuality: SleepQuality;
  energyLevel: EnergyLevel;
  cognitiveLoad: CognitiveLoad;
  workType: WorkType;
  workdayLength: WorkdayLength;
  workdayStartTime: string;
  workdayEndTime: string;
  fixedCommitments: FixedCommitment[];
  deepWorkTarget: DeepWorkTarget;
  movementPreference: MovementPreference;
}

export interface DailyPlan {
  mainDeepWorkBlock: DailyPlanBlock | null;
  backupDeepWorkBlock: DailyPlanBlock | null;
  secondaryFocusBlock: DailyPlanBlock | null;
  movementBreaks: DailyPlanBlock[];
  adminBlocks: DailyPlanBlock[];
  recoverySuggestion: DailyPlanBlock;
  minimumWin: string;
  confidenceLevel: ConfidenceLevel;
  explanation: string;
  blocks: DailyPlanBlock[];
  warnings: string[];
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
  theme: 'morning',
  gentleReminders: {
    enabled: false,
    checkInHour: '09:30',
    days: [1, 2, 3, 4, 5],
    message: 'A small focus session is available when it fits.',
    lastShownDate: null,
  },
};

export const DEFAULT_ACTIVE_SESSION: ActiveSession = {
  active: false,
  startedAt: null,
  accumulatedFocusSeconds: 0,
  focusStartedAt: null,
  focusMinutesCredited: 0,
  currentState: 'idle',
  lastBreakAt: null,
  breakStartedAt: null,
  skippedReminders: 0,
  completedBreaks: 0,
  flowSafeReturns: 0,
  pointsEarnedInSession: 0,
  tagId: null,
  routineId: null,
  presetId: null,
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
  { id: 'five-day-streak', name: '5-Day Movement Streak', description: 'Use Qithym 5 days in a row', icon: '🔥' },
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
