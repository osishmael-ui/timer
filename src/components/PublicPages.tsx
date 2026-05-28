import React from 'react';

export type MarketingRoute = 'home' | 'features' | 'pricing' | 'download' | 'help' | 'contact' | 'changelog';

interface PublicPagesProps {
  route: MarketingRoute;
  onOpenApp: () => void;
}

const publicNav: Array<{ route: MarketingRoute; label: string; href: string }> = [
  { route: 'home', label: 'Home', href: '#home' },
  { route: 'features', label: 'Features', href: '#features' },
  { route: 'pricing', label: 'Pricing', href: '#pricing' },
  { route: 'download', label: 'Download', href: '#download' },
];

const supportNav = [
  { route: 'help' as const, label: 'Help', href: '#help' },
  { route: 'contact' as const, label: 'Contact', href: '#contact' },
  { route: 'changelog' as const, label: 'Changelog', href: '#changelog' },
];

const footerGroups = [
  {
    title: 'Explore',
    links: publicNav.slice(0, 4),
  },
  {
    title: 'Support',
    links: supportNav,
  },
  {
    title: 'Legal',
    links: [
      { route: 'home' as const, label: 'Privacy', href: '#privacy' },
      { route: 'home' as const, label: 'Terms', href: '#terms' },
    ],
  },
];

const featureCards = [
  {
    title: 'Plan the day',
    label: 'Before the timer',
    detail: 'Set focus blocks, admin windows, movement resets, and fixed commitments before the day starts making choices for you.',
    accent: '#4DA6FF',
    items: ['Focus blocks', 'Return points', 'Admin windows'],
  },
  {
    title: 'Focus with resets',
    label: 'During the block',
    detail: 'Run focused sessions with movement prompts that protect attention without pretending breaks are optional.',
    accent: '#2ED4A7',
    items: ['Timed sessions', 'Movement prompts', 'Break edges'],
  },
  {
    title: 'Stop break drift',
    label: 'After the break',
    detail: 'Give each break a clear edge so a useful pause does not quietly become the rest of the afternoon.',
    accent: '#FF7A5C',
    items: ['Drift cues', 'Next step ready', 'Focus recovery'],
  },
  {
    title: 'See what works',
    label: 'Over time',
    detail: 'Use progress, streaks, and session history to spot the work patterns you can repeat.',
    accent: '#8A6CFF',
    items: ['Session history', 'Streaks', 'Badges'],
  },
  {
    title: 'Keep control of your data',
    label: 'Account control',
    detail: 'Export or delete account-owned timer data from the account area, even in this local-first build.',
    accent: '#0BAF87',
    items: ['Local identity', 'Export data', 'Delete account'],
  },
  {
    title: 'Built around real work rhythms',
    label: 'Research informed',
    detail: 'Qithym is shaped by research on deep work, attention, recovery, movement breaks, and chronotypes, then translated into simple planning prompts for the workday.',
    accent: '#FFB562',
    items: ['Attention', 'Recovery', 'Chronotypes'],
  },
];

const featureWorkflow = [
  ['01', 'Map the work', 'Choose the task, time block, recovery window, and next step before you start.'],
  ['02', 'Protect the session', 'Keep one clear boundary around the work so the block does not turn into scattered effort.'],
  ['03', 'Move with purpose', 'Use short movement resets before fatigue starts turning into distraction.'],
  ['04', 'Continue clearly', 'Come back to a named next step, then let progress build from repeatable days.'],
];

const featureFaqRows = [
  ['What features does Qithym include?', 'Qithym includes focus planning, timed work sessions, movement resets, return points, progress history, streaks, badges, and basic account data controls.'],
  ['Why does Qithym include movement resets?', 'Because attention is not only a time problem. Short movement breaks can help you reset your body, reduce fatigue, and come back with more control.'],
  ['How does Qithym help after a break?', 'Qithym asks you to define the next step before you pause, so the break has a clearer edge and the next block is easier to restart.'],
  ['Is Qithym research-informed?', 'Yes. Qithym is shaped by research on attention, recovery, movement breaks, chronotypes, and sustainable work rhythms, then translated into simple planning tools.'],
];

const faqRows = [
  ['What is Qithym?', 'Qithym is a web app for planning deep work, running focus sessions, taking movement resets, and stopping break drift before it takes over the day.'],
  ['Is the desktop app available?', 'Not yet. The web app is available now, with macOS and Windows apps planned after the core work rhythm is stable.'],
  ['Will desktop sync with web?', 'True sync needs a shared cloud backend. Until that exists, Qithym should be treated as local to this browser.'],
  ['Where is my data stored today?', 'This build stores account and timer data locally in this browser, under your account identity.'],
  ['Can I delete or export my data?', 'Yes. The account area includes export and deletion controls for account-owned timer data on this device.'],
  ['Is Qithym medical advice?', 'No. Qithym is a focus and movement timer, not medical advice, treatment, or a guarantee of health outcomes.'],
];

