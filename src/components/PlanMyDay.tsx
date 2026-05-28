import { useMemo, useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { ReactNode } from 'react';
import type {
  Chronotype,
  CognitiveLoad,
  DailyPlanBlock,
  DailySetupInput,
  DeepWorkTarget,
  EnergyCost,
  EnergyLevel,
  FixedCommitment,
  MovementPreference,
  SleepQuality,
  WorkdayLength,
  WorkType,
  DailyPlan,
  PlanStartReminder,
} from '../types';
import { defaultDailySetupInput, formatTime, generateDailyPlan, parseTime, validateCommitments, validateDailySetup } from '../utils/dailyPlanner';
import { ActionButton } from './ActionButton';
import {
  requestNotificationPermission,
  sendNotification,
  savePlanStartReminder,
  loadPlanStartReminder,
  clearPlanStartReminder,
  schedulePlanReminder,
} from '../storage/localStorage';

const chronotypeOptions: Array<{ value: Chronotype; title: string; description: string }> = [
  { value: 'early', title: 'Early type', description: 'Best focus earlier in the day. Energy drops later.' },
  { value: 'balanced', title: 'Balanced type', description: 'Focus can work across mid-morning and afternoon.' },
  { value: 'late', title: 'Late type', description: 'Stronger focus later in the day. Slower start.' },
  { value: 'unsure', title: 'Not sure', description: 'Use a balanced default and learn from behavior later.' },
];

const sleepOptions: Array<{ value: SleepQuality; label: string }> = [
  { value: 'great', label: 'Great' },
  { value: 'okay', label: 'Okay' },
  { value: 'poor', label: 'Poor' },
  { value: 'veryPoor', label: 'Very poor' },
];

const workdayLengthOptions: Array<{ value: WorkdayLength; label: string }> = [
  { value: '8', label: '8 hours' },
  { value: '10', label: '10 hours' },
  { value: '12', label: '12 hours' },
];

const loadOptions: Array<{ value: CognitiveLoad; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'veryHeavy', label: 'Very heavy' },
];

const workOptions: Array<{ value: WorkType; label: string }> = [
  { value: 'coding', label: 'Deep coding / building' },
  { value: 'writingStrategy', label: 'Writing / strategy' },
  { value: 'meetings', label: 'Meetings / calls' },
  { value: 'admin', label: 'Admin / shallow work' },
  { value: 'mixed', label: 'Mixed day' },
];

const targetOptions: Array<{ value: DeepWorkTarget; label: string }> = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '90', label: '90 minutes' },
  { value: '120', label: '2 hours' },
  { value: '180', label: '3+ hours' },
];

const movementOptions: Array<{ value: MovementPreference; label: string }> = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'normal', label: 'Normal' },
  { value: 'active', label: 'Active' },
  { value: 'minimal', label: 'Minimal interruptions' },
];

const energyCostOptions: EnergyCost[] = ['low', 'medium', 'high'];

const plannerSteps = [
  { label: 'Chronotype', accent: '#4DA6FF', soft: 'rgba(77, 166, 255, 0.12)' },
  { label: 'Condition', accent: '#2ED4A7', soft: 'rgba(46, 212, 167, 0.14)' },
  { label: 'Commitments', accent: '#FF7A5C', soft: 'rgba(255, 122, 92, 0.14)' },
  { label: 'Generate', accent: '#8A6CFF', soft: 'rgba(138, 108, 255, 0.14)' },
  { label: 'Review', accent: '#FFB562', soft: 'rgba(255, 181, 98, 0.16)' },
];

type PlannerStepTone = (typeof plannerSteps)[number];

const mealOptions: Array<Omit<FixedCommitment, 'id'>> = [
  { title: 'Breakfast', startTime: '08:00', endTime: '08:30', energyCost: 'low' },
  { title: 'Lunch', startTime: '12:30', endTime: '13:00', energyCost: 'low' },
  { title: 'Dinner', startTime: '18:30', endTime: '19:15', energyCost: 'low' },
];

interface PlanMyDayProps {
  onStartToday: (plan: DailyPlan) => void;
  onReturnToSession?: () => void;
  hasActiveSession?: boolean;
}

