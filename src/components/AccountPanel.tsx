import React from 'react';
import type { AuthUser } from '../auth/authStorage';
import type { AppState } from '../types';
import { getUserInitials } from '../auth/display';

interface AccountPanelProps {
  user: AuthUser;
  state: AppState;
  onUpdateProfile: (displayName: string) => void;
  onExportData: () => void;
  onDeleteAccount: () => void;
  onSignOut: () => void;
  onShowPrivacy: () => void;
  onShowTerms: () => void;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({
  user,
  state,
  onUpdateProfile,
  onExportData,
  onDeleteAccount,
  onSignOut,
  onShowPrivacy,
  onShowTerms,
}) => {
  const [displayName, setDisplayName] = React.useState(user.profile.displayName);
  const [deleteText, setDeleteText] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const canDelete = deleteText.trim().toUpperCase() === 'DELETE';

  const saveProfile = () => {
    onUpdateProfile(displayName);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <section className="panel-card overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_220px] md:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Account</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-navy md:text-4xl">
                Your identity for Qithym.
              </h2>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-charcoal/62">
                This account owns your timer settings, sessions, history, rewards, and profile. The same stable user ID is ready to identify you across web, desktop, mobile, and extension clients.
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-lime-50 p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-xl font-black text-white">
                {getUserInitials(user)}
              </div>
              <h3 className="mt-4 text-xl font-black text-navy">{user.profile.displayName}</h3>
              <p className="mt-1 break-all text-sm font-semibold text-charcoal/55">{user.profile.email}</p>
            </div>
          </div>
        </section>

        <section className="panel-card p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Profile</p>
          <h3 className="mt-1 text-xl font-black text-navy">Basic profile settings</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="block">
              <span className="text-sm font-bold text-charcoal/70">Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold text-charcoal outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <button
              onClick={saveProfile}
              className="self-end rounded-full bg-sky-500 px-5 py-3 font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600"
            >
              Save
            </button>
          </div>
          {saved && <p className="mt-3 rounded-xl bg-lime-50 px-3 py-2 text-sm font-bold text-lime-700">Profile updated.</p>}
        </section>

        <section className="panel-card p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Data</p>
          <h3 className="mt-1 text-xl font-black text-navy">Export account-owned data</h3>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/58">
            Export includes your account profile, identity metadata, timer settings, current session, history, rewards, streaks, and badges. Password hashes and reset tokens are not included.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              [state.dailyStats.focusMinutes, 'focus min today'],
              [state.sessionHistory.length, 'history entries'],
              [state.badges.length, 'badges'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white/80 p-4 text-center ring-1 ring-slate-200">
                <div className="text-2xl font-black text-navy">{value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-charcoal/45">{label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={onExportData}
            className="mt-5 min-h-11 rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100 transition-colors hover:bg-sky-50"
          >
            Export JSON
          </button>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Identity Model</p>
          <h3 className="mt-1 text-lg font-black text-navy">Stable user ID</h3>
          <p className="mt-3 break-all text-xs font-bold leading-relaxed text-charcoal/55">{user.profile.id}</p>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/55">
            Sync partition: {user.profile.syncIdentity.syncPartition}. Future clients should authenticate this account and write user-owned data to that partition.
          </p>
        </div>

        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Storage</p>
          <h3 className="mt-1 text-lg font-black text-navy">Account-scoped local data</h3>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/55">
            Cloud sync is prepared but not active in this build. Data marked account-owned is stored locally under your user ID on this device.
          </p>
        </div>

        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">Legal</p>
          <div className="mt-4 grid gap-2">
            <button onClick={onShowPrivacy} className="min-h-10 rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100 transition-colors hover:bg-sky-50">Privacy Policy</button>
            <button onClick={onShowTerms} className="min-h-10 rounded-full bg-white px-4 text-sm font-black text-sky-600 ring-1 ring-sky-100 transition-colors hover:bg-sky-50">Terms of Service</button>
            <button onClick={onSignOut} className="min-h-10 rounded-full bg-slate-100 px-4 text-sm font-black text-charcoal transition-colors hover:bg-slate-200">Log out</button>
          </div>
        </div>

        <div className="panel-card border-coral-500/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-coral-500">Delete Account</p>
          <h3 className="mt-1 text-lg font-black text-navy">Permanent on this device</h3>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/55">
            This removes your account, signs you out, and deletes account-owned timer data stored on this device. Export first if you need a copy.
          </p>
          <input
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            className="mt-4 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-coral-500 focus:ring-4 focus:ring-orange-100"
            placeholder="Type DELETE"
          />
          <button
            onClick={onDeleteAccount}
            disabled={!canDelete}
            className="mt-3 min-h-11 w-full rounded-full bg-coral-500 px-4 text-sm font-black text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Delete account
          </button>
        </div>
      </aside>
    </div>
  );
};
