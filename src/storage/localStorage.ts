// localStorage wrapper for StandLoop data persistence
import type { AppState } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_ACTIVE_SESSION } from '../types';

const STORAGE_KEY = 'standloop-state';

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

export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Check if we need to reset daily stats for a new day
      const today = getTodayDateString();
      if (parsed.dailyStats.date !== today) {
        // Archive yesterday's stats to history if there was progress
        if (parsed.dailyStats.focusMinutes > 0 || parsed.dailyStats.movementBreaks > 0) {
          parsed.sessionHistory = parsed.sessionHistory || [];
          parsed.sessionHistory.push(parsed.dailyStats);
        }
        parsed.dailyStats = createEmptyDailyStats(today);
      }
      
      return {
        settings: parsed.settings || DEFAULT_SETTINGS,
        activeSession: parsed.activeSession || DEFAULT_ACTIVE_SESSION,
        dailyStats: parsed.dailyStats || createEmptyDailyStats(today),
        sessionHistory: parsed.sessionHistory || [],
        totalPoints: parsed.totalPoints || 0,
        currentStreak: parsed.currentStreak || 0,
        badges: parsed.badges || [],
      };
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
  }
  
  // Return default state
  const today = getTodayDateString();
  return {
    settings: DEFAULT_SETTINGS,
    activeSession: DEFAULT_ACTIVE_SESSION,
    dailyStats: createEmptyDailyStats(today),
    sessionHistory: [],
    totalPoints: 0,
    currentStreak: 0,
    badges: [],
  };
};

export const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
};

export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
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
