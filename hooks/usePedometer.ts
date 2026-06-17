import {
  getPermissionsAsync,
  getTodayStepCountAsync,
  isAvailableAsync,
  requestPermissionsAsync,
} from "expo-pedometer";
import { PermissionStatus } from "expo-pedometer/build/ExpoPedometer.types";
import { useCallback, useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useAppStore } from "../store/useAppStore";

const DEFAULT_GOAL = 10_000;

export function usePedometer() {
  const stepLog = useAppStore((state) => state.stepLog);
  const updateSteps = useAppStore((state) => state.updateSteps);

  const [isAvailable, setIsAvailable] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const steps = stepLog?.steps ?? 0;
  const goalSteps = stepLog?.goalSteps ?? DEFAULT_GOAL;
  const percentage = goalSteps > 0 ? Math.min(100, (steps / goalSteps) * 100) : 0;

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    const available = await isAvailableAsync();
    setIsAvailable(available);

    if (!available) {
      setPermissionGranted(false);
      return false;
    }

    let permission = await getPermissionsAsync();

    if (permission.status !== PermissionStatus.GRANTED) {
      permission = await requestPermissionsAsync();
    }

    const granted = permission.status === PermissionStatus.GRANTED;
    setPermissionGranted(granted);
    return granted;
  }, []);

  const syncSteps = useCallback(async () => {
    setIsSyncing(true);
    try {
      const granted = await ensurePermission();
      if (!granted) return;

      const todaySteps = await getTodayStepCountAsync();
      updateSteps(Math.max(0, todaySteps));
    } catch {
      // step sync failed silently — keep last known value
    } finally {
      setIsSyncing(false);
    }
  }, [ensurePermission, updateSteps]);

  useEffect(() => {
    void ensurePermission();
  }, [ensurePermission]);

  useEffect(() => {
    void syncSteps();

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === "active") {
        void syncSteps();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [syncSteps]);

  return {
    steps,
    goalSteps,
    percentage,
    isAvailable,
    permissionGranted,
    isSyncing,
    syncSteps,
    requestPermission: ensurePermission,
  };
}
