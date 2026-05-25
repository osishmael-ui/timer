import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    focusIntervalMinutes: number;
    breakDurationMinutes: number;
    driftThresholdMinutes: number;
    reminderTone: 'gentle' | 'direct' | 'playful';
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    gamificationEnabled: boolean;
  };
  onSave: (settings: any) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetData,
}) => {
  const [localSettings, setLocalSettings] = React.useState(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-float">
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
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
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
            <div className="flex gap-2">
              {(['gentle', 'direct', 'playful'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setLocalSettings({ ...localSettings, reminderTone: tone })}
                  className={`
                    flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all
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
              { key: 'notificationsEnabled', label: 'Browser Notifications', icon: '🔔' },
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
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-charcoal/10">
            <button
              onClick={() => {
                if (confirm('Are you sure? This will delete all your data.')) {
                  onResetData();
                  onClose();
                }
              }}
              className="w-full py-2 px-4 bg-coral-500/10 text-coral-500 rounded-xl text-sm font-medium hover:bg-coral-500/20 transition-colors"
            >
              Reset All Data
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-charcoal/10 text-charcoal rounded-xl font-medium hover:bg-charcoal/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(localSettings);
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 shadow-lg shadow-sky-500/30 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
