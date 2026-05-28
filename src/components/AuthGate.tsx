import React from 'react';
import type { PasswordResetRequestResult } from '../auth/authStorage';

type AuthMode = 'signin' | 'signup' | 'recover';

interface AuthGateProps {
  initialMode?: AuthMode;
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  onRequestReset: (email: string) => Promise<PasswordResetRequestResult>;
  onShowPrivacy: () => void;
  onShowTerms: () => void;
}

interface ResetPasswordViewProps {
  onResetPassword: (password: string) => Promise<string | null>;
  onBackToSignIn: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  initialMode = 'signup',
  onSignIn,
  onSignUp,
  onRequestReset,
  onShowPrivacy,
  onShowTerms,
}) => {
  const [mode, setMode] = React.useState<AuthMode>(initialMode);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [resetUrl, setResetUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const isSignup = mode === 'signup';
  const isRecover = mode === 'recover';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    const result = isRecover
      ? await onRequestReset(email)
      : isSignup
        ? { ok: !(await onSignUp(email, password, displayName)) }
        : { ok: !(await onSignIn(email, password)) };

    if ('message' in result) {
      setNotice(result.message);
      setResetUrl(result.resetUrl ?? '');
    } else if (!result.ok) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const submitWithAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    const authError = isSignup
      ? await onSignUp(email, password, displayName)
      : await onSignIn(email, password);
    if (authError) setError(authError);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dashboard p-3 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-6xl gap-5 rounded-[2rem] border border-white/70 bg-white/55 p-4 shadow-2xl shadow-slate-200/80 backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_440px] md:min-h-[calc(100vh-48px)] md:p-6">
        <section className="flex min-h-[24rem] flex-col justify-between rounded-[1.5rem] bg-white/70 p-6 md:p-8">
          <div>
            <img src="/brand/qithym-logo-wordmark.svg" alt="Qithym" className="h-11 w-auto max-w-[12rem] object-contain" />
            <h1 className="mt-2 max-w-2xl text-4xl font-black leading-tight text-navy md:text-5xl">Start your first timer without setting up a whole life story.</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-charcoal/62">
              Create an account so your timer, settings, rewards, and history can belong to one stable identity across web, desktop, and future app or extension clients.
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              ['Stored', 'Email, profile name, timer settings, sessions, history, points, badges.'],
              ['Synced', 'Prepared for account sync; this build stores data in this browser until the cloud service is connected.'],
              ['Deleted', 'Account deletion removes the account record and account-owned timer data from this device.'],
            ].map(([label, detail]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-charcoal/45">{label}</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-charcoal/58">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card p-5 md:p-6">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setMode('signup')}
              className={`min-h-11 rounded-full text-sm font-black transition-colors ${mode === 'signup' ? 'bg-white text-sky-600 shadow-sm' : 'text-charcoal/55'}`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`min-h-11 rounded-full text-sm font-black transition-colors ${mode === 'signin' ? 'bg-white text-sky-600 shadow-sm' : 'text-charcoal/55'}`}
            >
              Log in
            </button>
          </div>

          <form onSubmit={isRecover ? submit : submitWithAuth} className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-charcoal/45">
                {isRecover ? 'Recover Access' : isSignup ? 'Lightweight Signup' : 'Welcome Back'}
              </p>
              <h2 className="mt-1 text-2xl font-black text-navy">
                {isRecover ? 'Reset your password' : isSignup ? 'Create your account' : 'Log in to your timer'}
              </h2>
            </div>

            {isSignup && (
              <label className="block">
                <span className="text-sm font-bold text-charcoal/70">Display name</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold text-charcoal outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  placeholder="Alex"
                  autoComplete="name"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-bold text-charcoal/70">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold text-charcoal outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
              />
            </label>

            {!isRecover && (
              <label className="block">
                <span className="text-sm font-bold text-charcoal/70">Password</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold text-charcoal outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  placeholder="10+ characters with a number"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                />
              </label>
            )}

            {error && <p className="rounded-xl bg-coral-500/10 px-3 py-2 text-sm font-bold text-coral-500">{error}</p>}
            {notice && <p className="rounded-xl bg-lime-50 px-3 py-2 text-sm font-bold text-lime-700">{notice}</p>}
            {resetUrl && (
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-charcoal/45">Reset Link</p>
                <a className="mt-2 block break-all text-sm font-bold text-sky-600" href={resetUrl}>{resetUrl}</a>
                <p className="mt-2 text-xs font-semibold text-charcoal/50">In production this link should be delivered by email. This local build shows it here for verification.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full rounded-full bg-sky-500 px-4 font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? 'Working...' : isRecover ? 'Send reset link' : isSignup ? 'Create account and start' : 'Log in'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
            <button onClick={() => setMode(isRecover ? 'signin' : 'recover')} className="text-sky-600 hover:text-sky-700">
              {isRecover ? 'Back to log in' : 'Forgot password?'}
            </button>
            <div className="flex gap-3">
              <button onClick={onShowPrivacy} className="text-charcoal/55 hover:text-charcoal">Privacy</button>
              <button onClick={onShowTerms} className="text-charcoal/55 hover:text-charcoal">Terms</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onResetPassword, onBackToSignIn }) => {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const resetError = await onResetPassword(password);
    if (resetError) setError(resetError);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dashboard p-3 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-xl items-center md:min-h-[calc(100vh-48px)]">
        <section className="panel-card w-full p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Recover Access</p>
          <h1 className="mt-2 text-3xl font-black text-navy">Choose a new password</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/58">
            Reset links expire after 30 minutes and can only be used once.
          </p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-charcoal/70">New password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold text-charcoal outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                placeholder="10+ characters with a number"
                type="password"
                autoComplete="new-password"
                required
              />
            </label>
            {error && <p className="rounded-xl bg-coral-500/10 px-3 py-2 text-sm font-bold text-coral-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full rounded-full bg-sky-500 px-4 font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? 'Resetting...' : 'Reset password and continue'}
            </button>
          </form>
          <button onClick={onBackToSignIn} className="mt-4 text-sm font-bold text-sky-600">
            Request a new link
          </button>
        </section>
      </div>
    </div>
  );
};

export const AuthLoading: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-dashboard p-6">
    <div className="panel-card p-6 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-2xl bg-sky-500" />
      <p className="text-sm font-black uppercase tracking-[0.2em] text-charcoal/45">Loading Account</p>
    </div>
  </div>
);