const updates = [
  ['Public pages refreshed', 'Home, features, pricing, download, help, support, legal, and changelog pages now share the same calmer product story.'],
  ['Web app available', 'The web app is the main entry point for planning focus blocks, running sessions, adding movement resets, and tracking progress.'],
  ['Desktop planned', 'macOS and Windows apps remain planned, with no installer shown until those builds are real.'],
  ['Extension planned', 'Browser extension support is listed as planned for quick timer access, gentle nudges, and status visibility later.'],
];

const contactCards = [
  ['Account help', 'Sign-in, password reset, profile, account deletion, or data export questions.'],
  ['Bug reports', 'Timer behavior, planner issues, broken pages, layout problems, or unexpected data behavior.'],
  ['Pricing questions', 'Questions about free early access, future paid plans, or what is included today.'],
  ['Platform requests', 'macOS, Windows, extension, or sync expectations for future releases.'],
];

const downloadCards: Array<{
  name: string;
  status: string;
  detail: string;
  action: string;
  active: boolean;
}> = [
  {
    name: 'Web app',
    status: 'AVAILABLE NOW',
    detail: 'Open Qithym in your browser to plan focus blocks, run sessions, add movement resets, and track your progress.',
    action: 'Open Qithym',
    active: true,
  },
  {
    name: 'macOS app',
    status: 'COMING LATER',
    detail: 'A Mac desktop app is planned after the web app has more real usage and the core work rhythm is stable.',
    action: 'Coming later',
    active: false,
  },
  {
    name: 'Windows app',
    status: 'COMING LATER',
    detail: 'A Windows desktop app is planned after the web app has more real usage and the core work rhythm is stable.',
    action: 'Coming later',
    active: false,
  },
];

