import AsyncStorage from "@react-native-async-storage/async-storage";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";

import type {
  AIConfig,
  AppPreferences,
  BodyMetricLog,
  DailyFoodLog,
  FocusConfig,
  FocusSession,
  GratitudeEntry,
  Habit,
  HabitLog,
  HabitStreak,
  JournalEntry,
  MoodLog,
  NotificationConfig,
  SleepLog,
  StepLog,
  Task,
  UserProfile,
  WaterConfig,
  WaterLog,
  WorkoutLog,
} from "../types";

import {
  dateFromTimestamp,
  getLast7Days,
  getLastNDays,
  getNowString,
  getTodayString,
} from "./date";
import { DEFAULT_HABIT_TEMPLATES } from "../data/defaultHabits";

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  USER_PROFILE:       "dayos:profile",
  AI_CONFIG:          "dayos:aiconfig",
  FOOD_LOGS:          "dayos:food",
  WATER_LOGS:         "dayos:water",
  TASKS:              "dayos:tasks",
  HABITS:             "dayos:habits",
  HABIT_LOGS:         "dayos:habitlogs",
  SLEEP_LOGS:         "dayos:sleep",
  WORKOUT_LOGS:       "dayos:workouts",
  BODY_METRICS:       "dayos:metrics",
  MOOD_LOGS:          "dayos:mood",
  JOURNAL_ENTRIES:    "dayos:journal",
  GRATITUDE_ENTRIES:  "dayos:gratitude",
  FOCUS_SESSIONS:     "dayos:focus",
  STEP_LOGS:          "dayos:steps",
  NOTIFICATION_CONFIG:"dayos:notifications",
  APP_PREFERENCES:    "dayos:appprefs",
  WATER_CONFIG:       "dayos:waterconfig",
  FOCUS_CONFIG:       "dayos:focusconfig",
} as const;

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  waterReminder: { enabled: true, times: ["10:00", "14:00", "18:00"] },
  mealReminder: {
    enabled: true,
    breakfastTime: "08:00",
    lunchTime: "13:00",
    dinnerTime: "20:00",
  },
  focusReminder: { enabled: true, time: "09:00" },
  eveningCheckin: { enabled: true, time: "21:00" },
  morningBriefing: { enabled: true, time: "07:30" },
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  weightUnit: "kg",
  heightUnit: "cm",
  showStepsOnDashboard: true,
  manualCalorieOverride: false,
  manualCalorieGoal: 2000,
  stepGoal: 8000,
  lastActiveDate: "",
  hasSeenMorningBriefing: false,
  theme: "midnight",
};

export const DEFAULT_WATER_CONFIG: WaterConfig = {
  bottleSizeMl: 500,
  dailyGoalBottles: 6,
};

export const DEFAULT_FOCUS_CONFIG: FocusConfig = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // swallow write errors
  }
}

async function getRecord<T>(key: string): Promise<Record<string, T>> {
  return (await getJSON<Record<string, T>>(key)) ?? {};
}

async function getArray<T>(key: string): Promise<T[]> {
  return (await getJSON<T[]>(key)) ?? [];
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((i) => i.id === item.id);
  if (index === -1) return [...items, item];
  const next = [...items];
  next[index] = item;
  return next;
}

function isWithinLastDays(dateString: string, days: number): boolean {
  const cutoff = getLastNDays(days)[0];
  return dateString >= cutoff;
}

// ─── User profile ─────────────────────────────────────────────────────────────

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await setJSON(KEYS.USER_PROFILE, profile);
}

export async function getUserProfile(): Promise<UserProfile | null> {
  return getJSON<UserProfile>(KEYS.USER_PROFILE);
}

// ─── AI config ────────────────────────────────────────────────────────────────

export async function saveAIConfig(config: AIConfig): Promise<void> {
  await setJSON(KEYS.AI_CONFIG, config);
}

export async function getAIConfig(): Promise<AIConfig | null> {
  return getJSON<AIConfig>(KEYS.AI_CONFIG);
}

// ─── Food ─────────────────────────────────────────────────────────────────────

