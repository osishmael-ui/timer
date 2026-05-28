import type {
  Chronotype,
  CognitiveLoad,
  DailyPlan,
  DailyPlanBlock,
  DailySetupInput,
  DeepWorkTarget,
  FixedCommitment,
  MovementPreference,
  SleepQuality,
  WorkType,
} from '../types';

type TimeWindow = {
  start: number;
  end: number;
};

const DEFAULT_WORKDAY_START = 9 * 60;
const DEFAULT_WORKDAY_END = 17 * 60;

const targetMinutes: Record<DeepWorkTarget, number> = {
  '30': 30,
  '60': 60,
  '90': 90,
  '120': 120,
  '180': 180,
};

const workLabels: Record<WorkType, string> = {
  coding: 'Deep coding / building',
  writingStrategy: 'Writing / strategy',
  meetings: 'Meetings / calls',
  admin: 'Admin / shallow work',
  mixed: 'Mixed day',
};

export const defaultDailySetupInput: DailySetupInput = {
  chronotype: '',
  sleepQuality: 'okay',
  energyLevel: 3,
  cognitiveLoad: 'normal',
  workType: 'mixed',
  workdayLength: '8',
  workdayStartTime: '09:00',
  workdayEndTime: '17:00',
  fixedCommitments: [],
  deepWorkTarget: '90',
  movementPreference: 'normal',
};

export const validateDailySetup = (input: DailySetupInput): string[] => {
  const errors = validateCommitments(input.fixedCommitments);
  const workday = getWorkdayWindow(input);

  if (!input.chronotype) {
    errors.unshift('Choose a chronotype to generate your plan.');
  }

  if (workday.end <= workday.start) {
    errors.push('Work end time must be after work start time.');
  }

  // Check for commitments outside the workday window
  input.fixedCommitments.forEach((commitment) => {
    const start = parseTime(commitment.startTime);
    const end = parseTime(commitment.endTime);
    if (end > workday.start && start < workday.end) {
      // Commitment overlaps with workday - this is fine
    } else if (end <= workday.start || start >= workday.end) {
      errors.push(`${commitment.title || 'Commitment'} is outside your planned work hours (${formatTime(workday.start)}-${formatTime(workday.end)}).`);
    }
  });

  return Array.from(new Set(errors));
};

export const validateCommitments = (commitments: FixedCommitment[]): string[] => {
  const errors: string[] = [];
  const normalized = commitments
    .map((commitment) => ({
      ...commitment,
      start: parseTime(commitment.startTime),
      end: parseTime(commitment.endTime),
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end || a.title.localeCompare(b.title));

  normalized.forEach((commitment) => {
    if (!commitment.title.trim()) {
      errors.push('Each commitment needs a title.');
    }
    if (commitment.end <= commitment.start) {
      errors.push(`${commitment.title || 'Commitment'} must end after it starts.`);
    }
  });

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index].start < normalized[index - 1].end) {
      errors.push(`${normalized[index - 1].title} overlaps with ${normalized[index].title}.`);
    }
  }

  return Array.from(new Set(errors));
};