const OpenAppButton: React.FC<{ onOpenApp: () => void; variant?: 'primary' | 'secondary'; children?: React.ReactNode }> = ({
  onOpenApp,
  variant = 'primary',
  children = 'Open Qithym',
}) => (
  <button
    onClick={onOpenApp}
    className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-black transition-colors ${
      variant === 'primary'
        ? 'bg-[#2FBFA6] text-white shadow-lg shadow-[#2FBFA6]/22 hover:bg-[#269E8B]'
        : 'bg-white text-[#0F1424] ring-1 ring-[#0F1424]/12 hover:bg-[#F7FAFC]'
    }`}
  >
    {children}
  </button>
);

const ArrowIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

type FlowTone = 'strain' | 'repair';

const problemFlow = [
  ['01', 'Common sign', 'Start focused', 'You begin with a clear task and good intent.'],
  ['02', 'Common sign', 'Push too long', 'The session stretches past useful focus and your energy drops.'],
  ['03', 'Common sign', 'Take a vague break', 'The pause has no clear edge, so admin, scrolling, or random tasks take over.'],
  ['04', 'Common sign', 'Lose the thread', 'The day is not ruined, but getting back takes more effort.'],
];

const productFlow = [
  ['01', 'Before noise', 'Plan', 'Set focus blocks, movement resets, and return points before the day gets noisy.'],
  ['02', 'Protected block', 'Focus', 'Work in protected sessions built around real effort, not heroic intensity.'],
  ['03', 'Body reset', 'Move', 'Use short movement breaks before fatigue starts making decisions for you.'],
  ['04', 'Next step ready', 'Return', 'Come back with a clear next step before a useful break becomes drift.'],
];

const audienceCards = [
  ['Builders', 'You need long enough blocks to make real progress, but your breaks keep becoming context switches.'],
  ['Creators', 'You want a lighter structure for writing, designing, editing, or shipping without turning the day into a grind.'],
  ['Founders', 'You carry too many tabs in your head and need a simple way to protect work, admin, and recovery.'],
  ['Remote workers', 'You want movement built into the day before your body has to negotiate for attention.'],
];

const homeFaqRows = [
  ['What is the best focus timer for deep work with breaks?', 'Qithym is a focus timer with breaks for people who want to plan deep work, step away on purpose, and come back with the next task already clear.'],
  ['How is Qithym different from a Pomodoro timer?', 'A Pomodoro timer mostly counts intervals. Qithym adds planning, movement breaks, and a simple next-step cue so the work is easier to continue.'],
  ['Who should use Qithym?', 'Qithym is a productivity app for builders, creators, founders, students, and remote workers who need focused work sessions without ignoring recovery.'],
  ['Can Qithym help with break drift?', 'Yes. Qithym helps you return from breaks by giving each pause a clearer purpose and a next step to pick up afterward.'],
  ['Does Qithym support movement breaks?', 'Yes. Qithym works as a movement break app inside your workday, helping you stand up, breathe, and protect focus and recovery.'],
  ['Is Qithym free to try?', 'Yes. Qithym has a free tier with the core features you need to plan focus blocks, add movement resets, and get started.'],
];

const TimelineItem: React.FC<{
  index: string;
  label: string;
  title: string;
  detail: string;
  itemIndex: number;
  tone: FlowTone;
}> = ({ index, label, title, detail, itemIndex, tone }) => {
  const [isArmed, setIsArmed] = React.useState(false);
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const isLeft = itemIndex % 2 === 0;
  const isRepair = tone === 'repair';

  React.useEffect(() => {
    const row = rowRef.current;
    if (!row || isArmed) return undefined;

    let frame = 0;
    const checkRow = () => {
      const rect = row.getBoundingClientRect();
      if (rect.top < window.innerHeight + 80 && rect.bottom > 0) {
        setIsArmed(true);
        window.removeEventListener('scroll', scheduleCheck);
        window.removeEventListener('resize', scheduleCheck);
      }
    };
    const scheduleCheck = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(checkRow);
    };

    scheduleCheck();
    window.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleCheck);
      window.removeEventListener('resize', scheduleCheck);
    };
  }, [isArmed]);

  const card = (
    <article className="timeline-card rounded-[1.75rem] bg-white/90 p-6 shadow-[0_26px_70px_rgba(15,30,51,0.08)] ring-1 ring-[#DDE8EF] md:p-7">
      <span
        className={`timeline-number mb-5 flex h-11 w-11 items-center justify-center rounded-full border text-sm font-black shadow-[0_18px_44px_rgba(15,30,51,0.1)] md:hidden ${
          isRepair ? 'border-[#B9F4E4] bg-[#F0FFFA] text-[#0BAF87]' : 'border-[#FFD2A3] bg-[#FFF8EF] text-[#FF9B2F]'
        }`}
        style={{ '--timeline-delay': '0.16s' } as React.CSSProperties}
      >
        {index}
      </span>
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] ${
          isRepair ? 'border-[#2ED4A7]/24 bg-[#EEFFF9] text-[#0BAF87]' : 'border-[#FFB562]/32 bg-[#FFF7ED] text-[#FF9B2F]'
        }`}
      >
        {label}
      </span>
      <h3 className="mt-4 text-2xl font-black leading-tight text-[#0F1424]">{title}</h3>
      <p className="mt-4 text-base font-semibold leading-relaxed text-[#0F1424]/62">{detail}</p>
      <div
        className={`mt-6 h-2 w-24 rounded-full ${
          isRepair ? 'bg-gradient-to-r from-[#2ED4A7] via-[#4DA6FF] to-[#8A6CFF]' : 'bg-gradient-to-r from-[#FFB562] via-[#FF7A5C] to-[#8A6CFF]'
        }`}
      />
    </article>
  );

  return (
    <div ref={rowRef} className={`grid gap-5 md:grid-cols-[1fr_5rem_1fr] md:gap-x-8 ${isArmed ? 'timeline-armed' : ''}`}>
      {isLeft ? card : <div className="hidden md:block" aria-hidden="true" />}

      <div className="hidden items-center justify-center md:flex">
        <span
          className={`timeline-number relative z-10 flex h-12 w-12 items-center justify-center rounded-full border text-sm font-black shadow-[0_18px_44px_rgba(15,30,51,0.1)] ${
            isRepair ? 'border-[#B9F4E4] bg-[#F0FFFA] text-[#0BAF87]' : 'border-[#FFD2A3] bg-[#FFF8EF] text-[#FF9B2F]'
          }`}
          style={{ '--timeline-delay': '0.16s' } as React.CSSProperties}
        >
          {index}
        </span>
      </div>

      {isLeft ? <div className="hidden md:block" aria-hidden="true" /> : card}
    </div>
  );
};

