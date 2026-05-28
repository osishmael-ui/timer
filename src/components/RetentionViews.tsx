import React from 'react';
import { BADGES } from '../types';
import type { AppState, FocusGoal, GoalMetric, GoalPeriod, SessionTag, ThemeOption, TimerPreset, TimerRoutine, UserSettings } from '../types';

type RetentionViewProps = {
  state: AppState;
  settings: UserSettings;
  onSetActiveTag: (tagId: string | null) => void;
  onUpdateSessionTag: (sessionId: string, tagId: string | null) => void;
  onSaveTag: (tag: SessionTag) => void;
  onSaveGoal: (goal: FocusGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onResetGoal: (goalId: string) => void;
  onSaveRoutine: (routine: TimerRoutine) => void;
  onStartRoutine: (routineId: string) => void;
  onDeleteRoutine: (routineId: string) => void;
  onSavePreset: (preset: TimerPreset) => void;
  onStartPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  onSaveSettings: (settings: UserSettings) => Promise<boolean> | boolean;
  onExportData: () => void;
  onImportData: (file: File) => void;
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const formatDateTime = (timestamp: number) => new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(timestamp));

const tagTone = (color: string) => {
  if (color === 'lime') return 'bg-lime-50 text-lime-700 ring-lime-100';
  if (color === 'lavender') return 'bg-violet-50 text-violet-600 ring-violet-100';
  if (color === 'coral') return 'bg-orange-50 text-coral-500 ring-orange-100';
  if (color === 'slate') return 'bg-slate-100 text-charcoal/70 ring-slate-200';
  return 'bg-sky-50 text-sky-600 ring-sky-100';
};

const getTag = (tags: SessionTag[], tagId?: string | null) => tags.find((tag) => tag.id === tagId) ?? null;

const weekStart = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day + 1);
  return copy;
};

const dateKey = (date: Date) => date.toISOString().split('T')[0];

const getWeeklySummary = (state: AppState) => {
  const today = new Date(`${state.dailyStats.date}T00:00:00`);
  const start = weekStart(today);
  const previousStart = new Date(start);
  previousStart.setDate(start.getDate() - 7);
  const currentKeys = new Set(Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return dateKey(day);
  }));
  const previousKeys = new Set(Array.from({ length: 7 }, (_, index) => {
    const day = new Date(previousStart);
    day.setDate(previousStart.getDate() + index);
    return dateKey(day);
  }));
  const totalsByDay = new Map<string, { focus: number; sessions: number }>();

  state.sessionHistory.forEach((session) => {
    const existing = totalsByDay.get(session.date) ?? { focus: 0, sessions: 0 };
    totalsByDay.set(session.date, {
      focus: existing.focus + session.totalFocusMinutes,
      sessions: existing.sessions + 1,
    });
  });

  const todayExisting = totalsByDay.get(state.dailyStats.date) ?? { focus: 0, sessions: 0 };
  totalsByDay.set(state.dailyStats.date, {
    focus: Math.max(todayExisting.focus, state.dailyStats.focusMinutes),
    sessions: Math.max(todayExisting.sessions, todayExisting.sessions || (state.dailyStats.focusMinutes > 0 ? 1 : 0)),
  });

  const currentDays = [...currentKeys].map((key) => ({ date: key, ...(totalsByDay.get(key) ?? { focus: 0, sessions: 0 }) }));
  const previousFocus = [...previousKeys].reduce((sum, key) => sum + (totalsByDay.get(key)?.focus ?? 0), 0);
  const totalFocus = currentDays.reduce((sum, day) => sum + day.focus, 0);
  const completedSessions = currentDays.reduce((sum, day) => sum + day.sessions, 0);
  const bestDay = currentDays.reduce((best, day) => day.focus > best.focus ? day : best, currentDays[0] ?? { date: state.dailyStats.date, focus: 0, sessions: 0 });
  const context = previousFocus === 0
    ? 'First tracked week in this browser.'
    : totalFocus >= previousFocus
      ? `${formatMinutes(totalFocus - previousFocus)} more focus than last week.`
      : `${formatMinutes(previousFocus - totalFocus)} under last week, with room to recover.`;

  return { totalFocus, completedSessions, bestDay, context };
};