export const generateDailyPlan = (input: DailySetupInput): DailyPlan => {
  const warnings = validateDailySetup(input);

  const workday = getWorkdayWindow(input);
  const fixedWindows = input.fixedCommitments
    .map((commitment) => ({
      id: commitment.id,
      title: commitment.title.trim() || 'Fixed commitment',
      start: Math.max(parseTime(commitment.startTime), workday.start),
      end: Math.min(parseTime(commitment.endTime), workday.end),
      energyCost: commitment.energyCost ?? 'medium',
    }))
    .filter((commitment) => commitment.end > commitment.start)
    .sort((a, b) => a.start - b.start || a.end - b.end || a.title.localeCompare(b.title));

  const availableWindows = subtractWindows([workday], fixedWindows);
  const effectiveChronotype: Chronotype = input.chronotype || 'balanced';
  const focusMinutes = chooseFocusMinutes(input.sleepQuality, input.energyLevel, input.cognitiveLoad, input.deepWorkTarget);
  const movementMinutes = chooseMovementMinutes(input.movementPreference, input.sleepQuality, input.energyLevel);
  const peakWindows = getPeakWindows(effectiveChronotype, workday);
  const target = targetMinutes[input.deepWorkTarget];

  // Rule 1: chronotype changes ranking, not availability. Fixed commitments are removed first.
  // Rule 2: low sleep/energy reduces block size before target minutes are considered.
  // Rule 3: heavy cognitive load lowers ambition and favors a backup block over many hard blocks.
  const mainWindow = findBestWindow(availableWindows, peakWindows, focusMinutes, input.workType);
  const mainDeepWorkBlock = mainWindow
    ? makeBlock('main-deep-work', 'Best deep-work block', mainWindow.start, mainWindow.start + focusMinutes, 'deepWork', `${workLabels[input.workType]} gets the cleanest runway here.`)
    : null;
  const firstMovementBreak = mainDeepWorkBlock
    ? makeMovementAfterBlock(mainDeepWorkBlock, fixedWindows, [], movementMinutes, input, workday, 1)
    : null;

  const afterMain = mainDeepWorkBlock
    ? subtractWindows(availableWindows, [toWindow(mainDeepWorkBlock), ...(firstMovementBreak ? [toWindow(firstMovementBreak)] : [])])
    : availableWindows;

  const backupMinutes = Math.max(25, Math.min(45, Math.floor(focusMinutes * 0.75)));
  const backupWindow = findBestWindow(afterMain, peakWindows, backupMinutes, input.workType);
  const backupDeepWorkBlock = backupWindow
    ? makeBlock('backup-deep-work', 'Fallback focus block', backupWindow.start, backupWindow.start + backupMinutes, 'backupDeepWork', 'Use this only if your primary focus block gets missed, interrupted, or cut short. Not required if you already completed your main deep work.')
    : null;
  const secondMovementBreak = backupDeepWorkBlock
    ? makeMovementAfterBlock(backupDeepWorkBlock, fixedWindows, [firstMovementBreak].filter((block): block is DailyPlanBlock => Boolean(block)), movementMinutes, input, workday, 2)
    : null;

  const afterBackup = backupDeepWorkBlock
    ? subtractWindows(afterMain, [toWindow(backupDeepWorkBlock), ...(secondMovementBreak ? [toWindow(secondMovementBreak)] : [])])
    : afterMain;
  const secondaryMinutes = Math.min(60, Math.max(45, Math.floor(focusMinutes * 0.75)));
  const secondaryWindow = shouldAddSecondaryFocus(input, workday, target, focusMinutes)
    ? findBestWindow(afterBackup, peakWindows, secondaryMinutes, input.workType)
    : null;
  const secondaryFocusBlock = secondaryWindow
    ? makeBlock('secondary-focus', 'Secondary focus block', secondaryWindow.start, secondaryWindow.start + secondaryMinutes, 'secondaryFocus', 'Optional: use this only if the day still has clean energy.')
    : null;
  const thirdMovementBreak = secondaryFocusBlock
    ? makeMovementAfterBlock(secondaryFocusBlock, fixedWindows, [firstMovementBreak, secondMovementBreak].filter((block): block is DailyPlanBlock => Boolean(block)), movementMinutes, input, workday, 3)
    : null;

  const deepBlocks = [mainDeepWorkBlock, backupDeepWorkBlock, secondaryFocusBlock].filter((block): block is DailyPlanBlock => Boolean(block));
  const movementAfterDeepWork = [firstMovementBreak, secondMovementBreak, thirdMovementBreak].filter((block): block is DailyPlanBlock => Boolean(block));

  const unavailableForAdmin = [
    ...fixedWindows,
    ...[...deepBlocks, ...movementAfterDeepWork].map((block) => ({
      start: parseTime((block as DailyPlanBlock).startTime),
      end: parseTime((block as DailyPlanBlock).endTime),
    })),
  ];
  const adminPlanBlocks = chooseAdminBlocks(subtractWindows([workday], unavailableForAdmin), input, movementMinutes, input.movementPreference);
  const adminBlocks = adminPlanBlocks.filter((block) => block.kind === 'admin');
  const movementBreaks = [...movementAfterDeepWork, ...adminPlanBlocks.filter((block) => block.kind === 'movement')];
  const recoverySuggestion = chooseRecoveryBlock(subtractWindows([workday], [...unavailableForAdmin, ...adminBlocks.map(toWindow)]), input, workday);
  const fixedBlocks = fixedWindows.map((commitment) =>
    makeBlock(`fixed-${commitment.id}`, commitment.title, commitment.start, commitment.end, 'fixed', `${commitment.energyCost} energy cost commitment.`),
  );

  const minimumWin = chooseMinimumWin(input, mainDeepWorkBlock, target);
  const explanation = explainPlan(input, effectiveChronotype, mainDeepWorkBlock, focusMinutes, warnings);
  const confidenceLevel = chooseConfidence(input, mainDeepWorkBlock, warnings);
  const blocks = [
    ...fixedBlocks,
    ...(mainDeepWorkBlock ? [mainDeepWorkBlock] : []),
    ...(backupDeepWorkBlock ? [backupDeepWorkBlock] : []),
    ...(secondaryFocusBlock ? [secondaryFocusBlock] : []),
    ...movementBreaks,
    ...adminBlocks,
    recoverySuggestion,
  ].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime) || priorityForKind(a.kind) - priorityForKind(b.kind));

  if (!mainDeepWorkBlock) {
    warnings.push('No clean deep-work window is available. The fallback plan protects a smaller minimum win.');
  }

  return {
    mainDeepWorkBlock,
    backupDeepWorkBlock,
    secondaryFocusBlock,
    movementBreaks,
    adminBlocks,
    recoverySuggestion,
    minimumWin,
    confidenceLevel,
    explanation,
    blocks,
    warnings: Array.from(new Set(warnings)),
  };
};

