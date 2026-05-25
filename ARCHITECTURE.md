# StandLoop - Product Architecture & MVP Plan

## 1. Product Architecture

StandLoop is a Chrome extension (Manifest V3) with a companion landing page. The architecture is local-first and privacy-focused.

### Components:
- **Chrome Extension**: Popup UI, Options page, Background service worker
- **Landing Page**: Marketing site built with React + Vite + Tailwind
- **Shared Types**: TypeScript interfaces for data models

### Key Design Decisions:
- No backend required
- No login system
- All data stored in chrome.storage.local
- Deterministic rules engine (no external AI APIs)
- Privacy-first: no browsing history collection

---

## 2. File Structure

```
/workspace
├── extension/
│   ├── public/
│   │   ├── manifest.json          # Chrome extension manifest V3
│   │   └── icons/                  # Extension icons
│   ├── src/
│   │   ├── popup/
│   │   │   ├── Popup.tsx          # Main popup component
│   │   │   ├── components/        # Popup sub-components
│   │   │   └── index.html         # Popup HTML entry
│   │   ├── options/
│   │   │   ├── Options.tsx        # Settings page
│   │   │   └── index.html         # Options HTML entry
│   │   ├── background/
│   │   │   └── service-worker.ts  # Background timing & notifications
│   │   ├── engine/
│   │   │   ├── rules-engine.ts    # AI-like rules logic
│   │   │   ├── state-machine.ts   # State transitions
│   │   │   └── scoring.ts         # Points & gamification
│   │   ├── storage/
│   │   │   └── local-storage.ts   # chrome.storage.local wrapper
│   │   ├── types/
│   │   │   └── index.ts           # Shared TypeScript types
│   │   └── utils/
│   │       └── helpers.ts         # Utility functions
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── landing/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── App.tsx                # Main landing page
│   │   ├── components/            # Landing page sections
│   │   │   ├── Header.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── PainComparison.tsx
│   │   │   ├── ScienceSection.tsx
│   │   │   ├── ExtensionSection.tsx
│   │   │   ├── FeaturesGrid.tsx
│   │   │   ├── GamificationSection.tsx
│   │   │   ├── Pricing.tsx
│   │   │   └── FinalCTA.tsx
│   │   ├── styles/
│   │   │   └── index.css          # Tailwind imports
│   │   └── main.tsx               # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md                       # Setup instructions
```

---

## 3. Data Model

### Settings Interface
```typescript
interface UserSettings {
  reminderIntervalMinutes: number;      // Default: 45
  breakDurationMinutes: number;         // Default: 3
  driftWarningMinutes: number;          // Default: 8
  quietHoursStart: number;              // 0-23, default: 22
  quietHoursEnd: number;                // 0-23, default: 7
  reminderTone: 'gentle' | 'direct' | 'playful';
  gamificationEnabled: boolean;
  soundEnabled: boolean;
  deepWorkModeEnabled: boolean;
}
```

### Session Interface
```typescript
interface FocusSession {
  active: boolean;
  startedAt: number;                    // Timestamp
  lastBreakAt: number | null;           // Timestamp
  currentState: SessionState;
  skippedReminders: number;
  completedBreaks: number;
  sitTimeMinutes: number;
}
```

### Daily Stats Interface
```typescript
interface DailyStats {
  date: string;                         // YYYY-MM-DD
  focusMinutes: number;
  movementBreaks: number;
  skippedReminders: number;
  flowSafeReturns: number;
  points: number;
  badgesEarned: string[];
}
```

### Session States
```typescript
type SessionState = 
  | 'idle'
  | 'focus'
  | 'sitting-too-long'
  | 'break-suggested'
  | 'break-active'
  | 'break-drifting'
  | 'returned';
```

---

## 4. State Machine

### State Transitions

```
IDLE 
  └─[Start Focus Session]→ FOCUS

FOCUS
  ├─[Sit time > threshold]→ SITTING-TOO-LONG
  └─[End session]→ IDLE

SITTING-TOO-LONG
  └─[Auto or user trigger]→ BREAK-SUGGESTED

BREAK-SUGGESTED
  ├─[Start break]→ BREAK-ACTIVE
  ├─[Skip]→ FOCUS (with skip count incremented)
  └─[Delay]→ FOCUS (temporary)

BREAK-ACTIVE
  ├─[Break time < limit]→ RETURNED
  ├─[Break time > drift threshold]→ BREAK-DRIFTING
  └─[Cancel]→ FOCUS

BREAK-DRIFTING
  ├─[Return]→ RETURNED
  └─[Continue ignoring]→ BREAK-DRIFTING (repeated nudges)

RETURNED
  ├─[Award points, update stats]→ FOCUS
  └─[End session]→ IDLE
```

