export type LegalKind = 'privacy' | 'terms';

type LegalRow = readonly [label: string, detail: string];

interface LegalContent {
  eyebrow: string;
  title: string;
  intro: string;
  rows: readonly LegalRow[];
}

export const LEGAL_LAST_UPDATED = 'May 26, 2026';

export const legalContent: Record<LegalKind, LegalContent> = {
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    intro: 'This policy explains what Qithym stores, what is account-owned, what is local-only in this build, and what deletion does.',
    rows: [
      ['Account data', 'Email address, display name, account ID, session metadata, and password verifier data are stored so you can sign in and recover access. Passwords are never stored in plain text.'],
      ['Timer data', 'Settings, current session state, daily stats, history, points, streaks, and badges are account-owned and associated with your stable user ID.'],
      ['Sync status', 'The identity model is ready for web, desktop, and extension clients. This build stores account data locally in this browser until a shared cloud backend is connected.'],
      ['Platform status', 'The web app is available now. Desktop apps are coming soon, and the browser extension is coming later. Future clients should not be treated as synced until cloud sync exists.'],
      ['Deletion', 'Deleting your account removes the local account record and account-owned timer data on this device. Export your data first if you want a copy.'],
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Terms of Service',
    intro: 'These terms explain the boundaries of using Qithym and how account-owned timer data is handled.',
    rows: [
      ['Use of Qithym', 'Qithym is a focus and movement timer. It is not medical advice, productivity coaching, or a guarantee of health outcomes.'],
      ['Your account', 'You are responsible for keeping your sign-in method secure. Do not use a password you share with other services.'],
      ['Your data', 'You own your timer data. The app provides export and deletion controls from the account area.'],
      ['Availability', 'Local-only data can be lost if browser storage is cleared. Cloud sync, subscriptions, desktop installers, and extension identity are future integrations prepared by the account model.'],
      ['Pricing', 'Early web access is available before subscription billing is connected. Subscription features should be treated as coming soon until billing is live.'],
    ],
  },
};