const shouldAddSecondaryFocus = (
  input: DailySetupInput,
  workday: TimeWindow,
  target: number,
  focusMinutes: number,
): boolean => {
  const workdayMinutes = workday.end - workday.start;
  return (
    workdayMinutes >= 10 * 60
    && target >= 120
    && focusMinutes >= 60
    && input.energyLevel >= 4
    && input.sleepQuality === 'great'
    && (input.cognitiveLoad === 'light' || input.cognitiveLoad === 'normal')
    && input.workType !== 'meetings'
    && input.workType !== 'admin'
  );
};

const chooseFocusMinutes = (
  sleepQuality: SleepQuality,
  energyLevel: number,
  cognitiveLoad: CognitiveLoad,
  deepWorkTarget: DeepWorkTarget,
): number => {
  if (sleepQuality === 'veryPoor') return Math.min(30, targetMinutes[deepWorkTarget]);
  if (sleepQuality === 'poor' || energyLevel <= 2 || cognitiveLoad === 'veryHeavy') return Math.min(45, targetMinutes[deepWorkTarget]);
  if (sleepQuality === 'great' && energyLevel >= 4 && cognitiveLoad !== 'heavy') return Math.min(90, targetMinutes[deepWorkTarget]);
  if (cognitiveLoad === 'heavy') return Math.min(50, targetMinutes[deepWorkTarget]);
  return Math.min(60, targetMinutes[deepWorkTarget]);
};

const chooseMovementMinutes = (preference: MovementPreference, sleepQuality: SleepQuality, energyLevel: number): number => {
  if (preference === 'minimal') return 2;
  if (preference === 'active') return 7;
  if (preference === 'gentle' || sleepQuality === 'poor' || energyLevel <= 2) return 3;
  return 5;
};