export async function saveTodayFoodLog(log: DailyFoodLog): Promise<void> {
  const logs = await getRecord<DailyFoodLog>(KEYS.FOOD_LOGS);
  logs[log.date] = log;
  await setJSON(KEYS.FOOD_LOGS, logs);
}

export async function getFoodLog(date: string): Promise<DailyFoodLog | null> {
  const logs = await getRecord<DailyFoodLog>(KEYS.FOOD_LOGS);
  return logs[date] ?? null;
}

export async function getAllFoodLogs(): Promise<DailyFoodLog[]> {
  const logs = await getRecord<DailyFoodLog>(KEYS.FOOD_LOGS);
  return Object.values(logs).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Water ────────────────────────────────────────────────────────────────────

export async function saveWaterLog(log: WaterLog): Promise<void> {
  const date = dateFromTimestamp(log.timestamp);
  const logs = await getRecord<WaterLog>(KEYS.WATER_LOGS);
  const existing = logs[date];

  logs[date] = existing
    ? {
        ...existing,
        bottleCount: existing.bottleCount + log.bottleCount,
        totalMl: existing.totalMl + log.totalMl,
        timestamp: log.timestamp,
        entries: [...(existing.entries ?? []), ...(log.entries ?? [])],
      }
    : { ...log, id: log.id || date, entries: log.entries ?? [] };

  await setJSON(KEYS.WATER_LOGS, logs);
}

export async function getTodayWaterLog(): Promise<WaterLog | null> {
  const logs = await getRecord<WaterLog>(KEYS.WATER_LOGS);
  return logs[getTodayString()] ?? null;
}

export async function setWaterLogForDate(date: string, log: WaterLog): Promise<void> {
  const logs = await getRecord<WaterLog>(KEYS.WATER_LOGS);
  logs[date] = log;
  await setJSON(KEYS.WATER_LOGS, logs);
}

export async function deleteWaterLogForDate(date: string): Promise<void> {
  const logs = await getRecord<WaterLog>(KEYS.WATER_LOGS);
  delete logs[date];
  await setJSON(KEYS.WATER_LOGS, logs);
}

export async function getAllWaterLogs(): Promise<Record<string, WaterLog>> {
  return getRecord<WaterLog>(KEYS.WATER_LOGS);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function replaceTasks(tasks: Task[]): Promise<void> {
  await setJSON(KEYS.TASKS, tasks);
}

export async function saveTask(task: Task): Promise<void> {
  const tasks = await getArray<Task>(KEYS.TASKS);
  await setJSON(KEYS.TASKS, upsertById(tasks, task));
}

export async function getTasks(): Promise<Task[]> {
  return getArray<Task>(KEYS.TASKS);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const tasks = await getArray<Task>(KEYS.TASKS);
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return;
  tasks[index] = { ...tasks[index], ...updates };
  await setJSON(KEYS.TASKS, tasks);
}

export async function deleteTask(id: string): Promise<void> {
  const tasks = await getArray<Task>(KEYS.TASKS);
  await setJSON(KEYS.TASKS, tasks.filter((t) => t.id !== id));
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export async function replaceHabits(habits: Habit[]): Promise<void> {
  await setJSON(KEYS.HABITS, habits);
}

export async function saveHabit(habit: Habit): Promise<void> {
  const habits = await getArray<Habit>(KEYS.HABITS);
  await setJSON(KEYS.HABITS, upsertById(habits, habit));
}

export async function getHabits(): Promise<Habit[]> {
  return getArray<Habit>(KEYS.HABITS);
}

export async function seedDefaultHabitsIfEmpty(): Promise<Habit[]> {
  const existing = await getHabits();
  if (existing.length > 0) return existing;

  const seeded: Habit[] = DEFAULT_HABIT_TEMPLATES.slice(0, 5).map((template, index) => ({
    ...template,
    id: `default_habit_${index}_${Date.now()}`,
    isActive: true,
    createdAt: getNowString(),
  }));

  await replaceHabits(seeded);
  return seeded;
}

export async function replaceHabitLogs(logs: HabitLog[]): Promise<void> {
  await setJSON(KEYS.HABIT_LOGS, logs);
}

export async function saveHabitLog(log: HabitLog): Promise<void> {
  const logs = await getArray<HabitLog>(KEYS.HABIT_LOGS);
  const index = logs.findIndex(
    (l) => l.habitId === log.habitId && l.date === log.date
  );

  if (index === -1) {
    logs.push(log);
  } else {
    logs[index] = log;
  }

  await setJSON(KEYS.HABIT_LOGS, logs);
}

export async function getHabitLogs(habitId: string, days: number): Promise<HabitLog[]> {
  const cutoff = getLastNDays(days)[0];
  const logs = await getArray<HabitLog>(KEYS.HABIT_LOGS);
  return logs
    .filter((l) => l.habitId === habitId && l.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAllHabitLogs(): Promise<HabitLog[]> {
  return getArray<HabitLog>(KEYS.HABIT_LOGS);
}

export async function calculateStreak(habitId: string): Promise<HabitStreak> {
  const allLogs = (await getArray<HabitLog>(KEYS.HABIT_LOGS)).filter(
    (l) => l.habitId === habitId
  );
  const completedDates = new Set(
    allLogs.filter((l) => l.isCompleted).map((l) => l.date)
  );

  const last7Days = getLast7Days().map((date) => completedDates.has(date));

  let currentStreak = 0;
  const today = getTodayString();
  const startOffset = completedDates.has(today) ? 0 : 1;

  for (let i = startOffset; i < 365; i++) {
    const checkDate = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (completedDates.has(checkDate)) {
      currentStreak++;
    } else {
      break;
    }
  }

  const sortedDates = [...completedDates].sort();
  let longestStreak = 0;
  let run = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const current = parseISO(dateStr);
    if (prevDate && differenceInCalendarDays(current, prevDate) === 1) {
      run++;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prevDate = current;
  }

  return { habitId, currentStreak, longestStreak, last7Days };
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

export async function saveSleepLog(log: SleepLog): Promise<void> {
  const logs = await getRecord<SleepLog>(KEYS.SLEEP_LOGS);
  logs[log.date] = log;
  await setJSON(KEYS.SLEEP_LOGS, logs);
}

export async function getSleepLog(date: string): Promise<SleepLog | null> {
  const logs = await getRecord<SleepLog>(KEYS.SLEEP_LOGS);
  return logs[date] ?? null;
}

export async function getSleepHistory(days: number): Promise<SleepLog[]> {
  const logs = await getRecord<SleepLog>(KEYS.SLEEP_LOGS);
  return Object.values(logs)
    .filter((l) => isWithinLastDays(l.date, days))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Workouts ─────────────────────────────────────────────────────────────────

export async function saveWorkoutLog(log: WorkoutLog): Promise<void> {
  const workouts = await getArray<WorkoutLog>(KEYS.WORKOUT_LOGS);
  await setJSON(KEYS.WORKOUT_LOGS, upsertById(workouts, log));
}

export async function getTodayWorkouts(): Promise<WorkoutLog[]> {
  const today = getTodayString();
  const workouts = await getArray<WorkoutLog>(KEYS.WORKOUT_LOGS);
  return workouts.filter((l) => l.date === today);
}

export async function getWorkoutHistory(days: number): Promise<WorkoutLog[]> {
  const workouts = await getArray<WorkoutLog>(KEYS.WORKOUT_LOGS);
  return workouts
    .filter((l) => isWithinLastDays(l.date, days))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function replaceWorkouts(workouts: WorkoutLog[]): Promise<void> {
  await setJSON(KEYS.WORKOUT_LOGS, workouts);
}

// ─── Body metrics ─────────────────────────────────────────────────────────────

export async function saveBodyMetric(log: BodyMetricLog): Promise<void> {
  const metrics = await getArray<BodyMetricLog>(KEYS.BODY_METRICS);
  await setJSON(KEYS.BODY_METRICS, upsertById(metrics, log));
}

export async function getBodyMetrics(days: number): Promise<BodyMetricLog[]> {
  const metrics = await getArray<BodyMetricLog>(KEYS.BODY_METRICS);
  return metrics
    .filter((l) => isWithinLastDays(l.date, days))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLatestWeight(): Promise<BodyMetricLog | null> {
  const metrics = await getArray<BodyMetricLog>(KEYS.BODY_METRICS);
  if (metrics.length === 0) return null;
  return [...metrics].sort((a, b) => b.date.localeCompare(a.date))[0];
}

// ─── Mood ─────────────────────────────────────────────────────────────────────

export async function saveMoodLog(log: MoodLog): Promise<void> {
  const logs = await getRecord<MoodLog>(KEYS.MOOD_LOGS);
  logs[log.date] = log;
  await setJSON(KEYS.MOOD_LOGS, logs);
}

export async function getMoodLog(date: string): Promise<MoodLog | null> {
  const logs = await getRecord<MoodLog>(KEYS.MOOD_LOGS);
  return logs[date] ?? null;
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const entries = await getArray<JournalEntry>(KEYS.JOURNAL_ENTRIES);
  await setJSON(KEYS.JOURNAL_ENTRIES, upsertById(entries, entry));
}

export async function getJournalEntries(limit: number): Promise<JournalEntry[]> {
  const entries = await getArray<JournalEntry>(KEYS.JOURNAL_ENTRIES);
  return entries
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, Math.max(0, limit));
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const entries = await getArray<JournalEntry>(KEYS.JOURNAL_ENTRIES);
  await setJSON(KEYS.JOURNAL_ENTRIES, entries.filter((e) => e.id !== id));
}

// ─── Gratitude ────────────────────────────────────────────────────────────────

export async function saveGratitudeEntry(entry: GratitudeEntry): Promise<void> {
  const logs = await getRecord<GratitudeEntry>(KEYS.GRATITUDE_ENTRIES);
  logs[entry.date] = entry;
  await setJSON(KEYS.GRATITUDE_ENTRIES, logs);
}

export async function getGratitudeEntry(date: string): Promise<GratitudeEntry | null> {
  const logs = await getRecord<GratitudeEntry>(KEYS.GRATITUDE_ENTRIES);
  return logs[date] ?? null;
}

// ─── Focus sessions ───────────────────────────────────────────────────────────

export async function saveFocusSession(session: FocusSession): Promise<void> {
  const sessions = await getArray<FocusSession>(KEYS.FOCUS_SESSIONS);
  await setJSON(KEYS.FOCUS_SESSIONS, upsertById(sessions, session));
}

export async function getTodayFocusSessions(): Promise<FocusSession[]> {
  const today = getTodayString();
  const sessions = await getArray<FocusSession>(KEYS.FOCUS_SESSIONS);
  return sessions.filter((s) => dateFromTimestamp(s.startTime) === today);
}

// ─── Steps ────────────────────────────────────────────────────────────────────

export async function saveStepLog(log: StepLog): Promise<void> {
  const logs = await getRecord<StepLog>(KEYS.STEP_LOGS);
  logs[log.date] = log;
  await setJSON(KEYS.STEP_LOGS, logs);
}

export async function getTodaySteps(): Promise<StepLog | null> {
  const logs = await getRecord<StepLog>(KEYS.STEP_LOGS);
  return logs[getTodayString()] ?? null;
}

// ─── Notification config ──────────────────────────────────────────────────────

export async function saveNotificationConfig(config: NotificationConfig): Promise<void> {
  await setJSON(KEYS.NOTIFICATION_CONFIG, config);
}

export async function getNotificationConfig(): Promise<NotificationConfig> {
  return (await getJSON<NotificationConfig>(KEYS.NOTIFICATION_CONFIG)) ?? DEFAULT_NOTIFICATION_CONFIG;
}

// ─── App preferences ──────────────────────────────────────────────────────────

export async function getAppPreferences(): Promise<AppPreferences> {
  const stored = await getJSON<AppPreferences>(KEYS.APP_PREFERENCES);
  return { ...DEFAULT_APP_PREFERENCES, ...stored };
}

export async function saveAppPreferences(prefs: AppPreferences): Promise<void> {
  await setJSON(KEYS.APP_PREFERENCES, prefs);
}

// ─── Water config ─────────────────────────────────────────────────────────────

export async function getWaterConfig(): Promise<WaterConfig> {
  return (await getJSON<WaterConfig>(KEYS.WATER_CONFIG)) ?? DEFAULT_WATER_CONFIG;
}

export async function saveWaterConfig(config: WaterConfig): Promise<void> {
  await setJSON(KEYS.WATER_CONFIG, config);
}

// ─── Focus config ─────────────────────────────────────────────────────────────

export async function getFocusConfig(): Promise<FocusConfig> {
  return (await getJSON<FocusConfig>(KEYS.FOCUS_CONFIG)) ?? DEFAULT_FOCUS_CONFIG;
}

export async function saveFocusConfig(config: FocusConfig): Promise<void> {
  await setJSON(KEYS.FOCUS_CONFIG, config);
}

// ─── Reset today ──────────────────────────────────────────────────────────────

export async function resetTodayStorage(date: string): Promise<void> {
  await deleteWaterLogForDate(date);

  const foodLogs = await getRecord<DailyFoodLog>(KEYS.FOOD_LOGS);
  foodLogs[date] = {
    date,
    entries: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };
  await setJSON(KEYS.FOOD_LOGS, foodLogs);

  const moodLogs = await getRecord<MoodLog>(KEYS.MOOD_LOGS);
  delete moodLogs[date];
  await setJSON(KEYS.MOOD_LOGS, moodLogs);

  const gratitude = await getRecord<GratitudeEntry>(KEYS.GRATITUDE_ENTRIES);
  delete gratitude[date];
  await setJSON(KEYS.GRATITUDE_ENTRIES, gratitude);

  const sleepLogs = await getRecord<SleepLog>(KEYS.SLEEP_LOGS);
  delete sleepLogs[date];
  await setJSON(KEYS.SLEEP_LOGS, sleepLogs);

  const stepLogs = await getRecord<StepLog>(KEYS.STEP_LOGS);
  if (stepLogs[date]) {
    stepLogs[date] = { ...stepLogs[date], steps: 0 };
    await setJSON(KEYS.STEP_LOGS, stepLogs);
  }

  const sessions = await getArray<FocusSession>(KEYS.FOCUS_SESSIONS);
  await setJSON(
    KEYS.FOCUS_SESSIONS,
    sessions.filter((s) => dateFromTimestamp(s.startTime) !== date)
  );

  const workouts = await getArray<WorkoutLog>(KEYS.WORKOUT_LOGS);
  await setJSON(KEYS.WORKOUT_LOGS, workouts.filter((w) => w.date !== date));

  const habitLogs = await getArray<HabitLog>(KEYS.HABIT_LOGS);
  await setJSON(KEYS.HABIT_LOGS, habitLogs.filter((l) => l.date !== date));
}

// ─── Bulk operations ──────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const dayosKeys = keys.filter((k) => k.startsWith("dayos:"));
    await AsyncStorage.multiRemove(dayosKeys);
  } catch {
    // swallow
  }
}

export async function exportAllData(): Promise<string> {
  try {
    const [
      userProfile,
      aiConfig,
      foodLogs,
      waterLogs,
      tasks,
      habits,
      habitLogs,
      sleepLogs,
      workoutLogs,
      bodyMetrics,
      moodLogs,
      journalEntries,
      gratitudeEntries,
      focusSessions,
      stepLogs,
      notificationConfig,
    ] = await Promise.all([
      getUserProfile(),
      getAIConfig(),
      getAllFoodLogs(),
      getAllWaterLogs(),
      getTasks(),
      getHabits(),
      getAllHabitLogs(),
      getSleepHistory(365),
      getWorkoutHistory(365),
      getBodyMetrics(365),
      getRecord<MoodLog>(KEYS.MOOD_LOGS),
      getJournalEntries(1000),
      getRecord<GratitudeEntry>(KEYS.GRATITUDE_ENTRIES),
      getTodayFocusSessions(),
      getRecord<StepLog>(KEYS.STEP_LOGS),
      getNotificationConfig(),
    ]);

    return JSON.stringify(
      {
        userProfile,
        aiConfig,
        foodLogs,
        waterLogs,
        tasks,
        habits,
        habitLogs,
        sleepLogs,
        workoutLogs,
        bodyMetrics,
        moodLogs,
        journalEntries,
        gratitudeEntries,
        focusSessions,
        stepLogs,
        notificationConfig,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  } catch {
    return "{}";
  }
}
