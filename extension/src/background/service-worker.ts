// StandLoop - Background Service Worker
// Handles timing, alarms, and notifications

import { UserSettings, FocusSession, SessionState } from '../types';
import { getSettings, getSession, saveSession, getDailyStats, saveDailyStats, updateSession, addPoints } from '../storage/local-storage';
import { evaluateState, getReminderMessage, getReturnMessage, getDriftMessage } from '../engine/rules-engine';
import { awardCompleteBreak, awardReturnBeforeDrift, checkAndAwardBadges, updateStreak } from '../engine/scoring';

const ALARM_NAME = 'standloop-timer';
const CHECK_INTERVAL_MINUTES = 1;

// Initialize the service worker
chrome.runtime.onInstalled.addListener(async () => {
  console.log('StandLoop installed');
  
  // Set default settings if not present
  const settings = await getSettings();
  if (!settings) {
    await chrome.storage.local.set({ 
      standloop_settings: {
        reminderIntervalMinutes: 45,
        breakDurationMinutes: 3,
        driftWarningMinutes: 8,
        quietHoursStart: 22,
        quietHoursEnd: 7,
        reminderTone: 'gentle',
        gamificationEnabled: true,
        soundEnabled: true,
        deepWorkModeEnabled: false,
      }
    });
  }
});

// Handle alarms - main timer tick
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  
  await handleTimerTick();
});

// Start the timer alarm
export async function startTimer(): Promise<void> {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: CHECK_INTERVAL_MINUTES,
  });
}

// Stop the timer alarm
export async function stopTimer(): Promise<void> {
  chrome.alarms.clear(ALARM_NAME);
}

// Main timer tick handler
async function handleTimerTick(): Promise<void> {
  const session = await getSession();
  
  if (!session.active) return;
  
  const settings = await getSettings();
  const dailyStats = await getDailyStats();
  
  // Update sit time based on elapsed time
  const now = Date.now();
  const elapsedSinceStart = (now - session.startedAt) / 1000 / 60; // minutes
  const elapsedSinceBreak = session.lastBreakAt 
    ? (now - session.lastBreakAt) / 1000 / 60 
    : elapsedSinceStart;
  
  // Update session with new sit time
  const updatedSession = await updateSession({
    sitTimeMinutes: Math.floor(elapsedSinceStart),
  });
  
  // Evaluate state using rules engine
  const result = evaluateState(updatedSession, settings, {
    movementBreaks: dailyStats.movementBreaks,
    skippedReminders: dailyStats.skippedReminders,
  });
  
  // Handle state transitions
  if (result.nextState !== updatedSession.currentState) {
    await handleStateTransition(
      updatedSession.currentState,
      result.nextState,
      result,
      settings
    );
  }
  
  // Send message to popup if open
  try {
    chrome.runtime.sendMessage({
      type: 'SESSION_UPDATE',
      payload: { session: updatedSession, rulesResult: result },
    });
  } catch (e) {
    // Popup not open, ignore
  }
}

// Handle state transitions
async function handleStateTransition(
  fromState: SessionState,
  toState: SessionState,
  rulesResult: ReturnType<typeof evaluateState>,
  settings: UserSettings
): Promise<void> {
  console.log(`State transition: ${fromState} -> ${toState}`);
  
  switch (toState) {
    case 'sitting-too-long':
    case 'break-suggested':
      // Show notification
      await showNotification(
        'Time to move!',
        rulesResult.message || getReminderMessage(settings.reminderTone),
        settings.soundEnabled
      );
      break;
    
    case 'break-drifting':
      // Show drift warning
      await showNotification(
        'Break is drifting...',
        rulesResult.message || getDriftMessage(settings.reminderTone),
        settings.soundEnabled
      );
      break;
    
    case 'focus':
      // Just returned from break - already handled in completeBreak
      break;
  }
  
  // Update session state
  await updateSession({ currentState: toState });
}

// Show Chrome notification
async function showNotification(
  title: string,
  message: string,
  playSound: boolean
): Promise<void> {
  const options: chrome.notifications.NotificationOptions = {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message,
    priority: 1,
    silent: !playSound,
  };
  
  chrome.notifications.create(options);
}