const makeMovementAfterBlock = (
  block: DailyPlanBlock,
  fixedWindows: TimeWindow[],
  existingBreaks: DailyPlanBlock[],
  movementMinutes: number,
  input: DailySetupInput,
  workday: TimeWindow,
  index: number,
): DailyPlanBlock | null => {
  const requestedStart = parseTime(block.endTime);
  const freeAfterBlock = subtractWindows([{ start: requestedStart, end: Math.min(workday.end, requestedStart + 30) }], [
    ...fixedWindows,
    ...existingBreaks.map(toWindow),
  ]).find((window) => window.end - window.start >= movementMinutes);

  if (!freeAfterBlock) return null;
  return makeBlock(
    `movement-${index}`,
    movementLabel(input.movementPreference),
    freeAfterBlock.start,
    freeAfterBlock.start + movementMinutes,
    'movement',
    movementNote(input.movementPreference),
  );
};

const getWorkdayWindow = (input: DailySetupInput): TimeWindow => {
  const parsedStart = parseTime(input.workdayStartTime);
  const parsedEnd = parseTime(input.workdayEndTime);
  const start = Number.isFinite(parsedStart) ? parsedStart : DEFAULT_WORKDAY_START;
  const end = Number.isFinite(parsedEnd) ? parsedEnd : DEFAULT_WORKDAY_END;
  return { start, end };
};

const getPeakWindows = (chronotype: Chronotype, workday: TimeWindow): TimeWindow[] => {
  const duration = Math.max(60, workday.end - workday.start);
  if (chronotype === 'early') return [{ start: workday.start, end: Math.min(workday.end, workday.start + Math.min(150, duration)) }];
  if (chronotype === 'late') return [{ start: Math.max(workday.start, workday.end - Math.min(180, duration)), end: workday.end }];

  const firstStart = Math.min(workday.end - 60, workday.start + Math.min(90, Math.floor(duration * 0.2)));
  const secondStart = Math.min(workday.end - 60, workday.start + Math.max(120, Math.floor(duration * 0.55)));
  return [
    { start: Math.max(workday.start, firstStart), end: Math.min(workday.end, firstStart + 120) },
    { start: Math.max(workday.start, secondStart), end: Math.min(workday.end, secondStart + 120) },
  ];
};

const findBestWindow = (
  windows: TimeWindow[],
  peakWindows: TimeWindow[],
  duration: number,
  workType: WorkType,
): TimeWindow | null => {
  const candidates = windows
    .filter((window) => window.end - window.start >= duration)
    .flatMap((window) => {
      const peakStarts = peakWindows
        .map((peak) => Math.max(window.start, peak.start))
        .filter((start) => start + duration <= window.end && peakWindows.some((peak) => overlapMinutes({ start, end: start + duration }, peak) >= duration / 2));
      const starts = peakStarts.length > 0 ? peakStarts : [window.start];
      return starts.map((start) => {
        const candidate = { start, end: window.end };
        const peakOverlap = Math.max(...peakWindows.map((peak) => overlapMinutes({ start, end: start + duration }, peak)), 0);
        const workTypeBias = workType === 'meetings' || workType === 'admin' ? 0 : 20;
        return {
          ...candidate,
          score: peakOverlap + workTypeBias - Math.abs(start - peakWindows[0].start) / 20,
        };
      });
    })
    .sort((a, b) => b.score - a.score || a.start - b.start || a.end - b.end);

  return candidates[0] ?? null;
};

