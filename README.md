# cAI

A fully local, privacy-first daily health companion built with **Expo SDK 54** and React Native.

Track food, water, habits, steps, sleep, and mood — all on-device with **AsyncStorage**, zero cloud sync. Optionally bring your own AI key (Groq, OpenAI, Anthropic, etc.) for smart coaching.

> **Your AI coach for everyday life.**

---

## Features

| Area | What it does |
|------|----------------|
| **Home** | Day score, habits snapshot, water & food progress, steps card |
| **Health** | Steps (hardware pedometer), sleep, workouts, weight, 7-day history |
| **Food** | Calorie & macro tracking with local Indian food DB + API/AI fallback |
| **Water** | Animated bottle, daily goal, log history |
| **Habits** | Daily check-ins, streaks, journal & mood reflect tabs |
| **Settings** | Profile, themes, notifications, AI companion (BYOK) |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS or later |
| npm | 10+ (comes with Node 20) |
| Expo CLI | Use `npx expo` (no global install required) |
| Expo Go | iOS App Store / Google Play — for most dev testing |
| EAS CLI | `npm i -g eas-cli` — for production APK/IPA builds |

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/Rithik-Sharon-A/devlife-os.git
cd devlife-os

# 2. Install dependencies
npm install

# 3. Start the dev server
npx expo start
```

Scan the QR code with **Expo Go**, or press `i` for iOS simulator / `a` for Android emulator.

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

Scan the QR code from Expo Go or press `a` for an emulator.

### iOS Simulator (macOS only)

```bash
npx expo start --ios
```

### Android Emulator

```bash
npx expo start --android
```

### Step counting on Android

Steps use **`expo-sensors` `Pedometer`** (hardware `TYPE_STEP_COUNTER` sensor). For full permission support and reliable step access:

1. Build an APK with EAS (see [Building for Production](#building-for-production)).
2. On first open of the **Health** tab, allow **Physical Activity** when prompted.
3. If denied: **Open Settings → Apps → cAI → Permissions → Physical Activity → Allow**, then tap **Try Again**.

Expo Go works for basic step testing; a dev client or EAS APK is recommended on Android.

---

## Adding an AI API Key

cAI is **BYOK** (Bring Your Own Key). No keys are stored in the repo or in environment variables — everything lives on-device in AsyncStorage.

1. Open the app and complete onboarding, or go to **Settings → AI Companion**.
2. Choose a provider:
   - **Groq** — fast, free tier. [console.groq.com](https://console.groq.com)
   - **OpenRouter** — 200+ models, free tier. [openrouter.ai](https://openrouter.ai)
   - **OpenAI** — GPT-4o etc. [platform.openai.com](https://platform.openai.com)
   - **Anthropic** — Claude models. [console.anthropic.com](https://console.anthropic.com)
   - **Gemini** — Google models. [aistudio.google.com](https://aistudio.google.com)
   - **Ollama** — fully local, no key needed. Run Ollama locally and set the base URL.
3. Paste your API key and tap **Test Connection**.
4. The 💬 floating button appears on tab screens once AI is configured.

---

## Environment Variables

**None required.** All API keys are entered in-app and stored locally. There is no `.env` file.

---

## Folder Structure

```
devlife-os/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── index.tsx             # Home dashboard
│   │   ├── health.tsx            # Steps, sleep, workouts, weight
│   │   ├── food/                 # Food stack (index, add-meal, meal-detail)
│   │   ├── water.tsx             # Water intake tracker
│   │   ├── habits.tsx            # Habits + reflect/journal
│   │   └── settings.tsx          # App settings
│   ├── onboarding/               # Multi-step onboarding flow
│   ├── morning.tsx               # Morning ritual screen
│   └── _layout.tsx               # Root layout (bootstrap, splash, theme)
│
├── components/
│   ├── ai/                       # AICard, AIChatSheet
│   ├── food/                     # MealSection, FoodSearchBar, AddMealSheet …
│   ├── habits/                   # HabitRow, AddHabitSheet
│   ├── health/                   # StepsCard, SleepLogger, WorkoutLogger, WeightEntry
│   ├── onboarding/               # OnboardingShell, TimePickerField
│   ├── providers/                # ToastProvider, CelebrationProvider
│   ├── settings/                 # SettingsSection, ThemePicker, ModelPicker
│   ├── ui/                       # Design system: Button, Card, Input, theme …
│   ├── water/                    # WaterBottle, WaterLogHistory
│   ├── AppBootstrap.tsx          # App init side effects
│   ├── AppSplash.tsx             # Animated splash screen
│   └── MorningBriefingModal.tsx
│
├── context/
│   └── ThemeContext.tsx          # Midnight theme + user theme preference
│
├── data/
│   ├── indianFoods.ts            # Offline food database (Indian cuisine)
│   ├── defaultHabits.ts          # Habit templates for new users
│   ├── providers.ts              # AI provider configs & request builders
│   ├── aiPrompts.ts              # Prompt templates for AI features
│   └── celebrationConfigs.ts     # Milestone celebration definitions
│
├── hooks/
│   ├── useAI.ts                  # AI nudges, chat, food estimates
│   ├── useCelebration.ts         # Celebration triggers
│   ├── useDayRollover.ts         # Midnight reset on foreground resume
│   ├── useDebouncedValue.ts      # Generic debounce hook
│   ├── useFoodSearch.ts          # Search: local → Open Food Facts → AI
│   ├── useNotifications.ts       # Push notification scheduling
│   ├── useStepCounter.ts         # Step counting via expo-sensors Pedometer
│   └── useToast.ts               # Global toast access
│
├── plugins/
│   └── withActivityRecognition.js  # Forces ACTIVITY_RECOGNITION in Android manifest
│
├── store/
│   ├── useAppStore.ts            # Zustand + Immer — all app state, AsyncStorage persist
│   ├── useOnboardingStore.ts     # Onboarding draft state
│   └── finishOnboarding.ts       # Seed habits + schedule notifications on finish
│
├── types/
│   ├── index.ts                  # Shared TypeScript interfaces
│   └── celebrations.ts           # Celebration event types
│
├── utils/
│   ├── ai.ts                     # isAIConfigured helper
│   ├── appBrand.ts               # APP_NAME, tagline (single source of truth)
│   ├── date.ts                   # Date helpers
│   ├── designTokens.ts           # Spacing, radii, typography tokens
│   ├── foodNavigation.ts         # Food stack navigation helpers
│   ├── habitStreak.ts            # Streak calculation
│   ├── notificationScheduler.ts  # OS notification scheduling
│   ├── storage.ts                # AsyncStorage read/write layer
│   ├── tdee.ts                   # BMR, TDEE, calorie goal math
│   └── units.ts                  # kg↔lbs, cm↔ft conversion
│
├── app.json                      # Expo config (permissions, plugins, EAS)
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
  nameLocal?: string;    // optional regional name
  calories: number;      // per serving
  protein: number;       // grams per serving
  carbs: number;         // grams per serving
  fat: number;           // grams per serving
  servingSize: number;   // numeric (e.g. 2)
  servingUnit: string;   // e.g. "pieces", "cup", "g"
  category: FoodCategory;
  tags: string[];        // search keywords
  source: FoodSource;    // "local" | "api" | "ai_estimate"
}
```

**To add a food:**

1. Open `data/indianFoods.ts`.
2. Add a new object to the `indianFoods` array.
3. Local search uses substring + tag match — no indexing required.

For foods not in the local DB, the app falls back to the **Open Food Facts** API and then **AI estimation** if needed.

---

## Architecture Notes

- **All data is local.** AsyncStorage (via `utils/storage.ts` and Zustand persist) — no Firebase, no Supabase.
- **AI is optional.** Every screen works without an API key; AI features are hidden until configured.
- **Day rollover** runs on foreground resume: `useDayRollover` compares `lastActiveDate` with today and resets daily slices when the date changes.
- **Store slices** are subscribed individually (`useAppStore(s => s.profile)`) to minimise re-renders.
- **Notifications** use `expo-notifications` repeating triggers at configured times.
- **Android permissions** for steps are injected via `plugins/withActivityRecognition.js` plus `android.permissions` in `app.json`.

---

## Scripts

```bash
npm start                  # expo start
npm run android            # expo run:android (dev client)
npm run ios                # expo run:ios
npm run web                # expo start --web
npm run type-check         # tsc --noEmit
npm run build:android:preview   # EAS preview APK
npm run build:production        # EAS production build
```

---

## Building for Production

```bash
# Install EAS CLI (first time)
npm install -g eas-cli

# Log in and configure (first time)
eas login
eas build:configure

# Android preview APK (internal testing)
npm run build:android:preview
# or
eas build --platform android --profile preview

# Production
npm run build:production
```

See the [EAS Build docs](https://docs.expo.dev/build/introduction/) for signing and store submission.

---

## License

MIT
