import type React from 'react';
import { LEGAL_LAST_UPDATED, legalContent } from './legalContent';
import type { LegalKind } from './legalContent';

interface LegalPageProps {
  kind: LegalKind;
  isAuthenticated: boolean;
  onBack: () => void;
  onSignIn: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ kind, isAuthenticated, onBack, onSignIn }) => {
  const content = legalContent[kind];

  return (
    <div className="min-h-screen bg-dashboard p-3 text-[#0F1424] md:p-6">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-5xl rounded-[2rem] border border-white/70 bg-white/55 p-4 shadow-2xl shadow-slate-200/80 backdrop-blur-xl md:min-h-[calc(100vh-48px)] md:p-6">
        <section className="rounded-[1.75rem] border border-[#DDE8EF] bg-white/90 p-6 shadow-[0_26px_70px_rgba(15,30,51,0.08)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <img src="/brand/qithym-logo-wordmark.svg" alt="Qithym" className="h-11 w-auto max-w-[12rem] object-contain" />
              <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-[#4DA6FF]">{content.eyebrow}</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-extrabold leading-[1.02] text-[#0F1424] md:text-[3.5rem] lg:text-[4.2rem]">
                {content.title}
              </h1>
              <p className="mt-5 text-sm font-semibold text-[#0F1424]/55">Last updated {LEGAL_LAST_UPDATED}</p>
            </div>
            <button
              onClick={onBack}
              className="min-h-11 rounded-full bg-white px-5 text-sm font-black text-[#0F1424] ring-1 ring-[#0F1424]/10 transition-colors hover:bg-[#F7FAFC]"
            >
              {isAuthenticated ? 'Back to app' : 'Back to site'}
            </button>
          </div>

          <p className="mt-6 max-w-3xl text-base font-semibold leading-relaxed text-[#0F1424]/62">
            {content.intro}
          </p>

          <div className="mt-8 divide-y divide-[#0F1424]/8 overflow-hidden rounded-[2rem] bg-[#F7FAFC] ring-1 ring-[#0F1424]/8">
            {content.rows.map(([label, detail]) => (
              <div key={label} className="grid gap-2 p-5 md:grid-cols-[170px_1fr] md:p-6">
                <p className="text-sm font-black text-[#0F1424]">{label}</p>
                <p className="text-sm font-semibold leading-relaxed text-[#0F1424]/58">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-[#2ED4A7]/12 p-5 ring-1 ring-[#2ED4A7]/20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F1424]">Before Signup</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#0F1424]/60">
              You can read privacy and terms before creating an account. Creating an account means the timer is account-required and your timer data will be stored under your user ID.
            </p>
          </div>

          {!isAuthenticated && (
            <button
              onClick={onSignIn}
              className="mt-6 min-h-12 rounded-full bg-[#2FBFA6] px-6 font-black text-white shadow-lg shadow-[#2FBFA6]/22 transition hover:bg-[#269E8B]"
            >
              Continue to signup
            </button>
          )}
        </section>
      </div>
    </div>
  );
};