const chooseAdminBlocks = (
  windows: TimeWindow[],
  input: DailySetupInput,
  movementMinutes: number,
  movementPreference: MovementPreference,
): DailyPlanBlock[] => {
  const workdayDuration = parseTime(input.workdayEndTime) - parseTime(input.workdayStartTime);
  const maxBlocks = workdayDuration >= 12 * 60 ? 8 : workdayDuration >= 10 * 60 ? 6 : 5;
  const preferredDuration = workdayDuration >= 10 * 60 ? 75 : 60;
  const blocks: DailyPlanBlock[] = [];
  let movementIndex = 4;

  windows
    .filter((window) => window.end - window.start >= 25)
    .forEach((window) => {
      let cursor = window.start;
      while (blocks.filter((block) => block.kind === 'admin').length < maxBlocks && window.end - cursor >= 25) {
        const remaining = window.end - cursor;
        const duration = Math.min(preferredDuration, remaining);
        const adminIndex = blocks.filter((block) => block.kind === 'admin').length;
        blocks.push(makeBlock(`admin-${adminIndex + 1}`, adminTitle(input.workType, adminIndex), cursor, cursor + duration, 'admin', adminNote(input.workType)));
        cursor += duration;
        if (window.end - cursor >= movementMinutes + 25) {
          blocks.push(makeBlock(
            `movement-${movementIndex}`,
            movementLabel(movementPreference),
            cursor,
            cursor + movementMinutes,
            'movement',
            movementNote(movementPreference),
          ));
          movementIndex += 1;
          cursor += movementMinutes;
        } else {
          cursor += 5;
        }
      }
    });

  return blocks;
};

const chooseRecoveryBlock = (windows: TimeWindow[], input: DailySetupInput, workday: TimeWindow): DailyPlanBlock => {
  const duration = input.cognitiveLoad === 'veryHeavy' || input.sleepQuality === 'veryPoor' ? 15 : 10;
  const preferred = windows.find((window) => window.end >= workday.end - 90 && window.end - window.start >= duration) ?? windows.find((window) => window.end - window.start >= duration);
  const start = preferred ? Math.max(preferred.start, preferred.end - duration) : workday.end - duration;
  return makeBlock('recovery', 'Recovery reset', start, start + duration, 'recovery', 'Close loops, write the next step, and let the day land.');
};

const chooseMinimumWin = (input: DailySetupInput, mainBlock: DailyPlanBlock | null, target: number): string => {
  if (!mainBlock) return 'Protect 15 minutes for one clear next action.';
  if (input.sleepQuality === 'veryPoor' || input.cognitiveLoad === 'veryHeavy') {
    return 'One focused block is enough to count today.';
  }
  return `${Math.min(target, parseTime(mainBlock.endTime) - parseTime(mainBlock.startTime))} minutes of protected work.`;
};

const explainPlan = (
  input: DailySetupInput,
  chronotype: Chronotype,
  mainBlock: DailyPlanBlock | null,
  focusMinutes: number,
  warnings: string[],
): string => {
  const chronoText = chronotype === 'late'
    ? 'Because you selected Late type, the plan avoids forcing the main block too early when a later window exists.'
    : chronotype === 'early'
      ? 'Because you selected Early type, the plan gives the morning first claim on deep work.'
      : 'Because your rhythm is balanced or unsure, the plan looks for mid-morning or early-afternoon focus.';

  const conditionText = input.sleepQuality === 'veryPoor'
    ? 'Very poor sleep means the plan keeps the win small and recovery-forward.'
    : input.sleepQuality === 'poor' || input.energyLevel <= 2
      ? 'Lower energy today means shorter focus blocks and more gentle resets.'
      : input.sleepQuality === 'great' && input.energyLevel >= 4
        ? `Your sleep and energy support a ${focusMinutes}-minute main block.`
        : `The main block is capped at ${focusMinutes} minutes to keep the day realistic.`;

  const workdayMinutes = Math.max(0, parseTime(input.workdayEndTime) - parseTime(input.workdayStartTime));
  const workdayHours = Math.round((workdayMinutes / 60) * 10) / 10;
  const workdayText = `The plan is built from ${input.workdayStartTime} to ${input.workdayEndTime} (${workdayHours} hours), so long freelancer days get more support and recovery structure instead of just more intensity.`;
  const secondaryText = shouldAddSecondaryFocus(input, getWorkdayWindow(input), targetMinutes[input.deepWorkTarget], focusMinutes)
    ? ' Because the day is long and your inputs are strong, an optional secondary focus block may appear after the true backup.'
    : '';
  const fallback = mainBlock ? '' : ' No open deep-work window was found, so the plan falls back to a minimum viable focus target.';
  const validation = warnings.length > 0 ? ' Fix the setup warnings to improve confidence.' : '';
  return `${chronoText} ${conditionText} ${workdayText}${secondaryText}${fallback}${validation}`;
};

