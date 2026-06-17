import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { useAppStore } from "../store/useAppStore";
import type { NotificationConfig } from "../types";

const SCHEDULED_IDS_KEY = "dayos:notif:scheduled-ids";

type NotificationCategory = "water" | "meal" | "evening" | "morning" | "focus";

interface StoredNotificationIds {
  water: string[];
  meal: string[];
  evening: string[];
  morning: string[];
  focus: string[];
}

const EMPTY_IDS: StoredNotificationIds = {
  water: [],
  meal: [],
  evening: [],
  morning: [],
  focus: [],
};

async function loadScheduledIds(): Promise<StoredNotificationIds> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    if (!raw) return { ...EMPTY_IDS };
    return { ...EMPTY_IDS, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_IDS };
  }
}

function saveScheduledIds(ids: StoredNotificationIds): void {
  void AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return {
    hour: Number.isFinite(hour) ? hour : 9,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

async function cancelCategory(category: NotificationCategory): Promise<void> {
  const ids = await loadScheduledIds();
  await Promise.all(
    ids[category].map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
  ids[category] = [];
  saveScheduledIds(ids);
}

function isWaterGoalMet(): boolean {
  const { waterLog, waterConfig } = useAppStore.getState();
  if (!waterLog) return false;
  return waterLog.bottleCount >= waterConfig.dailyGoalBottles;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}


async function scheduleWaterReminder(times: string[]): Promise<void> {
  await cancelCategory("water");
  if (isWaterGoalMet()) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const ids = await loadScheduledIds();
  for (const time of times) {
    const { hour, minute } = parseTime(time);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hydration check 💧",
        body: "Log a bottle in DayOS — your water goal is waiting.",
        data: { category: "water" },
      },
      trigger: { hour, minute, repeats: true },
    });
    ids.water.push(id);
  }
  saveScheduledIds(ids);
}

async function scheduleMealReminders(
  config: NotificationConfig["mealReminder"]
): Promise<void> {
  await cancelCategory("meal");
  if (!config.enabled) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const ids = await loadScheduledIds();
  const meals: Array<{ time: string; title: string; body: string }> = [
    {
      time: config.breakfastTime,
      title: "Breakfast time 🍳",
      body: "Log your morning meal in DayOS.",
    },
    {
      time: config.lunchTime,
      title: "Lunch check-in 🍛",
      body: "Track lunch calories while they're fresh.",
    },
    {
      time: config.dinnerTime,
      title: "Dinner reminder 🥗",
      body: "Log dinner to keep your calorie score accurate.",
    },
  ];

  for (const meal of meals) {
    const { hour, minute } = parseTime(meal.time);
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: meal.title, body: meal.body, data: { category: "meal" } },
      trigger: { hour, minute, repeats: true },
    });
    ids.meal.push(id);
  }
  saveScheduledIds(ids);
}

async function scheduleEveningCheckin(time: string): Promise<void> {
  await cancelCategory("evening");
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const { hour, minute } = parseTime(time);
  const ids = await loadScheduledIds();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Evening check-in 🌙",
      body: "Review your day score, habits, and mood in DayOS.",
      data: { category: "evening" },
    },
    trigger: { hour, minute, repeats: true },
  });
  ids.evening.push(id);
  saveScheduledIds(ids);
}

async function scheduleMorningBriefing(time: string): Promise<void> {
  await cancelCategory("morning");
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const { hour, minute } = parseTime(time);
  const ids = await loadScheduledIds();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Good morning ☀️",
      body: "Open DayOS for your morning nudge and daily plan.",
      data: { category: "morning" },
    },
    trigger: { hour, minute, repeats: true },
  });
  ids.morning.push(id);
  saveScheduledIds(ids);
}

async function scheduleFocusReminder(time: string): Promise<void> {
  await cancelCategory("focus");
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const { hour, minute } = parseTime(time);
  const ids = await loadScheduledIds();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Focus block 🎯",
      body: "Start a Pomodoro session and tackle your MIT.",
      data: { category: "focus" },
    },
    trigger: { hour, minute, repeats: true },
  });
  ids.focus.push(id);
  saveScheduledIds(ids);
}

export async function scheduleNotificationsFromConfig(
  config: NotificationConfig
): Promise<void> {
  if (config.waterReminder.enabled && !isWaterGoalMet()) {
    await scheduleWaterReminder(config.waterReminder.times);
  } else {
    await cancelCategory("water");
  }

  if (config.mealReminder.enabled) {
    await scheduleMealReminders(config.mealReminder);
  } else {
    await cancelCategory("meal");
  }

  if (config.eveningCheckin.enabled) {
    await scheduleEveningCheckin(config.eveningCheckin.time);
  } else {
    await cancelCategory("evening");
  }

  if (config.morningBriefing.enabled) {
    await scheduleMorningBriefing(config.morningBriefing.time);
  } else {
    await cancelCategory("morning");
  }

  if (config.focusReminder.enabled) {
    await scheduleFocusReminder(config.focusReminder.time);
  } else {
    await cancelCategory("focus");
  }
}
