import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './Popup';
import '../styles/index.css';

if (!globalThis.chrome?.storage?.local) {
  const storage = {
    get(keys: string[], callback?: (items: Record<string, unknown>) => void) {
      const result = keys.reduce<Record<string, unknown>>((items, key) => {
        const value = localStorage.getItem(key);
        items[key] = value ? JSON.parse(value) : undefined;
        return items;
      }, {});
      callback?.(result);
      return Promise.resolve(result);
    },
    set(values: Record<string, unknown>, callback?: () => void) {
      Object.entries(values).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      callback?.();
      return Promise.resolve();
    },
    clear(callback?: () => void) {
      localStorage.clear();
      callback?.();
      return Promise.resolve();
    },
  };

  const updateSession = async (updates: Record<string, unknown>) => {
    const result = await storage.get(['standloop_session']);
    const session = {
      active: false,
      startedAt: 0,
      lastBreakAt: null,
      currentState: 'idle',
      skippedReminders: 0,
      completedBreaks: 0,
      sitTimeMinutes: 0,
      breakStartTime: null,
      ...(result.standloop_session as Record<string, unknown> | undefined),
      ...updates,
    };
    await storage.set({ standloop_session: session });
    return session;
  };

  type RuntimeMessage = { type: string };

  (globalThis as typeof globalThis & { chrome: typeof chrome }).chrome = {
    ...globalThis.chrome,
    storage: { local: storage },
    runtime: {
      sendMessage(message: RuntimeMessage, callback?: (response: unknown) => void) {
        const now = Date.now();
        const actions: Record<string, () => Promise<unknown>> = {
          START_SESSION: () => updateSession({
            active: true,
            startedAt: now,
            currentState: 'focus',
            sitTimeMinutes: 0,
            skippedReminders: 0,
            completedBreaks: 0,
            breakStartTime: null,
          }),
          END_SESSION: () => updateSession({ active: false, currentState: 'idle' }),
          START_BREAK: () => updateSession({
            currentState: 'break-active',
            breakStartTime: now,
            lastBreakAt: now,
          }),
          COMPLETE_BREAK: () => updateSession({
            currentState: 'focus',
            breakStartTime: null,
            lastBreakAt: now,
          }),
          SKIP_REMINDER: () => updateSession({ currentState: 'focus' }),
          RETURN_FROM_DRIFT: () => updateSession({
            currentState: 'focus',
            breakStartTime: null,
            lastBreakAt: now,
          }),
        };

        actions[message.type]?.().then(callback);
        return true;
      },
      openOptionsPage() {},
    },
  } as unknown as typeof chrome;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
