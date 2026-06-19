# cAI

A fully local, privacy-first daily health & productivity companion built with Expo.

Track food, water, habits, focus sessions, and mood — all on-device with MMKV, zero cloud sync. Optionally bring your own AI key (Groq, OpenAI, Anthropic, etc.) for smart coaching.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS or later |
| npm | 10+ (comes with Node 20) |
| Expo CLI | `npm i -g expo-cli` (or use `npx expo`) |
| Expo Go app | iOS App Store / Google Play — for physical device testing |

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-handle/dayos.git
cd dayos

# 2. Install dependencies
npm install

# 3. Start the dev server
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for iOS simulator / `a` for Android emulator.

---

## Running on a Device

### iOS (physical device)
```bash
npx expo start --tunnel   # Use tunnel if on a different network
```
Scan the QR code from Expo Go.

### Android
```bash
npx expo start
```
Scan the QR code from Expo Go (Android) or press `a` to open in an emulator.

### iOS Simulator (macOS only)
```bash
npx expo start --ios
```

### Android Emulator
```bash
npx expo start --android
```

---

## Adding an AI API Key

cAI is **BYOK** (Bring Your Own Key). No keys are stored in the repo or environment variables — everything lives on-device in encrypted MMKV storage.

1. Open the app and complete onboarding, or tap **Settings → AI Companion**.
2. Choose a provider:
   - **Groq** — fastest & free tier available. Get a key at [console.groq.com](https://console.groq.com)
   - **OpenRouter** — 200+ models, free tier. Get a key at [openrouter.ai](https://openrouter.ai)
   - **OpenAI** — GPT-4o etc. [platform.openai.com](https://platform.openai.com)
   - **Anthropic** — Claude models. [console.anthropic.com](https://console.anthropic.com)
   - **Gemini** — Google models. [aistudio.google.com](https://aistudio.google.com)
   - **Ollama** — fully local, no key needed. Run Ollama locally and set the base URL.
3. Paste your API key and tap **Test Connection**.
4. The 💬 floating button appears on all tab screens once AI is configured.

---

## Environment Variables

**None required.** All API keys are entered in-app and stored locally in encrypted MMKV. There is no `.env` file.

---

## Folder Structure

```
dayos/
├── app/                        # Expo Router screens
│   ├── (tabs)/                 # Main tab screens
│   │   ├── index.tsx           # Home dashboard
│   │   ├── focus.tsx           # Pomodoro focus timer
│   │   ├── food.tsx            # Calorie & macro tracking
│   │   ├── water.tsx           # Water intake tracker
│   │   ├── habits.tsx          # Habits + Reflect tabs
│   │   └── settings.tsx        # All app settings
│   ├── onboarding/             # 6-step onboarding flow
│   └── _layout.tsx             # Root layout (store init, splash, toast)
│
├── components/
│   ├── ai/                     # AICard, AIChatSheet
│   ├── focus/                  # FocusRing, SessionDots, TaskSelector
│   ├── food/                   # MealSection, FoodSearchBar, AddMealSheet …
│   ├── habits/                 # HabitRow, AddHabitSheet
│   ├── health/                 # SleepLogger, WeightEntry, WorkoutLogger
│   ├── providers/              # ToastProvider (global toasts)
│   ├── settings/               # SettingsSection, SettingsRow
│   ├── ui/                     # Design system: Button, Card, Input, …
│   ├── water/                  # BottleDisplay, WaterLogHistory
│   ├── AppBootstrap.tsx        # Permission + pedometer side effects
│   ├── AppSplash.tsx           # Animated splash screen
│   └── MorningBriefingModal.tsx
│
├── data/
│   ├── indianFoods.ts          # Offline food database (Indian cuisine)
│   ├── defaultHabits.ts        # 6 habit templates for new users
│   ├── providers.ts            # AI provider configs & request builders
│   └── aiPrompts.ts            # Prompt templates for each AI feature
│
├── hooks/
│   ├── useAI.ts                # All AI interactions (nudges, chat, estimates)
│   ├── useDebouncedValue.ts    # Generic debounce hook
│   ├── useDayRollover.ts       # Detects midnight and resets daily state
│   ├── useFoodSearch.ts        # 3-layer search: local → OFF API → AI
│   ├── useFocusChime.ts        # Pomodoro audio cue
│   ├── useNotifications.ts     # Schedule / cancel push notifications
│   ├── usePedometer.ts         # Step counting via expo-pedometer
│   ├── useTimer.ts             # Countdown timer for focus sessions
│   └── useToast.ts             # Access global toast from any component
│
├── store/
│   ├── useAppStore.ts          # Zustand store — all app state + MMKV persist
│   ├── useOnboardingStore.ts   # Onboarding draft (separate MMKV instance)
│   └── finishOnboarding.ts     # Seed habits + schedule notifications on finish
│
├── types/
│   └── index.ts                # All shared TypeScript interfaces
│
├── utils/
│   ├── ai.ts                   # isAIConfigured helper
│   ├── date.ts                 # Date helpers (getTodayString, etc.)
│   ├── habitStreak.ts          # Streak calculation helpers
│   ├── notificationScheduler.ts # Schedule OS notifications
│   ├── storage.ts              # MMKV read/write helpers
│   ├── tdee.ts                 # BMR, TDEE, calorie goal calculations
│   └── units.ts                # kg↔lbs, cm↔ft conversion
│
├── app.json                    # Expo config (permissions, icons, splash)
└── package.json
```

---

## Adding Foods to the Database

The offline food database lives in `data/indianFoods.ts`. Each entry follows the `FoodItem` interface:

```typescript
// types/index.ts
interface FoodItem {
  id: string;            // unique, e.g. "idli_plain"
  name: string;          // display name
  calories: number;      // per serving
  protein: number;       // grams per serving
  carbs: number;         // grams per serving
  fat: number;           // grams per serving
  servingSize: number;   // numeric (e.g. 2)
  servingUnit: string;   // e.g. "pieces", "cup", "g"
  category: string;      // e.g. "breakfast", "snack"
  tags?: string[];       // optional search keywords
  source?: string;       // "local" | "api" | "ai_estimate"
}
```

**To add a food:**
1. Open `data/indianFoods.ts`.
2. Add a new object to the `indianFoods` array.
3. The local search (`searchFoods`) uses a simple substring + tag match — no indexing required.

For foods not in the local DB, the app automatically falls back to the **Open Food Facts** API and then to **AI estimation** if needed.

---

## Architecture Notes

- **All data is local.** MMKV is used for all persistence — no Firebase, no Supabase.
- **AI is optional.** Every screen works without an API key; AI features are gracefully hidden.
- **Day rollover** is handled on every foreground resume: `useDayRollover` compares `lastActiveDate` in `appPreferences` with today's date and resets daily slices if they differ.
- **Store slices** are subscribed to individually (`useAppStore(s => s.profile)`) to minimise re-renders.
- **Notifications** are scheduled via `expo-notifications` repeating triggers at specific times — no background fetch needed.

---

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project (first time)
eas build:configure

# Build for iOS (requires Apple Developer account)
eas build --platform ios

# Build for Android
eas build --platform android
```

See the [EAS Build docs](https://docs.expo.dev/build/introduction/) for signing and submission.
#   D a y O S  
 