// StandLoop - Local Storage Wrapper
// Chrome storage.local utilities for privacy-first data persistence

import { STORAGE_KEYS, UserSettings, FocusSession, DailyStats, Badge } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  reminderIntervalMinutes: 45,
  breakDurationMinutes: 3,
  driftWarningMinutes: 8,
  quietHoursStart: 22,
  quietHoursEnd: 7,
  reminderTone: 'gentle',
  gamificationEnabled: true,
  soundEnabled: true,
  deepWorkModeEnabled: false,
};

const DEFAULT_SESSION: FocusSession = {
  active: false,
  startedAt: 0,
  lastBreakAt: null,
  currentState: 'idle',
  skippedReminders: 0,
  completedBreaks: 0,
  focusTimeMinutes: 0,
  breakStartTime: null,
};

const DEFAULT_DAILY_STATS: DailyStats = {
  date: new Date().toISOString().split('T')[0],
  focusMinutes: 0,
  movementBreaks: 0,
  skippedReminders: 0,
  flowSafeReturns: 0,
  points: 0,
  badgesEarned: [],
};

// Get settings from storage
export async function getSettings(): Promise<UserSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
      resolve(result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS);
    });
  });
}

// Save settings to storage
export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings }, resolve);
  });
}

// Get current session
export async function getSession(): Promise<FocusSession> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.SESSION], (result) => {
      resolve(result[STORAGE_KEYS.SESSION] || DEFAULT_SESSION);
    });
  });
}

// Save session to storage
export async function saveSession(session: Partial<FocusSession>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.SESSION]: session }, resolve);
  });
}

// Get today's stats
export async function getDailyStats(): Promise<DailyStats> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.DAILY_STATS], (result) => {
      const stats = result[STORAGE_KEYS.DAILY_STATS] || DEFAULT_DAILY_STATS;
      // Reset if it's a new day
      const today = new Date().toISOString().split('T')[0];
      if (stats.date !== today) {
        resolve({ ...DEFAULT_DAILY_STATS, date: today });
      } else {
        resolve(stats);
      }
    });
  });
}

// Save daily stats
export async function saveDailyStats(stats: DailyStats): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.DAILY_STATS]: stats }, resolve);
  });
}

// Get all badges
export async function getBadges(): Promise<Badge[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.BADGES], (result) => {
      resolve(result[STORAGE_KEYS.BADGES] || []);
    });
  });
}

// Save badges
export async function saveBadges(badges: Badge[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.BADGES]: badges }, resolve);
  });
}

// Get total points
export async function getTotalPoints(): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.TOTAL_POINTS], (result) => {
      resolve(result[STORAGE_KEYS.TOTAL_POINTS] || 0);
    });
  });
}

// Save total points
export async function saveTotalPoints(points: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.TOTAL_POINTS]: points }, resolve);
  });
}

// Get streak
export async function getStreak(): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.STREAK], (result) => {
      resolve(result[STORAGE_KEYS.STREAK] || 0);
    });
  });
}

// Save streak
export async function saveStreak(streak: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.STREAK]: streak }, resolve);
  });
}

// Reset all local data
export async function resetAllData(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve);
  });
}

// Helper: Update session with partial data
export async function updateSession(updates: Partial<FocusSession>): Promise<FocusSession> {
  const current = await getSession();
  const updated = { ...current, ...updates };
  await saveSession(updated);
  return updated;
}

// Helper: Add points to daily stats and total
export async function addPoints(points: number): Promise<void> {
  const stats = await getDailyStats();
  const total = await getTotalPoints();
  
  // Cap daily points at 100
  const newDailyPoints = Math.min(stats.points + points, 100);
  const addedToday = newDailyPoints - stats.points;
  
  await saveDailyStats({ ...stats, points: newDailyPoints });
  await saveTotalPoints(total + addedToday);
}
