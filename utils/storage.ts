import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { MMKV } from "react-native-mmkv";

import type {
  AIConfig,
  AppPreferences,
  BodyMetricLog,
  DailyFoodLog,
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

// ─── MMKV instance ────────────────────────────────────────────────────────────

const mmkv = new MMKV({ id: "dayos" });

const KEYS = {
  USER_PROFILE: "userProfile",
  AI_CONFIG: "aiConfig",
  FOOD_LOGS: "foodLogs",
  WATER_LOGS: "waterLogs",
  TASKS: "tasks",
  HABITS: "habits",
  HABIT_LOGS: "habitLogs",
  SLEEP_LOGS: "sleepLogs",
  WORKOUT_LOGS: "workoutLogs",
  BODY_METRICS: "bodyMetrics",
  MOOD_LOGS: "moodLogs",
  JOURNAL_ENTRIES: "journalEntries",
  GRATITUDE_ENTRIES: "gratitudeEntries",
  FOCUS_SESSIONS: "focusSessions",
  STEP_LOGS: "stepLogs",
  NOTIFICATION_CONFIG: "notificationConfig",
  APP_PREFERENCES: "appPreferences",
} as const;

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
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

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getJSON<T>(key: string): T | null {
  try {
    const raw = mmkv.getString(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setJSON(key: string, value: unknown): void {
  try {
    mmkv.set(key, JSON.stringify(value));
  } catch {
    // swallow write errors
  }
}

function getRecord<T>(key: string): Record<string, T> {
  return getJSON<Record<string, T>>(key) ?? {};
}

function getArray<T>(key: string): T[] {
  return getJSON<T[]>(key) ?? [];
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

export function saveUserProfile(profile: UserProfile): void {
  setJSON(KEYS.USER_PROFILE, profile);
}

export function getUserProfile(): UserProfile | null {
  return getJSON<UserProfile>(KEYS.USER_PROFILE);
}

// ─── AI config ────────────────────────────────────────────────────────────────

export function saveAIConfig(config: AIConfig): void {
  setJSON(KEYS.AI_CONFIG, config);
}

export function getAIConfig(): AIConfig | null {
  return getJSON<AIConfig>(KEYS.AI_CONFIG);
}

// ─── Food ─────────────────────────────────────────────────────────────────────

export function saveTodayFoodLog(log: DailyFoodLog): void {
  const logs = getRecord<DailyFoodLog>(KEYS.FOOD_LOGS);
  logs[log.date] = log;
  setJSON(KEYS.FOOD_LOGS, logs);
}

export function getFoodLog(date: string): DailyFoodLog | null {
  const logs = getRecord<DailyFoodLog>(KEYS.FOOD_LOGS);
  return logs[date] ?? null;
}

export function getAllFoodLogs(): DailyFoodLog[] {
  const logs = getRecord<DailyFoodLog>(KEYS.FOOD_LOGS);
  return Object.values(logs).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Water ────────────────────────────────────────────────────────────────────

export function saveWaterLog(log: WaterLog): void {
  const date = dateFromTimestamp(log.timestamp);
  const logs = getRecord<WaterLog>(KEYS.WATER_LOGS);
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

  setJSON(KEYS.WATER_LOGS, logs);
}

export function getTodayWaterLog(): WaterLog | null {
  const logs = getRecord<WaterLog>(KEYS.WATER_LOGS);
  return logs[getTodayString()] ?? null;
}

export function setWaterLogForDate(date: string, log: WaterLog): void {
  const logs = getRecord<WaterLog>(KEYS.WATER_LOGS);
  logs[date] = log;
  setJSON(KEYS.WATER_LOGS, logs);
}

export function deleteWaterLogForDate(date: string): void {
  const logs = getRecord<WaterLog>(KEYS.WATER_LOGS);
  delete logs[date];
  setJSON(KEYS.WATER_LOGS, logs);
}

export function getAllWaterLogs(): Record<string, WaterLog> {
  return getRecord<WaterLog>(KEYS.WATER_LOGS);
}

export function replaceTasks(tasks: Task[]): void {
  setJSON(KEYS.TASKS, tasks);
}

export function replaceHabits(habits: Habit[]): void {
  setJSON(KEYS.HABITS, habits);
}

export function replaceHabitLogs(logs: HabitLog[]): void {
  setJSON(KEYS.HABIT_LOGS, logs);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function saveTask(task: Task): void {
  setJSON(KEYS.TASKS, upsertById(getArray<Task>(KEYS.TASKS), task));
}

export function getTasks(): Task[] {
  return getArray<Task>(KEYS.TASKS);
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const tasks = getArray<Task>(KEYS.TASKS);
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return;
  tasks[index] = { ...tasks[index], ...updates };
  setJSON(KEYS.TASKS, tasks);
}

export function deleteTask(id: string): void {
  setJSON(
    KEYS.TASKS,
    getArray<Task>(KEYS.TASKS).filter((t) => t.id !== id)
  );
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export function saveHabit(habit: Habit): void {
  setJSON(KEYS.HABITS, upsertById(getArray<Habit>(KEYS.HABITS), habit));
}

export function getHabits(): Habit[] {
  return getArray<Habit>(KEYS.HABITS);
}

export function seedDefaultHabitsIfEmpty(): Habit[] {
  const existing = getHabits();
  if (existing.length > 0) return existing;

  const seeded: Habit[] = DEFAULT_HABIT_TEMPLATES.slice(0, 5).map((template, index) => ({
    ...template,
    id: `default_habit_${index}_${Date.now()}`,
    isActive: true,
    createdAt: getNowString(),
  }));

  replaceHabits(seeded);
  return seeded;
}

export function saveHabitLog(log: HabitLog): void {
  const logs = getArray<HabitLog>(KEYS.HABIT_LOGS);
  const index = logs.findIndex(
    (l) => l.habitId === log.habitId && l.date === log.date
  );

  if (index === -1) {
    logs.push(log);
  } else {
    logs[index] = log;
  }

  setJSON(KEYS.HABIT_LOGS, logs);
}

export function getHabitLogs(habitId: string, days: number): HabitLog[] {
  const cutoff = getLastNDays(days)[0];
  return getArray<HabitLog>(KEYS.HABIT_LOGS)
    .filter((l) => l.habitId === habitId && l.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getAllHabitLogs(): HabitLog[] {
  return getArray<HabitLog>(KEYS.HABIT_LOGS);
}

export function calculateStreak(habitId: string): HabitStreak {
  const allLogs = getArray<HabitLog>(KEYS.HABIT_LOGS).filter(
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

  return {
    habitId,
    currentStreak,
    longestStreak,
    last7Days,
  };
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

export function saveSleepLog(log: SleepLog): void {
  const logs = getRecord<SleepLog>(KEYS.SLEEP_LOGS);
  logs[log.date] = log;
  setJSON(KEYS.SLEEP_LOGS, logs);
}

export function getSleepLog(date: string): SleepLog | null {
  const logs = getRecord<SleepLog>(KEYS.SLEEP_LOGS);
  return logs[date] ?? null;
}

export function getSleepHistory(days: number): SleepLog[] {
  const logs = getRecord<SleepLog>(KEYS.SLEEP_LOGS);
  return Object.values(logs)
    .filter((l) => isWithinLastDays(l.date, days))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Workouts ─────────────────────────────────────────────────────────────────

export function saveWorkoutLog(log: WorkoutLog): void {
  setJSON(KEYS.WORKOUT_LOGS, upsertById(getArray<WorkoutLog>(KEYS.WORKOUT_LOGS), log));
}

export function getTodayWorkouts(): WorkoutLog[] {
  const today = getTodayString();
  return getArray<WorkoutLog>(KEYS.WORKOUT_LOGS).filter((l) => l.date === today);
}

export function getWorkoutHistory(days: number): WorkoutLog[] {
  return getArray<WorkoutLog>(KEYS.WORKOUT_LOGS)
    .filter((l) => isWithinLastDays(l.date, days))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function replaceWorkouts(workouts: WorkoutLog[]): void {
  setJSON(KEYS.WORKOUT_LOGS, workouts);
}

// ─── Body metrics ─────────────────────────────────────────────────────────────

export function saveBodyMetric(log: BodyMetricLog): void {
  setJSON(
    KEYS.BODY_METRICS,
    upsertById(getArray<BodyMetricLog>(KEYS.BODY_METRICS), log)
  );
}

export function getBodyMetrics(days: number): BodyMetricLog[] {
  return getArray<BodyMetricLog>(KEYS.BODY_METRICS)
    .filter((l) => isWithinLastDays(l.date, days))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getLatestWeight(): BodyMetricLog | null {
  const metrics = getArray<BodyMetricLog>(KEYS.BODY_METRICS);
  if (metrics.length === 0) return null;
  return [...metrics].sort((a, b) => b.date.localeCompare(a.date))[0];
}

// ─── Mood ─────────────────────────────────────────────────────────────────────

export function saveMoodLog(log: MoodLog): void {
  const logs = getRecord<MoodLog>(KEYS.MOOD_LOGS);
  logs[log.date] = log;
  setJSON(KEYS.MOOD_LOGS, logs);
}

export function getMoodLog(date: string): MoodLog | null {
  const logs = getRecord<MoodLog>(KEYS.MOOD_LOGS);
  return logs[date] ?? null;
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export function saveJournalEntry(entry: JournalEntry): void {
  setJSON(
    KEYS.JOURNAL_ENTRIES,
    upsertById(getArray<JournalEntry>(KEYS.JOURNAL_ENTRIES), entry)
  );
}

export function getJournalEntries(limit: number): JournalEntry[] {
  return getArray<JournalEntry>(KEYS.JOURNAL_ENTRIES)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, Math.max(0, limit));
}

export function deleteJournalEntry(id: string): void {
  setJSON(
    KEYS.JOURNAL_ENTRIES,
    getArray<JournalEntry>(KEYS.JOURNAL_ENTRIES).filter((e) => e.id !== id)
  );
}

// ─── Gratitude ────────────────────────────────────────────────────────────────

export function saveGratitudeEntry(entry: GratitudeEntry): void {
  const logs = getRecord<GratitudeEntry>(KEYS.GRATITUDE_ENTRIES);
  logs[entry.date] = entry;
  setJSON(KEYS.GRATITUDE_ENTRIES, logs);
}

export function getGratitudeEntry(date: string): GratitudeEntry | null {
  const logs = getRecord<GratitudeEntry>(KEYS.GRATITUDE_ENTRIES);
  return logs[date] ?? null;
}

// ─── Focus ────────────────────────────────────────────────────────────────────

export function saveFocusSession(session: FocusSession): void {
  setJSON(
    KEYS.FOCUS_SESSIONS,
    upsertById(getArray<FocusSession>(KEYS.FOCUS_SESSIONS), session)
  );
}

export function getTodayFocusSessions(): FocusSession[] {
  const today = getTodayString();
  return getArray<FocusSession>(KEYS.FOCUS_SESSIONS).filter(
    (s) => dateFromTimestamp(s.startTime) === today
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

export function saveStepLog(log: StepLog): void {
  const logs = getRecord<StepLog>(KEYS.STEP_LOGS);
  logs[log.date] = log;
  setJSON(KEYS.STEP_LOGS, logs);
}

export function getTodaySteps(): StepLog | null {
  const logs = getRecord<StepLog>(KEYS.STEP_LOGS);
  return logs[getTodayString()] ?? null;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function saveNotificationConfig(config: NotificationConfig): void {
  setJSON(KEYS.NOTIFICATION_CONFIG, config);
}

export function getNotificationConfig(): NotificationConfig {
  return getJSON<NotificationConfig>(KEYS.NOTIFICATION_CONFIG) ?? DEFAULT_NOTIFICATION_CONFIG;
}

const DEFAULT_APP_PREFERENCES: AppPreferences = {
  weightUnit: "kg",
  heightUnit: "cm",
  showStepsOnDashboard: true,
  manualCalorieOverride: false,
  manualCalorieGoal: 2000,
  stepGoal: 8000,
  lastActiveDate: "",
  hasSeenMorningBriefing: false,
};

export function getAppPreferences(): AppPreferences {
  const stored = getJSON<AppPreferences>(KEYS.APP_PREFERENCES);
  return { ...DEFAULT_APP_PREFERENCES, ...stored };
}

export function saveAppPreferences(prefs: AppPreferences): void {
  setJSON(KEYS.APP_PREFERENCES, prefs);
}

export function resetTodayStorage(date: string): void {
  deleteWaterLogForDate(date);
  setJSON(KEYS.FOOD_LOGS, {
    ...getRecord<DailyFoodLog>(KEYS.FOOD_LOGS),
    [date]: {
      date,
      entries: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    },
  });

  const moodLogs = getRecord<MoodLog>(KEYS.MOOD_LOGS);
  delete moodLogs[date];
  setJSON(KEYS.MOOD_LOGS, moodLogs);

  const gratitude = getRecord<GratitudeEntry>(KEYS.GRATITUDE_ENTRIES);
  delete gratitude[date];
  setJSON(KEYS.GRATITUDE_ENTRIES, gratitude);

  const sleepLogs = getRecord<SleepLog>(KEYS.SLEEP_LOGS);
  delete sleepLogs[date];
  setJSON(KEYS.SLEEP_LOGS, sleepLogs);

  const stepLogs = getRecord<StepLog>(KEYS.STEP_LOGS);
  if (stepLogs[date]) {
    stepLogs[date] = { ...stepLogs[date], steps: 0 };
    setJSON(KEYS.STEP_LOGS, stepLogs);
  }

  const focusSessions = getArray<FocusSession>(KEYS.FOCUS_SESSIONS).filter(
    (s) => dateFromTimestamp(s.startTime) !== date
  );
  setJSON(KEYS.FOCUS_SESSIONS, focusSessions);

  const workouts = getArray<WorkoutLog>(KEYS.WORKOUT_LOGS).filter(
    (w) => w.date !== date
  );
  replaceWorkouts(workouts);

  const habitLogs = getArray<HabitLog>(KEYS.HABIT_LOGS).filter(
    (l) => l.date !== date
  );
  replaceHabitLogs(habitLogs);
}

// ─── Bulk operations ──────────────────────────────────────────────────────────

export function clearAllData(): void {
  try {
    mmkv.clearAll();
  } catch {
    // swallow
  }
}

export function exportAllData(): string {
  const data = {
    userProfile: getUserProfile(),
    aiConfig: getAIConfig(),
    foodLogs: getAllFoodLogs(),
    waterLogs: getRecord<WaterLog>(KEYS.WATER_LOGS),
    tasks: getTasks(),
    habits: getHabits(),
    habitLogs: getArray<HabitLog>(KEYS.HABIT_LOGS),
    sleepLogs: getRecord<SleepLog>(KEYS.SLEEP_LOGS),
    workoutLogs: getArray<WorkoutLog>(KEYS.WORKOUT_LOGS),
    bodyMetrics: getArray<BodyMetricLog>(KEYS.BODY_METRICS),
    moodLogs: getRecord<MoodLog>(KEYS.MOOD_LOGS),
    journalEntries: getArray<JournalEntry>(KEYS.JOURNAL_ENTRIES),
    gratitudeEntries: getRecord<GratitudeEntry>(KEYS.GRATITUDE_ENTRIES),
    focusSessions: getArray<FocusSession>(KEYS.FOCUS_SESSIONS),
    stepLogs: getRecord<StepLog>(KEYS.STEP_LOGS),
    notificationConfig: getNotificationConfig(),
    exportedAt: new Date().toISOString(),
  };

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return "{}";
  }
}
