import { MMKV } from "react-native-mmkv";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import type {
  AIConfig,
  AppPreferences,
  BodyMetricLog,
  DailyContext,
  DailyFoodLog,
  DayScore,
  FocusConfig,
  FocusSession,
  GratitudeEntry,
  Habit,
  HabitLog,
  JournalEntry,
  MealEntry,
  MoodLog,
  MoodRating,
  NotificationConfig,
  SleepLog,
  StepLog,
  Task,
  UserProfile,
  WaterConfig,
  WaterLog,
  WaterLogEntry,
  WorkoutLog,
} from "../types";

import { getNowString, getTimeOfDay, getTodayString } from "../utils/date";
import * as storage from "../utils/storage";
import {
  calculateBMR,
  calculateDailyCalorieGoal,
  calculateDayScore,
  calculateTDEE,
} from "../utils/tdee";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_WATER_CONFIG: WaterConfig = {
  bottleSizeMl: 500,
  dailyGoalBottles: 8,
};

const DEFAULT_FOCUS_CONFIG: FocusConfig = {
  workMinutes: 25,
  breakMinutes: 5,
  sessionsBeforeLongBreak: 4,
  longBreakMinutes: 15,
};

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

const EMPTY_DAY_SCORE: DayScore = {
  tasksPercent: 0,
  caloriesPercent: 0,
  waterPercent: 0,
  habitsPercent: 0,
  overall: 0,
};

const DEFAULT_STEP_GOAL = 10_000;

// ─── Persist storage (MMKV) ───────────────────────────────────────────────────

const persistMmkv = new MMKV({ id: "dayos-zustand-persist" });

