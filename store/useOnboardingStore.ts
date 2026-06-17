import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import type {
  ActivityLevel,
  AIConfig,
  AIProvider,
  GoalType,
  NotificationConfig,
  UserProfile,
} from "../types";
import { getNowString } from "../utils/date";
import {
  calculateBMR,
  calculateDailyCalorieGoal,
  calculateTDEE,
  calculateWaterGoal,
} from "../utils/tdee";
import { useAppStore } from "./useAppStore";


export interface OnboardingDraft {
  name: string;
  age: string;
  gender: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  goalType: GoalType;
  activityLevel: ActivityLevel;
  bmr: number;
  tdee: number;
  dailyCalorieGoal: number;
  bottleSizeMl: number;
  dailyGoalBottles: number;
  wakeTime: string;
  sleepTime: string;
  workStartTime: string;
  enableReminders: boolean;
  aiProvider: AIProvider | null;
  aiApiKey: string;
  aiModel: string;
  aiSkipped: boolean;
}

interface OnboardingStore extends OnboardingDraft {
  updateDraft: (updates: Partial<OnboardingDraft>) => void;
  recalcMetabolism: () => void;
  recalcWaterGoal: () => void;
  buildNotificationConfig: () => NotificationConfig;
  completeOnboarding: () => void;
  resetDraft: () => void;
}

const defaultDraft: OnboardingDraft = {
  name: "",
  age: "",
  gender: "male",
  heightCm: 170,
  weightKg: 70,
  goalWeightKg: 65,
  goalType: "weight_loss",
  activityLevel: "lightly_active",
  bmr: 0,
  tdee: 0,
  dailyCalorieGoal: 0,
  bottleSizeMl: 750,
  dailyGoalBottles: 4,
  wakeTime: "07:00",
  sleepTime: "23:00",
  workStartTime: "09:00",
  enableReminders: true,
  aiProvider: null,
  aiApiKey: "",
  aiModel: "",
  aiSkipped: true,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    immer((set, get) => ({
      ...defaultDraft,

      updateDraft: (updates) => {
        set((state) => {
          Object.assign(state, updates);
        });
      },

      recalcMetabolism: () => {
        const state = get();
        const age = Number(state.age);
        if (!age || age < 10 || age > 120) return;

        const bmr = calculateBMR(
          state.weightKg,
          state.heightCm,
          age,
          state.gender
        );
        const tdee = calculateTDEE(bmr, state.activityLevel);
        const dailyCalorieGoal = calculateDailyCalorieGoal(
          tdee,
          state.goalType
        );

        set((draft) => {
          draft.bmr = bmr;
          draft.tdee = tdee;
          draft.dailyCalorieGoal = dailyCalorieGoal;
        });
      },

      recalcWaterGoal: () => {
        const { weightKg, bottleSizeMl } = get();
        const { bottleCount } = calculateWaterGoal(weightKg, bottleSizeMl);
        set((draft) => {
          draft.dailyGoalBottles = bottleCount;
        });
      },

      buildNotificationConfig: () => {
        const { wakeTime, sleepTime, workStartTime, enableReminders } = get();
        const base = useAppStore.getState().notificationConfig;

        if (!enableReminders) {
          return {
            ...base,
            waterReminder: { ...base.waterReminder, enabled: false },
            mealReminder: { ...base.mealReminder, enabled: false },
            focusReminder: { ...base.focusReminder, enabled: false },
            eveningCheckin: { ...base.eveningCheckin, enabled: false },
            morningBriefing: { ...base.morningBriefing, enabled: false },
          };
        }

        const lunchHour = Math.min(13, Number(workStartTime.split(":")[0]) + 4);

        return {
          waterReminder: {
            enabled: true,
            times: ["10:00", "14:00", "18:00"],
          },
          mealReminder: {
            enabled: true,
            breakfastTime: wakeTime,
            lunchTime: `${String(lunchHour).padStart(2, "0")}:00`,
            dinnerTime: "20:00",
          },
          focusReminder: {
            enabled: true,
            time: workStartTime,
          },
          eveningCheckin: {
            enabled: true,
            time: sleepTime,
          },
          morningBriefing: {
            enabled: true,
            time: wakeTime,
          },
        };
      },

      completeOnboarding: () => {
        const draft = get();
        const age = Number(draft.age);

        const profile: UserProfile = {
          id: `user_${Date.now()}`,
          name: draft.name.trim(),
          age,
          gender: draft.gender,
          heightCm: draft.heightCm,
          weightKg: draft.weightKg,
          goalWeightKg: draft.goalWeightKg,
          goalType: draft.goalType,
          activityLevel: draft.activityLevel,
          tdee: draft.tdee,
          dailyCalorieGoal: draft.dailyCalorieGoal,
          isOnboarded: true,
          createdAt: getNowString(),
        };

        const app = useAppStore.getState();
        app.setProfile(profile);
        app.updateWaterConfig({
          bottleSizeMl: draft.bottleSizeMl,
          dailyGoalBottles: draft.dailyGoalBottles,
        });

        const notificationConfig = get().buildNotificationConfig();
        useAppStore.setState({ notificationConfig });
        void app.persistAll();

        if (!draft.aiSkipped && draft.aiProvider && draft.aiApiKey) {
          const aiConfig: AIConfig = {
            provider: draft.aiProvider,
            apiKey: draft.aiApiKey,
            model: draft.aiModel,
            baseURL: "",
            isConnected: true,
          };
          app.setAIConfig(aiConfig);
        }

        app.logWeight(draft.weightKg);
        get().resetDraft();
      },

      resetDraft: () => {
        set((state) => {
          Object.assign(state, defaultDraft);
        });
        void AsyncStorage.removeItem("dayos-onboarding-draft");
      },
    })),
    {
      name: "dayos-onboarding-draft",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