export const PlanMyDay = ({ onStartToday, onReturnToSession, hasActiveSession = false }: PlanMyDayProps) => {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<DailySetupInput>(() => defaultDailySetupInput);
  const [draftCommitment, setDraftCommitment] = useState<Omit<FixedCommitment, 'id'>>({
    title: '',
    startTime: '12:00',
    endTime: '12:30',
    energyCost: 'medium',
  });
  const [commitmentError, setCommitmentError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [hasPlanEdits, setHasPlanEdits] = useState(false);
  const [reminderPreference, setReminderPreference] = useState<'at-start' | '5min-before' | '10min-before' | 'none'>('none');
  const [notificationPermissionDenied, setNotificationPermissionDenied] = useState(false);

  // Load saved reminder preference on mount
  useEffect(() => {
    const saved = loadPlanStartReminder();
    if (saved && saved.remindAt !== 'none') {
      setReminderPreference(saved.remindAt);
    }
  }, []);

  const validationErrors = useMemo(() => validateDailySetup(input), [input]);

  const plan = useMemo(() => generateDailyPlan(input), [input]);

  const updateInput = <Key extends keyof DailySetupInput>(key: Key, value: DailySetupInput[Key]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setGenerated(false);
    setHasPlanEdits(true);
  };

  const setWorkdayPreset = (length: WorkdayLength) => {
    setInput((current) => ({
      ...current,
      workdayLength: length,
      workdayEndTime: formatTime(parseTime(current.workdayStartTime) + Number(length) * 60),
    }));
    setGenerated(false);
    setHasPlanEdits(true);
  };

  const addFixedCommitment = (commitment: Omit<FixedCommitment, 'id'>): boolean => {
    const title = commitment.title.trim();
    if (!title) {
      setCommitmentError('Add a title first.');
      return false;
    }

    const next = [
      ...input.fixedCommitments,
      {
        ...commitment,
        id: `commitment-${input.fixedCommitments.length + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title,
      },
    ];
    const errors = validateCommitments(next);
    if (errors.length > 0) {
      setCommitmentError(errors[0]);
      return false;
    }

    updateInput('fixedCommitments', next);
    setCommitmentError('');
    return true;
  };

  const addCommitment = () => {
    if (addFixedCommitment(draftCommitment)) {
      setDraftCommitment({ title: '', startTime: '12:00', endTime: '12:30', energyCost: 'medium' });
    }
  };

  const removeCommitment = (id: string) => {
    updateInput('fixedCommitments', input.fixedCommitments.filter((commitment) => commitment.id !== id));
  };

  const generatePlan = () => {
    if (validationErrors.length > 0) {
      setGenerated(false);
      return;
    }
    setGenerated(true);
    setStep(4);
  };

  const showLandscapeReview = generated && step === 4;
  const hasUnsavedSessionEdits = hasActiveSession && hasPlanEdits;
  const returnToSession = () => {
    if (!onReturnToSession) return;
    if (hasUnsavedSessionEdits && !confirm('You have unsaved plan changes. Return to the session without saving them?')) {
      return;
    }
    onReturnToSession();
  };

  // Calculate if plan starts later than now and determine reminder scheduled time
  const planStartTime = plan.mainDeepWorkBlock ? parseTime(plan.mainDeepWorkBlock.startTime) : null;
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const planStartsLater = planStartTime !== null && planStartTime > nowMinutes;

  const getReminderScheduledTime = (remindAt: 'at-start' | '5min-before' | '10min-before' | 'none'): number | null => {
    if (!planStartTime || remindAt === 'none') return null;
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0);
    let scheduledMinutes = planStartTime;
    if (remindAt === '5min-before') scheduledMinutes -= 5;
    if (remindAt === '10min-before') scheduledMinutes -= 10;
    const scheduledHours = Math.floor(scheduledMinutes / 60);
    const scheduledMins = scheduledMinutes % 60;
    targetDate.setHours(scheduledHours, scheduledMins, 0, 0);
    return targetDate.getTime();
  };

  const savePlanAndStart = (planToSave: DailyPlan) => {
    // Clear any existing reminder
    clearPlanStartReminder();

    // If plan starts later and user chose a reminder, set it up
    if (planStartsLater && reminderPreference !== 'none') {
      const scheduledTime = getReminderScheduledTime(reminderPreference);
      if (scheduledTime && scheduledTime > Date.now()) {
        const reminder: PlanStartReminder = {
          enabled: true,
          remindAt: reminderPreference,
          planStartTime: new Date().toISOString(),
          scheduledTime,
        };
        savePlanStartReminder(reminder);

        // Request notification permission if needed
        requestNotificationPermission().then((granted) => {
          if (!granted) {
            setNotificationPermissionDenied(true);
          } else {
            // Schedule the reminder
            schedulePlanReminder(reminder, () => {
              sendNotification("Time to start your focus block!", "Your planned deep-work session is ready to begin.");
              clearPlanStartReminder();
            });
          }
        });
      }
    }

    setHasPlanEdits(false);
    onStartToday(planToSave);
  };

  return (
    <section className="panel-card overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Plan My Day</p>
            <h2 className="mt-1 text-2xl font-black text-navy">Build today around your actual energy.</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 lg:gap-1.5">
              {plannerSteps.map((item, index) => {
                const active = step === index;
                return (
                  <button
                    key={item.label}
                    onClick={() => setStep(index)}
                    style={{
                      borderColor: active ? item.accent : 'rgba(226, 232, 240, 0.9)',
                      backgroundColor: active ? item.soft : 'rgba(255, 255, 255, 0.72)',
                      color: active ? item.accent : undefined,
                    }}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-black transition-all hover:-translate-y-0.5 hover:bg-white lg:min-h-8 lg:rounded-2xl lg:px-2.5 lg:text-[0.72rem] ${
                      active ? 'shadow-[0_12px_26px_rgba(15,30,51,0.08)]' : 'text-charcoal/52'
                    }`}
                  >
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.68rem]"
                      style={{
                        backgroundColor: active ? item.accent : item.soft,
                        color: active ? '#ffffff' : item.accent,
                      }}
                    >
                      {index + 1}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 p-5 md:p-6 ${showLandscapeReview ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_380px]'}`}>
        <div className="min-w-0">
          {step === 0 && (
            <StepPanel stepIndex={0} tone={plannerSteps[0]} title="Chronotype" subtitle="Pick the closest match. This is about timing, not identity.">
              <div className="grid gap-3 md:grid-cols-2">
                {chronotypeOptions.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    selected={input.chronotype === option.value}
                    title={option.title}
                    description={option.description}
                    onClick={() => updateInput('chronotype', option.value)}
                  />
                ))}
              </div>
              <StepActions onNext={() => setStep(1)} nextDisabled={!input.chronotype} />
            </StepPanel>
          )}

          {step === 1 && (
            <StepPanel stepIndex={1} tone={plannerSteps[1]} title="Today’s condition" subtitle="A quick read on how much intensity today can carry.">
              <FieldGroup label="When are you planning to work?" description="Use the real container for the day. Freelance days can start early and finish late; meals and commitments will carve unavailable time out of this window.">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr]">
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-charcoal/45">
                    Start
                    <input
                      type="time"
                      value={input.workdayStartTime}
                      onChange={(event) => updateInput('workdayStartTime', event.target.value)}
                      onInput={(event) => updateInput('workdayStartTime', event.currentTarget.value)}
                      className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-charcoal outline-none focus:border-sky-400"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-charcoal/45">
                    Finish
                    <input
                      type="time"
                      value={input.workdayEndTime}
                      onChange={(event) => updateInput('workdayEndTime', event.target.value)}
                      onInput={(event) => updateInput('workdayEndTime', event.currentTarget.value)}
                      className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-charcoal outline-none focus:border-sky-400"
                    />
                  </label>
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-charcoal/45">Quick span</p>
                    <Segmented options={workdayLengthOptions} value={input.workdayLength} onChange={setWorkdayPreset} />
                  </div>
                </div>
              </FieldGroup>
              <FieldGroup label="How was your sleep?" description="Great means you woke reasonably rested after enough sleep for you. Poor or very poor will shorten blocks and make the plan more recovery-forward.">
                <Segmented options={sleepOptions} value={input.sleepQuality} onChange={(value) => updateInput('sleepQuality', value)} />
              </FieldGroup>
              <FieldGroup label="How much energy do you have right now?" description="1 means barely functional, 3 means usable but ordinary, and 5 means unusually ready. The score changes block length and reset frequency.">
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateInput('energyLevel', level as EnergyLevel)}
                      className={`h-12 rounded-full text-sm font-black transition-colors ${
                        input.energyLevel === level ? 'bg-lime-500 text-white shadow-lg shadow-lime-500/20' : 'bg-white text-charcoal/65 ring-1 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </FieldGroup>
              <FieldGroup label="How mentally heavy is today?" description="Count emotional load, context switching, deadlines, and decision fatigue, not just calendar volume.">
                <Segmented options={loadOptions} value={input.cognitiveLoad} onChange={(value) => updateInput('cognitiveLoad', value)} />
              </FieldGroup>
              <FieldGroup label="What type of work matters most today?" description="Pick the work that would make the day successful. The planner gives that work the cleanest time and uses the rest of the day to support it.">
                <Segmented options={workOptions} value={input.workType} onChange={(value) => updateInput('workType', value)} />
              </FieldGroup>
              <StepActions onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel stepIndex={2} tone={plannerSteps[2]} title="Commitments" subtitle="Add anything that makes time unavailable: meetings, errands, commute, meals, appointments, school runs, gym.">
              <div>
                <p className="mb-2 text-sm font-black text-navy">Add a commitment</p>
                <p className="mb-3 max-w-2xl text-xs font-semibold leading-relaxed text-charcoal/55">
                  Use this for the real blockers in your day. Meals are just shortcuts below, not the whole point of this step.
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    addCommitment();
                  }}
                  className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2"
                >
                  <input
                    value={draftCommitment.title}
                    onChange={(event) => setDraftCommitment((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Meeting, commute, appointment..."
                    className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-sky-400"
                  />
                  <input
                    type="time"
                    value={draftCommitment.startTime}
                    onChange={(event) => setDraftCommitment((current) => ({ ...current, startTime: event.target.value }))}
                    className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-sky-400"
                  />
                  <input
                    type="time"
                    value={draftCommitment.endTime}
                    onChange={(event) => setDraftCommitment((current) => ({ ...current, endTime: event.target.value }))}
                    className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-sky-400"
                  />
                  <select
                    value={draftCommitment.energyCost}
                    onChange={(event) => setDraftCommitment((current) => ({ ...current, energyCost: event.target.value as EnergyCost }))}
                    className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-sky-400"
                  >
                    {energyCostOptions.map((option) => (
                      <option key={option} value={option}>{option} energy</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="min-h-12 rounded-full bg-[#FF7A5C] px-5 text-sm font-black text-white shadow-lg shadow-[#FF7A5C]/25 transition-colors hover:bg-[#E96547] md:col-span-2"
                  >
                    Add Commitment
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-navy">Optional meal shortcuts</p>
                    <p className="mt-1 text-xs font-semibold text-charcoal/55">Adds common meal blocks to the same commitment list.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 md:min-w-80">
                    {mealOptions.map((meal) => (
                      <button
                        key={meal.title}
                        onClick={() => addFixedCommitment(meal)}
                        className="min-h-10 rounded-full bg-slate-50 px-3 py-2 text-sm font-black text-charcoal/70 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
                      >
                        {meal.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {commitmentError && <p className="mt-2 text-sm font-semibold text-coral-600">{commitmentError}</p>}

              <div className="mt-4 space-y-2">
                <p className="text-sm font-black text-navy">Unavailable blocks</p>
                {input.fixedCommitments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm font-semibold text-charcoal/50">
                    No fixed blocks yet. That is a clean day.
                  </div>
                ) : (
                  input.fixedCommitments.map((commitment) => (
                    <div key={commitment.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                      <div className="min-w-0">
                        <p className="truncate font-black text-navy">{commitment.title}</p>
                        <p className="text-sm font-semibold text-charcoal/55">{commitment.startTime}-{commitment.endTime} · {commitment.energyCost} energy</p>
                      </div>
                      <button onClick={() => removeCommitment(commitment.id)} className="rounded-full px-3 py-2 text-sm font-black text-coral-600 hover:bg-coral-50">
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
              <StepActions onBack={() => setStep(1)} onNext={() => setStep(3)} />
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel stepIndex={3} tone={plannerSteps[3]} title="Generate plan" subtitle="Choose what would feel like a real but humane win.">
              <FieldGroup label="How much deep work would feel like a win today?">
                <Segmented options={targetOptions} value={input.deepWorkTarget} onChange={(value) => updateInput('deepWorkTarget', value)} />
              </FieldGroup>
              <FieldGroup label="How should movement breaks feel today?">
                <Segmented options={movementOptions} value={input.movementPreference} onChange={(value) => updateInput('movementPreference', value)} />
              </FieldGroup>
              {validationErrors.length > 0 && (
                <div className="rounded-2xl bg-coral-500/10 p-4 text-sm font-semibold text-coral-700">
                  {validationErrors.map((error) => <p key={error}>{error}</p>)}
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <ActionButton onClick={() => setStep(2)} variant="secondary" size="md">Back</ActionButton>
                <ActionButton onClick={generatePlan} disabled={validationErrors.length > 0} variant="primary" size="md" className="sm:flex-1">
                  Generate Plan
                </ActionButton>
              </div>
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel stepIndex={4} tone={plannerSteps[4]} title={hasActiveSession ? 'Review and save' : 'Review and start'} subtitle="Use the plan as a guide, not a verdict.">
              {generated ? (
                <PlanReview
                  plan={plan}
                  onStartToday={savePlanAndStart}
                  isEditing={hasActiveSession}
                  onCancel={hasActiveSession ? returnToSession : undefined}
                  planStartsLater={planStartsLater}
                  reminderPreference={reminderPreference}
                  setReminderPreference={setReminderPreference}
                  notificationPermissionDenied={notificationPermissionDenied}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5">
                  <p className="font-bold text-charcoal/60">
                    {hasActiveSession ? 'Regenerate the plan to review and save your session changes.' : 'Generate a plan to see your daily rhythm here.'}
                  </p>
                  <div className="mt-4">
                    <ActionButton onClick={() => setStep(3)} variant="primary" size="md">Go to Generate</ActionButton>
                  </div>
                </div>
              )}
            </StepPanel>
          )}
        </div>

        <div className={showLandscapeReview ? 'lg:hidden' : generated ? '' : 'hidden lg:block'}>
          <DailyPlanCard plan={plan} generated={generated} />
        </div>
      </div>
    </section>
  );
};

const StepPanel = ({
  stepIndex,
  tone,
  title,
  subtitle,
  children,
}: {
  stepIndex: number;
  tone: PlannerStepTone;
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <div
    className="relative overflow-hidden rounded-[1.75rem] border bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,30,51,0.06)] md:p-6"
    style={{
      borderColor: 'rgba(221, 232, 239, 0.9)',
      backgroundColor: tone.soft,
    }}
  >
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-lg"
        style={{ backgroundColor: tone.accent, boxShadow: `0 14px 30px ${tone.soft}` } as CSSProperties}
      >
        {stepIndex + 1}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: tone.accent }}>{tone.label}</p>
        <h3 className="mt-1 text-xl font-black text-navy">{title}</h3>
        <p className="mt-1 text-sm font-semibold text-charcoal/55">{subtitle}</p>
      </div>
    </div>
    <div className="mt-6 space-y-5">{children}</div>
  </div>
);

const ChoiceCard = ({ selected, title, description, onClick }: { selected: boolean; title: string; description: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`min-h-32 rounded-2xl p-4 text-left transition-all ${
      selected ? 'bg-sky-500 text-white shadow-xl shadow-sky-500/20' : 'bg-white text-charcoal ring-1 ring-slate-200 hover:-translate-y-0.5 hover:ring-sky-200'
    }`}
  >
    <p className="font-black">{title}</p>
    <p className={`mt-2 text-sm font-semibold leading-relaxed ${selected ? 'text-white/80' : 'text-charcoal/55'}`}>{description}</p>
  </button>
);

const FieldGroup = ({ label, description, children }: { label: string; description?: string; children: ReactNode }) => (
  <div>
    <p className="mb-2 text-sm font-black text-navy">{label}</p>
    {description && <p className="mb-3 max-w-2xl text-xs font-semibold leading-relaxed text-charcoal/55">{description}</p>}
    {children}
  </div>
);

const Segmented = <Value extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: Value; label: string }>;
  value: Value;
  onChange: (value: Value) => void;
}) => (
  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`min-h-11 rounded-full px-3 py-2 text-sm font-black transition-colors ${
          value === option.value ? 'bg-navy text-white shadow-lg shadow-slate-900/10' : 'bg-white text-charcoal/65 ring-1 ring-slate-200 hover:bg-slate-50'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const StepActions = ({ onBack, onNext, nextDisabled = false }: { onBack?: () => void; onNext: () => void; nextDisabled?: boolean }) => (
  <div className="flex flex-col gap-3 sm:flex-row">
    {onBack && <ActionButton onClick={onBack} variant="secondary" size="md">Back</ActionButton>}
    <ActionButton onClick={onNext} disabled={nextDisabled} variant="primary" size="md" className="sm:flex-1">
      Continue
    </ActionButton>
  </div>
);

const DailyPlanCard = ({ plan, generated }: { plan: ReturnType<typeof generateDailyPlan>; generated: boolean }) => {
  if (!generated) {
    return (
      <aside className="rounded-3xl border border-dashed border-slate-200 bg-white/55 p-5 lg:sticky lg:top-5 lg:self-start">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-charcoal/35">Daily Plan</p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-charcoal/50">
          Your generated rhythm will appear here after setup.
        </p>
      </aside>
    );
  }

  return (
  <aside className="rounded-3xl bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/20 lg:sticky lg:top-5 lg:self-start lg:p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Daily Plan</p>
        <h3 className="mt-2 text-2xl font-black">Today’s rhythm</h3>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-black ${confidenceClass(plan.confidenceLevel)}`}>
        {plan.confidenceLevel}
      </span>
    </div>

    <div className="mt-6 space-y-3 lg:mt-4 lg:space-y-2">
      {plan.blocks.map((block) => (
        <PlanBlockRow key={block.id} block={block} />
      ))}
    </div>
  </aside>
  );
};

const PlanReview = ({
  plan,
  onStartToday,
  isEditing,
  onCancel,
  planStartsLater,
  reminderPreference,
  setReminderPreference,
  notificationPermissionDenied,
}: {
  plan: ReturnType<typeof generateDailyPlan>;
  onStartToday: (plan: DailyPlan) => void;
  isEditing: boolean;
  onCancel?: () => void;
  planStartsLater: boolean;
  reminderPreference: 'at-start' | '5min-before' | '10min-before' | 'none';
  setReminderPreference: (value: 'at-start' | '5min-before' | '10min-before' | 'none') => void;
  notificationPermissionDenied: boolean;
}) => (
  <div className="space-y-4">
    {plan.warnings.length > 0 && (
      <div className="rounded-2xl bg-coral-500/10 p-4 text-sm font-semibold text-coral-700">
        {plan.warnings.map((warning) => <p key={warning}>{warning}</p>)}
      </div>
    )}
    <div className="grid gap-3 md:grid-cols-2">
      <SummaryTile label="Best block" value={formatBlock(plan.mainDeepWorkBlock)} />
      <SummaryTile label="Fallback (if needed)" value={formatBlock(plan.backupDeepWorkBlock)} />
      {plan.secondaryFocusBlock && <SummaryTile label="Optional focus" value={formatBlock(plan.secondaryFocusBlock)} />}
      <SummaryTile label="Minimum win" value={plan.minimumWin} />
      <SummaryTile label="Confidence" value={plan.confidenceLevel} />
    </div>
    <div className="rounded-2xl bg-sky-500/10 p-4">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-600">Why this plan?</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-charcoal/70">{plan.explanation}</p>
    </div>
    <LandscapeDailyPlan plan={plan} />

    {/* Gentle reminder option - only shown if plan starts later than now */}
    {planStartsLater && (
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
        <p className="text-sm font-black text-navy">Want a gentle reminder when it's time to start?</p>
        <p className="mt-1 text-xs font-semibold text-charcoal/55">Choose when you'd like to be notified about your planned focus block.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(['at-start', '5min-before', '10min-before', 'none'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setReminderPreference(option)}
              className={`min-h-11 rounded-full px-3 py-2 text-sm font-black transition-colors ${
                reminderPreference === option
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'bg-white text-charcoal/65 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {option === 'at-start' ? 'At start time' : option === '5min-before' ? '5 min before' : option === '10min-before' ? '10 min before' : 'No reminder'}
            </button>
          ))}
        </div>
        {notificationPermissionDenied && (
          <p className="mt-3 text-xs font-semibold text-charcoal/55">
            Notifications are disabled in your browser. You can still start manually from the plan when ready.
          </p>
        )}
      </div>
    )}

    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-black text-navy">{isEditing ? 'Save these changes?' : 'Ready to run it?'}</p>
        <p className="mt-1 text-xs font-semibold text-charcoal/55">
          {isEditing
            ? 'Update the active session plan and return to the session view.'
            : 'Move into the current session view and start the first focus block.'}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {isEditing && onCancel && (
          <ActionButton onClick={onCancel} variant="secondary" size="md" className="sm:min-w-32">
            Cancel
          </ActionButton>
        )}
        <ActionButton onClick={() => onStartToday(plan)} variant="primary" size="md" className="sm:min-w-40">
          {isEditing ? 'Save Changes' : 'Start Today'}
        </ActionButton>
      </div>
    </div>
  </div>
);