const TimelineSection: React.FC<{
  id?: string;
  eyebrow: string;
  title: string;
  detail: string;
  tone: FlowTone;
  items: string[][];
}> = ({ id, eyebrow, title, detail, tone, items }) => {
  const isRepair = tone === 'repair';

  return (
    <section id={id} className={`scroll-mt-28 ${isRepair ? 'bg-white' : 'bg-[#F3F7FA]'}`}>
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1fr] lg:items-end">
          <div>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${isRepair ? 'text-[#2ED4A7]' : 'text-[#FF7A5C]'}`}>{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#0F1424] md:text-[2.75rem]">{title}</h2>
          </div>
          <p className="text-base font-semibold leading-relaxed text-[#0F1424]/62 md:text-lg">{detail}</p>
        </div>

        <div className="relative mt-9 grid gap-5 md:mt-12 md:gap-y-12">
          <div
            className={`pointer-events-none absolute left-6 top-0 hidden h-full w-px md:left-1/2 md:block ${
              isRepair
                ? 'bg-gradient-to-b from-[#DCE8EF] via-[#B9F4E4] to-[#DCE8EF]'
                : 'bg-gradient-to-b from-[#DCE8EF] via-[#FFD9B6] to-[#DCE8EF]'
            }`}
          />
          {items.map(([index, label, itemTitle, itemDetail], itemIndex) => {
            return (
              <TimelineItem key={itemTitle} index={index} label={label} title={itemTitle} detail={itemDetail} itemIndex={itemIndex} tone={tone} />
            );
          })}
        </div>
      </div>
    </section>
  );
};

const FlowSection: React.FC<{
  id?: string;
  eyebrow: string;
  title: string;
  detail: string;
  tone: FlowTone;
  items: string[][];
}> = ({ id, eyebrow, title, detail, tone, items }) => {
  return <TimelineSection id={id} eyebrow={eyebrow} title={title} detail={detail} tone={tone} items={items} />;
};

const AudienceSection = () => (
  <section className="scroll-mt-28 bg-[#F3F7FA] px-4 py-14 md:px-6 md:py-16">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1fr] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2ED4A7]">Who it is for</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#0F1424] md:text-[2.75rem]">For people whose work needs a real ramp back in.</h2>
        </div>
        <p className="text-base font-semibold leading-relaxed text-[#0F1424]/62 md:text-lg">
          Qithym fits days where attention, body energy, and open loops all compete. It is for people who do not need more pressure; they need a practical way to start again.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {audienceCards.map(([title, detail], index) => (
          <article key={title} className="rounded-3xl bg-white p-5 shadow-[0_18px_50px_rgba(15,30,51,0.06)] ring-1 ring-[#DDE8EF]">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#4DA6FF]">0{index + 1}</span>
            <h3 className="mt-8 text-2xl font-black text-[#0F1424]">{title}</h3>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-[#0F1424]/60">{detail}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const HomeCtaSection: React.FC<{ onOpenApp: () => void }> = ({ onOpenApp }) => (
  <section className="scroll-mt-28 bg-[#F7FAFC] px-4 py-12 md:px-6 md:py-14">
    <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#65DCC5]/35 bg-[linear-gradient(135deg,#F4FFFC_0%,#EAF9FF_42%,#F0EAFF_100%)] p-6 shadow-[0_24px_70px_rgba(77,166,255,0.12)] md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0BAF87]">Start for free</p>
          <h2 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight text-[#0F1424] md:text-[2.75rem]">Build your next focus plan before another break eats the afternoon.</h2>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-[#0F1424]/64 md:text-base">
            Plan the block, choose the reset, and come back with your next step ready.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <OpenAppButton onOpenApp={onOpenApp}>Start for free</OpenAppButton>
          <a href="#home-faq" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0F1424]/10 bg-white/70 px-6 text-sm font-black text-[#0F1424] transition hover:bg-white">
            Read FAQs
          </a>
        </div>
      </div>
    </div>
  </section>
);

const HomeFaqSection = () => (
  <section id="home-faq" className="scroll-mt-28 bg-white px-4 py-14 md:px-6 md:py-16">
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4DA6FF]">FAQ</p>
      <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#0F1424] md:text-[2.75rem]">Questions people ask before they try Qithym.</h2>
      <div className="mt-8 divide-y divide-[#0F1424]/8 overflow-hidden rounded-[2rem] bg-[#F7FAFC] ring-1 ring-[#0F1424]/8">
        {homeFaqRows.map(([question, answer]) => (
          <article key={question} className="p-5 md:p-6">
            <h3 className="text-lg font-black text-[#0F1424]">{question}</h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#0F1424]/60">{answer}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const PublicShell: React.FC<{
  route: MarketingRoute;
  onOpenApp: () => void;
  children: React.ReactNode;
}> = ({ route, onOpenApp, children }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-dashboard text-[#0F1424]">
      <header className="fixed left-0 right-0 top-0 z-50">
        <div className="px-3 pt-3 sm:px-5 sm:pt-4">
          <div className="relative z-50 mx-auto grid max-w-[96rem] grid-cols-[auto_1fr_auto] items-center px-1 py-1 text-[#0F1424] sm:px-2">
          <a
            href="#home"
            className="group relative z-10 flex min-w-0 items-center rounded-full border border-[#4DA6FF]/12 bg-white/72 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.56),0_8px_20px_rgba(15,30,51,0.05)] transition-all duration-200 hover:bg-white/86"
            aria-label="Qithym home"
          >
            <img src="/brand/qithym-logo-wordmark.svg" alt="Qithym" className="h-7 w-auto max-w-[9.5rem] object-contain sm:h-8" />
          </a>

          <nav
            className="relative z-10 hidden justify-self-center rounded-full border border-[#4DA6FF]/10 bg-[linear-gradient(180deg,rgba(77,166,255,0.08),rgba(77,166,255,0.04))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] md:flex md:items-center md:justify-center"
            aria-label="Public navigation"
          >
            {publicNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-full px-5 py-2 text-[15px] font-semibold tracking-[0.01em] transition-all duration-200 ${
                  route === item.route ? 'bg-white/72 text-[#0F1424] shadow-sm' : 'text-[#0F1424]/74 hover:bg-white/62 hover:text-[#0F1424]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="relative z-10 ml-3 flex shrink-0 items-center justify-self-end gap-2 sm:gap-3">
            <button
              onClick={onOpenApp}
              className="hidden items-center rounded-full bg-[#2FBFA6] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(47,191,166,0.22)] transition-all duration-200 hover:bg-[#269E8B] hover:text-white hover:shadow-[0_14px_28px_rgba(47,191,166,0.26)] md:inline-flex"
            >
              Open Qithym
            </button>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="group p-2 text-[#0F1424]/78 transition-all duration-300 hover:text-[#0F1424] md:hidden"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation-panel"
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className={`absolute h-0.5 w-5 rounded-full bg-current transition-transform ${menuOpen ? 'rotate-45' : '-translate-y-1.5'}`} />
                <span className={`absolute h-0.5 w-5 rounded-full bg-current transition-opacity ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`absolute h-0.5 w-5 rounded-full bg-current transition-transform ${menuOpen ? '-rotate-45' : 'translate-y-1.5'}`} />
              </span>
            </button>
          </div>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-navigation-panel" className="mx-3 mt-2 rounded-[1.75rem] border border-[#4DA6FF]/12 bg-white/94 p-3 shadow-[0_24px_60px_rgba(15,30,51,0.12)] backdrop-blur-xl md:hidden">
            <div className="grid gap-1">
              {publicNav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-full px-4 py-3 text-sm font-semibold ${
                    route === item.route ? 'bg-[#F7FAFC] text-[#0F1424]' : 'text-[#0F1424]/72'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenApp();
                }}
                className="mt-2 min-h-12 rounded-full bg-[#2FBFA6] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(47,191,166,0.22)] transition-colors hover:bg-[#269E8B]"
              >
                Open Qithym
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="pt-24 md:pt-28">{children}</main>

      <footer className="border-t border-[#4DA6FF]/10 bg-[linear-gradient(180deg,rgba(244,249,252,0.96),rgba(239,246,250,0.98))] px-6 pb-12 pt-20 text-[#334155]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-8">
              <div className="flex items-center">
                <img src="/brand/qithym-logo-wordmark.svg" alt="Qithym" className="h-8 w-auto max-w-[10rem] object-contain" />
              </div>
              <p className="max-w-xs text-sm font-semibold leading-relaxed text-[#334155]/72">
              Work rhythm for builders and creators. Plan deep work, reset with movement, and return before the thread cools.
            </p>
              <div className="space-y-3 text-sm font-semibold text-[#334155]/72">
                <p>Less break drift after hard sessions</p>
                <p>More energy left for the work that matters</p>
                <p>A calmer way to restart tomorrow</p>
              </div>
              <button
                onClick={onOpenApp}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#2FBFA6] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(47,191,166,0.22)] transition-all duration-200 hover:bg-[#269E8B] hover:shadow-[0_14px_28px_rgba(47,191,166,0.26)]"
              >
                Open Qithym
              </button>
            </div>
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-3 xl:gap-10">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <h4 className="border-b border-[#4DA6FF]/12 pb-3 text-2xl font-semibold text-[#0F1424]">{group.title}</h4>
                  <ul className="mt-6 space-y-5 text-sm font-semibold text-[#334155]/72">
                    {group.links.map((item) => (
                      <li key={`${group.title}-${item.href}`}>
                        <a className="transition-colors hover:text-[#4DA6FF]" href={item.href}>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16 border-t border-[#4DA6FF]/12 pt-8">
            <p className="text-[10px] uppercase tracking-widest text-[#334155]/50">© 2026 Qithym</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const HomePage: React.FC<{ onOpenApp: () => void }> = ({ onOpenApp }) => (
  <>
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 md:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
      <div className="min-w-0">
        <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] text-[#0F1424] md:text-[3.5rem] lg:text-[4.2rem]">
          Plan deep work. Take better breaks. Get back before the day drifts.
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-[#0F1424]/62">
          Qithym helps builders and creators plan focused sessions, add movement resets, and come back with a clear next step.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <OpenAppButton onOpenApp={onOpenApp}>Start planning your day</OpenAppButton>
          <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-[#0F1424] ring-1 ring-[#0F1424]/10 transition hover:bg-[#F7FAFC]">
            See how it works <ArrowIcon />
          </a>
        </div>
      </div>

      <div className="rounded-[2rem] bg-[#0F1424] p-4 shadow-2xl shadow-[#0F1424]/18">
        <div className="rounded-[1.45rem] bg-white p-4">
          <div className="flex items-center justify-between gap-3 border-b border-[#0F1424]/8 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#4DA6FF]">Today</p>
              <h2 className="mt-1 text-2xl font-black text-[#0F1424]">Return plan</h2>
            </div>
            <img src="/brand/qithym-icon.svg" alt="" className="h-12 w-12 rounded-2xl object-cover" />
          </div>
          <div className="mt-5 grid gap-3">
            {[
              ['09:00', 'Deep work block', 'Build checkout flow', '#4DA6FF'],
              ['10:00', 'Movement reset', 'Stand, breathe, shoulders', '#2ED4A7'],
              ['10:10', 'Return point', 'Open tests and continue', '#8A6CFF'],
              ['11:30', 'Admin window', 'Messages stay contained', '#FF7A5C'],
            ].map(([time, title, note, color]) => (
              <div key={title} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-2xl bg-[#F7FAFC] p-3">
                <span className="text-sm font-black text-[#0F1424]/44">{time}</span>
                <div className="rounded-xl bg-white p-3 ring-1 ring-[#0F1424]/7">
                  <span className="mb-2 block h-2 w-14 rounded-full" style={{ backgroundColor: color }} />
                  <p className="text-sm font-black text-[#0F1424]">{title}</p>
                  <p className="mt-1 text-xs font-bold text-[#0F1424]/48">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <FlowSection
      eyebrow="Why focus breaks"
      title="Focus does not usually fail loudly."
      detail="It slips when one session runs too long, one break gets vague, and one next step is missing."
      tone="strain"
      items={problemFlow}
    />

    <AudienceSection />

    <FlowSection
      id="how-it-works"
      eyebrow="How Qithym helps"
      title="Qithym gives the workday a simple shape."
      detail="Use it as a work rhythm planner: plan the work, protect the session, move before fatigue takes over, and keep focus and recovery in the same plan. It is a productivity app for builders who need structure without pressure."
      tone="repair"
      items={productFlow}
    />

    <HomeCtaSection onOpenApp={onOpenApp} />
    <HomeFaqSection />
  </>
);

const FeaturesPage: React.FC<{ onOpenApp: () => void }> = ({ onOpenApp }) => (
  <>
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 md:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4DA6FF]">Features</p>
        <h1 className="mt-3 max-w-4xl text-5xl font-extrabold leading-[1.02] text-[#0F1424] md:text-[3.5rem] lg:text-[4.2rem]">
          More than a timer for deep work.
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-[#0F1424]/62">
          Qithym helps you plan the block, protect your attention, add movement resets, and come back with a clear next step.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <OpenAppButton onOpenApp={onOpenApp}>Open the web app</OpenAppButton>
          <a href="#feature-cards" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-[#0F1424] ring-1 ring-[#0F1424]/10 transition hover:bg-[#F7FAFC]">
            Explore features <ArrowIcon />
          </a>
        </div>
      </div>

      <div className="rounded-[2rem] bg-[#0F1424] p-4 shadow-2xl shadow-[#0F1424]/18">
        <div className="rounded-[1.45rem] bg-white p-4">
          <div className="flex items-center justify-between gap-3 border-b border-[#0F1424]/8 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2ED4A7]">Focus loop</p>
              <h2 className="mt-1 text-2xl font-black text-[#0F1424]">Plan the block</h2>
            </div>
            <img src="/brand/qithym-icon.svg" alt="" className="h-12 w-12 rounded-2xl object-cover" />
          </div>
          <div className="mt-5 grid gap-3">
            {featureWorkflow.map(([index, title, detail], itemIndex) => (
              <div key={title} className="grid grid-cols-[3.25rem_1fr] items-start gap-3 rounded-2xl bg-[#F7FAFC] p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-[#0F1424]/48 ring-1 ring-[#0F1424]/7">{index}</span>
                <div className="rounded-xl bg-white p-3 ring-1 ring-[#0F1424]/7">
                  <span
                    className="mb-2 block h-2 w-14 rounded-full"
                    style={{ backgroundColor: featureCards[itemIndex]?.accent ?? '#4DA6FF' }}
                  />
                  <p className="text-sm font-black text-[#0F1424]">{title}</p>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-[#0F1424]/48">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section id="feature-cards" className="scroll-mt-28 px-4 py-12 md:px-6 md:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4DA6FF]">What you can do</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#0F1424] md:text-[2.75rem]">Build a work rhythm you can actually repeat.</h2>
          <p className="mt-4 text-base font-semibold leading-relaxed text-[#0F1424]/62">
            Qithym keeps the app simple on purpose: plan the work, run the session, move before fatigue takes over, and keep enough history to improve tomorrow.
          </p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map(({ title, label, detail, accent, items }) => (
            <article key={title} className="flex min-h-[19rem] flex-col rounded-[1.75rem] bg-white/90 p-6 shadow-[0_26px_70px_rgba(15,30,51,0.08)] ring-1 ring-[#DDE8EF]">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-[#F7FAFC] px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#0F1424]/52 ring-1 ring-[#0F1424]/7">{label}</span>
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accent }} />
              </div>
              <h3 className="mt-5 text-2xl font-black leading-tight text-[#0F1424]">{title}</h3>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-[#0F1424]/60">{detail}</p>
              <div className="mt-auto pt-6">
                <div className="h-2 w-20 rounded-full" style={{ backgroundColor: accent }} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span key={item} className="rounded-full bg-[#F7FAFC] px-3 py-1 text-xs font-black text-[#0F1424]/58 ring-1 ring-[#0F1424]/7">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="scroll-mt-28 bg-[#F7FAFC] px-4 py-12 md:px-6 md:py-14">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#65DCC5]/35 bg-[linear-gradient(135deg,#F4FFFC_0%,#EAF9FF_42%,#F0EAFF_100%)] p-6 shadow-[0_24px_70px_rgba(77,166,255,0.12)] md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0BAF87]">Start simple</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight text-[#0F1424] md:text-[2.75rem]">Plan one focused block. Add one reset. Know what comes next.</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-[#0F1424]/64 md:text-base">
              The web app is ready now. Start with one block today, then build a rhythm you can repeat tomorrow.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <OpenAppButton onOpenApp={onOpenApp}>Try Qithym</OpenAppButton>
            <a href="#pricing" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0F1424]/10 bg-white/70 px-6 text-sm font-black text-[#0F1424] transition hover:bg-white">
              See pricing
            </a>
          </div>
        </div>
      </div>
    </section>

    <section className="scroll-mt-28 bg-white px-4 py-14 md:px-6 md:py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4DA6FF]">FAQ</p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#0F1424] md:text-[2.75rem]">Feature questions</h2>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-[#0F1424]/62">A few quick answers about how Qithym works.</p>
        <div className="mt-8 divide-y divide-[#0F1424]/8 overflow-hidden rounded-[2rem] bg-[#F7FAFC] ring-1 ring-[#0F1424]/8">
          {featureFaqRows.map(([question, answer]) => (
            <article key={question} className="p-5 md:p-6">
              <h3 className="text-lg font-black text-[#0F1424]">{question}</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#0F1424]/60">{answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  </>
);

const PricingPage: React.FC<{ onOpenApp: () => void }> = ({ onOpenApp }) => (
  <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
    <PageIntro eyebrow="Qithym pricing" title="Start building a calmer work rhythm for free." detail="Plan focused blocks, add movement breaks, and keep a bad rhythm from taking over the whole day." variant="homeHero" />
    <div className="mt-9 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#0F1424]/8 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2ED4A7]">AVAILABLE NOW</p>
        <h2 className="mt-3 text-4xl font-black text-[#0F1424]">Free tier</h2>
        <p className="mt-4 text-base font-semibold leading-relaxed text-[#0F1424]/60">Plan focus blocks, run timed sessions, add movement resets, track progress, and manage your account data from the web app.</p>
        <div className="mt-7">
          <OpenAppButton onOpenApp={onOpenApp}>Open Qithym</OpenAppButton>
        </div>
      </article>
      <article className="rounded-[2rem] bg-[#FF7A5C]/10 p-6 ring-1 ring-[#FF7A5C]/24 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FF7A5C]">COMING LATER</p>
        <h2 className="mt-3 text-3xl font-black text-[#0F1424]">Paid plans</h2>
        <p className="mt-4 text-sm font-semibold leading-relaxed text-[#0F1424]/62">Paid plans may be added later for advanced features such as cloud sync, desktop support, richer history, and team or account upgrades. Nothing is required to start today.</p>
      </article>
    </div>
  </section>
);

const DownloadPage: React.FC<{ onOpenApp: () => void }> = ({ onOpenApp }) => (
  <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
    <PageIntro eyebrow="Download" title="Start with the web app today." detail="Qithym is available in the browser now. Desktop apps and browser extension support are planned after the core web experience is stable." variant="homeHero" />
    <div className="mt-9 grid gap-4 md:grid-cols-3">
      {downloadCards.map(({ name, status, detail, action, active }) => (
        <article key={name} className={`rounded-[2rem] p-6 ring-1 ${active ? 'bg-white ring-[#2ED4A7]/28' : 'bg-[#FF7A5C]/10 ring-[#FF7A5C]/22'}`}>
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${active ? 'text-[#2ED4A7]' : 'text-[#FF7A5C]'}`}>{status}</p>
          <h2 className="mt-3 text-2xl font-black text-[#0F1424]">{name}</h2>
          <p className="mt-3 min-h-16 text-sm font-semibold leading-relaxed text-[#0F1424]/60">{detail}</p>
          {active ? (
            <div className="mt-5"><OpenAppButton onOpenApp={onOpenApp}>{action}</OpenAppButton></div>
          ) : (
            <span className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-black text-[#0F1424]/52 ring-1 ring-[#0F1424]/8">{action}</span>
          )}
        </article>
      ))}
    </div>
    <article className="mt-4 rounded-[2rem] bg-[#8A6CFF]/10 p-6 ring-1 ring-[#8A6CFF]/22">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8A6CFF]">PLANNED</p>
      <h2 className="mt-3 text-2xl font-black text-[#0F1424]">Browser extension</h2>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-[#0F1424]/60">Extension support may come later for quick timer access, gentle browser-side nudges, and status visibility while you work.</p>
    </article>
  </section>
);

const HelpPage: React.FC = () => (
  <section className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
    <PageIntro eyebrow="Help" title="Answers before you start." detail="A few practical notes about the web app, planned platforms, local data, and account controls." variant="homeHero" />
    <div className="mt-9 divide-y divide-[#0F1424]/8 overflow-hidden rounded-[2rem] bg-white/90 shadow-[0_26px_70px_rgba(15,30,51,0.08)] ring-1 ring-[#DDE8EF]">
      {faqRows.map(([question, answer]) => (
        <article key={question} className="p-5 md:p-6">
          <h2 className="text-lg font-black text-[#0F1424]">{question}</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#0F1424]/60">{answer}</p>
        </article>
      ))}
    </div>
  </section>
);

const ContactPage: React.FC = () => (
  <section className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
    <PageIntro eyebrow="Contact" title="Get help with Qithym." detail="Use this page to route account questions, bug reports, data requests, pricing questions, and platform requests." variant="homeHero" />
    <div className="mt-9 grid gap-4 md:grid-cols-2">
      {contactCards.map(([title, detail]) => (
        <article key={title} className="rounded-[1.75rem] bg-white/90 p-6 shadow-[0_26px_70px_rgba(15,30,51,0.08)] ring-1 ring-[#DDE8EF]">
          <h2 className="text-xl font-black text-[#0F1424]">{title}</h2>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-[#0F1424]/60">{detail}</p>
        </article>
      ))}
    </div>
    <div className="mt-6 rounded-[2rem] bg-[#0F1424] p-6 text-white shadow-2xl shadow-[#0F1424]/18">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2ED4A7]">Support contact</p>
      <p className="mt-3 text-2xl font-black">Reach the Qithym team.</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/66">For now, use the support channel shared with your early access account. A dedicated contact form can be added when support operations are ready.</p>
    </div>
  </section>
);

const ChangelogPage: React.FC = () => (
  <section className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
    <PageIntro eyebrow="Changelog" title="What changed recently." detail="A simple record of product updates, platform status, and what is planned next." variant="homeHero" />
    <div className="mt-9 grid gap-4">
      {updates.map(([title, detail], index) => (
        <article key={title} className="grid gap-4 rounded-[1.75rem] bg-white/90 p-5 shadow-[0_26px_70px_rgba(15,30,51,0.08)] ring-1 ring-[#DDE8EF] md:grid-cols-[7rem_1fr]">
          <div>
            <span className="inline-flex rounded-full bg-[#F7FAFC] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1424]/54">
              Update {index + 1}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0F1424]">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#0F1424]/60">{detail}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
);

const PageIntro: React.FC<{ eyebrow: string; title: string; detail: string; variant?: 'default' | 'homeHero' }> = ({ eyebrow, title, detail, variant = 'default' }) => (
  <div>
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4DA6FF]">{eyebrow}</p>
    <h1 className={`mt-3 max-w-4xl text-[#0F1424] ${
      variant === 'homeHero'
        ? 'text-5xl font-extrabold leading-[1.02] md:text-[3.5rem] lg:text-[4.2rem]'
        : 'text-4xl font-black leading-tight md:text-6xl'
    }`}>{title}</h1>
    <p className="mt-5 max-w-3xl text-base font-semibold leading-relaxed text-[#0F1424]/62 md:text-lg">{detail}</p>
  </div>
);

export const PublicPages: React.FC<PublicPagesProps> = ({ route, onOpenApp }) => {
  const page = (() => {
    if (route === 'features') return <FeaturesPage onOpenApp={onOpenApp} />;
    if (route === 'pricing') return <PricingPage onOpenApp={onOpenApp} />;
    if (route === 'download') return <DownloadPage onOpenApp={onOpenApp} />;
    if (route === 'help') return <HelpPage />;
    if (route === 'contact') return <ContactPage />;
    if (route === 'changelog') return <ChangelogPage />;
    return <HomePage onOpenApp={onOpenApp} />;
  })();

  return (
    <PublicShell route={route} onOpenApp={onOpenApp}>
      {page}
    </PublicShell>
  );
};
