import { Platform } from "react-native";

import type { NotificationConfig } from "../types";

// Check if we are in Expo Go
// Expo Go does not support push notifications
const isExpoGo = (): boolean => {
  try {
    const Constants = require("expo-constants").default;
    return (
      Constants.appOwnership === "expo" ||
      Constants.executionEnvironment === "storeClient"
    );
  } catch {
    return true; // assume Expo Go if unsure
  }
};

// Safe wrapper - never crashes
const getNotif = () => {
  if (Platform.OS === "web") return null;
  if (isExpoGo()) return null;
  try {
    return require("expo-notifications");
  } catch {
    return null;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const Notif = getNotif();
  if (!Notif) return false;
  try {
    const { status } = await Notif.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
};

export const scheduleWaterReminder = async (times: string[]): Promise<void> => {
  const Notif = getNotif();
  if (!Notif) return;
  try {
    await Notif.cancelAllScheduledNotificationsAsync();
    for (const time of times) {
      const [h, m] = time.split(":").map(Number);
      await Notif.scheduleNotificationAsync({
        content: {
          title: "💧 Water Reminder",
          body: "Time to drink water!",
        },
        trigger: {
          hour: h,
          minute: m,
          repeats: true,
        },
      });
    }
  } catch (e) {
    console.log("Notification skipped:", e);
  }
};

export const scheduleMealReminder = async (
  meal: string,
  time: string
): Promise<void> => {
  const Notif = getNotif();
  if (!Notif) return;
  try {
    const [h, m] = time.split(":").map(Number);
    await Notif.scheduleNotificationAsync({
      content: {
        title: `🍽️ ${meal} time`,
        body: `Log your ${meal.toLowerCase()}!`,
      },
      trigger: { hour: h, minute: m, repeats: true },
    });
  } catch (e) {
    console.log("Notification skipped:", e);
  }
};

export const scheduleEveningCheckin = async (time: string): Promise<void> => {
  const Notif = getNotif();
  if (!Notif) return;
  try {
    const [h, m] = time.split(":").map(Number);
    await Notif.scheduleNotificationAsync({
      content: {
        title: "🌙 Evening check-in",
        body: "How did today go?",
      },
      trigger: { hour: h, minute: m, repeats: true },
    });
  } catch (e) {
    console.log("Notification skipped:", e);
  }
};

export const scheduleMorningBriefing = async (time: string): Promise<void> => {
  const Notif = getNotif();
  if (!Notif) return;
  try {
    const [h, m] = time.split(":").map(Number);
    await Notif.scheduleNotificationAsync({
      content: {
        title: "☀️ Good morning!",
        body: "Open cAI to start your day.",
      },
      trigger: { hour: h, minute: m, repeats: true },
    });
  } catch (e) {
    console.log("Notification skipped:", e);
  }
};

export const cancelAllNotifications = async (): Promise<void> => {
  const Notif = getNotif();
  if (!Notif) return;
  try {
    await Notif.cancelAllScheduledNotificationsAsync();
  } catch {}
};

export async function scheduleNotificationsFromConfig(
  config: NotificationConfig
): Promise<void> {
  const Notif = getNotif();
  if (!Notif) return;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notif.cancelAllScheduledNotificationsAsync();

    if (config.waterReminder.enabled) {
      for (const time of config.waterReminder.times) {
        const [h, m] = time.split(":").map(Number);
        await Notif.scheduleNotificationAsync({
          content: {
            title: "💧 Water Reminder",
            body: "Time to drink water!",
          },
          trigger: { hour: h, minute: m, repeats: true },
        });
      }
    }

    if (config.mealReminder.enabled) {
      const meals = [
        { meal: "Breakfast", time: config.mealReminder.breakfastTime },
        { meal: "Lunch", time: config.mealReminder.lunchTime },
        { meal: "Dinner", time: config.mealReminder.dinnerTime },
      ];
      for (const { meal, time } of meals) {
        const [h, m] = time.split(":").map(Number);
        await Notif.scheduleNotificationAsync({
          content: {
            title: `🍽️ ${meal} time`,
            body: `Log your ${meal.toLowerCase()}!`,
          },
          trigger: { hour: h, minute: m, repeats: true },
        });
      }
    }

    if (config.eveningCheckin.enabled) {
      const [h, m] = config.eveningCheckin.time.split(":").map(Number);
      await Notif.scheduleNotificationAsync({
        content: {
          title: "🌙 Evening check-in",
          body: "How did today go?",
        },
        trigger: { hour: h, minute: m, repeats: true },
      });
    }

    if (config.morningBriefing.enabled) {
      const [h, m] = config.morningBriefing.time.split(":").map(Number);
      await Notif.scheduleNotificationAsync({
        content: {
          title: "☀️ Good morning!",
          body: "Open cAI to start your day.",
        },
        trigger: { hour: h, minute: m, repeats: true },
      });
    }

    if (config.focusReminder.enabled) {
      const [h, m] = config.focusReminder.time.split(":").map(Number);
      await Notif.scheduleNotificationAsync({
        content: {
          title: "🎯 Focus block",
          body: "Start a Pomodoro session and tackle your MIT.",
        },
        trigger: { hour: h, minute: m, repeats: true },
      });
    }
  } catch (e) {
    console.log("Notification skipped:", e);
  }
}
