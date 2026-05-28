import React from 'react';
import type { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  notificationPermission: NotificationPermission | 'unsupported';
  onSave: (settings: UserSettings) => Promise<boolean> | boolean;
  onResetData: () => void;
  onExportData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  notificationPermission,
  onSave,
  onResetData,
  onExportData,
}) => {
  if (!isOpen) return null;

  return (
    <SettingsModalContent
      onClose={onClose}
      settings={settings}
      notificationPermission={notificationPermission}
      onSave={onSave}
      onResetData={onResetData}
      onExportData={onExportData}
    />
  );
};

const SettingsModalContent: React.FC<Omit<SettingsModalProps, 'isOpen'>> = ({
  onClose,
  settings,
  notificationPermission,
  onSave,
  onResetData,
  onExportData,
}) => {
  const [localSettings, setLocalSettings] = React.useState<UserSettings>(settings);
  const [saveError, setSaveError] = React.useState('');

  const notificationStatusText = (() => {
    if (notificationPermission === 'unsupported') return 'Not supported in this browser';
    if (notificationPermission === 'granted') return 'Allowed';
    if (notificationPermission === 'denied') return 'Blocked by browser';
    return 'Will ask when enabled';
  })();

  const saveChanges = async () => {
    setSaveError('');
    const saved = await onSave(localSettings);
    if (saved) {
      onClose();
      return;
    }
    setSaveError('Browser notifications are blocked or unavailable, so they were left off.');
    setLocalSettings((current) => ({ ...current, notificationsEnabled: false }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass max-h-[94vh] w-full max-w-lg overflow-hidden rounded-3xl p-5 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-charcoal/10 flex items-center justify-center transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="max-h-[64vh] space-y-5 overflow-y-auto pr-1 sm:pr-2">
          {/* Focus Interval */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Focus Interval (minutes)
            </label>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={localSettings.focusIntervalMinutes}
              onChange={(e) => setLocalSettings({ ...localSettings, focusIntervalMinutes: parseInt(e.target.value) })}
              className="w-full accent-sky-500"
            />
            <div className="text-sm text-charcoal/60 mt-1">{localSettings.focusIntervalMinutes} minutes</div>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Break Duration (minutes)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={localSettings.breakDurationMinutes}
              onChange={(e) => setLocalSettings({ ...localSettings, breakDurationMinutes: parseInt(e.target.value) })}
              className="w-full accent-lime-500"
            />
            <div className="text-sm text-charcoal/60 mt-1">{localSettings.breakDurationMinutes} minutes</div>
          </div>

          {/* Drift Threshold */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Drift Warning (minutes)
            </label>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={localSettings.driftThresholdMinutes}
              onChange={(e) => setLocalSettings({ ...localSettings, driftThresholdMinutes: parseInt(e.target.value) })}
              className="w-full accent-coral-500"
            />
            <div className="text-sm text-charcoal/60 mt-1">{localSettings.driftThresholdMinutes} minutes</div>
          </div>

          {/* Reminder Tone */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Reminder Tone
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(['gentle', 'direct', 'playful'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setLocalSettings({ ...localSettings, reminderTone: tone })}
                  className={`
                    flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all
                    ${localSettings.reminderTone === tone
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'
                    }
                  `}
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {[
              { key: 'soundEnabled', label: 'Sound Effects', icon: '🔊' },
              { key: 'gamificationEnabled', label: 'Gamification (Points & Badges)', icon: '🎮' },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-charcoal flex items-center gap-2">
                  <span>{icon}</span> {label}
                </span>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, [key]: !localSettings[key as keyof typeof localSettings] })}
                  className={`
                    w-12 h-6 rounded-full transition-colors relative
                    ${localSettings[key as keyof typeof localSettings] ? 'bg-lime-500' : 'bg-charcoal/30'}
                  `}
                >
                  <div className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${localSettings[key as keyof typeof localSettings] ? 'left-7' : 'left-1'}
                  `} />
                </button>
              </div>
            ))}
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-charcoal flex items-center gap-2">
                  <span>🔔</span> Browser Notifications
                </span>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, notificationsEnabled: !localSettings.notificationsEnabled })}
                  className={`
                    relative h-6 w-12 shrink-0 rounded-full transition-colors
                    ${localSettings.notificationsEnabled ? 'bg-lime-500' : 'bg-charcoal/30'}
                  `}
                  aria-label="Toggle browser notifications"
                >
                  <div className={`
                    absolute top-1 h-4 w-4 rounded-full bg-white transition-transform
                    ${localSettings.notificationsEnabled ? 'left-7' : 'left-1'}
                  `} />
                </button>
              </div>
              <p className="mt-2 text-xs font-semibold text-charcoal/55">{notificationStatusText}</p>
              {notificationPermission === 'denied' && (
                <p className="mt-1 text-xs font-semibold text-coral-500">Change browser site permissions to enable notifications again.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-sky-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">Data Transparency</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-charcoal/60">
              Qithym stores settings, history, streaks, and rewards under your account ID. Cloud sync is prepared for future clients, but this build stores account data locally in this browser.
            </p>
            <button
              onClick={onExportData}
              className="mt-3 min-h-10 w-full rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100 transition-colors hover:bg-sky-50"
            >
              Export Account Data
            </button>
          </div>

          <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-charcoal/45">Feedback</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-charcoal/60">
              Send bug reports, confusing moments, or reward ideas.
            </p>
            <a
              href="mailto:support@qithym.app?subject=Qithym%20feedback"
              className="mt-3 block min-h-10 rounded-xl bg-slate-100 px-4 py-2.5 text-center text-sm font-black text-charcoal transition-colors hover:bg-slate-200"
            >
              Contact Support
            </a>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-charcoal/10">
            <button
              onClick={() => {
                if (confirm('Reset timer data for this account on this device? Your account will remain active.')) {
                  onResetData();
                  onClose();
                }
              }}
              className="w-full py-2 px-4 bg-coral-500/10 text-coral-500 rounded-full text-sm font-medium hover:bg-coral-500/20 transition-colors"
            >
              Reset Timer Data
            </button>
          </div>
        </div>

        {/* Footer */}
        {saveError && (
          <p className="mt-4 rounded-xl bg-coral-500/10 px-3 py-2 text-sm font-semibold text-coral-500">{saveError}</p>
        )}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={onClose}
            className="min-h-12 rounded-full bg-charcoal/10 px-4 font-medium text-charcoal transition-colors hover:bg-charcoal/20"
          >
            Cancel
          </button>
          <button
            onClick={saveChanges}
            className="min-h-12 rounded-full bg-sky-500 px-4 font-medium text-white shadow-lg shadow-sky-500/30 transition-colors hover:bg-sky-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
