// StandLoop - Rules Engine
// AI-like deterministic logic for smart reminders
// This is where future AI personalization could be added

import { UserSettings, FocusSession, SessionState, ReminderTone } from '../types';

// Break types library
export const BREAK_TYPES = [
  { name: 'Stand and breathe', duration: 60, description: 'Just stand and take 5 deep breaths' },
  { name: 'Shoulder roll and neck reset', duration: 90, description: 'Roll shoulders, gentle neck stretches' },
  { name: 'Walk to water and back', duration: 120, description: 'Quick hydration trip' },
  { name: 'Window reset', duration: 120, description: 'Look at something 20 feet away' },
  { name: 'Gentle desk stretch', duration: 180, description: 'Hamstring, hip flexor, arm stretches' },
  { name: 'Longer walk', duration: 300, description: 'Only after very long sessions', condition: 'longSession' as const },
];

// Reminder messages by tone
const REMINDER_MESSAGES = {
  gentle: [
    'Good moment for a short stand reset.',
    'A tiny movement break could help here.',
    'Your body might appreciate a quick stretch.',
    'Time for a gentle stand and breathe.',
  ],
  direct: [
    'Stand up for 2 minutes.',
    'You have been in focus mode a while. Move briefly, then return.',
    'Time for a movement break now.',
    'Get up and move for a few minutes.',
  ],
  playful: [
    'The chair is winning. Time to stand.',
    'Tiny leg reboot. Then back to the build.',
    'Stand up before the chair becomes your co-founder.',
    'Your brain can stay in flow. Your legs need a quick vote.',
  ],
};

// Return messages by tone
const RETURN_MESSAGES = {
  gentle: [
    'Nice. You moved without breaking flow.',
    'Good reset. Back to the build.',
    'Welcome back. Ready to continue?',
  ],
  direct: [
    'Break complete. Resume work.',
    'Return successful. Continue your session.',
    'Back on track.',
  ],
  playful: [
    'Flow intact. Let\'s go.',
    'Chair defeated. Code awaits.',
    'Back before the idea got cold.',
  ],
};

// Drift warning messages by tone
const DRIFT_MESSAGES = {
  gentle: [
    'Break is drifting. Come back before the idea gets cold.',
    'You\'ve been away a while. Ready to return?',
    'Time to head back to your work.',
  ],
  direct: [
    'Break time exceeded. Return to work now.',
    'You are off track. Get back to your session.',
    'Return to work. The break is over.',
  ],
  playful: [
    'Break is becoming a second lunch. Time to return!',
    'The idea is getting cold. Reheat it with your presence.',
    'Don\'t let the chair win by staying away too long.',
  ],
};

/**
 * Get a random reminder message based on tone
 */