// Handle messages from popup/options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message: { type: string; payload?: any }): Promise<any> {
  const { type, payload } = message;
  
  switch (type) {
    case 'START_SESSION':
      return await startSession();
    
    case 'END_SESSION':
      return await endSession();
    
    case 'START_BREAK':
      return await startBreak();
    
    case 'COMPLETE_BREAK':
      return await completeBreak();
    
    case 'SKIP_REMINDER':
      return await skipReminder();
    
    case 'RETURN_FROM_DRIFT':
      return await returnFromDrift();
    
    case 'GET_STATUS':
      const session = await getSession();
      const stats = await getDailyStats();
      return { session, stats };
    
    default:
      console.warn('Unknown message type:', type);
  }
}

// Start a focus session
async function startSession(): Promise<FocusSession> {
  const now = Date.now();
  const session: FocusSession = {
    active: true,
    startedAt: now,
    lastBreakAt: null,
    currentState: 'focus',
    skippedReminders: 0,
    completedBreaks: 0,
    sitTimeMinutes: 0,
    breakStartTime: null,
  };
  
  await saveSession(session);
  await startTimer();
  
  return session;
}

// End a focus session
async function endSession(): Promise<FocusSession> {
  await stopTimer();
  
  const session = await getSession();
  const updated = await updateSession({
    active: false,
    currentState: 'idle',
  });
  
  // Update daily stats with final focus minutes
  const stats = await getDailyStats();
  const focusMinutes = session.active 
    ? Math.floor((Date.now() - session.startedAt) / 1000 / 60)
    : session.sitTimeMinutes;
  
  await saveDailyStats({
    ...stats,
    focusMinutes: stats.focusMinutes + focusMinutes,
  });
  
  return updated;
}

// Start a movement break
async function startBreak(): Promise<FocusSession> {
  const session = await getSession();
  const now = Date.now();
  
  const updated = await updateSession({
    currentState: 'break-active',
    breakStartTime: now,
    lastBreakAt: now,
  });
  
  return updated;
}

// Complete a break and return to work
async function completeBreak(): Promise<FocusSession> {
  const session = await getSession();
  const settings = await getSettings();
  
  if (!session.breakStartTime) {
    return session;
  }
  
  const breakDurationMinutes = (Date.now() - session.breakStartTime) / 1000 / 60;
  const returnedBeforeDrift = breakDurationMinutes < settings.driftWarningMinutes;
  
  // Award points
  if (returnedBeforeDrift) {
    await awardReturnBeforeDrift();
  }
  await awardCompleteBreak();
  
  // Update daily stats
  const stats = await getDailyStats();
  await saveDailyStats({
    ...stats,
    movementBreaks: stats.movementBreaks + 1,
    flowSafeReturns: returnedBeforeDrift 
      ? stats.flowSafeReturns + 1 
      : stats.flowSafeReturns,
  });
  
  // Check for badges
  const totalPoints = await chrome.storage.local.get(['standloop_total_points'])
    .then(r => r.standloop_total_points || 0);
  const streak = await chrome.storage.local.get(['standloop_streak'])
    .then(r => r.standloop_streak || 0);
  
  await checkAndAwardBadges(
    stats.movementBreaks + 1,
    returnedBeforeDrift ? stats.flowSafeReturns + 1 : stats.flowSafeReturns,
    totalPoints,
    session.completedBreaks + 1,
    streak,
    session.sitTimeMinutes
  );
  
  // Update streak
  await updateStreak(true);
  
  // Transition back to focus
  const updated = await updateSession({
    currentState: 'focus',
    completedBreaks: session.completedBreaks + 1,
    breakStartTime: null,
    lastBreakAt: Date.now(),
  });
  
  // Show return message
  if (settings.gamificationEnabled) {
    await showNotification(
      'Welcome back!',
      getReturnMessage(settings.reminderTone),
      settings.soundEnabled
    );
  }
  
  return updated;
}

// Skip a reminder
async function skipReminder(): Promise<FocusSession> {
  const session = await getSession();
  const stats = await getDailyStats();
  
  // Update session with incremented skip count
  const updated = await updateSession({
    skippedReminders: session.skippedReminders + 1,
    currentState: 'focus',
  });
  
  // Update daily stats
  await saveDailyStats({
    ...stats,
    skippedReminders: stats.skippedReminders + 1,
  });
  
  return updated;
}

// Return from drift state
async function returnFromDrift(): Promise<FocusSession> {
  const session = await getSession();
  
  // Still award partial points for returning
  await addPoints(3); // Small bonus for returning even after drift
  
  const updated = await updateSession({
    currentState: 'focus',
    breakStartTime: null,
    lastBreakAt: Date.now(),
  });
  
  return updated;
}
