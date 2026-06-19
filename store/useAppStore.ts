import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
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
  DEFAULT_APP_PREFERENCES,
  DEFAULT_FOCUS_CONFIG,
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_WATER_CONFIG,
} from "../utils/storage";
import type {
  CelebrationExtraData,
  CelebrationType,
} from "../types/celebrations";
import {
  calculateBMR,
  calculateDailyCalorieGoal,
  calculateDayScore,
  calculateTDEE,
} from "../utils/tdee";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_STEP_GOAL = 10_000;

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

// ─── Types ────────────────────────────────────────────────────────────────────

const EMPTY_DAY_SCORE: DayScore = {
  tasksPercent: 0,
  caloriesPercent: 0,
  waterPercent: 0,
  habitsPercent: 0,
  overall: 0,
};

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
  isLoading: boolean;
  celebrationCallback:
    | ((type: CelebrationType, data?: CelebrationExtraData) => void)
    | null;
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

// ─── Store actions interface ───────────────────────────────────────────────────

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

  setCelebrationCallback: (
    fn: ((type: CelebrationType, data?: CelebrationExtraData) => void) | null
  ) => void;

  initializeStore: () => Promise<void>;
  persistAll: () => Promise<void>;
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
  notificationConfig: DEFAULT_NOTIFICATION_CONFIG,
  appPreferences: DEFAULT_APP_PREFERENCES,
  dayScore: EMPTY_DAY_SCORE,
  isLoadingAI: false,
  aiError: null,
  isStoreInitialized: false,
  isLoading: false,
  celebrationCallback: null,
};