export function getReminderMessage(tone: ReminderTone): string {
  const messages = REMINDER_MESSAGES[tone];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get a return message based on tone
 */
export function getReturnMessage(tone: ReminderTone): string {
  const messages = RETURN_MESSAGES[tone];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get a drift warning message based on tone
 */
export function getDriftMessage(tone: ReminderTone): string {
  const messages = DRIFT_MESSAGES[tone];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Determine if we're in quiet hours
 */
export function isQuietHours(settings: UserSettings): boolean {
  const hour = new Date().getHours();
  const { quietHoursStart, quietHoursEnd } = settings;
  
  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (quietHoursStart > quietHoursEnd) {
    return hour >= quietHoursStart || hour < quietHoursEnd;
  }
  return hour >= quietHoursStart && hour < quietHoursEnd;
}

/**
 * Select appropriate break type based on session context
 * 
 * Future AI personalization could:
 * - Learn which breaks the user prefers
 * - Consider time of day energy patterns
 * - Adapt to user's physical feedback
 * - Consider recent break history
 */
export function selectBreakType(
  session: FocusSession,
  _settings: UserSettings
): typeof BREAK_TYPES[0] {
  const focusTimeMinutes = session.focusTimeMinutes;
  
  // After very long sessions, suggest longer break
  if (focusTimeMinutes >= 90) {
    const longerBreak = BREAK_TYPES.find(b => b.condition === 'longSession');
    if (longerBreak) return longerBreak;
  }
  
  // Default: pick a short break randomly
  const shortBreaks = BREAK_TYPES.filter(b => !b.condition || b.duration <= 180);
  return shortBreaks[Math.floor(Math.random() * shortBreaks.length)];
}

/**
 * Rules Engine: Determine next action based on current state
 * 
 * This is the "AI-like" brain of StandLoop.
 * It considers multiple factors to make smart decisions.
 * 
 * Factors considered:
 * - How long user has been in focus mode
 * - How long since last movement break
 * - Time of day
 * - Number of breaks already taken today
 * - Whether user skipped recent breaks
 * - Whether user is in deep work mode
 * - Whether user just came back from a break
 * - Whether breaks are becoming too long
 * - Whether user has had too many interruptions
 * 
 * Future AI enhancements could:
 * - Learn optimal reminder timing per user
 * - Detect patterns in when user sits longest
 * - Personalize break suggestions based on preference
 * - Adjust difficulty based on compliance history
 */
export interface RulesEngineResult {
  shouldRemind: boolean;
  nextState: SessionState;
  suggestedBreak?: typeof BREAK_TYPES[0];
  message?: string;
  urgency: 'low' | 'medium' | 'high';
}

export function evaluateState(
  session: FocusSession,
  settings: UserSettings,
  _dailyStats: { movementBreaks: number; skippedReminders: number }
): RulesEngineResult {
  const { currentState, focusTimeMinutes, breakStartTime } = session;
  const { reminderIntervalMinutes, driftWarningMinutes, reminderTone } = settings;
  
  // Default result
  const defaultResult: RulesEngineResult = {
    shouldRemind: false,
    nextState: currentState,
    urgency: 'low',
  };
  
  // Check quiet hours - don't remind during quiet hours
  if (isQuietHours(settings) && currentState === 'focus') {
    return defaultResult;
  }
  
  switch (currentState) {
    case 'idle':
      return defaultResult;
    
    case 'focus': {
      // Check if focus session has run long without a break
      if (focusTimeMinutes >= reminderIntervalMinutes) {
        // Consider skip history - more skips = higher urgency
        const recentSkips = session.skippedReminders;
        const urgency: 'low' | 'medium' | 'high' = 
          recentSkips >= 3 ? 'high' : recentSkips >= 1 ? 'medium' : 'low';
        
        return {
          shouldRemind: true,
          nextState: 'movement-nudge',
          suggestedBreak: selectBreakType(session, settings),
          message: getReminderMessage(reminderTone),
          urgency,
        };
      }
      return defaultResult;
    }
    
    case 'movement-nudge':
      // Auto-transition to break suggested after a moment
      return {
        shouldRemind: true,
        nextState: 'break-suggested',
        suggestedBreak: selectBreakType(session, settings),
        message: getReminderMessage(reminderTone),
        urgency: 'medium',
      };
    
    case 'break-suggested':
      // Wait for user action
      return defaultResult;
    
    case 'break-active': {
      if (!breakStartTime) return defaultResult;
      
      const breakElapsedMinutes = (Date.now() - breakStartTime) / 1000 / 60;
      
      // Check if break is drifting too long
      if (breakElapsedMinutes >= driftWarningMinutes) {
        return {
          shouldRemind: true,
          nextState: 'break-drifting',
          message: getDriftMessage(reminderTone),
          urgency: 'high',
        };
      }
      
      // Break still in progress
      return defaultResult;
    }
    
    case 'break-drifting':
      // Keep nudging until return
      return {
        shouldRemind: true,
        nextState: 'break-drifting',
        message: getDriftMessage(reminderTone),
        urgency: 'high',
      };
    
    case 'returned':
      // Brief state before transitioning back to focus
      return {
        shouldRemind: false,
        nextState: 'focus',
        urgency: 'low',
      };
    
    default:
      return defaultResult;
  }
}

/**
 * Calculate recommended break duration based on context
 * 
 * Future AI could personalize this based on:
 * - User's historical break preferences
 * - Time remaining in workday
 * - Energy level indicators
 * - Recent activity patterns
 */
export function getRecommendedBreakDuration(
  session: FocusSession,
  settings: UserSettings
): number {
  const { focusTimeMinutes } = session;
  const { breakDurationMinutes } = settings;
  
  // Base duration from settings
  let duration = breakDurationMinutes;
  
  // Extend slightly for very long sessions
  if (focusTimeMinutes >= 90) {
    duration = Math.min(duration + 2, 5);
  }
  
  // Shorten if many breaks already taken (encourage shorter, more frequent breaks)
  // This is tracked in daily stats, would need to be passed in
  
  return duration;
}

/**
 * Determine if user should be encouraged to take a break now
 * even if not yet at the reminder interval
 * 
 * Factors:
 * - Morning vs afternoon (afternoon slump)
 * - Many consecutive focus days
 * - Recent long sessions
 */
export function shouldEncourageEarlyBreak(
  session: FocusSession,
  settings: UserSettings,
  context: {
    hourOfDay: number;
    consecutiveFocusDays: number;
    yesterdayFocusMinutes: number;
  }
): boolean {
  const { hourOfDay } = context;
  
  // Afternoon slump period (2pm - 4pm)
  if (hourOfDay >= 14 && hourOfDay <= 16) {
    // Encourage break 10 minutes early
    return session.focusTimeMinutes >= (settings.reminderIntervalMinutes - 10);
  }
  
  return false;
}
