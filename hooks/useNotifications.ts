import * as Notifications from "expo-notifications";
import { useCallback } from "react";

import { useAppStore } from "../store/useAppStore";
import type { NotificationConfig } from "../types";
import {
  requestNotificationPermission,
  scheduleNotificationsFromConfig,
} from "../utils/notificationScheduler";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const notificationConfig = useAppStore((state) => state.notificationConfig);
  const setNotificationConfigInStore = useAppStore(
    (state) => state.setNotificationConfig
  );

  const requestPermission = useCallback(
    () => requestNotificationPermission(),
    []
  );

  const updateFromConfig = useCallback(
    async (config: NotificationConfig): Promise<void> => {
      setNotificationConfigInStore(config);
      void useAppStore.getState().persistAll?.();
      await scheduleNotificationsFromConfig(config);
    },
    [setNotificationConfigInStore]
  );

  const refreshWaterReminders = useCallback(async (): Promise<void> => {
    const config = useAppStore.getState().notificationConfig;
    await scheduleNotificationsFromConfig(config);
  }, []);

  const cancelAll = useCallback(async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  return {
    requestPermission,
    cancelAll,
    updateFromConfig,
    refreshWaterReminders,
    currentConfig: notificationConfig,
  };
}