const getGoalProgress = (goal: FocusGoal, state: AppState) => {
  if (goal.status === 'completed') return goal.target;
  if (goal.metric === 'streakDays') return state.currentStreak;

  const summary = getWeeklySummary(state);
  if (goal.metric === 'focusMinutes') return goal.period === 'daily' ? state.dailyStats.focusMinutes : summary.totalFocus;
  if (goal.metric === 'movementBreaks') return goal.period === 'daily' ? state.dailyStats.movementBreaks : state.sessionHistory.reduce((sum, session) => sum + session.breaksCompleted, state.dailyStats.movementBreaks);
  return goal.period === 'daily'
    ? state.sessionHistory.filter((session) => session.date === state.dailyStats.date).length
    : summary.completedSessions;
};

const metricLabel: Record<GoalMetric, string> = {
  focusMinutes: 'Focus minutes',
  sessionCount: 'Sessions',
  streakDays: 'Streak days',
  movementBreaks: 'Movement resets',
};

const periodLabel: Record<GoalPeriod, string> = {
  daily: 'daily',
  weekly: 'weekly',
  open: 'open',
};

export const HistoryView: React.FC<Pick<RetentionViewProps, 'state' | 'onUpdateSessionTag'>> = ({ state, onUpdateSessionTag }) => {
  const summary = getWeeklySummary(state);
  const recent = state.sessionHistory;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="panel-card p-5 md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">History</p>
        <h2 className="mt-1 text-3xl font-black text-navy">Completed sessions</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-charcoal/58">
          Local session history shows what you completed, when it happened, and how it was tagged. This data stays in this browser unless you export it.
        </p>

        {recent.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-white/65 p-8 text-center">
            <h3 className="text-lg font-black text-navy">No completed sessions yet.</h3>
            <p className="mt-2 text-sm font-semibold text-charcoal/55">Once you end a timer session, its time, status, returns, and tag will appear here.</p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-200/80 overflow-hidden rounded-3xl bg-white/75 ring-1 ring-slate-200">
            {recent.map((session) => {
              const tag = getTag(state.tags, session.tagId);
              return (
                <article key={session.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_170px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-navy">{formatMinutes(session.totalFocusMinutes)} focus</h3>
                      <span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-black text-lime-700 ring-1 ring-lime-100">{session.status}</span>
                      {tag && <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${tagTone(tag.color)}`}>{tag.name}</span>}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-charcoal/55">
                      {formatDateTime(session.startedAt)} · {session.durationMinutes} min session · {session.breaksCompleted} resets · {session.flowSafeReturns} returns
                    </p>
                  </div>
                  <select
                    value={session.tagId ?? ''}
                    onChange={(event) => onUpdateSessionTag(session.id, event.target.value || null)}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-charcoal"
                    aria-label="Session tag"
                  >
                    <option value="">No tag</option>
                    {state.tags.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Weekly Summary</p>
          <h3 className="mt-1 text-xl font-black text-navy">{formatMinutes(summary.totalFocus)} this week</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-sky-50 p-3"><div className="text-2xl font-black text-sky-500">{summary.completedSessions}</div><div className="text-xs font-bold text-charcoal/50">sessions</div></div>
            <div className="rounded-2xl bg-lime-50 p-3"><div className="text-2xl font-black text-lime-700">{state.currentStreak}</div><div className="text-xs font-bold text-charcoal/50">day streak</div></div>
          </div>
          <p className="mt-4 text-sm font-semibold text-charcoal/58">Best day: {summary.bestDay?.focus ? `${summary.bestDay.date}, ${formatMinutes(summary.bestDay.focus)}` : 'No focus day yet'}.</p>
          <p className="mt-2 text-sm font-semibold text-charcoal/58">{summary.context}</p>
        </div>
      </aside>
    </div>
  );
};

export const GoalsView: React.FC<Pick<RetentionViewProps, 'state' | 'onSaveGoal' | 'onDeleteGoal' | 'onResetGoal'>> = ({ state, onSaveGoal, onDeleteGoal, onResetGoal }) => {
  const [draft, setDraft] = React.useState({ title: 'Three focus sessions', metric: 'sessionCount' as GoalMetric, target: 3, period: 'weekly' as GoalPeriod });
  const [editingId, setEditingId] = React.useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="panel-card p-5 md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Goals</p>
        <h2 className="mt-1 text-3xl font-black text-navy">Targets you can recover from.</h2>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/58">Goals are positive markers, not punishments. Complete, reset, or delete them whenever they stop fitting the week.</p>
        <div className="mt-6 grid gap-3">
          {state.goals.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/65 p-8 text-center">
              <h3 className="text-lg font-black text-navy">No goals yet.</h3>
              <p className="mt-2 text-sm font-semibold text-charcoal/55">Create a focus, session, streak, or movement goal and progress will fill in automatically.</p>
            </div>
          )}
          {state.goals.map((goal) => {
            const progress = getGoalProgress(goal, state);
            const percent = Math.min(100, Math.round((progress / goal.target) * 100));
            return (
              <article key={goal.id} className="rounded-3xl bg-white/75 p-4 ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-navy">{goal.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-charcoal/55">{metricLabel[goal.metric]} · {periodLabel[goal.period]} · {goal.status}</p>
                  </div>
                  <div className="text-left sm:text-right"><div className="text-2xl font-black text-sky-500">{Math.min(progress, goal.target)}/{goal.target}</div><div className="text-xs font-bold text-charcoal/45">{percent}%</div></div>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-lime-400" style={{ width: `${percent}%` }} /></div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => onSaveGoal({ ...goal, status: 'completed', completedAt: Date.now() })} className="min-h-10 rounded-full bg-lime-500 px-4 text-sm font-black text-white">Complete</button>
                  <button onClick={() => { setEditingId(goal.id); setDraft({ title: goal.title, metric: goal.metric, target: goal.target, period: goal.period }); }} className="min-h-10 rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100">Edit</button>
                  <button onClick={() => onResetGoal(goal.id)} className="min-h-10 rounded-full bg-slate-100 px-4 text-sm font-black text-charcoal">Reset</button>
                  <button onClick={() => onDeleteGoal(goal.id)} className="min-h-10 rounded-full bg-coral-500/10 px-4 text-sm font-black text-coral-500">Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="panel-card p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">New Goal</p>
        <div className="mt-4 space-y-3">
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-charcoal" />
          <select value={draft.metric} onChange={(event) => setDraft({ ...draft, metric: event.target.value as GoalMetric })} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-charcoal">
            {Object.entries(metricLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min="1" value={draft.target} onChange={(event) => setDraft({ ...draft, target: Math.max(1, Number(event.target.value)) })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-charcoal" />
            <select value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value as GoalPeriod })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-charcoal">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="open">Open</option>
            </select>
          </div>
          <button onClick={() => {
            const existing = editingId ? state.goals.find((goal) => goal.id === editingId) : null;
            onSaveGoal({ id: editingId ?? uid('goal'), ...draft, status: existing?.status ?? 'active', createdAt: existing?.createdAt ?? Date.now(), completedAt: existing?.completedAt ?? null });
            setEditingId(null);
          }} className="min-h-11 w-full rounded-full bg-sky-500 px-4 text-sm font-black text-white">{editingId ? 'Update Goal' : 'Save Goal'}</button>
        </div>
      </aside>
    </div>
  );
};

export const RoutinesView: React.FC<Pick<RetentionViewProps, 'state' | 'onSaveRoutine' | 'onStartRoutine' | 'onDeleteRoutine'>> = ({ state, onSaveRoutine, onStartRoutine, onDeleteRoutine }) => {
  const [draft, setDraft] = React.useState({ name: 'Writing opener', description: 'One focused writing block.', focus: 45, break: 3, tagId: '' });
  const [editingId, setEditingId] = React.useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="panel-card p-5 md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Routines</p>
        <h2 className="mt-1 text-3xl font-black text-navy">Saved timer sequences</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {state.routines.map((routine) => (
            <article key={routine.id} className="rounded-3xl bg-white/75 p-4 ring-1 ring-slate-200">
              <h3 className="text-lg font-black text-navy">{routine.name}</h3>
              <p className="mt-2 min-h-10 text-sm font-semibold text-charcoal/58">{routine.description || 'A saved routine for repeated focus setups.'}</p>
              <div className="mt-4 space-y-2">
                {routine.steps.map((step) => {
                  const tag = getTag(state.tags, step.tagId);
                  return <div key={step.id} className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-charcoal/65">{step.label}: {step.focusIntervalMinutes}m focus, {step.breakDurationMinutes}m break{tag ? ` · ${tag.name}` : ''}</div>;
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => onStartRoutine(routine.id)} className="min-h-10 rounded-full bg-sky-500 px-4 text-sm font-black text-white">Start</button>
                <button onClick={() => {
                  const firstStep = routine.steps[0];
                  setEditingId(routine.id);
                  setDraft({ name: routine.name, description: routine.description, focus: firstStep?.focusIntervalMinutes ?? 45, break: firstStep?.breakDurationMinutes ?? 3, tagId: firstStep?.tagId ?? '' });
                }} className="min-h-10 rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100">Edit</button>
                <button onClick={() => onDeleteRoutine(routine.id)} className="min-h-10 rounded-full bg-coral-500/10 px-4 text-sm font-black text-coral-500">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="panel-card p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">New Routine</p>
        <div className="mt-4 space-y-3">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" />
          <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min="5" value={draft.focus} onChange={(event) => setDraft({ ...draft, focus: Number(event.target.value) })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" />
            <input type="number" min="1" value={draft.break} onChange={(event) => setDraft({ ...draft, break: Number(event.target.value) })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" />
          </div>
          <select value={draft.tagId} onChange={(event) => setDraft({ ...draft, tagId: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">
            <option value="">No default tag</option>
            {state.tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </select>
          <button onClick={() => {
            const existing = editingId ? state.routines.find((routine) => routine.id === editingId) : null;
            onSaveRoutine({ id: editingId ?? uid('routine'), name: draft.name, description: draft.description, createdAt: existing?.createdAt ?? Date.now(), lastStartedAt: existing?.lastStartedAt ?? null, steps: [{ id: existing?.steps[0]?.id ?? uid('step'), label: 'Focus block', focusIntervalMinutes: draft.focus, breakDurationMinutes: draft.break, tagId: draft.tagId || null }] });
            setEditingId(null);
          }} className="min-h-11 w-full rounded-full bg-sky-500 px-4 text-sm font-black text-white">{editingId ? 'Update Routine' : 'Save Routine'}</button>
        </div>
      </aside>
    </div>
  );
};

export const RewardsView: React.FC<Pick<RetentionViewProps, 'state'>> = ({ state }) => {
  const totalBreaks = state.sessionHistory.reduce((sum, session) => sum + session.breaksCompleted, state.dailyStats.movementBreaks);
  const progressFor = (badgeId: string) => {
    if (state.badges.includes(badgeId)) return 100;
    if (badgeId === 'chair-defeated') return Math.min(100, Math.round((state.totalPoints / 500) * 100));
    if (badgeId === 'tiny-reset-pro') return Math.min(100, Math.round((totalBreaks / 20) * 100));
    if (badgeId === 'back-before-drift') return Math.min(100, Math.round((state.dailyStats.flowSafeReturns / 5) * 100));
    if (badgeId === 'five-day-streak') return Math.min(100, Math.round((state.currentStreak / 5) * 100));
    return 0;
  };

  return (
    <section className="panel-card p-5 md:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Rewards</p>
      <h2 className="mt-1 text-3xl font-black text-navy">Consistency collection</h2>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/58">Rewards unlock from sustainable behaviors: returning from breaks, taking short resets, and showing up across days.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {BADGES.map((badge) => {
          const earned = state.badges.includes(badge.id);
          const progress = progressFor(badge.id);
          return (
            <article key={badge.id} className={`rounded-3xl p-4 ring-1 ${earned ? 'bg-white ring-sky-100 shadow-sm' : 'bg-slate-50/80 ring-slate-200'}`}>
              <div className={`grid h-14 w-14 place-items-center rounded-2xl text-2xl ${earned ? 'bg-sky-50' : 'bg-slate-200 grayscale'}`}>{badge.icon}</div>
              <h3 className="mt-4 text-lg font-black text-navy">{badge.name}</h3>
              <p className="mt-2 min-h-12 text-sm font-semibold text-charcoal/58">{badge.description}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-lime-400" style={{ width: `${progress}%` }} /></div>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-charcoal/45">{earned ? 'Earned' : `${progress}% unlocked`}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export const RetentionSettingsView: React.FC<Pick<RetentionViewProps, 'state' | 'settings' | 'onSetActiveTag' | 'onSaveTag' | 'onSavePreset' | 'onStartPreset' | 'onDeletePreset' | 'onSaveSettings' | 'onExportData' | 'onImportData'>> = ({ state, settings, onSetActiveTag, onSaveTag, onSavePreset, onStartPreset, onDeletePreset, onSaveSettings, onExportData, onImportData }) => {
  const [preset, setPreset] = React.useState({ name: 'Design block', focus: settings.focusIntervalMinutes, break: settings.breakDurationMinutes, drift: settings.driftThresholdMinutes, tagId: state.activeSession.tagId ?? '' });
  const [editingPresetId, setEditingPresetId] = React.useState<string | null>(null);
  const [tagName, setTagName] = React.useState('');
  const [localSettings, setLocalSettings] = React.useState(settings);

  const saveTheme = async (theme: ThemeOption) => {
    const next = { ...localSettings, theme };
    setLocalSettings(next);
    await onSaveSettings(next);
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-6">
        <div className="panel-card p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Presets</p>
          <h2 className="mt-1 text-3xl font-black text-navy">Custom timer setups</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {state.presets.map((item) => {
              const tag = getTag(state.tags, item.tagId);
              return (
                <article key={item.id} className="rounded-3xl bg-white/75 p-4 ring-1 ring-slate-200">
                  <h3 className="text-lg font-black text-navy">{item.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-charcoal/58">{item.focusIntervalMinutes}m focus · {item.breakDurationMinutes}m break · {item.driftThresholdMinutes}m drift</p>
                  {tag && <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${tagTone(tag.color)}`}>{tag.name}</span>}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => onStartPreset(item.id)} className="min-h-10 rounded-full bg-sky-500 px-4 text-sm font-black text-white">Start</button>
                    <button onClick={() => {
                      setEditingPresetId(item.id);
                      setPreset({ name: item.name, focus: item.focusIntervalMinutes, break: item.breakDurationMinutes, drift: item.driftThresholdMinutes, tagId: item.tagId ?? '' });
                    }} className="min-h-10 rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100">Edit</button>
                    <button onClick={() => onDeletePreset(item.id)} className="min-h-10 rounded-full bg-coral-500/10 px-4 text-sm font-black text-coral-500">Delete</button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="panel-card p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Themes</p>
          <h3 className="mt-1 text-xl font-black text-navy">Choose a free visual mood</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {(['morning', 'garden', 'dusk', 'mono'] as ThemeOption[]).map((theme) => (
              <button key={theme} onClick={() => void saveTheme(theme)} className={`min-h-16 rounded-2xl px-3 text-sm font-black capitalize ring-2 ${settings.theme === theme ? 'ring-sky-500' : 'ring-transparent'} theme-swatch-${theme}`}>
                {theme}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-card p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Gentle Reminders</p>
          <h3 className="mt-1 text-xl font-black text-navy">Easy to turn off</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-[120px_1fr]">
            <button onClick={() => setLocalSettings({ ...localSettings, gentleReminders: { ...localSettings.gentleReminders, enabled: !localSettings.gentleReminders.enabled } })} className={`min-h-11 rounded-full px-4 text-sm font-black ${localSettings.gentleReminders.enabled ? 'bg-lime-500 text-white' : 'bg-slate-100 text-charcoal'}`}>{localSettings.gentleReminders.enabled ? 'Enabled' : 'Disabled'}</button>
            <input type="time" value={localSettings.gentleReminders.checkInHour} onChange={(event) => setLocalSettings({ ...localSettings, gentleReminders: { ...localSettings.gentleReminders, checkInHour: event.target.value } })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, index) => {
              const active = localSettings.gentleReminders.days.includes(index);
              return (
                <button
                  key={label}
                  onClick={() => setLocalSettings({
                    ...localSettings,
                    gentleReminders: {
                      ...localSettings.gentleReminders,
                      days: active
                        ? localSettings.gentleReminders.days.filter((day) => day !== index)
                        : [...localSettings.gentleReminders.days, index].sort(),
                    },
                  })}
                  className={`min-h-10 rounded-full px-2 text-xs font-black ${active ? 'bg-sky-500 text-white' : 'bg-slate-100 text-charcoal/60'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <textarea value={localSettings.gentleReminders.message} onChange={(event) => setLocalSettings({ ...localSettings, gentleReminders: { ...localSettings.gentleReminders, message: event.target.value } })} className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" />
          <button onClick={() => void onSaveSettings(localSettings)} className="mt-3 min-h-11 rounded-full bg-sky-500 px-4 text-sm font-black text-white">Save Reminders</button>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Active Tag</p>
          <select value={state.activeSession.tagId ?? ''} onChange={(event) => onSetActiveTag(event.target.value || null)} className="mt-4 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">
            <option value="">No tag</option>
            {state.tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </select>
          <div className="mt-3 flex gap-2">
            <input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="New tag" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" />
            <button onClick={() => { if (tagName.trim()) { onSaveTag({ id: uid('tag'), name: tagName.trim(), color: 'sky' }); setTagName(''); } }} className="min-h-11 rounded-full bg-slate-100 px-4 text-sm font-black text-charcoal">Add</button>
          </div>
        </div>

        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">New Preset</p>
          <div className="mt-4 space-y-3">
            <input value={preset.name} onChange={(event) => setPreset({ ...preset, name: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min="5" value={preset.focus} onChange={(event) => setPreset({ ...preset, focus: Number(event.target.value) })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold" />
              <input type="number" min="1" value={preset.break} onChange={(event) => setPreset({ ...preset, break: Number(event.target.value) })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold" />
              <input type="number" min="3" value={preset.drift} onChange={(event) => setPreset({ ...preset, drift: Number(event.target.value) })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold" />
            </div>
            <select value={preset.tagId} onChange={(event) => setPreset({ ...preset, tagId: event.target.value })} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">
              <option value="">No tag</option>
              {state.tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
            </select>
            <button onClick={() => {
              const existing = editingPresetId ? state.presets.find((item) => item.id === editingPresetId) : null;
              onSavePreset({ id: editingPresetId ?? uid('preset'), name: preset.name, focusIntervalMinutes: preset.focus, breakDurationMinutes: preset.break, driftThresholdMinutes: preset.drift, tagId: preset.tagId || null, createdAt: existing?.createdAt ?? Date.now() });
              setEditingPresetId(null);
            }} className="min-h-11 w-full rounded-full bg-sky-500 px-4 text-sm font-black text-white">{editingPresetId ? 'Update Preset' : 'Save Preset'}</button>
          </div>
        </div>

        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Local Backup</p>
          <p className="mt-2 text-sm font-semibold text-charcoal/58">Export or restore local history, rewards, goals, routines, presets, tags, and settings.</p>
          <button onClick={onExportData} className="mt-4 min-h-11 w-full rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100">Export Data</button>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-black text-charcoal">
            Import Data
            <input type="file" accept="application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImportData(file); event.currentTarget.value = ''; }} />
          </label>
        </div>
      </aside>
    </div>
  );
};
