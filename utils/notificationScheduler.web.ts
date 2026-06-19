// Web stub — expo-notifications is not supported on web.
// Metro resolves this file instead of notificationScheduler.ts on web platform.

import type { NotificationConfig } from "../types";

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleWaterReminder(_times: string[]): Promise<void> {}

export async function scheduleMealReminder(
  _meal: string,
  _time: string
): Promise<void> {}

export async function scheduleEveningCheckin(_time: string): Promise<void> {}

export async function scheduleMorningBriefing(_time: string): Promise<void> {}

export async function cancelAllNotifications(): Promise<void> {}

export async function scheduleNotificationsFromConfig(
  _config: NotificationConfig
): Promise<void> {}