---

## 5. Scoring Logic

### Point System
```typescript
const SCORING = {
  onTimeStand: 5,           // Take break when reminded
  completeShortBreak: 10,   // Finish a 2-5 min break
  returnBeforeDrift: 5,     // Return before drift warning
  notSkipping: 3,           // Don't skip reminder
  threeBreaksBonus: 2,      // Complete 3 breaks in a day
  dailyCap: 100,            // Max points per day
};
```

### Badge Conditions
```typescript
const BADGES = {
  'first-stand': 'Complete your first stand break',
  'flow-saver': 'Return from break in under 3 minutes',
  'no-zombie-sitting': 'Take a break before 60 minutes of sitting',
  'three-tiny-resets': 'Complete 3 short breaks in one day',
  'deep-work-defender': 'Complete a 90+ minute focus session with breaks',
  'back-before-drift': 'Return before drift warning 5 times',
  'five-day-streak': 'Use StandLoop 5 days in a row',
  'chair-defeated': 'Earn 500 total points',
  'tiny-reset-pro': 'Complete 20 short breaks total',
  'builder-in-motion': 'Earn all other badges',
};
```

---

## 6. Landing Page Section Map

1. **Header** - Logo, Nav, CTA
2. **Hero** - Headline, Subheadline, CTAs, Privacy note
3. **Product Visual** - Mock popup screenshot
4. **How It Works** - 3 steps
5. **Pain Comparison** - Before/After cards
6. **Science-Informed** - Public health framing
7. **Extension Section** - Chrome integration
8. **Features Grid** - 8 feature cards
9. **Gamification** - Points, streaks, badges
10. **Pricing** - Free tier shown, Pro teased
11. **Final CTA** - Closing pitch

---

## 7. MVP Build Plan

### Phase 1: Core Extension (Priority)
1. Set up Vite + React + TypeScript for extension
2. Create manifest.json for Chrome MV3
3. Build basic popup UI with timer display
4. Implement background service worker with alarms
5. Add chrome.storage.local for settings & stats
6. Create state machine logic
7. Build rules engine (deterministic)
8. Add notification system
9. Implement scoring & badges
10. Create options/settings page

### Phase 2: Landing Page
1. Set up Vite + React + Tailwind
2. Build all 11 sections
3. Add responsive design
4. Include mockup visuals
5. Polish copy and tone

### Phase 3: Polish & Test
1. Test extension loading in Chrome
2. Verify all state transitions
3. Test notifications
4. Review copy for tone consistency
5. Write README with setup instructions

---

## 8. Reminder Examples by Tone

### Gentle
- "Good moment for a short stand reset."
- "A tiny movement break could help here."
- "Your body might appreciate a quick stretch."

### Direct
- "Stand up for 2 minutes."
- "You have been sitting too long. Move briefly, then return."
- "Time for a movement break now."

### Playful
- "The chair is winning. Time to stand."
- "Tiny leg reboot. Then back to the build."
- "Stand up before the chair becomes your co-founder."

---

## 9. Break Types Library

```typescript
const BREAK_TYPES = [
  { name: 'Stand and breathe', duration: 60, description: 'Just stand and take 5 deep breaths' },
  { name: 'Shoulder roll and neck reset', duration: 90, description: 'Roll shoulders, gentle neck stretches' },
  { name: 'Walk to water and back', duration: 120, description: 'Quick hydration trip' },
  { name: 'Window reset', duration: 120, description: 'Look at something 20 feet away' },
  { name: 'Gentle desk stretch', duration: 180, description: 'Hamstring, hip flexor, arm stretches' },
  { name: 'Longer walk', duration: 300, description: 'Only after very long sessions', condition: 'longSession' },
];
```

---

## 10. Privacy Commitment

- All data stored locally using chrome.storage.local
- No browsing history collected
- No page content read
- No data sent to servers
- No login required
- No tracking pixels or analytics
- Open about what we store and why

---

This document serves as the blueprint for building the StandLoop MVP.