const mmkvStorage = {
  getItem: (name: string): string | null => persistMmkv.getString(name) ?? null,
  setItem: (name: string, value: string): void => {
    persistMmkv.set(name, value);
  },
  removeItem: (name: string): void => {
    persistMmkv.delete(name);
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyFoodLog(date: string): DailyFoodLog {
  return {
    date,
    entries: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };
}

function recalcFoodTotals(log: DailyFoodLog): void {
  log.totalCalories = 0;
  log.totalProtein = 0;
  log.totalCarbs = 0;
  log.totalFat = 0;

  for (const entry of log.entries) {
    const qty = entry.quantity;
    log.totalCalories += entry.calories;
    log.totalProtein += entry.foodItem.protein * qty;
    log.totalCarbs += entry.foodItem.carbs * qty;
    log.totalFat += entry.foodItem.fat * qty;
  }

  log.totalCalories = Math.round(log.totalCalories);
  log.totalProtein = Math.round(log.totalProtein);
  log.totalCarbs = Math.round(log.totalCarbs);
  log.totalFat = Math.round(log.totalFat);
}

function getTodayHabitStats(
  habits: Habit[],
  habitLogs: HabitLog[],
  date: string
): { total: number; completed: number; list: string[] } {
  const active = habits.filter((h) => h.isActive);
  const completedIds = new Set(
    habitLogs
      .filter((l) => l.date === date && l.isCompleted)
      .map((l) => l.habitId)
  );

  return {
    total: active.length,
    completed: active.filter((h) => completedIds.has(h.id)).length,
    list: active.map((h) => h.name),
  };
}

function getTodayFocusStats(sessions: FocusSession[]): {
  sessionsCompleted: number;
  totalMinutes: number;
} {
  const today = getTodayString();
  const todaySessions = sessions.filter(
    (s) => s.startTime.slice(0, 10) === today
  );

  return {
    sessionsCompleted: todaySessions.filter((s) => s.isCompleted).length,
    totalMinutes: todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
  };
}

type StoreState = {
  profile: UserProfile | null;
  aiConfig: AIConfig | null;
  isOnboarded: boolean;
  todayFoodLog: DailyFoodLog;
  waterLog: WaterLog | null;
  waterConfig: WaterConfig;
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  focusSessions: FocusSession[];
  focusConfig: FocusConfig;
  activeFocusSession: FocusSession | null;
  sleepLog: SleepLog | null;
  todayWorkouts: WorkoutLog[];
  stepLog: StepLog | null;
  moodLog: MoodLog | null;
  journalEntries: JournalEntry[];
  todayGratitude: GratitudeEntry | null;
  bodyMetrics: BodyMetricLog[];
  notificationConfig: NotificationConfig;
  appPreferences: AppPreferences;
  dayScore: DayScore;
  isLoadingAI: boolean;
  aiError: string | null;
  isStoreInitialized: boolean;
};

function buildDailyContextFromState(state: StoreState): DailyContext | null {
  if (!state.profile) return null;

  const today = getTodayString();
  const habitStats = getTodayHabitStats(state.habits, state.habitLogs, today);
  const focusStats = getTodayFocusStats(state.focusSessions);
  const mitCompleted = state.tasks.some((t) => t.isMIT && t.isCompleted);

  return {
    profile: state.profile,
    date: today,
    timeOfDay: getTimeOfDay(),
    food: state.todayFoodLog,
    water: {
      bottlesConsumed: state.waterLog?.bottleCount ?? 0,
      goalBottles: state.waterConfig.dailyGoalBottles,
      mlConsumed: state.waterLog?.totalMl ?? 0,
    },
    tasks: {
      total: state.tasks.length,
      completed: state.tasks.filter((t) => t.isCompleted).length,
      mitCompleted,
    },
    habits: habitStats,
    focus: focusStats,
    sleep: state.sleepLog ?? undefined,
    workout: state.todayWorkouts[0],
    mood: state.moodLog ?? undefined,
    steps: state.stepLog ?? undefined,
    weight: state.bodyMetrics[0],
    dayScore: state.dayScore,
  };
}

function syncDayScore(state: StoreState): void {
  const context = buildDailyContextFromState(state);
  if (context) {
    state.dayScore = calculateDayScore(context);
  }
}

// ─── Store types ──────────────────────────────────────────────────────────────

interface AppActions {
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setOnboardingComplete: (complete: boolean) => void;

  addMealEntry: (entry: MealEntry) => void;
  removeMealEntry: (entryId: string) => void;
  updateMealEntry: (entryId: string, updates: Partial<MealEntry>) => void;

  logWater: (bottles: number) => void;
  logWaterMl: (ml: number) => void;
  removeLastWaterLog: () => void;
  removeWaterEntry: (entryId: string) => void;
  updateWaterConfig: (config: WaterConfig) => void;

  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (tasks: Task[]) => void;

  startFocusSession: (taskId?: string, durationMinutes?: number) => void;
  pauseFocusSession: () => void;
  completeFocusSession: () => void;
  resetFocusSession: () => void;
  logBreakSession: (durationMinutes: number) => void;
  updateFocusConfig: (config: Partial<FocusConfig>) => void;

  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => void;
  toggleHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  editHabit: (habitId: string, updates: Partial<Habit>) => void;

  logSleep: (sleep: Omit<SleepLog, "id">) => void;
  updateSleepLog: (updates: Partial<SleepLog>) => void;

  addWorkout: (workout: Omit<WorkoutLog, "id">) => void;
  deleteWorkout: (workoutId: string) => void;

  logWeight: (weightKg: number, notes?: string) => void;

  setMorningMood: (rating: MoodRating) => void;
  setEveningMood: (rating: MoodRating) => void;
  setStressLevel: (level: number) => void;

  addJournalEntry: (content: string, tags?: string[]) => void;
  deleteJournalEntry: (id: string) => void;

  saveGratitude: (items: string[]) => void;

  updateSteps: (steps: number) => void;

  setAIConfig: (config: AIConfig) => void;
  setAILoading: (loading: boolean) => void;
  setAIError: (error: string | null) => void;

  getDayScore: () => DayScore;
  recalculateDayScore: () => void;
  getDailyContext: () => DailyContext;
  getRemainingCalories: () => number;
  getCaloriesBurnedToday: () => number;

  setNotificationConfig: (config: NotificationConfig) => void;
  updateAppPreferences: (updates: Partial<AppPreferences>) => void;
  updateStepGoal: (goalSteps: number) => void;
  recalculateTDEE: () => void;
  resetTodayData: () => void;
  checkDayRollover: () => void;
  rollToNewDay: () => void;
  dismissMorningBriefing: () => void;
  clearAllDataAndRestart: () => void;

  initializeStore: () => Promise<void>;
  persistAll: () => void;
}

export type AppStore = StoreState & AppActions;

const initialState: StoreState = {
  profile: null,
  aiConfig: null,
  isOnboarded: false,
  todayFoodLog: emptyFoodLog(getTodayString()),
  waterLog: null,
  waterConfig: DEFAULT_WATER_CONFIG,
  tasks: [],
  habits: [],
  habitLogs: [],
  focusSessions: [],
  focusConfig: DEFAULT_FOCUS_CONFIG,
  activeFocusSession: null,
  sleepLog: null,
  todayWorkouts: [],
  stepLog: null,
  moodLog: null,
  journalEntries: [],
  todayGratitude: null,
  bodyMetrics: [],
  notificationConfig: storage.getNotificationConfig(),
  appPreferences: storage.getAppPreferences(),
  dayScore: EMPTY_DAY_SCORE,
  isLoadingAI: false,
  aiError: null,
  isStoreInitialized: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setProfile: (profile) => {
        set((state) => {
          state.profile = profile;
          state.isOnboarded = profile.isOnboarded;
          syncDayScore(state);
        });
        storage.saveUserProfile(profile);
      },

      updateProfile: (updates) => {
        set((state) => {
          if (!state.profile) return;
          state.profile = { ...state.profile, ...updates };
          if (updates.isOnboarded !== undefined) {
            state.isOnboarded = updates.isOnboarded;
          }
          syncDayScore(state);
        });
        const profile = get().profile;
        if (profile) storage.saveUserProfile(profile);
      },

      setOnboardingComplete: (complete) => {
        set((state) => {
          state.isOnboarded = complete;
          if (state.profile) {
            state.profile.isOnboarded = complete;
          }
        });
        const profile = get().profile;
        if (profile) storage.saveUserProfile({ ...profile, isOnboarded: complete });
      },

      addMealEntry: (entry) => {
        set((state) => {
          state.todayFoodLog.entries.push(entry);
          recalcFoodTotals(state.todayFoodLog);
          syncDayScore(state);
        });
        storage.saveTodayFoodLog(get().todayFoodLog);
      },

      removeMealEntry: (entryId) => {
        set((state) => {
          state.todayFoodLog.entries = state.todayFoodLog.entries.filter(
            (e) => e.id !== entryId
          );
          recalcFoodTotals(state.todayFoodLog);
          syncDayScore(state);
        });
        storage.saveTodayFoodLog(get().todayFoodLog);
      },

      updateMealEntry: (entryId, updates) => {
        set((state) => {
          const entry = state.todayFoodLog.entries.find((e) => e.id === entryId);
          if (!entry) return;
          Object.assign(entry, updates);
          if (updates.quantity !== undefined || updates.foodItem) {
            entry.calories = Math.round(
              entry.foodItem.calories * entry.quantity
            );
          }
          recalcFoodTotals(state.todayFoodLog);
          syncDayScore(state);
        });
        storage.saveTodayFoodLog(get().todayFoodLog);
      },

      logWaterMl: (ml) => {
        if (ml <= 0) return;

        set((state) => {
          const bottles = ml / state.waterConfig.bottleSizeMl;
          const entry: WaterLogEntry = {
            id: generateId(),
            timestamp: getNowString(),
            ml,
            bottles,
          };

          if (state.waterLog) {
            if (!state.waterLog.entries) state.waterLog.entries = [];
            state.waterLog.entries.push(entry);
            state.waterLog.bottleCount += bottles;
            state.waterLog.totalMl += ml;
            state.waterLog.timestamp = entry.timestamp;
          } else {
            state.waterLog = {
              id: generateId(),
              timestamp: entry.timestamp,
              bottleCount: bottles,
              totalMl: ml,
              entries: [entry],
            };
          }

          syncDayScore(state);
        });

        const waterLog = get().waterLog;
        if (waterLog) {
          storage.setWaterLogForDate(getTodayString(), waterLog);
        }
      },

      logWater: (bottles) => {
        if (bottles <= 0) return;
        const ml = bottles * get().waterConfig.bottleSizeMl;
        get().logWaterMl(ml);
      },

      removeWaterEntry: (entryId) => {
        set((state) => {
          if (!state.waterLog?.entries?.length) return;

          const index = state.waterLog.entries.findIndex((e) => e.id === entryId);
          if (index === -1) return;

          const entry = state.waterLog.entries[index];
          state.waterLog.entries.splice(index, 1);
          state.waterLog.bottleCount = Math.max(
            0,
            state.waterLog.bottleCount - entry.bottles
          );
          state.waterLog.totalMl = Math.max(0, state.waterLog.totalMl - entry.ml);

          if (state.waterLog.entries.length === 0) {
            storage.deleteWaterLogForDate(getTodayString());
            state.waterLog = null;
          } else {
            state.waterLog.timestamp =
              state.waterLog.entries[state.waterLog.entries.length - 1].timestamp;
            storage.setWaterLogForDate(getTodayString(), state.waterLog);
          }

          syncDayScore(state);
        });
      },

      removeLastWaterLog: () => {
        const log = get().waterLog;
        if (!log?.entries?.length) return;
        get().removeWaterEntry(log.entries[log.entries.length - 1].id);
      },

      updateWaterConfig: (config) => {
        set((state) => {
          state.waterConfig = config;
          syncDayScore(state);
        });
      },

      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: generateId(),
          createdAt: getNowString(),
        };

        set((state) => {
          state.tasks.push(newTask);
          syncDayScore(state);
        });
        storage.saveTask(newTask);
      },

      completeTask: (taskId) => {
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return;
          task.isCompleted = true;
          task.completedAt = getNowString();
          syncDayScore(state);
        });
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) storage.saveTask(task);
      },

      deleteTask: (taskId) => {
        set((state) => {
          state.tasks = state.tasks.filter((t) => t.id !== taskId);
          syncDayScore(state);
        });
        storage.deleteTask(taskId);
      },

      reorderTasks: (tasks) => {
        set((state) => {
          state.tasks = tasks;
        });
        storage.replaceTasks(tasks);
      },

      startFocusSession: (taskId, durationMinutes) => {
        const { focusConfig } = get();
        const session: FocusSession = {
          id: generateId(),
          taskId,
          startTime: getNowString(),
          durationMinutes: durationMinutes ?? focusConfig.workMinutes,
          isCompleted: false,
          type: "work",
        };

        set((state) => {
          state.activeFocusSession = session;
        });
      },

      pauseFocusSession: () => {
        set((state) => {
          if (!state.activeFocusSession) return;

          const paused: FocusSession = {
            ...state.activeFocusSession,
            endTime: getNowString(),
            isCompleted: false,
          };

          const index = state.focusSessions.findIndex(
            (s) => s.id === paused.id
          );
          if (index === -1) {
            state.focusSessions.push(paused);
          } else {
            state.focusSessions[index] = paused;
          }

          state.activeFocusSession = null;
        });

        const session = get().focusSessions.at(-1);
        if (session) storage.saveFocusSession(session);
      },

      completeFocusSession: () => {
        set((state) => {
          if (!state.activeFocusSession) return;

          const completed: FocusSession = {
            ...state.activeFocusSession,
            endTime: getNowString(),
            isCompleted: true,
          };

          const index = state.focusSessions.findIndex(
            (s) => s.id === completed.id
          );
          if (index === -1) {
            state.focusSessions.push(completed);
          } else {
            state.focusSessions[index] = completed;
          }

          state.activeFocusSession = null;
        });

        const session = get().focusSessions.at(-1);
        if (session) storage.saveFocusSession(session);
      },

      resetFocusSession: () => {
        set((state) => {
          state.activeFocusSession = null;
        });
      },

      logBreakSession: (durationMinutes) => {
        const end = new Date();
        const start = new Date(end.getTime() - durationMinutes * 60_000);
        const session: FocusSession = {
          id: generateId(),
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          durationMinutes,
          isCompleted: true,
          type: "break",
        };

        set((state) => {
          state.focusSessions.push(session);
        });
        storage.saveFocusSession(session);
      },

      updateFocusConfig: (config) => {
        set((state) => {
          state.focusConfig = { ...state.focusConfig, ...config };
        });
      },

      addHabit: (habit) => {
        const newHabit: Habit = {
          ...habit,
          id: generateId(),
          createdAt: getNowString(),
        };

        set((state) => {
          state.habits.push(newHabit);
          syncDayScore(state);
        });
        storage.saveHabit(newHabit);
      },

      toggleHabit: (habitId) => {
        const today = getTodayString();

        set((state) => {
          const existing = state.habitLogs.find(
            (l) => l.habitId === habitId && l.date === today
          );

          if (existing) {
            existing.isCompleted = !existing.isCompleted;
            existing.completedAt = existing.isCompleted
              ? getNowString()
              : undefined;
          } else {
            state.habitLogs.push({
              habitId,
              date: today,
              isCompleted: true,
              completedAt: getNowString(),
            });
          }

          syncDayScore(state);
        });

        const log = get().habitLogs.find(
          (l) => l.habitId === habitId && l.date === today
        );
        if (log) storage.saveHabitLog(log);
      },

      deleteHabit: (habitId) => {
        set((state) => {
          state.habits = state.habits.filter((h) => h.id !== habitId);
          state.habitLogs = state.habitLogs.filter(
            (l) => l.habitId !== habitId
          );
          syncDayScore(state);
        });
        storage.replaceHabits(get().habits);
        storage.replaceHabitLogs(get().habitLogs);
      },

      editHabit: (habitId, updates) => {
        set((state) => {
          const habit = state.habits.find((h) => h.id === habitId);
          if (!habit) return;
          Object.assign(habit, updates);
          syncDayScore(state);
        });
        const habit = get().habits.find((h) => h.id === habitId);
        if (habit) storage.saveHabit(habit);
      },

      logSleep: (sleep) => {
        const log: SleepLog = { ...sleep, id: generateId() };

        set((state) => {
          state.sleepLog = log;
        });
        storage.saveSleepLog(log);
      },

      updateSleepLog: (updates) => {
        set((state) => {
          if (!state.sleepLog) return;
          state.sleepLog = { ...state.sleepLog, ...updates };
        });
        const log = get().sleepLog;
        if (log) storage.saveSleepLog(log);
      },

      addWorkout: (workout) => {
        const log: WorkoutLog = { ...workout, id: generateId() };

        set((state) => {
          state.todayWorkouts.push(log);
        });
        storage.saveWorkoutLog(log);
      },

      deleteWorkout: (workoutId) => {
        const updated = storage
          .getWorkoutHistory(365)
          .filter((w) => w.id !== workoutId);

        set((state) => {
          state.todayWorkouts = state.todayWorkouts.filter(
            (w) => w.id !== workoutId
          );
        });

        storage.replaceWorkouts(updated);
      },

      logWeight: (weightKg, notes) => {
        const log: BodyMetricLog = {
          id: generateId(),
          date: getTodayString(),
          weightKg,
          notes,
        };

        set((state) => {
          state.bodyMetrics.unshift(log);
          if (state.profile) {
            state.profile.weightKg = weightKg;
          }
        });

        storage.saveBodyMetric(log);
        const profile = get().profile;
        if (profile) storage.saveUserProfile(profile);
      },

      setMorningMood: (rating) => {
        const today = getTodayString();

        set((state) => {
          state.moodLog = {
            ...(state.moodLog ?? { date: today }),
            date: today,
            morningMood: rating,
          };
        });
        const log = get().moodLog;
        if (log) storage.saveMoodLog(log);
      },

      setEveningMood: (rating) => {
        const today = getTodayString();

        set((state) => {
          state.moodLog = {
            ...(state.moodLog ?? { date: today }),
            date: today,
            eveningMood: rating,
          };
        });
        const log = get().moodLog;
        if (log) storage.saveMoodLog(log);
      },

      setStressLevel: (level) => {
        const today = getTodayString();

        set((state) => {
          state.moodLog = {
            ...(state.moodLog ?? { date: today }),
            date: today,
            stressLevel: level,
          };
        });
        const log = get().moodLog;
        if (log) storage.saveMoodLog(log);
      },

      addJournalEntry: (content, tags) => {
        const entry: JournalEntry = {
          id: generateId(),
          timestamp: getNowString(),
          content,
          tags,
        };

        set((state) => {
          state.journalEntries.unshift(entry);
        });
        storage.saveJournalEntry(entry);
      },

      deleteJournalEntry: (id) => {
        set((state) => {
          state.journalEntries = state.journalEntries.filter(
            (e) => e.id !== id
          );
        });
        storage.deleteJournalEntry(id);
      },

      saveGratitude: (items) => {
        const today = getTodayString();
        const entry: GratitudeEntry = {
          id: generateId(),
          date: today,
          items,
        };

        set((state) => {
          state.todayGratitude = entry;
        });
        storage.saveGratitudeEntry(entry);
      },

      updateSteps: (steps) => {
        const log: StepLog = {
          date: getTodayString(),
          steps,
          goalSteps: get().stepLog?.goalSteps ?? DEFAULT_STEP_GOAL,
        };

        set((state) => {
          state.stepLog = log;
        });
        storage.saveStepLog(log);
      },

      setAIConfig: (config) => {
        set((state) => {
          state.aiConfig = config;
        });
        storage.saveAIConfig(config);
      },

      setAILoading: (loading) => {
        set((state) => {
          state.isLoadingAI = loading;
        });
      },

      setAIError: (error) => {
        set((state) => {
          state.aiError = error;
        });
      },

      getDayScore: () => {
        const state = get();
        const context = buildDailyContextFromState(state);
        return context ? calculateDayScore(context) : EMPTY_DAY_SCORE;
      },

      recalculateDayScore: () => {
        set((state) => {
          syncDayScore(state);
        });
      },

      getDailyContext: () => {
        const context = buildDailyContextFromState(get());
        if (!context) {
          throw new Error("Profile must be set before building daily context");
        }
        return context;
      },

      getRemainingCalories: () => {
        const { profile, todayFoodLog } = get();
        if (!profile) return 0;
        return Math.max(0, profile.dailyCalorieGoal - todayFoodLog.totalCalories);
      },

      getCaloriesBurnedToday: () => {
        return get().todayWorkouts.reduce(
          (sum, w) => sum + w.caloriesBurned,
          0
        );
      },

      setNotificationConfig: (config) => {
        set((state) => {
          state.notificationConfig = config;
        });
        storage.saveNotificationConfig(config);
      },

      updateAppPreferences: (updates) => {
        set((state) => {
          state.appPreferences = { ...state.appPreferences, ...updates };
        });
        storage.saveAppPreferences(get().appPreferences);
      },

      updateStepGoal: (goalSteps) => {
        const today = getTodayString();
        const current = get().stepLog;

        set((state) => {
          state.stepLog = {
            date: today,
            steps: current?.steps ?? 0,
            goalSteps,
          };
        });
        storage.saveStepLog(get().stepLog!);
      },

      recalculateTDEE: () => {
        const { profile, appPreferences } = get();
        if (!profile) return;

        const bmr = calculateBMR(
          profile.weightKg,
          profile.heightCm,
          profile.age,
          profile.gender
        );
        const tdee = calculateTDEE(bmr, profile.activityLevel);
        const dailyCalorieGoal = appPreferences.manualCalorieOverride
          ? appPreferences.manualCalorieGoal
          : calculateDailyCalorieGoal(tdee, profile.goalType);

        get().updateProfile({ tdee, dailyCalorieGoal });
      },

      resetTodayData: () => {
        const today = getTodayString();

        storage.resetTodayStorage(today);

        set((state) => {
          state.todayFoodLog = emptyFoodLog(today);
          state.waterLog = null;
          state.tasks = state.tasks.map((task) => ({
            ...task,
            isCompleted: false,
            completedAt: undefined,
          }));
          state.habitLogs = state.habitLogs.filter((l) => l.date !== today);
          state.focusSessions = [];
          state.activeFocusSession = null;
          state.sleepLog = null;
          state.todayWorkouts = [];
          state.moodLog = null;
          state.todayGratitude = null;
          if (state.stepLog) {
            state.stepLog = { ...state.stepLog, date: today, steps: 0 };
          }
          syncDayScore(state);
        });

        storage.replaceTasks(get().tasks);
      },

      rollToNewDay: () => {
        const today = getTodayString();
        const goalSteps = get().appPreferences.stepGoal;

        set((state) => {
          state.todayFoodLog = emptyFoodLog(today);
          state.waterLog = null;
          state.tasks = state.tasks.map((task) => ({
            ...task,
            isCompleted: false,
            completedAt: undefined,
          }));
          state.focusSessions = [];
          state.activeFocusSession = null;
          state.sleepLog = null;
          state.todayWorkouts = [];
          state.moodLog = null;
          state.todayGratitude = null;
          state.stepLog = { date: today, steps: 0, goalSteps };
          syncDayScore(state);
        });

        storage.saveTodayFoodLog(get().todayFoodLog);
        storage.replaceTasks(get().tasks);
        storage.saveStepLog(get().stepLog!);
      },

      checkDayRollover: () => {
        const today = getTodayString();
        const { lastActiveDate } = get().appPreferences;

        if (!lastActiveDate) {
          get().updateAppPreferences({ lastActiveDate: today });
          return;
        }

        if (lastActiveDate === today) return;

        get().rollToNewDay();
        get().updateAppPreferences({ lastActiveDate: today });
      },

      dismissMorningBriefing: () => {
        get().updateAppPreferences({ hasSeenMorningBriefing: true });
      },

      clearAllDataAndRestart: () => {
        storage.clearAllData();
        set((state) => {
          Object.assign(state, {
            ...initialState,
            notificationConfig: storage.getNotificationConfig(),
            appPreferences: storage.getAppPreferences(),
          });
        });
      },

      initializeStore: async () => {
        const today = getTodayString();
        const profile = storage.getUserProfile();

        set((state) => {
          state.profile = profile;
          state.isOnboarded = profile?.isOnboarded ?? false;
          state.aiConfig = storage.getAIConfig();
          state.todayFoodLog =
            storage.getFoodLog(today) ?? emptyFoodLog(today);
          state.waterLog = storage.getTodayWaterLog();
          if (state.waterLog && !state.waterLog.entries) {
            state.waterLog.entries = [];
          }
          state.tasks = storage.getTasks();
          state.habits = storage.seedDefaultHabitsIfEmpty();
          state.habitLogs = storage.getAllHabitLogs();
          state.focusSessions = storage.getTodayFocusSessions();
          state.sleepLog = storage.getSleepLog(today);
          state.todayWorkouts = storage.getTodayWorkouts();
          state.stepLog = storage.getTodaySteps();
          state.moodLog = storage.getMoodLog(today);
          state.journalEntries = storage.getJournalEntries(100);
          state.todayGratitude = storage.getGratitudeEntry(today);
          state.bodyMetrics = storage.getBodyMetrics(90);
          state.notificationConfig = storage.getNotificationConfig();
          state.appPreferences = storage.getAppPreferences();
          syncDayScore(state);
          state.isStoreInitialized = true;
        });

        get().checkDayRollover();
      },

      persistAll: () => {
        const state = get();
        const today = getTodayString();

        if (state.profile) storage.saveUserProfile(state.profile);
        if (state.aiConfig) storage.saveAIConfig(state.aiConfig);

        storage.saveTodayFoodLog(state.todayFoodLog);

        if (state.waterLog) {
          storage.setWaterLogForDate(today, state.waterLog);
        } else {
          storage.deleteWaterLogForDate(today);
        }

        storage.replaceTasks(state.tasks);
        storage.replaceHabits(state.habits);
        storage.replaceHabitLogs(state.habitLogs);

        for (const session of state.focusSessions) {
          storage.saveFocusSession(session);
        }

        if (state.sleepLog) storage.saveSleepLog(state.sleepLog);

        const otherWorkouts = storage
          .getWorkoutHistory(365)
          .filter((w) => w.date !== today);
        storage.replaceWorkouts([...otherWorkouts, ...state.todayWorkouts]);

        for (const metric of state.bodyMetrics) {
          storage.saveBodyMetric(metric);
        }

        if (state.moodLog) storage.saveMoodLog(state.moodLog);

        for (const entry of state.journalEntries) {
          storage.saveJournalEntry(entry);
        }

        if (state.todayGratitude) {
          storage.saveGratitudeEntry(state.todayGratitude);
        }

        if (state.stepLog) storage.saveStepLog(state.stepLog);

        storage.saveNotificationConfig(state.notificationConfig);
        storage.saveAppPreferences(state.appPreferences);
      },
    })),
    {
      name: "dayos-critical-state",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        profile: state.profile,
        aiConfig: state.aiConfig,
        isOnboarded: state.isOnboarded,
        waterConfig: state.waterConfig,
        focusConfig: state.focusConfig,
        notificationConfig: state.notificationConfig,
        appPreferences: state.appPreferences,
      }),
    }
  )
);