export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    ...initialState,

    setProfile: (profile) => {
      set((state) => {
        state.profile = profile;
        state.isOnboarded = profile.isOnboarded;
        syncDayScore(state);
      });
      void storage.saveUserProfile(profile);
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
      if (profile) void storage.saveUserProfile(profile);
    },

    setOnboardingComplete: (complete) => {
      set((state) => {
        state.isOnboarded = complete;
        if (state.profile) {
          state.profile.isOnboarded = complete;
        }
      });
      const profile = get().profile;
      if (profile) void storage.saveUserProfile({ ...profile, isOnboarded: complete });
    },

    addMealEntry: (entry) => {
      set((state) => {
        state.todayFoodLog.entries.push(entry);
        recalcFoodTotals(state.todayFoodLog);
        syncDayScore(state);
      });
      void storage.saveTodayFoodLog(get().todayFoodLog);
    },

    removeMealEntry: (entryId) => {
      set((state) => {
        state.todayFoodLog.entries = state.todayFoodLog.entries.filter(
          (e) => e.id !== entryId
        );
        recalcFoodTotals(state.todayFoodLog);
        syncDayScore(state);
      });
      void storage.saveTodayFoodLog(get().todayFoodLog);
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
      void storage.saveTodayFoodLog(get().todayFoodLog);
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
        void storage.setWaterLogForDate(getTodayString(), waterLog);
      }
    },

    logWater: (bottles) => {
      if (bottles <= 0) return;
      const ml = bottles * get().waterConfig.bottleSizeMl;
      get().logWaterMl(ml);
    },

    removeWaterEntry: (entryId) => {
      let shouldDelete = false;

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
          state.waterLog = null;
          shouldDelete = true;
        } else {
          state.waterLog.timestamp =
            state.waterLog.entries[state.waterLog.entries.length - 1].timestamp;
        }
        syncDayScore(state);
      });

      const today = getTodayString();
      if (shouldDelete) {
        void storage.deleteWaterLogForDate(today);
      } else {
        const waterLog = get().waterLog;
        if (waterLog) void storage.setWaterLogForDate(today, waterLog);
      }
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
      void storage.saveWaterConfig(config);
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
      void storage.saveTask(newTask);
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
      if (task) void storage.saveTask(task);
    },

    deleteTask: (taskId) => {
      set((state) => {
        state.tasks = state.tasks.filter((t) => t.id !== taskId);
        syncDayScore(state);
      });
      void storage.deleteTask(taskId);
    },

    reorderTasks: (tasks) => {
      set((state) => {
        state.tasks = tasks;
      });
      void storage.replaceTasks(tasks);
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

        const index = state.focusSessions.findIndex((s) => s.id === paused.id);
        if (index === -1) {
          state.focusSessions.push(paused);
        } else {
          state.focusSessions[index] = paused;
        }

        state.activeFocusSession = null;
      });

      const session = get().focusSessions.at(-1);
      if (session) void storage.saveFocusSession(session);
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
      if (session) void storage.saveFocusSession(session);
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
      void storage.saveFocusSession(session);
    },

    updateFocusConfig: (config) => {
      set((state) => {
        state.focusConfig = { ...state.focusConfig, ...config };
      });
      void storage.saveFocusConfig(get().focusConfig);
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
      void storage.saveHabit(newHabit);
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
      if (log) void storage.saveHabitLog(log);
    },

    deleteHabit: (habitId) => {
      set((state) => {
        state.habits = state.habits.filter((h) => h.id !== habitId);
        state.habitLogs = state.habitLogs.filter(
          (l) => l.habitId !== habitId
        );
        syncDayScore(state);
      });
      void storage.replaceHabits(get().habits);
      void storage.replaceHabitLogs(get().habitLogs);
    },

    editHabit: (habitId, updates) => {
      set((state) => {
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return;
        Object.assign(habit, updates);
        syncDayScore(state);
      });
      const habit = get().habits.find((h) => h.id === habitId);
      if (habit) void storage.saveHabit(habit);
    },

    logSleep: (sleep) => {
      const log: SleepLog = { ...sleep, id: generateId() };

      set((state) => {
        state.sleepLog = log;
      });
      void storage.saveSleepLog(log);
    },

    updateSleepLog: (updates) => {
      set((state) => {
        if (!state.sleepLog) return;
        state.sleepLog = { ...state.sleepLog, ...updates };
      });
      const log = get().sleepLog;
      if (log) void storage.saveSleepLog(log);
    },

    addWorkout: (workout) => {
      const log: WorkoutLog = { ...workout, id: generateId() };

      set((state) => {
        state.todayWorkouts.push(log);
      });
      void storage.saveWorkoutLog(log);

      void AsyncStorage.getItem("dayos:first_workout_done").then((done) => {
        if (!done) {
          get().celebrationCallback?.("first_workout");
          void AsyncStorage.setItem("dayos:first_workout_done", "1");
        }
      });
    },

    deleteWorkout: (workoutId) => {
      set((state) => {
        state.todayWorkouts = state.todayWorkouts.filter(
          (w) => w.id !== workoutId
        );
      });

      void (async () => {
        const all = await storage.getWorkoutHistory(365);
        void storage.replaceWorkouts(all.filter((w) => w.id !== workoutId));
      })();
    },

    logWeight: (weightKg, notes) => {
      const lastWeight = get().profile?.weightKg ?? weightKg;
      const existingMetrics = get().bodyMetrics;
      const startWeight =
        existingMetrics.length > 0
          ? existingMetrics[existingMetrics.length - 1]!.weightKg
          : lastWeight;

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

      void storage.saveBodyMetric(log);
      const profile = get().profile;
      if (profile) void storage.saveUserProfile(profile);

      const totalLost = startWeight - weightKg;
      const prevTotalLost = startWeight - lastWeight;
      const emit = get().celebrationCallback;

      if (emit) {
        if (prevTotalLost < 0.5 && totalLost >= 0.5) {
          emit("weight_half_kg", { weightLost: totalLost });
        }
        if (prevTotalLost < 1.0 && totalLost >= 1.0) {
          emit("weight_1kg", { weightLost: totalLost });
        }
        if (prevTotalLost < 5.0 && totalLost >= 5.0) {
          emit("weight_5kg", { weightLost: totalLost });
        }
      }
    },

    setCelebrationCallback: (fn) => {
      set((state) => {
        state.celebrationCallback = fn;
      });
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
      if (log) void storage.saveMoodLog(log);
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
      if (log) void storage.saveMoodLog(log);
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
      if (log) void storage.saveMoodLog(log);
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
      void storage.saveJournalEntry(entry);
    },

    deleteJournalEntry: (id) => {
      set((state) => {
        state.journalEntries = state.journalEntries.filter((e) => e.id !== id);
      });
      void storage.deleteJournalEntry(id);
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
      void storage.saveGratitudeEntry(entry);
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
      void storage.saveStepLog(log);
    },

    setAIConfig: (config) => {
      set((state) => {
        state.aiConfig = config;
      });
      void storage.saveAIConfig(config);
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
      void storage.saveNotificationConfig(config);
    },

    updateAppPreferences: (updates) => {
      set((state) => {
        state.appPreferences = { ...state.appPreferences, ...updates };
      });
      void storage.saveAppPreferences(get().appPreferences);
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
      void storage.saveStepLog(get().stepLog!);
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

      void storage.resetTodayStorage(today);

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

      void storage.replaceTasks(get().tasks);
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

      void storage.saveTodayFoodLog(get().todayFoodLog);
      void storage.replaceTasks(get().tasks);
      if (get().stepLog) void storage.saveStepLog(get().stepLog!);
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
      void storage.clearAllData();
      set((state) => {
        Object.assign(state, { ...initialState });
      });
    },

    initializeStore: async () => {
      const today = getTodayString();

      set((state) => {
        state.isLoading = true;
      });

      try {
        const [
          profile,
          aiConfig,
          todayFoodLog,
          waterLog,
          tasks,
          habits,
          habitLogs,
          focusSessions,
          sleepLog,
          todayWorkouts,
          stepLog,
          moodLog,
          journalEntries,
          todayGratitude,
          bodyMetrics,
          notificationConfig,
          appPreferences,
          waterConfig,
          focusConfig,
        ] = await Promise.all([
          storage.getUserProfile(),
          storage.getAIConfig(),
          storage.getFoodLog(today),
          storage.getTodayWaterLog(),
          storage.getTasks(),
          storage.seedDefaultHabitsIfEmpty(),
          storage.getAllHabitLogs(),
          storage.getTodayFocusSessions(),
          storage.getSleepLog(today),
          storage.getTodayWorkouts(),
          storage.getTodaySteps(),
          storage.getMoodLog(today),
          storage.getJournalEntries(100),
          storage.getGratitudeEntry(today),
          storage.getBodyMetrics(90),
          storage.getNotificationConfig(),
          storage.getAppPreferences(),
          storage.getWaterConfig(),
          storage.getFocusConfig(),
        ]);

        set((state) => {
          state.profile = profile;
          state.isOnboarded = profile?.isOnboarded ?? false;
          state.aiConfig = aiConfig;
          state.todayFoodLog = todayFoodLog ?? emptyFoodLog(today);
          state.waterLog = waterLog;
          if (state.waterLog && !state.waterLog.entries) {
            state.waterLog.entries = [];
          }
          state.tasks = tasks;
          state.habits = habits;
          state.habitLogs = habitLogs;
          state.focusSessions = focusSessions;
          state.sleepLog = sleepLog;
          state.todayWorkouts = todayWorkouts;
          state.stepLog = stepLog;
          state.moodLog = moodLog;
          state.journalEntries = journalEntries;
          state.todayGratitude = todayGratitude;
          state.bodyMetrics = bodyMetrics;
          state.notificationConfig = notificationConfig;
          state.appPreferences = appPreferences;
          state.waterConfig = waterConfig;
          state.focusConfig = focusConfig;
          syncDayScore(state);
          state.isStoreInitialized = true;
          state.isLoading = false;
        });

        get().checkDayRollover();
      } catch (error) {
        console.error("[cAI] Failed to initialize store:", error);
        set((state) => {
          state.isLoading = false;
          state.isStoreInitialized = true;
        });
      }
    },

    persistAll: async () => {
      const state = get();
      const today = getTodayString();

      const saves: Promise<void>[] = [
        storage.saveTodayFoodLog(state.todayFoodLog),
        storage.replaceTasks(state.tasks),
        storage.replaceHabits(state.habits),
        storage.replaceHabitLogs(state.habitLogs),
        storage.saveNotificationConfig(state.notificationConfig),
        storage.saveAppPreferences(state.appPreferences),
        storage.saveWaterConfig(state.waterConfig),
        storage.saveFocusConfig(state.focusConfig),
      ];

      if (state.profile) saves.push(storage.saveUserProfile(state.profile));
      if (state.aiConfig) saves.push(storage.saveAIConfig(state.aiConfig));
      if (state.waterLog) {
        saves.push(storage.setWaterLogForDate(today, state.waterLog));
      }
      if (state.sleepLog) saves.push(storage.saveSleepLog(state.sleepLog));
      if (state.moodLog) saves.push(storage.saveMoodLog(state.moodLog));
      if (state.todayGratitude) {
        saves.push(storage.saveGratitudeEntry(state.todayGratitude));
      }
      if (state.stepLog) saves.push(storage.saveStepLog(state.stepLog));

      for (const session of state.focusSessions) {
        saves.push(storage.saveFocusSession(session));
      }
      for (const entry of state.journalEntries) {
        saves.push(storage.saveJournalEntry(entry));
      }
      for (const metric of state.bodyMetrics) {
        saves.push(storage.saveBodyMetric(metric));
      }

      void (async () => {
        const allWorkouts = await storage.getWorkoutHistory(365);
        const otherDays = allWorkouts.filter((w) => w.date !== today);
        void storage.replaceWorkouts([...otherDays, ...state.todayWorkouts]);
      })();

      await Promise.all(saves);
    },
  }))
);
