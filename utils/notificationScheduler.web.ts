// Web stub — expo-notifications is not supported on web.
// Metro resolves this file instead of notificationScheduler.ts on web platform.

import type { NotificationConfig } from "../types";

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleNotificationsFromConfig(
  _config: NotificationConfig
): Promise<void> {
  // no-op on web
}
