// Web stub — expo-notifications is not supported on web.
// Metro resolves this file instead of useNotifications.ts on web platform.

import { useCallback } from "react";

import { useAppStore } from "../store/useAppStore";
import type { NotificationConfig } from "../types";

export function useNotifications() {
  const notificationConfig = useAppStore((state) => state.notificationConfig);
  const setNotificationConfigInStore = useAppStore(
    (state) => state.setNotificationConfig
  );

  const requestPermission = useCallback(async () => false, []);

  const updateFromConfig = useCallback(
    async (config: NotificationConfig): Promise<void> => {
      setNotificationConfigInStore(config);
    },
    [setNotificationConfigInStore]
  );

  const refreshWaterReminders = useCallback(async (): Promise<void> => {}, []);

  const cancelAll = useCallback(async (): Promise<void> => {}, []);

  return {
    requestPermission,
    cancelAll,
    updateFromConfig,
    refreshWaterReminders,
    currentConfig: notificationConfig,
  };
}