const chooseConfidence = (input: DailySetupInput, mainBlock: DailyPlanBlock | null, warnings: string[]) => {
  if (!mainBlock || warnings.length > 0 || input.sleepQuality === 'veryPoor' || input.cognitiveLoad === 'veryHeavy') return 'Low';
  if (input.sleepQuality === 'poor' || input.energyLevel <= 2 || input.cognitiveLoad === 'heavy') return 'Medium';
  return 'High';
};

const subtractWindows = (baseWindows: TimeWindow[], blockedWindows: TimeWindow[]): TimeWindow[] => {
  let free = [...baseWindows];
  blockedWindows
    .filter((window) => window.end > window.start)
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .forEach((blocked) => {
      const next: TimeWindow[] = [];
      free.forEach((window) => {
        if (blocked.end <= window.start || blocked.start >= window.end) {
          next.push(window);
          return;
        }
        if (window.start < blocked.start) next.push({ start: window.start, end: blocked.start });
        if (blocked.end < window.end) next.push({ start: blocked.end, end: window.end });
      });
      free = next;
    });
  return free.filter((window) => window.end - window.start >= 2);
};

const overlapMinutes = (a: TimeWindow, b: TimeWindow): number => Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
const toWindow = (block: DailyPlanBlock): TimeWindow => ({ start: parseTime(block.startTime), end: parseTime(block.endTime) });
const priorityForKind = (kind: DailyPlanBlock['kind']): number => ['fixed', 'deepWork', 'backupDeepWork', 'secondaryFocus', 'movement', 'admin', 'recovery'].indexOf(kind);

export const parseTime = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatTime = (minutes: number): string => {
  const safe = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const hours = Math.floor(safe / 60).toString().padStart(2, '0');
  const mins = (safe % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

const makeBlock = (
  id: string,
  title: string,
  start: number,
  end: number,
  kind: DailyPlanBlock['kind'],
  note: string,
): DailyPlanBlock => ({
  id,
  title,
  startTime: formatTime(start),
  endTime: formatTime(end),
  kind,
  note,
});

const movementLabel = (preference: MovementPreference): string => {
  if (preference === 'active') return 'Active movement reset';
  if (preference === 'minimal') return 'Tiny posture reset';
  if (preference === 'gentle') return 'Gentle movement reset';
  return 'Movement reset';
};

const movementNote = (preference: MovementPreference): string => {
  if (preference === 'active') return 'A brisk reset is okay today; keep it bounded.';
  if (preference === 'minimal') return 'Small reset: stand, breathe, release the shoulders.';
  if (preference === 'gentle') return 'Gentle movement without breaking the thread.';
  return 'Short enough to protect focus, long enough to change posture.';
};

const adminTitle = (workType: WorkType, index: number): string => {
  if (workType === 'meetings') return index === 0 ? 'Meeting prep' : 'Meeting follow-up';
  if (workType === 'admin') return index === 0 ? 'Priority admin' : 'Operations cleanup';
  if (workType === 'writingStrategy') return index === 0 ? 'Review and synthesis' : 'Notes into next steps';
  if (workType === 'coding') return index === 0 ? 'Build support work' : 'Review and cleanup';
  return index === 0 ? 'Priority support work' : 'Useful support block';
};

const adminNote = (workType: WorkType): string => {
  if (workType === 'meetings') return 'Use this for agendas, notes, and follow-ups.';
  if (workType === 'admin') return 'Batch necessary replies, forms, and loose ends after the higher-focus work is protected.';
  if (workType === 'writingStrategy') return 'Use this for reading, outlining, or turning notes into next steps once the cleanest focus block is done.';
  if (workType === 'coding') return 'Use this for reviews, debugging notes, setup, and cleanup after the primary build block.';
  return 'Use this for replies, planning, and low-friction tasks after the day’s main focus has a protected slot.';
};
