import * as Notifications from "expo-notifications";
import { useCallback } from "react";

import { useAppStore } from "../store/useAppStore";
import type { NotificationConfig } from "../types";
import {
  requestNotificationPermission,
  scheduleNotificationsFromConfig,
} from "../utils/notificationScheduler";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Notifications not available in this environment
}

export function useNotifications() {
  const notificationConfig = useAppStore((state) => state.notificationConfig);
  const setNotificationConfigInStore = useAppStore(
    (state) => state.setNotificationConfig
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      return await requestNotificationPermission();
    } catch {
      return false;
    }
  }, []);

  const updateFromConfig = useCallback(
    async (config: NotificationConfig): Promise<void> => {
      try {
        setNotificationConfigInStore(config);
        void useAppStore.getState().persistAll?.();
        await scheduleNotificationsFromConfig(config);
      } catch {
        // Notification scheduling failed silently
      }
    },
    [setNotificationConfigInStore]
  );

  const refreshWaterReminders = useCallback(async (): Promise<void> => {
    try {
      const config = useAppStore.getState().notificationConfig;
      await scheduleNotificationsFromConfig(config);
    } catch {
      // Refresh failed silently
    }
  }, []);

  const cancelAll = useCallback(async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Cancel failed silently
    }
  }, []);

  return {
    requestPermission,
    cancelAll,
    updateFromConfig,
    refreshWaterReminders,
    currentConfig: notificationConfig,
  };
}
