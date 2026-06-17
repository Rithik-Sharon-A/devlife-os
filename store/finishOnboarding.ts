import { getNowString, getTodayString } from "../utils/date";
import { DEFAULT_HABIT_TEMPLATES } from "../data/defaultHabits";
import type { Habit, NotificationConfig, UserProfile } from "../types";
import * as storage from "../utils/storage";
import {
  requestNotificationPermission,
  scheduleNotificationsFromConfig,
} from "../utils/notificationScheduler";
import { useAppStore } from "./useAppStore";

async function seedOnboardingHabits(): Promise<Habit[]> {
  const seeded: Habit[] = DEFAULT_HABIT_TEMPLATES.slice(0, 5).map((template, index) => ({
    ...template,
    id: `default_habit_${index}_${Date.now()}`,
    isActive: true,
    createdAt: getNowString(),
  }));
  await storage.replaceHabits(seeded);
  return seeded;
}

export async function finishOnboarding(
  profile: UserProfile,
  notificationConfig: NotificationConfig
): Promise<void> {
  const app = useAppStore.getState();

  app.setProfile(profile);
  const habits = await seedOnboardingHabits();
  useAppStore.setState({ habits });

  app.setNotificationConfig(notificationConfig);
  await app.persistAll();

  try {
    await requestNotificationPermission();
    await scheduleNotificationsFromConfig(notificationConfig);
  } catch {
    // never crash on permission errors
  }

  app.updateAppPreferences({
    hasSeenMorningBriefing: false,
    lastActiveDate: getTodayString(),
  });
}