const LandscapeDailyPlan = ({ plan }: { plan: ReturnType<typeof generateDailyPlan> }) => {
  const blocks = plan.blocks;
  const summaryBlocks = [
    plan.mainDeepWorkBlock,
    plan.backupDeepWorkBlock,
    plan.secondaryFocusBlock,
    plan.recoverySuggestion,
  ].filter((block): block is DailyPlanBlock => Boolean(block));

  return (
    <div className="hidden rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-charcoal shadow-xl shadow-sky-100/70 lg:block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">Today’s Plan</p>
          <h4 className="mt-1 text-xl font-black text-navy">Today’s plan</h4>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${confidenceClass(plan.confidenceLevel)}`}>
          {plan.confidenceLevel}
        </span>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {summaryBlocks.map((block) => (
          <div key={`summary-${block.id}`} className="rounded-xl bg-white/85 p-3 ring-1 ring-sky-100">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-charcoal/45">{kindLabel(block.kind)}</p>
            <p className="mt-1 text-sm font-black leading-tight text-navy">{block.title}</p>
            <p className="mt-1 text-xs font-bold text-charcoal/55">{block.startTime}-{block.endTime}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 max-h-[42rem] space-y-2 overflow-y-auto rounded-2xl bg-white/85 p-3 pr-2 ring-1 ring-sky-100">
        {blocks.map((block) => (
          <div key={`plan-${block.id}`} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-[92px_minmax(0,1fr)_auto] md:items-center">
            <div className="text-sm font-black text-charcoal/55">
              <p>{block.startTime}</p>
              <p>{block.endTime}</p>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black text-navy">{block.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${kindClass(block.kind)}`}>
                  {kindLabel(block.kind)}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-charcoal/58">{block.note}</p>
            </div>
            <p className="text-xs font-black text-charcoal/45 md:text-right">
              {formatDuration(block)}
            </p>
          </div>
        ))}
        </div>
    </div>
  );
};

const SummaryTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-charcoal/40">{label}</p>
    <p className="mt-2 font-black text-navy">{value}</p>
  </div>
);

const PlanBlockRow = ({ block }: { block: DailyPlanBlock }) => (
  <div className="grid grid-cols-[74px_1fr] gap-3 rounded-2xl bg-white/7 p-3 ring-1 ring-white/10 lg:grid-cols-[58px_1fr] lg:gap-2 lg:rounded-xl lg:p-2.5">
    <div className="text-xs font-black text-white/55 lg:text-[11px] lg:leading-tight">
      <p>{block.startTime}</p>
      <p>{block.endTime}</p>
    </div>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-black text-white lg:text-sm lg:leading-tight">{block.title}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide lg:text-[9px] ${kindClass(block.kind)}`}>
          {kindLabel(block.kind)}
        </span>
      </div>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-white/58 lg:text-[11px] lg:leading-snug">{block.note}</p>
    </div>
  </div>
);

const formatBlock = (block: DailyPlanBlock | null): string => block ? `${block.startTime}-${block.endTime}` : 'Fallback only';

const kindLabel = (kind: DailyPlanBlock['kind']): string => {
  if (kind === 'admin') return 'support work';
  if (kind === 'deepWork') return 'deep work';
  if (kind === 'backupDeepWork') return 'fallback (if needed)';
  if (kind === 'secondaryFocus') return 'secondary focus';
  return kind.replace(/([A-Z])/g, ' $1');
};

const formatDuration = (block: DailyPlanBlock): string => {
  const minutes = Math.max(0, parseTime(block.endTime) - parseTime(block.startTime));
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

const confidenceClass = (confidence: string): string => {
  if (confidence === 'High') return 'bg-lime-400 text-slate-950';
  if (confidence === 'Medium') return 'bg-sky-300 text-slate-950';
  return 'bg-coral-300 text-slate-950';
};

const kindClass = (kind: DailyPlanBlock['kind']): string => {
  if (kind === 'deepWork') return 'bg-sky-300 text-slate-950';
  if (kind === 'backupDeepWork') return 'bg-lavender text-slate-950';
  if (kind === 'secondaryFocus') return 'bg-emerald-300 text-slate-950';
  if (kind === 'movement') return 'bg-lime-300 text-slate-950';
  if (kind === 'recovery') return 'bg-coral-300 text-slate-950';
  if (kind === 'fixed') return 'bg-white/15 text-white';
  return 'bg-white text-slate-950';
};
