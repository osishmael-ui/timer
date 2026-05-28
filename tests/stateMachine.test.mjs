import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const tempDir = await mkdtemp(join(tmpdir(), 'standloop-state-'));
const tempSrcDir = join(tempDir, 'src');
const tempEngineDir = join(tempSrcDir, 'engine');
const typesPath = join(tempSrcDir, 'types.js');
const stateMachinePath = join(tempEngineDir, 'stateMachine.js');

await mkdir(tempEngineDir, { recursive: true });

const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2023,
    verbatimModuleSyntax: true,
  },
}).outputText;

await writeFile(typesPath, transpile(await readFile('src/types/index.ts', 'utf8')), 'utf8');
await writeFile(
  stateMachinePath,
  transpile(await readFile('src/engine/stateMachine.ts', 'utf8')).replace("from '../types'", "from '../types.js'"),
  'utf8',
);

const {
  startFocusSession,
  triggerMovementNudge,
  startBreak,
  delayNudge,
  skipNudge,
  checkDriftStatus,
  returnToWork,
  endSession,
  updateFocusTime,
} = await import(pathToFileURL(stateMachinePath));

const today = new Date().toISOString().split('T')[0];

const makeState = (overrides = {}) => ({
  settings: {
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
  },
  activeSession: {
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
  },
  dailyStats: {
    date: today,
    focusMinutes: 0,
    movementBreaks: 0,
    skippedReminders: 0,
    flowSafeReturns: 0,
    points: 0,
    badgesEarned: [],
  },
  sessionHistory: [],
  lastSessionSummary: null,
  totalPoints: 0,
  currentStreak: 0,
  lastActiveDate: null,
  lastStreakDate: null,
  badges: [],
  tags: [],
  goals: [],
  routines: [],
  presets: [],
  ...overrides,
});

const withMockedNow = async (timestamp, test) => {
  const originalNow = Date.now;
  Date.now = () => timestamp;
  try {
    await test();
  } finally {
    Date.now = originalNow;
  }
};

await withMockedNow(1_000_000, () => {
  const state = startFocusSession(makeState());
  assert.equal(state.activeSession.currentState, 'focus');
  assert.equal(state.activeSession.active, true);
  assert.equal(state.activeSession.focusMinutesCredited, 0);
});

await withMockedNow(1_100_000, () => {
  const focused = startFocusSession(makeState());
  const nudged = triggerMovementNudge(focused);
  const delayed = delayNudge(nudged);
  const skipped = skipNudge(nudged);

  assert.equal(nudged.activeSession.currentState, 'movement-nudge');
  assert.equal(delayed.activeSession.currentState, 'focus');
  assert.equal(delayed.dailyStats.points, 3);
  assert.equal(delayed.activeSession.pointsEarnedInSession, 3);
  assert.equal(skipped.dailyStats.skippedReminders, 1);
});

await withMockedNow(2_000_000, () => {
  const focused = startFocusSession(makeState());
  const credited = updateFocusTime(focused, 2);
  assert.equal(credited.dailyStats.focusMinutes, 2);
  assert.equal(credited.activeSession.focusMinutesCredited, 2);
});

await withMockedNow(3_000_000, () => {
  const focused = startFocusSession(makeState());
  const breaking = startBreak(focused);
  const drifted = checkDriftStatus({
    ...breaking,
    activeSession: {
      ...breaking.activeSession,
      breakStartedAt: 3_000_000 - 9 * 60 * 1000,
    },
  });

  assert.equal(breaking.activeSession.currentState, 'break-active');
  assert.equal(drifted.activeSession.currentState, 'break-drifting');
});

await withMockedNow(4_000_000, () => {
  const breaking = {
    ...startBreak(startFocusSession(makeState())),
    activeSession: {
      ...startBreak(startFocusSession(makeState())).activeSession,
      breakStartedAt: 4_000_000 - 3 * 60 * 1000,
    },
  };
  const returned = returnToWork(breaking);

  assert.equal(returned.activeSession.currentState, 'focus');
  assert.equal(returned.activeSession.completedBreaks, 1);
  assert.equal(returned.dailyStats.movementBreaks, 1);
  assert.equal(returned.dailyStats.points, 20);
  assert.equal(returned.currentStreak, 1);
});

await withMockedNow(5_000_000, () => {
  const capped = returnToWork({
    ...startBreak(startFocusSession(makeState({
      dailyStats: {
        date: today,
        focusMinutes: 0,
        movementBreaks: 0,
        skippedReminders: 0,
        flowSafeReturns: 0,
        points: 95,
        badgesEarned: [],
      },
      totalPoints: 95,
    }))),
    activeSession: {
      ...startBreak(startFocusSession(makeState())).activeSession,
      breakStartedAt: 5_000_000 - 3 * 60 * 1000,
    },
  });

  assert.equal(capped.dailyStats.points, 100);
  assert.equal(capped.activeSession.pointsEarnedInSession, 5);
});

await withMockedNow(6_000_000, () => {
  const state = {
    ...startFocusSession(makeState()),
    activeSession: {
      ...startFocusSession(makeState()).activeSession,
      completedBreaks: 1,
      flowSafeReturns: 1,
      pointsEarnedInSession: 20,
      accumulatedFocusSeconds: 90 * 60,
      tagId: 'tag-deep-work',
      routineId: 'routine-test',
      presetId: 'preset-test',
    },
    dailyStats: {
      date: today,
      focusMinutes: 90,
      movementBreaks: 1,
      skippedReminders: 0,
      flowSafeReturns: 1,
      points: 20,
      badgesEarned: [],
    },
  };
  const ended = endSession(state);

  assert.equal(ended.activeSession.currentState, 'session-complete');
  assert.equal(ended.sessionHistory.length, 1);
  assert.equal(ended.lastSessionSummary.totalFocusMinutes, 90);
  assert.equal(ended.lastSessionSummary.breaksCompleted, 1);
  assert.equal(ended.lastSessionSummary.tagId, 'tag-deep-work');
  assert.equal(ended.lastSessionSummary.routineId, 'routine-test');
  assert.equal(ended.lastSessionSummary.presetId, 'preset-test');
  assert.ok(ended.badges.includes('first-stand'));
  assert.ok(ended.badges.includes('deep-work-defender'));
});

await withMockedNow(7_000_000, () => {
  const state = {
    ...startFocusSession(makeState()),
    activeSession: {
      ...startFocusSession(makeState()).activeSession,
      currentState: 'movement-nudge',
      accumulatedFocusSeconds: 0,
      focusMinutesCredited: 45,
    },
    dailyStats: {
      date: today,
      focusMinutes: 562,
      movementBreaks: 0,
      skippedReminders: 0,
      flowSafeReturns: 0,
      points: 0,
      badgesEarned: [],
    },
  };
  const ended = endSession(state);

  assert.equal(ended.lastSessionSummary.totalFocusMinutes, 45);
  assert.equal(ended.dailyStats.focusMinutes, 562);
});

await rm(tempDir, { recursive: true, force: true });
console.log('stateMachine tests passed');
