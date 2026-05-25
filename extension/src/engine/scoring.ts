// StandLoop - Scoring & Gamification Logic
// Points, badges, and streaks system

import { Badge } from '../types';
import { getDailyStats, saveDailyStats, addPoints, getBadges, saveBadges, getStreak, saveStreak } from '../storage/local-storage';

// Point values - can be tuned for balance
export const SCORING = {
  onTimeStand: 5,           // Take break when reminded
  completeShortBreak: 10,   // Finish a 2-5 min break
  returnBeforeDrift: 5,     // Return before drift warning
  notSkipping: 3,           // Don't skip reminder
  threeBreaksBonus: 2,      // Complete 3 breaks in a day
  dailyCap: 100,            // Max points per day
};

// Badge definitions
export const BADGE_DEFINITIONS: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  { id: 'first-stand', name: 'First Stand', description: 'Complete your first stand break' },
  { id: 'flow-saver', name: 'Flow Saver', description: 'Return from break in under 3 minutes' },
  { id: 'no-zombie-sitting', name: 'No Zombie Sitting', description: 'Take a break before 60 minutes of sitting' },
  { id: 'three-tiny-resets', name: '3 Tiny Resets', description: 'Complete 3 short breaks in one day' },
  { id: 'deep-work-defender', name: 'Deep Work Defender', description: 'Complete a 90+ minute focus session with breaks' },
  { id: 'back-before-drift', name: 'Back Before Drift', description: 'Return before drift warning 5 times' },
  { id: 'five-day-streak', name: '5-Day Movement Streak', description: 'Use StandLoop 5 days in a row' },
  { id: 'chair-defeated', name: 'Chair Defeated', description: 'Earn 500 total points' },
  { id: 'tiny-reset-pro', name: 'Tiny Reset Pro', description: 'Complete 20 short breaks total' },
  { id: 'builder-in-motion', name: 'Builder in Motion', description: 'Earn all other badges' },
];

// Award points for taking a stand break on time
export async function awardOnTimeStand(): Promise<void> {
  await addPoints(SCORING.onTimeStand);
}

// Award points for completing a short break
export async function awardCompleteBreak(): Promise<void> {
  await addPoints(SCORING.completeShortBreak);
  
  // Check for 3 breaks bonus
  const stats = await getDailyStats();
  if (stats.movementBreaks >= 3) {
    await addPoints(SCORING.threeBreaksBonus);
  }
}

// Award points for returning before drift
export async function awardReturnBeforeDrift(): Promise<void> {
  await addPoints(SCORING.returnBeforeDrift);
}

// Award points for not skipping
export async function awardNotSkipping(): Promise<void> {
  await addPoints(SCORING.notSkipping);
}

// Check and award badges based on current state
export async function checkAndAwardBadges(
  dailyBreaks: number,
  flowSafeReturns: number,
  totalPoints: number,
  totalBreaks: number,
  streak: number,
  sessionMinutes: number
): Promise<Badge[]> {
  const currentBadges = await getBadges();
  const earnedBadgeIds = new Set(currentBadges.filter(b => b.earned).map(b => b.id));
  const newBadges: Badge[] = [];

  // Helper to check and add badge
  const tryAwardBadge = (badgeDef: typeof BADGE_DEFINITIONS[0], condition: boolean) => {
    if (condition && !earnedBadgeIds.has(badgeDef.id)) {
      const newBadge: Badge = {
        ...badgeDef,
        earned: true,
        earnedAt: Date.now(),
      };
      newBadges.push(newBadge);
      earnedBadgeIds.add(badgeDef.id);
    }
  };

  // First Stand - completed at least 1 break
  tryAwardBadge(BADGE_DEFINITIONS[0], dailyBreaks >= 1 || totalBreaks >= 1);

  // Flow Saver - 5 flow safe returns
  tryAwardBadge(BADGE_DEFINITIONS[1], flowSafeReturns >= 5);

  // No Zombie Sitting - took break before 60 min (tracked elsewhere, simplified here)
  // This would need more complex tracking, simplified for MVP

  // Three Tiny Resets - 3 breaks today
  tryAwardBadge(BADGE_DEFINITIONS[3], dailyBreaks >= 3);

  // Deep Work Defender - 90+ minute session
  tryAwardBadge(BADGE_DEFINITIONS[4], sessionMinutes >= 90);

  // Back Before Drift - 5 returns before drift
  tryAwardBadge(BADGE_DEFINITIONS[5], flowSafeReturns >= 5);

  // Five Day Streak
  tryAwardBadge(BADGE_DEFINITIONS[6], streak >= 5);

  // Chair Defeated - 500 total points
  tryAwardBadge(BADGE_DEFINITIONS[7], totalPoints >= 500);

  // Tiny Reset Pro - 20 total breaks
  tryAwardBadge(BADGE_DEFINITIONS[8], totalBreaks >= 20);

  // Builder in Motion - all other badges
  const allOtherBadgeIds = BADGE_DEFINITIONS.slice(0, -1).map(b => b.id);
  const allOthersEarned = allOtherBadgeIds.every(id => earnedBadgeIds.has(id));
  tryAwardBadge(BADGE_DEFINITIONS[9], allOthersEarned);

  if (newBadges.length > 0) {
    const updatedBadges = [...currentBadges, ...newBadges];
    await saveBadges(updatedBadges);
  }

  return newBadges;
}

// Update streak based on daily activity
export async function updateStreak(completedToday: boolean): Promise<number> {
  let streak = await getStreak();
  const stats = await getDailyStats();
  const today = new Date().toISOString().split('T')[0];

  if (stats.date !== today) {
    // New day
    if (completedToday) {
      streak += 1;
    } else {
      // Check if yesterday was completed (simplified - just reset for now)
      streak = completedToday ? 1 : 0;
    }
  }

  await saveStreak(streak);
  return streak;
}

// Get Move Score (0-100 daily score based on activity)
export function calculateMoveScore(stats: {
  movementBreaks: number;
  focusMinutes: number;
  skippedReminders: number;
}): number {
  const { movementBreaks, focusMinutes, skippedReminders } = stats;
  
  // Base score from breaks (max 50 points)
  const breakScore = Math.min(movementBreaks * 10, 50);
  
  // Bonus for good focus/break ratio (max 30 points)
  const idealBreaks = Math.floor(focusMinutes / 45);
  const ratioScore = movementBreaks >= idealBreaks ? 30 : Math.floor((movementBreaks / idealBreaks) * 30) || 0;
  
  // Penalty for skips (max -20 points)
  const skipPenalty = Math.min(skippedReminders * 5, 20);
  
  return Math.max(0, Math.min(100, breakScore + ratioScore - skipPenalty));
}
